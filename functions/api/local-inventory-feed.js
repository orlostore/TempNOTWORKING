// Cloudflare Pages Function - Google Merchant Center Local Inventory Feed
// Location: /functions/api/local-inventory-feed.js
// Serves /api/local-inventory-feed as RSS 2.0 XML for Google Local Inventory

const STORE_CODE = '1625-8301-2758-8057-5378';

export async function onRequestGet(context) {
    const { env } = context;
    const DB = env.DB;

    try {
        let results;
        try {
            ({ results } = await DB.prepare(`
                SELECT id, slug, price, quantity
                FROM products
                ORDER BY id DESC
            `).all());
        } catch (e) {
            return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel><title>ORLO Local Inventory</title></channel>
</rss>`, { status: 500, headers: { 'Content-Type': 'application/xml' } });
        }

        // Fetch variants to calculate total stock
        let variantsMap = {};
        try {
            const { results: variantRows } = await DB.prepare(`
                SELECT product_id, quantity FROM product_variants
            `).all();
            for (const v of variantRows) {
                if (!variantsMap[v.product_id]) variantsMap[v.product_id] = 0;
                variantsMap[v.product_id] += v.quantity;
            }
        } catch (e) {
            // Table may not exist yet
        }

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>ORLO Store - Local Inventory</title>
<link>https://orlostore.com</link>
<description>Local inventory for ORLO Store UAE</description>
`;

        for (const row of results) {
            if (!row.slug) continue;

            const totalStock = variantsMap[row.id] !== undefined
                ? variantsMap[row.id]
                : (row.quantity || 0);
            const availability = totalStock > 0 ? 'in_stock' : 'out_of_stock';

            xml += `<item>
  <g:store_code>${STORE_CODE}</g:store_code>
  <g:id>${row.slug}</g:id>
  <g:quantity>${totalStock}</g:quantity>
  <g:availability>${availability}</g:availability>
  <g:price>${(row.price || 0).toFixed(2)} AED</g:price>
</item>
`;
        }

        xml += `</channel>\n</rss>`;

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600'
            }
        });

    } catch (error) {
        return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel><title>ORLO Local Inventory</title></channel>
</rss>`, {
            status: 500,
            headers: { 'Content-Type': 'application/xml' }
        });
    }
}
