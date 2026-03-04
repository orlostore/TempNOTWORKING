// Cloudflare Pages Function - Admin User Management
// Only super admin (env.ADMIN_KEY) can manage users
// Location: /functions/api/admin/users.js

import { getKey, getAdminUser, hashKey } from './_helpers.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const key = getKey(request);
    const user = await getAdminUser(env, key);

    if (!user || user.role !== 'superadmin') {
        return Response.json({ error: 'Only super admin can manage users' }, { status: 403 });
    }

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

        const { results } = await env.DB.prepare(
            'SELECT id, name, role, created_at FROM admin_users ORDER BY id'
        ).all();

        return Response.json({ success: true, users: results });
    } catch (error) {
        return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const key = getKey(request);
    const user = await getAdminUser(env, key);

    if (!user || user.role !== 'superadmin') {
        return Response.json({ error: 'Only super admin can manage users' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { action } = body;

        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                key_hash TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                created_at TEXT DEFAULT (datetime('now'))
            )
        `).run();

        if (action === 'add') {
            const { name, userKey, role } = body;
            if (!name || !userKey) {
                return Response.json({ error: 'Name and key are required' }, { status: 400 });
            }
            if (userKey.length < 6) {
                return Response.json({ error: 'Key must be at least 6 characters' }, { status: 400 });
            }

            const keyHash = await hashKey(userKey);

            await env.DB.prepare(
                'INSERT INTO admin_users (name, key_hash, role) VALUES (?, ?, ?)'
            ).bind(name, keyHash, role || 'admin').run();

            return Response.json({ success: true });
        }

        if (action === 'delete') {
            const { id } = body;
            if (!id) return Response.json({ error: 'Missing user id' }, { status: 400 });

            await env.DB.prepare('DELETE FROM admin_users WHERE id = ?').bind(id).run();
            return Response.json({ success: true });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return Response.json({ error: 'Failed: ' + error.message }, { status: 500 });
    }
}
