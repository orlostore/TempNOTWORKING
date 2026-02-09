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
        
        // Fetch session from Stripe
        const stripeResponse = await fetch(
            `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
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
        
        // Return only customer details (don't expose sensitive data)
        return Response.json({
            success: true,
            customer: {
                name: session.customer_details?.name || '',
                email: session.customer_details?.email || '',
                phone: session.customer_details?.phone || ''
            }
        });
        
    } catch (error) {
        console.error('Session fetch error:', error);
        return Response.json({ error: 'Failed to fetch session' }, { status: 500 });
    }
}
