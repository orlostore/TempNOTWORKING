// Shared Email Template System for ORLO Store
// v4 editorial register — site-matched header lockup, white card body, canonical footer.
// All function signatures stay backward-compatible with every existing caller in functions/.
// Usage: import { customerEmail, adminEmail, plainText, sendEmail } from '../email-template.js';

// ─── Design tokens (mirror styles.css site spec) ────────────────────────────
const C = {
    cream:    '#f8f6f2',
    white:    '#ffffff',
    navy:     '#1a3a52',
    coral:    '#e76f51',
    muted:    '#6b6b6b',
    soft:     '#9aa5ad',
    hairline: '#e4ddd1',
    boxBg:    '#fdfbf5',
};
const F_SERIF = `'Cormorant Garamond',Georgia,'Times New Roman',serif`;
const F_SANS  = `'DM Sans','Segoe UI',Arial,sans-serif`;
const F_AR    = `'Almarai',Tahoma,Arial,sans-serif`;
const FONTS_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400;1,500;1,600&family=DM+Sans:wght@400;500;700&family=Almarai:wght@400;700&display=swap');`;

// ─── Canonical email footer ─────────────────────────────────────────────────
// Synced from _footer-canonical-email.html via scripts/sync-email-footer.js.
// Do NOT hand-edit between the markers below.
const EMAIL_FOOTER_HTML = `<!-- ═══ ORLO EMAIL FOOTER — canonical block. Do NOT hand-edit. Synced via scripts/sync-email-footer.js. ═══ -->
<tr><td style="background:#f8f6f2;padding:28px 28px 22px;">
    <div style="font-family:'DM Sans','Segoe UI',Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#1a3a52;font-weight:500;padding-bottom:12px;border-bottom:1px solid #e4ddd1;margin-bottom:16px;">Customer Enquiries</div>
    <div style="font-family:'DM Sans','Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.7;color:#1a3a52;margin-bottom:6px;">
        <span style="color:#6b6b6b;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;font-weight:500;margin-right:8px;">Email</span>
        <a href="mailto:info@orlostore.com" style="color:#1a3a52;text-decoration:underline;">info@orlostore.com</a>
        <span style="color:#9aa5ad;margin-left:6px;font-size:12px;">Reply within 24h</span>
    </div>
    <div style="font-family:'DM Sans','Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.7;color:#1a3a52;margin-bottom:14px;">
        <span style="color:#6b6b6b;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;font-weight:500;margin-right:8px;">Online orders</span>
        <a href="https://wa.me/971555477206" style="color:#1a3a52;text-decoration:underline;">+971 55 547 7206</a>
        <span style="color:#9aa5ad;margin-left:6px;font-size:12px;">Everyday 9am – 6pm</span>
    </div>
    <table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>
        <td style="font-family:'DM Sans','Segoe UI',Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#6b6b6b;font-weight:500;padding-right:14px;vertical-align:middle;">Follow</td>
        <td style="padding-right:10px;vertical-align:middle;">
            <a href="https://instagram.com/orlostore" aria-label="Instagram" style="text-decoration:none;">
                <img src="https://orlostore.com/icons/instagram.png" alt="Instagram" width="30" height="30" style="width:30px;height:30px;border:0;display:block;">
            </a>
        </td>
        <td style="vertical-align:middle;">
            <a href="https://tiktok.com/@shoporlo" aria-label="TikTok" style="text-decoration:none;">
                <img src="https://orlostore.com/icons/tiktok.png" alt="TikTok" width="30" height="30" style="width:30px;height:30px;border:0;display:block;">
            </a>
        </td>
    </tr></table>
    <div style="margin-top:18px;padding-top:14px;border-top:1px solid #e4ddd1;font-family:'DM Sans','Segoe UI',Arial,sans-serif;font-size:10px;letter-spacing:0.04em;color:#6b6b6b;line-height:1.85;">
        <a href="https://orlostore.com/terms-and-conditions.html#terms" style="color:#6b6b6b;text-decoration:none;">Terms &amp; Conditions</a>
        <span style="color:#c0c8ce;margin:0 8px;">&middot;</span>
        <a href="https://orlostore.com/terms-and-conditions.html#privacy" style="color:#6b6b6b;text-decoration:none;">Privacy</a>
        <span style="color:#c0c8ce;margin:0 8px;">&middot;</span>
        <a href="https://orlostore.com/terms-and-conditions.html#returns" style="color:#6b6b6b;text-decoration:none;">Returns</a>
        <span style="color:#c0c8ce;margin:0 8px;">&middot;</span>
        <a href="https://orlostore.com/terms-and-conditions.html#shipping" style="color:#6b6b6b;text-decoration:none;">Shipping</a>
        <span style="color:#c0c8ce;margin:0 8px;">&middot;</span>
        <a href="https://orlostore.com/terms-and-conditions.html#exchange" style="color:#6b6b6b;text-decoration:none;">Exchange</a>
    </div>
    <div style="margin-top:10px;font-family:'DM Sans','Segoe UI',Arial,sans-serif;font-size:10px;color:#9aa5ad;letter-spacing:0.02em;">&copy; ORLO 2026 &middot; All rights reserved.</div>
</td></tr>
<!-- ═══ /ORLO EMAIL FOOTER ═══ -->`;

// ─── Site-matched header lockup (mirrors .hdr-v2 .login-lockup from styles.css) ──
function siteHeader(origin) {
    const logoUrl = `${origin}/logo.png`;
    return `<tr><td style="background:${C.white};border-bottom:1px solid ${C.hairline};padding:14px 32px;">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>
            <td style="vertical-align:middle;"><img src="${logoUrl}" alt="ORLO" height="40" width="40" style="display:block;height:40px;width:40px;border:0;"></td>
            <td style="vertical-align:middle;padding:0 14px;"><div style="width:1px;height:28px;background:rgba(26,58,82,0.25);font-size:1px;line-height:1px;">&nbsp;</div></td>
            <td style="vertical-align:middle;font-family:${F_SERIF};font-weight:400;font-size:22px;letter-spacing:0.1em;color:${C.navy};line-height:1;">ORL<span style="color:${C.coral};">O</span></td>
        </tr></table>
    </td></tr>`;
}

/**
 * Build a customer-facing email with the v4 editorial layout.
 * @param {Object} options
 * @param {string} options.origin - Site origin URL (used for logo)
 * @param {string} options.titleEn - Title (rendered in italic Cormorant)
 * @param {string} options.bodyEn - Body paragraph (italic Cormorant)
 * @param {string} [options.bodyAr] - Arabic body (soft-grey Almarai, RTL)
 * @param {string} [options.metaLabel] - Small caps label above the title (e.g. "ORDER · CONFIRMED")
 * @param {string} [options.orderRef] - Order reference rendered below the title
 * @param {string} [options.infoBoxEn] - Info box content (English)
 * @param {string} [options.infoBoxAr] - Info box content (Arabic, RTL)
 * @param {string} [options.infoBoxBorder] - Override info box left-border color (default: coral)
 * @param {string} [options.infoBoxBg] - Override info box background (default: soft cream)
 * @param {string} [options.ctaUrl] - CTA button URL
 * @param {string} [options.ctaText] - CTA button text
 * @param {string} [options.ctaColor] - CTA background color (default: navy)
 * @param {string} [options.fallbackUrl] - Show fallback link text below CTA
 * @param {string} [options.extraHtml] - Any extra HTML inserted after the CTA
 * @param {string} [options.preheader] - Hidden preheader text (inbox preview)
 * @param {string} [options.icon] - Accepted for backward-compat; ignored (v4 has no emojis)
 * @returns {string} Full HTML email
 */
export function customerEmail({
    origin,
    titleEn,
    bodyEn,
    bodyAr,
    metaLabel,
    orderRef,
    infoBoxEn,
    infoBoxAr,
    infoBoxBorder,
    infoBoxBg,
    ctaUrl,
    ctaText,
    ctaColor,
    fallbackUrl,
    extraHtml = '',
    preheader = '',
    icon,  // accepted, ignored (v4 has no emojis)
}) {
    void icon;
    const ctaBg     = ctaColor    || C.navy;
    const boxBg     = infoBoxBg   || C.boxBg;
    const boxBorder = infoBoxBorder || C.coral;

    const preheaderHtml = preheader
        ? `<div style="display:none;font-size:1px;color:${C.cream};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>`
        : '';

    const metaHtml = metaLabel
        ? `<tr><td align="center" style="padding:30px 36px 0;background:${C.white};">
            <p style="margin:0;font-family:${F_SANS};font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${C.soft};font-weight:500;">${metaLabel}</p>
        </td></tr>`
        : '';

    const orderRefHtml = orderRef
        ? `<p style="margin:14px 0 0;text-align:center;font-family:${F_SANS};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${C.soft};font-weight:500;">Order N&deg; ${orderRef}</p>`
        : '';

    const arHtml = bodyAr
        ? `<p style="margin:0 0 26px;font-family:${F_AR};font-weight:400;font-size:13px;line-height:1.65;color:${C.soft};direction:rtl;text-align:right;">${bodyAr}</p>`
        : '';

    const infoBoxHtml = infoBoxEn
        ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px;border-collapse:collapse;">
            <tr><td style="background:${boxBg};border:1px solid ${C.hairline};border-left:2px solid ${boxBorder};padding:16px 20px;">
                <p style="margin:0;font-family:${F_SANS};font-size:14px;line-height:1.6;color:${C.navy};">${infoBoxEn}</p>
                ${infoBoxAr ? `<p style="margin:8px 0 0;font-family:${F_AR};font-size:12px;line-height:1.55;color:${C.soft};direction:rtl;text-align:right;">${infoBoxAr}</p>` : ''}
            </td></tr>
        </table>`
        : '';

    const ctaHtml = ctaUrl
        ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:6px auto 16px;border-collapse:collapse;">
            <tr><td align="center" style="border-radius:999px;background:${ctaBg};">
                <a href="${ctaUrl}" style="display:inline-block;padding:14px 34px;font-family:${F_SANS};font-size:11px;font-weight:500;letter-spacing:0.24em;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:999px;">${ctaText}</a>
            </td></tr>
        </table>`
        : '';

    const fallbackHtml = fallbackUrl
        ? `<p style="color:${C.soft};font-size:11px;line-height:1.55;margin:6px 0 0;font-family:${F_SANS};text-align:center;">If the button doesn't work, copy and paste:<br><a href="${fallbackUrl}" style="color:${C.navy};word-break:break-all;text-decoration:underline;">${fallbackUrl}</a></p>`
        : '';

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${FONTS_IMPORT}body{margin:0}</style></head><body style="margin:0;padding:0;background:${C.cream};-webkit-text-size-adjust:100%;">
${preheaderHtml}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.cream};border-collapse:collapse;">
    <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:${C.white};border:1px solid ${C.hairline};border-collapse:collapse;">
            ${siteHeader(origin)}
            ${metaHtml}
            <tr><td style="padding:14px 36px 8px;background:${C.white};">
                <h1 style="margin:0;font-family:${F_SERIF};font-style:italic;font-weight:400;font-size:32px;line-height:1.1;color:${C.navy};letter-spacing:-0.005em;text-align:center;">${titleEn}</h1>
                ${orderRefHtml}
            </td></tr>
            <tr><td style="padding:22px 36px 32px;background:${C.white};">
                <p style="margin:0 0 16px;font-family:${F_SERIF};font-style:italic;font-weight:400;font-size:17px;line-height:1.6;color:${C.navy};">${bodyEn}</p>
                ${arHtml}
                ${infoBoxHtml}
                ${ctaHtml}
                ${fallbackHtml}
                ${extraHtml}
            </td></tr>
            ${EMAIL_FOOTER_HTML}
        </table>
    </td></tr>
</table>
</body></html>`;
}

/**
 * Build an admin notification email with the v4 editorial layout.
 * @param {Object} options
 * @param {string} options.titleEn - Title text
 * @param {string} options.bodyHtml - Inner body HTML content (typically structured info blocks + action button)
 * @param {string} [options.metaLabel] - Small caps label above the title
 * @param {string} [options.preheader] - Preheader text (inbox preview)
 * @param {string} [options.icon] - Accepted for backward-compat; ignored (v4 has no emojis)
 * @param {string} [options.headerBg] - Accepted for backward-compat; ignored (v4 header is white)
 * @returns {string} Full HTML email
 */
export function adminEmail({
    titleEn,
    bodyHtml,
    metaLabel,
    preheader = '',
    icon,      // accepted, ignored
    headerBg,  // accepted, ignored
}) {
    void icon; void headerBg;
    const preheaderHtml = preheader
        ? `<div style="display:none;font-size:1px;color:${C.cream};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>`
        : '';

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${FONTS_IMPORT}body{margin:0}</style></head><body style="margin:0;padding:0;background:${C.cream};-webkit-text-size-adjust:100%;">
${preheaderHtml}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.cream};border-collapse:collapse;">
    <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;width:100%;background:${C.white};border:1px solid ${C.hairline};border-collapse:collapse;">
            ${siteHeader('https://orlostore.com')}
            <tr><td style="padding:24px 32px 14px;background:${C.white};">
                <p style="margin:0 0 8px;font-family:${F_SANS};font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${C.soft};font-weight:500;">${metaLabel || 'ADMIN NOTIFICATION'}</p>
                <h1 style="margin:0;font-family:${F_SERIF};font-style:italic;font-weight:400;font-size:24px;line-height:1.2;color:${C.navy};">${titleEn}</h1>
            </td></tr>
            <tr><td style="padding:14px 32px 28px;background:${C.white};font-family:${F_SANS};font-size:14px;line-height:1.6;color:${C.navy};">${bodyHtml}</td></tr>
            ${EMAIL_FOOTER_HTML}
        </table>
    </td></tr>
</table>
</body></html>`;
}

/**
 * Generate a plain text version from the email content.
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
    text += `Customer Enquiries\n`;
    text += `Email:        info@orlostore.com   (Reply within 24h)\n`;
    text += `Online orders: +971 55 547 7206    (Everyday 9am – 6pm)\n`;
    text += `Follow:       instagram.com/orlostore  ·  tiktok.com/@shoporlo\n`;
    text += `${'─'.repeat(40)}\n`;
    text += `Terms · Privacy · Returns · Shipping · Exchange\n`;
    text += `https://orlostore.com/terms-and-conditions.html\n`;
    text += `© ORLO 2026 · All rights reserved.\n`;
    return text;
}

/**
 * Send an email via Resend API.
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
