// Cloudflare Pages Function - Homepage SSR Bootstrap
// Intercepts requests to / and injects product data + active hero into HTML
// so the browser never needs to make an API call for initial render.

export async function onRequestGet(context) {
    const { request, env } = context;

    // Fetch static HTML + products in parallel.
    // Hero is read DIRECTLY from D1 (no subrequest) so it can't be
    // dropped by edge routing/caching quirks.
    const heroPromise = (async () => {
        try {
            if (!env.DB) return { err: 'no-db-binding' };
            const row = await env.DB.prepare(
                'SELECT * FROM site_heroes WHERE is_active = 1 ORDER BY sort_order ASC, id ASC LIMIT 1'
            ).first();
            return { row: row || null };
        } catch (e) {
            return { err: 'db-error:' + (e && e.message ? e.message.slice(0, 60) : 'unknown') };
        }
    })();

    const [htmlResponse, productsResponse, heroResult] = await Promise.all([
        env.ASSETS.fetch(new Request(request.url, { method: 'GET' })),
        fetch(new URL('/api/products', request.url).toString(), { cf: { cacheTtl: -1 } }).catch(() => null),
        heroPromise
    ]);

    // Debug flags so we can verify worker state from response headers
    const debug = { products: 'none', hero: 'none', rewroteHero: false };

    // --- Products (optional — failure shouldn't block hero rewrite) ---
    let productsData = null;
    if (productsResponse && productsResponse.ok) {
        try {
            const parsed = await productsResponse.json();
            if (Array.isArray(parsed) && parsed.length > 0) {
                productsData = parsed;
                debug.products = 'ok';
            } else {
                debug.products = 'empty';
            }
        } catch (e) {
            debug.products = 'parse-error';
        }
    } else {
        debug.products = productsResponse ? `http-${productsResponse.status}` : 'fetch-failed';
    }

    // --- Active hero (read directly from D1, independent of products) ---
    let heroData = null;
    if (heroResult && heroResult.row) {
        heroData = heroResult.row;
        debug.hero = 'ok';
    } else if (heroResult && heroResult.err) {
        debug.hero = heroResult.err;
    } else {
        debug.hero = 'no-active-row';
    }

    // Build a single rewriter and conditionally attach handlers
    const rewriter = new HTMLRewriter();

    // Bootstrap data + LCP preload + hero preload — all live in <head>
    if (productsData || heroData) {
        const safeJson = productsData
            ? JSON.stringify(productsData).replace(/<\/script>/gi, '<\\/script>')
            : null;

        let lcpImageUrl = null;
        if (productsData) {
            const featured = productsData.filter(p => p.featured);
            let popularList = [...featured];
            if (popularList.length < 6) {
                const arrivalIds = new Set([...productsData].sort((a, b) => b.id - a.id).slice(0, 4).map(p => p.id));
                const filler = productsData.filter(p => !p.featured && !arrivalIds.has(p.id));
                popularList = popularList.concat(filler.slice(0, 6 - popularList.length));
            }
            const lcpProduct = popularList[0];
            lcpImageUrl = lcpProduct && lcpProduct.image && lcpProduct.image.startsWith('http')
                ? `https://res.cloudinary.com/djxcdmc1g/image/fetch/c_fill,w_400,h_400,f_auto,q_auto/${lcpProduct.image}`
                : null;
        }

        const heroImagePreload = heroData && heroData.image_url ? heroData.image_url : null;

        rewriter.on('head', {
            element(element) {
                if (lcpImageUrl) {
                    element.append(
                        `<link rel="preload" as="image" fetchpriority="high" href="${lcpImageUrl}">`,
                        { html: true }
                    );
                }
                if (heroImagePreload) {
                    element.append(
                        `<link rel="preload" as="image" fetchpriority="high" href="${heroImagePreload}">`,
                        { html: true }
                    );
                }
                if (safeJson) {
                    element.prepend(
                        `<script>window.__BOOTSTRAP_DATA__=${safeJson}</script>`,
                        { html: true }
                    );
                }
            }
        });
    }

    // Hero rewrites — run whenever heroData is loaded, regardless of products
    if (heroData) {
        debug.rewroteHero = true;
        rewriter
            .on('#hero-img', {
                element(el) {
                    if (heroData.image_url) el.setAttribute('src', heroData.image_url);
                    if (heroData.name) el.setAttribute('alt', heroData.name);
                }
            })
            .on('#hero-title', {
                element(el) {
                    if (heroData.title) el.setInnerContent(heroData.title);
                }
            })
            .on('#hero-sub', {
                element(el) {
                    if (heroData.subtitle) el.setInnerContent(heroData.subtitle);
                }
            })
            .on('#hero-cta', {
                element(el) {
                    if (heroData.cta_link) el.setAttribute('href', heroData.cta_link);
                }
            })
            .on('#hero-cta-en', {
                element(el) {
                    if (heroData.cta_text) el.setInnerContent(heroData.cta_text);
                }
            })
            .on('#hero-cta-ar', {
                element(el) {
                    if (heroData.cta_text_ar) el.setInnerContent(heroData.cta_text_ar);
                }
            });
    }

    const transformedResponse = rewriter.transform(htmlResponse);

    transformedResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    transformedResponse.headers.set('Pragma', 'no-cache');
    transformedResponse.headers.set('Expires', '0');
    transformedResponse.headers.set('Vary', '*');
    transformedResponse.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
    transformedResponse.headers.set('CDN-Cache-Control', 'no-store');
    transformedResponse.headers.delete('ETag');
    transformedResponse.headers.delete('Last-Modified');
    // Debug headers so we can verify the worker is doing what we expect
    transformedResponse.headers.set('X-Orlo-SSR', 'v2');
    transformedResponse.headers.set('X-Orlo-Products', debug.products);
    transformedResponse.headers.set('X-Orlo-Hero', debug.hero);
    transformedResponse.headers.set('X-Orlo-Hero-Rewrite', debug.rewroteHero ? '1' : '0');
    if (heroData && heroData.image_url) {
        transformedResponse.headers.set('X-Orlo-Hero-Src', heroData.image_url);
    }

    return transformedResponse;
}
