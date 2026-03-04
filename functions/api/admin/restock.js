// Cloudflare Pages Function - Restock Inventory
// Usage: /api/admin/restock?slug=product-slug&add=50 (with Authorization: Bearer <key> header)
// Or:    /api/admin/restock?slug=product-slug&set=100
// Variant: /api/admin/restock?slug=product-slug&variant_id=5&set=50

import { getKey, getAdminUser, logActivity } from './_helpers.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const DB = env.DB;

    const url = new URL(request.url);
    const key = getKey(request);
    const slug = url.searchParams.get('slug');
    const variantId = url.searchParams.get('variant_id');
    const addQty = url.searchParams.get('add');
    const setQty = url.searchParams.get('set');

    const user = await getAdminUser(env, key);
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!slug) {
        return Response.json({ error: 'Missing slug parameter' }, { status: 400 });
    }

    if (!addQty && !setQty) {
        return Response.json({ error: 'Missing add or set parameter' }, { status: 400 });
    }

    try {
        // Variant restock
        if (variantId) {
            const variant = await DB.prepare('SELECT id, name, quantity FROM product_variants WHERE id = ?')
                .bind(variantId).first();

            if (!variant) {
                return Response.json({ error: `Variant not found: ${variantId}` }, { status: 404 });
            }

            const oldQty = variant.quantity;
            let newQty;

            if (setQty) {
                newQty = parseInt(setQty);
                await DB.prepare('UPDATE product_variants SET quantity = ? WHERE id = ?')
                    .bind(newQty, variantId).run();
            } else {
                newQty = oldQty + parseInt(addQty);
                await DB.prepare('UPDATE product_variants SET quantity = ? WHERE id = ?')
                    .bind(newQty, variantId).run();
            }

            await logActivity(env, user.name, 'restock_variant', `${slug}:${variant.name}`, `${oldQty} -> ${newQty}`);

            return Response.json({
                success: true,
                variant: variant.name,
                variantId: variantId,
                oldQuantity: oldQty,
                newQuantity: newQty,
                action: setQty ? 'set' : 'add'
            });
        }

        // Product restock (no variant)
        const product = await DB.prepare('SELECT slug, name, quantity FROM products WHERE slug = ?')
            .bind(slug).first();

        if (!product) {
            return Response.json({ error: `Product not found: ${slug}` }, { status: 404 });
        }

        const oldQty = product.quantity;
        let newQty;

        if (setQty) {
            newQty = parseInt(setQty);
            await DB.prepare('UPDATE products SET quantity = ? WHERE slug = ?')
                .bind(newQty, slug).run();
        } else {
            newQty = oldQty + parseInt(addQty);
            await DB.prepare('UPDATE products SET quantity = ? WHERE slug = ?')
                .bind(newQty, slug).run();
        }

        await logActivity(env, user.name, 'restock', slug, `${product.name}: ${oldQty} -> ${newQty}`);

        return Response.json({
            success: true,
            product: product.name,
            slug: slug,
            oldQuantity: oldQty,
            newQuantity: newQty,
            action: setQty ? 'set' : 'add'
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
