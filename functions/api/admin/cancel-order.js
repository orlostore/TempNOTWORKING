// Cloudflare Pages Function - Admin Cancel Order + Stripe Refund + Email
// Location: /functions/api/admin/cancel-order.js

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

        const { order_id, reason, customer_email, customer_name } = await request.json();

        if (!order_id) {
            return Response.json({ error: 'Missing order_id' }, { status: 400 });
        }

        // 1. Get PaymentIntent from Stripe checkout session
        let paymentIntentId = null;
        let refundSuccess = false;

        if (env.STRIPE_SECRET_KEY) {
            try {
                const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${order_id}`, {
                    headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}` }
                });
                const sessionData = await sessionRes.json();
                paymentIntentId = sessionData.payment_intent;

                // Issue full refund
                if (paymentIntentId) {
                    const refundRes = await fetch('https://api.stripe.com/v1/refunds', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: `payment_intent=${paymentIntentId}`
                    });
                    const refundData = await refundRes.json();
                    refundSuccess = refundData.status === 'succeeded' || refundData.status === 'pending';

                    // Update PaymentIntent metadata
                    await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: 'metadata[cancelled]=true&metadata[cancelled_date]=' + encodeURIComponent(new Date().toISOString()) + '&metadata[cancel_reason]=' + encodeURIComponent(reason || 'Admin cancelled')
                    });
                }
            } catch (stripeError) {
                console.error('Stripe refund error:', stripeError);
            }
        }

        // 2. Save to D1
        if (env.DB) {
            try {
                await env.DB.prepare(`
                    CREATE TABLE IF NOT EXISTS cancelled_orders (
                        order_id TEXT PRIMARY KEY,
                        cancelled_at TEXT DEFAULT (datetime('now')),
                        reason TEXT,
                        cancelled_by TEXT DEFAULT 'admin'
                    )
                `).run();

                await env.DB.prepare(`
                    INSERT OR REPLACE INTO cancelled_orders (order_id, cancelled_at, reason, cancelled_by)
                    VALUES (?, datetime('now'), ?, ?)
                `).bind(order_id, reason || 'Admin cancelled', user.name).run();

                // Restore inventory
                try {
                    const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${order_id}/line_items?limit=100`, {
                        headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}` }
                    });
                    const lineItems = await sessionRes.json();

                    for (const item of (lineItems.data || [])) {
                        const name = (item.description || '').split(' — ');
                        const productName = name[0];
                        const variantName = name[1] || null;

                        if (productName && !productName.toLowerCase().includes('delivery')) {
                            await env.DB.prepare(`
                                UPDATE products SET quantity = quantity + ? WHERE name = ?
                            `).bind(item.quantity, productName).run();

                            if (variantName) {
                                await env.DB.prepare(`
                                    UPDATE product_variants SET quantity = quantity + ?
                                    WHERE product_id = (SELECT id FROM products WHERE name = ?) AND name = ?
                                `).bind(item.quantity, productName, variantName).run();
                            }
                        }
                    }
                } catch (invErr) {
                    console.error('Inventory restore error (non-blocking):', invErr);
                }
            } catch (dbError) {
                console.error('D1 cancel save error:', dbError);
            }
        }

        // 3. Send cancellation email
        let emailSent = false;
        let emailError = null;

        if (env.RESEND_API_KEY && customer_email && customer_email !== 'N/A') {
            try {
                const origin = new URL(request.url).origin;

                const html = customerEmail({
                    origin,
                    icon: '❌',
                    titleEn: 'Order Cancelled',
                    bodyEn: `Hi ${customer_name || 'there'}, your order has been cancelled${reason ? ' (' + reason + ')' : ''}.`,
                    bodyAr: `مرحباً، تم إلغاء طلبك${reason ? ' (' + reason + ')' : ''}.`,
                    infoBoxEn: '<strong>Refund:</strong> A full refund has been initiated. It will appear on your card within 5-7 business days.',
                    infoBoxAr: 'تم بدء استرداد المبلغ كاملاً. سيظهر في حسابك خلال ٥-٧ أيام عمل.',
                    preheader: 'Your order has been cancelled and a full refund has been initiated.',
                });

                const text = plainText({
                    titleEn: 'Order Cancelled',
                    bodyTextEn: `Hi ${customer_name || 'there'}, your order has been cancelled${reason ? ' (' + reason + ')' : ''}.`,
                    bodyTextAr: `مرحباً، تم إلغاء طلبك${reason ? ' (' + reason + ')' : ''}.`,
                    infoTextEn: 'Refund: A full refund has been initiated. It will appear on your card within 5-7 business days.',
                    infoTextAr: 'تم بدء استرداد المبلغ كاملاً. سيظهر في حسابك خلال ٥-٧ أيام عمل.',
                });

                const result = await sendEmail({
                    apiKey: env.RESEND_API_KEY,
                    to: customer_email,
                    subject: 'Order Cancelled & Refund Initiated | تم إلغاء الطلب وبدء الاسترداد',
                    html,
                    text,
                });

                emailSent = result.success;
                if (!result.success) emailError = result.error;
            } catch (mailErr) {
                emailError = mailErr.message;
            }
        }

        // 4. Log activity
        await logActivity(env, user.name, 'cancel_order', order_id, `Cancelled: ${reason || 'No reason'} - ${customer_email}`);

        return Response.json({
            success: true,
            refund: refundSuccess,
            email_sent: emailSent,
            email_error: emailError
        });

    } catch (error) {
        console.error('Admin cancel order error:', error);
        return Response.json({ error: 'Failed to cancel: ' + error.message }, { status: 500 });
    }
}
