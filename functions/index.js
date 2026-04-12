// Cloudflare Pages Function - Homepage SSR Bootstrap
// Intercepts requests to / and injects product data into HTML
// so the browser never needs to make an API call for initial render.

export async function onRequestGet(context) {
    const { request, env } = context;

    // Fetch static HTML and products API in parallel
    const [htmlResponse, productsResponse] = await Promise.all([
        env.ASSETS.fetch(request),
        fetch(new URL('/api/products', request.url).toString()).catch(() => null)
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

    // Inject bootstrap data into <head> before it reaches the browser
    return new HTMLRewriter()
        .on('head', {
            element(element) {
                element.append(
                    `<script>window.__BOOTSTRAP_DATA__=${safeJson}</script>`,
                    { html: true }
                );
            }
        })
        .transform(htmlResponse);
}
