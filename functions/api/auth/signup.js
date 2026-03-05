// Cloudflare Pages Function - Customer Signup API
// Location: /functions/api/auth/signup.js

import { hashPasswordPBKDF2, generateToken } from './crypto-utils.js';
import { customerEmail, plainText, sendEmail } from '../email-template.js';

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
                const origin = env.SITE_URL || new URL(request.url).origin;
                const verifyUrl = `${origin}/verify-email.html?token=${verificationToken}`;

                const html = customerEmail({
                    origin,
                    titleEn: `Welcome, ${name}!`,
                    bodyEn: 'Thank you for creating an account with ORLO Store. Please verify your email address by clicking the button below:',
                    bodyAr: 'شكراً لإنشاء حساب في متجر أورلو. يرجى تأكيد بريدك الإلكتروني بالضغط على الزر أدناه:',
                    ctaUrl: verifyUrl,
                    ctaText: 'Verify Email | تأكيد البريد',
                    fallbackUrl: verifyUrl,
                    preheader: 'Please verify your email to activate your ORLO Store account.',
                });

                const text = plainText({
                    titleEn: `Welcome, ${name}!`,
                    bodyTextEn: 'Thank you for creating an account with ORLO Store. Please verify your email address:',
                    bodyTextAr: 'شكراً لإنشاء حساب في متجر أورلو. يرجى تأكيد بريدك الإلكتروني:',
                    ctaUrl: verifyUrl,
                    ctaText: 'Verify Email',
                });

                await sendEmail({
                    apiKey: env.RESEND_API_KEY,
                    to: email.toLowerCase(),
                    subject: 'Verify Your Email | تأكيد بريدك الإلكتروني',
                    html,
                    text,
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
