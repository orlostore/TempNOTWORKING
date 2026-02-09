// Cloudflare Pages Function - Customer Addresses API
// Location: /functions/api/auth/addresses.js

export async function onRequestGet(context) {
    const { env, request } = context;
    const DB = env.DB;
    
    try {
        const customer = await verifyToken(request, DB);
        if (!customer) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const { results } = await DB.prepare(`
            SELECT id, full_name, phone, street, building, area, emirate, landmark, address_type, is_default
            FROM customer_addresses
            WHERE customer_id = ?
            ORDER BY is_default DESC, id DESC
        `).bind(customer.id).all();
        
        return Response.json({ 
            success: true,
            addresses: results 
        });
        
    } catch (error) {
        console.error('Addresses fetch error:', error);
        return Response.json({ error: 'Failed to fetch addresses' }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { env, request } = context;
    const DB = env.DB;
    
    try {
        const customer = await verifyToken(request, DB);
        if (!customer) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const { full_name, phone, street, building, area, emirate, landmark, address_type, is_default } = await request.json();
        
        // Validate required fields
        if (!full_name || !phone || !street || !building || !area || !emirate) {
            return Response.json({ error: 'Please fill all required fields' }, { status: 400 });
        }
        
        // If setting as default, unset other defaults first
        if (is_default) {
            await DB.prepare('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?')
                .bind(customer.id)
                .run();
        }
        
        const result = await DB.prepare(`
            INSERT INTO customer_addresses (customer_id, full_name, phone, street, building, area, emirate, landmark, address_type, is_default)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            customer.id,
            full_name,
            phone,
            street,
            building,
            area,
            emirate,
            landmark || '',
            address_type || 'Home',
            is_default ? 1 : 0
        ).run();
        
        return Response.json({ 
            success: true,
            id: result.meta.last_row_id
        });
        
    } catch (error) {
        console.error('Address add error:', error);
        return Response.json({ error: 'Failed to add address' }, { status: 500 });
    }
}

export async function onRequestDelete(context) {
    const { env, request } = context;
    const DB = env.DB;
    
    try {
        const customer = await verifyToken(request, DB);
        if (!customer) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Get address ID from URL
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const addressId = pathParts[pathParts.length - 1];
        
        if (!addressId || addressId === 'addresses') {
            return Response.json({ error: 'Address ID required' }, { status: 400 });
        }
        
        // Delete only if belongs to customer
        await DB.prepare('DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?')
            .bind(addressId, customer.id)
            .run();
        
        return Response.json({ success: true });
        
    } catch (error) {
        console.error('Address delete error:', error);
        return Response.json({ error: 'Failed to delete address' }, { status: 500 });
    }
}

// Helper function to verify token
async function verifyToken(request, DB) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const customer = await DB.prepare('SELECT id, email FROM customers WHERE token = ?')
        .bind(token)
        .first();
    
    return customer;
}
