// Cloudflare Pages Function - Guest to Account (One-Click)
// Location: /functions/api/auth/guest-to-account.js

export async function onRequestPost(context) {
    const { env, request } = context;
    const DB = env.DB;

    try {
        const { session_id } = await request.json();

        if (!session_id) {
            return Response.json({ error: 'Session ID is required' }, { status: 400 });
        }

        // 1. Retrieve Stripe checkout session with customer details
        const sessionRes = await fetch(
            `https://api.stripe.com/v1/checkout/sessions/${session_id}?expand[]=customer_details`,
            {
                headers: {
                    'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`
                }
            }
        );

        if (!sessionRes.ok) {
            return Response.json({ error: 'Could not retrieve checkout session' }, { status: 400 });
        }

        const session = await sessionRes.json();
        const details = session.customer_details;

        if (!details || !details.email) {
            return Response.json({ error: 'No customer details found in session' }, { status: 400 });
        }

        const email = details.email.toLowerCase();
        const name = details.name || '';
        const phone = details.phone || '';

        // 2. Check if email already exists
        const existing = await DB.prepare('SELECT id FROM customers WHERE email = ?').bind(email).first();

        if (existing) {
            return Response.json({ error: 'Email already registered' }, { status: 400 });
        }

        // 3. Generate temp password
        const tempPassword = generateTempPassword();
        const passwordHash = await hashPassword(tempPassword);

        // 4. Generate tokens
        const token = generateToken();
        const verificationToken = generateToken();

        // 5. Insert customer
        const result = await DB.prepare(`
            INSERT INTO customers (email, password_hash, name, phone, token, email_verified, verification_token, created_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, datetime('now'))
        `).bind(email, passwordHash, name, phone, token, verificationToken).run();

        const customerId = result.meta.last_row_id;

        // 6. Save address from Stripe if available
        const addr = details.address;
        if (addr && addr.line1) {
            await DB.prepare(`
                INSERT INTO addresses (customer_id, full_name, phone, street, building, area, emirate, landmark, address_type, is_default, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'home', 1, datetime('now'))
            `).bind(
                customerId,
                name,
                phone,
                addr.line1 || '',
                addr.line2 || '',
                addr.city || '',
                addr.state || '',
                '',
                ).run();
        }

        // 7. Send email with temp password + verify link
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
                        to: email,
                        subject: 'Your ORLO Account is Ready | حسابك في أورلو جاهز',
                        html: `
                            <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f8f9fa; padding: 0; border-radius: 12px; overflow: hidden;">
                                <div style="background: linear-gradient(135deg, #2c4a5c 0%, #1e3545 100%); padding: 30px 20px; text-align: center;">
                                    <img src="https://temp-5lr.pages.dev/logo.png" alt="ORLO Store" style="width: 70px; height: 70px; margin-bottom: 8px;">
                                    <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; letter-spacing: 1px;">ORLO Store</div>
                                </div>
                                <div style="background: white; padding: 30px 25px;">
                                    <h2 style="color: #2c4a5c; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Welcome, ${name}!</h2>
                                    <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 0 0 10px;">
                                        Your account has been created. Here are your login details:
                                    </p>
                                    <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 15px 0; border-left: 3px solid #e07856;">
                                        <p style="margin: 0 0 6px; font-size: 13px; color: #666;"><strong>Email:</strong> ${email}</p>
                                        <p style="margin: 0; font-size: 13px; color: #666;"><strong>Temporary Password:</strong> ${tempPassword}</p>
                                    </div>
                                    <p style="color: #d9534f; font-size: 13px; font-weight: 500; margin: 0 0 15px;">
                                        Please change your password after your first login.
                                    </p>
                                    <p style="color: #888; font-size: 13px; line-height: 1.6; margin: 0 0 20px; font-family: 'Almarai', Arial, sans-serif; direction: rtl; text-align: right;">
                                        تم إنشاء حسابك. يرجى تغيير كلمة المرور بعد أول تسجيل دخول.
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
                console.error('Account email error:', emailError);
            }
        }

        // 8. Return success
        return Response.json({
            success: true,
            token: token,
            customer: {
                id: customerId,
                name: name,
                email: email,
                phone: phone,
                email_verified: false
            }
        });

    } catch (error) {
        console.error('Guest-to-account error:', error);
        return Response.json({ error: 'Failed to create account' }, { status: 500 });
    }
}

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'ORLO_SALT_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

function generateTempPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
