// Cloudflare Pages Function - Mark Order as Shipped + Send Email via Resend
// Location: /functions/api/admin/ship-order.js

import { getKey, getAdminUser, logActivity } from './_helpers.js';

export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const key = getKey(request);
        const user = await getAdminUser(env, key);

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { order_id, customer_email, customer_name, items } = await request.json();

        if (!order_id || !customer_email || customer_email === 'N/A') {
            return Response.json({ error: 'Missing order_id or customer_email' }, { status: 400 });
        }

        // 1. Save shipped status to D1
        if (env.DB) {
            try {
                await env.DB.prepare(`
                    INSERT OR REPLACE INTO shipped_orders (order_id, shipped_at)
                    VALUES (?, datetime('now'))
                `).bind(order_id).run();
            } catch (dbError) {
                console.error('D1 save failed (non-blocking):', dbError);
            }
        }

        // 2. Update Stripe PaymentIntent metadata
        if (env.STRIPE_SECRET_KEY) {
            try {
                const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${order_id}`, {
                    headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}` }
                });
                const sessionData = await sessionRes.json();
                const paymentIntentId = sessionData.payment_intent;

                if (paymentIntentId) {
                    await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: 'metadata[shipped]=true&metadata[shipped_date]=' + encodeURIComponent(new Date().toISOString())
                    });
                }
            } catch (stripeError) {
                console.error('Stripe PaymentIntent metadata update failed (non-blocking):', stripeError);
            }
        }

        // 3. Send shipping email via Resend
        let emailSent = false;
        let emailError = null;

        if (env.RESEND_API_KEY) {
            const itemsList = (items || [])
                .filter(i => !i.name.toLowerCase().includes('delivery'))
                .map(i => {
                    const name = (i.name || 'Item').split(/[\n\r]/)[0].trim();
                    const parts = name.split(' — ');
                    const productName = parts[0] || name;
                    const variant = parts[1] || '';
                    return `<tr><td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">${productName}${variant ? `<br><span style="font-size:12px;color:#888;">${variant}</span>` : ''}</td><td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#666;text-align:center;white-space:nowrap;">× ${i.quantity}</td></tr>`;
                })
                .join('');

            const emailResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'ORLO Store <noreply@orlostore.com>',
                    to: customer_email,
                    subject: 'Your Order Has Been Dispatched! | تم شحن طلبك',
                    html: `
                        <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #f0f2f5; padding: 40px 20px; -webkit-text-size-adjust: 100%;">
                            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
                                <div style="background: linear-gradient(135deg, #2c4a5c 0%, #1e3545 100%); padding: 35px 30px; text-align: center;">
                                    <img src="https://www.orlostore.com/logo.png" alt="ORLO Store" style="width: 65px; height: 65px; margin-bottom: 10px;">
                                    <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; letter-spacing: 1.5px;">ORLO STORE</div>
                                </div>
                                <div style="padding: 35px 30px;">
                                    <div style="text-align: center; margin-bottom: 20px;">
                                        <div style="font-size: 48px; line-height: 1;">🚚</div>
                                    </div>
                                    <h2 style="color: #2c4a5c; margin: 0 0 12px; font-size: 20px; font-weight: 700; text-align: center;">Your Order Has Been Dispatched!</h2>
                                    <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 6px; text-align: center;">
                                        Hi ${customer_name || 'there'}, great news! Your order has been dispatched and is heading your way.
                                    </p>
                                    <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 0 0 25px; font-family: 'Almarai', Arial, sans-serif; direction: rtl; text-align: center;">
                                        مرحباً، تم شحن طلبك وهو في الطريق إليك!
                                    </p>

                                    ${itemsList ? `
                                    <div style="background: #f8f9fa; border-radius: 10px; overflow: hidden; margin-bottom: 25px;">
                                        <div style="padding: 12px 16px; background: #eef2f5; font-size: 11px; font-weight: 700; color: #777; text-transform: uppercase; letter-spacing: 0.5px;">Order Items | عناصر الطلب</div>
                                        <table style="width: 100%; border-collapse: collapse;">
                                            ${itemsList}
                                        </table>
                                    </div>
                                    ` : ''}

                                    <div style="background: #f0f7ff; border-radius: 10px; padding: 18px 20px; margin-bottom: 25px; border-left: 3px solid #2c4a5c;">
                                        <p style="margin: 0; font-size: 14px; color: #555;">
                                            <strong>Estimated Delivery:</strong> 2-5 business days across UAE
                                        </p>
                                        <p style="margin: 6px 0 0; font-size: 13px; color: #888; font-family: 'Almarai', Arial, sans-serif; direction: rtl;">
                                            التوصيل المتوقع: ٢-٥ أيام عمل
                                        </p>
                                    </div>

                                    <div style="text-align: center; margin-bottom: 10px;">
                                        <a href="https://www.orlostore.com/account.html" style="background: #2c4a5c; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
                                            View My Orders | عرض طلباتي
                                        </a>
                                    </div>

                                    <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 20px 0 0; text-align: center;">
                                        Questions? Reply to this email or contact us at <a href="mailto:info@orlostore.com" style="color: #e07856;">info@orlostore.com</a>
                                    </p>
                                </div>
                                <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
                                    <p style="color: #aaa; font-size: 11px; margin: 0;">
                                        © ORLO Store | info@orlostore.com
                                    </p>
                                </div>
                            </div>
                        </div>
                    `
                })
            });

            const emailResult = await emailResponse.json();

            if (emailResponse.ok && emailResult.id) {
                emailSent = true;
            } else {
                emailError = emailResult.message || emailResult.error || 'Unknown Resend error';
                console.error('Resend error:', emailError);
            }
        } else {
            emailError = 'RESEND_API_KEY not configured';
        }

        // 4. Log activity
        await logActivity(env, user.name, 'ship_order', order_id, `Shipped to ${customer_email}`);

        return Response.json({
            success: true,
            email_sent: emailSent,
            email_error: emailError
        });

    } catch (error) {
        console.error('Ship order error:', error);
        return Response.json({ error: 'Failed to process: ' + error.message }, { status: 500 });
    }
}
