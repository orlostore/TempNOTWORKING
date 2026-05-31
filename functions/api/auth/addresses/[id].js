// Cloudflare Pages Function — Customer Address: update + delete by id
// Location: /functions/api/auth/addresses/[id].js
// Routes:
//   PUT    /api/auth/addresses/{id}  → update fields
//   DELETE /api/auth/addresses/{id}  → delete

import { verifyToken } from '../addresses.js';

export async function onRequestPut(context) {
    const { env, request, params } = context;
    const DB = env.DB;

    try {
        const customer = await verifyToken(request, DB);
        if (!customer) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const addressId = params.id;
        if (!addressId) return Response.json({ error: 'Address ID required' }, { status: 400 });

        const { full_name, phone, street, building, area, emirate, landmark, address_type, is_default } = await request.json();

        if (!full_name || !phone || !street || !area || !emirate) {
            return Response.json({ error: 'All required fields must be filled' }, { status: 400 });
        }

        if (is_default) {
            await DB.prepare('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?')
                .bind(customer.id).run();
        }

        await DB.prepare(`
            UPDATE customer_addresses
            SET full_name = ?, phone = ?, street = ?, building = ?, area = ?, emirate = ?, landmark = ?, address_type = ?, is_default = ?
            WHERE id = ? AND customer_id = ?
        `).bind(
            full_name, phone, street, building || '', area, emirate,
            landmark || '', address_type || 'home', is_default ? 1 : 0,
            addressId, customer.id
        ).run();

        return Response.json({ success: true });
    } catch (error) {
        console.error('Update address error:', error);
        return Response.json({ error: 'Failed to update address' }, { status: 500 });
    }
}

export async function onRequestDelete(context) {
    const { env, request, params } = context;
    const DB = env.DB;

    try {
        const customer = await verifyToken(request, DB);
        if (!customer) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const addressId = params.id;
        if (!addressId) return Response.json({ error: 'Address ID required' }, { status: 400 });

        await DB.prepare('DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?')
            .bind(addressId, customer.id).run();

        return Response.json({ success: true });
    } catch (error) {
        console.error('Delete address error:', error);
        return Response.json({ error: 'Failed to delete address' }, { status: 500 });
    }
}
