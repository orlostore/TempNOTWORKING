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
        
        // Hash password
        const passwordHash = await hashPassword(password);
        
        // Generate auth token and verification token
        const token = generateToken();
        const verificationToken = generateToken();
        
        // Insert customer with email_verified = 0
        const result = await DB.prepare(`
            INSERT INTO customers (email, password_hash, name, phone, token, email_verified, verification_token, created_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, datetime('now'))
        `).bind(
            email.toLowerCase(),
            passwordHash,
            name,
            phone || '',
            token,
            verificationToken
        ).run();
        
        const customerId = result.meta.last_row_id;
        
        // Send verification email via Resend
        if (env.RESEND_API_KEY) {
            try {
                const verifyUrl = `https://orlostore.com/verify-email.html?token=${verificationToken}`;
                
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'ORLO <noreply@orlostore.com>',
                        to: email.toLowerCase(),
                        subject: 'Verify Your Email | تأكيد بريدك الإلكتروني',
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <h1 style="color: #2c4a5c; margin: 0;">ORLO</h1>
                                </div>
                                <h2 style="color: #2c4a5c;">Welcome, ${name}!</h2>
                                <p style="color: #555; font-size: 15px; line-height: 1.6;">
                                    Thank you for creating an account. Please verify your email address by clicking the button below:
                                </p>
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${verifyUrl}" style="background: #e07856; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                                        Verify Email | تأكيد البريد
                                    </a>
                                </div>
                                <p style="color: #888; font-size: 13px; line-height: 1.5;">
                                    If the button doesn't work, copy and paste this link:<br>
                                    <a href="${verifyUrl}" style="color: #e07856;">${verifyUrl}</a>
                                </p>
                                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                                <p style="color: #aaa; font-size: 12px; text-align: center; font-family: 'Almarai', Arial, sans-serif; direction: rtl;">
                                    مرحباً ${name}، يرجى تأكيد بريدك الإلكتروني بالضغط على الزر أعلاه
                                </p>
                            </div>
                        `
                    })
                });
            } catch (emailError) {
                console.error('Verification email error:', emailError);
                // Don't fail signup if email fails
            }
        }
        
        return Response.json({
            success: true,
            token: token,
            customer: {
                id: customerId,
                name: name,
                email: email.toLowerCase(),
                phone: phone || '',
                email_verified: false
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
