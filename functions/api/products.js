// Cloudflare Pages Function - Public Products API
// Location: /functions/api/products.js

export async function onRequestGet(context) {
    const { env } = context;
    const DB = env.DB;
    
    try {
        const { results } = await DB.prepare(`
            SELECT id, slug, name, nameAr, category, categoryAr, price, cost, quantity,
                   description, descriptionAr, mainImage, image2, image3, image4, image5,
                   image6, image7, image8, colors, colorsAr, packaging, packagingAr,
                   specifications, specificationsAr, featured
            FROM products
            ORDER BY featured DESC, id DESC
        `).all();
        
        const products = results.map(row => ({
            id: row.id,
            slug: row.slug,
            name: row.name,
            nameAr: row.nameAr,
            category: row.category,
            categoryAr: row.categoryAr,
            price: row.price,
            cost: row.cost || 0,
            quantity: row.quantity,
            description: row.description,
            descriptionAr: row.descriptionAr,
            image: row.mainImage,
            images: [row.mainImage, row.image2, row.image3, row.image4, row.image5, row.image6, row.image7, row.image8].filter(Boolean),
            colors: row.colors,
            colorsAr: row.colorsAr,
            packaging: row.packaging,
            packagingAr: row.packagingAr,
            specifications: row.specifications ? row.specifications.split(' | ').filter(Boolean) : [],
            specificationsAr: row.specificationsAr ? row.specificationsAr.split(' | ').filter(Boolean) : [],
            featured: row.featured === 1
        }));
        
        return new Response(JSON.stringify(products), {
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60'
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
