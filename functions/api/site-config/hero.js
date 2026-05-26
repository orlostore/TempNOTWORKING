// Cloudflare Pages Function - Public active hero config
// Location: /functions/api/site-config/hero.js
// Returns the currently active hero (image + copy) for homepage rendering

export async function onRequestGet(context) {
    const { env } = context;
    const DB = env.DB;

    const DEFAULT = {
        image_url: 'https://images.orlostore.com/vintage-camper-van/lifestyle.webp',
        title: 'Objects with character.',
        title_em: '',
        subtitle: 'From the dashboard to the desk — small things that say something.',
        cta_text: 'Browse the collection',
        cta_text_ar: 'تصفّح المجموعة',
        cta_link: '#popular-now'
    };

    try {
        const row = await DB.prepare('SELECT * FROM site_heroes WHERE is_active = 1 ORDER BY sort_order ASC, id ASC LIMIT 1').first();
        if (row) {
            return new Response(JSON.stringify({ hero: row }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=60'
                }
            });
        }
    } catch (e) { /* table doesn't exist yet, fall through to default */ }

    return new Response(JSON.stringify({ hero: DEFAULT }), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60'
        }
    });
}
