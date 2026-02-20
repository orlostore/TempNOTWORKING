// Cloudflare Pages Function - Product Reorder API
// Location: /functions/api/admin/reorder.js

export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    // Auth check
    if (key !== env.ADMIN_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const DB = env.DB;

    try {
        const { id1, id2 } = await request.json();

        if (!id1 || !id2) {
            return new Response(JSON.stringify({ error: 'Two product IDs required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get all products in current display order
        const { results } = await DB.prepare(
            'SELECT id, sort_order FROM products ORDER BY featured DESC, sort_order ASC, id DESC'
        ).all();

        // Find positions of both products
        const idx1 = results.findIndex(p => p.id === id1);
        const idx2 = results.findIndex(p => p.id === id2);

        if (idx1 === -1 || idx2 === -1) {
            return new Response(JSON.stringify({ error: 'Product not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Swap them in the array
        const temp = results[idx1];
        results[idx1] = results[idx2];
        results[idx2] = temp;

        // Re-assign sequential sort_order to all products
        for (let i = 0; i < results.length; i++) {
            await DB.prepare('UPDATE products SET sort_order = ? WHERE id = ?')
                .bind(i, results[i].id)
                .run();
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
