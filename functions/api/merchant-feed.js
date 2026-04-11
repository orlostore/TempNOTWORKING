// Cloudflare Pages Function - Google Merchant Center Product Feed
// Location: /functions/api/merchant-feed.js
// Serves /api/merchant-feed as RSS 2.0 XML for Google Shopping

function escapeXml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
}

const GOOGLE_CATEGORY_MAP = {
    'Kitchen': 'Home & Garden > Kitchen & Dining',
    'Home Accessories': 'Home & Garden > Home Decor',
    'Bathroom': 'Home & Garden > Bathroom Accessories',
    'Organization': 'Home & Garden > Household Supplies > Storage & Organization',
    'Storage': 'Home & Garden > Household Supplies > Storage & Organization',
    'Office': 'Furniture > Office Furniture > Desk Accessories',
    'Workspace': 'Furniture > Office Furniture > Desk Accessories',
    'Work Space': 'Furniture > Office Furniture > Desk Accessories',
    'Home Office': 'Furniture > Office Furniture > Desk Accessories',
    'Bedroom': 'Home & Garden > Linens & Bedding',
    'Cleaning': 'Home & Garden > Household Supplies > Household Cleaning Supplies',
    'Laundry': 'Home & Garden > Household Supplies > Household Cleaning Supplies',
    'Garden': 'Home & Garden > Lawn & Garden',
    'Outdoor': 'Home & Garden > Lawn & Garden',
    'Dining': 'Home & Garden > Kitchen & Dining',
    'Lifestyle': 'Home & Garden > Home Decor',
    'Kids': 'Baby & Toddler',
    'Baby': 'Baby & Toddler',
    'Pets': 'Animals & Pet Supplies',
    'Electronics': 'Electronics',
    'Travel': 'Luggage & Bags',
    'Fitness': 'Sporting Goods > Exercise & Fitness',
    'Beauty': 'Health & Beauty',
    'Tools': 'Hardware > Tools',
    'Car': 'Vehicles & Parts > Vehicle Parts & Accessories',
};

function getGoogleCategory(category) {
    if (!category) return 'Home & Garden';
    if (GOOGLE_CATEGORY_MAP[category]) return GOOGLE_CATEGORY_MAP[category];
    const key = Object.keys(GOOGLE_CATEGORY_MAP).find(
        k => category.toLowerCase().includes(k.toLowerCase())
    );
    return key ? GOOGLE_CATEGORY_MAP[key] : 'Home & Garden';
}

export async function onRequestGet(context) {
    const { env } = context;
    const DB = env.DB;

    try {
        let results;
        try {
            ({ results } = await DB.prepare(`
                SELECT id, slug, name, category, price, quantity,
                       description, mainImage, image2, image3, image4, image5,
                       image6, image7, image8, colors, material, brand
                FROM products
                ORDER BY id DESC
            `).all());
        } catch (e) {
            // brand column may not exist - fallback without it
            ({ results } = await DB.prepare(`
                SELECT id, slug, name, category, price, quantity,
                       description, mainImage, image2, image3, image4, image5,
                       image6, image7, image8, colors, material
                FROM products
                ORDER BY id DESC
            `).all());
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
<title>ORLO Store</title>
<link>https://orlostore.com</link>
<description>Shop desk organizers, home decor &amp; essentials online in Dubai UAE</description>
`;

        for (const row of results) {
            if (!row.slug || !row.name || !row.price) continue;

            const totalStock = variantsMap[row.id] !== undefined
                ? variantsMap[row.id]
                : (row.quantity || 0);
            const availability = totalStock > 0 ? 'in_stock' : 'out_of_stock';
            const productUrl = `https://orlostore.com/product.html?product=${encodeURIComponent(row.slug)}`;
            const description = stripHtml(row.description || row.name);
            const images = [row.mainImage, row.image2, row.image3, row.image4, row.image5, row.image6, row.image7, row.image8].filter(Boolean);

            xml += `<item>
  <g:id>${escapeXml(row.slug)}</g:id>
  <g:title>${escapeXml(row.name)}</g:title>
  <g:description>${escapeXml(description)}</g:description>
  <g:link>${escapeXml(productUrl)}</g:link>
  <g:image_link>${escapeXml(images[0] || '')}</g:image_link>
`;

            // Additional images (up to 10 allowed, we have up to 7 extra)
            for (let i = 1; i < images.length; i++) {
                xml += `  <g:additional_image_link>${escapeXml(images[i])}</g:additional_image_link>\n`;
            }

            xml += `  <g:price>${row.price.toFixed(2)} AED</g:price>
  <g:quantity>${totalStock}</g:quantity>
  <g:availability>${availability}</g:availability>
  <g:condition>new</g:condition>
  <g:brand>${escapeXml(row.brand || 'ORLO')}</g:brand>
  <g:identifier_exists>false</g:identifier_exists>
  <g:google_product_category>${escapeXml(getGoogleCategory(row.category))}</g:google_product_category>
`;

            if (row.category) {
                xml += `  <g:product_type>${escapeXml(row.category)}</g:product_type>\n`;
            }

            if (row.material) {
                xml += `  <g:material>${escapeXml(row.material)}</g:material>\n`;
            }

            // Shipping to UAE
            xml += `  <g:shipping>
    <g:country>AE</g:country>
    <g:price>0.00 AED</g:price>
  </g:shipping>
  <g:return_policy_label>default</g:return_policy_label>
  <g:return_policy_country>AE</g:return_policy_country>
  <g:return_method>by_mail</g:return_method>
  <g:return_days>7</g:return_days>
  <g:return_shipping_fee_type>customer</g:return_shipping_fee_type>
`;

            xml += `</item>\n`;
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
<channel>
<title>ORLO Store</title>
<link>https://orlostore.com</link>
<description>Error generating feed</description>
</channel>
</rss>`, {
            status: 500,
            headers: { 'Content-Type': 'application/xml' }
        });
    }
}
