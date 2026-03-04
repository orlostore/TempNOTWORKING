// Cloudflare Pages Function - Password Reset API
// Location: /functions/api/auth/reset.js

import { generateToken } from './crypto-utils.js';
import { customerEmail, plainText, sendEmail } from '../email-template.js';

export async function onRequestPost(context) {
    const { env, request } = context;
    const DB = env.DB;

    try {
        const { email } = await request.json();

        if (!email) {
            return Response.json({ error: 'Email is required' }, { status: 400 });
        }

        // Find customer
        const customer = await DB.prepare('SELECT id, name FROM customers WHERE email = ?')
            .bind(email.toLowerCase())
            .first();

        // Always return success (don't reveal if email exists)
        if (!customer) {
            return Response.json({ success: true });
        }

        // Generate reset token
        const resetToken = generateToken();
        const resetExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

        // Save reset token
        await DB.prepare(`
            UPDATE customers
            SET reset_token = ?, reset_expiry = ?
            WHERE id = ?
        `).bind(resetToken, resetExpiry, customer.id).run();

        // Send reset email via Resend
        if (env.RESEND_API_KEY) {
            try {
                const origin = new URL(request.url).origin;
                const resetUrl = `${origin}/reset-password.html?token=${resetToken}`;

                const html = customerEmail({
                    origin,
                    icon: '🔑',
                    titleEn: 'Password Reset',
                    bodyEn: `Hi ${customer.name}, we received a request to reset your password. Click the button below:`,
                    bodyAr: `مرحباً ${customer.name}، تلقينا طلباً لإعادة تعيين كلمة المرور. اضغط على الزر أدناه:`,
                    ctaUrl: resetUrl,
                    ctaText: 'Reset Password | إعادة التعيين',
                    fallbackUrl: resetUrl,
                    extraHtml: '<p style="color: #999; font-size: 12px; margin: 10px 0 0;">This link expires in 1 hour. If you didn\'t request this, ignore this email.</p>',
                    preheader: 'Reset your ORLO Store password. This link expires in 1 hour.',
                });

                const text = plainText({
                    titleEn: 'Password Reset',
                    bodyTextEn: `Hi ${customer.name}, we received a request to reset your password.`,
                    bodyTextAr: `مرحباً ${customer.name}، تلقينا طلباً لإعادة تعيين كلمة المرور.`,
                    ctaUrl: resetUrl,
                    ctaText: 'Reset Password',
                    infoTextEn: 'This link expires in 1 hour. If you didn\'t request this, ignore this email.',
                });

                await sendEmail({
                    apiKey: env.RESEND_API_KEY,
                    to: email.toLowerCase(),
                    subject: 'Reset Your Password | إعادة تعيين كلمة المرور',
                    html,
                    text,
                });
            } catch (emailError) {
                console.error('Reset email error:', emailError);
            }
        }

        return Response.json({
            success: true,
            message: 'If an account exists, a reset email has been sent'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        return Response.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
