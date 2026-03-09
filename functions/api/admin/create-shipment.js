// Cloudflare Pages Function - Create Zajel Shipment
// Location: /functions/api/admin/create-shipment.js

import { getKey, getAdminUser, logActivity } from './_helpers.js';
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
            order_id,
            customer_name,
            customer_email,
            customer_phone,
            address_line_1,
            address_line_2,
            city,
            area,
            items,
            weight,
            num_pieces,
            cod_amount,
        } = await request.json();

        if (!order_id) {
            return Response.json({ error: 'order_id is required' }, { status: 400 });
        }

        // Ensure DB tables exist
        await ensureShipmentsTable(env.DB);

        // Check if shipment already exists for this order
        const existing = await env.DB.prepare(
            'SELECT id, zajel_reference, status FROM shipments WHERE order_id = ?'
        ).bind(order_id).first();

        if (existing && existing.zajel_reference) {
            return Response.json({
                success: true,
                already_exists: true,
                reference_number: existing.zajel_reference,
                status: existing.status,
                message: 'Shipment already created for this order',
            });
        }

        // Build item description
        const desc = (items || [])
            .filter(i => !i.name.toLowerCase().includes('delivery'))
            .map(i => `${i.name} x${i.quantity}`)
            .join(', ')
            .slice(0, 150) || 'ORLO Store Order';

        // Build shipment payload
        const payload = createShipmentPayload(env, {
            customerReference: order_id.slice(-12),
            customerName: customer_name,
            customerPhone: customer_phone,
            customerEmail: customer_email,
            addressLine1: address_line_1,
            addressLine2: address_line_2,
            destinationCity: city,
            destinationArea: area,
            description: desc,
            weight: weight || 0.5,
            numPieces: num_pieces || 1,
            codAmount: cod_amount || 0,
        });

        // Call Zajel CreateShipment API
        const result = await zajelApi(env, {
            method: 'POST',
            endpoint: '/api/Merchant/CreateShipment',
            body: payload,
        });

        // Zajel returns referenceNumber on success (may or may not include a 'success' field)
        if (result.ok && result.data?.referenceNumber) {
            const ref = result.data.referenceNumber;
            const custRef = result.data.customerReferenceNumber;

            // Save to DB
            if (existing) {
                await env.DB.prepare(`
                    UPDATE shipments SET
                        zajel_reference = ?, customer_reference = ?, status = 'created',
                        zajel_status = 'softdata_upload', updated_at = datetime('now')
                    WHERE order_id = ?
                `).bind(ref, custRef, order_id).run();
            } else {
                await env.DB.prepare(`
                    INSERT INTO shipments (order_id, zajel_reference, customer_reference, status, zajel_status,
                        customer_name, customer_email, customer_phone, destination_city, destination_address,
                        weight_kg, num_pieces, cod_amount)
                    VALUES (?, ?, ?, 'created', 'softdata_upload', ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    order_id, ref, custRef,
                    customer_name || '', customer_email || '', customer_phone || '',
                    resolveCity(city), address_line_1 || '',
                    weight || 0.5, num_pieces || 1, cod_amount || 0
                ).run();
            }

            await logActivity(env, user.name, 'create_shipment', order_id,
                `Zajel AWB: ${ref} for ${customer_name || customer_email}`);

            return Response.json({
                success: true,
                reference_number: ref,
                customer_reference_number: custRef,
                pieces: result.data.pieces || [],
            });
        }

        // Handle Zajel API errors — log full response for debugging
        console.error('Zajel API rejected:', JSON.stringify(result.data));
        let errorMsg = 'Unknown Zajel error';
        if (result.data?.errors && typeof result.data.errors === 'object') {
            errorMsg = Object.entries(result.data.errors)
                .map(([k, v]) => {
                    const msgs = Array.isArray(v) ? v.join(', ') : String(v);
                    return k ? `${k}: ${msgs}` : msgs;
                })
                .join('; ');
        } else if (result.data?.title) {
            errorMsg = result.data.title;
        } else if (result.data?.message) {
            errorMsg = result.data.message;
        } else if (result.data?.raw) {
            errorMsg = result.data.raw;
        }

        // Save failed attempt
        if (!existing) {
            await env.DB.prepare(`
                INSERT INTO shipments (order_id, status, failure_reason,
                    customer_name, customer_email, customer_phone, destination_city, destination_address)
                VALUES (?, 'failed', ?, ?, ?, ?, ?, ?)
            `).bind(
                order_id, errorMsg,
                customer_name || '', customer_email || '', customer_phone || '',
                resolveCity(city), address_line_1 || ''
            ).run();
        } else {
            await env.DB.prepare(`
                UPDATE shipments SET status = 'failed', failure_reason = ?, updated_at = datetime('now')
                WHERE order_id = ?
            `).bind(errorMsg, order_id).run();
        }

        return Response.json({
            success: false,
            error: errorMsg,
            zajel_status: result.status,
            zajel_raw: result.data,
        }, { status: 400 });

    } catch (error) {
        console.error('Create shipment error:', error);
        return Response.json({ error: 'Failed to create shipment: ' + error.message }, { status: 500 });
    }
}
