// Cloudflare Pages Function - Meta CAPI Event Relay
// Receives mid-funnel browser events and forwards to Meta Conversions API
// Browser calls this endpoint on your domain, bypassing ad blockers that block facebook.com

const ALLOWED_EVENTS = new Set(['AddToCart', 'InitiateCheckout']);
const META_PIXEL_ID = '4275846289322000';

export async function onRequestPost(context) {
    const { request, env } = context;

    if (!env.META_CAPI_TOKEN) {
        return Response.json({ ok: true }, { status: 200 }); // silent no-op if token not set
    }

    try {
        const body = await request.json();
        const { event_name, event_id, event_source_url, custom_data } = body;

        if (!ALLOWED_EVENTS.has(event_name)) {
            return Response.json({ error: 'Invalid event' }, { status: 400 });
        }

        const capiPayload = {
            data: [{
                event_name,
                event_time: Math.floor(Date.now() / 1000),
                event_id: event_id || crypto.randomUUID(),
                action_source: 'website',
                event_source_url: event_source_url || (env.SITE_URL || 'https://orlostore.com'),
                user_data: {
                    client_ip_address: request.headers.get('CF-Connecting-IP') || undefined,
                    client_user_agent: request.headers.get('User-Agent') || undefined,
                },
                custom_data: custom_data || {},
            }]
        };

        const capiRes = await fetch(`https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${env.META_CAPI_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(capiPayload),
        });

        if (!capiRes.ok) {
            const err = await capiRes.text();
            console.error(`Meta CAPI ${event_name} error:`, err);
        } else {
            console.log(`Meta CAPI ${event_name} sent, event_id:`, event_id);
        }

        return Response.json({ ok: true }, { status: 200 });
    } catch (e) {
        console.error('CAPI relay error:', e);
        return Response.json({ ok: true }, { status: 200 }); // always 200 — never surface errors to browser
    }
}
