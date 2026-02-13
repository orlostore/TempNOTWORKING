// Cloudflare Pages Function - Check if session email is already registered
// Location: /functions/api/auth/check-session-email.js

export async function onRequestPost(context) {
    const { env, request } = context;
    const DB = env.DB;

    try {
        const { session_id } = await request.json();

        if (!session_id) {
            return Response.json({ registered: false }, { status: 200 });
        }

        // 1. Retrieve email from Stripe checkout session
        const sessionRes = await fetch(
            `https://api.stripe.com/v1/checkout/sessions/${session_id}?expand[]=customer_details`,
            {
                headers: {
                    'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`
                }
            }
        );

        if (!sessionRes.ok) {
            return Response.json({ registered: false }, { status: 200 });
        }

        const session = await sessionRes.json();
        const email = session.customer_details?.email?.toLowerCase();

        if (!email) {
            return Response.json({ registered: false }, { status: 200 });
        }

        // 2. Check D1 for existing customer
        const existing = await DB.prepare('SELECT id FROM customers WHERE email = ?').bind(email).first();

        return Response.json({ registered: !!existing }, { status: 200 });

    } catch (error) {
        console.error('Check session email error:', error);
        return Response.json({ registered: false }, { status: 200 });
    }
}
