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

        // Check if already cancelled
        await DB.prepare(`CREATE TABLE IF NOT EXISTS cancelled_orders (
            order_id TEXT PRIMARY KEY,
            cancelled_at TEXT DEFAULT (datetime('now')),
            customer_id INTEGER
        )`).run();

        const alreadyCancelled = await DB.prepare('SELECT order_id FROM cancelled_orders WHERE order_id = ?')
            .bind(orderId).first();
        if (alreadyCancelled) {
            return Response.json({ error: 'This order has already been cancelled' }, { status: 400 });
        }

        // Check if shipped
        const shipped = await DB.prepare('SELECT order_id FROM shipped_orders WHERE order_id = ?')
            .bind(orderId).first();
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
            return Response.json({ error: 'Refund failed. Please contact support.' }, { status: 500 });
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

        return Response.json({
            success: true,
            message: 'Order cancelled and refund initiated. It will appear on your card within 5-7 business days.'
        });

    } catch (error) {
        console.error('Cancel order error:', error);
        return Response.json({ error: 'Failed to cancel order' }, { status: 500 });
    }
}
