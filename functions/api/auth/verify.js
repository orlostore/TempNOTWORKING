// Cloudflare Pages Function - Email Verification API
// Location: /functions/api/auth/verify.js

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
            const verifyUrl = `https://orlostore.com/verify-email.html?token=${verificationToken}`;
            
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'ORLO <noreply@orlostore.com>',
                    to: customer.email,
                    subject: 'Verify Your Email | تأكيد بريدك الإلكتروني',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <h1 style="color: #2c4a5c; margin: 0;">ORLO</h1>
                            </div>
                            <h2 style="color: #2c4a5c;">Hello, ${customer.name}!</h2>
                            <p style="color: #555; font-size: 15px; line-height: 1.6;">
                                Please verify your email address by clicking the button below:
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
                                يرجى تأكيد بريدك الإلكتروني بالضغط على الزر أعلاه
                            </p>
                        </div>
                    `
                })
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

function generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
