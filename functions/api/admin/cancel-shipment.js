// Cloudflare Pages Function - Cancel Zajel Shipment
// Location: /functions/api/admin/cancel-shipment.js

import { getKey, getAdminUser, logActivity } from './_helpers.js';
import { zajelApi, ensureShipmentsTable } from './zajel.js';

export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const key = getKey(request);
        const user = await getAdminUser(env, key);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { order_id, reference_number } = await request.json();

        if (!order_id && !reference_number) {
            return Response.json({ error: 'order_id or reference_number required' }, { status: 400 });
        }

        await ensureShipmentsTable(env.DB);

        // Get Zajel reference from DB
        let zajelRef = reference_number;
        let shipment;
        if (order_id) {
            shipment = await env.DB.prepare(
                'SELECT id, zajel_reference, zajel_status FROM shipments WHERE order_id = ?'
            ).bind(order_id).first();
            zajelRef = shipment?.zajel_reference || zajelRef;
        }

        if (!zajelRef) {
            return Response.json({ error: 'No Zajel reference found' }, { status: 404 });
        }

        // Call Zajel CancelShipment API (only works for pickup_awaited status)
        const result = await zajelApi(env, {
            method: 'POST',
            endpoint: '/api/Merchant/CancelShipment',
            body: { reference_number: zajelRef },
        });

        const success = result.data?.success === true;

        // Update local DB
        if (shipment) {
            await env.DB.prepare(`
                UPDATE shipments SET
                    status = ?, zajel_status = ?, updated_at = datetime('now'),
                    failure_reason = ?
                WHERE id = ?
            `).bind(
                success ? 'cancelled' : shipment.status || 'created',
                success ? 'cancelled' : shipment.zajel_status || '',
                success ? null : (result.data?.message || 'Cancellation failed'),
                shipment.id
            ).run();
        }

        await logActivity(env, user.name, 'cancel_shipment',
            order_id || zajelRef,
            success ? `Cancelled AWB: ${zajelRef}` : `Cancel failed: ${result.data?.message || 'unknown'}`
        );

        return Response.json({
            success,
            message: result.data?.message || (success ? 'Shipment cancelled' : 'Cancellation failed'),
            reference_number: zajelRef,
        });

    } catch (error) {
        console.error('Cancel shipment error:', error);
        return Response.json({ error: 'Failed to cancel: ' + error.message }, { status: 500 });
    }
}
