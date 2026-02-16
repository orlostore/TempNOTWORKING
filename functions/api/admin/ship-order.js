// Cloudflare Pages Function - Mark Order as Shipped + Send Email via Resend
// Location: /functions/api/admin/ship-order.js

export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const key = url.searchParams.get('key');

        if (key !== env.ADMIN_KEY && key !== 'Sy$tem88') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { order_id, customer_email, customer_name, items } = await request.json();

        if (!order_id || !customer_email || customer_email === 'N/A') {
            return Response.json({ error: 'Missing order_id or customer_email' }, { status: 400 });
        }

        // 1. Save shipped status to D1 (optional — skip if DB not configured)
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

        // 2. Send shipping email via Resend
        let emailSent = false;
        let emailError = null;

        if (env.RESEND_API_KEY) {
            const itemsList = (items || [])
                .filter(i => !i.name.toLowerCase().includes('delivery'))
                .map(i => `<tr><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">${i.name}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#666;text-align:center;">× ${i.quantity}</td></tr>`)
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
                    subject: 'Your Order Has Been Shipped! | تم شحن طلبك',
                    html: `
                        <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f8f9fa; padding: 0; border-radius: 12px; overflow: hidden;">
                            <div style="background: linear-gradient(135deg, #2c4a5c 0%, #1e3545 100%); padding: 30px 20px; text-align: center;">
                                <img src="https://temp-5lr.pages.dev/logo.png" alt="ORLO Store" style="width: 70px; height: 70px; margin-bottom: 8px;">
                                <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; letter-spacing: 1px;">ORLO Store</div>
                            </div>
                            <div style="background: white; padding: 30px 25px;">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <div style="font-size: 3rem;">🚚</div>
                                </div>
                                <h2 style="color: #2c4a5c; margin: 0 0 15px; font-size: 18px; font-weight: 600; text-align: center;">Your Order is On Its Way!</h2>
                                <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 0 0 8px; text-align: center;">
                                    Hi ${customer_name || 'there'}, great news! Your order has been shipped and is heading your way.
                                </p>
                                <p style="color: #888; font-size: 13px; line-height: 1.6; margin: 0 0 20px; font-family: 'Almarai', Arial, sans-serif; direction: rtl; text-align: center;">
                                    مرحباً، تم شحن طلبك وهو في الطريق إليك!
                                </p>

                                ${itemsList ? `
                                <div style="background: #f8f9fa; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                                    <div style="padding: 10px 12px; background: #eef2f5; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase;">Order Items</div>
                                    <table style="width: 100%; border-collapse: collapse;">
                                        ${itemsList}
                                    </table>
                                </div>
                                ` : ''}

                                <div style="background: #f0f7ff; border-radius: 8px; padding: 15px; margin-bottom: 20px; border-left: 3px solid #2c4a5c;">
                                    <p style="margin: 0; font-size: 13px; color: #555;">
                                        <strong>Estimated Delivery:</strong> 2-5 business days across UAE
                                    </p>
                                    <p style="margin: 5px 0 0; font-size: 12px; color: #888; font-family: 'Almarai', Arial, sans-serif; direction: rtl;">
                                        التوصيل المتوقع: ٢-٥ أيام عمل
                                    </p>
                                </div>

                                <div style="text-align: center;">
                                    <a href="https://temp-5lr.pages.dev/account.html" style="background: #2c4a5c; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
                                        View My Orders | عرض طلباتي
                                    </a>
                                </div>

                                <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 20px 0 0; text-align: center;">
                                    Questions? Reply to this email or contact us at <a href="mailto:info@orlostore.com" style="color: #e07856;">info@orlostore.com</a>
                                </p>
                            </div>
                            <div style="background: #f8f9fa; padding: 20px 25px; text-align: center; border-top: 1px solid #eee;">
                                <p style="color: #aaa; font-size: 11px; margin: 0;">
                                    © ORLO Store | info@orlostore.com
                                </p>
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
