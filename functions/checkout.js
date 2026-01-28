/* functions/checkout.js 
   Handles Stripe Checkout Session creation
*/

// We need the delivery zones here to validate shipping costs server-side
const deliveryZones = {
    dubai: { fee: 18, freeThreshold: 100, name: "Dubai" },
    sharjah_ajman: { fee: 18, freeThreshold: 100, name: "Sharjah / Ajman" },
    abu_dhabi: { fee: 18, freeThreshold: 100, name: "Abu Dhabi" },
    other: { fee: 18, freeThreshold: 100, name: "Other Emirates" }
};

export async function onRequestPost({ request, env }) {
  try {
    // 1. Initialize Stripe with the Secret Key from Cloudflare Environment Variables
    const stripe = require('stripe')(env.STRIPE_SECRET_KEY);

    // 2. Get the cart data sent from the frontend
    const { cart, deliveryZoneKey } = await request.json();

    if (!cart || cart.length === 0) {
      return new Response("Cart is empty", { status: 400 });
    }

    // 3. Prepare Line Items for Stripe
    const lineItems = cart.map(item => ({
      price_data: {
        currency: 'aed',
        product_data: {
          name: item.name,
          images: [], // You can add item.image if it's a valid URL
        },
        unit_amount: Math.round(item.price * 100), // Stripe expects amounts in fils/cents
      },
      quantity: item.quantity,
    }));

    // 4. Calculate and Add Shipping Fee
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const zone = deliveryZones[deliveryZoneKey] || deliveryZones['dubai'];
    let shippingFee = 0;

    if (subtotal < zone.freeThreshold) {
      shippingFee = zone.fee * 100; // Convert to fils
      
      lineItems.push({
        price_data: {
          currency: 'aed',
          product_data: {
            name: `Shipping (${zone.name})`,
          },
          unit_amount: shippingFee,
        },
        quantity: 1,
      });
    }

    // 5. Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${new URL(request.url).origin}/success.html`,
      cancel_url: `${new URL(request.url).origin}/cancel.html`,
    });

    // 6. Return the Session URL to the frontend
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
