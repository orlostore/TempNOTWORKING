// Cloudflare Pages Function — send a sample of any transactional email to a specified inbox.
// Lets admin verify each of the 12 templates renders correctly in real mail clients without
// having to trigger a real order / return / signup. Auth-gated. Sample data is fixed.
// Location: /functions/api/admin/test-email.js

import { getKey, getAdminUser } from './_helpers.js';
import { customerEmail, adminEmail, plainText, sendEmail } from '../email-template.js';

const SAMPLE_ORDER_REF = '7X6CQJE5';
const CUSTOMER_NAME = 'Rami (sample)';

// One factory per template — mirrors the params each real caller passes in production.
function buildCustomerSample(template, origin) {
    const samples = {
        orderConfirmed: {
            metaLabel: 'ORDER · CONFIRMED', orderRef: SAMPLE_ORDER_REF,
            titleEn: 'Order Confirmed!',
            titleStyle: 'italic',  // emotional moment — keep editorial flourish
            bodyEn: `Hi ${CUSTOMER_NAME}, thank you for your order. We've received your payment and your order is being prepared.`,
            bodyAr: `مرحباً، شكراً لطلبك. تم استلام الدفع وجارٍ تجهيز طلبك.`,
            infoBoxEn: "<strong>What's next?</strong> We'll send you another email when your order has been dispatched.",
            ctaUrl: `${origin}/account.html`, ctaText: 'View My Orders',
            preheader: 'Order confirmed! Thank you for shopping with ORLO Store.',
        },
        shipped: {
            metaLabel: 'ORDER · DISPATCHED', orderRef: SAMPLE_ORDER_REF,
            titleEn: 'Your Order Has Been Dispatched!',
            bodyEn: `Hi ${CUSTOMER_NAME}, great news. Your order has been dispatched and is heading your way.`,
            bodyAr: 'مرحباً، تم شحن طلبك وهو في الطريق إليك.',
            infoBoxEn: '<strong>Estimated Delivery:</strong> 2-5 business days across UAE',
            ctaUrl: `${origin}/track?awb=XYZ123`, ctaText: 'Track My Order',
            preheader: 'Your order is on its way.',
        },
        cancelled: {
            metaLabel: 'ORDER · CANCELLED', orderRef: SAMPLE_ORDER_REF,
            titleEn: 'Order Cancelled',
            bodyEn: `Hi ${CUSTOMER_NAME}, your order has been cancelled as requested.`,
            bodyAr: 'مرحباً، تم إلغاء طلبك بناءً على طلبك.',
            infoBoxEn: '<strong>Refund:</strong> A full refund of AED 119.00 has been initiated. It will appear on your card within 5-7 business days.',
            preheader: 'Your order has been cancelled.',
        },
        returnApproved: {
            metaLabel: 'RETURN · APPROVED', orderRef: SAMPLE_ORDER_REF,
            titleEn: 'Return Approved',
            bodyEn: `Hi ${CUSTOMER_NAME}, your return request has been approved.`,
            bodyAr: 'تمت الموافقة على طلب الإرجاع.',
            infoBoxEn: "<strong>Next steps:</strong> Please ship the item back to us. Return shipping costs are the customer's responsibility per our terms. Once we receive and inspect the item, we will process your refund.",
            preheader: 'Your return has been approved.',
        },
        returnRejected: {
            metaLabel: 'RETURN · UPDATE', orderRef: SAMPLE_ORDER_REF,
            titleEn: 'Return Request Update',
            bodyEn: `Hi ${CUSTOMER_NAME}, unfortunately we are unable to approve this return.`,
            bodyAr: 'للأسف لم نتمكن من الموافقة على هذا الإرجاع.',
            infoBoxEn: '<strong>Reason:</strong> Item shows signs of use. Returns must be unopened in original sealed packaging per our terms.',
            preheader: 'Update on your return request.',
        },
        refund: {
            metaLabel: 'RETURN · REFUNDED', orderRef: SAMPLE_ORDER_REF,
            titleEn: 'Refund Processed',
            bodyEn: `Hi ${CUSTOMER_NAME}, a full refund has been issued for your order.`,
            bodyAr: 'تم إصدار استرداد كامل لطلبك.',
            infoBoxEn: 'The refund will appear on your card within <strong>5-7 business days</strong>.',
            preheader: 'Refund processed.',
        },
        returnInitiated: {
            metaLabel: 'RETURN · INITIATED', orderRef: SAMPLE_ORDER_REF,
            titleEn: 'Return Initiated',
            bodyEn: `Hi ${CUSTOMER_NAME}, a return has been initiated for your order.`,
            bodyAr: 'تم بدء عملية إرجاع لطلبك.',
            infoBoxEn: '<strong>Reason:</strong> Wrong item received<br><br><strong>Next steps:</strong> Please ship the item back to us. Once we receive and inspect the item, we will process your refund.',
            preheader: 'Return initiated.',
        },
        verify: {
            metaLabel: 'ACCOUNT · VERIFICATION',
            titleEn: `Welcome, ${CUSTOMER_NAME}!`,
            bodyEn: 'Please verify your email address by clicking the button below.',
            bodyAr: 'يرجى تأكيد بريدك الإلكتروني بالضغط على الزر أدناه.',
            ctaUrl: `${origin}/verify?token=sample`, ctaText: 'Verify Email',
            fallbackUrl: `${origin}/verify?token=sample`,
            preheader: 'Verify your email to complete your registration.',
        },
        reset: {
            metaLabel: 'ACCOUNT · PASSWORD',
            titleEn: 'Password Reset',
            bodyEn: `Hi ${CUSTOMER_NAME}, we received a request to reset your password. Click the button below.`,
            bodyAr: 'مرحباً، تلقينا طلباً لإعادة تعيين كلمة المرور. اضغط على الزر أدناه.',
            ctaUrl: `${origin}/reset?token=sample`, ctaText: 'Reset Password',
            fallbackUrl: `${origin}/reset?token=sample`,
            preheader: 'Reset your password. This link expires in 1 hour.',
        },
        guestToAccount: {
            metaLabel: 'ACCOUNT · WELCOME',
            titleEn: `Welcome, ${CUSTOMER_NAME}!`,
            titleStyle: 'italic',  // welcoming moment — keep editorial flourish
            bodyEn: 'Your account has been created. Here are your login details.',
            bodyAr: 'تم إنشاء حسابك. يرجى تغيير كلمة المرور بعد أول تسجيل دخول.',
            ctaUrl: `${origin}/verify?token=sample`, ctaText: 'Verify Email',
            preheader: 'Your ORLO Store account is ready.',
        },
    };
    const params = samples[template];
    if (!params) return null;
    return customerEmail({ origin, ...params });
}

function buildAdminSample(template) {
    const samples = {
        newOrder: {
            metaLabel: 'ADMIN · NEW ORDER',
            titleEn: 'New Order — AED 119.00 from Rami Habash (sample)',
            bodyHtml: `<div style="margin:0 0 14px;padding:14px 16px;background:#f8f6f2;border-left:2px solid #e76f51;"><div style="font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#9aa5ad;font-weight:500;margin-bottom:8px;">Customer</div><div style="font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#1a3a52;font-weight:500;">Rami Habash (sample)</div></div><div style="margin:0 0 14px;padding:14px 16px;background:#f8f6f2;border-left:2px solid #e76f51;"><div style="font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#9aa5ad;font-weight:500;margin-bottom:8px;">Total</div><div style="font-family:'DM Sans',Arial,sans-serif;font-weight:600;font-size:20px;color:#1a3a52;line-height:1.2;letter-spacing:0.02em;">AED 119.00</div></div>`,
            preheader: 'Sample admin email — new order',
        },
        returnRequest: {
            metaLabel: 'ADMIN · NEW RETURN REQUEST',
            titleEn: `Return Request — Order #${SAMPLE_ORDER_REF} (sample)`,
            bodyHtml: `<div style="margin:0 0 14px;padding:14px 16px;background:#f8f6f2;border-left:2px solid #e76f51;"><div style="font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#9aa5ad;font-weight:500;margin-bottom:8px;">Reason</div><div style="font-family:'DM Sans',Arial,sans-serif;font-weight:400;font-size:14px;color:#1a3a52;line-height:1.6;">Item arrived with a small chip on the rear bumper.</div></div>`,
            preheader: 'Sample admin email — return request',
        },
    };
    const params = samples[template];
    if (!params) return null;
    return adminEmail(params);
}

const CUSTOMER_TEMPLATES = [
    'orderConfirmed', 'shipped', 'cancelled',
    'returnApproved', 'returnRejected', 'refund', 'returnInitiated',
    'verify', 'reset', 'guestToAccount',
];
const ADMIN_TEMPLATES = ['newOrder', 'returnRequest'];

export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const key = getKey(request);
        const user = await getAdminUser(env, key);
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { template, to } = await request.json();
        if (!template || !to) return Response.json({ error: 'Missing template or to' }, { status: 400 });
        if (!env.RESEND_API_KEY) return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });

        const origin = new URL(request.url).origin;
        let html;
        if (CUSTOMER_TEMPLATES.includes(template))      html = buildCustomerSample(template, origin);
        else if (ADMIN_TEMPLATES.includes(template))     html = buildAdminSample(template);
        else return Response.json({ error: `Unknown template "${template}". Allowed: ${[...CUSTOMER_TEMPLATES, ...ADMIN_TEMPLATES].join(', ')}` }, { status: 400 });

        const result = await sendEmail({
            apiKey: env.RESEND_API_KEY,
            to,
            subject: `[TEST] ${template} — sample email from admin panel`,
            html,
            text: plainText({
                titleEn: `[TEST] ${template}`,
                bodyTextEn: 'This is a sample email triggered from the admin panel. Sample data only — no real action taken.',
            }),
        });

        if (result.success) return Response.json({ ok: true, id: result.id, template, to });
        return Response.json({ error: result.error || 'Unknown send error' }, { status: 500 });

    } catch (err) {
        return Response.json({ error: err.message || String(err) }, { status: 500 });
    }
}

export async function onRequestGet() {
    // List available templates for the admin UI dropdown.
    return Response.json({
        customer: CUSTOMER_TEMPLATES,
        admin: ADMIN_TEMPLATES,
    });
}
