// Cloudflare Pages Function - Password Reset API
// Location: /functions/api/auth/reset.js

import { generateToken } from './crypto-utils.js';

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
                const resetUrl = `https://orlostore.com/reset-password.html?token=${resetToken}`;

                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'ORLO Store <noreply@orlostore.com>',
                        to: email.toLowerCase(),
                        subject: 'Reset Your Password | إعادة تعيين كلمة المرور',
                        html: `
                            <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f8f9fa; padding: 0; border-radius: 12px; overflow: hidden;">
                                <div style="background: linear-gradient(135deg, #2c4a5c 0%, #1e3545 100%); padding: 30px 20px; text-align: center;">
                                    <img src="https://orlostore.com/logo.png" alt="ORLO Store" style="width: 70px; height: 70px; margin-bottom: 8px;">
                                    <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; letter-spacing: 1px;">ORLO Store</div>
                                </div>
                                <div style="background: white; padding: 30px 25px;">
                                    <h2 style="color: #2c4a5c; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Password Reset</h2>
                                    <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 0 0 10px;">
                                        Hi ${customer.name}, we received a request to reset your password. Click the button below:
                                    </p>
                                    <p style="color: #888; font-size: 13px; line-height: 1.6; margin: 0 0 25px; font-family: 'Almarai', Arial, sans-serif; direction: rtl; text-align: right;">
                                        مرحباً ${customer.name}، تلقينا طلباً لإعادة تعيين كلمة المرور. اضغط على الزر أدناه:
                                    </p>
                                    <div style="text-align: center; margin: 25px 0;">
                                        <a href="${resetUrl}" style="background: #e07856; color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
                                            Reset Password | إعادة التعيين
                                        </a>
                                    </div>
                                    <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 20px 0 0;">
                                        This link expires in 1 hour. If you didn't request this, ignore this email.<br>
                                        <a href="${resetUrl}" style="color: #e07856; word-break: break-all;">${resetUrl}</a>
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
