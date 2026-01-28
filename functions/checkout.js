// Cloudflare Pages Function for Stripe Checkout
// This handles POST requests to /checkout

const deliveryZones = {
    dubai: { name: "Dubai", fee: 18, freeThreshold: 100 },
    sharjah_ajman: { name: "Sharjah / Ajman", fee: 18, freeThreshold: 100 },
    abu_dhabi: { name: "Abu Dhabi", fee: 18, freeThreshold: 100 },
    other: { name: "Other Emirates", fee: 18, freeThreshold: 100 }
};

export async function onRequestPost(context) {
    const { request, env } = context;
    
    // Get Stripe secret key from environment
    const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
    
    if (!STRIPE_SECRET_KEY) {
        return new Response(JSON.stringify({ 
            error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.' 
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    try {
        const body = await request.json();
        const { cart, deliveryZoneKey } = body;

        // Validate cart
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return new Response(JSON.stringify({ error: 'Cart is empty' }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Calculate subtotal
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Get delivery zone and calculate fee
        const zone = deliveryZones[deliveryZoneKey] || deliveryZones.dubai;
        const deliveryFee = subtotal >= zone.freeThreshold ? 0 : zone.fee;

        // Build line items for Stripe
        const lineItems = cart.map(item => ({
            price_data: {
                currency: 'aed',
                product_data: {
                    name: item.name,
                    description: item.description || undefined,
                },
                unit_amount: Math.round(item.price * 100), // Stripe uses fils (cents)
            },
            quantity: item.quantity,
        }));

        // Add delivery fee as a line item if applicable
        if (deliveryFee > 0) {
            lineItems.push({
                price_data: {
                    currency: 'aed',
                    product_data: {
                        name: `Delivery to ${zone.name}`,
                        description: 'Standard delivery (2-5 business days)',
                    },
                    unit_amount: Math.round(deliveryFee * 100),
                },
                quantity: 1,
            });
        }

        // Get the site URL for redirects
        const url = new URL(request.url);
        const siteUrl = `${url.protocol}//${url.host}`;

        // Create Stripe Checkout Session using fetch (Cloudflare Workers don't support npm packages directly)
        const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: buildStripeBody(lineItems, siteUrl, zone, subtotal, deliveryFee)
        });

        const session = await stripeResponse.json();

        if (session.error) {
            console.error('Stripe API Error:', session.error);
            return new Response(JSON.stringify({ 
                error: 'Payment session creation failed',
                message: session.error.message 
            }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Checkout Error:', error);
        return new Response(JSON.stringify({ 
            error: 'Payment processing failed',
            message: error.message 
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}

// Helper function to build URL-encoded body for Stripe API
function buildStripeBody(lineItems, siteUrl, zone, subtotal, deliveryFee) {
    const params = new URLSearchParams();
    
    params.append('mode', 'payment');
    params.append('success_url', `${siteUrl}/success.html`);
    params.append('cancel_url', `${siteUrl}/cancel.html`);
    params.append('billing_address_collection', 'required');
    params.append('shipping_address_collection[allowed_countries][0]', 'AE');
    params.append('phone_number_collection[enabled]', 'true');
    params.append('invoice_creation[enabled]', 'true');
    params.append('invoice_creation[invoice_data][description]', 'ORLO Store Order');
    params.append('invoice_creation[invoice_data][footer]', 'Thank you for shopping with ORLO!');
    params.append('metadata[delivery_zone]', zone.name);
    params.append('metadata[order_subtotal]', subtotal.toFixed(2));
    params.append('metadata[delivery_fee]', deliveryFee.toFixed(2));

    // Add line items
    lineItems.forEach((item, index) => {
        params.append(`line_items[${index}][price_data][currency]`, item.price_data.currency);
        params.append(`line_items[${index}][price_data][product_data][name]`, item.price_data.product_data.name);
        if (item.price_data.product_data.description) {
            params.append(`line_items[${index}][price_data][product_data][description]`, item.price_data.product_data.description);
        }
        params.append(`line_items[${index}][price_data][unit_amount]`, item.price_data.unit_amount);
        params.append(`line_items[${index}][quantity]`, item.quantity);
    });

    return params.toString();
}
