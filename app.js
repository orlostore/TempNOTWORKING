const WHATSAPP_NUMBER = "971555477206";

// Lock/unlock body scroll — bulletproof for iOS Safari
const lockScroll = () => {
    window._savedScroll = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${window._savedScroll}px`;
    document.body.style.width = '100%';
};
const unlockScroll = () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, window._savedScroll || 0);
};

// HTML entity escaping to prevent XSS when inserting DB-sourced data via innerHTML
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ============================================
// ORLO TOAST + MODAL SYSTEM
// Replaces native alert(), confirm(), prompt()
// ============================================

// Auto-inject toast container + modal overlay into DOM
(function() {
    if (!document.getElementById('orloToastContainer')) {
        const tc = document.createElement('div');
        tc.className = 'orlo-toast-container';
        tc.id = 'orloToastContainer';
        document.body.appendChild(tc);
    }
    if (!document.getElementById('orloModalOverlay')) {
        const mo = document.createElement('div');
        mo.className = 'orlo-modal-overlay';
        mo.id = 'orloModalOverlay';
        document.body.appendChild(mo);
        mo.addEventListener('click', function(e) {
            if (e.target === mo && mo._onCancel) mo._onCancel();
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mo.classList.contains('active') && mo._onCancel) mo._onCancel();
        });
    }
})();

/**
 * Show a toast notification.
 * @param {'success'|'error'|'warning'} type
 * @param {string} title
 * @param {string} msg
 * @param {number} [duration=4000]
 */
function orloToast(type, title, msg, duration) {
    duration = duration || 4000;
    const container = document.getElementById('orloToastContainer');
    if (!container) return;
    const icons = { success: '\u2713', error: '\u2717', warning: '!' };
    const toast = document.createElement('div');
    toast.className = 'orlo-toast';
    toast.innerHTML =
        '<div class="orlo-toast-icon ' + type + '">' + (icons[type] || '') + '</div>' +
        '<div class="orlo-toast-body">' +
            '<div class="orlo-toast-title">' + escapeHTML(title) + '</div>' +
            '<div class="orlo-toast-msg">' + escapeHTML(msg).replace(/\n/g, '<br>') + '</div>' +
        '</div>' +
        '<button class="orlo-toast-close" aria-label="Close">\u00d7</button>' +
        '<div class="orlo-toast-progress ' + type + '" style="animation-duration:' + duration + 'ms"></div>';
    toast.querySelector('.orlo-toast-close').onclick = function() { removeOrloToast(toast); };
    container.appendChild(toast);
    var timer = setTimeout(function() { removeOrloToast(toast); }, duration);
    toast._timer = timer;
}

function removeOrloToast(toast) {
    if (!toast || !toast.parentElement) return;
    clearTimeout(toast._timer);
    toast.classList.add('toast-out');
    setTimeout(function() { if (toast.parentElement) toast.remove(); }, 300);
}

/**
 * Show a confirm modal. Returns a Promise<boolean>.
 * @param {object} opts - { title, msg, confirmText, cancelText, type }
 */
function orloConfirm(opts) {
    return new Promise(function(resolve) {
        var overlay = document.getElementById('orloModalOverlay');
        var iconMap = { warn: '\u26a0\ufe0f', danger: '\u26a0\ufe0f', info: '\ud83d\udc4b' };
        var iconClass = opts.type || 'warn';
        var btnClass = (iconClass === 'danger') ? 'btn-danger' : 'btn-primary';

        overlay.innerHTML =
            '<div class="orlo-modal" onclick="event.stopPropagation()">' +
                '<div class="orlo-modal-icon ' + iconClass + '">' + (iconMap[iconClass] || '\u26a0\ufe0f') + '</div>' +
                '<h3>' + escapeHTML(opts.title || 'Confirm') + '</h3>' +
                '<p>' + escapeHTML(opts.msg || '').replace(/\n/g, '<br>') + '</p>' +
                '<div class="orlo-modal-actions">' +
                    '<button class="btn-cancel" id="orloModalCancel">' + escapeHTML(opts.cancelText || 'Cancel') + '</button>' +
                    '<button class="' + btnClass + '" id="orloModalConfirm">' + escapeHTML(opts.confirmText || 'Confirm') + '</button>' +
                '</div>' +
            '</div>';

        overlay.classList.add('active');

        function cleanup(result) {
            overlay.classList.remove('active');
            overlay._onCancel = null;
            resolve(result);
        }

        overlay._onCancel = function() { cleanup(false); };
        document.getElementById('orloModalCancel').onclick = function() { cleanup(false); };
        document.getElementById('orloModalConfirm').onclick = function() { cleanup(true); };
    });
}

/**
 * Show a prompt modal with text input. Returns a Promise<string|null>.
 * @param {object} opts - { title, msg, placeholder, matchValue, confirmText, cancelText }
 */
function orloPrompt(opts) {
    return new Promise(function(resolve) {
        var overlay = document.getElementById('orloModalOverlay');
        var needsMatch = opts.matchValue ? true : false;

        overlay.innerHTML =
            '<div class="orlo-modal" onclick="event.stopPropagation()">' +
                '<div class="orlo-modal-icon danger">\u26a0\ufe0f</div>' +
                '<h3>' + escapeHTML(opts.title || 'Confirm') + '</h3>' +
                '<p>' + escapeHTML(opts.msg || '').replace(/\n/g, '<br>') + '</p>' +
                (needsMatch ? '<div class="delete-hint">Type <strong style="color:#c62828">' + escapeHTML(opts.matchValue) + '</strong> to confirm</div>' : '') +
                '<input type="text" class="delete-input" id="orloPromptInput" placeholder="' + escapeHTML(opts.placeholder || '') + '">' +
                '<div class="orlo-modal-actions">' +
                    '<button class="btn-cancel" id="orloModalCancel">' + escapeHTML(opts.cancelText || 'Cancel') + '</button>' +
                    '<button class="btn-danger" id="orloModalConfirm" ' + (needsMatch ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') + '>' + escapeHTML(opts.confirmText || 'Confirm') + '</button>' +
                '</div>' +
            '</div>';

        overlay.classList.add('active');

        var input = document.getElementById('orloPromptInput');
        var confirmBtn = document.getElementById('orloModalConfirm');

        if (needsMatch) {
            input.addEventListener('input', function() {
                if (input.value === opts.matchValue) {
                    confirmBtn.disabled = false;
                    confirmBtn.style.opacity = '1';
                    confirmBtn.style.cursor = 'pointer';
                } else {
                    confirmBtn.disabled = true;
                    confirmBtn.style.opacity = '0.4';
                    confirmBtn.style.cursor = 'not-allowed';
                }
            });
        }

        input.focus();

        function cleanup(val) {
            overlay.classList.remove('active');
            overlay._onCancel = null;
            resolve(val);
        }

        overlay._onCancel = function() { cleanup(null); };
        document.getElementById('orloModalCancel').onclick = function() { cleanup(null); };
        confirmBtn.onclick = function() { if (!confirmBtn.disabled) cleanup(input.value); };
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !confirmBtn.disabled) cleanup(input.value);
        });
    });
}

// Helper: safely quote an ID for use in inline onclick attributes
function qId(id) { return typeof id === 'string' ? `'${id}'` : id; }

// SVG icon constants for JS-generated HTML
const SVG_TRUCK_INLINE = '<svg style="width:1em;height:1em;vertical-align:-0.15em;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;display:inline-block;" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>';
const SVG_CLOSE_SM = '<svg style="width:0.7em;height:0.7em;vertical-align:-0.1em;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;display:inline-block;" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
const SVG_CLOSE_CART = '<svg style="width:0.85em;height:0.85em;vertical-align:-0.1em;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;display:inline-block;" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
const SVG_CARD = '<svg style="width:1em;height:1em;vertical-align:-0.15em;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;display:inline-block;" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>';
const SVG_LOCK_SM = '<svg style="width:1em;height:1em;vertical-align:-0.15em;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;display:inline-block;" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>';
const SVG_PERSON = '<svg style="width:1em;height:1em;vertical-align:-0.15em;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;display:inline-block;" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></svg>';
const SVG_WARNING = '<svg style="width:1em;height:1em;vertical-align:-0.15em;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;display:inline-block;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
const SVG_SHOP_BAG = '<svg style="width:1.3em;height:1.3em;vertical-align:-0.2em;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;display:inline-block;" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></svg>';
const SVG_INFO = '<svg style="width:1.3em;height:1.3em;vertical-align:-0.2em;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;display:inline-block;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
const SVG_MAIL_SM = '<svg style="width:1.3em;height:1.3em;vertical-align:-0.2em;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;display:inline-block;" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';
const SVG_CLIPBOARD_SM = '<svg style="width:1.3em;height:1.3em;vertical-align:-0.2em;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;display:inline-block;" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>';

// Hide page when navigating away to Stripe so bfcache snapshot is already invisible
window.addEventListener('pagehide', function() {
    if (sessionStorage.getItem('orlo_checkout_pending')) {
        document.documentElement.style.visibility = 'hidden';
    }
});

// Redirect to cancel page if user presses back from Stripe payment (bfcache + fresh load)
window.addEventListener('pageshow', function(event) {
    if (sessionStorage.getItem('orlo_checkout_pending')) {
        document.documentElement.style.visibility = 'hidden';
        sessionStorage.removeItem('orlo_checkout_pending');
        window.location.replace('cancel.html');
    }
});

// Inject cart shake animation
if (!document.getElementById('cartLimitStyles')) {
    const style = document.createElement('style');
    style.id = 'cartLimitStyles';
    style.textContent = `
        @keyframes cartQtyShake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-3px); }
            40% { transform: translateX(3px); }
            60% { transform: translateX(-2px); }
            80% { transform: translateX(2px); }
        }
    `;
    document.head.appendChild(style);
}

// === FREE DELIVERY THRESHOLD - Change this value to adjust ===
const FREE_DELIVERY_THRESHOLD = 75;

// === MAX QUANTITY PER PRODUCT ===
var MAX_QTY_PER_PRODUCT = MAX_QTY_PER_PRODUCT || 10;

// Convert number to Arabic numerals
function toArabicNumerals(num) {
  const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).split('').map(d => arabicNums[parseInt(d)] || d).join('');
}

// Show limit tooltip on index page grid cards
function showGridMaxLimitMessage(productId, maxAllowed) {
    const existing = document.getElementById('gridLimitTooltip');
    if (existing) existing.remove();
    
    if (window.gridLimitTooltipTimer) {
      clearTimeout(window.gridLimitTooltipTimer);
    }
    
    const isStockLimit = maxAllowed < MAX_QTY_PER_PRODUCT;
    
    let messageEn, messageAr;
    if (isStockLimit) {
      messageEn = `Only <span class="highlight">${maxAllowed}</span> left in stock`;
      messageAr = `متبقي <span class="highlight">${toArabicNumerals(maxAllowed)}</span> فقط في المخزون`;
    } else {
      messageEn = `Limit of <span class="highlight">${MAX_QTY_PER_PRODUCT}</span> per order`;
      messageAr = `الحد الأقصى <span class="highlight">${toArabicNumerals(MAX_QTY_PER_PRODUCT)}</span> لكل طلب`;
    }
    
    const tooltip = document.createElement('div');
    tooltip.id = 'gridLimitTooltip';
    tooltip.className = 'grid-limit-tooltip';
    tooltip.innerHTML = `
      <button class="close-btn" onclick="closeGridLimitTooltip()">${SVG_CLOSE_SM}</button>
      ${messageEn}
      <span class="tooltip-text-ar">${messageAr}</span>
    `;
    
    const gridQty = document.getElementById(`gridQty-${productId}`);
    const card = gridQty ? gridQty.closest('.product-card') : null;
    
    if (card) {
      card.style.overflow = 'visible';
      card.appendChild(tooltip);
    }
    
    window.gridLimitTooltipTimer = setTimeout(() => {
      const tip = document.getElementById('gridLimitTooltip');
      if (tip) {
        tip.classList.add('fade-out');
        setTimeout(() => {
          if (tip.parentNode) {
            tip.parentNode.style.overflow = '';
            tip.remove();
          }
        }, 300);
      }
    }, 3000);
}

function closeGridLimitTooltip() {
  const tooltip = document.getElementById('gridLimitTooltip');
  if (tooltip) {
    if (window.gridLimitTooltipTimer) {
      clearTimeout(window.gridLimitTooltipTimer);
    }
    tooltip.classList.add('fade-out');
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.style.overflow = '';
        tooltip.remove();
      }
    }, 300);
  }
}

const deliveryZones = {
    dubai: {
        name: "Dubai",
        nameAr: "دبي",
        fee: 18,
        freeThreshold: FREE_DELIVERY_THRESHOLD
    },
    sharjah_ajman: {
        name: "Sharjah / Ajman",
        nameAr: "الشارقة / عجمان",
        fee: 18,
        freeThreshold: FREE_DELIVERY_THRESHOLD
    },
    abu_dhabi: {
        name: "Abu Dhabi",
        nameAr: "أبو ظبي",
        fee: 18,
        freeThreshold: FREE_DELIVERY_THRESHOLD
    },
    other: {
        name: "Other Emirates",
        nameAr: "إمارات أخرى",
        fee: 18,
        freeThreshold: FREE_DELIVERY_THRESHOLD
    }
};

const DELIVERY_TIME = "2-5 business days";
const DELIVERY_TIME_AR = "٢-٥ أيام عمل";

const policies = {
    shipping: `<div class="policy-row policy-header-row"><h2>Shipping & Delivery</h2><h2 class="arabic-heading">الشحن والتوصيل</h2></div><div class="policy-row"><p><strong>Coverage:</strong> We currently deliver within the UAE only.</p><p class="arabic-text"><strong>التغطية:</strong> نقوم حالياً بالتوصيل داخل الإمارات العربية المتحدة فقط.</p></div><div class="policy-row"><p><strong>Processing Time:</strong> Orders are processed within 24–48 hours of payment confirmation.</p><p class="arabic-text"><strong>وقت المعالجة:</strong> يتم معالجة الطلبات خلال ٢٤-٤٨ ساعة من تأكيد الدفع.</p></div><div class="policy-row"><p><strong>Delivery Timeline:</strong> 2-5 business days for all locations.</p><p class="arabic-text"><strong>مدة التوصيل:</strong> ٢-٥ أيام عمل لجميع المواقع.</p></div><div class="policy-row"><p><strong>Delivery Fees:</strong></p><p class="arabic-text"><strong>رسوم التوصيل:</strong></p></div><div class="policy-row"><ul><li><strong>All UAE:</strong> 18 AED (FREE on orders over ${FREE_DELIVERY_THRESHOLD} AED)</li></ul><ul class="arabic-list"><li class="arabic-text"><strong>جميع أنحاء الإمارات:</strong> ١٨ درهم (مجاناً للطلبات فوق ${FREE_DELIVERY_THRESHOLD} درهم)</li></ul></div><div class="policy-row"><p><strong>Tracking:</strong> You will receive tracking information via WhatsApp once your order ships.</p><p class="arabic-text"><strong>التتبع:</strong> ستتلقى معلومات التتبع عبر واتساب بمجرد شحن طلبك.</p></div>`,
    returns: `<div class="policy-row policy-header-row"><h2>Returns & Refunds</h2><h2 class="arabic-heading">الإرجاع والاسترداد</h2></div><div class="policy-row"><p><strong>5-Day Return Window:</strong> Returns are accepted within 5 days of the shipping date only. No exceptions.</p><p class="arabic-text"><strong>فترة الإرجاع ٥ أيام:</strong> يتم قبول المرتجعات خلال ٥ أيام من تاريخ الشحن فقط. بدون استثناءات.</p></div><div class="policy-row"><p><strong>Unopened Items Only:</strong> Items must be completely unused, unopened, and in original sealed packaging with all tags and seals intact.</p><p class="arabic-text"><strong>المنتجات غير المفتوحة فقط:</strong> يجب أن تكون المنتجات غير مستخدمة تماماً، غير مفتوحة، وفي العبوة الأصلية المغلقة مع جميع الملصقات والأختام سليمة.</p></div><div class="policy-row"><p><strong>No Returns on Opened Items:</strong> Once opened, used, or packaging is damaged, items cannot be returned for any reason.</p><p class="arabic-text"><strong>لا إرجاع للمنتجات المفتوحة:</strong> بمجرد الفتح أو الاستخدام أو تلف العبوة، لا يمكن إرجاع المنتجات لأي سبب.</p></div><div class="policy-row"><p><strong>Return Shipping Costs:</strong> All return shipping costs are the buyer's responsibility. We do not provide prepaid return labels.</p><p class="arabic-text"><strong>تكاليف شحن الإرجاع:</strong> جميع تكاليف شحن الإرجاع على عاتق المشتري. لا نوفر ملصقات إرجاع مدفوعة مسبقاً.</p></div><div class="policy-row"><p><strong>Return Shipping:</strong> Once your return request is approved, you are responsible for arranging and paying for return shipping yourself. The return process will only proceed once we receive the item.</p><p class="arabic-text"><strong>شحن الإرجاع:</strong> بمجرد الموافقة على طلب الإرجاع، يتحمل العميل مسؤولية ترتيب ودفع تكاليف شحن الإرجاع بنفسه. لن تتم عملية الإرجاع إلا بعد استلامنا للمنتج.</p></div><div class="policy-row"><p><strong>Inspection Required:</strong> All returns are inspected upon receipt. Items showing any signs of use, missing components, or damaged packaging will be rejected.</p><p class="arabic-text"><strong>الفحص مطلوب:</strong> يتم فحص جميع المرتجعات عند الاستلام. سيتم رفض المنتجات التي تظهر أي علامات استخدام أو مكونات مفقودة أو عبوة تالفة.</p></div><div class="policy-row"><p><strong>Refund Process:</strong> Refunds for change-of-mind returns cover the product price only. Original delivery fees are non-refundable. Processing takes 5-7 business days after we receive and inspect the return.</p><p class="arabic-text"><strong>عملية الاسترداد:</strong> تغطي المبالغ المستردة لمرتجعات تغيير الرأي سعر المنتج فقط. رسوم التوصيل الأصلية غير قابلة للاسترداد. تستغرق المعالجة ٥-٧ أيام عمل بعد استلام وفحص الإرجاع.</p></div><div class="policy-row"><p><strong>Wrong or Defective Items:</strong> If you received a wrong or defective item, contact us via WhatsApp or email within 24 hours of delivery with photos. We will arrange return shipping at our expense and issue a full refund including delivery fees. Claims made after 24 hours of delivery will be treated as change-of-mind returns.</p><p class="arabic-text"><strong>المنتجات الخاطئة أو المعيبة:</strong> إذا استلمت منتجاً خاطئاً أو معيباً، اتصل بنا عبر واتساب أو البريد الإلكتروني خلال ٢٤ ساعة من التسليم مع صور. سنرتب شحن الإرجاع على نفقتنا ونصدر استرداداً كاملاً شاملاً رسوم التوصيل. المطالبات بعد ٢٤ ساعة من التسليم تُعامل كمرتجعات تغيير رأي.</p></div><div class="policy-row"><p><strong>Non-Returnable Items:</strong> Sale items, clearance items, items with damaged packaging, or items showing any signs of use are not eligible for return.</p><p class="arabic-text"><strong>المنتجات غير القابلة للإرجاع:</strong> منتجات التخفيض، منتجات التصفية، المنتجات ذات العبوة التالفة، أو المنتجات التي تظهر أي علامات استخدام غير مؤهلة للإرجاع.</p></div><div class="policy-row"><p><strong>How to Initiate a Return:</strong> Contact us via WhatsApp or email within 5 days of the shipping date with your order number and reason for return.</p><p class="arabic-text"><strong>كيفية بدء الإرجاع:</strong> اتصل بنا عبر واتساب أو البريد الإلكتروني خلال ٥ أيام من تاريخ الشحن مع رقم طلبك وسبب الإرجاع.</p></div>`,
    privacy: `<div class="policy-row policy-header-row"><h2>Privacy Policy</h2><h2 class="arabic-heading">سياسة الخصوصية</h2></div><div class="policy-row"><p><strong>Information Collection:</strong> We collect only the information necessary to process and fulfill your order (name, phone number, delivery address, email).</p><p class="arabic-text"><strong>جمع المعلومات:</strong> نجمع فقط المعلومات الضرورية لمعالجة وتنفيذ طلبك (الاسم، رقم الهاتف، عنوان التوصيل، البريد الإلكتروني).</p></div><div class="policy-row"><p><strong>Data Usage:</strong> Your information is used solely for order processing, delivery coordination, and customer support.</p><p class="arabic-text"><strong>استخدام البيانات:</strong> تُستخدم معلوماتك فقط لمعالجة الطلبات، وتنسيق التوصيل، ودعم العملاء.</p></div><div class="policy-row"><p><strong>Third-Party Sharing:</strong> Your data is never sold or shared with third parties except for delivery partners who need your address to complete delivery.</p><p class="arabic-text"><strong>المشاركة مع أطراف ثالثة:</strong> لا يتم بيع بياناتك أو مشاركتها مع أطراف ثالثة أبداً باستثناء شركاء التوصيل الذين يحتاجون إلى عنوانك لإتمام التوصيل.</p></div><div class="policy-row"><p><strong>Data Security:</strong> We use secure communication channels (WhatsApp, encrypted email) to protect your information.</p><p class="arabic-text"><strong>أمن البيانات:</strong> نستخدم قنوات اتصال آمنة (واتساب، بريد إلكتروني مشفر) لحماية معلوماتك.</p></div><div class="policy-row"><p><strong>Your Rights:</strong> You may request deletion of your data at any time by contacting us.</p><p class="arabic-text"><strong>حقوقك:</strong> يمكنك طلب حذف بياناتك في أي وقت عن طريق الاتصال بنا.</p></div>`,
    exchange: `<div class="policy-row policy-header-row"><h2>Exchange Policy</h2><h2 class="arabic-heading">سياسة الاستبدال</h2></div><div class="policy-row"><p><strong>No Direct Exchanges:</strong> ORLO Store does not offer direct product exchanges. If you wish to receive a different item, you must return the original item and place a new order separately.</p><p class="arabic-text"><strong>لا يوجد استبدال مباشر:</strong> لا يقدم متجر أورلو استبدالاً مباشراً للمنتجات. إذا كنت ترغب في الحصول على منتج مختلف، يجب عليك إرجاع المنتج الأصلي وتقديم طلب جديد بشكل منفصل.</p></div><div class="policy-row"><p><strong>How It Works:</strong> To get a different product, initiate a return within 5 days of the shipping date. Once your return is approved and refund processed, place a new order for the item you want.</p><p class="arabic-text"><strong>كيف يعمل ذلك:</strong> للحصول على منتج مختلف، قم ببدء عملية إرجاع خلال ٥ أيام من تاريخ الشحن. بمجرد الموافقة على الإرجاع ومعالجة الاسترداد، قم بتقديم طلب جديد للمنتج الذي تريده.</p></div><div class="policy-row"><p><strong>Return Conditions Apply:</strong> The original item must be completely unused, unopened, and in its original sealed packaging with all tags and seals intact. Opened or used items are not eligible for return.</p><p class="arabic-text"><strong>تطبق شروط الإرجاع:</strong> يجب أن يكون المنتج الأصلي غير مستخدم تماماً، غير مفتوح، وفي عبوته الأصلية المغلقة مع جميع الملصقات والأختام سليمة. المنتجات المفتوحة أو المستخدمة غير مؤهلة للإرجاع.</p></div><div class="policy-row"><p><strong>Return Shipping:</strong> All return shipping costs are the buyer's responsibility. We do not provide prepaid return labels.</p><p class="arabic-text"><strong>شحن الإرجاع:</strong> جميع تكاليف شحن الإرجاع على عاتق المشتري. لا نوفر ملصقات إرجاع مدفوعة مسبقاً.</p></div><div class="policy-row"><p><strong>Wrong or Defective Items:</strong> If you received a wrong or defective item, contact us via WhatsApp or email within 24 hours of delivery with photos. We will arrange return shipping at our expense and issue a full refund including delivery fees.</p><p class="arabic-text"><strong>المنتجات الخاطئة أو المعيبة:</strong> إذا استلمت منتجاً خاطئاً أو معيباً، اتصل بنا عبر واتساب أو البريد الإلكتروني خلال ٢٤ ساعة من التسليم مع صور. سنرتب شحن الإرجاع على نفقتنا ونصدر استرداداً كاملاً شاملاً رسوم التوصيل.</p></div><div class="policy-row"><p><strong>Contact Us:</strong> To initiate a return, contact us via WhatsApp at +971 55 547 7206 or email info@orlostore.com with your order number and reason.</p><p class="arabic-text"><strong>اتصل بنا:</strong> لبدء عملية إرجاع، اتصل بنا عبر واتساب على 7206 547 55 971+ أو البريد الإلكتروني info@orlostore.com مع رقم طلبك والسبب.</p></div>`,
    terms: `<div class="policy-row policy-header-row"><h2>Terms of Service</h2><h2 class="arabic-heading">شروط الخدمة</h2></div><div class="policy-row"><p><strong>Order Agreement:</strong> By placing an order, you agree to provide accurate information and accept these terms.</p><p class="arabic-text"><strong>اتفاقية الطلب:</strong> بتقديم طلب، فإنك توافق على تقديم معلومات دقيقة وقبول هذه الشروط.</p></div><div class="policy-row"><p><strong>Payment:</strong> Full payment is required before order processing begins. We accept credit/debit card payments only.</p><p class="arabic-text"><strong>الدفع:</strong> يلزم الدفع الكامل قبل بدء معالجة الطلب. نقبل الدفع بالبطاقات الائتمانية وبطاقات الخصم فقط.</p></div><div class="policy-row"><p><strong>Order Cancellation:</strong> Orders may be cancelled within <strong>30 minutes</strong> of placement, provided the order has not yet been dispatched. Once the order is picked up by our delivery partner, cancellations are not accepted.</p><p class="arabic-text"><strong>إلغاء الطلب:</strong> يمكن إلغاء الطلبات خلال <strong>٣٠ دقيقة</strong> من تقديمها، بشرط عدم شحن الطلب بعد. بمجرد استلام شريك التوصيل للطلب، لا يُقبل الإلغاء.</p></div><div class="policy-row"><p><strong>After Dispatch:</strong> Once the order has been dispatched, cancellation is not possible. You may submit a return request after receiving your order.</p><p class="arabic-text"><strong>بعد الشحن:</strong> بمجرد شحن الطلب، لا يمكن إلغاؤه. يمكنك تقديم طلب إرجاع بعد استلام طلبك.</p></div><div class="policy-row"><p><strong>Refund Timeline:</strong> Approved refunds are processed to the original payment method within <strong>5-7 business days</strong>.</p><p class="arabic-text"><strong>مدة الاسترداد:</strong> تتم معالجة المبالغ المستردة المعتمدة إلى وسيلة الدفع الأصلية خلال <strong>٥-٧ أيام عمل</strong>.</p></div><div class="policy-row"><p><strong>Product Accuracy:</strong> We strive to display accurate product information and images. Actual products may vary slightly from images shown.</p><p class="arabic-text"><strong>دقة المنتج:</strong> نسعى لعرض معلومات وصور المنتج بدقة. قد تختلف المنتجات الفعلية قليلاً عن الصور المعروضة.</p></div><div class="policy-row"><p><strong>Right to Refuse Service:</strong> ORLO reserves the right to refuse or cancel any order if fraud, misuse, or policy violations are detected.</p><p class="arabic-text"><strong>الحق في رفض الخدمة:</strong> تحتفظ أورلو بالحق في رفض أو إلغاء أي طلب في حالة اكتشاف احتيال أو إساءة استخدام أو انتهاكات للسياسة.</p></div><div class="policy-row"><p><strong>Liability:</strong> ORLO is not responsible for delivery delays caused by courier services, incorrect addresses provided by customers, or force majeure events.</p><p class="arabic-text"><strong>المسؤولية:</strong> أورلو غير مسؤولة عن تأخيرات التوصيل الناتجة عن خدمات التوصيل، أو العناوين غير الصحيحة المقدمة من العملاء، أو أحداث القوة القاهرة.</p></div><div class="policy-row"><p><strong>Changes to Terms:</strong> We reserve the right to update these terms at any time. Continued use of our service constitutes acceptance of updated terms.</p><p class="arabic-text"><strong>التغييرات على الشروط:</strong> نحتفظ بالحق في تحديث هذه الشروط في أي وقت. الاستخدام المستمر لخدمتنا يشكل قبولاً للشروط المحدثة.</p></div><div class="policy-row"><p><strong>Contact:</strong> For questions about these terms, contact us at info@orlostore.com</p><p class="arabic-text"><strong>الاتصال:</strong> للاستفسارات حول هذه الشروط، اتصل بنا على info@orlostore.com</p></div>`
};

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let upsellUsed = false;
let savedUpsellProducts = null;
let selectedCategory = "All Products";
let selectedDeliveryZone = localStorage.getItem("deliveryZone") || "dubai";

//PRESS BACK DURING CHECKOUT
window.addEventListener('pageshow', function(event) {
    const btn = document.getElementById("stripeBtnGuest") || document.getElementById("stripeBtn");
    if (btn) {
        btn.disabled = false;
        if (btn.id === 'stripeBtn') {
            btn.innerHTML = `${SVG_CARD} Pay by Card | <span class="arabic-text">الدفع بالبطاقة</span>`;
        }
    }
});

// Calculate tier pricing for cart items
// Groups items by product ID, sums quantities across variants, finds applicable tier
// Uses discount_percent model: final price = basePrice * (1 - discountPercent/100)
// basePrice = variant price (if variant with price > 0) or product.price
function calculateTierPricing(cartItems) {
    // Group quantities by product id
    const qtyByProduct = {};
    cartItems.forEach(i => {
        qtyByProduct[i.id] = (qtyByProduct[i.id] || 0) + i.quantity;
    });

    return cartItems.map(i => {
        const copy = { ...i };
        if (i.pricingTiers && i.pricingTiers.length > 0) {
            const totalQty = qtyByProduct[i.id] || i.quantity;
            // Find the best matching tier (highest minQty that is <= totalQty)
            let bestTier = null;
            for (const tier of i.pricingTiers) {
                if (totalQty >= tier.minQty) {
                    if (!bestTier || tier.minQty > bestTier.minQty) {
                        bestTier = tier;
                    }
                }
            }
            if (bestTier && bestTier.discountPercent > 0) {
                // Use variant price if available, otherwise product base price
                const basePrice = (i.variantId && i.variantPrice && i.variantPrice > 0) ? i.variantPrice : i.price;
                copy._tierPrice = Math.round(basePrice * (1 - bestTier.discountPercent / 100) * 100) / 100;
            }
        }
        return copy;
    });
}

function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }
function saveDeliveryZone() { localStorage.setItem("deliveryZone", selectedDeliveryZone); }
function getCategories() { return ["All Products", ...new Set(products.map(p => p.category))]; }

// Update all cart count displays
function updateCartCounts() {
    const localCart = JSON.parse(localStorage.getItem("cart")) || [];
    // Ensure we use .quantity to match the rest of the logic
    const totalItems = localCart.reduce((s, i) => s + (i.quantity || 0), 0);
    
    const ids = ["cartCount", "bottomCartCount", "mobileCartCount"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = totalItems;
    });
}

// Grid quantity change handler for product cards
function gridQtyChange(productId, change, event) {
    if (event) event.stopPropagation();
    
    let localCart = JSON.parse(localStorage.getItem("cart")) || [];
    const item = localCart.find(i => i.id === productId);
    const product = products.find(p => p.id === productId);
    
    if (!item) return;
    
    const newQty = item.quantity + change;
    
    // Check max limit
    if (change > 0) {
        const maxAllowed = Math.min(MAX_QTY_PER_PRODUCT, product ? product.quantity : MAX_QTY_PER_PRODUCT);
        if (newQty > maxAllowed) {
            showGridMaxLimitMessage(productId, maxAllowed);
            return;
        }
    }
    
    if (newQty <= 0) {
        // Remove from cart and reset button to original
        localCart = localCart.filter(i => i.id !== productId);
        localStorage.setItem("cart", JSON.stringify(localCart));
        
        // Reset button to original "Add to Cart"
        const container = document.getElementById(`gridQty-${productId}`);
        if (container) {
            container.outerHTML = `<button class="add-to-cart" onclick="addToCart(${qId(productId)}, event)"><span class="btn-en">Add to Cart</span><span class="btn-ar arabic-text">أضف إلى السلة</span></button>`;
        }
    } else {
        item.quantity = newQty;
        localStorage.setItem("cart", JSON.stringify(localCart));
        
        // Update qty display
        const qtyDisplay = document.getElementById(`gridQtyNum-${productId}`);
        if (qtyDisplay) qtyDisplay.textContent = newQty;
    }
    
    // Sync cart variable
    cart = JSON.parse(localStorage.getItem("cart")) || [];
    
    // Update cart counts immediately
    updateCartCounts();
    
    // Update cart sidebar if open
    updateCart();
    
    // Pulse badge on quantity increase
    if (change > 0) pulseBadge();
}
function calculateDeliveryFee(subtotal) { const zone = deliveryZones[selectedDeliveryZone]; if (subtotal >= zone.freeThreshold) { return 0; } return zone.fee; }
function getAmountUntilFreeDelivery(subtotal) { const zone = deliveryZones[selectedDeliveryZone]; if (subtotal >= zone.freeThreshold) { return 0; } return zone.freeThreshold - subtotal; }
function generateOrderNumber() { const date = new Date(); const year = date.getFullYear().toString().slice(-2); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0'); const random = (crypto.getRandomValues(new Uint16Array(1))[0] % 9000) + 1000; return `ORLO-${year}${month}${day}-${random}`; }

function getCategoryArabic(category) {
    if (category === "All Products") return "جميع المنتجات";
    const product = products.find(p => p.category === category);
    return product && product.categoryAr ? product.categoryAr : '';
}

function formatProductPrice(p, arabicMode) {
    const hasTiers = p.pricingTiers && p.pricingTiers.length > 0;
    let hasMultipleVariantPrices = false;
    if (p.variants && p.variants.length > 0) {
        const prices = p.variants.filter(v => v.quantity > 0).map(v => v.price > 0 ? v.price : p.price).filter(x => x > 0);
        hasMultipleVariantPrices = new Set(prices).size > 1;
    }
    const showOrLess = hasTiers || hasMultipleVariantPrices;
    if (arabicMode) return showOrLess ? `${p.price} د.إ أو أقل` : `${p.price} د.إ`;
    return showOrLess ? `AED ${p.price} or less` : `AED ${p.price}`;
}

function renderProducts(list, arabicMode) {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;
    if (!list.length) {
        grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#999;padding:3rem;">${arabicMode ? 'لم يتم العثور على منتجات' : 'No products found'}</p>`;
        return;
    }

    // Get current cart state
    const localCart = JSON.parse(localStorage.getItem("cart")) || [];

    grid.innerHTML = list.map((p, index) => {
        const safeName = escapeHTML(p.name);
        const safeNameAr = escapeHTML(p.nameAr);
        const safeSlug = encodeURIComponent(p.slug);
        const isUrl = p.image && p.image.startsWith('http');
        // First 4 images are above the fold — load eagerly to improve LCP
        const imgAttrs = index < 4
            ? `fetchpriority="${index === 0 ? 'high' : 'auto'}" style="max-width:100%; max-height:100%; object-fit:contain;"`
            : `loading="lazy" style="max-width:100%; max-height:100%; object-fit:contain;"`;
        const imageHTML = isUrl
            ? `<img src="${escapeHTML(p.image)}" alt="${safeName}" ${imgAttrs}>`
            : escapeHTML(p.image);

        // Check if out of stock (use totalStock for variant products)
        const outOfStock = (p.totalStock !== undefined ? p.totalStock : p.quantity) === 0;
        const cartItem = localCart.find(i => i.id === p.id);
        const inCart = cartItem && cartItem.quantity > 0;

        const hasVariants = p.variants && p.variants.length > 0;
        let buttonHTML;
        if (outOfStock) {
            buttonHTML = arabicMode
                ? `<button class="add-to-cart" disabled style="background:#999;border-color:#999;cursor:not-allowed;">Out of Stock<br><span class="arabic-text">نفذ المخزون</span></button>`
                : `<button class="add-to-cart" disabled style="background:#999;border-color:#999;cursor:not-allowed;">Out of Stock<br><span class="arabic-text">نفذ المخزون</span></button>`;
        } else if (hasVariants) {
            buttonHTML = arabicMode
                ? `<a href="product.html?product=${safeSlug}" class="view-options-btn">View Options<br><span class="arabic-text">عرض الخيارات</span></a>`
                : `<a href="product.html?product=${safeSlug}" class="view-options-btn">View Options<br><span class="arabic-text">عرض الخيارات</span></a>`;
        } else if (inCart) {
            buttonHTML = `
                <div class="grid-qty-control" id="gridQty-${p.id}">
                    <button class="grid-qty-btn" onclick="gridQtyChange(${qId(p.id)}, -1, event)">−</button>
                    <span class="grid-qty-display" id="gridQtyNum-${p.id}">${cartItem.quantity}</span>
                    <button class="grid-qty-btn" onclick="gridQtyChange(${qId(p.id)}, 1, event)">+</button>
                </div>
            `;
        } else {
            buttonHTML = `<button class="add-to-cart" onclick="addToCart(${qId(p.id)}, event)"><span class="btn-en">Add to Cart</span><span class="btn-ar arabic-text">أضف إلى السلة</span></button>`;
        }

        // Arabic mode: show Arabic name first, English secondary
        const titleHTML = arabicMode
            ? `<p class="product-title-ar" style="font-size:0.95rem;">${safeNameAr || safeName}</p>
               <h3 class="product-title" style="font-size:0.75rem;color:#888;">${safeName}</h3>`
            : `<h3 class="product-title">${safeName}</h3>
               ${safeNameAr ? `<p class="product-title-ar">${safeNameAr}</p>` : ''}`;

        return `
        <div class="product-card ${outOfStock ? 'out-of-stock' : ''}" ${arabicMode ? 'dir="rtl"' : ''}>
            ${p.featured ? `<span class="badge">${arabicMode ? 'الأكثر مبيعاً' : 'Best Seller'}</span>` : ""}
            ${outOfStock ? `<span class="badge out-of-stock-badge">${arabicMode ? 'نفذ المخزون' : 'Out of Stock'}</span>` : ""}
            <a href="product.html?product=${safeSlug}" style="text-decoration:none;">
                <div class="product-image">${imageHTML}</div>
            </a>
            <div class="product-info">
                <a href="product.html?product=${safeSlug}" style="text-decoration:none; color:inherit;">
                    ${titleHTML}
                </a>
                <div class="product-price">${formatProductPrice(p, arabicMode)}</div>
                ${buttonHTML}
            </div>
        </div>
    `}).join("");
}

function loadProducts(category = "All Products") {
    selectedCategory = category;
    const list = category === "All Products" ? products : products.filter(p => p.category === category);
    renderProducts(applyFiltersAndSort(list));
    updateCategoryButtons();
    updateActiveCategoryChip(category);
    const heroSection = document.querySelector(".hero");
    const searchInput = document.getElementById("searchInput");
    if (heroSection) {
        if (category === "All Products" && (!searchInput || !searchInput.value.trim())) {
            heroSection.classList.remove("hidden");
        } else {
            heroSection.classList.add("hidden");
        }
    }
}

function updateActiveCategoryChip(category) {
    var existing = document.getElementById('activeCategoryChip');
    if (existing) existing.remove();
    if (category === "All Products") return;
    var title = document.querySelector('.all-products-title');
    if (!title) return;
    var chip = document.createElement('span');
    chip.id = 'activeCategoryChip';
    chip.className = 'active-category-chip';
    chip.innerHTML = category + ' <span class="chip-clear">&times;</span>';
    chip.onclick = function() { loadProducts('All Products'); };
    title.appendChild(chip);
}

function createCategoryFilters() {
    const container = document.getElementById("categoryFilters");
    if (!container) return;
    container.innerHTML = getCategories().map(cat => {
        const catAr = getCategoryArabic(cat);
        return `<button class="category-btn ${cat === selectedCategory ? "active" : ""}" onclick="loadProducts('${cat}')">${cat}${catAr ? `<br><span class="arabic-text category-arabic">${catAr}</span>` : ''}</button>`;
    }).join("");
    setupCategoryScrollIndicators();
}

function setupCategoryScrollIndicators() {
    const tabs = document.getElementById("categoryFilters");
    const fadeLeft = document.getElementById("catFadeLeft");
    const fadeRight = document.getElementById("catFadeRight");
    if (!tabs || !fadeLeft || !fadeRight) return;
    function updateFades() {
        var atStart = tabs.scrollLeft <= 5;
        var atEnd = tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 5;
        fadeLeft.style.opacity = atStart ? '0' : '1';
        fadeRight.style.opacity = atEnd ? '0' : '1';
    }
    tabs.addEventListener('scroll', updateFades);
    updateFades();
}

function updateCategoryButtons() { 
    document.querySelectorAll(".category-btn").forEach(btn => { 
        const firstLine = btn.childNodes[0]; 
        if (firstLine && firstLine.textContent) { 
            const catText = firstLine.textContent.trim(); 
            btn.classList.toggle("active", catText === selectedCategory); 
        } 
    }); 
}

// === ACTIVE FILTERS STATE ===
let activePriceMin = null;
let activePriceMax = null;
let activeSort = 'default';

function applyFiltersAndSort(list) {
    let filtered = list;
    // Price filter
    if (activePriceMin !== null) {
        filtered = filtered.filter(p => p.price >= activePriceMin);
    }
    if (activePriceMax !== null) {
        filtered = filtered.filter(p => p.price <= activePriceMax);
    }
    // Sort
    if (activeSort === 'price-asc') {
        filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (activeSort === 'price-desc') {
        filtered = [...filtered].sort((a, b) => b.price - a.price);
    }
    // default: featured first (already sorted from API)
    return filtered;
}

function isArabic(text) {
    return /[\u0600-\u06FF]/.test(text);
}

function searchProducts() {
    const term = document.getElementById("searchInput").value.toLowerCase().trim();
    // If not on index page, redirect to index with search param
    const isIndex = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html') || window.location.pathname.endsWith('/');
    if (!isIndex && term) {
        window.location.href = 'index.html?search=' + encodeURIComponent(term);
        return;
    }
    const heroSection = document.querySelector(".hero");
    if (!term) {
        loadProducts(selectedCategory);
        if (heroSection) heroSection.classList.remove("hidden");
        return;
    }
    if (heroSection) heroSection.classList.add("hidden");
    const scoped = selectedCategory === "All Products" ? products : products.filter(p => p.category === selectedCategory);
    const results = scoped.filter(p => p.name.toLowerCase().includes(term) || (p.nameAr && p.nameAr.includes(term)) || p.description.toLowerCase().includes(term) || (p.descriptionAr && p.descriptionAr.toLowerCase().includes(term)) || p.category.toLowerCase().includes(term) || (p.categoryAr && p.categoryAr.includes(term)));
    renderProducts(applyFiltersAndSort(results), isArabic(term));
}

// === AUTOCOMPLETE ===
let autocompleteIndex = -1;

function showAutocomplete(term) {
    const dropdown = document.getElementById('searchAutocomplete');
    if (!dropdown) return;
    if (!term || term.length < 1) {
        dropdown.classList.remove('active');
        dropdown.innerHTML = '';
        autocompleteIndex = -1;
        return;
    }
    const matches = products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.nameAr && p.nameAr.includes(term)) ||
        p.category.toLowerCase().includes(term) ||
        (p.categoryAr && p.categoryAr.includes(term))
    ).slice(0, 6);
    if (!matches.length) {
        dropdown.classList.remove('active');
        dropdown.innerHTML = '';
        autocompleteIndex = -1;
        return;
    }
    const arMode = isArabic(term);
    dropdown.innerHTML = matches.map((p, i) => {
        const imgSrc = p.image && p.image.startsWith('http') ? escapeHTML(p.image) : '';
        const imgHTML = imgSrc ? `<img src="${imgSrc}" alt="">` : '';
        const displayName = escapeHTML(arMode ? (p.nameAr || p.name) : p.name);
        return `<div class="autocomplete-item" data-index="${i}" data-slug="${escapeHTML(p.slug)}" data-name="${displayName}" ${arMode ? 'dir="rtl"' : ''}>
            ${imgHTML}
            <div class="autocomplete-item-info">
                <div class="autocomplete-item-name">${arMode ? `<span class="arabic-text">${escapeHTML(p.nameAr || p.name)}</span>` : escapeHTML(p.name)}</div>
                <div class="autocomplete-item-price">${formatProductPrice(p, arMode)}</div>
            </div>
        </div>`;
    }).join('');
    dropdown.classList.add('active');
    autocompleteIndex = -1;

    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('mousedown', function(e) {
            e.preventDefault();
            const name = this.dataset.name;
            document.getElementById('searchInput').value = name;
            dropdown.classList.remove('active');
            searchProducts();
        });
    });
}

function navigateAutocomplete(direction) {
    const dropdown = document.getElementById('searchAutocomplete');
    if (!dropdown) return;
    const items = dropdown.querySelectorAll('.autocomplete-item');
    if (!items.length) return;
    items.forEach(it => it.classList.remove('active'));
    autocompleteIndex += direction;
    if (autocompleteIndex < 0) autocompleteIndex = items.length - 1;
    if (autocompleteIndex >= items.length) autocompleteIndex = 0;
    items[autocompleteIndex].classList.add('active');
    document.getElementById('searchInput').value = items[autocompleteIndex].dataset.name;
}

function addToCart(id, event) {
    if (event) event.stopPropagation();

    const product = products.find(p => p.id === id);

    // If product has variants, redirect to product page
    if (product.variants && product.variants.length > 0) {
        window.location.href = `product.html?product=${product.slug}`;
        return;
    }

    // Check stock
    if (product.quantity === 0) {
        return; // Silent - out of stock
    }
    
    const item = cart.find(i => i.id === id);
    const currentInCart = item ? item.quantity : 0;
    
    // Cap at 10 OR available stock (whichever is lower)
    const maxAllowed = Math.min(MAX_QTY_PER_PRODUCT, product.quantity);
    if (currentInCart >= maxAllowed) {
        showGridMaxLimitMessage(id, maxAllowed);
        return;
    }
    
    if (item) {
        item.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();

    // GA4: track add_to_cart event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
        event: 'add_to_cart',
        ecommerce: {
            currency: 'AED',
            value: product.price,
            items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: 1 }]
        }
    });

    // Meta Pixel: track AddToCart event
    if (typeof fbq === 'function') {
        fbq('track', 'AddToCart', {
            content_ids: [product.slug],
            content_name: product.name,
            content_type: 'product',
            value: product.price,
            currency: 'AED'
        });
    }

    // TikTok Pixel: track AddToCart event
    if (typeof ttq !== 'undefined') {
        ttq.track('AddToCart', {
            content_id: String(product.id),
            content_name: product.name,
            content_type: 'product',
            value: product.price,
            currency: 'AED',
            quantity: 1
        });
    }

    // Transform button to qty stepper
    const btn = event ? event.target.closest('.add-to-cart') : null;
    if (btn) {
        const qty = cart.find(i => i.id === id)?.quantity || 1;
        btn.outerHTML = `
            <div class="grid-qty-control" id="gridQty-${id}">
                <button class="grid-qty-btn" onclick="gridQtyChange(${qId(id)}, -1, event)">−</button>
                <span class="grid-qty-display" id="gridQtyNum-${id}">${qty}</span>
                <button class="grid-qty-btn" onclick="gridQtyChange(${qId(id)}, 1, event)">+</button>
            </div>
        `;
    }
    
    // Update cart counts immediately
    updateCartCounts();
    updateCart(); 
    
    // Pulse the cart badge
    pulseBadge();
}

function pulseBadge() {
    const badges = [
        document.getElementById('cartCount'),
        document.getElementById('bottomCartCount'),
        document.getElementById('mobileCartCount')
    ];
    badges.forEach(badge => {
        if (!badge) return;
        badge.classList.remove('badge-pulse');
        badge.offsetHeight;
        badge.classList.add('badge-pulse');
        setTimeout(() => badge.classList.remove('badge-pulse'), 600);
    });
}

function updateCart() {
    // *** FIX: Always sync cart from localStorage first ***
    cart = JSON.parse(localStorage.getItem("cart")) || [];
    
    const cartItems = document.getElementById("cartItems"); 
    const cartCount = document.getElementById("cartCount"); 
    const bottomCartCount = document.getElementById("bottomCartCount");
    const cartFooter = document.querySelector(".cart-footer");
    const cartCheckoutFixed = document.getElementById("cartCheckoutFixed");
    const isMobile = window.innerWidth <= 768;
    
    if (!cart.length) { 
        cartItems.innerHTML = "<p style='text-align:center;padding:3rem;color:#999;font-size:1.1rem;'>Your cart is empty</p>"; 
        if (cartCount) cartCount.textContent = 0;
        if (bottomCartCount) bottomCartCount.textContent = 0;
        cartFooter.innerHTML = `<div style="display: flex; justify-content: space-between; padding: 0.75rem 0 0.5rem; font-size: 1.1rem; font-weight: 700; color: #2c4a5c;"><span>Total | <span class="arabic-text">الإجمالي</span>:</span><span>AED 0.00</span></div>`;
        if (cartCheckoutFixed) cartCheckoutFixed.innerHTML = '';
        return; 
    } 
    
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    const cartWithPricing = calculateTierPricing(cart);
    const subtotal = cartWithPricing.reduce((s, i) => s + (i._tierPrice || ((i.variantId && i.variantPrice > 0) ? i.variantPrice : i.price)) * i.quantity, 0);
    const deliveryFee = calculateDeliveryFee(subtotal);
    const total = subtotal + deliveryFee;
    const amountNeeded = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
    
    if (cartCount) cartCount.textContent = totalItems;
    if (bottomCartCount) bottomCartCount.textContent = totalItems; 
    
    const isLoggedIn = !!(localStorage.getItem('orlo_token') || sessionStorage.getItem('orlo_token'));
    
    let checkoutBtnHTML;
    
    if (isLoggedIn) {
        checkoutBtnHTML = `
            <button id="stripeBtn" 
                style="width: 100%; padding: 0.9rem; font-size: 0.85rem; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; background: #2c4a5c; color: white; transition: all 0.3s;" 
                onclick="checkout()" 
                onmouseover="this.style.background='#1e3545'" 
                onmouseout="this.style.background='#2c4a5c'">
                ${SVG_CARD} Pay by Card | الدفع بالبطاقة
            </button>
        `;
    } else {
        checkoutBtnHTML = `
            <div style="border-radius: 9px; overflow: hidden; box-shadow: 0 3px 10px rgba(44,74,92,0.15);">
                <div style="background: linear-gradient(135deg, #2c4a5c, #1e3545); color: white; text-align: center; padding: 10px 10px; font-size: 0.7rem; font-weight: 600; display:flex; align-items:center; justify-content:center; gap:5px;">
                    ${SVG_CARD} Pay by Card | <span style="font-family: 'Almarai', sans-serif; font-size: 0.64rem; opacity: 0.85;">الدفع بالبطاقة</span>
                </div>
                <div style="display: flex; gap: 8px; background: linear-gradient(135deg, #2c4a5c, #1e3545); padding: 2px 10px 8px;">
                    <button id="stripeBtn" onclick="(function(){ var p=window.location.pathname+window.location.search; var r=p+(p.indexOf('?')>-1?'&amp;':'?')+'openCart=true'; window.location.href='login.html?redirect='+encodeURIComponent(r); })()"
                        style="flex: 1; padding: 9px 7px; border: none; font-family: 'Inter', sans-serif; font-size: 0.72rem; font-weight: 600; cursor: pointer; text-align: center; background: #3d6178; color: white; border-radius: 5px; transition: all 0.2s;">
                        ${SVG_LOCK_SM} Sign in<span style="font-family: 'Almarai', sans-serif; font-size: 0.62rem; display: block; opacity: 0.8;">تسجيل الدخول</span>
                    </button>
                    <button id="stripeBtnGuest" onclick="checkout()"
                        style="flex: 1; padding: 9px 7px; border: none; font-family: 'Inter', sans-serif; font-size: 0.72rem; font-weight: 600; cursor: pointer; text-align: center; background: #3d6178; color: white; border-radius: 5px; transition: all 0.2s;">
                        ${SVG_PERSON} As Guest<span style="font-family: 'Almarai', sans-serif; font-size: 0.62rem; display: block; opacity: 0.8;">كضيف</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    if (isMobile && cartCheckoutFixed) {
        cartCheckoutFixed.innerHTML = checkoutBtnHTML;
    } else if (cartCheckoutFixed) {
        cartCheckoutFixed.innerHTML = '';
    }
    
    const itemPad = isMobile ? '0.3rem 0.4rem' : '0.5rem';
    const itemNameSize = isMobile ? '0.82rem' : '0.8rem';
    const itemSubSize = isMobile ? '0.73rem' : '0.7rem';
    const itemTotalSize = isMobile ? '0.82rem' : '0.8rem';
    const btnPad = isMobile ? '0.25rem 0.5rem' : '0.3rem 0.6rem';
    const btnFont = isMobile ? '0.8rem' : '0.75rem';
    const qtyFont = isMobile ? '0.8rem' : '0.8rem';

    // Calculate tier pricing for each cart item
    const cartWithTierPricing = calculateTierPricing(cart);

    cartItems.innerHTML = cartWithTierPricing.map(i => {
        const cartItemId = i.variantId ? `${i.id}-v${i.variantId}` : `${i.id}`;
        const variantLine = i.variantName ? `<div style="color:#e07856; font-size:0.7rem; font-weight:500;">${escapeHTML(i.variantName)}</div>` : '';
        const variantBase = (i.variantId && i.variantPrice > 0) ? i.variantPrice : i.price;
        const effectivePrice = i._tierPrice || variantBase;
        const showOrigPrice = i._tierPrice && i._tierPrice < variantBase;
        const priceDisplay = showOrigPrice
            ? `<span style="text-decoration:line-through;color:#bbb;font-size:0.65rem;">AED ${variantBase}</span> AED ${effectivePrice} × ${i.quantity}`
            : `AED ${effectivePrice} × ${i.quantity}`;
        const safeId = qId(i.id);
        const safeVid = i.variantId ? qId(i.variantId) : null;
        const updateArgs = safeVid ? `${safeId}, -1, ${safeVid}` : `${safeId}, -1`;
        const updateArgsPlus = safeVid ? `${safeId}, 1, ${safeVid}` : `${safeId}, 1`;
        const removeArgs = safeVid ? `${safeId}, ${safeVid}` : `${safeId}`;

        return `
        <div id="cartItem-${cartItemId}" style="display:flex; justify-content:space-between; align-items:center; padding:${itemPad}; border-bottom:1px solid #eee; position:relative;">
            <div style="flex:1; line-height:1.3;">
                <strong style="font-size:${itemNameSize}; color:#2c4a5c;">${escapeHTML(i.name)}</strong>
                ${variantLine}
                <span style="color:#888; font-size:${itemSubSize};">${priceDisplay}</span><br>
                <span style="color:#e07856; font-weight:600; font-size:${itemTotalSize};">AED ${(effectivePrice * i.quantity).toFixed(2)}</span>
            </div>
            <div style="display:flex; gap:0.3rem; align-items:center;">
                <button onclick="updateQuantity(${updateArgs})" style="padding:${btnPad}; background:#f0f0f0; border:none; border-radius:4px; cursor:pointer; font-size:${btnFont}; font-weight:600;">-</button>
                <span style="font-size:${qtyFont}; font-weight:600; min-width:18px; text-align:center;">${i.quantity}</span>
                <button onclick="updateQuantity(${updateArgsPlus})" style="padding:${btnPad}; background:#f0f0f0; border:none; border-radius:4px; cursor:pointer; font-size:${btnFont}; font-weight:600;">+</button>
                <button onclick="removeFromCart(${removeArgs})" style="padding:${btnPad}; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer; margin-left:0.2rem; font-size:${btnFont};">${SVG_CLOSE_CART}</button>
            </div>
        </div>
    `}).join(""); 
    
    let footerHTML = '';
    
    const amountNeededForFree = FREE_DELIVERY_THRESHOLD - subtotal;
    const showUpsell = subtotal < FREE_DELIVERY_THRESHOLD && !(isMobile && upsellUsed);
    
    if (showUpsell) {
        const cartProductIds = cart.map(i => i.id);
        
        // Filter out-of-stock items from upsell
        const upsellProducts = products
            .filter(p => !cartProductIds.includes(p.id))
            .filter(p => (p.totalStock !== undefined ? p.totalStock : p.quantity) > 0) // Only in-stock items
            .filter(p => p.price >= amountNeededForFree)
            .sort((a, b) => a.price - b.price)
            .slice(0, 2);
        
        if (subtotal >= 60) {
            if (upsellProducts.length > 0) {
                footerHTML += `
                    <div style="padding: 0.75rem 1rem; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 0.75rem;">
                        <div style="font-weight: 600; margin-bottom: 0.75rem; color: #2c4a5c; font-size: 0.9rem;">
                            Add AED ${amountNeededForFree.toFixed(0)} more for free delivery:
                        </div>
                        ${upsellProducts.map(p => `
                            <div style="display: flex; align-items: center; padding: 0.25rem 0; border-bottom: 1px solid #f0f0f0; gap: 0.5rem;">
                                <div style="flex: 1; font-weight: 500; color: #2c4a5c; font-size: 0.8rem;">${p.name}</div>
                                <div style="font-size: 0.75rem; color: #888; white-space: nowrap;">${formatProductPrice(p, false)}</div>
                                <button onclick="addUpsellItem(${qId(p.id)}, event)" style="padding: 0.25rem 0.5rem; background: #2c4a5c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Add</button>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } else {
            footerHTML += `
                <div style="padding: 0.75rem 1rem; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 0.75rem;">
                    <div style="font-weight: 600; color: #2c4a5c; font-size: 0.9rem; margin-bottom: 0.5rem;">
                        ${SVG_TRUCK_INLINE} Add AED ${amountNeededForFree.toFixed(0)} more to qualify for free delivery
                    </div>
                    ${upsellProducts.length > 0 ? `
                        <div style="cursor: pointer;" onclick="this.querySelector('.upsell-dropdown').style.display = this.querySelector('.upsell-dropdown').style.display === 'none' ? 'block' : 'none'; this.querySelector('.arrow').textContent = this.querySelector('.upsell-dropdown').style.display === 'none' ? '▶' : '▼';">
                            <span style="font-size: 0.8rem; color: #e07856; font-weight: 500;"><span class="arrow">▶</span> View suggestions</span>
                            <div class="upsell-dropdown" style="display: none; margin-top: 0.5rem;">
                                ${upsellProducts.map(p => `
                                    <div style="display: flex; align-items: center; padding: 0.25rem 0; border-bottom: 1px solid #f0f0f0; gap: 0.5rem;">
                                        <div style="flex: 1; font-weight: 500; color: #2c4a5c; font-size: 0.8rem;">${p.name}</div>
                                        <div style="font-size: 0.75rem; color: #888; white-space: nowrap;">${formatProductPrice(p, false)}</div>
                                        <button onclick="event.stopPropagation(); addUpsellItem(${qId(p.id)}, event)" style="padding: 0.25rem 0.5rem; background: #2c4a5c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Add</button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    }
    
    if (subtotal >= FREE_DELIVERY_THRESHOLD) {
        savedUpsellProducts = null;
    }
    
    if (!isMobile) {
        footerHTML += `
            <div style="padding: 0 1rem 0.75rem;">
                ${checkoutBtnHTML}
            </div>
        `;
    }

    const sumPad = isMobile ? '0.3rem 0.75rem 0.25rem' : '0.6rem 1rem';
    const sumFont = isMobile ? '0.78rem' : '0.8rem';
    const sumTotalFont = isMobile ? '0.95rem' : '1rem';
    const sumDivMargin = isMobile ? '0.2rem 0' : '0.3rem 0';
    const sumTotalPad = isMobile ? '0.25rem 0 0.1rem' : '0.4rem 0 0.2rem';

    footerHTML += `
        <div style="padding: ${sumPad}; background: #f8f9fa; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; padding: 0.15rem 0; font-size: ${sumFont}; color: #2c4a5c;">
                <span>Subtotal | <span class="arabic-text">المجموع الفرعي</span>:</span>
                <span>AED ${subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.15rem 0; font-size: ${sumFont}; color: #2c4a5c;">
                <span>Delivery | <span class="arabic-text">التوصيل</span>:</span>
                <span style="${deliveryFee === 0 ? 'color: #28a745; font-weight: 600;' : ''}">${deliveryFee === 0 ? 'FREE | <span class="arabic-text">مجاني</span>' : 'AED ' + deliveryFee.toFixed(2)}</span>
            </div>
            <div style="border-top: 2px solid #ddd; margin: ${sumDivMargin};"></div>
            <div style="display: flex; justify-content: space-between; padding: ${sumTotalPad}; font-size: ${sumTotalFont}; font-weight: 700; color: #2c4a5c;">
                <span>Total | <span class="arabic-text">الإجمالي</span>:</span>
                <span>AED ${total.toFixed(2)}</span>
            </div>
        </div>
    `;
    
    cartFooter.innerHTML = footerHTML;
}

function changeDeliveryZone(zone) { 
    selectedDeliveryZone = zone; 
    saveDeliveryZone(); 
    updateCart(); 
}

function updateQuantity(id, change, variantId) {
    const item = variantId
        ? cart.find(i => i.id === id && i.variantId === variantId)
        : cart.find(i => i.id === id && !i.variantId);
    const product = products.find(p => p.id === id);

    if (item) {
        const newQty = item.quantity + change;

        // Cap at 10 OR available stock (whichever is lower)
        if (change > 0) {
            let stockQty = product ? product.quantity : MAX_QTY_PER_PRODUCT;
            if (variantId && product && product.variants) {
                const variant = product.variants.find(v => v.id === variantId);
                if (variant) stockQty = variant.quantity;
            }
            const maxAllowed = Math.min(MAX_QTY_PER_PRODUCT, stockQty);
            if (newQty > maxAllowed) {
                const cartItemId = variantId ? `${id}-v${variantId}` : `${id}`;
                showCartLimitMessage(cartItemId, maxAllowed);
                return;
            }
        }

        item.quantity = newQty;
        if (item.quantity <= 0) {
            removeFromCart(id, variantId);
        } else {
            saveCart();
            updateCart();
            // Sync product page stepper (use querySelectorAll for duplicate desktop/mobile IDs)
            if (variantId) {
                document.querySelectorAll(`[id="qtyDisplay-${id}-${variantId}"]`).forEach(el => {
                    el.textContent = newQty;
                });
            } else {
                document.querySelectorAll(`[id="qtyDisplay-${id}"]`).forEach(el => {
                    el.textContent = newQty;
                });
                const gridQtyNum = document.getElementById(`gridQtyNum-${id}`);
                if (gridQtyNum) gridQtyNum.textContent = newQty;
            }
            // Sync sticky price bar with new tier pricing
            if (typeof updateTierHighlight === 'function') updateTierHighlight(id);
        }
    }
}

// Show limit message inline within the specific cart item row
function showCartLimitMessage(cartItemId, maxAllowed) {
    // cartItemId can be "5" or "5-v12" for variant items
    const productId = cartItemId;
    // Remove any existing
    const existing = document.getElementById('cartLimitMsg');
    if (existing) existing.remove();
    if (window.cartLimitTimer) clearTimeout(window.cartLimitTimer);

    const isStockLimit = maxAllowed < MAX_QTY_PER_PRODUCT;

    let messageEn, messageAr;
    if (isStockLimit) {
      messageEn = `${SVG_WARNING} Only <span class="highlight">${maxAllowed}</span> left in stock`;
      messageAr = `متبقي <span class="highlight">${toArabicNumerals(maxAllowed)}</span> فقط في المخزون`;
    } else {
      messageEn = `${SVG_WARNING} Max <span class="highlight">${MAX_QTY_PER_PRODUCT}</span> per order`;
      messageAr = `الحد الأقصى <span class="highlight">${toArabicNumerals(MAX_QTY_PER_PRODUCT)}</span> لكل طلب`;
    }

    // Shake the + button on the specific cart item
    const cartItem = document.getElementById(`cartItem-${productId}`);
    if (cartItem) {
      const plusBtn = cartItem.querySelectorAll('button')[1];
      if (plusBtn) {
          plusBtn.style.animation = 'none';
          plusBtn.offsetHeight;
          plusBtn.style.animation = 'cartQtyShake 0.4s ease';
      }
    }

    // Insert message inline inside the specific cart item row, below the price
    if (!cartItem) return;

    const msg = document.createElement('div');
    msg.id = 'cartLimitMsg';
    msg.className = 'cart-limit-msg-inline';
    msg.innerHTML = `${messageEn} <span class="cart-limit-ar-inline">${messageAr}</span>`;

    // Append inside the left text column (first child div) of the cart item
    const textCol = cartItem.querySelector('div');
    if (textCol) {
      textCol.appendChild(msg);
    }

    // Auto-dismiss
    window.cartLimitTimer = setTimeout(() => {
      const tip = document.getElementById('cartLimitMsg');
      if (tip) {
        tip.style.opacity = '0';
        tip.style.transition = 'opacity 0.4s';
        setTimeout(() => { if (tip.parentNode) tip.remove(); }, 400);
      }
    }, 3000);
}

function removeFromCart(id, variantId) {
    if (variantId) {
        cart = cart.filter(i => !(i.id === id && i.variantId === variantId));
    } else {
        cart = cart.filter(i => i.id !== id);
    }
    upsellUsed = false;
    saveCart();
    updateCart();

    if (variantId) {
        // Only reset product page button if the removed variant is the currently selected one
        const currentlySelected = window._selectedVariant;
        const removedIsSelected = currentlySelected && currentlySelected.id === variantId;

        if (removedIsSelected) {
            // Reset product page variant buttons back to "Add to Cart"
            document.querySelectorAll(`[id="transformedBtn-${id}"]`).forEach(el => {
                const isMobile = el.closest('.mobile-product-page') !== null;
                const btnId = isMobile ? 'mobileAddToCartBtn' : 'addToCartBtn';
                const btnClass = isMobile ? 'mobile-add-to-cart' : 'add-to-cart-btn';
                el.outerHTML = `<button class="${btnClass}" id="${btnId}"><span class="btn-en">Add to Cart</span><span class="btn-ar arabic-text">أضف إلى السلة</span></button>`;
            });
            // Re-attach click handlers if on product page
            if (typeof addToCartHandlerRef === 'function' && typeof transformToQtyButtonVariant === 'function') {
                const sv = window._selectedVariant;
                const product = products.find(p => p.id === id);
                const newDesktopBtn = document.getElementById('addToCartBtn');
                const newMobileBtn = document.getElementById('mobileAddToCartBtn');
                if (newDesktopBtn && sv && product) {
                    newDesktopBtn.onclick = function() {
                        if (addToCartHandlerRef()) transformToQtyButtonVariant(this, product, sv);
                    };
                }
                if (newMobileBtn && sv && product) {
                    newMobileBtn.onclick = function() {
                        if (addToCartHandlerRef()) transformToQtyButtonVariant(this, product, sv);
                    };
                }
            }
        }
        // If a different variant is selected and still in cart, don't touch the button
    } else {
        // Reset grid button if visible (non-variant products only)
        const gridQty = document.getElementById(`gridQty-${id}`);
        if (gridQty) {
            gridQty.outerHTML = `<button class="add-to-cart" onclick="addToCart(${qId(id)}, event)"><span class="btn-en">Add to Cart</span><span class="btn-ar arabic-text">أضف إلى السلة</span></button>`;
        }

        // Reset product page button if visible
        if (typeof resetToAddButton === 'function') {
            resetToAddButton(id);
        }
    }
    // Sync sticky price bar with new tier pricing
    if (typeof updateTierHighlight === 'function') updateTierHighlight(id);
}

function toggleCart() { 
    const cartSidebar = document.getElementById("cartSidebar");
    const bottomCartBtn = document.getElementById("bottomCartBtn");
    const bottomHomeBtn = document.getElementById("bottomHomeBtn");
    
    cartSidebar.classList.toggle("active");
    
    if (cartSidebar.classList.contains("active")) {
        if (bottomCartBtn) bottomCartBtn.classList.add("cart-active");
        if (bottomHomeBtn) bottomHomeBtn.classList.remove("home-active");
        lockScroll();
    } else {
        if (bottomCartBtn) bottomCartBtn.classList.remove("cart-active");
        if (bottomHomeBtn) bottomHomeBtn.classList.add("home-active");
        unlockScroll();
        upsellUsed = false;
        savedUpsellProducts = null;
    }
    
    updateCart();
}

function addUpsellItem(id, event) {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        upsellUsed = true;
    }
    addToCart(id, event);
}

function openPolicy(type) { 
    document.getElementById("policyText").innerHTML = policies[type]; 
    document.getElementById("policyModal").style.display = "block"; 
    lockScroll();
}

function closePolicy() {
    document.getElementById("policyModal").style.display = "none";
    unlockScroll();
}

function toggleAbout() {
    const aboutSection = document.getElementById('about');
    const computedStyle = window.getComputedStyle(aboutSection);
    const isVisible = computedStyle.display !== 'none';
    
    if (isVisible) {
        aboutSection.style.display = 'none';
    } else {
        aboutSection.style.display = 'block';
        aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function toggleMobileMenu() {
    let overlay = document.querySelector('.mobile-menu-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        const chevron = '<svg class="menu-chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>';
        const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
        const base = isIndex ? '' : 'index.html';
        overlay.innerHTML = `
            <div class="mobile-menu">
                <a href="${base}#products" onclick="closeMobileMenu()">
                    <div class="menu-icon-box"><svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></svg></div>
                    <div class="menu-text"><span class="menu-en">Shop</span><span class="menu-ar">تسوق</span></div>
                    ${chevron}
                </a>
                <a href="${isIndex ? 'javascript:void(0)' : 'index.html?showAbout=true'}" onclick="${isIndex ? 'closeMobileMenu();toggleAbout();return false;' : 'closeMobileMenu()'}">
                    <div class="menu-icon-box"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></div>
                    <div class="menu-text"><span class="menu-en">About</span><span class="menu-ar">من نحن</span></div>
                    ${chevron}
                </a>
                <a href="${base}#contact" onclick="closeMobileMenu()">
                    <div class="menu-icon-box"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
                    <div class="menu-text"><span class="menu-en">Contact</span><span class="menu-ar">اتصل بنا</span></div>
                    ${chevron}
                </a>
                <a href="${base}#terms" onclick="closeMobileMenu()">
                    <div class="menu-icon-box"><svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg></div>
                    <div class="menu-text"><span class="menu-en">Terms & Conditions</span><span class="menu-ar">الشروط والأحكام</span></div>
                    ${chevron}
                </a>
            </div>
        `;
        document.body.appendChild(overlay);
        
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                closeMobileMenu();
            }
        };
    }
    
    overlay.classList.toggle('active');
    if (overlay.classList.contains('active')) {
        lockScroll();
    } else {
        unlockScroll();
    }
}

function closeMobileMenu() {
    const overlay = document.querySelector('.mobile-menu-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
    unlockScroll();
}

// === HOMEPAGE SECTIONS: Popular, Categories, New Arrivals ===

// Emoji icons for category cards — colorful, zero-dependency
const CATEGORY_SVG = {
    'Kitchen':      '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
    'Home':         '<path d="M3 12L12 3l9 9"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9"/>',
    'Lifestyle':    '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>',
    'Bathroom':     '<circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>',
    'Organization': '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    'Storage':      '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    'Cleaning':     '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    'Bedroom':      '<path d="M2 4v16M22 4v16"/><rect x="2" y="10" width="20" height="8" rx="2"/><path d="M7 10V7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3"/>',
    'Garden':       '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    'Office':       '<rect x="2" y="3" width="20" height="13" rx="2"/><polyline points="8,21 12,17 16,21"/><line x1="12" y1="17" x2="12" y2="16"/>',
    'Laundry':      '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/>',
    'Dining':       '<line x1="18" y1="2" x2="18" y2="22"/><path d="M14 2v4a4 4 0 0 0 8 0V2"/><line x1="6" y1="2" x2="6" y2="8"/><path d="M2 8h8"/><line x1="6" y1="8" x2="6" y2="22"/>',
    'Travel':       '<rect x="1" y="6" width="22" height="16" rx="3"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    'Kids':         '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    'Pets':         '<circle cx="7.5" cy="5.5" r="1.5"/><circle cx="17.5" cy="5.5" r="1.5"/><circle cx="5.5" cy="10.5" r="1.5"/><circle cx="19.5" cy="10.5" r="1.5"/><path d="M12 20c-2 2-6.5 1-7-3 0-4 3-6 7-6s7 2 7 6c-.5 4-5 5-7 3z"/>',
    'Workspace':    '<rect x="2" y="3" width="20" height="13" rx="2"/><polyline points="8,21 12,17 16,21"/><line x1="12" y1="17" x2="12" y2="16"/>',
    'Home Office':  '<rect x="2" y="3" width="20" height="13" rx="2"/><polyline points="8,21 12,17 16,21"/><line x1="12" y1="17" x2="12" y2="16"/>',
    'Work Space':   '<rect x="2" y="3" width="20" height="13" rx="2"/><polyline points="8,21 12,17 16,21"/><line x1="12" y1="17" x2="12" y2="16"/>',
    'Fitness':      '<line x1="6" y1="12" x2="18" y2="12"/><line x1="6" y1="8" x2="6" y2="16"/><line x1="18" y1="8" x2="18" y2="16"/><line x1="4" y1="9" x2="4" y2="15"/><line x1="20" y1="9" x2="20" y2="15"/>',
    'Beauty':       '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    'Electronics':  '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    'Tools':        '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    'Baby':         '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/>',
    'Car':          '<rect x="1" y="11" width="22" height="9" rx="2"/><path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/><circle cx="7" cy="20" r="1"/><circle cx="17" cy="20" r="1"/>',
    'Outdoor':      '<path d="M3 17l4.5-9 4.5 4.5 3-4.5 5 9H3z"/><circle cx="18" cy="6" r="2"/>',
};

function getCategorySVG(categoryName) {
    if (CATEGORY_SVG[categoryName]) return CATEGORY_SVG[categoryName];
    const sorted = Object.keys(CATEGORY_SVG).sort((a, b) => b.length - a.length);
    for (const key of sorted) {
        if (categoryName.toLowerCase().includes(key.toLowerCase())) return CATEGORY_SVG[key];
    }
    // default: tag/label icon
    return '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>';
}

const CATEGORY_EMOJI = {
    'Kitchen': '🍳',
    'Home': '🏠',
    'Lifestyle': '✨',
    'Bathroom': '🚿',
    'Organization': '🗂️',
    'Storage': '📦',
    'Cleaning': '🧹',
    'Bedroom': '🛏️',
    'Garden': '🌿',
    'Office': '🖥️',
    'Laundry': '👕',
    'Dining': '🍽️',
    'Travel': '🧳',
    'Kids': '🧸',
    'Pets': '🐾',
    'Workspace': '🖥️',
    'Home Office': '🖥️',
    'Work Space': '🖥️',
    'Fitness': '💪',
    'Beauty': '💄',
    'Electronics': '🔌',
    'Tools': '🔧',
    'Baby': '🍼',
    'Car': '🚗',
    'Outdoor': '⛺'
};

function getCategoryEmoji(categoryName) {
    if (CATEGORY_EMOJI[categoryName]) return CATEGORY_EMOJI[categoryName];
    // Try longest key first so "Workspace" beats "Home" for "Home & Workspace"
    const sorted = Object.keys(CATEGORY_EMOJI).sort((a, b) => b.length - a.length);
    for (const key of sorted) {
        if (categoryName.toLowerCase().includes(key.toLowerCase())) return CATEGORY_EMOJI[key];
    }
    return '🛒';
}

function populatePopularNow() {
    const container = document.getElementById('popularScroll');
    if (!container || !products.length) return;
    // Show ALL featured (best seller) products — no exclusions
    const featured = products.filter(p => p.featured);
    let list = [...featured];
    // Auto-fill to at least 6 if not enough featured
    if (list.length < 6) {
        const arrivalIds = new Set([...products].sort((a, b) => b.id - a.id).slice(0, 4).map(p => p.id));
        const filler = products.filter(p => !p.featured && !arrivalIds.has(p.id));
        list = list.concat(filler.slice(0, 6 - list.length));
    }

    container.innerHTML = list.map(p => {
        const imgSrc = p.image && p.image.startsWith('http') ? escapeHTML(p.image) : '';
        const safeName = escapeHTML(p.name);
        const safeNameAr = escapeHTML(p.nameAr);
        const imgHTML = imgSrc
            ? `<img src="${imgSrc}" alt="${safeName}" loading="lazy">`
            : `<span style="font-size:2rem;">${escapeHTML(p.image || '')}</span>`;
        return `
        <a href="product.html?product=${encodeURIComponent(p.slug)}" class="popular-card">
            <div class="popular-card-img">${imgHTML}</div>
            <div class="popular-card-info">
                <div class="popular-card-name">${safeName}</div>
                ${safeNameAr ? `<div class="popular-card-name-ar">${safeNameAr}</div>` : ''}
                <div class="popular-card-price">${formatProductPrice(p, false)}</div>
            </div>
        </a>`;
    }).join('');
}

function populateCategories() {
    const container = document.getElementById('categoryCards');
    if (!container || !products.length) return;
    const cats = getCategories().filter(c => c !== 'All Products');

    // 3+ categories → 3-column grid; 2 → 2-column
    container.classList.toggle('three-plus', cats.length >= 3);

    container.innerHTML = cats.map((cat, i) => {
        const count = products.filter(p => p.category === cat).length;
        const catAr = getCategoryArabic(cat);
        const svg = getCategorySVG(cat);
        const bandClass = 'band-col-' + (i % 4);
        return `
        <div class="category-card" onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'}); setTimeout(function(){ loadProducts('${cat.replace(/'/g, "\\'")}'); }, 300);">
            <div class="category-card-band ${bandClass}">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${svg}</svg>
            </div>
            <div class="category-card-text">
                <div class="category-card-name">${cat}</div>
                ${catAr ? `<div class="category-card-name-ar">${catAr}</div>` : ''}
                <div class="category-card-count">${count} ${count !== 1 ? 'Products' : 'Product'} &nbsp;·&nbsp; <span dir="ltr">${count === 1 ? 'منتج' : count === 2 ? 'منتجين' : 'منتجات'} ${count}</span></div>
            </div>
        </div>`;
    }).join('');
}

function populateNewArrivals() {
    const container = document.getElementById('newArrivalsGrid');
    if (!container || !products.length) return;
    // Take the last 4 products by ID (newest additions), prefer non-featured
    const sorted = [...products].sort((a, b) => b.id - a.id);
    const nonFeatured = sorted.filter(p => !p.featured);
    const arrivals = nonFeatured.length >= 4
        ? nonFeatured.slice(0, 4)
        : sorted.slice(0, 4);

    container.innerHTML = arrivals.map(p => {
        const imgSrc = p.image && p.image.startsWith('http') ? escapeHTML(p.image) : '';
        const safeName = escapeHTML(p.name);
        const safeNameAr = escapeHTML(p.nameAr);
        const imgHTML = imgSrc
            ? `<img src="${imgSrc}" alt="${safeName}" loading="lazy">`
            : `<span style="font-size:2rem;">${escapeHTML(p.image || '')}</span>`;
        return `
        <a href="product.html?product=${encodeURIComponent(p.slug)}" class="arrival-card">
            <div class="arrival-card-img">${imgHTML}</div>
            <div class="arrival-card-info">
                <div class="arrival-card-badge">New</div>
                <div class="arrival-card-name">${safeName}</div>
                ${safeNameAr ? `<div class="arrival-card-name-ar">${safeNameAr}</div>` : ''}
                <div class="arrival-card-price">${formatProductPrice(p, false)}</div>
            </div>
        </a>`;
    }).join('');
}

function populateHomepageSections() {
    populatePopularNow();
    populateCategories();
    populateNewArrivals();
    initScrollArrows();
}

function initScrollArrows() {
    document.querySelectorAll('.scroll-wrapper').forEach(wrapper => {
        const scrollEl = wrapper.querySelector('.popular-scroll, .new-arrivals-grid');
        if (!scrollEl) return;

        const leftBtn = wrapper.querySelector('.scroll-arrow-left');
        const rightBtn = wrapper.querySelector('.scroll-arrow-right');

        function updateArrows() {
            const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
            if (maxScroll <= 2) {
                // Everything fits — hide both arrows
                leftBtn.classList.remove('visible');
                rightBtn.classList.remove('visible');
                return;
            }
            leftBtn.classList.toggle('visible', scrollEl.scrollLeft > 2);
            rightBtn.classList.toggle('visible', scrollEl.scrollLeft < maxScroll - 2);
        }

        // Scroll by roughly one card width on click
        function scrollBy(dir) {
            const card = scrollEl.querySelector('.popular-card, .arrival-card');
            const distance = card ? card.offsetWidth + 14 : 180;
            scrollEl.scrollBy({ left: dir * distance, behavior: 'smooth' });
        }

        leftBtn.addEventListener('click', () => scrollBy(-1));
        rightBtn.addEventListener('click', () => scrollBy(1));

        scrollEl.addEventListener('scroll', updateArrows, { passive: true });
        window.addEventListener('resize', updateArrows);

        // Initial check — wait for layout to settle so scrollWidth is accurate
        requestAnimationFrame(() => { requestAnimationFrame(updateArrows); });
    });
}

window.onload = () => {
    createCategoryFilters();
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    loadProducts(categoryParam || 'All Products');
    updateCart();
    populateHomepageSections();

    // If arriving with ?category=, hide homepage sections and show breadcrumb
    if (categoryParam) {
        document.querySelectorAll('.homepage-section').forEach(s => s.style.display = 'none');
        const breadcrumb = document.getElementById('categoryBreadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = '<a href="index.html">Home</a><span class="crumb-sep">/</span><span class="crumb-current">' + categoryParam + '</span>';
            breadcrumb.style.display = 'flex';
        }
        const productsSection = document.getElementById('products');
        if (productsSection) productsSection.scrollIntoView();
    } 
    
    // Auto-open cart if redirected back from login
    if (urlParams.get('openCart') === 'true') {
        setTimeout(() => { toggleCart(); }, 300);
        // Clean URL
        const cleanUrl = window.location.href.split('?')[0];
        window.history.replaceState({}, '', cleanUrl);
    }
    
    if (urlParams.get('showAbout') === 'true') {
        const aboutSection = document.getElementById('about');
        if (aboutSection) {
            aboutSection.style.display = 'block';
            setTimeout(() => {
                aboutSection.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }
    
    const searchTerm = urlParams.get('search');
    if (searchTerm) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = searchTerm;
            searchProducts();
        }
    }
    
    const promoBanner = document.querySelector('.mobile-promo-banner');
    if (promoBanner) {
        promoBanner.innerHTML = `${SVG_TRUCK_INLINE} Free delivery over AED ${FREE_DELIVERY_THRESHOLD} | <span class="arabic-text">توصيل مجاني فوق ${FREE_DELIVERY_THRESHOLD} درهم</span>`;
    }
    
    const heroThreshold = document.getElementById('heroThreshold');
    const heroThresholdAr = document.getElementById('heroThresholdAr');
    if (heroThreshold) heroThreshold.textContent = FREE_DELIVERY_THRESHOLD;
    if (heroThresholdAr) heroThresholdAr.textContent = FREE_DELIVERY_THRESHOLD;
    
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("navLinks");
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle("active");
            navLinks.classList.toggle("active");
            if (navLinks.classList.contains("active")) { lockScroll(); } else { unlockScroll(); }
        });
        
        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", function(e) {
                hamburger.classList.remove("active");
                navLinks.classList.remove("active");
                unlockScroll();
                // Scroll after menu closes so the transition doesn't block it
                const href = this.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        setTimeout(function() {
                            target.scrollIntoView({ behavior: 'smooth' });
                        }, 320);
                    }
                }
            });
        });
    }

    // Hide hero when "Shop" nav link or "Shop Best Sellers" CTA is clicked
    document.querySelectorAll('a[href="#products"]').forEach(link => {
        link.addEventListener('click', function() {
            const heroSection = document.querySelector('.hero');
            if (heroSection) heroSection.classList.add('hidden');
        });
    });
    
    var searchBtn = document.getElementById("searchBtn");
    var searchInput = document.getElementById("searchInput");
    if (searchBtn) searchBtn.onclick = function() {
        var dd = document.getElementById('searchAutocomplete');
        if (dd) dd.classList.remove('active');
        searchProducts();
    };
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            showAutocomplete(this.value.toLowerCase().trim());
        });
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowDown') { e.preventDefault(); navigateAutocomplete(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); navigateAutocomplete(-1); }
            else if (e.key === 'Enter') {
                e.preventDefault();
                var dd = document.getElementById('searchAutocomplete');
                if (dd) dd.classList.remove('active');
                searchProducts();
            } else if (e.key === 'Escape') {
                var dd = document.getElementById('searchAutocomplete');
                if (dd) dd.classList.remove('active');
            }
        });
        searchInput.addEventListener('blur', function() {
            setTimeout(function() {
                var dd = document.getElementById('searchAutocomplete');
                if (dd) dd.classList.remove('active');
            }, 150);
        });
    }

    // Price sort arrow buttons
    var sortAscBtn = document.getElementById('sortPriceAsc');
    var sortDescBtn = document.getElementById('sortPriceDesc');
    function updateSortArrows() {
        if (sortAscBtn) sortAscBtn.classList.toggle('active', activeSort === 'price-asc');
        if (sortDescBtn) sortDescBtn.classList.toggle('active', activeSort === 'price-desc');
    }
    if (sortAscBtn) {
        sortAscBtn.addEventListener('click', function() {
            activeSort = activeSort === 'price-asc' ? 'default' : 'price-asc';
            updateSortArrows();
            var term = document.getElementById('searchInput').value.trim();
            if (term) { searchProducts(); } else { loadProducts(selectedCategory); }
        });
    }
    if (sortDescBtn) {
        sortDescBtn.addEventListener('click', function() {
            activeSort = activeSort === 'price-desc' ? 'default' : 'price-desc';
            updateSortArrows();
            var term = document.getElementById('searchInput').value.trim();
            if (term) { searchProducts(); } else { loadProducts(selectedCategory); }
        });
    }
    var cartIcon = document.getElementById("cartIcon");
    var closeCartBtn = document.getElementById("closeCart");
    var mobileCartIcon = document.getElementById("mobileCartIcon");
    if (cartIcon) cartIcon.onclick = toggleCart;
    if (closeCartBtn) closeCartBtn.onclick = toggleCart;
    if (mobileCartIcon) mobileCartIcon.onclick = toggleCart;
    var policyModal = document.getElementById("policyModal");
    if (policyModal) policyModal.onclick = (e) => {
        if (e.target.id === "policyModal") {
            closePolicy();
        }
    };
    
    const bottomHomeBtn = document.getElementById("bottomHomeBtn");
    const bottomCartBtn = document.getElementById("bottomCartBtn");
    const bottomMenuBtn = document.getElementById("bottomMenuBtn");
    
    if (bottomHomeBtn) {
        bottomHomeBtn.classList.add("home-active");

        const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');

        if (isIndexPage) {
            bottomHomeBtn.onclick = function() {
                // If cart is open, just close it
                const cartSidebar = document.getElementById("cartSidebar");
                if (cartSidebar && cartSidebar.classList.contains("active")) {
                    cartSidebar.classList.remove("active");
                    if (bottomCartBtn) bottomCartBtn.classList.remove("cart-active");
                    unlockScroll();
                    upsellUsed = false;
                    savedUpsellProducts = null;
                    return;
                }
                closeMobileMenu();
                bottomHomeBtn.classList.add("home-active");
                window.scrollTo({top: 0, behavior: 'smooth'});
            };
        } else {
            bottomHomeBtn.onclick = function() {
                // If cart is open, just close it
                const cartSidebar = document.getElementById("cartSidebar");
                if (cartSidebar && cartSidebar.classList.contains("active")) {
                    cartSidebar.classList.remove("active");
                    if (bottomCartBtn) bottomCartBtn.classList.remove("cart-active");
                    unlockScroll();
                    upsellUsed = false;
                    savedUpsellProducts = null;
                    return;
                }
                window.location.href = 'index.html';
            };
        }
    }
    
    if (bottomCartBtn) {
        bottomCartBtn.onclick = toggleCart;
    }
    
    if (bottomMenuBtn) {
        bottomMenuBtn.onclick = function() {
            const cartSidebar = document.getElementById("cartSidebar");
            if (cartSidebar.classList.contains("active")) {
                cartSidebar.classList.remove("active");
                if (bottomCartBtn) bottomCartBtn.classList.remove("cart-active");
                unlockScroll();
                upsellUsed = false;
                savedUpsellProducts = null;
            }
            toggleMobileMenu();
        };
    }
    
    // Handle account button in bottom nav
    const bottomAccountBtn = document.getElementById("bottomAccountBtn");
    if (bottomAccountBtn) {
        bottomAccountBtn.onclick = function() {
            const token = localStorage.getItem('orlo_token') || sessionStorage.getItem('orlo_token');
            if (token) {
                window.location.href = 'account.html';
            } else {
                window.location.href = 'login.html';
            }
        };
    }
};

async function checkout() {
    const btn = document.getElementById("stripeBtnGuest") || document.getElementById("stripeBtn");
    const originalText = btn ? btn.innerHTML : "Pay by Card";
    
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = "Checking stock...";
        }

        // GA4: track begin_checkout event with eventCallback to ensure tag fires
        const cartWithPricing = calculateTierPricing(cart);
        const checkoutValue = cartWithPricing.reduce((s, i) => s + (i._tierPrice || i.price) * i.quantity, 0);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ ecommerce: null });
        const gtmDone = new Promise(resolve => {
            window.dataLayer.push({
                event: 'begin_checkout',
                ecommerce: {
                    currency: 'AED',
                    value: checkoutValue,
                    items: cart.map(i => ({ item_id: i.id, item_name: i.name, price: i._tierPrice || i.price, quantity: i.quantity }))
                },
                eventCallback: resolve,
                eventTimeout: 2000
            });
        });

        // Meta Pixel: track InitiateCheckout event
        if (typeof fbq === 'function') {
            const cartWithPricingFb = calculateTierPricing(cart);
            const checkoutValueFb = cartWithPricingFb.reduce((s, i) => s + (i._tierPrice || i.price) * i.quantity, 0);
            fbq('track', 'InitiateCheckout', {
                content_ids: cart.map(i => i.slug),
                content_type: 'product',
                num_items: cart.reduce((s, i) => s + i.quantity, 0),
                value: checkoutValueFb,
                currency: 'AED'
            });
        }

        // TikTok Pixel: track InitiateCheckout event
        if (typeof ttq !== 'undefined') {
            const cartWithPricingTt = calculateTierPricing(cart);
            const checkoutValueTt = cartWithPricingTt.reduce((s, i) => s + (i._tierPrice || i.price) * i.quantity, 0);
            ttq.track('InitiateCheckout', {
                content_type: 'product',
                value: checkoutValueTt,
                currency: 'AED',
                quantity: cart.reduce((s, i) => s + i.quantity, 0)
            });
        }

        // Use relative URL (same domain)
        const token = localStorage.getItem('orlo_token') || sessionStorage.getItem('orlo_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Run Stripe fetch in parallel with GTM — wait for both before redirecting
        const [, response] = await Promise.all([
            gtmDone,
            fetch('/checkout', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    cart: cart,
                    deliveryZoneKey: selectedDeliveryZone
                }),
            })
        ]);

        const data = await response.json();

        if (data.error) {
            // Handle stock errors
            if (data.error === 'out_of_stock') {
                orloToast('error', 'Out of Stock', data.message);
                // Refresh products to get updated stock
                if (typeof initProducts === 'function') {
                    initProducts();
                }
            } else if (data.error === 'insufficient_stock') {
                let msg = '';
                data.items.forEach(item => {
                    msg += item.name + ': Only ' + item.available + ' available (you wanted ' + item.requested + ')\n';
                });
                orloToast('error', 'Stock Issue', msg);
            } else {
                orloToast('error', 'Payment Failed', data.message || 'Payment failed. Please try again.');
            }

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
            return;
        }

        if (data.url) {
            sessionStorage.setItem('orlo_checkout_pending', '1');
            // Backup cart to sessionStorage so success page can display order summary
            // even if localStorage cart is cleared during Stripe redirect
            try { sessionStorage.setItem('orlo_cart_backup', localStorage.getItem('cart') || '[]'); } catch(e) {}
            // Hide page + replace history entry so browser back goes to cancel.html, not product page
            document.documentElement.style.visibility = 'hidden';
            try { history.replaceState(null, '', 'cancel.html'); } catch(e) {}
            window.location.href = data.url;
        } else {
            throw new Error('No URL');
        }

    } catch (err) {
        console.error("Payment Error:", err);
        orloToast('error', 'Payment System Busy', 'Our payment system is syncing. Please wait a moment and try again.');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}
