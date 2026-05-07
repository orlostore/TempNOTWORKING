// Cloudflare Pages Function - Product SEO Middleware
// Intercepts /product.html requests and injects correct meta tags
// so Google's crawler sees unique title/description/canonical per product

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const slug = url.searchParams.get('product');

  // Strip If-None-Match/If-Modified-Since so ASSETS never returns a 304
  const cleanHeaders = new Headers(request.headers);
  cleanHeaders.delete('If-None-Match');
  cleanHeaders.delete('If-Modified-Since');
  const cleanRequest = new Request(url.href, { method: 'GET', headers: cleanHeaders });

  // No slug = serve the static page with no-cache headers
  if (!slug) {
    const response = await env.ASSETS.fetch(cleanRequest);
    applyNoCacheHeaders(response);
    return response;
  }

  // Fetch product from D1
  let product;
  try {
    product = await env.DB.prepare(
      'SELECT name, slug, description, price, quantity, mainImage, category FROM products WHERE slug = ? LIMIT 1'
    ).bind(slug).first();
  } catch (e) {
    const response = await env.ASSETS.fetch(cleanRequest);
    applyNoCacheHeaders(response);
    return response;
  }

  // Product not found — return real 404 so Google deindexes dead slugs
  // (was 200 + JS-rendered "Product not found", which Google flagged as a
  // soft 404 / redirect error). Body is still the static page so users
  // landing on a stale link see the friendly message.
  if (!product) {
    const response = await env.ASSETS.fetch(cleanRequest);
    const r = new Response(response.body, { status: 404, statusText: 'Not Found', headers: response.headers });
    applyNoCacheHeaders(r);
    return r;
  }

  // Build SEO values
  const productUrl = 'https://orlostore.com/product.html?product=' + encodeURIComponent(product.slug);
  const rawDesc = (product.description || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const seoDesc = rawDesc.slice(0, 155) || ('Buy ' + product.name + ' online in Dubai & UAE. Free delivery over 75 AED. Shop at ORLO Store.');
  const seoTitle = product.name + ' | Buy Online in Dubai UAE \u2013 ORLO Store';
  const productImage = (product.mainImage && product.mainImage.startsWith('http')) ? product.mainImage : 'https://orlostore.com/logo.png';
  const availability = (product.quantity != null && product.quantity <= 0) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock';

  // Product JSON-LD for rich results
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: rawDesc.slice(0, 500),
    image: productImage,
    url: productUrl,
    brand: { '@type': 'Brand', name: 'ORLO' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'AED',
      availability: availability,
      url: productUrl,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'ORLO' }
    }
  });

  // Fetch the static product.html with clean request (no conditional headers)
  const response = await env.ASSETS.fetch(cleanRequest);

  const transformedResponse = new HTMLRewriter()
    .on('title', {
      text(text) {
        if (text.text.trim()) text.replace(seoTitle);
      }
    })
    .on('meta[name="description"]', {
      element(el) { el.setAttribute('content', seoDesc); }
    })
    .on('link[rel="canonical"]', {
      element(el) { el.setAttribute('href', productUrl); }
    })
    .on('meta[property="og:title"]', {
      element(el) { el.setAttribute('content', seoTitle); }
    })
    .on('meta[property="og:description"]', {
      element(el) { el.setAttribute('content', seoDesc); }
    })
    .on('meta[property="og:url"]', {
      element(el) { el.setAttribute('content', productUrl); }
    })
    .on('meta[property="og:image"]', {
      element(el) { el.setAttribute('content', productImage); }
    })
    .on('meta[property="og:image:alt"]', {
      element(el) { el.setAttribute('content', product.name + ' - ORLO Store Dubai UAE'); }
    })
    .on('meta[name="twitter:title"]', {
      element(el) { el.setAttribute('content', seoTitle); }
    })
    .on('meta[name="twitter:description"]', {
      element(el) { el.setAttribute('content', seoDesc); }
    })
    .on('meta[name="twitter:image"]', {
      element(el) { el.setAttribute('content', productImage); }
    })
    .on('head', {
      element(el) {
        if (productImage && productImage.startsWith('http')) {
          const cdnImg = `https://res.cloudinary.com/djxcdmc1g/image/fetch/c_fill,w_600,h_600,f_auto,q_auto/${productImage}`;
          el.append('<link rel="preload" as="image" fetchpriority="high" href="' + cdnImg + '">', { html: true });
        }
        el.append('<script type="application/ld+json">' + jsonLd + '</script>', { html: true });
      }
    })
    .transform(response);

  applyNoCacheHeaders(transformedResponse);
  return transformedResponse;
}

function applyNoCacheHeaders(response) {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.delete('ETag');
  response.headers.delete('Last-Modified');
}
