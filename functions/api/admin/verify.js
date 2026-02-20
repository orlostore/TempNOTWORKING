// Cloudflare Pages Function - Lightweight Admin Key Verification
// Location: /functions/api/admin/verify.js

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (key !== env.ADMIN_KEY) {
        return new Response(JSON.stringify({ valid: false }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ valid: true }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
