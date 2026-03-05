// Cloudflare Pages Function - Email Verification API
// Location: /functions/api/auth/verify.js

import { generateToken } from './crypto-utils.js';
import { customerEmail, plainText, sendEmail } from '../email-template.js';

export async function onRequestGet(context) {
    const { env, request } = context;
    const DB = env.DB;

    try {
        const url = new URL(request.url);
        const token = url.searchParams.get('token');

        if (!token) {
            return Response.json({ error: 'Verification token is required' }, { status: 400 });
        }

        // Find customer by verification token
        const customer = await DB.prepare('SELECT id, email, email_verified FROM customers WHERE verification_token = ?')
            .bind(token)
            .first();

        if (!customer) {
            return Response.json({ error: 'Invalid or expired verification link' }, { status: 400 });
        }

        if (customer.email_verified === 1) {
            return Response.json({ success: true, message: 'Email already verified', already_verified: true });
        }

        // Mark email as verified and clear the token
        await DB.prepare('UPDATE customers SET email_verified = 1, verification_token = NULL WHERE id = ?')
            .bind(customer.id)
            .run();

        return Response.json({
            success: true,
            message: 'Email verified successfully'
        });

    } catch (error) {
        console.error('Verification error:', error);
        return Response.json({ error: 'Verification failed' }, { status: 500 });
    }
}

// Also support POST for resending verification email
export async function onRequestPost(context) {
    const { env, request } = context;
    const DB = env.DB;

    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');

        const customer = await DB.prepare('SELECT id, email, name, email_verified FROM customers WHERE token = ?')
            .bind(token)
            .first();

        if (!customer) {
            return Response.json({ error: 'Invalid token' }, { status: 401 });
        }

        if (customer.email_verified === 1) {
            return Response.json({ success: true, message: 'Email already verified' });
        }

        // Generate new verification token
        const verificationToken = generateToken();

        await DB.prepare('UPDATE customers SET verification_token = ? WHERE id = ?')
            .bind(verificationToken, customer.id)
            .run();

        // Send verification email via Resend
        if (env.RESEND_API_KEY) {
            const origin = env.SITE_URL || new URL(request.url).origin;
            const verifyUrl = `${origin}/verify-email.html?token=${verificationToken}`;

            const html = customerEmail({
                origin,
                titleEn: `Hello, ${customer.name}!`,
                bodyEn: 'Please verify your email address by clicking the button below:',
                bodyAr: 'يرجى تأكيد بريدك الإلكتروني بالضغط على الزر أدناه:',
                ctaUrl: verifyUrl,
                ctaText: 'Verify Email | تأكيد البريد',
                fallbackUrl: verifyUrl,
                preheader: 'Verify your email address to complete your ORLO Store registration.',
            });

            const text = plainText({
                titleEn: `Hello, ${customer.name}!`,
                bodyTextEn: 'Please verify your email address by clicking the link below:',
                bodyTextAr: 'يرجى تأكيد بريدك الإلكتروني بالضغط على الرابط أدناه:',
                ctaUrl: verifyUrl,
                ctaText: 'Verify Email',
            });

            await sendEmail({
                apiKey: env.RESEND_API_KEY,
                to: customer.email,
                subject: 'Verify Your Email | تأكيد بريدك الإلكتروني',
                html,
                text,
            });
        }

        return Response.json({
            success: true,
            message: 'Verification email sent'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        return Response.json({ error: 'Failed to send verification email' }, { status: 500 });
    }
}
