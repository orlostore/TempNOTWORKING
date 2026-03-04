// Cloudflare Pages Function - Stripe Webhook
// Deducts inventory after successful payment + sends receipt + admin notification

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

        // Verify webhook signature (mandatory)
        if (!STRIPE_WEBHOOK_SECRET) {
            console.error('STRIPE_WEBHOOK_SECRET is not configured');
            return new Response('Webhook secret not configured', { status: 500 });
        }
        if (!signature) {
            return new Response('Missing stripe-signature header', { status: 400 });
        }
        const verified = await verifyStripeSignature(payload, signature, STRIPE_WEBHOOK_SECRET);
        if (!verified) {
            return new Response('Invalid signature', { status: 400 });
        }

        const event = JSON.parse(payload);

        // Handle the checkout.session.completed event
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            // === IDEMPOTENCY: skip if already processed ===
            try {
                // Create table if it doesn't exist (first run)
                await DB.prepare(`CREATE TABLE IF NOT EXISTS processed_webhooks (
                    event_id TEXT PRIMARY KEY,
                    processed_at TEXT DEFAULT (datetime('now'))
                )`).run();

                const existing = await DB.prepare('SELECT event_id FROM processed_webhooks WHERE event_id = ?')
                    .bind(event.id).first();
                if (existing) {
                    console.log(`Webhook ${event.id} already processed, skipping`);
                    return new Response(JSON.stringify({ received: true, duplicate: true }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                await DB.prepare('INSERT INTO processed_webhooks (event_id) VALUES (?)').bind(event.id).run();
            } catch (e) {
                console.error('Idempotency check error:', e);
            }

            // === DEDUCT INVENTORY ===
            let cartItems = [];
            if (session.metadata && session.metadata.cart_items) {
                try {
                    cartItems = JSON.parse(session.metadata.cart_items);

                    for (const item of cartItems) {
                        if (item.variantId) {
                            await DB.prepare(
                                'UPDATE product_variants SET quantity = MAX(0, quantity - ?) WHERE id = ? AND quantity >= ?'
                            ).bind(item.quantity, item.variantId, item.quantity).run();
                            console.log(`Deducted ${item.quantity} from variant ${item.variantId} (${item.slug})`);
                        } else {
                            await DB.prepare(
                                'UPDATE products SET quantity = MAX(0, quantity - ?) WHERE slug = ? AND quantity >= ?'
                            ).bind(item.quantity, item.slug, item.quantity).run();
                            console.log(`Deducted ${item.quantity} from ${item.slug}`);
                        }
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

            // === SEND ADMIN NOTIFICATION EMAIL ===
            if (env.RESEND_API_KEY && DB) {
                try {
                    // Get notification emails from settings
                    let notifyEmails = [];
                    try {
                        const setting = await DB.prepare(
                            "SELECT value FROM admin_settings WHERE key = 'order_notification_emails'"
                        ).first();
                        if (setting && setting.value) {
                            notifyEmails = JSON.parse(setting.value);
                        }
                    } catch (e) {
                        console.error('Failed to load notification emails:', e);
                    }

                    if (notifyEmails.length > 0) {
                        const customerName = session.customer_details?.name || 'Unknown';
                        const total = (session.amount_total / 100).toFixed(2);
                        const currency = (session.currency || 'aed').toUpperCase();

                        // Build items list
                        let itemsHtml = '';
                        if (cartItems.length > 0) {
                            itemsHtml = cartItems.map(i =>
                                `<tr><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${i.name || i.slug}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">x${i.quantity}</td></tr>`
                            ).join('');
                        }

                        const emailHtml = `
                            <div style="font-family:'Inter','Segoe UI',Arial,sans-serif;background:#f0f2f5;padding:30px 20px;">
                                <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
                                    <div style="background:linear-gradient(135deg,#28a745 0%,#1e8e3e 100%);padding:25px 20px;text-align:center;">
                                        <div style="font-size:36px;margin-bottom:8px;">🛒</div>
                                        <div style="color:#fff;font-size:18px;font-weight:700;">New Order Received!</div>
                                    </div>
                                    <div style="padding:25px 20px;">
                                        <div style="background:#f8f9fa;border-radius:8px;padding:15px;margin-bottom:15px;">
                                            <div style="font-size:12px;color:#888;text-transform:uppercase;margin-bottom:4px;">Customer</div>
                                            <div style="font-size:16px;font-weight:600;color:#333;">${customerName}</div>
                                            <div style="font-size:13px;color:#666;">${customerEmail || 'N/A'}</div>
                                        </div>
                                        <div style="background:#f8f9fa;border-radius:8px;padding:15px;margin-bottom:15px;">
                                            <div style="font-size:12px;color:#888;text-transform:uppercase;margin-bottom:4px;">Total</div>
                                            <div style="font-size:24px;font-weight:700;color:#28a745;">${currency} ${total}</div>
                                        </div>
                                        ${itemsHtml ? `
                                        <div style="background:#f8f9fa;border-radius:8px;overflow:hidden;margin-bottom:15px;">
                                            <div style="padding:10px 12px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;">Items</div>
                                            <table style="width:100%;border-collapse:collapse;font-size:13px;">${itemsHtml}</table>
                                        </div>` : ''}
                                        <div style="text-align:center;margin-top:20px;">
                                            <a href="https://orlostore.com/admin.html" style="background:#2c4a5c;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">Open Admin Panel</a>
                                        </div>
                                    </div>
                                    <div style="background:#f8f9fa;padding:15px;text-align:center;border-top:1px solid #eee;">
                                        <p style="color:#aaa;font-size:11px;margin:0;">ORLO Store - Order Notification</p>
                                    </div>
                                </div>
                            </div>
                        `;

                        await fetch('https://api.resend.com/emails', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                from: 'ORLO Store <noreply@orlostore.com>',
                                to: notifyEmails,
                                subject: `New Order! ${currency} ${total} from ${customerName}`,
                                html: emailHtml
                            })
                        });
                        console.log('Admin notification sent to:', notifyEmails.join(', '));
                    }
                } catch (e) {
                    console.error('Admin notification email error (non-blocking):', e);
                }
            }

            // === LOG ACTIVITY ===
            if (DB) {
                try {
                    await DB.prepare(`
                        CREATE TABLE IF NOT EXISTS activity_log (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            admin_name TEXT NOT NULL,
                            action TEXT NOT NULL,
                            target TEXT,
                            details TEXT,
                            created_at TEXT DEFAULT (datetime('now'))
                        )
                    `).run();
                    const customerName = session.customer_details?.name || 'Unknown';
                    const total = (session.amount_total / 100).toFixed(2);
                    await DB.prepare(
                        "INSERT INTO activity_log (admin_name, action, target, details) VALUES (?, ?, ?, ?)"
                    ).bind('System', 'new_order', session.id, `${customerName} - AED ${total}`).run();
                } catch (e) {
                    console.error('Activity log error:', e);
                }
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Webhook Error:', error);
        return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

function safeCompareHex(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
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

        // Reject signatures older than 5 minutes to prevent replay attacks
        const timestampSec = parseInt(timestamp, 10);
        const nowSec = Math.floor(Date.now() / 1000);
        if (isNaN(timestampSec) || Math.abs(nowSec - timestampSec) > 300) {
            console.error('Webhook timestamp too old or invalid:', timestamp);
            return false;
        }

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

        // Constant-time comparison to prevent timing attacks
        return safeCompareHex(computedSig, expectedSig);
    } catch (e) {
        console.error('Signature verification error:', e);
        return false;
    }
}
