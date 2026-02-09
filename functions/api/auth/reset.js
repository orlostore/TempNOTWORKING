// Cloudflare Pages Function - Password Reset API
// Location: /functions/api/auth/reset.js

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
        
        // In production, send email here
        // For now, we'll just log it (you can integrate with email service later)
        console.log(`Password reset requested for ${email}`);
        console.log(`Reset link: https://orlostore.com/reset-password.html?token=${resetToken}`);
        
        // TODO: Send actual email using Resend, SendGrid, or similar
        // Example with Resend:
        // await fetch('https://api.resend.com/emails', {
        //     method: 'POST',
        //     headers: {
        //         'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         from: 'ORLO <noreply@orlostore.com>',
        //         to: email,
        //         subject: 'Reset Your Password | إعادة تعيين كلمة المرور',
        //         html: `
        //             <h2>Reset Your Password</h2>
        //             <p>Hi ${customer.name},</p>
        //             <p>Click the link below to reset your password:</p>
        //             <a href="https://orlostore.com/reset-password.html?token=${resetToken}">Reset Password</a>
        //             <p>This link expires in 1 hour.</p>
        //         `
        //     })
        // });
        
        return Response.json({ 
            success: true,
            message: 'If an account exists, a reset email has been sent'
        });
        
    } catch (error) {
        console.error('Password reset error:', error);
        return Response.json({ error: 'Failed to process request' }, { status: 500 });
    }
}

// Generate random token
function generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
