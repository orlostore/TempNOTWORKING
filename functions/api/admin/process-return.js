// Cloudflare Pages Function - Admin Process Return Request
// Location: /functions/api/admin/process-return.js
// Actions: approve, reject, refund

import { getKey, getAdminUser, logActivity } from './_helpers.js';

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
                const subjects = {
                    approved: 'Return Approved | تمت الموافقة على الإرجاع',
                    rejected: 'Return Request Update | تحديث طلب الإرجاع',
                    refunded: 'Refund Processed | تم معالجة الاسترداد'
                };

                const bodies = {
                    approved: `
                        <div style="font-size: 48px; line-height: 1; margin-bottom: 15px;">✅</div>
                        <h2 style="color: #2c4a5c; margin: 0 0 12px; font-size: 20px;">Return Approved</h2>
                        <p style="color: #555; font-size: 15px; line-height: 1.7;">
                            Hi ${returnReq.customer_name || 'there'}, your return request for order #${order_id.slice(-8).toUpperCase()} has been approved.
                        </p>
                        <p style="color: #888; font-size: 14px; font-family: 'Almarai', Arial, sans-serif; direction: rtl;">
                            تمت الموافقة على طلب الإرجاع لطلبك #${order_id.slice(-8).toUpperCase()}.
                        </p>
                        <div style="background: #f0f7ff; border-radius: 10px; padding: 18px 20px; margin: 20px 0; border-left: 3px solid #2c4a5c; text-align: left;">
                            <p style="margin: 0; font-size: 14px; color: #555;">
                                <strong>Next steps:</strong> Please ship the item back to us. Return shipping costs are the customer's responsibility as per our terms. Once we receive and inspect the item, we will process your refund.
                            </p>
                            <p style="margin: 8px 0 0; font-size: 13px; color: #888; font-family: 'Almarai', Arial, sans-serif; direction: rtl; text-align: right;">
                                يرجى شحن المنتج إلينا. تكاليف شحن الإرجاع على العميل. بمجرد استلامنا سنقوم بمعالجة الاسترداد.
                            </p>
                        </div>
                        ${note ? `<p style="color:#555;font-size:14px;"><strong>Note:</strong> ${note}</p>` : ''}
                    `,
                    rejected: `
                        <div style="font-size: 48px; line-height: 1; margin-bottom: 15px;">📋</div>
                        <h2 style="color: #2c4a5c; margin: 0 0 12px; font-size: 20px;">Return Request Update</h2>
                        <p style="color: #555; font-size: 15px; line-height: 1.7;">
                            Hi ${returnReq.customer_name || 'there'}, unfortunately we are unable to approve the return for order #${order_id.slice(-8).toUpperCase()}.
                        </p>
                        <p style="color: #888; font-size: 14px; font-family: 'Almarai', Arial, sans-serif; direction: rtl;">
                            للأسف لم نتمكن من الموافقة على إرجاع الطلب #${order_id.slice(-8).toUpperCase()}.
                        </p>
                        ${note ? `<div style="background: #fff3cd; border-radius: 10px; padding: 14px 16px; margin: 20px 0;"><p style="margin:0;font-size:14px;color:#555;"><strong>Reason:</strong> ${note}</p></div>` : ''}
                    `,
                    refunded: `
                        <div style="font-size: 48px; line-height: 1; margin-bottom: 15px;">💸</div>
                        <h2 style="color: #2c4a5c; margin: 0 0 12px; font-size: 20px;">Refund Processed</h2>
                        <p style="color: #555; font-size: 15px; line-height: 1.7;">
                            Hi ${returnReq.customer_name || 'there'}, a full refund has been issued for order #${order_id.slice(-8).toUpperCase()}.
                        </p>
                        <p style="color: #888; font-size: 14px; font-family: 'Almarai', Arial, sans-serif; direction: rtl;">
                            تم إصدار استرداد كامل لطلبك #${order_id.slice(-8).toUpperCase()}.
                        </p>
                        <div style="background: #f0f7ff; border-radius: 10px; padding: 18px 20px; margin: 20px 0; border-left: 3px solid #2c4a5c; text-align: left;">
                            <p style="margin: 0; font-size: 14px; color: #555;">
                                The refund will appear on your card within <strong>5-7 business days</strong>.
                            </p>
                            <p style="margin: 6px 0 0; font-size: 13px; color: #888; font-family: 'Almarai', Arial, sans-serif; direction: rtl; text-align: right;">
                                سيظهر المبلغ في حسابك خلال ٥-٧ أيام عمل.
                            </p>
                        </div>
                    `
                };

                const emailRes = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'ORLO Store <noreply@orlostore.com>',
                        to: returnReq.customer_email,
                        subject: subjects[newStatus] || 'Return Update',
                        html: `
                            <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #f0f2f5; padding: 40px 20px;">
                                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
                                    <div style="background: linear-gradient(135deg, #2c4a5c 0%, #1e3545 100%); padding: 35px 30px; text-align: center;">
                                        <img src="https://orlostore.com/logo.png" alt="ORLO Store" style="width: 65px; height: 65px; margin-bottom: 10px;">
                                        <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; letter-spacing: 1.5px;">ORLO STORE</div>
                                    </div>
                                    <div style="padding: 35px 30px; text-align: center;">
                                        ${bodies[newStatus] || ''}
                                        <p style="color: #999; font-size: 12px; margin: 20px 0 0;">
                                            Questions? Contact us at <a href="mailto:info@orlostore.com" style="color: #e07856;">info@orlostore.com</a>
                                        </p>
                                    </div>
                                    <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
                                        <p style="color: #aaa; font-size: 11px; margin: 0;">&copy; ORLO Store | info@orlostore.com</p>
                                    </div>
                                </div>
                            </div>
                        `
                    })
                });
                const emailResult = await emailRes.json();
                emailSent = emailRes.ok && emailResult.id;
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
