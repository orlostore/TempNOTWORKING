// Cloudflare Pages Function - Zajel Webhook Receiver
// Location: /functions/api/zajel-webhook.js
// Receives status updates from Zajel about shipment events
// Give this URL to Zajel: https://orlostore.com/api/zajel-webhook

// GET handler — lets Zajel (or you) verify the webhook URL is alive
export async function onRequestGet() {
    return Response.json({ status: 'ok', endpoint: 'zajel-webhook', accepts: 'POST' });
}

export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        console.log('Zajel webhook hit — headers:', JSON.stringify(Object.fromEntries(request.headers)));

        // Verify webhook auth — skip if ZAJEL_WEBHOOK_SECRET is not set
        const webhookSecret = env.ZAJEL_WEBHOOK_SECRET;
        if (webhookSecret) {
            const authHeader = request.headers.get('Authorization') || '';
            const apiKeyHeader = request.headers.get('X-AUTH-API-KEY') || request.headers.get('x-api-key') || '';

            const isValid = apiKeyHeader === webhookSecret
                || authHeader === `Bearer ${webhookSecret}`
                || authHeader === `Basic ${btoa(webhookSecret)}`;

            if (!isValid) {
                console.error('Zajel webhook: auth FAILED — apiKey:', apiKeyHeader ? 'present' : 'missing', 'auth:', authHeader ? 'present' : 'missing');
                return Response.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const rawBody = await request.text();
        console.log('Zajel webhook payload:', rawBody);
        let payload;
        try { payload = JSON.parse(rawBody); } catch {
            return Response.json({ error: 'Invalid JSON', body: rawBody.slice(0, 200) }, { status: 400 });
        }

        const {
            reference_number,
            customer_reference_number,
            status,
            event_date_time,
            description,
            received_by,
            delivery_courier,
            pod,
            failure_reason,
        } = payload;

        if (!reference_number || !status) {
            return Response.json({ error: 'reference_number and status required' }, { status: 400 });
        }

        const DB = env.DB;
        if (!DB) {
            return Response.json({ error: 'Database not available' }, { status: 500 });
        }

        // Ensure tables exist
        await DB.prepare(`
            CREATE TABLE IF NOT EXISTS shipments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT NOT NULL UNIQUE,
                zajel_reference TEXT,
                customer_reference TEXT,
                status TEXT DEFAULT 'pending',
                zajel_status TEXT,
                zajel_status_date TEXT,
                customer_name TEXT,
                customer_email TEXT,
                customer_phone TEXT,
                destination_city TEXT,
                destination_address TEXT,
                weight_kg REAL DEFAULT 0.5,
                num_pieces INTEGER DEFAULT 1,
                cod_amount REAL DEFAULT 0,
                label_url TEXT,
                failure_reason TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `).run();

        await DB.prepare(`
            CREATE TABLE IF NOT EXISTS shipment_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shipment_id INTEGER NOT NULL,
                zajel_reference TEXT,
                status TEXT NOT NULL,
                description TEXT,
                event_date TEXT,
                received_by TEXT,
                delivery_courier TEXT,
                failure_reason TEXT,
                raw_payload TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
            )
        `).run();

        // Find shipment by Zajel reference
        const shipment = await DB.prepare(
            'SELECT id, order_id, zajel_status FROM shipments WHERE zajel_reference = ?'
        ).bind(reference_number).first();

        if (!shipment) {
            console.error(`Zajel webhook: unknown reference ${reference_number}`);
            // Accept the webhook but log it — don't return 404 or Zajel will retry
            return Response.json({
                success: true,
                message: 'Reference not found locally, event logged',
            });
        }

        // Map Zajel status to our internal status
        const statusMap = {
            'softdata_upload': 'created',
            'softdata_update': 'created',
            'pickup_awaited': 'pickup_awaited',
            'pickup_completed': 'picked_up',
            'inscan_at_hub': 'in_transit',
            'reachedathub': 'in_transit',
            'outfordelivery': 'out_for_delivery',
            'delivered': 'delivered',
            'attempted': 'attempted',
            'on_hold': 'on_hold',
            'cancelled': 'cancelled',
            'rto': 'rto',
            'rto_attempted': 'rto',
            'rto_delivered': 'rto_delivered',
        };

        const internalStatus = statusMap[status.toLowerCase()] || status.toLowerCase();

        // Update shipment status
        await DB.prepare(`
            UPDATE shipments SET
                zajel_status = ?, zajel_status_date = ?, status = ?,
                failure_reason = ?, updated_at = datetime('now')
            WHERE id = ?
        `).bind(
            status,
            event_date_time || new Date().toISOString(),
            internalStatus,
            failure_reason || null,
            shipment.id
        ).run();

        // Log the event
        await DB.prepare(`
            INSERT INTO shipment_events (shipment_id, zajel_reference, status, description,
                event_date, received_by, delivery_courier, failure_reason, raw_payload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            shipment.id,
            reference_number,
            status,
            description || '',
            event_date_time || '',
            received_by || '',
            delivery_courier || '',
            failure_reason || '',
            JSON.stringify(payload)
        ).run();

        // If delivered, update shipped_orders table too
        if (status.toLowerCase() === 'delivered') {
            try {
                await DB.prepare(`
                    INSERT OR REPLACE INTO shipped_orders (order_id, shipped_at)
                    VALUES (?, datetime('now'))
                `).bind(shipment.order_id).run();
            } catch (e) {
                console.error('shipped_orders update error:', e);
            }
        }

        return Response.json({
            success: true,
            message: `Status updated to ${status}`,
            order_id: shipment.order_id,
        });

    } catch (error) {
        console.error('Zajel webhook error:', error);
        // Always return 200 to prevent Zajel from retrying on our errors
        return Response.json({
            success: false,
            error: error.message,
        }, { status: 200 });
    }
}
