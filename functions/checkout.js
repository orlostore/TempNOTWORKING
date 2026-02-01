// Cloudflare Pages Function for Stripe Checkout with Stock Verification

const deliveryZones = {
    dubai: { name: "Dubai", fee: 18, freeThreshold: 75 },
    sharjah_ajman: { name: "Sharjah / Ajman", fee: 18, freeThreshold: 75 },
    abu_dhabi: { name: "Abu Dhabi", fee: 18, freeThreshold: 75 },
    other: { name: "Other Emirates", fee: 18, freeThreshold: 75 }
};

export async function onRequestPost(context) {
    const { request, env } = context;
    
    const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
    const DB = env.DB;
    
    if (!STRIPE_SECRET_KEY) {
        return new Response(JSON.stringify({ 
            error: 'Stripe is not configured.' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    try {
        const body = await request.json();
        const { cart, deliveryZoneKey } = body;

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return new Response(JSON.stringify({ error: 'Cart is empty' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // === STOCK VERIFICATION ===
        const outOfStock = [];
        const insufficientStock = [];
        
        for (const item of cart) {
            const result = await DB.prepare('SELECT quantity, name FROM products WHERE slug = ?')
                .bind(item.slug)
                .first();
            
            if (!result) {
                outOfStock.push(item.name);
            } else if (result.quantity < item.quantity) {
                if (result.quantity === 0) {
                    outOfStock.push(item.name);
                } else {
                    insufficientStock.push({
                        name: item.name,
                        requested: item.quantity,
                        available: result.quantity
                    });
                }
            }
        }
        
        if (outOfStock.length > 0) {
            return new Response(JSON.stringify({ 
                error: 'out_of_stock',
                message: `Sorry, these items are out of stock: ${outOfStock.join(', ')}`,
                items: outOfStock
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }
        
        if (insufficientStock.length > 0) {
            return new Response(JSON.stringify({ 
                error: 'insufficient_stock',
                message: `Not enough stock available`,
                items: insufficientStock
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // === CALCULATE TOTALS ===
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const zone = deliveryZones[deliveryZoneKey] || deliveryZones.dubai;
        const deliveryFee = subtotal >= zone.freeThreshold ? 0 : zone.fee;

        // === BUILD LINE ITEMS ===
        const lineItems = cart.map(item => ({
            price_data: {
                currency: 'aed',
                product_data: {
                    name: item.name,
                    description: item.description || undefined,
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

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

        const url = new URL(request.url);
        const siteUrl = `${url.protocol}//${url.host}`;

        // === CREATE STRIPE SESSION ===
        const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: buildStripeBody(lineItems, siteUrl, zone, subtotal, deliveryFee, cart)
        });

        const session = await stripeResponse.json();

        if (session.error) {
            return new Response(JSON.stringify({ 
                error: 'Payment session creation failed',
                message: session.error.message 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        console.error('Checkout Error:', error);
        return new Response(JSON.stringify({ 
            error: 'Payment processing failed',
            message: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}

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

function buildStripeBody(lineItems, siteUrl, zone, subtotal, deliveryFee, cart) {
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
    
    // Store cart data for webhook to deduct inventory
    params.append('metadata[cart_items]', JSON.stringify(cart.map(item => ({
        slug: item.slug,
        quantity: item.quantity
    }))));

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
