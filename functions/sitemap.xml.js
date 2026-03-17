// Cloudflare Pages Function - Dynamic Sitemap
// Location: /functions/sitemap.xml.js
// Serves /sitemap.xml by querying the products database

export async function onRequestGet(context) {
    const { env } = context;
    const DB = env.DB;

    try {
        // Fetch all product slugs from the database
        const { results } = await DB.prepare(
            'SELECT slug FROM products ORDER BY id DESC'
        ).all();

        const today = new Date().toISOString().split('T')[0];

        // Build sitemap XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Homepage
        xml += '  <url>\n';
        xml += '    <loc>https://orlostore.com/</loc>\n';
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>1.0</priority>\n';
        xml += '  </url>\n';

        // Individual product pages
        for (const row of results) {
            if (!row.slug) continue;
            xml += '  <url>\n';
            xml += `    <loc>https://orlostore.com/product?product=${encodeURIComponent(row.slug)}</loc>\n`;
            xml += `    <lastmod>${today}</lastmod>\n`;
            xml += '    <changefreq>weekly</changefreq>\n';
            xml += '    <priority>0.8</priority>\n';
            xml += '  </url>\n';
        }

        xml += '</urlset>\n';

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600'
            }
        });

    } catch (error) {
        // If DB fails, return a minimal sitemap with just the homepage
        const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://orlostore.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

        return new Response(fallback, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'no-cache'
            }
        });
    }
}
