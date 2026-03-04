// Cloudflare Pages Function - Activity Log API
// GET: Fetch recent activity
// Location: /functions/api/admin/activity.js

import { getKey, getAdminUser } from './_helpers.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const key = getKey(request);

    const user = await getAdminUser(env, key);
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit')) || 50;

        const { results } = await env.DB.prepare(
            'SELECT id, admin_name, action, target, details, created_at FROM activity_log ORDER BY id DESC LIMIT ?'
        ).bind(limit).all();

        return Response.json({ success: true, activities: results });
    } catch (error) {
        console.error('Activity log fetch error:', error);
        return Response.json({ error: 'Failed to fetch activity log' }, { status: 500 });
    }
}
