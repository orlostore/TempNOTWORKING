// Shared admin helpers — NOT an endpoint (no onRequest* exports)
// Used by other admin functions via: import { getAdminUser, logActivity } from './_helpers.js';

export function safeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const encoder = new TextEncoder();
    const aBuf = encoder.encode(a);
    const bBuf = encoder.encode(b);
    if (aBuf.length !== bBuf.length) return false;
    let result = 0;
    for (let i = 0; i < aBuf.length; i++) result |= aBuf[i] ^ bBuf[i];
    return result === 0;
}

export function getKey(request) {
    const authHeader = request.headers.get('Authorization');
    return authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

/**
 * Identify which admin user is making the request.
 * Checks admin_users table first, then falls back to env.ADMIN_KEY (super admin).
 * Returns { name, role } or null if unauthorized.
 */
export async function getAdminUser(env, key) {
    if (!key) return null;

    // Check admin_users table
    if (env.DB) {
        try {
            await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS admin_users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    key_hash TEXT NOT NULL,
                    role TEXT DEFAULT 'admin',
                    created_at TEXT DEFAULT (datetime('now'))
                )
            `).run();

            const { results } = await env.DB.prepare('SELECT name, key_hash, role FROM admin_users').all();
            for (const user of results) {
                // Hash the provided key and compare
                const hash = await hashKey(key);
                if (user.key_hash === hash) {
                    return { name: user.name, role: user.role || 'admin' };
                }
            }
        } catch (e) {
            console.error('admin_users lookup error:', e);
        }
    }

    // Fallback: env.ADMIN_KEY = super admin
    if (safeCompare(key, env.ADMIN_KEY)) {
        return { name: 'Super Admin', role: 'superadmin' };
    }

    return null;
}

/**
 * Hash a key with SHA-256 for storage/comparison
 */
export async function hashKey(key) {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Log an admin action to the activity_log table
 */
export async function logActivity(env, adminName, action, target, details) {
    if (!env.DB) return;
    try {
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                admin_name TEXT NOT NULL,
                action TEXT NOT NULL,
                target TEXT,
                details TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `).run();

        await env.DB.prepare(`
            INSERT INTO activity_log (admin_name, action, target, details)
            VALUES (?, ?, ?, ?)
        `).bind(adminName, action, target || '', details || '').run();
    } catch (e) {
        console.error('Activity log error:', e);
    }
}
