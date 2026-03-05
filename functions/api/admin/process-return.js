// Cloudflare Pages Function - Admin Process Return Request
// Location: /functions/api/admin/process-return.js
// Actions: approve, reject, refund
// PUT: Admin-initiated return on behalf of customer

import { getKey, getAdminUser, logActivity } from './_helpers.js';
import { customerEmail as buildCustomerEmail, plainText, sendEmail } from '../email-template.js';

export async function onRequestGet(context) {
    // GET: List all return requests
    const { env, request } = context;

    const key = getKey(request);
    const user = await getAdminUser(env, key);
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS return_requests (
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

        const { results } = await env.DB.prepare(
            'SELECT * FROM return_requests ORDER BY created_at DESC'
        ).all();

        return Response.json({ success: true, returns: results || [] });
    } catch (error) {
        console.error('List returns error:', error);
        return Response.json({ error: 'Failed to fetch returns' }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { env, request } = context;

    const key = getKey(request);
    const user = await getAdminUser(env, key);
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { order_id, action, note } = await request.json();

        if (!order_id || !action) {
            return Response.json({ error: 'Missing order_id or action' }, { status: 400 });
        }

        if (!['approve', 'reject', 'refund'].includes(action)) {
            return Response.json({ error: 'Invalid action. Use: approve, reject, or refund' }, { status: 400 });
        }

        // Verify return request exists
        const returnReq = await env.DB.prepare('SELECT * FROM return_requests WHERE order_id = ?')
            .bind(order_id).first();

        if (!returnReq) {
            return Response.json({ error: 'Return request not found' }, { status: 404 });
        }

        let newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'refunded';
        let refundSuccess = false;
        let emailSent = false;

        // If refunding, issue Stripe refund
        if (action === 'refund') {
            if (env.STRIPE_SECRET_KEY) {
                const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${order_id}`, {
                    headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}` }
                });
                const sessionData = await sessionRes.json();
                const paymentIntentId = sessionData.payment_intent;

                if (paymentIntentId) {
                    const refundRes = await fetch('https://api.stripe.com/v1/refunds', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: `payment_intent=${paymentIntentId}`
                    });
                    const refundData = await refundRes.json();
                    refundSuccess = refundData.status === 'succeeded' || refundData.status === 'pending';

                    if (!refundSuccess) {
                        return Response.json({ error: 'Stripe refund failed: ' + (refundData.error?.message || 'Unknown') }, { status: 500 });
                    }

                    // Restore inventory
                    try {
                        const itemsRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${order_id}/line_items?limit=100`, {
                            headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}` }
                        });
                        const lineItems = await itemsRes.json();

                        for (const item of (lineItems.data || [])) {
                            const name = (item.description || '').split(' — ');
                            const productName = name[0];
                            const variantName = name[1] || null;

                            if (productName && !productName.toLowerCase().includes('delivery')) {
                                await env.DB.prepare('UPDATE products SET quantity = quantity + ? WHERE name = ?')
                                    .bind(item.quantity, productName).run();

                                if (variantName) {
                                    await env.DB.prepare(
                                        'UPDATE product_variants SET quantity = quantity + ? WHERE product_id = (SELECT id FROM products WHERE name = ?) AND name = ?'
                                    ).bind(item.quantity, productName, variantName).run();
                                }
                            }
                        }
                    } catch (invErr) {
                        console.error('Inventory restore error:', invErr);
                    }
                }
            }
        }

        // Update return request status
        await env.DB.prepare(
            "UPDATE return_requests SET status = ?, admin_note = ?, processed_at = datetime('now') WHERE order_id = ?"
        ).bind(newStatus, note || null, order_id).run();

        // Send email to customer
        if (env.RESEND_API_KEY && returnReq.customer_email) {
            try {
                const origin = env.SITE_URL || new URL(request.url).origin;
                const custName = returnReq.customer_name || 'there';
                const orderRef = order_id.slice(-8).toUpperCase();

                const subjects = {
                    approved: 'Return Approved | تمت الموافقة على الإرجاع',
                    rejected: 'Return Request Update | تحديث طلب الإرجاع',
                    refunded: 'Refund Processed | تم معالجة الاسترداد'
                };

                const emailConfigs = {
                    approved: {
                        icon: '✅',
                        titleEn: 'Return Approved',
                        bodyEn: `Hi ${custName}, your return request for order #${orderRef} has been approved.`,
                        bodyAr: `تمت الموافقة على طلب الإرجاع لطلبك #${orderRef}.`,
                        infoBoxEn: `<strong>Next steps:</strong> Please ship the item back to us. Return shipping costs are the customer's responsibility as per our terms. Once we receive and inspect the item, we will process your refund.`,
                        infoBoxAr: 'يرجى شحن المنتج إلينا. تكاليف شحن الإرجاع على العميل. بمجرد استلامنا سنقوم بمعالجة الاسترداد.',
                        extraHtml: note ? `<p style="color:#555;font-size:14px;"><strong>Note:</strong> ${note}</p>` : '',
                        preheader: `Your return for order #${orderRef} has been approved.`,
                        plainEn: `Hi ${custName}, your return request for order #${orderRef} has been approved.`,
                        plainInfoEn: 'Next steps: Please ship the item back to us. Return shipping costs are the customer\'s responsibility. Once we receive and inspect the item, we will process your refund.',
                    },
                    rejected: {
                        icon: '📋',
                        titleEn: 'Return Request Update',
                        bodyEn: `Hi ${custName}, unfortunately we are unable to approve the return for order #${orderRef}.`,
                        bodyAr: `للأسف لم نتمكن من الموافقة على إرجاع الطلب #${orderRef}.`,
                        infoBoxEn: note ? `<strong>Reason:</strong> ${note}` : '',
                        infoBoxBg: '#fff3cd',
                        infoBoxBorder: '#ffc107',
                        preheader: `Update on your return request for order #${orderRef}.`,
                        plainEn: `Hi ${custName}, unfortunately we are unable to approve the return for order #${orderRef}.`,
                        plainInfoEn: note ? `Reason: ${note}` : '',
                    },
                    refunded: {
                        icon: '💸',
                        titleEn: 'Refund Processed',
                        bodyEn: `Hi ${custName}, a full refund has been issued for order #${orderRef}.`,
                        bodyAr: `تم إصدار استرداد كامل لطلبك #${orderRef}.`,
                        infoBoxEn: 'The refund will appear on your card within <strong>5-7 business days</strong>.',
                        infoBoxAr: 'سيظهر المبلغ في حسابك خلال ٥-٧ أيام عمل.',
                        preheader: `A full refund has been issued for your order #${orderRef}.`,
                        plainEn: `Hi ${custName}, a full refund has been issued for order #${orderRef}.`,
                        plainInfoEn: 'The refund will appear on your card within 5-7 business days.',
                        plainInfoAr: 'سيظهر المبلغ في حسابك خلال ٥-٧ أيام عمل.',
                    }
                };

                const cfg = emailConfigs[newStatus];

                const html = buildCustomerEmail({
                    origin,
                    icon: cfg.icon,
                    titleEn: cfg.titleEn,
                    bodyEn: cfg.bodyEn,
                    bodyAr: cfg.bodyAr,
                    infoBoxEn: cfg.infoBoxEn || undefined,
                    infoBoxAr: cfg.infoBoxAr || undefined,
                    infoBoxBg: cfg.infoBoxBg,
                    infoBoxBorder: cfg.infoBoxBorder,
                    extraHtml: cfg.extraHtml || '',
                    preheader: cfg.preheader,
                });

                const text = plainText({
                    titleEn: cfg.titleEn,
                    bodyTextEn: cfg.plainEn,
                    bodyTextAr: cfg.bodyAr,
                    infoTextEn: cfg.plainInfoEn || undefined,
                    infoTextAr: cfg.plainInfoAr || undefined,
                });

                const result = await sendEmail({
                    apiKey: env.RESEND_API_KEY,
                    to: returnReq.customer_email,
                    subject: subjects[newStatus] || 'Return Update',
                    html,
                    text,
                });

                emailSent = result.success;
            } catch (mailErr) {
                console.error('Return email error:', mailErr);
            }
        }

        // Log activity
        await logActivity(env, user.name, 'process_return', order_id, `${action}: ${note || 'No note'} - ${returnReq.customer_email}`);

        return Response.json({
            success: true,
            status: newStatus,
            refund: refundSuccess,
            email_sent: emailSent
        });

    } catch (error) {
        console.error('Process return error:', error);
        return Response.json({ error: 'Failed to process return: ' + error.message }, { status: 500 });
    }
}

// PUT: Admin-initiated return on behalf of customer
export async function onRequestPut(context) {
    const { env, request } = context;

    const key = getKey(request);
    const user = await getAdminUser(env, key);
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { order_id, reason } = await request.json();

        if (!order_id) {
            return Response.json({ error: 'Order ID is required' }, { status: 400 });
        }
        if (!reason) {
            return Response.json({ error: 'Reason is required' }, { status: 400 });
        }

        // Fetch order from Stripe to get customer info
        const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(order_id)}`, {
            headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}` }
        });
        const session = await sessionRes.json();

        if (session.error) {
            return Response.json({ error: 'Order not found in Stripe' }, { status: 404 });
        }

        if (session.payment_status !== 'paid') {
            return Response.json({ error: 'Order is not paid' }, { status: 400 });
        }

        const customerEmail = session.customer_details?.email || session.customer_email || '';
        const customerName = session.customer_details?.name || '';

        // Check not already cancelled
        try {
            const cancelled = await env.DB.prepare('SELECT order_id FROM cancelled_orders WHERE order_id = ?')
                .bind(order_id).first();
            if (cancelled) {
                return Response.json({ error: 'This order has already been cancelled' }, { status: 400 });
            }
        } catch (e) {}

        // Ensure return_requests table exists
        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS return_requests (
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

        // Check if return already exists
        const existing = await env.DB.prepare('SELECT id, status FROM return_requests WHERE order_id = ?')
            .bind(order_id).first();
        if (existing) {
            return Response.json({ error: 'A return request already exists for this order (status: ' + existing.status + ')' }, { status: 400 });
        }

        // Look up customer_id from customers table if they have an account
        let customerId = null;
        if (customerEmail) {
            try {
                const cust = await env.DB.prepare('SELECT id FROM customers WHERE email = ?')
                    .bind(customerEmail.toLowerCase()).first();
                if (cust) customerId = cust.id;
            } catch (e) {}
        }

        // Insert return request (admin-initiated)
        await env.DB.prepare(
            'INSERT INTO return_requests (order_id, customer_id, customer_email, customer_name, reason, admin_note) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(order_id, customerId, customerEmail, customerName, reason, 'Initiated by admin: ' + user.name).run();

        // Send notification email to customer
        if (env.RESEND_API_KEY && customerEmail) {
            try {
                const origin = env.SITE_URL || new URL(request.url).origin;
                const orderRef = order_id.slice(-8).toUpperCase();

                const html = buildCustomerEmail({
                    origin,
                    icon: '🔄',
                    titleEn: 'Return Initiated',
                    bodyEn: `Hi ${customerName || 'there'}, a return has been initiated for your order #${orderRef}.`,
                    bodyAr: `تم بدء عملية إرجاع لطلبك #${orderRef}.`,
                    infoBoxEn: `<strong>Reason:</strong> ${reason}<br><br><strong>Next steps:</strong> Please ship the item back to us. Return shipping costs are the customer's responsibility as per our terms. Once we receive and inspect the item, we will process your refund.`,
                    infoBoxAr: 'يرجى شحن المنتج إلينا. تكاليف شحن الإرجاع على العميل. بمجرد استلامنا سنقوم بمعالجة الاسترداد.',
                    preheader: `A return has been initiated for your order #${orderRef}.`,
                });

                const text = plainText({
                    titleEn: 'Return Initiated',
                    bodyTextEn: `Hi ${customerName || 'there'}, a return has been initiated for your order #${orderRef}.`,
                    bodyTextAr: `تم بدء عملية إرجاع لطلبك #${orderRef}.`,
                    infoTextEn: `Reason: ${reason}\n\nNext steps: Please ship the item back to us. Return shipping costs are the customer's responsibility. Once we receive and inspect the item, we will process your refund.`,
                    infoTextAr: 'يرجى شحن المنتج إلينا. تكاليف شحن الإرجاع على العميل. بمجرد استلامنا سنقوم بمعالجة الاسترداد.',
                });

                await sendEmail({
                    apiKey: env.RESEND_API_KEY,
                    to: customerEmail,
                    subject: `Return Initiated for Order #${orderRef} | تم بدء إرجاع طلبك`,
                    html,
                    text,
                });
            } catch (mailErr) {
                console.error('Admin return notification email error:', mailErr);
            }
        }

        // Log activity
        await logActivity(env, user.name, 'initiate_return', order_id, `Reason: ${reason} - ${customerEmail}`);

        return Response.json({
            success: true,
            message: 'Return initiated for order #' + order_id.slice(-8).toUpperCase()
        });

    } catch (error) {
        console.error('Admin initiate return error:', error);
        return Response.json({ error: 'Failed to initiate return: ' + error.message }, { status: 500 });
    }
}
