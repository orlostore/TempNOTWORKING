// Cloudflare Pages Function - Change Password API
// Location: /functions/api/auth/password.js

import { safeCompareHex, hashPasswordLegacy, hashPasswordPBKDF2, verifyPasswordPBKDF2 } from './crypto-utils.js';

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
            currentValid = safeCompareHex(legacyHash, customer.password_hash);
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
