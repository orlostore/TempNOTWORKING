// Cloudflare Pages Function - Guest to Account (One-Click)
// Location: /functions/api/auth/guest-to-account.js

import { hashPasswordPBKDF2, generateToken, generateTempPassword } from './crypto-utils.js';
import { customerEmail, plainText, sendEmail } from '../email-template.js';

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

        // 3. Generate temp password (cryptographically secure)
        const tempPassword = generateTempPassword();
        const passwordHash = await hashPasswordPBKDF2(tempPassword);

        // 4. Generate tokens
        const token = generateToken();
        const verificationToken = generateToken();

        // 5. Insert customer with hash_version = 2 (PBKDF2)
        const result = await DB.prepare(`
            INSERT INTO customers (email, password_hash, name, phone, token, email_verified, verification_token, created_at, hash_version, token_created_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, datetime('now'), 2, datetime('now'))
        `).bind(email, passwordHash, name, phone, token, verificationToken).run();

        const customerId = result.meta.last_row_id;

        // 6. Save address from Stripe if available
        const addr = details.address;
        if (addr && addr.line1) {
            await DB.prepare(`
                INSERT INTO customer_addresses (customer_id, full_name, phone, street, building, area, emirate, landmark, address_type, is_default, created_at)
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
                const origin = env.SITE_URL || new URL(request.url).origin;
                const verifyUrl = `${origin}/verify-email.html?token=${verificationToken}`;

                const credentialsHtml = `
                    <div style="background: #f8f9fa; border-radius: 10px; padding: 15px 20px; margin-bottom: 20px; border-left: 3px solid #e07856;">
                        <p style="margin: 0 0 6px; font-size: 13px; color: #666;"><strong>Email:</strong> ${email}</p>
                        <p style="margin: 0; font-size: 13px; color: #666;"><strong>Temporary Password:</strong> ${tempPassword}</p>
                    </div>
                    <p style="color: #d9534f; font-size: 13px; font-weight: 500; margin: 0 0 15px;">
                        Please change your password after your first login.
                    </p>
                `;

                const html = customerEmail({
                    origin,
                    titleEn: `Welcome, ${name}!`,
                    bodyEn: 'Your account has been created. Here are your login details:',
                    bodyAr: 'تم إنشاء حسابك. يرجى تغيير كلمة المرور بعد أول تسجيل دخول.',
                    ctaUrl: verifyUrl,
                    ctaText: 'Verify Email | تأكيد البريد',
                    fallbackUrl: verifyUrl,
                    extraHtml: credentialsHtml,
                    preheader: 'Your ORLO Store account is ready. Here are your login details.',
                });

                const text = plainText({
                    titleEn: `Welcome, ${name}!`,
                    bodyTextEn: `Your account has been created.\n\nEmail: ${email}\nTemporary Password: ${tempPassword}\n\nPlease change your password after your first login.`,
                    bodyTextAr: 'تم إنشاء حسابك. يرجى تغيير كلمة المرور بعد أول تسجيل دخول.',
                    ctaUrl: verifyUrl,
                    ctaText: 'Verify Email',
                });

                await sendEmail({
                    apiKey: env.RESEND_API_KEY,
                    to: email,
                    subject: 'Your ORLO Account is Ready | حسابك في أورلو جاهز',
                    html,
                    text,
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
