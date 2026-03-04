// Cloudflare Pages Function - Customer Return Request API
// Location: /functions/api/auth/return-request.js
// Simple return: customer submits request, admin processes manually

export async function onRequestPost(context) {
    const { env, request } = context;
    const DB = env.DB;

    try {
        // Authenticate customer
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const customer = await DB.prepare('SELECT id, email, name, token_created_at FROM customers WHERE token = ?')
            .bind(token)
            .first();

        if (!customer) {
            return Response.json({ error: 'Invalid token' }, { status: 401 });
        }
        if (customer.token_created_at && (Date.now() - new Date(customer.token_created_at).getTime() > 30 * 24 * 60 * 60 * 1000)) {
            return Response.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, reason } = body;

        if (!orderId) {
            return Response.json({ error: 'Order ID is required' }, { status: 400 });
        }
        if (!reason) {
            return Response.json({ error: 'Please select a return reason' }, { status: 400 });
        }

        // Verify order exists and belongs to customer via Stripe
        const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
        const sessionRes = await fetch(
            `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(orderId)}`,
            { headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` } }
        );
        const session = await sessionRes.json();

        if (session.error) {
            return Response.json({ error: 'Order not found' }, { status: 404 });
        }

        // Verify ownership
        const sessionEmail = (session.customer_details?.email || session.customer_email || '').toLowerCase();
        if (sessionEmail !== customer.email.toLowerCase()) {
            return Response.json({ error: 'Order not found' }, { status: 404 });
        }

        // Only allow returns on shipped orders
        let isShipped = false;
        try {
            const shipped = await DB.prepare('SELECT order_id FROM shipped_orders WHERE order_id = ?')
                .bind(orderId).first();
            isShipped = !!shipped || session.metadata?.shipped === 'true';
        } catch (e) {}

        if (!isShipped) {
            return Response.json({ error: 'Returns can only be requested for shipped orders.' }, { status: 400 });
        }

        // Check not already cancelled
        try {
            const cancelled = await DB.prepare('SELECT order_id FROM cancelled_orders WHERE order_id = ?')
                .bind(orderId).first();
            if (cancelled) {
                return Response.json({ error: 'This order has already been cancelled.' }, { status: 400 });
            }
        } catch (e) {}

        // Create return_requests table if needed
        await DB.prepare(`CREATE TABLE IF NOT EXISTS return_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT UNIQUE,
            customer_id INTEGER,
            customer_email TEXT,
            customer_name TEXT,
            reason TEXT,
            status TEXT DEFAULT 'requested',
            admin_note TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            processed_at TEXT
        )`).run();

        // Check if return already requested
        const existing = await DB.prepare('SELECT id, status FROM return_requests WHERE order_id = ?')
            .bind(orderId).first();
        if (existing) {
            return Response.json({ error: 'A return request already exists for this order (status: ' + existing.status + ').' }, { status: 400 });
        }

        // Insert return request
        await DB.prepare(
            'INSERT INTO return_requests (order_id, customer_id, customer_email, customer_name, reason) VALUES (?, ?, ?, ?, ?)'
        ).bind(orderId, customer.id, customer.email, customer.name, reason).run();

        // Send notification email to admin
        if (env.RESEND_API_KEY) {
            try {
                // Get admin notification email from settings
                let adminEmail = 'info@orlostore.com';
                try {
                    const setting = await DB.prepare("SELECT value FROM admin_settings WHERE key = 'notification_email'").first();
                    if (setting?.value) adminEmail = setting.value;
                } catch (e) {}

                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'ORLO Store <noreply@orlostore.com>',
                        to: adminEmail,
                        subject: `Return Request — Order #${orderId.slice(-8).toUpperCase()}`,
                        html: `
                            <div style="font-family: 'Inter', Arial, sans-serif; padding: 20px;">
                                <h2 style="color: #2c4a5c;">New Return Request</h2>
                                <p><strong>Order:</strong> #${orderId.slice(-8).toUpperCase()}</p>
                                <p><strong>Customer:</strong> ${customer.name} (${customer.email})</p>
                                <p><strong>Reason:</strong> ${reason}</p>
                                <p style="margin-top: 20px;">
                                    <a href="https://orlostore.com/admin.html" style="background:#2c4a5c;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">View in Admin Panel</a>
                                </p>
                            </div>
                        `
                    })
                });
            } catch (e) {
                console.error('Admin notification email error:', e);
            }
        }

        return Response.json({
            success: true,
            message: 'Return request submitted. We will review it and get back to you within 1-2 business days. Please note: return shipping costs are the customer\'s responsibility as per our terms.'
        });

    } catch (error) {
        console.error('Return request error:', error);
        return Response.json({ error: 'Failed to submit return request' }, { status: 500 });
    }
}
