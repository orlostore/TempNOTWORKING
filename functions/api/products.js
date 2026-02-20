// Cloudflare Pages Function - Public Products API
// Location: /functions/api/products.js

export async function onRequestGet(context) {
    const { env } = context;
    const DB = env.DB;

    try {
        let results;
        try {
            ({ results } = await DB.prepare(`
                SELECT id, slug, name, nameAr, category, categoryAr, price, cost, quantity,
                       description, descriptionAr, mainImage, image2, image3, image4, image5,
                       image6, image7, image8, colors, colorsAr, packaging, packagingAr,
                       specifications, specificationsAr, featured,
                       wattage, voltage, plugType, plugTypeAr, baseType, baseTypeAr,
                       material, materialAr, sort_order
                FROM products
                ORDER BY featured DESC, sort_order ASC, id DESC
            `).all());
        } catch (e) {
            // sort_order column may not exist yet - fallback
            ({ results } = await DB.prepare(`
                SELECT id, slug, name, nameAr, category, categoryAr, price, cost, quantity,
                       description, descriptionAr, mainImage, image2, image3, image4, image5,
                       image6, image7, image8, colors, colorsAr, packaging, packagingAr,
                       specifications, specificationsAr, featured,
                       wattage, voltage, plugType, plugTypeAr, baseType, baseTypeAr,
                       material, materialAr, 0 as sort_order
                FROM products
                ORDER BY featured DESC, id DESC
            `).all());
        }

        // Fetch all variants grouped by product
        let variantsMap = {};
        try {
            const { results: variantRows } = await DB.prepare(`
                SELECT id, product_id, name, nameAr, image, quantity, sort_order
                FROM product_variants
                ORDER BY sort_order ASC, id ASC
            `).all();
            for (const v of variantRows) {
                if (!variantsMap[v.product_id]) variantsMap[v.product_id] = [];
                variantsMap[v.product_id].push({
                    id: v.id,
                    name: v.name,
                    nameAr: v.nameAr || '',
                    image: v.image || '',
                    quantity: v.quantity,
                    sortOrder: v.sort_order
                });
            }
        } catch (e) {
            // Table may not exist yet - graceful fallback
            console.log('Variants table not ready:', e.message);
        }

        // Fetch all pricing tiers grouped by product
        let tiersMap = {};
        try {
            const { results: tierRows } = await DB.prepare(`
                SELECT id, product_id, min_qty, price_per_unit
                FROM product_pricing_tiers
                ORDER BY min_qty ASC
            `).all();
            for (const t of tierRows) {
                if (!tiersMap[t.product_id]) tiersMap[t.product_id] = [];
                tiersMap[t.product_id].push({
                    id: t.id,
                    minQty: t.min_qty,
                    pricePerUnit: t.price_per_unit
                });
            }
        } catch (e) {
            // Table may not exist yet - graceful fallback
            console.log('Pricing tiers table not ready:', e.message);
        }

        const products = results.map(row => {
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

        return new Response(JSON.stringify(products), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
