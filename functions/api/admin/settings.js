// Cloudflare Pages Function - Admin Settings API (delivery fees, etc.)
// Location: /functions/api/admin/settings.js

function safeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const encoder = new TextEncoder();
    const aBuf = encoder.encode(a);
    const bBuf = encoder.encode(b);
    if (aBuf.length !== bBuf.length) return false;
    let result = 0;
    for (let i = 0; i < aBuf.length; i++) result |= aBuf[i] ^ bBuf[i];
    return result === 0;
}

export async function onRequestGet(context) {
    const { env, request } = context;

    const authHeader = request.headers.get('Authorization');
    const key = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!safeCompare(key, env.ADMIN_KEY)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Ensure table exists
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS admin_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        `).run();

        const { results } = await env.DB.prepare('SELECT key, value FROM admin_settings').all();
        const settings = {};
        for (const row of results) {
            settings[row.key] = row.value;
        }

        return Response.json({ success: true, settings });
    } catch (error) {
        console.error('Settings fetch error:', error);
        return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { env, request } = context;

    const authHeader = request.headers.get('Authorization');
    const key = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!safeCompare(key, env.ADMIN_KEY)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Ensure table exists
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS admin_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        `).run();

        const body = await request.json();

        // Save each key-value pair
        for (const [k, v] of Object.entries(body)) {
            await env.DB.prepare(`
                INSERT OR REPLACE INTO admin_settings (key, value) VALUES (?, ?)
            `).bind(k, String(v)).run();
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Settings save error:', error);
        return Response.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
