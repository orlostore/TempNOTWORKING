// Cloudflare Pages Function — Set a customer address as default
// Location: /functions/api/auth/addresses/[id]/default.js
// Route: PUT /api/auth/addresses/{id}/default

import { verifyToken } from '../../addresses.js';

export async function onRequestPut(context) {
    const { env, request, params } = context;
    const DB = env.DB;

    try {
        const customer = await verifyToken(request, DB);
        if (!customer) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const addressId = params.id;
        if (!addressId) return Response.json({ error: 'Address ID required' }, { status: 400 });

        await DB.prepare('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?')
            .bind(customer.id).run();
        await DB.prepare('UPDATE customer_addresses SET is_default = 1 WHERE id = ? AND customer_id = ?')
            .bind(addressId, customer.id).run();

        return Response.json({ success: true });
    } catch (error) {
        console.error('Set default address error:', error);
        return Response.json({ error: 'Failed to set default address' }, { status: 500 });
    }
}
