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

        // === CHECK IF LOGGED-IN CUSTOMER ===
        let customerEmail = null;
        let customerAddress = null;
        let customerPhone = null;
        
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ') && DB) {
            const token = authHeader.replace('Bearer ', '');
            const customer = await DB.prepare('SELECT id, email, name FROM customers WHERE token = ?')
                .bind(token)
                .first();
            
            if (customer) {
                customerEmail = customer.email;
                
                // Get default address (or most recent)
                const address = await DB.prepare(`
                    SELECT full_name, phone, street, building, area, emirate, landmark
                    FROM customer_addresses
                    WHERE customer_id = ?
                    ORDER BY is_default DESC, id DESC
                    LIMIT 1
                `).bind(customer.id).first();
                
                if (address) {
                    customerAddress = address;
                    customerPhone = address.phone;
                }
            }
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
        let stripeCustomerId = null;
        
        // If logged in with address, create/update Stripe customer for pre-fill
        if (customerEmail && customerAddress) {
            // Search for existing Stripe customer by email
            const searchRes = await fetch(`https://api.stripe.com/v1/customers/search?query=email:'${encodeURIComponent(customerEmail)}'`, {
                headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` }
            });
            const searchData = await searchRes.json();
            
            const line1 = `${customerAddress.building}, ${customerAddress.street}`;
            const line2Parts = [];
            if (customerAddress.area) line2Parts.push(customerAddress.area);
            if (customerAddress.landmark) line2Parts.push(`Near ${customerAddress.landmark}`);
            const line2 = line2Parts.join(', ') || undefined;
            
            const customerParams = new URLSearchParams();
            customerParams.append('email', customerEmail);
            customerParams.append('name', customerAddress.full_name);
            if (customerPhone) customerParams.append('phone', customerPhone);
            customerParams.append('shipping[name]', customerAddress.full_name);
            customerParams.append('shipping[phone]', customerPhone || '');
            customerParams.append('shipping[address][line1]', line1);
            if (line2) customerParams.append('shipping[address][line2]', line2);
            customerParams.append('shipping[address][city]', customerAddress.emirate || 'Dubai');
            customerParams.append('shipping[address][state]', customerAddress.emirate || 'Dubai');
            customerParams.append('shipping[address][country]', 'AE');
            
            if (searchData.data && searchData.data.length > 0) {
                // Update existing customer
                stripeCustomerId = searchData.data[0].id;
                await fetch(`https://api.stripe.com/v1/customers/${stripeCustomerId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: customerParams.toString()
                });
            } else {
                // Create new customer
                const createRes = await fetch('https://api.stripe.com/v1/customers', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: customerParams.toString()
                });
                const newCustomer = await createRes.json();
                stripeCustomerId = newCustomer.id;
            }
        }

        const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: buildStripeBody(lineItems, siteUrl, zone, subtotal, deliveryFee, cart, customerEmail, stripeCustomerId)
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
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}

function buildStripeBody(lineItems, siteUrl, zone, subtotal, deliveryFee, cart, customerEmail, stripeCustomerId) {
    const params = new URLSearchParams();
    
    params.append('mode', 'payment');
    params.append('success_url', `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`);
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
    
    // Pre-fill customer info
    if (stripeCustomerId) {
        params.append('customer', stripeCustomerId);
        params.append('customer_update[shipping]', 'auto');
    } else if (customerEmail) {
        params.append('customer_email', customerEmail);
    }
    
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
