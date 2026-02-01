// Cloudflare Pages Function - Restock Inventory
// Usage: /api/admin/restock?key=SECRET&slug=product-slug&add=50
// Or:    /api/admin/restock?key=SECRET&slug=product-slug&set=100

const ADMIN_KEY = 'Sy$tem88';

export async function onRequestGet(context) {
    const { request, env } = context;
    const DB = env.DB;
    
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    const slug = url.searchParams.get('slug');
    const addQty = url.searchParams.get('add');
    const setQty = url.searchParams.get('set');
    
    // Verify admin key
    if (key !== ADMIN_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Validate parameters
    if (!slug) {
        return new Response(JSON.stringify({ error: 'Missing slug parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    if (!addQty && !setQty) {
        return new Response(JSON.stringify({ error: 'Missing add or set parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    try {
        // Check if product exists
        const product = await DB.prepare('SELECT slug, name, quantity FROM products WHERE slug = ?')
            .bind(slug)
            .first();
        
        if (!product) {
            return new Response(JSON.stringify({ error: `Product not found: ${slug}` }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const oldQty = product.quantity;
        let newQty;
        
        if (setQty) {
            // Set exact quantity
            newQty = parseInt(setQty);
            await DB.prepare('UPDATE products SET quantity = ? WHERE slug = ?')
                .bind(newQty, slug)
                .run();
        } else {
            // Add to quantity
            newQty = oldQty + parseInt(addQty);
            await DB.prepare('UPDATE products SET quantity = ? WHERE slug = ?')
                .bind(newQty, slug)
                .run();
        }
        
        return new Response(JSON.stringify({
            success: true,
            product: product.name,
            slug: slug,
            oldQuantity: oldQty,
            newQuantity: newQty,
            action: setQty ? 'set' : 'add'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
