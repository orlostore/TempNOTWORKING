// Cloudflare Pages Function - Product Admin API
// Location: /functions/api/admin/product.js

import { getKey, getAdminUser, logActivity } from './_helpers.js';

// Append a fresh ?v=<timestamp> to image URLs on save so browsers and
// Cloudinary's image/fetch derivative cache pick up the new file even if
// the underlying R2 filename was reused. Strips any prior ?v= first.
function bumpImageUrl(url) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return url || '';
    const i = url.indexOf('?v=');
    const base = i >= 0 ? url.substring(0, i) : url;
    return base + '?v=' + Date.now();
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const key = getKey(request);
    const action = url.searchParams.get('action');
    const id = url.searchParams.get('id');

    const user = await getAdminUser(env, key);
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const DB = env.DB;

    try {
        // Idempotent schema migration — add secondary category columns + handmade flag if missing
        try { await DB.prepare('ALTER TABLE products ADD COLUMN category2 TEXT').run(); } catch(e) { /* already exists */ }
        try { await DB.prepare('ALTER TABLE products ADD COLUMN category2Ar TEXT').run(); } catch(e) { /* already exists */ }
        try { await DB.prepare('ALTER TABLE products ADD COLUMN handmade INTEGER DEFAULT 0').run(); } catch(e) { /* already exists */ }
        try { await DB.prepare('ALTER TABLE products ADD COLUMN isNew INTEGER DEFAULT 0').run(); } catch(e) { /* already exists */ }
        try { await DB.prepare('ALTER TABLE products ADD COLUMN mainImageMirror INTEGER DEFAULT 0').run(); } catch(e) { /* already exists */ }

        const data = await request.json();

        if (action === 'add') {
            const result = await DB.prepare(`
                INSERT INTO products (
                    slug, name, nameAr, category, categoryAr, category2, category2Ar,
                    price, cost, quantity,
                    description, descriptionAr, mainImage, mainImageMirror, image2, image3, image4, image5,
                    image6, image7, image8, colors, colorsAr, packaging, packagingAr,
                    specifications, specificationsAr, featured, handmade, isNew,
                    wattage, voltage, plugType, plugTypeAr, baseType, baseTypeAr,
                    material, materialAr, pairings
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                data.slug, data.name, data.nameAr || '',
                data.category || '', data.categoryAr || '',
                data.category2 || '', data.category2Ar || '',
                data.price, data.cost || 0, data.quantity || 0,
                data.description || '', data.descriptionAr || '',
                bumpImageUrl(data.mainImage), data.mainImageMirror ? 1 : 0,
                bumpImageUrl(data.image2), bumpImageUrl(data.image3),
                bumpImageUrl(data.image4), bumpImageUrl(data.image5), bumpImageUrl(data.image6),
                bumpImageUrl(data.image7), bumpImageUrl(data.image8),
                data.colors || '', data.colorsAr || '',
                data.packaging || '', data.packagingAr || '',
                data.specifications || '', data.specificationsAr || '',
                data.featured || 0, data.handmade || 0, data.isNew || 0,
                data.wattage || '', data.voltage || '',
                data.plugType || '', data.plugTypeAr || '',
                data.baseType || '', data.baseTypeAr || '',
                data.material || '', data.materialAr || '',
                data.pairings || ''
            ).run();

            const newProduct = await DB.prepare('SELECT id FROM products WHERE slug = ?').bind(data.slug).first();
            const productId = newProduct ? newProduct.id : null;

            if (productId && data.variants && data.variants.length > 0) {
                await saveVariants(DB, productId, data.variants);
            }
            if (productId && data.pricingTiers && data.pricingTiers.length > 0) {
                await savePricingTiers(DB, productId, data.pricingTiers);
            }

            await logActivity(env, user.name, 'add_product', data.slug, data.name);

            if (env.PRODUCTS_CACHE) await env.PRODUCTS_CACHE.delete('all_products_data');

            return Response.json({ success: true, id: productId });
        }

        if (action === 'toggle-featured' && id) {
            await DB.prepare('UPDATE products SET featured = ? WHERE id = ?')
                .bind(data.featured ? 1 : 0, id).run();

            await logActivity(env, user.name, 'toggle_featured', `product:${id}`, data.featured ? 'Featured' : 'Unfeatured');

            if (env.PRODUCTS_CACHE) await env.PRODUCTS_CACHE.delete('all_products_data');

            return Response.json({ success: true });
        }

        if (action === 'update' && id) {
            await DB.prepare(`
                UPDATE products SET
                    slug = ?, name = ?, nameAr = ?, category = ?, categoryAr = ?,
                    category2 = ?, category2Ar = ?,
                    price = ?, cost = ?, quantity = ?, description = ?, descriptionAr = ?,
                    mainImage = ?, mainImageMirror = ?, image2 = ?, image3 = ?, image4 = ?, image5 = ?,
                    image6 = ?, image7 = ?, image8 = ?,
                    colors = ?, colorsAr = ?, packaging = ?, packagingAr = ?,
                    specifications = ?, specificationsAr = ?,
                    featured = ?, handmade = ?, isNew = ?,
                    wattage = ?, voltage = ?, plugType = ?, plugTypeAr = ?,
                    baseType = ?, baseTypeAr = ?, material = ?, materialAr = ?,
                    pairings = ?
                WHERE id = ?
            `).bind(
                data.slug, data.name, data.nameAr || '',
                data.category || '', data.categoryAr || '',
                data.category2 || '', data.category2Ar || '',
                data.price, data.cost || 0, data.quantity,
                data.description || '', data.descriptionAr || '',
                bumpImageUrl(data.mainImage), data.mainImageMirror ? 1 : 0,
                bumpImageUrl(data.image2), bumpImageUrl(data.image3),
                bumpImageUrl(data.image4), bumpImageUrl(data.image5), bumpImageUrl(data.image6),
                bumpImageUrl(data.image7), bumpImageUrl(data.image8),
                data.colors || '', data.colorsAr || '',
                data.packaging || '', data.packagingAr || '',
                data.specifications || '', data.specificationsAr || '',
                data.featured || 0, data.handmade || 0, data.isNew || 0,
                data.wattage || '', data.voltage || '',
                data.plugType || '', data.plugTypeAr || '',
                data.baseType || '', data.baseTypeAr || '',
                data.material || '', data.materialAr || '',
                data.pairings || '',
                id
            ).run();

            if (data.variants !== undefined) {
                await saveVariants(DB, id, data.variants || []);
            }
            if (data.pricingTiers !== undefined) {
                await savePricingTiers(DB, id, data.pricingTiers || []);
            }

            await logActivity(env, user.name, 'update_product', data.slug, data.name);

            if (env.PRODUCTS_CACHE) await env.PRODUCTS_CACHE.delete('all_products_data');

            return Response.json({ success: true });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

async function saveVariants(DB, productId, variants) {
    await DB.prepare('DELETE FROM product_variants WHERE product_id = ?').bind(productId).run();
    for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (!v.name) continue;
        await DB.prepare(`
            INSERT INTO product_variants (product_id, name, nameAr, image, quantity, price, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(productId, v.name, v.nameAr || '', bumpImageUrl(v.image), v.quantity || 0, v.price || 0, i).run();
    }
}

async function savePricingTiers(DB, productId, tiers) {
    await DB.prepare('DELETE FROM product_pricing_tiers WHERE product_id = ?').bind(productId).run();
    for (const t of tiers) {
        if (!t.minQty || t.discountPercent == null || isNaN(t.discountPercent)) continue;
        await DB.prepare(`
            INSERT INTO product_pricing_tiers (product_id, min_qty, discount_percent)
            VALUES (?, ?, ?)
        `).bind(productId, t.minQty, t.discountPercent).run();
    }
}

export async function onRequestGet(context) {
    const { env } = context;
    const url = new URL(context.request.url);
    const key = getKey(context.request);
    const action = url.searchParams.get('action');
    const id = url.searchParams.get('id');

    const user = await getAdminUser(env, key);
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const DB = env.DB;

    if (action === 'delete' && id) {
        try {
            // Get product name for logging
            const product = await DB.prepare('SELECT slug, name FROM products WHERE id = ?').bind(id).first();

            await DB.prepare('DELETE FROM product_variants WHERE product_id = ?').bind(id).run();
            await DB.prepare('DELETE FROM product_pricing_tiers WHERE product_id = ?').bind(id).run();
            await DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();

            await logActivity(env, user.name, 'delete_product', product?.slug || id, product?.name || 'Unknown');

            if (env.PRODUCTS_CACHE) await env.PRODUCTS_CACHE.delete('all_products_data');

            return Response.json({ success: true });
        } catch (error) {
            return Response.json({ error: error.message }, { status: 500 });
        }
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
}
