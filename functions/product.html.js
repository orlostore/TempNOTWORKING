// Cloudflare Pages Function - Product SEO Middleware
// Intercepts /product.html requests and injects correct meta tags
// so Google's crawler sees unique title/description/canonical per product

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const slug = url.searchParams.get('product');

  // No slug = just serve the static page as-is
  if (!slug) return next();

  // Fetch product from D1
  let product;
  try {
    product = await env.DB.prepare(
      'SELECT name, slug, description, price, quantity, mainImage, category FROM products WHERE slug = ? LIMIT 1'
    ).bind(slug).first();
  } catch (e) {
    // DB error - fall through to static page
    return next();
  }

  // Product not found - serve static page as-is
  if (!product) return next();

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

  // Fetch the original static product.html and rewrite it
  const response = await next();

  return new HTMLRewriter()
    // Rewrite <title>
    .on('title', {
      text(text) {
        if (text.text.trim()) text.replace(seoTitle);
      }
    })
    // Rewrite <meta name="description">
    .on('meta[name="description"]', {
      element(el) { el.setAttribute('content', seoDesc); }
    })
    // Rewrite <link rel="canonical">
    .on('link[rel="canonical"]', {
      element(el) { el.setAttribute('href', productUrl); }
    })
    // Rewrite Open Graph tags
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
    // Rewrite Twitter tags
    .on('meta[name="twitter:title"]', {
      element(el) { el.setAttribute('content', seoTitle); }
    })
    .on('meta[name="twitter:description"]', {
      element(el) { el.setAttribute('content', seoDesc); }
    })
    .on('meta[name="twitter:image"]', {
      element(el) { el.setAttribute('content', productImage); }
    })
    // Inject Product JSON-LD into <head>
    .on('head', {
      element(el) {
        el.append('<script type="application/ld+json">' + jsonLd + '</script>', { html: true });
      }
    })
    .transform(response);
}
