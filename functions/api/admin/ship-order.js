// Cloudflare Pages Function - Mark Order as Shipped + Create Zajel Shipment + Send Email
// Location: /functions/api/admin/ship-order.js

import { getKey, getAdminUser, logActivity } from './_helpers.js';
import { customerEmail, plainText, sendEmail } from '../email-template.js';
import { zajelApi, createShipmentPayload, ensureShipmentsTable, resolveCity } from './zajel.js';

export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const key = getKey(request);
        const user = await getAdminUser(env, key);

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            order_id, customer_email: custEmail, customer_name, items,
            customer_phone, address_line_1, address_line_2, city, area,
            skip_zajel,
        } = await request.json();

        if (!order_id || !custEmail || custEmail === 'N/A') {
            return Response.json({ error: 'Missing order_id or customer_email' }, { status: 400 });
        }

        // ─── 1. Create Zajel Shipment (if configured) ─────────────
        let zajelRef = null;
        let zajelError = null;

        if (env.ZAJEL_API_KEY && env.ZAJEL_CUSTOMER_CODE && !skip_zajel) {
            try {
                await ensureShipmentsTable(env.DB);

                // Check if already created
                const existing = await env.DB.prepare(
                    'SELECT zajel_reference FROM shipments WHERE order_id = ?'
                ).bind(order_id).first();

                if (existing?.zajel_reference) {
                    zajelRef = existing.zajel_reference;
                } else {
                    // Build item description
                    const desc = (items || [])
                        .filter(i => !i.name.toLowerCase().includes('delivery'))
                        .map(i => `${(i.name || '').split(/[\n\r]/)[0].split(' — ')[0].trim()} x${i.quantity}`)
                        .join(', ')
                        .slice(0, 150) || 'ORLO Store Order';

                    const payload = createShipmentPayload(env, {
                        customerReference: order_id.slice(-12),
                        customerName: customer_name,
                        customerPhone: customer_phone,
                        customerEmail: custEmail,
                        addressLine1: address_line_1,
                        addressLine2: address_line_2,
                        destinationCity: city,
                        destinationArea: area,
                        description: desc,
                    });

                    const result = await zajelApi(env, {
                        method: 'POST',
                        endpoint: '/api/Merchant/CreateShipment',
                        body: payload,
                    });

                    if (result.ok && result.data?.success) {
                        zajelRef = result.data.referenceNumber;

                        await env.DB.prepare(`
                            INSERT OR REPLACE INTO shipments
                                (order_id, zajel_reference, customer_reference, status, zajel_status,
                                 customer_name, customer_email, customer_phone, destination_city, destination_address)
                            VALUES (?, ?, ?, 'created', 'softdata_upload', ?, ?, ?, ?, ?)
                        `).bind(
                            order_id, zajelRef, result.data.customerReferenceNumber || '',
                            customer_name || '', custEmail, customer_phone || '',
                            resolveCity(city), address_line_1 || ''
                        ).run();
                    } else {
                        zajelError = result.data?.errors
                            ? Object.values(result.data.errors).flat().join(', ')
                            : result.data?.title || 'Zajel API error';
                        console.error('Zajel CreateShipment failed:', zajelError);
                    }
                }
            } catch (ze) {
                zajelError = ze.message;
                console.error('Zajel integration error (non-blocking):', ze);
            }
        }

        // ─── 2. Save shipped status to D1 ─────────────────────────
        if (env.DB) {
            try {
                await env.DB.prepare(`
                    INSERT OR REPLACE INTO shipped_orders (order_id, shipped_at)
                    VALUES (?, datetime('now'))
                `).bind(order_id).run();
            } catch (dbError) {
                console.error('D1 save failed (non-blocking):', dbError);
            }
        }

        // ─── 3. Update Stripe PaymentIntent metadata ──────────────
        if (env.STRIPE_SECRET_KEY) {
            try {
                const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${order_id}`, {
                    headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}` }
                });
                const sessionData = await sessionRes.json();
                const paymentIntentId = sessionData.payment_intent;

                if (paymentIntentId) {
                    let metaBody = 'metadata[shipped]=true&metadata[shipped_date]=' + encodeURIComponent(new Date().toISOString());
                    if (zajelRef) {
                        metaBody += '&metadata[zajel_awb]=' + encodeURIComponent(zajelRef);
                    }
                    await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: metaBody
                    });
                }
            } catch (stripeError) {
                console.error('Stripe metadata update failed (non-blocking):', stripeError);
            }
        }

        // ─── 4. Send shipping email via Resend ────────────────────
        let emailSent = false;
        let emailError = null;

        if (env.RESEND_API_KEY) {
            const origin = env.SITE_URL || new URL(request.url).origin;

            const itemsList = (items || [])
                .filter(i => !i.name.toLowerCase().includes('delivery'))
                .map(i => {
                    const name = (i.name || 'Item').split(/[\n\r]/)[0].trim();
                    const parts = name.split(' — ');
                    const productName = parts[0] || name;
                    const variant = parts[1] || '';
                    return `<tr><td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">${productName}${variant ? `<br><span style="font-size:12px;color:#888;">${variant}</span>` : ''}</td><td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#666;text-align:center;white-space:nowrap;">× ${i.quantity}</td></tr>`;
                })
                .join('');

            const itemsTableHtml = itemsList ? `
                <div style="background: #f8f9fa; border-radius: 10px; overflow: hidden; margin-bottom: 25px;">
                    <div style="padding: 12px 16px; background: #eef2f5; font-size: 11px; font-weight: 700; color: #777; text-transform: uppercase; letter-spacing: 0.5px;">Order Items | عناصر الطلب</div>
                    <table style="width: 100%; border-collapse: collapse;">${itemsList}</table>
                </div>
            ` : '';

            // Tracking info box — include AWB if available
            let trackingHtml = '';
            if (zajelRef) {
                trackingHtml = `
                <div style="background: #e8f4fd; border-radius: 10px; padding: 18px 20px; margin-bottom: 25px; border-left: 3px solid #0077b6; text-align: left;">
                    <p style="margin: 0; font-size: 14px; color: #333;">
                        <strong>Tracking Number (AWB):</strong> ${zajelRef}
                    </p>
                    <p style="margin: 6px 0 0; font-size: 13px; color: #555;">
                        Shipped via <strong>Zajel</strong> — you can track your shipment using the AWB number above.
                    </p>
                    <p style="margin: 6px 0 0; font-size: 13px; color: #888; font-family: 'Almarai', Arial, sans-serif; direction: rtl; text-align: right;">
                        رقم التتبع: ${zajelRef} — تم الشحن عبر <strong>زاجل</strong>
                    </p>
                </div>`;
            }

            const html = customerEmail({
                origin,
                icon: '🚚',
                titleEn: 'Your Order Has Been Dispatched!',
                bodyEn: `Hi ${customer_name || 'there'}, great news! Your order has been dispatched and is heading your way.`,
                bodyAr: 'مرحباً، تم شحن طلبك وهو في الطريق إليك!',
                infoBoxEn: '<strong>Estimated Delivery:</strong> 2-5 business days across UAE',
                infoBoxAr: 'التوصيل المتوقع: ٢-٥ أيام عمل',
                ctaUrl: `${origin}/account.html`,
                ctaText: 'Track My Order | تتبع طلبي',
                ctaColor: '#2c4a5c',
                extraHtml: trackingHtml + itemsTableHtml,
                preheader: zajelRef
                    ? `Your order is on its way! Tracking: ${zajelRef}`
                    : 'Great news! Your ORLO Store order has been dispatched and is on its way.',
            });

            const itemsText = (items || [])
                .filter(i => !i.name.toLowerCase().includes('delivery'))
                .map(i => `- ${(i.name || 'Item').split(/[\n\r]/)[0].trim()} x${i.quantity}`)
                .join('\n');

            const trackingText = zajelRef ? `\nTracking Number (AWB): ${zajelRef}\nShipped via Zajel\n` : '';

            const text = plainText({
                titleEn: 'Your Order Has Been Dispatched!',
                bodyTextEn: `Hi ${customer_name || 'there'}, great news! Your order has been dispatched and is heading your way.\n${trackingText}\n${itemsText}`,
                bodyTextAr: 'مرحباً، تم شحن طلبك وهو في الطريق إليك!',
                infoTextEn: 'Estimated Delivery: 2-5 business days across UAE',
                infoTextAr: 'التوصيل المتوقع: ٢-٥ أيام عمل',
                ctaUrl: `${origin}/account.html`,
                ctaText: 'Track My Order',
            });

            const result = await sendEmail({
                apiKey: env.RESEND_API_KEY,
                to: custEmail,
                subject: zajelRef
                    ? `Your Order Has Been Dispatched! AWB: ${zajelRef} | تم شحن طلبك`
                    : 'Your Order Has Been Dispatched! | تم شحن طلبك',
                html,
                text,
            });

            emailSent = result.success;
            if (!result.success) {
                emailError = result.error;
                console.error('Resend error:', emailError);
            }
        } else {
            emailError = 'RESEND_API_KEY not configured';
        }

        // ─── 5. Log activity ──────────────────────────────────────
        const logDetails = zajelRef
            ? `Shipped to ${custEmail} — AWB: ${zajelRef}`
            : `Shipped to ${custEmail}${zajelError ? ' (Zajel failed: ' + zajelError + ')' : ''}`;
        await logActivity(env, user.name, 'ship_order', order_id, logDetails);

        return Response.json({
            success: true,
            email_sent: emailSent,
            email_error: emailError,
            zajel_reference: zajelRef,
            zajel_error: zajelError,
        });

    } catch (error) {
        console.error('Ship order error:', error);
        return Response.json({ error: 'Failed to process: ' + error.message }, { status: 500 });
    }
}
