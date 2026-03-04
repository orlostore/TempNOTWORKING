// Shared Email Template System for ORLO Store
// Provides consistent design across all transactional emails
// Usage: import { customerEmail, adminEmail, sendEmail } from '../email-template.js';

/**
 * Build a customer-facing email with full branded layout
 * @param {Object} options
 * @param {string} options.origin - Site origin URL (for logo)
 * @param {string} [options.icon] - Emoji icon (e.g. '🚚', '❌')
 * @param {string} options.titleEn - English title
 * @param {string} options.bodyEn - English body HTML
 * @param {string} [options.bodyAr] - Arabic body HTML (RTL)
 * @param {string} [options.infoBoxEn] - English info box content
 * @param {string} [options.infoBoxAr] - Arabic info box content (RTL)
 * @param {string} [options.infoBoxBorder] - Info box left border color (default: brand blue)
 * @param {string} [options.infoBoxBg] - Info box background color (default: #ececec)
 * @param {string} [options.ctaUrl] - CTA button URL
 * @param {string} [options.ctaText] - CTA button text
 * @param {string} [options.ctaColor] - CTA button color (default: brand orange)
 * @param {string} [options.fallbackUrl] - Show fallback link text below CTA
 * @param {string} [options.extraHtml] - Any extra HTML to insert before the contact line
 * @param {string} [options.preheader] - Preheader text (inbox preview)
 * @returns {string} Full HTML email
 */
export function customerEmail({
    origin,
    icon,
    titleEn,
    bodyEn,
    bodyAr,
    infoBoxEn,
    infoBoxAr,
    infoBoxBorder = '#2c4a5c',
    infoBoxBg = '#ececec',
    ctaUrl,
    ctaText,
    ctaColor = '#e07856',
    fallbackUrl,
    extraHtml = '',
    preheader = '',
}) {
    const logoUrl = `${origin}/logo.png`;

    const preheaderHtml = preheader
        ? `<div style="display:none;font-size:1px;color:#f0f2f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>`
        : '';

    const iconHtml = icon
        ? `<div style="font-size: 48px; line-height: 1; margin-bottom: 15px;">${icon}</div>`
        : '';

    const arHtml = bodyAr
        ? `<p style="color: #888; font-size: 14px; line-height: 1.6; margin: 0 0 25px; font-family: 'Almarai', Arial, sans-serif; direction: rtl; text-align: right;">${bodyAr}</p>`
        : '';

    const infoBoxHtml = infoBoxEn
        ? `<div style="background: ${infoBoxBg}; border-radius: 10px; padding: 18px 20px; margin-bottom: 25px; border-left: 3px solid ${infoBoxBorder}; text-align: left;">
            <p style="margin: 0; font-size: 14px; color: #555;">${infoBoxEn}</p>
            ${infoBoxAr ? `<p style="margin: 6px 0 0; font-size: 13px; color: #888; font-family: 'Almarai', Arial, sans-serif; direction: rtl; text-align: right;">${infoBoxAr}</p>` : ''}
        </div>`
        : '';

    const ctaHtml = ctaUrl
        ? `<div style="text-align: center; margin: 25px 0;">
            <a href="${ctaUrl}" style="background: ${ctaColor}; color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">${ctaText}</a>
        </div>`
        : '';

    const fallbackHtml = fallbackUrl
        ? `<p style="color: #999; font-size: 12px; line-height: 1.5; margin: 15px 0 0;">
            If the button doesn't work, copy and paste this link:<br>
            <a href="${fallbackUrl}" style="color: #e07856; word-break: break-all;">${fallbackUrl}</a>
        </p>`
        : '';

    return `
        ${preheaderHtml}
        <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #f0f2f5; padding: 40px 20px; -webkit-text-size-adjust: 100%;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
                <div style="background: linear-gradient(135deg, #2c4a5c 0%, #1e3545 100%); padding: 35px 30px; text-align: center;">
                    <img src="${logoUrl}" alt="ORLO Store" style="width: 65px; height: 65px; margin-bottom: 10px;">
                    <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; letter-spacing: 1.5px;">ORLO STORE</div>
                </div>
                <div style="padding: 35px 30px; text-align: center;">
                    ${iconHtml}
                    <h2 style="color: #2c4a5c; margin: 0 0 12px; font-size: 20px; font-weight: 700;">${titleEn}</h2>
                    <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 6px;">${bodyEn}</p>
                    ${arHtml}
                    ${infoBoxHtml}
                    ${ctaHtml}
                    ${fallbackHtml}
                    ${extraHtml}
                    <p style="color: #999; font-size: 12px; margin: 20px 0 0;">
                        Questions? Contact us at <a href="mailto:info@orlostore.com" style="color: #e07856;">info@orlostore.com</a>
                    </p>
                </div>
                <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
                    <p style="color: #aaa; font-size: 11px; margin: 0;">&copy; ORLO Store | info@orlostore.com</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Build an admin notification email
 * @param {Object} options
 * @param {string} options.titleEn - Title text
 * @param {string} options.bodyHtml - Inner body HTML content
 * @param {string} [options.icon] - Emoji icon
 * @param {string} [options.headerBg] - Header gradient start color (default: brand blue)
 * @param {string} [options.preheader] - Preheader text
 * @returns {string} Full HTML email
 */
export function adminEmail({
    titleEn,
    bodyHtml,
    icon = '📋',
    headerBg = '#2c4a5c',
    preheader = '',
}) {
    const preheaderHtml = preheader
        ? `<div style="display:none;font-size:1px;color:#f0f2f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>`
        : '';

    return `
        ${preheaderHtml}
        <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #f0f2f5; padding: 40px 20px; -webkit-text-size-adjust: 100%;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
                <div style="background: linear-gradient(135deg, ${headerBg} 0%, #1e3545 100%); padding: 30px 25px; text-align: center;">
                    <div style="font-size: 36px; margin-bottom: 8px;">${icon}</div>
                    <div style="color: #fff; font-size: 18px; font-weight: 700;">${titleEn}</div>
                </div>
                <div style="padding: 25px 20px;">
                    ${bodyHtml}
                </div>
                <div style="background: #f8f9fa; padding: 15px 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="color: #aaa; font-size: 11px; margin: 0;">ORLO Store &mdash; Admin Notification</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate a plain text version from the email content
 * @param {Object} options
 * @param {string} options.titleEn - Title
 * @param {string} options.bodyTextEn - Plain text body (English)
 * @param {string} [options.bodyTextAr] - Plain text body (Arabic)
 * @param {string} [options.ctaUrl] - CTA link
 * @param {string} [options.ctaText] - CTA text
 * @param {string} [options.infoTextEn] - Info box plain text
 * @param {string} [options.infoTextAr] - Info box plain text (Arabic)
 * @returns {string} Plain text email
 */
export function plainText({
    titleEn,
    bodyTextEn,
    bodyTextAr,
    ctaUrl,
    ctaText,
    infoTextEn,
    infoTextAr,
}) {
    let text = `ORLO STORE\n${'─'.repeat(40)}\n\n`;
    text += `${titleEn}\n\n`;
    text += `${bodyTextEn}\n`;
    if (bodyTextAr) text += `\n${bodyTextAr}\n`;
    if (infoTextEn) text += `\n${infoTextEn}\n`;
    if (infoTextAr) text += `${infoTextAr}\n`;
    if (ctaUrl) text += `\n${ctaText}: ${ctaUrl}\n`;
    text += `\n${'─'.repeat(40)}\n`;
    text += `Questions? Contact us at info@orlostore.com\n`;
    text += `© ORLO Store | info@orlostore.com\n`;
    return text;
}

/**
 * Send an email via Resend API
 * @param {Object} options
 * @param {string} options.apiKey - Resend API key
 * @param {string} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - Plain text content
 * @param {string} [options.from] - From address (default: ORLO Store)
 * @param {string} [options.replyTo] - Reply-to address
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function sendEmail({
    apiKey,
    to,
    subject,
    html,
    text,
    from = 'ORLO Store <noreply@orlostore.com>',
    replyTo = 'info@orlostore.com',
}) {
    try {
        const body = { from, to, subject, html, reply_to: replyTo };
        if (text) body.text = text;

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const result = await res.json();
        if (res.ok && result.id) {
            return { success: true, id: result.id };
        }
        return { success: false, error: result.message || result.error || 'Unknown Resend error' };
    } catch (err) {
        return { success: false, error: err.message };
    }
}
