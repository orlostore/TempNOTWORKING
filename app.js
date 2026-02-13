const WHATSAPP_NUMBER = "971XXXXXXXXX"; 

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
    shipping: `<h2>Shipping & Delivery</h2><h2 class="arabic-heading">الشحن والتوصيل</h2><p><strong>Coverage:</strong> We currently deliver within the UAE only.</p><p class="arabic-text"><strong>التغطية:</strong> نقوم حالياً بالتوصيل داخل الإمارات العربية المتحدة فقط.</p><p><strong>Processing Time:</strong> Orders are processed within 24–48 hours of payment confirmation.</p><p class="arabic-text"><strong>وقت المعالجة:</strong> يتم معالجة الطلبات خلال ٢٤-٤٨ ساعة من تأكيد الدفع.</p><p><strong>Delivery Timeline:</strong> 2-5 business days for all locations.</p><p class="arabic-text"><strong>مدة التوصيل:</strong> ٢-٥ أيام عمل لجميع المواقع.</p><p><strong>Delivery Fees:</strong></p><p class="arabic-text"><strong>رسوم التوصيل:</strong></p><ul><li><strong>All UAE:</strong> 18 AED (FREE on orders over ${FREE_DELIVERY_THRESHOLD} AED)</li><li class="arabic-text"><strong>جميع أنحاء الإمارات:</strong> ١٨ درهم (مجاناً للطلبات فوق ${FREE_DELIVERY_THRESHOLD} درهم)</li></ul><p><strong>Tracking:</strong> You will receive tracking information via WhatsApp once your order ships.</p><p class="arabic-text"><strong>التتبع:</strong> ستتلقى معلومات التتبع عبر واتساب بمجرد شحن طلبك.</p>`,
    returns: `<h2>Returns & Refunds</h2><h2 class="arabic-heading">الإرجاع والاسترداد</h2><p><strong>7-Day Return Window:</strong> Returns are accepted within 7 days of delivery only. No exceptions.</p><p class="arabic-text"><strong>فترة الإرجاع ٧ أيام:</strong> يتم قبول المرتجعات خلال ٧ أيام من التسليم فقط. بدون استثناءات.</p><p><strong>Unopened Items Only:</strong> Items must be completely unused, unopened, and in original sealed packaging with all tags and seals intact.</p><p class="arabic-text"><strong>المنتجات غير المفتوحة فقط:</strong> يجب أن تكون المنتجات غير مستخدمة تماماً، غير مفتوحة، وفي العبوة الأصلية المغلقة مع جميع الملصقات والأختام سليمة.</p><p><strong>No Returns on Opened Items:</strong> Once opened, used, or packaging is damaged, items cannot be returned for any reason.</p><p class="arabic-text"><strong>لا إرجاع للمنتجات المفتوحة:</strong> بمجرد الفتح أو الاستخدام أو تلف العبوة، لا يمكن إرجاع المنتجات لأي سبب.</p><p><strong>Return Shipping Costs:</strong> All return shipping costs are the buyer's responsibility. We do not provide prepaid return labels.</p><p class="arabic-text"><strong>تكاليف شحن الإرجاع:</strong> جميع تكاليف شحن الإرجاع على عاتق المشتري. لا نوفر ملصقات إرجاع مدفوعة مسبقاً.</p><p><strong>Inspection Required:</strong> All returns are inspected upon receipt. Items showing any signs of use, missing components, or damaged packaging will be rejected.</p><p class="arabic-text"><strong>الفحص مطلوب:</strong> يتم فحص جميع المرتجعات عند الاستلام. سيتم رفض المنتجات التي تظهر أي علامات استخدام أو مكونات مفقودة أو عبوة تالفة.</p><p><strong>Refund Process:</strong> Refunds are issued only after inspection confirms the item is unopened and undamaged. Processing takes 5-7 business days after we receive the return.</p><p class="arabic-text"><strong>عملية الاسترداد:</strong> يتم إصدار المبالغ المستردة فقط بعد أن يؤكد الفحص أن المنتج غير مفتوح وغير تالف. تستغرق المعالجة ٥-٧ أيام عمل بعد استلام الإرجاع.</p><p><strong>Non-Returnable Items:</strong> Sale items, clearance items, items with damaged packaging, or items showing any signs of use are not eligible for return.</p><p class="arabic-text"><strong>المنتجات غير القابلة للإرجاع:</strong> منتجات التخفيض، منتجات التصفية، المنتجات ذات العبوة التالفة، أو المنتجات التي تظهر أي علامات استخدام غير مؤهلة للإرجاع.</p><p><strong>How to Initiate a Return:</strong> Contact us via WhatsApp or email within 7 days of delivery with your order number and reason for return.</p><p class="arabic-text"><strong>كيفية بدء الإرجاع:</strong> اتصل بنا عبر واتساب أو البريد الإلكتروني خلال ٧ أيام من التسليم مع رقم طلبك وسبب الإرجاع.</p>`,
    privacy: `<h2>Privacy Policy</h2><h2 class="arabic-heading">سياسة الخصوصية</h2><p><strong>Information Collection:</strong> We collect only the information necessary to process and fulfill your order (name, phone number, delivery address, email).</p><p class="arabic-text"><strong>جمع المعلومات:</strong> نجمع فقط المعلومات الضرورية لمعالجة وتنفيذ طلبك (الاسم، رقم الهاتف، عنوان التوصيل، البريد الإلكتروني).</p><p><strong>Data Usage:</strong> Your information is used solely for order processing, delivery coordination, and customer support.</p><p class="arabic-text"><strong>استخدام البيانات:</strong> تُستخدم معلوماتك فقط لمعالجة الطلبات، وتنسيق التوصيل، ودعم العملاء.</p><p><strong>Third-Party Sharing:</strong> Your data is never sold or shared with third parties except for delivery partners who need your address to complete delivery.</p><p class="arabic-text"><strong>المشاركة مع أطراف ثالثة:</strong> لا يتم بيع بياناتك أو مشاركتها مع أطراف ثالثة أبداً باستثناء شركاء التوصيل الذين يحتاجون إلى عنوانك لإتمام التوصيل.</p><p><strong>Data Security:</strong> We use secure communication channels (WhatsApp, encrypted email) to protect your information.</p><p class="arabic-text"><strong>أمن البيانات:</strong> نستخدم قنوات اتصال آمنة (واتساب، بريد إلكتروني مشفر) لحماية معلوماتك.</p><p><strong>Your Rights:</strong> You may request deletion of your data at any time by contacting us.</p><p class="arabic-text"><strong>حقوقك:</strong> يمكنك طلب حذف بياناتك في أي وقت عن طريق الاتصال بنا.</p>`,
    terms: `<h2>Terms of Service</h2><h2 class="arabic-heading">شروط الخدمة</h2><p><strong>Order Agreement:</strong> By placing an order, you agree to provide accurate information and accept these terms.</p><p class="arabic-text"><strong>اتفاقية الطلب:</strong> بتقديم طلب، فإنك توافق على تقديم معلومات دقيقة وقبول هذه الشروط.</p><p><strong>Payment:</strong> Full payment is required before order processing begins. We accept bank transfer and online payment methods.</p><p class="arabic-text"><strong>الدفع:</strong> يلزم الدفع الكامل قبل بدء معالجة الطلب. نقبل التحويل البنكي وطرق الدفع الإلكتروني.</p><p><strong>Product Accuracy:</strong> We strive to display accurate product information and images. Actual products may vary slightly from images shown.</p><p class="arabic-text"><strong>دقة المنتج:</strong> نسعى لعرض معلومات وصور المنتج بدقة. قد تختلف المنتجات الفعلية قليلاً عن الصور المعروضة.</p><p><strong>Right to Refuse Service:</strong> ORLO reserves the right to refuse or cancel any order if fraud, misuse, or policy violations are detected.</p><p class="arabic-text"><strong>الحق في رفض الخدمة:</strong> تحتفظ أورلو بالحق في رفض أو إلغاء أي طلب في حالة اكتشاف احتيال أو إساءة استخدام أو انتهاكات للسياسة.</p><p><strong>Liability:</strong> ORLO is not responsible for delivery delays caused by courier services, incorrect addresses provided by customers, or force majeure events.</p><p class="arabic-text"><strong>المسؤولية:</strong> أورلو غير مسؤولة عن تأخيرات التوصيل الناتجة عن خدمات التوصيل، أو العناوين غير الصحيحة المقدمة من العملاء، أو أحداث القوة القاهرة.</p><p><strong>Changes to Terms:</strong> We reserve the right to update these terms at any time. Continued use of our service constitutes acceptance of updated terms.</p><p class="arabic-text"><strong>التغييرات على الشروط:</strong> نحتفظ بالحق في تحديث هذه الشروط في أي وقت. الاستخدام المستمر لخدمتنا يشكل قبولاً للشروط المحدثة.</p><p><strong>Contact:</strong> For questions about these terms, contact us at info@orlostore.com</p><p class="arabic-text"><strong>الاتصال:</strong> للاستفسارات حول هذه الشروط، اتصل بنا على info@orlostore.com</p>`
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
            btn.innerHTML = `${SVG_CARD} Pay with Card | الدفع بالبطاقة`;
        }
    }
});

function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }
function saveDeliveryZone() { localStorage.setItem("deliveryZone", selectedDeliveryZone); }
function getCategories() { return ["All Products", ...new Set(products.map(p => p.category))]; }

// Update all cart count displays
function updateCartCounts() {
    const localCart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalItems = localCart.reduce((s, i) => s + i.quantity, 0);
    
    const cartCount = document.getElementById("cartCount");
    const bottomCartCount = document.getElementById("bottomCartCount");
    const mobileCartCount = document.getElementById("mobileCartCount");
    
    if (cartCount) cartCount.textContent = totalItems;
    if (bottomCartCount) bottomCartCount.textContent = totalItems;
    if (mobileCartCount) mobileCartCount.textContent = totalItems;
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
            container.outerHTML = `<button class="add-to-cart" onclick="addToCart(${productId}, event)">Add to Cart | أضف إلى السلة</button>`;
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
function generateOrderNumber() { const date = new Date(); const year = date.getFullYear().toString().slice(-2); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0'); const random = Math.floor(Math.random() * 9000) + 1000; return `ORLO-${year}${month}${day}-${random}`; }

function getCategoryArabic(category) {
    if (category === "All Products") return "جميع المنتجات";
    const product = products.find(p => p.category === category);
    return product && product.categoryAr ? product.categoryAr : '';
}

function renderProducts(list) { 
    const grid = document.getElementById("productsGrid"); 
    if (!list.length) { 
        grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#999;padding:3rem;">No products found</p>`; 
        return; 
    }
    
    // Get current cart state
    const localCart = JSON.parse(localStorage.getItem("cart")) || [];
    
    grid.innerHTML = list.map(p => {
        const isUrl = p.image && p.image.startsWith('http');
        const imageHTML = isUrl 
            ? `<img src="${p.image}" alt="${p.name}" style="max-width:100%; max-height:100%; object-fit:contain;">` 
            : p.image;
        
        // Check if out of stock
        const outOfStock = p.quantity === 0;
        const cartItem = localCart.find(i => i.id === p.id);
        const inCart = cartItem && cartItem.quantity > 0;
        
        let buttonHTML;
        if (outOfStock) {
            buttonHTML = `<button class="add-to-cart" disabled style="background:#999;cursor:not-allowed;">Out of Stock | نفذ المخزون</button>`;
        } else if (inCart) {
            // Show qty stepper
            buttonHTML = `
                <div class="grid-qty-control" id="gridQty-${p.id}">
                    <button class="grid-qty-btn" onclick="gridQtyChange(${p.id}, -1, event)">−</button>
                    <span class="grid-qty-display" id="gridQtyNum-${p.id}">${cartItem.quantity}</span>
                    <button class="grid-qty-btn" onclick="gridQtyChange(${p.id}, 1, event)">+</button>
                </div>
            `;
        } else {
            buttonHTML = `<button class="add-to-cart" onclick="addToCart(${p.id}, event)">Add to Cart | أضف إلى السلة</button>`;
        }
        
        return `
        <div class="product-card ${outOfStock ? 'out-of-stock' : ''}">
            ${p.featured ? `<span class="badge">Best Seller</span>` : ""}
            ${outOfStock ? `<span class="badge out-of-stock-badge">Out of Stock</span>` : ""}
            <a href="product.html?product=${p.slug}" style="text-decoration:none;">
                <div class="product-image">${imageHTML}</div>
            </a>
            <div class="product-info">
                <a href="product.html?product=${p.slug}" style="text-decoration:none; color:inherit;">
                    <h3 class="product-title">${p.name}</h3>
                    ${p.nameAr ? `<p class="product-title-ar">${p.nameAr}</p>` : ''}
                </a>
                <div class="product-price">AED ${p.price}</div>
                ${buttonHTML}
            </div>
        </div>
    `}).join(""); 
}

function loadProducts(category = "All Products") { 
    selectedCategory = category; 
    const list = category === "All Products" ? products : products.filter(p => p.category === category); 
    renderProducts(list); 
    updateCategoryButtons(); 
    const heroSection = document.querySelector(".hero"); 
    const searchInput = document.getElementById("searchInput"); 
    if (heroSection && (!searchInput || !searchInput.value.trim())) { 
        heroSection.classList.remove("hidden"); 
    } 
}

function createCategoryFilters() { 
    const container = document.getElementById("categoryFilters"); 
    container.innerHTML = getCategories().map(cat => {
        const catAr = getCategoryArabic(cat);
        return `<button class="category-btn ${cat === selectedCategory ? "active" : ""}" onclick="loadProducts('${cat}')">${cat}${catAr ? `<br><span class="arabic-text category-arabic">${catAr}</span>` : ''}</button>`;
    }).join(""); 
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

function searchProducts() { 
    const term = document.getElementById("searchInput").value.toLowerCase().trim(); 
    const heroSection = document.querySelector(".hero"); 
    if (!term) { 
        loadProducts(selectedCategory); 
        if (heroSection) heroSection.classList.remove("hidden"); 
        return; 
    } 
    if (heroSection) heroSection.classList.add("hidden"); 
    const scoped = selectedCategory === "All Products" ? products : products.filter(p => p.category === selectedCategory); 
    const results = scoped.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term) || p.category.toLowerCase().includes(term)); 
    renderProducts(results); 
}

function addToCart(id, event) { 
    if (event) event.stopPropagation();
    
    const product = products.find(p => p.id === id);
    
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
    
    // Transform button to qty stepper
    const btn = event ? event.target : null;
    if (btn && btn.classList.contains('add-to-cart')) {
        const qty = cart.find(i => i.id === id)?.quantity || 1;
        btn.outerHTML = `
            <div class="grid-qty-control" id="gridQty-${id}">
                <button class="grid-qty-btn" onclick="gridQtyChange(${id}, -1, event)">−</button>
                <span class="grid-qty-display" id="gridQtyNum-${id}">${qty}</span>
                <button class="grid-qty-btn" onclick="gridQtyChange(${id}, 1, event)">+</button>
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
        cartFooter.innerHTML = `<div style="display: flex; justify-content: space-between; padding: 0.75rem 0 0.5rem; font-size: 1.1rem; font-weight: 700; color: #2c4a5c;"><span>Total | الإجمالي:</span><span>AED 0.00</span></div>`;
        if (cartCheckoutFixed) cartCheckoutFixed.innerHTML = '';
        return; 
    } 
    
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0); 
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0); 
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
                style="width: 100%; padding: 0.9rem; font-size: 0.95rem; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; background: #2c4a5c; color: white; transition: all 0.3s;" 
                onclick="checkout()" 
                onmouseover="this.style.background='#1e3545'" 
                onmouseout="this.style.background='#2c4a5c'">
                ${SVG_CARD} Pay with Card | الدفع بالبطاقة
            </button>
        `;
    } else {
        checkoutBtnHTML = `
            <div style="border-radius: 9px; overflow: hidden; box-shadow: 0 3px 10px rgba(44,74,92,0.15);">
                <div style="background: linear-gradient(135deg, #2c4a5c, #1e3545); color: white; text-align: center; padding: 10px 10px; font-size: 0.78rem; font-weight: 600; display:flex; align-items:center; justify-content:center; gap:5px;">
                    ${SVG_CARD} Pay with Card | <span style="font-family: 'Almarai', sans-serif; font-size: 0.72rem; opacity: 0.85;">الدفع بالبطاقة</span>
                </div>
                <div style="display: flex; align-items: center; background: #3d6178; padding: 6px 12px 12px;">
                    <button id="stripeBtn" onclick="window.location.href='login.html?redirect='+encodeURIComponent(window.location.href.split('?')[0]+'?openCart=true')" 
                        style="flex: 1; padding: 10px 5px; border: none; font-family: 'Inter', sans-serif; font-size: 0.72rem; font-weight: 600; cursor: pointer; text-align: center; background: transparent; color: white; border-radius: 4px; transition: all 0.2s;"
                        onmouseover="this.style.background='rgba(255,255,255,0.1)'"
                        onmouseout="this.style.background='transparent'">
                        ${SVG_LOCK_SM} Sign in<span style="font-family: 'Almarai', sans-serif; font-size: 0.64rem; display: block; opacity: 0.8;">تسجيل الدخول</span>
                    </button>
                    <div style="width: 1px; height: 30px; background: rgba(255,255,255,0.2); flex-shrink: 0;"></div>
                    <button id="stripeBtnGuest" onclick="checkout()" 
                        style="flex: 1; padding: 10px 5px; border: none; font-family: 'Inter', sans-serif; font-size: 0.72rem; font-weight: 600; cursor: pointer; text-align: center; background: transparent; color: white; border-radius: 4px; transition: all 0.2s;"
                        onmouseover="this.style.background='rgba(255,255,255,0.1)'"
                        onmouseout="this.style.background='transparent'">
                        ${SVG_PERSON} As Guest<span style="font-family: 'Almarai', sans-serif; font-size: 0.64rem; display: block; opacity: 0.8;">كضيف</span>
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
    
    cartItems.innerHTML = cart.map(i => `
        <div id="cartItem-${i.id}" style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem; border-bottom:1px solid #eee; position:relative;">
            <div style="flex:1;">
                <strong style="font-size:0.9rem; color:#2c4a5c;">${i.name}</strong><br>
                <span style="color:#888; font-size:0.8rem;">AED ${i.price} × ${i.quantity}</span><br>
                <span style="color:#e07856; font-weight:600; font-size:0.9rem;">AED ${(i.price * i.quantity).toFixed(2)}</span>
            </div>
            <div style="display:flex; gap:0.4rem; align-items:center;">
                <button onclick="updateQuantity(${i.id}, -1)" style="padding:0.3rem 0.6rem; background:#f0f0f0; border:none; border-radius:4px; cursor:pointer; font-size:0.85rem; font-weight:600;">-</button>
                <span style="font-size:0.9rem; font-weight:600; min-width:20px; text-align:center;">${i.quantity}</span>
                <button onclick="updateQuantity(${i.id}, 1)" style="padding:0.3rem 0.6rem; background:#f0f0f0; border:none; border-radius:4px; cursor:pointer; font-size:0.85rem; font-weight:600;">+</button>
                <button onclick="removeFromCart(${i.id})" style="padding:0.3rem 0.6rem; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer; margin-left:0.3rem; font-size:0.85rem;">${SVG_CLOSE_CART}</button>
            </div>
        </div>
    `).join(""); 
    
    let footerHTML = '';
    
    const amountNeededForFree = FREE_DELIVERY_THRESHOLD - subtotal;
    const showUpsell = subtotal < FREE_DELIVERY_THRESHOLD && !(isMobile && upsellUsed);
    
    if (showUpsell) {
        const cartProductIds = cart.map(i => i.id);
        
        // Filter out-of-stock items from upsell
        const upsellProducts = products
            .filter(p => !cartProductIds.includes(p.id))
            .filter(p => p.quantity > 0) // Only in-stock items
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
                                <div style="font-size: 0.75rem; color: #888; white-space: nowrap;">AED ${p.price}</div>
                                <button onclick="addUpsellItem(${p.id}, event)" style="padding: 0.25rem 0.5rem; background: #2c4a5c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Add</button>
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
                                        <div style="font-size: 0.75rem; color: #888; white-space: nowrap;">AED ${p.price}</div>
                                        <button onclick="event.stopPropagation(); addUpsellItem(${p.id}, event)" style="padding: 0.25rem 0.5rem; background: #2c4a5c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Add</button>
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
    
    footerHTML += `
        <div style="padding: 0.6rem 1rem; background: #f8f9fa; border-radius: 8px; margin-bottom: 0.5rem;">
            <div style="display: flex; justify-content: space-between; padding: 0.2rem 0; font-size: 0.9rem; color: #2c4a5c;">
                <span>Subtotal | المجموع الفرعي:</span>
                <span>AED ${subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.2rem 0; font-size: 0.9rem; color: #2c4a5c;">
                <span>Delivery | التوصيل:</span>
                <span style="${deliveryFee === 0 ? 'color: #28a745; font-weight: 600;' : ''}">${deliveryFee === 0 ? 'FREE | مجاني' : 'AED ' + deliveryFee.toFixed(2)}</span>
            </div>
            <div style="border-top: 2px solid #ddd; margin: 0.3rem 0;"></div>
            <div style="display: flex; justify-content: space-between; padding: 0.4rem 0 0.2rem; font-size: 1.1rem; font-weight: 700; color: #2c4a5c;">
                <span>Total | الإجمالي:</span>
                <span>AED ${total.toFixed(2)}</span>
            </div>
        </div>
    `;
    
    if (!isMobile) {
        footerHTML += `
            <div style="padding: 0 1rem 0.75rem;">
                ${checkoutBtnHTML}
            </div>
        `;
    }
    
    cartFooter.innerHTML = footerHTML;
}

function changeDeliveryZone(zone) { 
    selectedDeliveryZone = zone; 
    saveDeliveryZone(); 
    updateCart(); 
}

function updateQuantity(id, change) { 
    const item = cart.find(i => i.id === id);
    const product = products.find(p => p.id === id);
    
    if (item) { 
        const newQty = item.quantity + change;
        
        // Cap at 10 OR available stock (whichever is lower)
        if (change > 0) {
            const maxAllowed = Math.min(MAX_QTY_PER_PRODUCT, product ? product.quantity : MAX_QTY_PER_PRODUCT);
            if (newQty > maxAllowed) {
                showCartLimitMessage(id, maxAllowed);
                return;
            }
        }
        
        item.quantity = newQty;
        if (item.quantity <= 0) { 
            removeFromCart(id); 
        } else { 
            saveCart(); 
            updateCart();
            // Sync product page stepper
            const qtyDisplay = document.getElementById(`qtyDisplay-${id}`);
            if (qtyDisplay) qtyDisplay.textContent = newQty;
            // ADD THIS LINE TO SYNC CART PAGE COUNT WITH INDEX PAGE COUNT OF PRODUCTS:
            const gridQtyNum = document.getElementById(`gridQtyNum-${id}`);
            if (gridQtyNum) gridQtyNum.textContent = newQty;
        } 
    } 
}

// Show limit message inside cart sidebar for a specific item (Option B - inline red text)
function showCartLimitMessage(productId, maxAllowed) {
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
    
    const cartItem = document.getElementById(`cartItem-${productId}`);
    if (!cartItem) return;
    
    // Shake the + button
    const plusBtn = cartItem.querySelectorAll('button')[1];
    if (plusBtn) {
        plusBtn.style.animation = 'none';
        plusBtn.offsetHeight;
        plusBtn.style.animation = 'cartQtyShake 0.4s ease';
    }
    
    // Find the info div (first child div) and append inline message
    const infoDiv = cartItem.querySelector('div');
    if (!infoDiv) return;
    
    const msg = document.createElement('div');
    msg.id = 'cartLimitMsg';
    msg.className = 'cart-limit-msg-inline';
    msg.innerHTML = `${messageEn} <span class="cart-limit-ar-inline">${messageAr}</span>`;
    
    infoDiv.appendChild(msg);
    
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

function removeFromCart(id) { 
    cart = cart.filter(i => i.id !== id); 
    upsellUsed = false;
    saveCart(); 
    updateCart();
    
    // Reset grid button if visible
    const gridQty = document.getElementById(`gridQty-${id}`);
    if (gridQty) {
        gridQty.outerHTML = `<button class="add-to-cart" onclick="addToCart(${id}, event)">Add to Cart | أضف إلى السلة</button>`;
    }
    
    // Reset product page button if visible
    if (typeof resetToAddButton === 'function') {
        resetToAddButton(id);
    }
}

function toggleCart() { 
    const cartSidebar = document.getElementById("cartSidebar");
    const bottomCartBtn = document.getElementById("bottomCartBtn");
    const bottomHomeBtn = document.getElementById("bottomHomeBtn");
    
    cartSidebar.classList.toggle("active");
    
    if (cartSidebar.classList.contains("active")) {
        if (bottomCartBtn) bottomCartBtn.classList.add("cart-active");
        if (bottomHomeBtn) bottomHomeBtn.classList.remove("home-active");
    } else {
        if (bottomCartBtn) bottomCartBtn.classList.remove("cart-active");
        if (bottomHomeBtn) bottomHomeBtn.classList.add("home-active");
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
    document.body.style.overflow = "hidden"; 
}

function closePolicy() { 
    document.getElementById("policyModal").style.display = "none"; 
    document.body.style.overflow = "auto"; 
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
        overlay.innerHTML = `
            <div class="mobile-menu">
                <a href="#products" onclick="closeMobileMenu()">
                    <div class="menu-icon-box"><svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></svg></div>
                    <div class="menu-text"><span class="menu-en">Shop</span><span class="menu-ar">تسوق</span></div>
                    ${chevron}
                </a>
                <a href="#about" onclick="closeMobileMenu()">
                    <div class="menu-icon-box"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></div>
                    <div class="menu-text"><span class="menu-en">About</span><span class="menu-ar">من نحن</span></div>
                    ${chevron}
                </a>
                <a href="#contact" onclick="closeMobileMenu()">
                    <div class="menu-icon-box"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
                    <div class="menu-text"><span class="menu-en">Contact</span><span class="menu-ar">اتصل بنا</span></div>
                    ${chevron}
                </a>
                <a href="#terms" onclick="closeMobileMenu()">
                    <div class="menu-icon-box"><svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg></div>
                    <div class="menu-text"><span class="menu-en">Terms</span><span class="menu-ar">الشروط</span></div>
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
}

function closeMobileMenu() {
    const overlay = document.querySelector('.mobile-menu-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

window.onload = () => { 
    createCategoryFilters(); 
    loadProducts(); 
    updateCart(); 
    
    const urlParams = new URLSearchParams(window.location.search);
    
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
        });
        
        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", function() {
                hamburger.classList.remove("active");
                navLinks.classList.remove("active");
            });
        });
    }
    
    document.getElementById("searchBtn").onclick = searchProducts; 
    document.getElementById("searchInput").onkeypress = (e) => { 
        if (e.key === "Enter") { 
            e.preventDefault(); 
            searchProducts(); 
        } 
    }; 
    document.getElementById("cartIcon").onclick = toggleCart; 
    document.getElementById("closeCart").onclick = toggleCart; 
    document.getElementById("policyModal").onclick = (e) => { 
        if (e.target.id === "policyModal") { 
            closePolicy(); 
        } 
    };
    
    const bottomHomeBtn = document.getElementById("bottomHomeBtn");
    const bottomCartBtn = document.getElementById("bottomCartBtn");
    const bottomMenuBtn = document.getElementById("bottomMenuBtn");
    
    if (bottomHomeBtn) {
        bottomHomeBtn.classList.add("home-active");
        
        bottomHomeBtn.onclick = function() {
            const cartSidebar = document.getElementById("cartSidebar");
            if (cartSidebar.classList.contains("active")) {
                cartSidebar.classList.remove("active");
                if (bottomCartBtn) bottomCartBtn.classList.remove("cart-active");
                upsellUsed = false;
                savedUpsellProducts = null;
            }
            closeMobileMenu();
            bottomHomeBtn.classList.add("home-active");
            window.scrollTo({top: 0, behavior: 'smooth'});
        };
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
    const originalText = btn ? btn.innerHTML : "Pay with Card";
    
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = "Checking stock...";
        }

        // Use relative URL (same domain)
        const token = localStorage.getItem('orlo_token') || sessionStorage.getItem('orlo_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch('/checkout', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                cart: cart,
                deliveryZoneKey: selectedDeliveryZone
            }),
        });

        const data = await response.json();

        if (data.error) {
            // Handle stock errors
            if (data.error === 'out_of_stock') {
                alert(data.message);
                // Refresh products to get updated stock
                if (typeof initProducts === 'function') {
                    initProducts();
                }
            } else if (data.error === 'insufficient_stock') {
                let msg = 'Stock issue:\n';
                data.items.forEach(item => {
                    msg += `${item.name}: Only ${item.available} available (you wanted ${item.requested})\n`;
                });
                alert(msg);
            } else {
                alert(data.message || 'Payment failed. Please try again.');
            }
            
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
            return;
        }

        if (data.url) {
            window.location.href = data.url; 
        } else {
            throw new Error('No URL');
        }

    } catch (err) {
        console.error("Payment Error:", err);
        alert("Payment system is syncing. Please try again.");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}
