// Cloudflare Pages Function - Get Zajel Shipment Label (AWB)
// Location: /functions/api/admin/shipment-label.js

import { getKey, getAdminUser } from './_helpers.js';
import { zajelApi, ensureShipmentsTable } from './zajel.js';

export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        // Support both header auth and query param auth (for opening in new tab)
        const url = new URL(request.url);
        const key = getKey(request) || url.searchParams.get('key');
        const user = await getAdminUser(env, key);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orderId = url.searchParams.get('order_id');
        const refNumber = url.searchParams.get('reference_number');

        if (!orderId && !refNumber) {
            return Response.json({ error: 'order_id or reference_number required' }, { status: 400 });
        }

        await ensureShipmentsTable(env.DB);

        // Get Zajel reference from DB
        let zajelRef = refNumber;
        if (!zajelRef && orderId) {
            const shipment = await env.DB.prepare(
                'SELECT zajel_reference FROM shipments WHERE order_id = ?'
            ).bind(orderId).first();
            zajelRef = shipment?.zajel_reference;
        }

        if (!zajelRef) {
            return Response.json({ error: 'No Zajel reference found' }, { status: 404 });
        }

        // Call Zajel GetShipmentLabel API — returns PDF binary
        const result = await zajelApi(env, {
            method: 'GET',
            endpoint: '/api/Merchant/GetShipmentLabel',
            params: { reference_number: zajelRef },
        });

        if (result.ok && result.response) {
            const pdfBuffer = await result.response.arrayBuffer();
            return new Response(pdfBuffer, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `inline; filename="AWB-${zajelRef}.pdf"`,
                },
            });
        }

        return Response.json({
            success: false,
            error: 'Failed to fetch label from Zajel',
        }, { status: 400 });

    } catch (error) {
        console.error('Shipment label error:', error);
        return Response.json({ error: 'Failed to get label: ' + error.message }, { status: 500 });
    }
}
