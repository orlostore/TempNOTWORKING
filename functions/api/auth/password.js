// Cloudflare Pages Function - Change Password API
// Location: /functions/api/auth/password.js

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
        const customer = await DB.prepare('SELECT id, password_hash FROM customers WHERE token = ?')
            .bind(token)
            .first();
        
        if (!customer) {
            return Response.json({ error: 'Invalid token' }, { status: 401 });
        }
        
        const { currentPassword, newPassword } = await request.json();
        
        // Verify current password
        const currentHash = await hashPassword(currentPassword);
        
        if (currentHash !== customer.password_hash) {
            return Response.json({ error: 'Current password is incorrect' }, { status: 400 });
        }
        
        // Validate new password
        if (!newPassword || newPassword.length < 8) {
            return Response.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
        }
        
        // Hash new password
        const newHash = await hashPassword(newPassword);
        
        // Update password
        await DB.prepare('UPDATE customers SET password_hash = ? WHERE id = ?')
            .bind(newHash, customer.id)
            .run();
        
        return Response.json({ 
            success: true,
            message: 'Password changed successfully'
        });
        
    } catch (error) {
        console.error('Password change error:', error);
        return Response.json({ error: 'Failed to change password' }, { status: 500 });
    }
}

// Simple password hashing (must match other auth files)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'ORLO_SALT_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
