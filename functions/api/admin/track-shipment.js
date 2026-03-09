// Cloudflare Pages Function - Track Zajel Shipment
// Location: /functions/api/admin/track-shipment.js

import { getKey, getAdminUser } from './_helpers.js';
import { zajelApi, ensureShipmentsTable } from './zajel.js';

export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const key = getKey(request);
        const user = await getAdminUser(env, key);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const orderId = url.searchParams.get('order_id');
        const refNumber = url.searchParams.get('reference_number');

        if (!orderId && !refNumber) {
            return Response.json({ error: 'order_id or reference_number required' }, { status: 400 });
        }

        await ensureShipmentsTable(env.DB);

        // Get shipment from DB
        let shipment;
        if (orderId) {
            shipment = await env.DB.prepare(
                'SELECT * FROM shipments WHERE order_id = ?'
            ).bind(orderId).first();
        } else {
            shipment = await env.DB.prepare(
                'SELECT * FROM shipments WHERE zajel_reference = ?'
            ).bind(refNumber).first();
        }

        if (!shipment || !shipment.zajel_reference) {
            return Response.json({
                success: false,
                error: 'No Zajel shipment found for this order',
                shipment: shipment || null,
            }, { status: 404 });
        }

        // Call Zajel TrackShipment API
        const result = await zajelApi(env, {
            method: 'GET',
            endpoint: '/api/Merchant/TrackShipment',
            params: { reference_number: shipment.zajel_reference },
        });

        if (result.ok && result.data) {
            // Update local DB with latest status
            await env.DB.prepare(`
                UPDATE shipments SET
                    zajel_status = ?, zajel_status_date = ?, updated_at = datetime('now')
                WHERE id = ?
            `).bind(
                result.data.status || shipment.zajel_status,
                result.data.status_applied_on || '',
                shipment.id
            ).run();

            return Response.json({
                success: true,
                tracking: result.data,
                shipment: {
                    order_id: shipment.order_id,
                    zajel_reference: shipment.zajel_reference,
                    status: result.data.status || shipment.zajel_status,
                    created_at: shipment.created_at,
                },
            });
        }

        return Response.json({
            success: false,
            error: 'Failed to track shipment',
            zajel_status: result.status,
            shipment: {
                order_id: shipment.order_id,
                zajel_reference: shipment.zajel_reference,
                status: shipment.zajel_status,
            },
        });

    } catch (error) {
        console.error('Track shipment error:', error);
        return Response.json({ error: 'Failed to track: ' + error.message }, { status: 500 });
    }
}
