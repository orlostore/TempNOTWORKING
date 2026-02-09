// Cloudflare Pages Function - Customer Login API
// Location: /functions/api/auth/login.js

export async function onRequestPost(context) {
    const { env, request } = context;
    const DB = env.DB;
    
    try {
        const { email, password } = await request.json();
        
        // Validation
        if (!email || !password) {
            return Response.json({ error: 'Email and password are required' }, { status: 400 });
        }
        
        // Find customer
        const customer = await DB.prepare(`
            SELECT id, email, password_hash, name, phone, token
            FROM customers 
            WHERE email = ?
        `).bind(email.toLowerCase()).first();
        
        if (!customer) {
            return Response.json({ error: 'Invalid email or password' }, { status: 401 });
        }
        
        // Verify password
        const passwordHash = await hashPassword(password);
        
        if (passwordHash !== customer.password_hash) {
            return Response.json({ error: 'Invalid email or password' }, { status: 401 });
        }
        
        // Generate new token
        const newToken = generateToken();
        
        // Update token in database
        await DB.prepare('UPDATE customers SET token = ? WHERE id = ?')
            .bind(newToken, customer.id)
            .run();
        
        return Response.json({
            success: true,
            token: newToken,
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        return Response.json({ error: 'Login failed' }, { status: 500 });
    }
}

// Simple password hashing (must match signup.js)
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
