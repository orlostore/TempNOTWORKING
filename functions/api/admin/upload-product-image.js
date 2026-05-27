// Cloudflare Pages Function - Product image upload to R2
// Location: /functions/api/admin/upload-product-image.js
// Accepts multipart/form-data with: file, slug, type (clean|dimensions|lifestyle), seq (number)
// Writes to R2 at products/<slug>/<slug>-<type>-NN.<ext>, returns public URL.
// Additive to the existing URL-paste workflow — does not modify existing products or URLs.

import { getKey, getAdminUser } from './_helpers.js';

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB cap for product images (vs 2 MB for hero)
const ALLOWED_TYPES = ['image/jpeg', 'image/webp', 'image/png'];
const ALLOWED_TYPE_TAGS = ['clean', 'dimensions', 'lifestyle'];
const PUBLIC_HOST = 'https://images.orlostore.com';

function cleanSlug(s) {
    return (s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 60);
}

function pad2(n) {
    n = parseInt(n, 10);
    if (!Number.isFinite(n) || n < 1) n = 1;
    if (n > 99) n = 99;
    return String(n).padStart(2, '0');
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const key = getKey(request);
    const user = await getAdminUser(env, key);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!env.IMAGES_R2) {
        return Response.json({ error: 'R2 binding IMAGES_R2 not configured' }, { status: 500 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const slugRaw = formData.get('slug');
        const typeRaw = formData.get('type');
        const seqRaw = formData.get('seq');

        if (!file || typeof file === 'string') {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            return Response.json({ error: `Type ${file.type} not allowed. Use JPG, WebP, or PNG.` }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
            return Response.json({ error: `File ${(file.size/1024).toFixed(0)}KB exceeds 4MB limit` }, { status: 400 });
        }

        const slug = cleanSlug(slugRaw);
        if (!slug) {
            return Response.json({ error: 'Missing or invalid slug — type the product name first.' }, { status: 400 });
        }

        const tag = String(typeRaw || '').toLowerCase();
        if (!ALLOWED_TYPE_TAGS.includes(tag)) {
            return Response.json({ error: `Invalid type "${typeRaw}". Use clean, dimensions, or lifestyle.` }, { status: 400 });
        }

        const seq = pad2(seqRaw || 1);
        const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg';
        const filename = `${slug}-${tag}-${seq}.${ext}`;
        const objectKey = `products/${slug}/${filename}`;
        const buf = await file.arrayBuffer();

        await env.IMAGES_R2.put(objectKey, buf, {
            httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' }
        });

        return Response.json({
            success: true,
            url: `${PUBLIC_HOST}/${objectKey}`,
            key: objectKey,
            filename,
            slug,
            type: tag,
            seq,
            size: file.size,
            mime: file.type
        });
    } catch (err) {
        return Response.json({ error: err.message || 'Upload failed' }, { status: 500 });
    }
}
