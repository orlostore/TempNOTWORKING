// Cloudflare Pages Function - Lightweight Admin Key Verification
// Location: /functions/api/admin/verify.js

function safeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const encoder = new TextEncoder();
    const aBuf = encoder.encode(a);
    const bBuf = encoder.encode(b);
    if (aBuf.length !== bBuf.length) return false;
    let result = 0;
    for (let i = 0; i < aBuf.length; i++) result |= aBuf[i] ^ bBuf[i];
    return result === 0;
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization');
    const key = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!safeCompare(key, env.ADMIN_KEY)) {
        return new Response(JSON.stringify({ valid: false }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ valid: true }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
