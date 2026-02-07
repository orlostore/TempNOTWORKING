// Cloudflare Pages Function - Product Admin API
// Location: /functions/api/admin/product.js

export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    const action = url.searchParams.get('action');
    const id = url.searchParams.get('id');
    
    // Auth check
    if (key !== env.ADMIN_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    const DB = env.DB;
    
    try {
        const data = await request.json();
        
        if (action === 'add') {
            // Insert new product
            await DB.prepare(`
                INSERT INTO products (
                    slug, name, nameAr, category, categoryAr, price, cost, quantity,
                    description, descriptionAr, mainImage, image2, image3, image4, image5,
                    image6, image7, image8, colors, colorsAr, packaging, packagingAr,
                    specifications, specificationsAr, featured
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                data.slug,
                data.name,
                data.nameAr || '',
                data.category || '',
                data.categoryAr || '',
                data.price,
                data.cost || 0,
                data.quantity || 0,
                data.description || '',
                data.descriptionAr || '',
                data.mainImage || '',
                data.image2 || '',
                data.image3 || '',
                data.image4 || '',
                data.image5 || '',
                data.image6 || '',
                data.image7 || '',
                data.image8 || '',
                data.colors || '',
                data.colorsAr || '',
                data.packaging || '',
                data.packagingAr || '',
                data.specifications || '',
                data.specificationsAr || '',
                data.featured || 0
            ).run();
            
            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (action === 'update' && id) {
            // Update existing product
            await DB.prepare(`
                UPDATE products SET
                    slug = ?, name = ?, nameAr = ?, category = ?, categoryAr = ?,
                    price = ?, cost = ?, quantity = ?, description = ?, descriptionAr = ?,
                    mainImage = ?, image2 = ?, image3 = ?, image4 = ?, image5 = ?,
                    image6 = ?, image7 = ?, image8 = ?,
                    colors = ?, colorsAr = ?, packaging = ?, packagingAr = ?,
                    specifications = ?, specificationsAr = ?, featured = ?
                WHERE id = ?
            `).bind(
                data.slug,
                data.name,
                data.nameAr || '',
                data.category || '',
                data.categoryAr || '',
                data.price,
                data.cost || 0,
                data.quantity,
                data.description || '',
                data.descriptionAr || '',
                data.mainImage || '',
                data.image2 || '',
                data.image3 || '',
                data.image4 || '',
                data.image5 || '',
                data.image6 || '',
                data.image7 || '',
                data.image8 || '',
                data.colors || '',
                data.colorsAr || '',
                data.packaging || '',
                data.packagingAr || '',
                data.specifications || '',
                data.specificationsAr || '',
                data.featured || 0,
                id
            ).run();
            
            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestGet(context) {
    const { env } = context;
    const url = new URL(context.request.url);
    const key = url.searchParams.get('key');
    const action = url.searchParams.get('action');
    const id = url.searchParams.get('id');
    
    // Auth check
    if (key !== env.ADMIN_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    const DB = env.DB;
    
    if (action === 'delete' && id) {
        try {
            await DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
    });
}
