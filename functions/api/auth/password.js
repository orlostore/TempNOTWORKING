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

        // Find customer by token (check expiry)
        const customer = await DB.prepare('SELECT id, password_hash, hash_version, token_created_at FROM customers WHERE token = ?')
            .bind(token)
            .first();

        if (!customer) {
            return Response.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Check token expiry (30 days)
        if (customer.token_created_at) {
            const tokenAge = Date.now() - new Date(customer.token_created_at).getTime();
            if (tokenAge > 30 * 24 * 60 * 60 * 1000) {
                return Response.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
            }
        }

        const { currentPassword, newPassword } = await request.json();

        // Verify current password (support both old and new hash)
        let currentValid = false;
        if (customer.hash_version === 2) {
            currentValid = await verifyPasswordPBKDF2(currentPassword, customer.password_hash);
        } else {
            const legacyHash = await hashPasswordLegacy(currentPassword);
            currentValid = (legacyHash === customer.password_hash);
        }

        if (!currentValid) {
            return Response.json({ error: 'Current password is incorrect' }, { status: 400 });
        }

        // Validate new password
        if (!newPassword || newPassword.length < 8) {
            return Response.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
        }

        // Hash new password with PBKDF2
        const newHash = await hashPasswordPBKDF2(newPassword);

        // Update password and set hash_version = 2
        await DB.prepare('UPDATE customers SET password_hash = ?, hash_version = 2 WHERE id = ?')
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

// Legacy SHA-256 hash (for verifying old passwords)
async function hashPasswordLegacy(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'ORLO_SALT_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// PBKDF2 password hashing
async function hashPasswordPBKDF2(password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial, 256
    );
    const saltHex = Array.from(salt, b => b.toString(16).padStart(2, '0')).join('');
    const hashHex = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
    return `pbkdf2:100000:${saltHex}:${hashHex}`;
}

async function verifyPasswordPBKDF2(password, storedHash) {
    const parts = storedHash.split(':');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
    const iterations = parseInt(parts[1]);
    const salt = new Uint8Array(parts[2].match(/.{2}/g).map(b => parseInt(b, 16)));
    const expectedHash = parts[3];
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: salt, iterations: iterations, hash: 'SHA-256' },
        keyMaterial, 256
    );
    const hashHex = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === expectedHash;
}
