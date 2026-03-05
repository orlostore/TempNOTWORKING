// Cloudflare Pages Function - Cancel Order API
// Location: /functions/api/auth/cancel-order.js
// Policy: Cancel within 30 minutes of order AND only if not yet shipped

import { customerEmail, plainText, sendEmail } from '../email-template.js';

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
        let emailSent = false;
        let emailError = null;

        if (env.RESEND_API_KEY && customer.email) {
            try {
                const origin = env.SITE_URL || new URL(request.url).origin;
                const customerName = session.customer_details?.name || '';

                const html = customerEmail({
                    origin,
                    icon: '❌',
                    titleEn: 'Order Cancelled',
                    bodyEn: `Hi ${customerName || 'there'}, your order has been cancelled as requested.`,
                    bodyAr: 'مرحباً، تم إلغاء طلبك بناءً على طلبك.',
                    infoBoxEn: `<strong>Refund:</strong> A full refund of AED ${(session.amount_total / 100).toFixed(2)} has been initiated. It will appear on your card within 5-7 business days.`,
                    infoBoxAr: `تم بدء استرداد مبلغ AED ${(session.amount_total / 100).toFixed(2)} كاملاً. سيظهر في حسابك خلال ٥-٧ أيام عمل.`,
                    preheader: 'Your order has been cancelled and a full refund has been initiated.',
                });

                const text = plainText({
                    titleEn: 'Order Cancelled',
                    bodyTextEn: `Hi ${customerName || 'there'}, your order has been cancelled as requested.`,
                    bodyTextAr: 'مرحباً، تم إلغاء طلبك بناءً على طلبك.',
                    infoTextEn: `Refund: A full refund of AED ${(session.amount_total / 100).toFixed(2)} has been initiated. It will appear on your card within 5-7 business days.`,
                    infoTextAr: `تم بدء استرداد مبلغ AED ${(session.amount_total / 100).toFixed(2)} كاملاً. سيظهر في حسابك خلال ٥-٧ أيام عمل.`,
                });

                const result = await sendEmail({
                    apiKey: env.RESEND_API_KEY,
                    to: customer.email,
                    subject: 'Order Cancelled & Refund Initiated | تم إلغاء الطلب وبدء الاسترداد',
                    html,
                    text,
                });

                emailSent = result.success;
                if (!result.success) {
                    emailError = result.error;
                    console.error('Cancellation email failed:', result.error, '| to:', customer.email, '| order:', orderId);
                }
            } catch (emailErr) {
                emailError = emailErr.message;
                console.error('Cancellation email error:', emailErr, '| to:', customer.email, '| order:', orderId);
            }
        } else {
            console.error('Cancellation email skipped: RESEND_API_KEY=' + (env.RESEND_API_KEY ? 'set' : 'MISSING') + ', customer.email=' + (customer.email || 'MISSING') + ' | order:', orderId);
        }

        return Response.json({
            success: true,
            email_sent: emailSent,
            email_error: emailError,
            message: 'Order cancelled and refund of AED ' + (session.amount_total / 100).toFixed(2) + ' initiated. It will appear on your card within 5-7 business days.'
        });

    } catch (error) {
        console.error('Cancel order error:', error.message || error, error.stack || '');
        return Response.json({ error: 'Failed to cancel order: ' + (error.message || 'Unknown error') }, { status: 500 });
    }
}
