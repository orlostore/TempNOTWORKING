// Cloudflare Pages Function - Public Products API
// Location: /functions/api/products.js

const CACHE_KEY = 'all_products_data';
const CACHE_TTL = 300; // 5 minutes

export async function onRequestGet(context) {
    const { env } = context;
    const DB = env.DB;

    // 1. Check KV cache first — instant response
    if (env.PRODUCTS_CACHE) {
        const cached = await env.PRODUCTS_CACHE.get(CACHE_KEY);
        if (cached) {
            // Return cached data immediately, refresh D1 in background
            context.waitUntil(refreshCache(env, DB));
            return new Response(cached, {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store',
                    'X-Cache': 'KV-HIT'
                }
            });
        }
    }

    try {
        const products = await fetchFromD1(DB);
        const json = JSON.stringify(products);

        // Save to KV in background so next request gets a HIT
        if (env.PRODUCTS_CACHE) {
            context.waitUntil(
                env.PRODUCTS_CACHE.put(CACHE_KEY, json, { expirationTtl: CACHE_TTL })
            );
        }

        return new Response(json, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
                'X-Cache': 'KV-MISS'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Background KV refresh — runs after response is sent to user
async function refreshCache(env, DB) {
    try {
        const products = await fetchFromD1(DB);
        await env.PRODUCTS_CACHE.put(CACHE_KEY, JSON.stringify(products), { expirationTtl: CACHE_TTL });
    } catch (e) {
        console.log('KV refresh failed:', e.message);
    }
}

// D1 query logic — unchanged from original
async function fetchFromD1(DB) {
    const [productsResult, variantsResult, tiersResult] = await Promise.all([

        // Query 1: Products (with sort_order fallback)
        DB.prepare(`
            SELECT id, slug, name, nameAr, category, categoryAr, price, cost, quantity,
                   description, descriptionAr, mainImage, image2, image3, image4, image5,
                   image6, image7, image8, colors, colorsAr, packaging, packagingAr,
                   specifications, specificationsAr, featured,
                   wattage, voltage, plugType, plugTypeAr, baseType, baseTypeAr,
                   material, materialAr, sort_order
            FROM products
            ORDER BY sort_order ASC, id DESC
        `).all().catch(() =>
            DB.prepare(`
                SELECT id, slug, name, nameAr, category, categoryAr, price, cost, quantity,
                       description, descriptionAr, mainImage, image2, image3, image4, image5,
                       image6, image7, image8, colors, colorsAr, packaging, packagingAr,
                       specifications, specificationsAr, featured,
                       wattage, voltage, plugType, plugTypeAr, baseType, baseTypeAr,
                       material, materialAr, 0 as sort_order
                FROM products
                ORDER BY id DESC
            `).all()
        ),

        // Query 2: Variants
        DB.prepare(`
            SELECT id, product_id, name, nameAr, image, quantity, price, sort_order
            FROM product_variants
            ORDER BY sort_order ASC, id ASC
        `).all().catch(e => {
            console.log('Variants table not ready:', e.message);
            return { results: [] };
        }),

        // Query 3: Pricing tiers
        DB.prepare(`
            SELECT id, product_id, min_qty, discount_percent
            FROM product_pricing_tiers
            ORDER BY min_qty ASC
        `).all().catch(e => {
            console.log('Pricing tiers table not ready:', e.message);
            return { results: [] };
        })
    ]);

    const { results } = productsResult;

    // Build variants map
    let variantsMap = {};
    for (const v of variantsResult.results) {
        if (!variantsMap[v.product_id]) variantsMap[v.product_id] = [];
        variantsMap[v.product_id].push({
            id: v.id,
            name: v.name,
            nameAr: v.nameAr || '',
            image: v.image || '',
            quantity: v.quantity,
            price: v.price || 0,
            sortOrder: v.sort_order
        });
    }

    // Build pricing tiers map
    let tiersMap = {};
    for (const t of tiersResult.results) {
        if (!tiersMap[t.product_id]) tiersMap[t.product_id] = [];
        tiersMap[t.product_id].push({
            id: t.id,
            minQty: t.min_qty,
            discountPercent: t.discount_percent
        });
    }

    return results.map(row => {
        const variants = variantsMap[row.id] || [];
        const totalStock = variants.length > 0
            ? variants.reduce((sum, v) => sum + v.quantity, 0)
            : row.quantity;

        return {
            id: row.id,
            slug: row.slug,
            name: row.name,
            nameAr: row.nameAr,
            category: row.category,
            categoryAr: row.categoryAr,
            price: row.price,
            cost: row.cost || 0,
            quantity: row.quantity,
            totalStock,
            description: row.description,
            descriptionAr: row.descriptionAr,
            image: row.mainImage,
            images: [row.mainImage, row.image2, row.image3, row.image4, row.image5, row.image6, row.image7, row.image8].filter(Boolean),
            colors: row.colors,
            colorsAr: row.colorsAr,
            packaging: row.packaging,
            packagingAr: row.packagingAr,
            specifications: row.specifications ? row.specifications.split(' | ').filter(Boolean) : [],
            specificationsAr: row.specificationsAr ? row.specificationsAr.split(' | ').filter(Boolean) : [],
            featured: row.featured === 1,
            wattage: row.wattage || '',
            voltage: row.voltage || '',
            plugType: row.plugType || '',
            plugTypeAr: row.plugTypeAr || '',
            baseType: row.baseType || '',
            baseTypeAr: row.baseTypeAr || '',
            material: row.material || '',
            materialAr: row.materialAr || '',
            variants,
            pricingTiers: tiersMap[row.id] || []
        };
    });
}
