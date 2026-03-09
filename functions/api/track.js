// Cloudflare Pages Function - Public Shipment Tracking
// Location: /functions/api/track.js
// No auth required — customer-facing endpoint

import { zajelApi, ensureShipmentsTable } from './admin/zajel.js';

export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const awb = url.searchParams.get('awb');

        if (!awb) {
            return Response.json({ error: 'awb parameter required' }, { status: 400 });
        }

        await ensureShipmentsTable(env.DB);

        // Verify this AWB exists in our shipments table (only allow tracking our own shipments)
        const shipment = await env.DB.prepare(
            'SELECT order_id, zajel_reference, customer_name, zajel_status, zajel_status_date FROM shipments WHERE zajel_reference = ?'
        ).bind(awb).first();

        if (!shipment) {
            return Response.json({ error: 'Shipment not found' }, { status: 404 });
        }

        // Call Zajel TrackShipment API
        const result = await zajelApi(env, {
            method: 'GET',
            endpoint: '/api/Merchant/TrackShipment',
            params: { reference_number: awb },
        });

        if (result.ok && result.data) {
            // Update local DB with latest status
            try {
                await env.DB.prepare(`
                    UPDATE shipments SET
                        zajel_status = ?, zajel_status_date = ?, updated_at = datetime('now')
                    WHERE zajel_reference = ?
                `).bind(
                    result.data.status || shipment.zajel_status,
                    result.data.status_applied_on || '',
                    awb
                ).run();
            } catch (e) {}

            return Response.json({
                success: true,
                awb: awb,
                status: result.data.status || shipment.zajel_status,
                status_date: result.data.status_applied_on || shipment.zajel_status_date,
                reference: result.data.customer_reference_number || '',
            });
        }

        // Fallback to cached status from DB
        return Response.json({
            success: true,
            awb: awb,
            status: shipment.zajel_status || 'unknown',
            status_date: shipment.zajel_status_date || '',
            cached: true,
        });

    } catch (error) {
        console.error('Public track error:', error);
        return Response.json({ error: 'Tracking unavailable' }, { status: 500 });
    }
}
