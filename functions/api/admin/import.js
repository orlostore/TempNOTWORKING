// Cloudflare Pages Function - Import Products from Google Sheets
// Usage: /api/admin/import?key=SECRET
// This imports ALL products from Google Sheets into D1 (one-time setup)

const ADMIN_KEY = 'Sy$tem88';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRPRs_Wd4lFMv_WF6qfxHffAauQ8DoWvrPAIgs0vmz4m1lwBvIwqe0pLcsQc2PcA4xo96IsP5J0v50L/pub?output=csv';

export async function onRequestGet(context) {
    const { request, env } = context;
    const DB = env.DB;
    
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    
    // Verify admin key
    if (key !== ADMIN_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    try {
        // Fetch Google Sheets CSV
        const response = await fetch(SHEET_URL);
        const csv = await response.text();
        const rows = parseCSV(csv);
        
        if (rows.length === 0) {
            return new Response(JSON.stringify({ error: 'No products found in sheet' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Clear existing products (optional - comment out if you want to keep existing)
        // await DB.prepare('DELETE FROM products').run();
        
        let imported = 0;
        let updated = 0;
        let errors = [];
        
        for (const row of rows) {
            if (!row.name || !row.slug) continue;
            
            try {
                // Check if product exists
                const existing = await DB.prepare('SELECT id FROM products WHERE slug = ?')
                    .bind(row.slug)
                    .first();
                
                if (existing) {
                    // Update existing (but NOT quantity - preserve sales deductions)
                    await DB.prepare(`
                        UPDATE products SET
                            name = ?, nameAr = ?, description = ?, descriptionAr = ?,
                            price = ?, category = ?, categoryAr = ?, featured = ?,
                            mainImage = ?, image2 = ?, image3 = ?, image4 = ?, image5 = ?,
                            colors = ?, colorsAr = ?, packaging = ?, packagingAr = ?,
                            specifications = ?, specificationsAr = ?
                        WHERE slug = ?
                    `).bind(
                        row.name,
                        row.nameAR || row.nameAr || '',
                        row.description || '',
                        row.descriptionAr || '',
                        parseFloat(row.price) || 0,
                        row.category || '',
                        row.categoryAr || row.categoryAR || '',
                        row.featured === '1' || row.featured === 'true' || row.featured === 'TRUE' ? 1 : 0,
                        row.mainImage || '',
                        row.image2 || '',
                        row.image3 || '',
                        row.image4 || '',
                        row.image5 || '',
                        row.colors || '',
                        row.colorsAR || row.colorsAr || '',
                        row.packaging || '',
                        row.packagingAr || '',
                        row.specifications || '',
                        row.specificationsAr || '',
                        row.slug
                    ).run();
                    updated++;
                } else {
                    // Insert new product
                    await DB.prepare(`
                        INSERT INTO products (
                            slug, name, nameAr, description, descriptionAr,
                            price, quantity, category, categoryAr, featured,
                            mainImage, image2, image3, image4, image5,
                            colors, colorsAr, packaging, packagingAr,
                            specifications, specificationsAr
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(
                        row.slug,
                        row.name,
                        row.nameAR || row.nameAr || '',
                        row.description || '',
                        row.descriptionAr || '',
                        parseFloat(row.price) || 0,
                        parseInt(row.quantity) || 0,
                        row.category || '',
                        row.categoryAr || row.categoryAR || '',
                        row.featured === '1' || row.featured === 'true' || row.featured === 'TRUE' ? 1 : 0,
                        row.mainImage || '',
                        row.image2 || '',
                        row.image3 || '',
                        row.image4 || '',
                        row.image5 || '',
                        row.colors || '',
                        row.colorsAR || row.colorsAr || '',
                        row.packaging || '',
                        row.packagingAr || '',
                        row.specifications || '',
                        row.specificationsAr || ''
                    ).run();
                    imported++;
                }
            } catch (e) {
                errors.push({ slug: row.slug, error: e.message });
            }
        }
        
        return new Response(JSON.stringify({
            success: true,
            imported: imported,
            updated: updated,
            errors: errors,
            total: rows.length
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

// Parse CSV to array of objects
function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let char of lines[i]) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        data.push(obj);
    }
    return data;
}
