// Cloudflare Pages Function - Customer Profile API
// Location: /functions/api/auth/profile.js

export async function onRequestPut(context) {
    const { env, request } = context;
    const DB = env.DB;
    
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const token = authHeader.replace('Bearer ', '');
        
        // Find customer by token
        const customer = await DB.prepare('SELECT id, token_created_at FROM customers WHERE token = ?')
            .bind(token)
            .first();

        if (!customer) {
            return Response.json({ error: 'Invalid token' }, { status: 401 });
        }
        if (customer.token_created_at && (Date.now() - new Date(customer.token_created_at).getTime() > 30*24*60*60*1000)) {
            return Response.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
        }
        
        const { name, phone } = await request.json();
        
        // Update profile
        await DB.prepare('UPDATE customers SET name = ?, phone = ? WHERE id = ?')
            .bind(name, phone || '', customer.id)
            .run();
        
        return Response.json({ 
            success: true,
            message: 'Profile updated'
        });
        
    } catch (error) {
        console.error('Profile update error:', error);
        return Response.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

export async function onRequestGet(context) {
    const { env, request } = context;
    const DB = env.DB;
    
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const token = authHeader.replace('Bearer ', '');
        
        // Find customer by token
        const customer = await DB.prepare(`
            SELECT id, email, name, phone, email_verified, created_at, token_created_at
            FROM customers
            WHERE token = ?
        `).bind(token).first();

        if (!customer) {
            return Response.json({ error: 'Invalid token' }, { status: 401 });
        }
        if (customer.token_created_at && (Date.now() - new Date(customer.token_created_at).getTime() > 30*24*60*60*1000)) {
            return Response.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
        }
        
        return Response.json({ 
            success: true,
            customer: {
                id: customer.id,
                email: customer.email,
                name: customer.name,
                phone: customer.phone,
                email_verified: customer.email_verified === 1,
                created_at: customer.created_at
            }
        });
        
    } catch (error) {
        console.error('Profile fetch error:', error);
        return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}
