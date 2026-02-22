// Cloudflare Pages Function - Product Admin API
// Location: /functions/api/admin/product.js

export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    const action = url.searchParams.get('action');
    const id = url.searchParams.get('id');

    // Auth check
    if (key !== env.ADMIN_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const DB = env.DB;

    try {
        const data = await request.json();

        if (action === 'add') {
            // Insert new product
            const result = await DB.prepare(`
                INSERT INTO products (
                    slug, name, nameAr, category, categoryAr, price, cost, quantity,
                    description, descriptionAr, mainImage, image2, image3, image4, image5,
                    image6, image7, image8, colors, colorsAr, packaging, packagingAr,
                    specifications, specificationsAr, featured,
                    wattage, voltage, plugType, plugTypeAr, baseType, baseTypeAr,
                    material, materialAr
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                data.slug,
                data.name,
                data.nameAr || '',
                data.category || '',
                data.categoryAr || '',
                data.price,
                data.cost || 0,
                data.quantity || 0,
                data.description || '',
                data.descriptionAr || '',
                data.mainImage || '',
                data.image2 || '',
                data.image3 || '',
                data.image4 || '',
                data.image5 || '',
                data.image6 || '',
                data.image7 || '',
                data.image8 || '',
                data.colors || '',
                data.colorsAr || '',
                data.packaging || '',
                data.packagingAr || '',
                data.specifications || '',
                data.specificationsAr || '',
                data.featured || 0,
                data.wattage || '',
                data.voltage || '',
                data.plugType || '',
                data.plugTypeAr || '',
                data.baseType || '',
                data.baseTypeAr || '',
                data.material || '',
                data.materialAr || ''
            ).run();

            // Get the new product ID
            const newProduct = await DB.prepare('SELECT id FROM products WHERE slug = ?').bind(data.slug).first();
            const productId = newProduct ? newProduct.id : null;

            // Save variants if provided
            if (productId && data.variants && data.variants.length > 0) {
                await saveVariants(DB, productId, data.variants);
            }

            // Save pricing tiers if provided
            if (productId && data.pricingTiers && data.pricingTiers.length > 0) {
                await savePricingTiers(DB, productId, data.pricingTiers);
            }

            return new Response(JSON.stringify({ success: true, id: productId }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (action === 'update' && id) {
            // Update existing product
            await DB.prepare(`
                UPDATE products SET
                    slug = ?, name = ?, nameAr = ?, category = ?, categoryAr = ?,
                    price = ?, cost = ?, quantity = ?, description = ?, descriptionAr = ?,
                    mainImage = ?, image2 = ?, image3 = ?, image4 = ?, image5 = ?,
                    image6 = ?, image7 = ?, image8 = ?,
                    colors = ?, colorsAr = ?, packaging = ?, packagingAr = ?,
                    specifications = ?, specificationsAr = ?, featured = ?,
                    wattage = ?, voltage = ?, plugType = ?, plugTypeAr = ?,
                    baseType = ?, baseTypeAr = ?, material = ?, materialAr = ?
                WHERE id = ?
            `).bind(
                data.slug,
                data.name,
                data.nameAr || '',
                data.category || '',
                data.categoryAr || '',
                data.price,
                data.cost || 0,
                data.quantity,
                data.description || '',
                data.descriptionAr || '',
                data.mainImage || '',
                data.image2 || '',
                data.image3 || '',
                data.image4 || '',
                data.image5 || '',
                data.image6 || '',
                data.image7 || '',
                data.image8 || '',
                data.colors || '',
                data.colorsAr || '',
                data.packaging || '',
                data.packagingAr || '',
                data.specifications || '',
                data.specificationsAr || '',
                data.featured || 0,
                data.wattage || '',
                data.voltage || '',
                data.plugType || '',
                data.plugTypeAr || '',
                data.baseType || '',
                data.baseTypeAr || '',
                data.material || '',
                data.materialAr || '',
                id
            ).run();

            // Replace variants (delete old, insert new)
            if (data.variants !== undefined) {
                await saveVariants(DB, id, data.variants || []);
            }

            // Replace pricing tiers (delete old, insert new)
            if (data.pricingTiers !== undefined) {
                await savePricingTiers(DB, id, data.pricingTiers || []);
            }

            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function saveVariants(DB, productId, variants) {
    // Delete existing variants for this product
    await DB.prepare('DELETE FROM product_variants WHERE product_id = ?').bind(productId).run();

    // Insert new variants
    for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (!v.name) continue; // Skip empty rows
        await DB.prepare(`
            INSERT INTO product_variants (product_id, name, nameAr, image, quantity, price, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
            productId,
            v.name,
            v.nameAr || '',
            v.image || '',
            v.quantity || 0,
            v.price || 0,
            i
        ).run();
    }
}

async function savePricingTiers(DB, productId, tiers) {
    // Delete existing tiers for this product
    await DB.prepare('DELETE FROM product_pricing_tiers WHERE product_id = ?').bind(productId).run();

    // Insert new tiers
    for (const t of tiers) {
        if (!t.minQty || t.discountPercent == null || isNaN(t.discountPercent)) continue; // Skip empty rows
        await DB.prepare(`
            INSERT INTO product_pricing_tiers (product_id, min_qty, discount_percent)
            VALUES (?, ?, ?)
        `).bind(
            productId,
            t.minQty,
            t.discountPercent
        ).run();
    }
}

export async function onRequestGet(context) {
    const { env } = context;
    const url = new URL(context.request.url);
    const key = url.searchParams.get('key');
    const action = url.searchParams.get('action');
    const id = url.searchParams.get('id');

    // Auth check
    if (key !== env.ADMIN_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const DB = env.DB;

    if (action === 'delete' && id) {
        try {
            // Delete variants and tiers first (cascade may not be enforced)
            await DB.prepare('DELETE FROM product_variants WHERE product_id = ?').bind(id).run();
            await DB.prepare('DELETE FROM product_pricing_tiers WHERE product_id = ?').bind(id).run();
            await DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
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

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
    });
}
