// Cloudflare Pages Function - Cancel Order API
// Location: /functions/api/auth/cancel-order.js
// Policy: Cancel within 30 minutes of order AND only if not yet shipped

export async function onRequestPost(context) {
    const { env, request } = context;
    const DB = env.DB;
    const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;

    try {
        // Authenticate customer
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const customer = await DB.prepare('SELECT id, email, token_created_at FROM customers WHERE token = ?')
            .bind(token)
            .first();

        if (!customer) {
            return Response.json({ error: 'Invalid token' }, { status: 401 });
        }
        if (customer.token_created_at && (Date.now() - new Date(customer.token_created_at).getTime() > 30 * 24 * 60 * 60 * 1000)) {
            return Response.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return Response.json({ error: 'Order ID is required' }, { status: 400 });
        }

        // Fetch the checkout session from Stripe
        const sessionRes = await fetch(
            `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(orderId)}?expand[]=line_items`,
            { headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` } }
        );
        const session = await sessionRes.json();

        if (session.error) {
            return Response.json({ error: 'Order not found' }, { status: 404 });
        }

        // Verify this order belongs to the customer
        const sessionEmail = (session.customer_details?.email || session.customer_email || '').toLowerCase();
        if (sessionEmail !== customer.email.toLowerCase()) {
            return Response.json({ error: 'Order not found' }, { status: 404 });
        }

        // Check if already cancelled (ensure table + column exist)
        await DB.prepare(`CREATE TABLE IF NOT EXISTS cancelled_orders (
            order_id TEXT PRIMARY KEY,
            cancelled_at TEXT DEFAULT (datetime('now')),
            customer_id INTEGER
        )`).run();
        // Add customer_id column if table was created by an older schema
        try { await DB.prepare('ALTER TABLE cancelled_orders ADD COLUMN customer_id INTEGER').run(); } catch(e) { /* already exists */ }

        const alreadyCancelled = await DB.prepare('SELECT order_id FROM cancelled_orders WHERE order_id = ?')
            .bind(orderId).first();
        if (alreadyCancelled) {
            return Response.json({ error: 'This order has already been cancelled' }, { status: 400 });
        }

        // Check if shipped (table may not exist yet if no orders have been shipped)
        let shipped = null;
        try {
            shipped = await DB.prepare('SELECT order_id FROM shipped_orders WHERE order_id = ?')
                .bind(orderId).first();
        } catch (e) {
            // Table doesn't exist yet — means nothing has been shipped
        }
        if (shipped || session.metadata?.shipped === 'true') {
            return Response.json({ error: 'Cannot cancel — order has already been shipped. Please contact support.' }, { status: 400 });
        }

        // Check 30-minute window
        const orderCreatedMs = session.created * 1000;
        const nowMs = Date.now();
        const thirtyMinMs = 30 * 60 * 1000;

        if (nowMs - orderCreatedMs > thirtyMinMs) {
            return Response.json({ error: 'Cancellation window has expired (30 minutes). Please contact support.' }, { status: 400 });
        }

        // Issue Stripe refund via Payment Intent
        const paymentIntentId = session.payment_intent;
        if (!paymentIntentId) {
            return Response.json({ error: 'Unable to process refund for this order' }, { status: 400 });
        }

        // Check payment intent status first to determine correct action
        const piRes = await fetch(
            `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`,
            { headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` } }
        );
        const pi = await piRes.json();

        if (pi.error) {
            console.error('Stripe PI fetch error:', pi.error);
            return Response.json({ error: 'Unable to retrieve payment details. Please try again.' }, { status: 500 });
        }

        // Handle based on payment intent status
        if (pi.status === 'canceled') {
            // Already canceled — just record it, skip Stripe action
        } else if (pi.status === 'requires_capture') {
            // Payment authorized but not captured — cancel the intent instead of refunding
            const cancelRes = await fetch(
                `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}/cancel`,
                {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` }
                }
            );
            const cancelResult = await cancelRes.json();
            if (cancelResult.error) {
                console.error('Stripe cancel PI error:', cancelResult.error);
                return Response.json({ error: 'Cancellation failed. Please contact support at info@orlostore.com' }, { status: 500 });
            }
        } else if (pi.status === 'succeeded') {
            // Payment captured — issue a refund
            const refundRes = await fetch('https://api.stripe.com/v1/refunds', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `payment_intent=${encodeURIComponent(paymentIntentId)}`
            });
            const refund = await refundRes.json();

            if (refund.error) {
                console.error('Stripe refund error:', refund.error);
                // Handle already-refunded gracefully
                if (refund.error.code === 'charge_already_refunded') {
                    // Already refunded — just record the cancellation below
                } else {
                    return Response.json({ error: 'Refund failed (' + (refund.error.code || 'unknown') + '). Please contact support at info@orlostore.com' }, { status: 500 });
                }
            }
        } else {
            // Payment still processing or in unexpected state
            console.error('Unexpected PI status for cancel:', pi.status);
            return Response.json({ error: 'Payment is still processing. Please wait a few minutes and try again.' }, { status: 400 });
        }

        // Restore inventory
        if (session.metadata?.cart_items) {
            try {
                const cartItems = JSON.parse(session.metadata.cart_items);
                for (const item of cartItems) {
                    if (item.variantId) {
                        await DB.prepare('UPDATE product_variants SET quantity = quantity + ? WHERE id = ?')
                            .bind(item.quantity, item.variantId).run();
                    } else {
                        await DB.prepare('UPDATE products SET quantity = quantity + ? WHERE slug = ?')
                            .bind(item.quantity, item.slug).run();
                    }
                }
            } catch (e) {
                console.error('Error restoring inventory:', e);
            }
        }

        // Record cancellation
        await DB.prepare('INSERT INTO cancelled_orders (order_id, customer_id) VALUES (?, ?)')
            .bind(orderId, customer.id).run();

        // Send cancellation confirmation email
        if (env.RESEND_API_KEY && customer.email) {
            try {
                const customerName = session.customer_details?.name || '';
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'ORLO Store <noreply@orlostore.com>',
                        to: customer.email,
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
                                            Hi ${customerName || 'there'}, your order has been cancelled as requested.
                                        </p>
                                        <p style="color: #888; font-size: 14px; font-family: 'Almarai', Arial, sans-serif; direction: rtl; margin: 0 0 25px;">
                                            مرحباً، تم إلغاء طلبك بناءً على طلبك.
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
            } catch (emailErr) {
                console.error('Cancellation email error:', emailErr);
            }
        }

        return Response.json({
            success: true,
            message: 'Order cancelled and refund initiated. It will appear on your card within 5-7 business days.'
        });

    } catch (error) {
        console.error('Cancel order error:', error.message || error, error.stack || '');
        return Response.json({ error: 'Failed to cancel order: ' + (error.message || 'Unknown error') }, { status: 500 });
    }
}
