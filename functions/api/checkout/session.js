// Cloudflare Pages Function - Get Checkout Session Details
// Location: /functions/api/checkout/session.js
// Used by success.html to get customer info for quick account creation

export async function onRequestGet(context) {
    const { env, request } = context;
    
    try {
        const url = new URL(request.url);
        const sessionId = url.searchParams.get('session_id');
        
        if (!sessionId) {
            return Response.json({ error: 'Session ID required' }, { status: 400 });
        }
        
        const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
        
        if (!STRIPE_SECRET_KEY) {
            return Response.json({ error: 'Stripe not configured' }, { status: 500 });
        }
        
        // Fetch session from Stripe (expand line_items for GA4 tracking)
        const stripeResponse = await fetch(
            `https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=line_items`,
            {
                headers: {
                    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                }
            }
        );

        const session = await stripeResponse.json();

        if (session.error) {
            return Response.json({ error: 'Session not found' }, { status: 404 });
        }

        // Build line items for GA4 e-commerce tracking
        const items = (session.line_items?.data || []).map((item, index) => ({
            item_id: item.price?.product || `item_${index}`,
            item_name: item.description || '',
            price: (item.amount_total || 0) / 100 / (item.quantity || 1),
            quantity: item.quantity || 1
        }));

        // Return customer details + order data for GA4 (don't expose sensitive data)
        return Response.json({
            success: true,
            customer: {
                name: session.customer_details?.name || '',
                email: session.customer_details?.email || '',
                phone: session.customer_details?.phone || ''
            },
            order: {
                amount_total: (session.amount_total || 0) / 100,
                currency: session.currency?.toUpperCase() || 'AED',
                items: items
            }
        });
        
    } catch (error) {
        console.error('Session fetch error:', error);
        return Response.json({ error: 'Failed to fetch session' }, { status: 500 });
    }
}
