// Cloudflare Pages Function - Homepage SSR Bootstrap
// Intercepts requests to / and injects product data into HTML
// so the browser never needs to make an API call for initial render.

export async function onRequestGet(context) {
    const { request, env } = context;

    // Fetch static HTML and products API in parallel
    const [htmlResponse, productsResponse] = await Promise.all([
        env.ASSETS.fetch(new Request(request.url, { method: 'GET' })),
        fetch(new URL('/api/products', request.url).toString(), { cf: { cacheTtl: -1 } }).catch(() => null)
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

    // Inject bootstrap data + LCP preload into <head>
    const transformedResponse = new HTMLRewriter()
        .on('head', {
            element(element) {
                if (lcpImageUrl) {
                    element.append(
                        `<link rel="preload" as="image" fetchpriority="high" href="${lcpImageUrl}">`,
                        { html: true }
                    );
                }
                element.prepend(
                    `<script>window.__BOOTSTRAP_DATA__=${safeJson}</script>`,
                    { html: true }
                );
            }
        })
        .transform(htmlResponse);

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
