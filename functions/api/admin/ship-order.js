// Cloudflare Pages Function - Mark Order as Shipped + Send Email via Resend
// Location: /functions/api/admin/ship-order.js

import { getKey, getAdminUser, logActivity } from './_helpers.js';
import { customerEmail, plainText, sendEmail } from '../email-template.js';

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
            const origin = new URL(request.url).origin;

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

            const itemsTableHtml = itemsList ? `
                <div style="background: #f8f9fa; border-radius: 10px; overflow: hidden; margin-bottom: 25px;">
                    <div style="padding: 12px 16px; background: #eef2f5; font-size: 11px; font-weight: 700; color: #777; text-transform: uppercase; letter-spacing: 0.5px;">Order Items | عناصر الطلب</div>
                    <table style="width: 100%; border-collapse: collapse;">${itemsList}</table>
                </div>
            ` : '';

            const html = customerEmail({
                origin,
                icon: '🚚',
                titleEn: 'Your Order Has Been Dispatched!',
                bodyEn: `Hi ${customer_name || 'there'}, great news! Your order has been dispatched and is heading your way.`,
                bodyAr: 'مرحباً، تم شحن طلبك وهو في الطريق إليك!',
                infoBoxEn: '<strong>Estimated Delivery:</strong> 2-5 business days across UAE',
                infoBoxAr: 'التوصيل المتوقع: ٢-٥ أيام عمل',
                ctaUrl: `${origin}/account.html`,
                ctaText: 'View My Orders | عرض طلباتي',
                ctaColor: '#2c4a5c',
                extraHtml: itemsTableHtml,
                preheader: 'Great news! Your ORLO Store order has been dispatched and is on its way.',
            });

            const itemsText = (items || [])
                .filter(i => !i.name.toLowerCase().includes('delivery'))
                .map(i => `- ${(i.name || 'Item').split(/[\n\r]/)[0].trim()} x${i.quantity}`)
                .join('\n');

            const text = plainText({
                titleEn: 'Your Order Has Been Dispatched!',
                bodyTextEn: `Hi ${customer_name || 'there'}, great news! Your order has been dispatched and is heading your way.\n\n${itemsText}`,
                bodyTextAr: 'مرحباً، تم شحن طلبك وهو في الطريق إليك!',
                infoTextEn: 'Estimated Delivery: 2-5 business days across UAE',
                infoTextAr: 'التوصيل المتوقع: ٢-٥ أيام عمل',
                ctaUrl: `${origin}/account.html`,
                ctaText: 'View My Orders',
            });

            const result = await sendEmail({
                apiKey: env.RESEND_API_KEY,
                to: customer_email,
                subject: 'Your Order Has Been Dispatched! | تم شحن طلبك',
                html,
                text,
            });

            emailSent = result.success;
            if (!result.success) {
                emailError = result.error;
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
