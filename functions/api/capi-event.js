// Cloudflare Pages Function — Meta CAPI relay (browser → server mirror)
// Receives any browser-side event and forwards to Meta Conversions API with
// hashed user_data + fbp/fbc cookies for highest match quality + dedup.

const ALLOWED_EVENTS = new Set([
    'PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout',
    'Search', 'Lead', 'CompleteRegistration', 'AddToWishlist'
]);
const META_PIXEL_ID = '4275846289322000';

async function sha256(value) {
    const data = new TextEncoder().encode(String(value));
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
const isHashed = v => typeof v === 'string' && /^[a-f0-9]{64}$/i.test(v);
const hashIfNeeded = async v => v ? (isHashed(v) ? v : await sha256(v)) : null;

function getCookie(req, name) {
    const cookie = req.headers.get('Cookie') || '';
    const m = cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[1]) : null;
}

export async function onRequestPost(context) {
    const { request, env } = context;
    if (!env.META_CAPI_TOKEN) {
        return Response.json({ ok: true }, { status: 200 }); // silent no-op when not configured
    }

    try {
        const body = await request.json();
        const { event_name, event_id, event_source_url, custom_data, user_data: clientUd } = body;

        if (!ALLOWED_EVENTS.has(event_name)) {
            return Response.json({ error: 'Invalid event' }, { status: 400 });
        }

        const ud = {
            client_ip_address: request.headers.get('CF-Connecting-IP') || undefined,
            client_user_agent: request.headers.get('User-Agent') || undefined,
        };

        // fbp / fbc cookies — required for high match quality
        const fbp = getCookie(request, '_fbp');
        const fbc = getCookie(request, '_fbc');
        if (fbp) ud.fbp = fbp;
        if (fbc) ud.fbc = fbc;

        // Hashed PII from client (accepts plain or pre-hashed values)
        if (clientUd && typeof clientUd === 'object') {
            const fields = ['em', 'ph', 'fn', 'ln', 'ct', 'country', 'external_id', 'zp', 'st'];
            for (const f of fields) {
                const raw = clientUd[f];
                if (!raw) continue;
                let v = String(raw).toLowerCase().trim();
                if (f === 'ph') v = v.replace(/\D/g, '');
                if (f === 'ct') v = v.replace(/\s+/g, '');
                const hashed = await hashIfNeeded(v);
                if (hashed) ud[f] = [hashed];
            }
        }

        const payload = {
            data: [{
                event_name,
                event_time: Math.floor(Date.now() / 1000),
                event_id: event_id || crypto.randomUUID(),
                action_source: 'website',
                event_source_url: event_source_url || (env.SITE_URL || 'https://orlostore.com'),
                user_data: ud,
                custom_data: custom_data || {},
            }]
        };

        const res = await fetch(
            `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${env.META_CAPI_TOKEN}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
        );

        if (!res.ok) {
            const err = await res.text();
            console.error(`Meta CAPI ${event_name} error:`, err);
        } else {
            console.log(`Meta CAPI ${event_name} sent, event_id:`, event_id);
        }

        return Response.json({ ok: true }, { status: 200 });
    } catch (e) {
        console.error('CAPI relay error:', e);
        return Response.json({ ok: true }, { status: 200 }); // never surface errors to browser
    }
}
