/* functions/checkout.js */
import Stripe from 'stripe';

const deliveryZones = {
    dubai: { fee: 18, freeThreshold: 100, name: "Dubai" },
    sharjah_ajman: { fee: 18, freeThreshold: 100, name: "Sharjah / Ajman" },
    abu_dhabi: { fee: 18, freeThreshold: 100, name: "Abu Dhabi" },
    other: { fee: 18, freeThreshold: 100, name: "Other Emirates" }
};

export async function onRequestPost({ request, env }) {
  try {
    // 1. Initialize Stripe using the Secret Key you added to Cloudflare Environment Variables
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);

    // 2. Parse the cart data from the website
    const { cart, deliveryZoneKey } = await request.json();

    if (!cart || cart.length === 0) {
      return new Response("Cart is empty", { status: 400 });
    }

    // 3. Map products to Stripe format
    const lineItems = cart.map(item => ({
      price_data: {
        currency: 'aed',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses fils (cents)
      },
      quantity: item.quantity,
    }));

    // 4. Handle Shipping Fee Calculation
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const zone = deliveryZones[deliveryZoneKey] || deliveryZones['dubai'];
    
    if (subtotal < zone.freeThreshold) {
      lineItems.push({
        price_data: {
          currency: 'aed',
          product_data: {
            name: `Shipping (${zone.name})`,
          },
          unit_amount: zone.fee * 100,
        },
        quantity: 1,
      });
    }

    // 5. Create the Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${new URL(request.url).origin}/success.html`,
      cancel_url: `${new URL(request.url).origin}/cancel.html`,
    });

    // 6. Send the checkout URL back to the website
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    // If something breaks, return the error message
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
