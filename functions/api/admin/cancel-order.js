// Cloudflare Pages Function - Admin Cancel Order + Stripe Refund + Email
// Location: /functions/api/admin/cancel-order.js

function safeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const encoder = new TextEncoder();
    const aBuf = encoder.encode(a);
    const bBuf = encoder.encode(b);
    if (aBuf.length !== bBuf.length) return false;
    let result = 0;
    for (let i = 0; i < aBuf.length; i++) result |= aBuf[i] ^ bBuf[i];
    return result === 0;
}

export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const authHeader = request.headers.get('Authorization');
        const key = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!safeCompare(key, env.ADMIN_KEY)) {
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
                    VALUES (?, datetime('now'), ?, 'admin')
                `).bind(order_id, reason || 'Admin cancelled').run();

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
                            // Restore main product quantity
                            await env.DB.prepare(`
                                UPDATE products SET quantity = quantity + ? WHERE name = ?
                            `).bind(item.quantity, productName).run();

                            // Restore variant quantity if applicable
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
                const emailRes = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'ORLO Store <noreply@orlostore.com>',
                        to: customer_email,
                        subject: 'Order Cancelled & Refund Initiated | تم إلغاء الطلب وبدء الاسترداد',
                        html: `
                            <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #f0f2f5; padding: 40px 20px;">
                                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
                                    <div style="background: linear-gradient(135deg, #2c4a5c 0%, #1e3545 100%); padding: 35px 30px; text-align: center;">
                                        <img src="https://orlostore.com/logo.png" alt="ORLO Store" style="width: 65px; height: 65px; margin-bottom: 10px;">
                                        <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; letter-spacing: 1.5px;">ORLO STORE</div>
                                    </div>
                                    <div style="padding: 35px 30px; text-align: center;">
                                        <div style="font-size: 48px; line-height: 1; margin-bottom: 15px;">❌</div>
                                        <h2 style="color: #2c4a5c; margin: 0 0 12px; font-size: 20px; font-weight: 700;">Order Cancelled</h2>
                                        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 6px;">
                                            Hi ${customer_name || 'there'}, your order has been cancelled${reason ? ' (' + reason + ')' : ''}.
                                        </p>
                                        <p style="color: #888; font-size: 14px; font-family: 'Almarai', Arial, sans-serif; direction: rtl; margin: 0 0 25px;">
                                            مرحباً، تم إلغاء طلبك${reason ? ' (' + reason + ')' : ''}.
                                        </p>

                                        <div style="background: #f0f7ff; border-radius: 10px; padding: 18px 20px; margin-bottom: 25px; border-left: 3px solid #2c4a5c; text-align: left;">
                                            <p style="margin: 0; font-size: 14px; color: #555;">
                                                <strong>Refund:</strong> A full refund has been initiated. It will appear on your card within 5-7 business days.
                                            </p>
                                            <p style="margin: 6px 0 0; font-size: 13px; color: #888; font-family: 'Almarai', Arial, sans-serif; direction: rtl; text-align: right;">
                                                تم بدء استرداد المبلغ كاملاً. سيظهر في حسابك خلال ٥-٧ أيام عمل.
                                            </p>
                                        </div>

                                        <p style="color: #999; font-size: 12px; margin: 20px 0 0;">
                                            Questions? Contact us at <a href="mailto:info@orlostore.com" style="color: #e07856;">info@orlostore.com</a>
                                        </p>
                                    </div>
                                    <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
                                        <p style="color: #aaa; font-size: 11px; margin: 0;">© ORLO Store | info@orlostore.com</p>
                                    </div>
                                </div>
                            </div>
                        `
                    })
                });

                const emailResult = await emailRes.json();
                emailSent = emailRes.ok && emailResult.id;
                if (!emailSent) emailError = emailResult.message || 'Unknown Resend error';
            } catch (mailErr) {
                emailError = mailErr.message;
            }
        }

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
