// Cloudflare Pages Function - Reset Password (with token) API
// Location: /functions/api/auth/reset-password.js

import { hashPasswordPBKDF2, safeCompareHex } from './crypto-utils.js';

export async function onRequestPost(context) {
    const { env, request } = context;
    const DB = env.DB;

    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return Response.json({ error: 'Token and password are required' }, { status: 400 });
        }

        if (password.length < 8) {
            return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        // Find customer by reset token
        const customer = await DB.prepare(
            'SELECT id, reset_token, reset_expiry FROM customers WHERE reset_token = ?'
        ).bind(token).first();

        if (!customer) {
            return Response.json({ error: 'Invalid or expired reset link' }, { status: 400 });
        }

        // Constant-time comparison of the token
        if (!safeCompareHex(token, customer.reset_token)) {
            return Response.json({ error: 'Invalid or expired reset link' }, { status: 400 });
        }

        // Check token expiry
        if (customer.reset_expiry && new Date(customer.reset_expiry) < new Date()) {
            // Clear expired token
            await DB.prepare(
                'UPDATE customers SET reset_token = NULL, reset_expiry = NULL WHERE id = ?'
            ).bind(customer.id).run();
            return Response.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 });
        }

        // Hash new password with PBKDF2
        const newHash = await hashPasswordPBKDF2(password);

        // Update password, clear reset token, set hash_version = 2
        await DB.prepare(`
            UPDATE customers
            SET password_hash = ?, hash_version = 2, reset_token = NULL, reset_expiry = NULL
            WHERE id = ?
        `).bind(newHash, customer.id).run();

        return Response.json({
            success: true,
            message: 'Password has been reset successfully'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return Response.json({ error: 'Failed to reset password' }, { status: 500 });
    }
}
