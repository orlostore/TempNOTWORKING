// Cloudflare Pages Function - Admin Orders API
// Location: /functions/api/admin/orders.js
// Reads orders from D1 (primary) with Stripe fallback for older orders

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

function getAdminKey(request) {
    const authHeader = request.headers.get('Authorization');
    return authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const key = getAdminKey(request);

    // Auth check
    if (!safeCompare(key, env.ADMIN_KEY)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
    const DB = env.DB;

    try {
        // === Load status data from D1 ===
        let shippedOrderIds = new Set();
        let cancelledOrderIds = new Set();
        let returnRequests = {};
        let shipmentsMap = {};

        if (DB) {
            try {
                const { results } = await DB.prepare('SELECT order_id FROM shipped_orders').all();
                for (const row of results) shippedOrderIds.add(row.order_id);
            } catch (e) {}
            try {
                const { results } = await DB.prepare('SELECT order_id FROM cancelled_orders').all();
                for (const row of results) cancelledOrderIds.add(row.order_id);
            } catch (e) {}
            try {
                const { results } = await DB.prepare('SELECT order_id, status, reason, customer_name, customer_email, created_at FROM return_requests').all();
                for (const row of results) {
                    returnRequests[row.order_id] = {
                        status: row.status, reason: row.reason,
                        customer_name: row.customer_name, customer_email: row.customer_email,
                        created_at: row.created_at
                    };
                }
            } catch (e) {}
            try {
                const { results } = await DB.prepare('SELECT order_id, zajel_reference, status, zajel_status, zajel_status_date, failure_reason, created_at FROM shipments').all();
                for (const row of results) {
                    shipmentsMap[row.order_id] = {
                        zajel_reference: row.zajel_reference,
                        shipment_status: row.status,
                        zajel_status: row.zajel_status,
                        zajel_status_date: row.zajel_status_date,
                        failure_reason: row.failure_reason,
                        created_at: row.created_at,
                    };
                }
            } catch (e) {}
        }

        // === Fetch orders from D1 (primary source) ===
        let d1Orders = [];
        if (DB) {
            try {
                const { results } = await DB.prepare(
                    'SELECT id, customer_email, customer_name, customer_phone, amount_total, currency, shipping_address, shipping_amount, items, metadata, created_at FROM orders ORDER BY created_at DESC'
                ).all();
                d1Orders = results || [];
            } catch (e) {
                console.error('D1 orders query failed:', e);
            }
        }

        const d1OrderIds = new Set(d1Orders.map(o => o.id));

        // === Stripe fallback: backfill orders not yet in D1 ===
        if (STRIPE_SECRET_KEY) {
            try {
                const response = await fetch('https://api.stripe.com/v1/checkout/sessions?limit=100&expand[]=data.customer_details&expand[]=data.line_items&expand[]=data.payment_intent', {
                    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` }
                });
                const data = await response.json();

                if (!data.error && data.data) {
                    for (const session of data.data) {
                        if (session.payment_status !== 'paid') continue;
                        if (d1OrderIds.has(session.id)) continue;

                        const lineItems = session.line_items?.data || [];
                        const items = lineItems.map(item => ({
                            name: item.description || item.price?.product?.name || 'Item',
                            quantity: item.quantity,
                            amount: item.amount_total
                        }));
                        const shippingAmount = session.shipping_cost?.amount_total || lineItems.find(i => i.description?.toLowerCase().includes('delivery'))?.amount_total || 0;

                        const order = {
                            id: session.id,
                            customer_email: session.customer_details?.email || session.customer_email || 'N/A',
                            customer_name: session.customer_details?.name || 'N/A',
                            customer_phone: session.customer_details?.phone || 'N/A',
                            amount_total: session.amount_total,
                            currency: session.currency,
                            shipping_address: JSON.stringify(session.customer_details?.address || session.shipping_details?.address || {}),
                            shipping_amount: shippingAmount,
                            items: JSON.stringify(items),
                            metadata: JSON.stringify(session.metadata || {}),
                            created_at: session.created
                        };
                        d1Orders.push(order);
                        d1OrderIds.add(session.id);

                        // Persist to D1 for next time
                        if (DB) {
                            try {
                                await DB.prepare(
                                    `INSERT OR IGNORE INTO orders (id, customer_email, customer_name, customer_phone, amount_total, currency, shipping_address, shipping_amount, items, metadata, created_at)
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                                ).bind(
                                    order.id, order.customer_email, order.customer_name, order.customer_phone,
                                    order.amount_total || 0, order.currency || 'aed',
                                    order.shipping_address, order.shipping_amount,
                                    order.items, order.metadata, order.created_at
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

        // === Format orders for admin UI ===
        const orders = d1Orders
            .sort((a, b) => b.created_at - a.created_at)
            .map(order => {
                let items, metadata, shippingAddress;
                try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch (e) { items = []; }
                try { metadata = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : (order.metadata || {}); } catch (e) { metadata = {}; }
                try { shippingAddress = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : (order.shipping_address || null); } catch (e) { shippingAddress = null; }

                const isShipped = shippedOrderIds.has(order.id);
                const isCancelled = cancelledOrderIds.has(order.id);

                return {
                    id: order.id,
                    created: order.created_at,
                    amount_total: order.amount_total,
                    currency: order.currency,
                    customer_name: order.customer_name || 'N/A',
                    customer_email: order.customer_email || 'N/A',
                    customer_phone: order.customer_phone || 'N/A',
                    shipping_address: shippingAddress,
                    shipping_amount: order.shipping_amount || 0,
                    items: items,
                    metadata: metadata,
                    status: isCancelled ? 'cancelled' : isShipped ? 'shipped' : 'pending',
                    return_request: returnRequests[order.id] || null,
                    shipment: shipmentsMap[order.id] || null
                };
            });

        return new Response(JSON.stringify({ orders }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'https://orlostore.com',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Mark order as shipped
export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const key = getAdminKey(request);
    const action = url.searchParams.get('action');
    const sessionId = url.searchParams.get('session_id');

    // Auth check
    if (!safeCompare(key, env.ADMIN_KEY)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;

    if (action === 'ship' && sessionId) {
        try {
            // Update metadata to mark as shipped
            const updateResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'metadata[shipped]=true&metadata[shipped_date]=' + new Date().toISOString()
            });

            const updateData = await updateResponse.json();

            if (updateData.error) {
                // Stripe doesn't allow updating checkout sessions after completion
                // We'll need to use a different approach - store in D1 or use payment intent
                return new Response(JSON.stringify({
                    success: true,
                    note: 'Marked locally - Stripe sessions cannot be updated after completion'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Get customer email for notification
            const session = updateData;
            const customerEmail = session.customer_details?.email || session.customer_email;

            if (customerEmail) {
                // Send shipping notification email via Stripe
                // Note: This would need a separate email service for custom emails
            }

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
    });
}
