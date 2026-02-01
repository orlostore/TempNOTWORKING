// Cloudflare Pages Function - Admin Product CRUD
// Handles add, update, delete operations

const ADMIN_KEY = 'Sy$tem88';

export async function onRequestGet(context) {
    const { request, env } = context;
    const DB = env.DB;
    
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    const action = url.searchParams.get('action');
    const id = url.searchParams.get('id');
    
    if (key !== ADMIN_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Handle DELETE via GET (for simplicity)
    if (action === 'delete' && id) {
        try {
            await DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
            return new Response(JSON.stringify({ success: true }), {
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
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const DB = env.DB;
    
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    const action = url.searchParams.get('action');
    const id = url.searchParams.get('id');
    
    if (key !== ADMIN_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    try {
        const data = await request.json();
        
        if (action === 'add') {
            // Insert new product
            const result = await DB.prepare(`
                INSERT INTO products (
                    slug, name, nameAr, description, descriptionAr,
                    price, quantity, category, categoryAr, featured,
                    mainImage, image2, image3, image4, image5,
                    colors, colorsAr, packaging, packagingAr,
                    specifications, specificationsAr
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                data.slug,
                data.name,
                data.nameAr || '',
                data.description || '',
                data.descriptionAr || '',
                data.price || 0,
                data.quantity || 0,
                data.category || '',
                data.categoryAr || '',
                data.featured ? 1 : 0,
                data.mainImage || '',
                data.image2 || '',
                data.image3 || '',
                data.image4 || '',
                data.image5 || '',
                data.colors || '',
                data.colorsAr || '',
                data.packaging || '',
                data.packagingAr || '',
                data.specifications || '',
                data.specificationsAr || ''
            ).run();
            
            return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (action === 'update' && id) {
            // Update existing product
            await DB.prepare(`
                UPDATE products SET
                    slug = ?, name = ?, nameAr = ?, description = ?, descriptionAr = ?,
                    price = ?, quantity = ?, category = ?, categoryAr = ?, featured = ?,
                    mainImage = ?, image2 = ?, image3 = ?, image4 = ?, image5 = ?,
                    colors = ?, colorsAr = ?, packaging = ?, packagingAr = ?,
                    specifications = ?, specificationsAr = ?
                WHERE id = ?
            `).bind(
                data.slug,
                data.name,
                data.nameAr || '',
                data.description || '',
                data.descriptionAr || '',
                data.price || 0,
                data.quantity || 0,
                data.category || '',
                data.categoryAr || '',
                data.featured ? 1 : 0,
                data.mainImage || '',
                data.image2 || '',
                data.image3 || '',
                data.image4 || '',
                data.image5 || '',
                data.colors || '',
                data.colorsAr || '',
                data.packaging || '',
                data.packagingAr || '',
                data.specifications || '',
                data.specificationsAr || '',
                id
            ).run();
            
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
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

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
