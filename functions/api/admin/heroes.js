// Cloudflare Pages Function - Hero CRUD admin API
// Location: /functions/api/admin/heroes.js
// Handles: list / add / update / delete / activate site heroes

import { getKey, getAdminUser, logActivity } from './_helpers.js';

const MAX_HEROES = 4;

const DEFAULT_HERO = {
    name: 'Default — Vintage Camper Van',
    image_url: 'https://images.orlostore.com/vintage-camper-van/lifestyle.webp',
    title: 'Objects with character.',
    title_em: '',
    subtitle: 'From the dashboard to the desk — small things that say something.',
    cta_text: 'Browse the collection',
    cta_text_ar: 'تصفّح المجموعة',
    cta_link: '#popular-now',
    is_active: 1,
    sort_order: 0
};

async function ensureSchema(DB) {
    try {
        await DB.prepare(`
            CREATE TABLE IF NOT EXISTS site_heroes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                image_url TEXT NOT NULL,
                title TEXT,
                title_em TEXT,
                subtitle TEXT,
                cta_text TEXT,
                cta_text_ar TEXT,
                cta_link TEXT,
                is_active INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `).run();
    } catch (e) { /* ignore */ }
    // Seed default if empty
    const row = await DB.prepare('SELECT COUNT(*) as c FROM site_heroes').first();
    if (!row || row.c === 0) {
        await DB.prepare(`
            INSERT INTO site_heroes (name, image_url, title, title_em, subtitle, cta_text, cta_text_ar, cta_link, is_active, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
        `).bind(
            DEFAULT_HERO.name, DEFAULT_HERO.image_url, DEFAULT_HERO.title, DEFAULT_HERO.title_em,
            DEFAULT_HERO.subtitle, DEFAULT_HERO.cta_text, DEFAULT_HERO.cta_text_ar, DEFAULT_HERO.cta_link
        ).run();
    }
}

export async function onRequestGet(context) {
    const { env, request } = context;
    const key = getKey(request);
    const user = await getAdminUser(env, key);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const DB = env.DB;
    await ensureSchema(DB);
    const result = await DB.prepare('SELECT * FROM site_heroes ORDER BY sort_order ASC, id ASC').all();
    return Response.json({ heroes: result.results || [] });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const key = getKey(request);
    const action = url.searchParams.get('action');
    const id = url.searchParams.get('id');
    const user = await getAdminUser(env, key);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const DB = env.DB;
    await ensureSchema(DB);

    try {
        const data = action === 'delete' || action === 'activate' ? {} : await request.json();

        if (action === 'add') {
            const countRow = await DB.prepare('SELECT COUNT(*) as c FROM site_heroes').first();
            if (countRow.c >= MAX_HEROES) {
                return Response.json({ error: `Maximum ${MAX_HEROES} heroes — delete one first` }, { status: 400 });
            }
            const result = await DB.prepare(`
                INSERT INTO site_heroes (name, image_url, title, title_em, subtitle, cta_text, cta_text_ar, cta_link, is_active, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
            `).bind(
                data.name || 'Untitled hero',
                data.image_url || '',
                data.title || '',
                data.title_em || '',
                data.subtitle || '',
                data.cta_text || '',
                data.cta_text_ar || '',
                data.cta_link || '',
                countRow.c
            ).run();
            await logActivity(env, user.name, 'add_hero', `hero:${result.meta?.last_row_id}`, data.name);
            return Response.json({ success: true, id: result.meta?.last_row_id });
        }

        if (action === 'update' && id) {
            await DB.prepare(`
                UPDATE site_heroes SET
                    name = ?, image_url = ?, title = ?, title_em = ?, subtitle = ?,
                    cta_text = ?, cta_text_ar = ?, cta_link = ?
                WHERE id = ?
            `).bind(
                data.name || '', data.image_url || '',
                data.title || '', data.title_em || '',
                data.subtitle || '', data.cta_text || '',
                data.cta_text_ar || '', data.cta_link || '',
                id
            ).run();
            await logActivity(env, user.name, 'update_hero', `hero:${id}`, data.name);
            return Response.json({ success: true });
        }

        if (action === 'delete' && id) {
            const countRow = await DB.prepare('SELECT COUNT(*) as c FROM site_heroes').first();
            if (countRow.c <= 1) {
                return Response.json({ error: 'Cannot delete — at least one hero must remain' }, { status: 400 });
            }
            const targetRow = await DB.prepare('SELECT is_active FROM site_heroes WHERE id = ?').bind(id).first();
            await DB.prepare('DELETE FROM site_heroes WHERE id = ?').bind(id).run();
            // If the deleted one was active, activate the first remaining
            if (targetRow && targetRow.is_active === 1) {
                const firstRemaining = await DB.prepare('SELECT id FROM site_heroes ORDER BY sort_order ASC, id ASC LIMIT 1').first();
                if (firstRemaining) {
                    await DB.prepare('UPDATE site_heroes SET is_active = 1 WHERE id = ?').bind(firstRemaining.id).run();
                }
            }
            await logActivity(env, user.name, 'delete_hero', `hero:${id}`, '');
            return Response.json({ success: true });
        }

        if (action === 'activate' && id) {
            await DB.prepare('UPDATE site_heroes SET is_active = 0').run();
            await DB.prepare('UPDATE site_heroes SET is_active = 1 WHERE id = ?').bind(id).run();
            await logActivity(env, user.name, 'activate_hero', `hero:${id}`, '');
            return Response.json({ success: true });
        }

        return Response.json({ error: 'Unknown action' }, { status: 400 });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
