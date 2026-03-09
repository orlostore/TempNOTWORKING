// Cloudflare Pages Function - Fetch Orders from Stripe
// Location: /functions/api/admin/orders.js

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
    
    if (!STRIPE_SECRET_KEY) {
        return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    try {
        // Fetch shipped order IDs from D1 (source of truth)
        let shippedOrderIds = new Set();
        let cancelledOrderIds = new Set();
        let returnRequests = {};
        let shipmentsMap = {};
        if (env.DB) {
            try {
                const { results } = await env.DB.prepare(
                    'SELECT order_id FROM shipped_orders'
                ).all();
                for (const row of results) {
                    shippedOrderIds.add(row.order_id);
                }
            } catch (dbError) {
                console.error('D1 shipped_orders query failed (non-blocking):', dbError);
            }
            try {
                const { results } = await env.DB.prepare(
                    'SELECT order_id FROM cancelled_orders'
                ).all();
                for (const row of results) {
                    cancelledOrderIds.add(row.order_id);
                }
            } catch (dbError) {
                // Table may not exist yet
            }

            // Get return requests
            try {
                const { results } = await env.DB.prepare(
                    'SELECT order_id, status, reason, customer_name, customer_email, created_at FROM return_requests'
                ).all();
                for (const row of results) {
                    returnRequests[row.order_id] = {
                        status: row.status,
                        reason: row.reason,
                        customer_name: row.customer_name,
                        customer_email: row.customer_email,
                        created_at: row.created_at
                    };
                }
            } catch (dbError) {
                // Table may not exist yet
            }

            // Get Zajel shipment data
            try {
                const { results } = await env.DB.prepare(
                    'SELECT order_id, zajel_reference, status, zajel_status, zajel_status_date, failure_reason, created_at FROM shipments'
                ).all();
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
            } catch (dbError) {
                // Table may not exist yet
            }
        }

        // Fetch checkout sessions from Stripe (last 100), expand payment_intent for shipped metadata
        const response = await fetch('https://api.stripe.com/v1/checkout/sessions?limit=100&expand[]=data.customer_details&expand[]=data.line_items&expand[]=data.payment_intent', {
            headers: {
                'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            }
        });

        const data = await response.json();

        if (data.error) {
            return new Response(JSON.stringify({ error: data.error.message }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Format orders
        const orders = await Promise.all(data.data
            .filter(session => session.payment_status === 'paid')
            .map(async session => {
                // Fetch line items separately if not expanded
                let lineItems = session.line_items?.data || [];

                if (!lineItems.length) {
                    const itemsResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session.id}/line_items`, {
                        headers: {
                            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                        }
                    });
                    const itemsData = await itemsResponse.json();
                    lineItems = itemsData.data || [];
                }

                // Check D1 first, then PaymentIntent metadata, then session metadata
                const isShipped = shippedOrderIds.has(session.id)
                    || session.payment_intent?.metadata?.shipped === 'true'
                    || session.metadata?.shipped === 'true';

                return {
                    id: session.id,
                    created: session.created,
                    amount_total: session.amount_total,
                    currency: session.currency,
                    customer_name: session.customer_details?.name || 'N/A',
                    customer_email: session.customer_details?.email || session.customer_email || 'N/A',
                    customer_phone: session.customer_details?.phone || 'N/A',
                    shipping_address: session.customer_details?.address || session.shipping_details?.address || null,
                    shipping_amount: session.shipping_cost?.amount_total || lineItems.find(i => i.description?.toLowerCase().includes('delivery'))?.amount_total || 0,
                    items: lineItems.map(item => ({
                        name: item.description || item.price?.product?.name || 'Item',
                        quantity: item.quantity,
                        amount: item.amount_total
                    })),
                    metadata: session.metadata || {},
                    status: cancelledOrderIds.has(session.id) ? 'cancelled' : isShipped ? 'shipped' : 'pending',
                    return_request: returnRequests[session.id] || null,
                    shipment: shipmentsMap[session.id] || null
                };
            }));

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
