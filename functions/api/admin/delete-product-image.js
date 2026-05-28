// Cloudflare Pages Function - Delete a product image from R2
// Location: /functions/api/admin/delete-product-image.js
// Accepts JSON: { url } where url is the full public URL of an image previously uploaded
// via upload-product-image.js. Validates host + path prefix to prevent escaping the
// products/ namespace, then removes the object from R2.

import { getKey, getAdminUser, logActivity } from './_helpers.js';

const PUBLIC_HOST = 'https://images.orlostore.com';
const REQUIRED_PREFIX = 'products/';

export async function onRequestPost(context) {
    const { request, env } = context;
    const key = getKey(request);
    const user = await getAdminUser(env, key);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!env.IMAGES_R2) {
        return Response.json({ error: 'R2 binding IMAGES_R2 not configured' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const rawUrl = (body.url || '').trim();
        if (!rawUrl) {
            return Response.json({ error: 'Missing url' }, { status: 400 });
        }

        // Strip any ?v= cache-buster (admin/product.js appends one on save)
        const cleanUrl = rawUrl.split('?')[0];

        // Only allow deletes for URLs hosted on our R2 public domain
        if (!cleanUrl.startsWith(PUBLIC_HOST + '/')) {
            return Response.json({
                error: `Only ${PUBLIC_HOST} images can be deleted (got: ${cleanUrl.slice(0, 80)})`
            }, { status: 400 });
        }

        // Derive object key by stripping the host
        const objectKey = cleanUrl.slice((PUBLIC_HOST + '/').length);

        // Only allow deletes under the products/ namespace
        if (!objectKey.startsWith(REQUIRED_PREFIX)) {
            return Response.json({
                error: `Key must start with "${REQUIRED_PREFIX}" (got: ${objectKey.slice(0, 80)})`
            }, { status: 400 });
        }

        // No traversal
        if (objectKey.includes('..') || objectKey.includes('//')) {
            return Response.json({ error: 'Invalid key' }, { status: 400 });
        }

        await env.IMAGES_R2.delete(objectKey);

        await logActivity(env, user.name, 'delete_product_image', objectKey, '');

        return Response.json({ success: true, key: objectKey });
    } catch (err) {
        return Response.json({ error: err.message || 'Delete failed' }, { status: 500 });
    }
}
