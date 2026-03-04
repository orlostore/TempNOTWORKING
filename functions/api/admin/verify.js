// Cloudflare Pages Function - Admin Verification with Multi-User Support
// Location: /functions/api/admin/verify.js

import { getKey, getAdminUser } from './_helpers.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const key = getKey(request);

    const user = await getAdminUser(env, key);

    if (!user) {
        return Response.json({ valid: false }, { status: 401 });
    }

    return Response.json({ valid: true, user });
}
