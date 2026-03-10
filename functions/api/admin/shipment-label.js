// Cloudflare Pages Function - Get Zajel Shipment Label (AWB)
// Location: /functions/api/admin/shipment-label.js

import { getKey, getAdminUser } from './_helpers.js';
import { zajelApi, ensureShipmentsTable } from './zajel.js';

export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        // Support both header auth and query param auth (for opening in new tab)
        const url = new URL(request.url);
        const key = getKey(request) || url.searchParams.get('key');
        const user = await getAdminUser(env, key);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orderId = url.searchParams.get('order_id');
        const refNumber = url.searchParams.get('reference_number');

        if (!orderId && !refNumber) {
            return Response.json({ error: 'order_id or reference_number required' }, { status: 400 });
        }

        await ensureShipmentsTable(env.DB);

        // Get Zajel reference from DB
        let zajelRef = refNumber;
        if (!zajelRef && orderId) {
            const shipment = await env.DB.prepare(
                'SELECT zajel_reference FROM shipments WHERE order_id = ?'
            ).bind(orderId).first();
            zajelRef = shipment?.zajel_reference;
        }

        if (!zajelRef) {
            return Response.json({ error: 'No Zajel reference found' }, { status: 404 });
        }

        // Call Zajel GetShipmentLabel API — returns PDF binary
        const result = await zajelApi(env, {
            method: 'GET',
            endpoint: '/api/Merchant/GetShipmentLabel',
            params: { reference_number: zajelRef },
        });

        if (result.ok && result.response) {
            const contentType = result.response.headers.get('content-type') || '';

            // If Zajel returns raw PDF binary
            if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
                const pdfBuffer = await result.response.arrayBuffer();
                return new Response(pdfBuffer, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `inline; filename="AWB-${zajelRef}.pdf"`,
                    },
                });
            }

            // Zajel may return JSON with base64-encoded PDF
            const body = await result.response.text();
            let parsed;
            try { parsed = JSON.parse(body); } catch { parsed = null; }

            if (parsed) {
                // Common patterns: { data: "base64..." }, { label: "base64..." }, { pdf: "base64..." }
                const b64 = parsed.data || parsed.label || parsed.pdf || parsed.Data || parsed.Label || parsed.Pdf || parsed.content || parsed.Content;
                if (b64 && typeof b64 === 'string') {
                    // Strip data URI prefix if present
                    const raw = b64.replace(/^data:[^;]+;base64,/, '');
                    const binary = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
                    return new Response(binary, {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/pdf',
                            'Content-Disposition': `inline; filename="AWB-${zajelRef}.pdf"`,
                        },
                    });
                }
                // If JSON but no PDF content, return the raw JSON for debugging
                return Response.json({
                    success: false,
                    error: 'Zajel returned JSON without PDF content',
                    zajel_response: parsed,
                }, { status: 502 });
            }

            // Check if response is raw base64-encoded PDF (starts with JVBER = %PDF in base64)
            const trimmed = body.trim();
            if (trimmed.startsWith('JVBER') || trimmed.match(/^[A-Za-z0-9+/=\s]+$/) && trimmed.length > 100) {
                try {
                    const clean = trimmed.replace(/\s/g, '');
                    const binary = Uint8Array.from(atob(clean), c => c.charCodeAt(0));
                    return new Response(binary, {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/pdf',
                            'Content-Disposition': `inline; filename="AWB-${zajelRef}.pdf"`,
                        },
                    });
                } catch (e) {
                    // Not valid base64, fall through
                }
            }

            // Fallback: treat as raw PDF bytes (some APIs don't set content-type correctly)
            const fallbackBuf = new TextEncoder().encode(body);
            // Quick check: PDF files start with %PDF
            if (body.startsWith('%PDF')) {
                return new Response(fallbackBuf, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `inline; filename="AWB-${zajelRef}.pdf"`,
                    },
                });
            }

            return Response.json({
                success: false,
                error: 'Unexpected response from Zajel',
                contentType,
                bodyPreview: body.slice(0, 500),
            }, { status: 502 });
        }

        return Response.json({
            success: false,
            error: 'Failed to fetch label from Zajel',
        }, { status: 400 });

    } catch (error) {
        console.error('Shipment label error:', error);
        return Response.json({ error: 'Failed to get label: ' + error.message }, { status: 500 });
    }
}
