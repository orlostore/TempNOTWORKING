// Cloudflare Pages Function - Customer Signup API
// Location: /functions/api/auth/signup.js

export async function onRequestPost(context) {
    const { env, request } = context;
    const DB = env.DB;
    
    try {
        const { name, email, phone, password } = await request.json();
        
        // Validation
        if (!name || !email || !password) {
            return Response.json({ error: 'Name, email and password are required' }, { status: 400 });
        }
        
        if (password.length < 8) {
            return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }
        
        // Check if email already exists
        const existing = await DB.prepare('SELECT id FROM customers WHERE email = ?').bind(email.toLowerCase()).first();
        
        if (existing) {
            return Response.json({ error: 'Email already registered' }, { status: 400 });
        }
        
        // Hash password (simple hash for demo - in production use bcrypt via Worker)
        const passwordHash = await hashPassword(password);
        
        // Generate token
        const token = generateToken();
        
        // Insert customer
        const result = await DB.prepare(`
            INSERT INTO customers (email, password_hash, name, phone, token, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(
            email.toLowerCase(),
            passwordHash,
            name,
            phone || '',
            token
        ).run();
        
        const customerId = result.meta.last_row_id;
        
        return Response.json({
            success: true,
            token: token,
            customer: {
                id: customerId,
                name: name,
                email: email.toLowerCase(),
                phone: phone || ''
            }
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        return Response.json({ error: 'Failed to create account' }, { status: 500 });
    }
}

// Simple password hashing (use Web Crypto API)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'ORLO_SALT_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate random token
function generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
