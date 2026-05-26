// Cloudflare Pages Function - Hero image upload to R2
// Location: /functions/api/admin/upload-hero.js
// Accepts multipart/form-data with a single 'file' field, writes to R2 under heroes/<name>, returns public URL

import { getKey, getAdminUser } from './_helpers.js';

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB hard cap
const ALLOWED_TYPES = ['image/jpeg', 'image/webp', 'image/png'];
const PUBLIC_HOST = 'https://images.orlostore.com';

function slugify(s) {
    return (s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 40) || 'hero';
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
        const desiredName = formData.get('name') || 'hero';

        if (!file || typeof file === 'string') {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            return Response.json({ error: `Type ${file.type} not allowed. Use JPG, WebP, or PNG.` }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
            return Response.json({ error: `File ${(file.size/1024).toFixed(0)}KB exceeds 2MB limit` }, { status: 400 });
        }

        const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg';
        const objectKey = `heroes/${slugify(desiredName)}-${Date.now()}.${ext}`;
        const buf = await file.arrayBuffer();

        await env.IMAGES_R2.put(objectKey, buf, {
            httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' }
        });

        return Response.json({
            success: true,
            url: `${PUBLIC_HOST}/${objectKey}`,
            key: objectKey,
            size: file.size,
            type: file.type
        });
    } catch (err) {
        return Response.json({ error: err.message || 'Upload failed' }, { status: 500 });
    }
}
