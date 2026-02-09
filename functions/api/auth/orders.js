// Cloudflare Pages Function - Customer Orders API
// Location: /functions/api/auth/orders.js

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
        const customer = await DB.prepare('SELECT id, email FROM customers WHERE token = ?')
            .bind(token)
            .first();
        
        if (!customer) {
            return Response.json({ error: 'Invalid token' }, { status: 401 });
        }
        
        // Fetch orders from Stripe by customer email
        const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
        
        if (!STRIPE_SECRET_KEY) {
            return Response.json({ error: 'Stripe not configured' }, { status: 500 });
        }
        
        // Get checkout sessions for this customer
        const stripeResponse = await fetch(
            `https://api.stripe.com/v1/checkout/sessions?customer_details[email]=${encodeURIComponent(customer.email)}&limit=50&expand[]=data.line_items`,
            {
                headers: {
                    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                }
            }
        );
        
        const stripeData = await stripeResponse.json();
        
        if (stripeData.error) {
            console.error('Stripe error:', stripeData.error);
            return Response.json({ error: 'Failed to fetch orders' }, { status: 500 });
        }
        
        // Filter to only completed payments
        const completedSessions = (stripeData.data || []).filter(
            session => session.payment_status === 'paid'
        );
        
        // Format orders
        const orders = completedSessions.map(session => {
            const items = session.line_items?.data?.map(item => ({
                name: item.description,
                quantity: item.quantity,
                amount: item.amount_total
            })) || [];
            
            return {
                id: session.id,
                created: session.created,
                amount_total: session.amount_total,
                currency: session.currency,
                status: session.metadata?.shipped === 'true' ? 'shipped' : 'pending',
                items: items
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
