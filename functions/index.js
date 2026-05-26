// Cloudflare Pages Function - Homepage SSR Bootstrap
// Intercepts requests to / and injects product data into HTML
// so the browser never needs to make an API call for initial render.

export async function onRequestGet(context) {
    const { request, env } = context;

    // Fetch static HTML + products + active hero in parallel
    const [htmlResponse, productsResponse, heroResponse] = await Promise.all([
        env.ASSETS.fetch(new Request(request.url, { method: 'GET' })),
        fetch(new URL('/api/products', request.url).toString(), { cf: { cacheTtl: -1 } }).catch(() => null),
        fetch(new URL('/api/site-config/hero', request.url).toString(), { cf: { cacheTtl: 60 } }).catch(() => null)
    ]);

    // If products failed for any reason, return plain HTML (existing behaviour)
    if (!productsResponse || !productsResponse.ok) {
        return htmlResponse;
    }

    let productsData;
    try {
        productsData = await productsResponse.json();
        // Sanity check — must be a non-empty array
        if (!Array.isArray(productsData) || productsData.length === 0) {
            return htmlResponse;
        }
    } catch (e) {
        return htmlResponse;
    }

    // Active hero (falls back to whatever is hardcoded in index.html if fetch fails)
    let heroData = null;
    if (heroResponse && heroResponse.ok) {
        try {
            const j = await heroResponse.json();
            heroData = j && j.hero ? j.hero : null;
        } catch (e) { /* ignore */ }
    }

    // Safely serialize — prevent </script> injection
    const safeJson = JSON.stringify(productsData)
        .replace(/<\/script>/gi, '<\\/script>');

    // Find first Popular Now product (mirrors populatePopularNow logic in app.js)
    const featured = productsData.filter(p => p.featured);
    let popularList = [...featured];
    if (popularList.length < 6) {
        const arrivalIds = new Set([...productsData].sort((a, b) => b.id - a.id).slice(0, 4).map(p => p.id));
        const filler = productsData.filter(p => !p.featured && !arrivalIds.has(p.id));
        popularList = popularList.concat(filler.slice(0, 6 - popularList.length));
    }
    const lcpProduct = popularList[0];
    const lcpImageUrl = lcpProduct && lcpProduct.image && lcpProduct.image.startsWith('http')
        ? `https://res.cloudinary.com/djxcdmc1g/image/fetch/c_fill,w_400,h_400,f_auto,q_auto/${lcpProduct.image}`
        : null;
    // Hero image preload (the actual rendered hero, not the LCP product)
    const heroImagePreload = heroData && heroData.image_url ? heroData.image_url : null;

    // Inject bootstrap data + LCP preload into <head> + rewrite hero with active config
    const rewriter = new HTMLRewriter()
        .on('head', {
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
                element.prepend(
                    `<script>window.__BOOTSTRAP_DATA__=${safeJson}</script>`,
                    { html: true }
                );
            }
        });

    // Hero rewrites — only run if heroData is loaded; otherwise leave the hardcoded defaults
    if (heroData) {
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

    return transformedResponse;
}
