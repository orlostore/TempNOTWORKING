// Cloudflare Pages Function - Customer Return Request API
// Location: /functions/api/auth/return-request.js
// Simple return: customer submits request, admin processes manually

import { adminEmail as buildAdminEmail, sendEmail } from '../email-template.js';

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

        // Only allow returns on shipped orders, within 7-day window
        let isShipped = false;
        let shippedAt = null;
        try {
            const shipped = await DB.prepare('SELECT order_id, shipped_at FROM shipped_orders WHERE order_id = ?')
                .bind(orderId).first();
            if (shipped) {
                isShipped = true;
                shippedAt = shipped.shipped_at;
            } else if (session.metadata?.shipped === 'true') {
                isShipped = true;
                shippedAt = session.metadata?.shipped_date || null;
            }
        } catch (e) {}

        if (!isShipped) {
            return Response.json({ error: 'Returns can only be requested for shipped orders.' }, { status: 400 });
        }

        // Enforce 7-day return window from shipping date
        if (shippedAt) {
            const shippedMs = new Date(shippedAt).getTime();
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - shippedMs > sevenDaysMs) {
                return Response.json({ error: 'The 7-day return window has expired. Returns must be requested within 7 days of shipping.' }, { status: 400 });
            }
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
                let adminNotifyEmail = 'info@orlostore.com';
                try {
                    const setting = await DB.prepare("SELECT value FROM admin_settings WHERE key = 'notification_email'").first();
                    if (setting?.value) adminNotifyEmail = setting.value;
                } catch (e) {}

                const origin = env.SITE_URL || new URL(request.url).origin;

                const bodyHtml = `
                    <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                        <div style="font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 4px;">Order</div>
                        <div style="font-size: 16px; font-weight: 600; color: #333;">#${orderId.slice(-8).toUpperCase()}</div>
                    </div>
                    <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                        <div style="font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 4px;">Customer</div>
                        <div style="font-size: 16px; font-weight: 600; color: #333;">${customer.name}</div>
                        <div style="font-size: 13px; color: #666;">${customer.email}</div>
                    </div>
                    <div style="background: #fff3cd; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                        <div style="font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 4px;">Reason</div>
                        <div style="font-size: 14px; color: #333;">${reason}</div>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${origin}/admin.html" style="background: #2c4a5c; color: #fff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">View in Admin Panel</a>
                    </div>
                `;

                const html = buildAdminEmail({
                    titleEn: 'New Return Request',
                    bodyHtml,
                    icon: '🔄',
                    headerBg: '#e07856',
                    preheader: `Return request from ${customer.name} for order #${orderId.slice(-8).toUpperCase()}`,
                });

                await sendEmail({
                    apiKey: env.RESEND_API_KEY,
                    to: adminNotifyEmail,
                    subject: `Return Request — Order #${orderId.slice(-8).toUpperCase()}`,
                    html,
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
