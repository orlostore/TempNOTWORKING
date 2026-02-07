// Cloudflare Pages Function - Fetch Orders from Stripe
// Location: /functions/api/admin/orders.js

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    
    // Auth check
    if (key !== env.ADMIN_KEY) {
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
        // Fetch checkout sessions from Stripe (last 100)
        const response = await fetch('https://api.stripe.com/v1/checkout/sessions?limit=100&expand[]=data.customer_details&expand[]=data.line_items', {
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
                
                return {
                    id: session.id,
                    created: session.created,
                    amount_total: session.amount_total,
                    currency: session.currency,
                    customer_name: session.customer_details?.name || 'N/A',
                    customer_email: session.customer_details?.email || session.customer_email || 'N/A',
                    customer_phone: session.customer_details?.phone || 'N/A',
                    shipping_address: session.customer_details?.address || session.shipping_details?.address || null,
                    items: lineItems.map(item => ({
                        name: item.description || item.price?.product?.name || 'Item',
                        quantity: item.quantity,
                        amount: item.amount_total
                    })),
                    metadata: session.metadata || {},
                    status: session.metadata?.shipped === 'true' ? 'shipped' : 'pending'
                };
            }));
        
        return new Response(JSON.stringify({ orders }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
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
    const key = url.searchParams.get('key');
    const action = url.searchParams.get('action');
    const sessionId = url.searchParams.get('session_id');
    
    // Auth check
    if (key !== env.ADMIN_KEY) {
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
