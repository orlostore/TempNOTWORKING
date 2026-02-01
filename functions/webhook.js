// Cloudflare Pages Function - Stripe Webhook
// Deducts inventory after successful payment + sends receipt

export async function onRequestPost(context) {
    const { request, env } = context;
    
    const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
    const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;
    const DB = env.DB;
    
    if (!STRIPE_SECRET_KEY) {
        return new Response('Stripe not configured', { status: 500 });
    }

    try {
        const payload = await request.text();
        const signature = request.headers.get('stripe-signature');
        
        // Verify webhook signature (if secret is set)
        if (STRIPE_WEBHOOK_SECRET && signature) {
            const verified = await verifyStripeSignature(payload, signature, STRIPE_WEBHOOK_SECRET);
            if (!verified) {
                return new Response('Invalid signature', { status: 400 });
            }
        }
        
        const event = JSON.parse(payload);
        
        // Handle the checkout.session.completed event
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            
            // === DEDUCT INVENTORY ===
            if (session.metadata && session.metadata.cart_items) {
                try {
                    const cartItems = JSON.parse(session.metadata.cart_items);
                    
                    for (const item of cartItems) {
                        await DB.prepare(
                            'UPDATE products SET quantity = MAX(0, quantity - ?) WHERE slug = ?'
                        ).bind(item.quantity, item.slug).run();
                        
                        console.log(`Deducted ${item.quantity} from ${item.slug}`);
                    }
                } catch (e) {
                    console.error('Error deducting inventory:', e);
                }
            }
            
            // === SEND RECEIPT EMAIL ===
            const customerEmail = session.customer_details?.email || session.customer_email;
            const paymentIntentId = session.payment_intent;
            
            if (customerEmail && paymentIntentId) {
                const piResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                    }
                });
                const paymentIntent = await piResponse.json();
                
                const chargeId = paymentIntent.latest_charge;
                
                if (chargeId) {
                    await fetch(`https://api.stripe.com/v1/charges/${chargeId}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: `receipt_email=${encodeURIComponent(customerEmail)}`
                    });
                    
                    console.log(`Receipt sent to: ${customerEmail}`);
                }
            }
        }
        
        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Webhook Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function verifyStripeSignature(payload, signature, secret) {
    try {
        const parts = signature.split(',').reduce((acc, part) => {
            const [key, value] = part.split('=');
            acc[key] = value;
            return acc;
        }, {});
        
        const timestamp = parts['t'];
        const expectedSig = parts['v1'];
        
        if (!timestamp || !expectedSig) return false;
        
        const signedPayload = `${timestamp}.${payload}`;
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        const signatureBuffer = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(signedPayload)
        );
        
        const computedSig = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        return computedSig === expectedSig;
    } catch (e) {
        console.error('Signature verification error:', e);
        return false;
    }
}
