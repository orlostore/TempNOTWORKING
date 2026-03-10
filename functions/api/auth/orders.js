// Cloudflare Pages Function - Customer Orders API
// Location: /functions/api/auth/orders.js
// Reads orders from D1 (primary) with Stripe fallback for older orders

export async function onRequestGet(context) {
    const { env, request } = context;
    const DB = env.DB;

    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');

        // Find customer by token
        const customer = await DB.prepare('SELECT id, email, token_created_at FROM customers WHERE token = ?')
            .bind(token)
            .first();

        if (!customer) {
            return Response.json({ error: 'Invalid token' }, { status: 401 });
        }
        if (customer.token_created_at && (Date.now() - new Date(customer.token_created_at).getTime() > 30*24*60*60*1000)) {
            return Response.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
        }

        // === Fetch orders from D1 (primary source) ===
        let d1Orders = [];
        try {
            const { results } = await DB.prepare(
                'SELECT id, customer_email, customer_name, amount_total, currency, items, created_at FROM orders WHERE customer_email = ? ORDER BY created_at DESC'
            ).bind(customer.email).all();
            d1Orders = results || [];
        } catch (e) {
            // Table may not exist yet
        }

        // === Stripe fallback for orders not yet in D1 ===
        const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
        const d1OrderIds = new Set(d1Orders.map(o => o.id));

        if (STRIPE_SECRET_KEY) {
            try {
                const stripeResponse = await fetch(
                    `https://api.stripe.com/v1/checkout/sessions?customer_details[email]=${encodeURIComponent(customer.email)}&limit=50&expand[]=data.line_items`,
                    { headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` } }
                );
                const stripeData = await stripeResponse.json();

                if (!stripeData.error && stripeData.data) {
                    for (const session of stripeData.data) {
                        if (session.payment_status === 'paid' && !d1OrderIds.has(session.id)) {
                            // Backfill into D1 for future reliability
                            const items = session.line_items?.data?.map(item => ({
                                name: item.description,
                                quantity: item.quantity,
                                amount: item.amount_total
                            })) || [];

                            const shippingAmount = session.shipping_cost?.amount_total || items.find(i => i.name?.toLowerCase().includes('delivery'))?.amount || 0;

                            d1Orders.push({
                                id: session.id,
                                customer_email: customer.email,
                                customer_name: session.customer_details?.name || '',
                                amount_total: session.amount_total,
                                currency: session.currency,
                                items: JSON.stringify(items),
                                created_at: session.created
                            });

                            // Persist to D1 for next time (full schema)
                            try {
                                await DB.prepare(
                                    `INSERT OR IGNORE INTO orders (id, customer_email, customer_name, customer_phone, amount_total, currency, shipping_address, shipping_amount, items, metadata, created_at)
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                                ).bind(
                                    session.id,
                                    customer.email,
                                    session.customer_details?.name || '',
                                    session.customer_details?.phone || '',
                                    session.amount_total || 0,
                                    session.currency || 'aed',
                                    JSON.stringify(session.customer_details?.address || session.shipping_details?.address || {}),
                                    shippingAmount,
                                    JSON.stringify(items),
                                    JSON.stringify(session.metadata || {}),
                                    session.created
                                ).run();
                            } catch (e) {
                                // Non-blocking
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Stripe fallback error (non-blocking):', e);
            }
        }

        // === Get shipped/cancelled/return status from D1 ===
        let shippedDates = {};
        let cancelledIds = new Set();
        let returnRequests = {};

        try {
            const { results: shippedRows } = await DB.prepare('SELECT order_id, shipped_at FROM shipped_orders').all();
            for (const r of shippedRows) {
                shippedDates[r.order_id] = r.shipped_at;
            }
        } catch (e) {}

        try {
            const { results: cancelledRows } = await DB.prepare('SELECT order_id FROM cancelled_orders').all();
            cancelledIds = new Set(cancelledRows.map(r => r.order_id));
        } catch (e) {}

        try {
            const { results: returnRows } = await DB.prepare('SELECT order_id, status, reason, created_at FROM return_requests').all();
            for (const r of returnRows) {
                returnRequests[r.order_id] = { status: r.status, reason: r.reason, created_at: r.created_at };
            }
        } catch (e) {}

        let trackingNumbers = {};
        try {
            const { results: shipmentRows } = await DB.prepare('SELECT order_id, zajel_reference, zajel_status FROM shipments').all();
            for (const r of shipmentRows) {
                if (r.zajel_reference) {
                    trackingNumbers[r.order_id] = { awb: r.zajel_reference, zajel_status: r.zajel_status };
                }
            }
        } catch (e) {}

        // === Format orders ===
        const orders = d1Orders
            .sort((a, b) => b.created_at - a.created_at)
            .map(order => {
                let items;
                try {
                    items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                } catch (e) {
                    items = [];
                }

                let status = 'pending';
                if (cancelledIds.has(order.id)) {
                    status = 'cancelled';
                } else if (shippedDates[order.id]) {
                    status = 'shipped';
                }

                return {
                    id: order.id,
                    created: order.created_at,
                    amount_total: order.amount_total,
                    currency: order.currency,
                    status: status,
                    items: items,
                    return_request: returnRequests[order.id] || null,
                    shipped_at: shippedDates[order.id] || null,
                    tracking: trackingNumbers[order.id] || null
                };
            });

        return Response.json({
            success: true,
            orders: orders
        });

    } catch (error) {
        console.error('Orders fetch error:', error);
        return Response.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
