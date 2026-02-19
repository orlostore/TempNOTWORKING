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
        
        // Hash password with PBKDF2
        const passwordHash = await hashPasswordPBKDF2(password);

        // Generate auth token and verification token
        const token = generateToken();
        const verificationToken = generateToken();

        // Insert customer with email_verified = 0, hash_version = 2 (PBKDF2)
        const result = await DB.prepare(`
            INSERT INTO customers (email, password_hash, name, phone, token, email_verified, verification_token, created_at, hash_version, token_created_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, datetime('now'), 2, datetime('now'))
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
                const verifyUrl = `https://temp-5lr.pages.dev/verify-email.html?token=${verificationToken}`;
                
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'ORLO Store <noreply@orlostore.com>',
                        to: email.toLowerCase(),
                        subject: 'Verify Your Email | تأكيد بريدك الإلكتروني',
                        html: `
                            <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f8f9fa; padding: 0; border-radius: 12px; overflow: hidden;">
                                <div style="background: linear-gradient(135deg, #2c4a5c 0%, #1e3545 100%); padding: 30px 20px; text-align: center;">
                                    <img src="https://temp-5lr.pages.dev/logo.png" alt="ORLO Store" style="width: 70px; height: 70px; margin-bottom: 8px;">
                                    <div style="color: #2c4a5c; font-size: 22px; font-weight: 700; letter-spacing: 1px;">ORLO Store</div>
                                </div>
                                <div style="background: white; padding: 30px 25px;">
                                    <h2 style="color: #2c4a5c; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Welcome, ${name}!</h2>
                                    <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 0 0 10px;">
                                        Thank you for creating an account with ORLO Store. Please verify your email address by clicking the button below:
                                    </p>
                                    <p style="color: #888; font-size: 13px; line-height: 1.6; margin: 0 0 25px; font-family: 'Almarai', Arial, sans-serif; direction: rtl; text-align: right;">
                                        شكراً لإنشاء حساب في متجر أورلو. يرجى تأكيد بريدك الإلكتروني بالضغط على الزر أدناه:
                                    </p>
                                    <div style="text-align: center; margin: 25px 0;">
                                        <a href="${verifyUrl}" style="background: #e07856; color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
                                            Verify Email | تأكيد البريد
                                        </a>
                                    </div>
                                    <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 20px 0 0;">
                                        If the button doesn't work, copy and paste this link:<br>
                                        <a href="${verifyUrl}" style="color: #e07856; word-break: break-all;">${verifyUrl}</a>
                                    </p>
                                </div>
                                <div style="background: #f8f9fa; padding: 20px 25px; text-align: center; border-top: 1px solid #eee;">
                                    <p style="color: #aaa; font-size: 11px; margin: 0;">
                                        © ORLO Store | info@orlostore.com
                                    </p>
                                </div>
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

// PBKDF2 password hashing (strong, Cloudflare Workers compatible)
async function hashPasswordPBKDF2(password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial, 256
    );
    const saltHex = Array.from(salt, b => b.toString(16).padStart(2, '0')).join('');
    const hashHex = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
    return `pbkdf2:100000:${saltHex}:${hashHex}`;
}

// Generate random token
function generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
