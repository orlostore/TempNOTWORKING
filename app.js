const WHATSAPP_NUMBER = "971XXXXXXXXX";

// === FREE DELIVERY THRESHOLD - Change this value to adjust ===
const FREE_DELIVERY_THRESHOLD = 75;

// === MAX QUANTITY PER PRODUCT ===
var MAX_QTY_PER_PRODUCT = MAX_QTY_PER_PRODUCT || 10;

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

function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }
function saveDeliveryZone() { localStorage.setItem("deliveryZone", selectedDeliveryZone); }
function getCategories() { return ["All Products", ...new Set(products.map(p => p.category))]; }
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
    grid.innerHTML = list.map(p => {
        const isUrl = p.image && p.image.startsWith('http');
        const imageHTML = isUrl 
            ? `<img src="${p.image}" alt="${p.name}" style="max-width:100%; max-height:100%; object-fit:contain;">` 
            : p.image;
        
        // Check if out of stock
        const outOfStock = p.quantity === 0;
        
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
                ${outOfStock 
                    ? `<button class="add-to-cart" disabled style="background:#999;cursor:not-allowed;">Out of Stock | نفذ المخزون</button>` 
                    : `<button class="add-to-cart" onclick="addToCart(${p.id}, event)">Add to Cart | أضف إلى السلة</button>`
                }
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
    const product = products.find(p => p.id === id);
    
    // Check stock
    if (product.quantity === 0) {
        return; // Silent - out of stock
    }
    
    const item = cart.find(i => i.id === id);
    const currentInCart = item ? item.quantity : 0;
    
    // Silent cap at 10 OR available stock (whichever is lower)
    const maxAllowed = Math.min(MAX_QTY_PER_PRODUCT, product.quantity);
    if (currentInCart >= maxAllowed) {
        return; // Silent - already at max
    }
    
    if (item) { 
        item.quantity++; 
    } else { 
        cart.push({ ...product, quantity: 1 }); 
    } 
    saveCart(); 
    updateCart(); 
    
    // Show grand popup
    showCartPopup(product);
}

function showCartPopup(product) {
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const productQty = cart.find(i => i.id === product.id)?.quantity || 1;
    
    // Get product image
    const isUrl = product.image && product.image.startsWith('http');
    const imageHTML = isUrl 
        ? `<img src="${product.image}" alt="${product.name}" style="width:100%; height:100%; object-fit:contain;">` 
        : `<span style="font-size:3rem;">${product.image || '📦'}</span>`;
    
    const popup = document.getElementById('cartPopup');
    const popupContent = document.getElementById('cartPopupContent');
    
    popupContent.innerHTML = `
        <div class="popup-top">
            <button class="popup-close-btn" onclick="closeCartPopup()">✕</button>
            <div class="popup-success-badge">✓ Success!</div>
            <div class="popup-title">Added to Cart</div>
            <div class="popup-title-ar">تمت الإضافة للسلة</div>
        </div>
        <div class="popup-product-float">
            <div class="popup-product-card">
                <div class="popup-product-image">${imageHTML}</div>
                <div class="popup-product-details">
                    <div class="popup-product-name">${product.name}</div>
                    ${product.nameAr ? `<div class="popup-product-name-ar">${product.nameAr}</div>` : ''}
                    <div class="popup-product-price">AED ${product.price}</div>
                </div>
            </div>
        </div>
        <div class="popup-bottom">
            <div class="popup-cart-summary">
                <span class="popup-summary-label">Cart Total (${cartCount} ${cartCount === 1 ? 'item' : 'items'}):</span>
                <span class="popup-summary-value">AED ${cartTotal.toFixed(2)}</span>
            </div>
            <div class="popup-buttons">
                <button class="popup-btn-view-cart" onclick="closeCartPopup(); toggleCart();">
                    🛒 View Cart | <span class="arabic-text">عرض السلة</span>
                </button>
                <button class="popup-btn-continue" onclick="closeCartPopup()">
                    Continue Shopping | <span class="arabic-text">متابعة التسوق</span>
                </button>
            </div>
        </div>
    `;
    
    popup.classList.add('active');
}

function closeCartPopup() {
    const popup = document.getElementById('cartPopup');
    popup.classList.remove('active');
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
        cartFooter.innerHTML = `<div style="display: flex; justify-content: space-between; padding: 0.75rem 0 0.5rem; font-size: 1.1rem; font-weight: 700; color: #2c4a5c;"><span>Total / الإجمالي:</span><span>AED 0.00</span></div>`;
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
    
    const checkoutBtnHTML = `
        <button id="stripeBtn" 
            style="width: 100%; padding: 0.9rem; font-size: 0.95rem; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; background: #2c4a5c; color: white; transition: all 0.3s;" 
            onclick="checkout()" 
            onmouseover="this.style.background='#1e3545'" 
            onmouseout="this.style.background='#2c4a5c'">
            💳 Pay with Card / الدفع بالبطاقة
        </button>
    `;
    
    if (isMobile && cartCheckoutFixed) {
        cartCheckoutFixed.innerHTML = checkoutBtnHTML;
    } else if (cartCheckoutFixed) {
        cartCheckoutFixed.innerHTML = '';
    }
    
    cartItems.innerHTML = cart.map(i => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem; border-bottom:1px solid #eee;">
            <div style="flex:1;">
                <strong style="font-size:0.9rem; color:#2c4a5c;">${i.name}</strong><br>
                <span style="color:#888; font-size:0.8rem;">AED ${i.price} × ${i.quantity}</span><br>
                <span style="color:#e07856; font-weight:600; font-size:0.9rem;">AED ${(i.price * i.quantity).toFixed(2)}</span>
            </div>
            <div style="display:flex; gap:0.4rem; align-items:center;">
                <button onclick="updateQuantity(${i.id}, -1)" style="padding:0.3rem 0.6rem; background:#f0f0f0; border:none; border-radius:4px; cursor:pointer; font-size:0.85rem; font-weight:600;">-</button>
                <span style="font-size:0.9rem; font-weight:600; min-width:20px; text-align:center;">${i.quantity}</span>
                <button onclick="updateQuantity(${i.id}, 1)" style="padding:0.3rem 0.6rem; background:#f0f0f0; border:none; border-radius:4px; cursor:pointer; font-size:0.85rem; font-weight:600;">+</button>
                <button onclick="removeFromCart(${i.id})" style="padding:0.3rem 0.6rem; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer; margin-left:0.3rem; font-size:0.85rem;">✕</button>
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
                        🚚 Add AED ${amountNeededForFree.toFixed(0)} more to qualify for free delivery
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
        <div style="padding: 1rem; background: #f8f9fa; border-radius: 8px; margin-bottom: 0.75rem;">
            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 0.9rem; color: #2c4a5c;">
                <span>Subtotal / المجموع الفرعي:</span>
                <span>AED ${subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 0.9rem; color: #2c4a5c;">
                <span>Delivery / التوصيل:</span>
                <span style="${deliveryFee === 0 ? 'color: #28a745; font-weight: 600;' : ''}">${deliveryFee === 0 ? 'FREE / مجاني' : 'AED ' + deliveryFee.toFixed(2)}</span>
            </div>
            <div style="border-top: 2px solid #ddd; margin: 0.5rem 0;"></div>
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 0 0.5rem; font-size: 1.1rem; font-weight: 700; color: #2c4a5c;">
                <span>Total / الإجمالي:</span>
                <span>AED ${total.toFixed(2)}</span>
            </div>
        </div>
    `;
    
    if (!isMobile) {
        footerHTML += `
            <div style="padding: 0 1rem 1rem;">
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
        
        // Silent cap at 10 OR available stock (whichever is lower)
        if (change > 0) {
            const maxAllowed = Math.min(MAX_QTY_PER_PRODUCT, product ? product.quantity : MAX_QTY_PER_PRODUCT);
            if (newQty > maxAllowed) {
                return; // Silent - already at max
            }
        }
        
        item.quantity = newQty;
        if (item.quantity <= 0) { 
            removeFromCart(id); 
        } else { 
            saveCart(); 
            updateCart(); 
        } 
    } 
}

function removeFromCart(id) { 
    cart = cart.filter(i => i.id !== id); 
    upsellUsed = false;
    saveCart(); 
    updateCart(); 
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
        overlay.innerHTML = `
            <div class="mobile-menu">
                <a href="#products" onclick="closeMobileMenu()"><span class="menu-en">🛍️ Shop</span> | <span class="menu-ar">تسوق</span></a>
                <a href="#about" onclick="closeMobileMenu()"><span class="menu-en">ℹ️ About</span> | <span class="menu-ar">من نحن</span></a>
                <a href="#contact" onclick="closeMobileMenu()"><span class="menu-en">📧 Contact</span> | <span class="menu-ar">اتصل بنا</span></a>
                <a href="#terms" onclick="closeMobileMenu()"><span class="menu-en">📋 Terms</span> | <span class="menu-ar">الشروط</span></a>
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
        promoBanner.innerHTML = `🚚 Free delivery over AED ${FREE_DELIVERY_THRESHOLD} | <span class="arabic-text">توصيل مجاني فوق ${FREE_DELIVERY_THRESHOLD} درهم</span>`;
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
};

async function checkout() {
    const btn = document.getElementById("stripeBtn");
    const originalText = btn ? btn.innerHTML : "Pay with Card";
    
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = "Checking stock...";
        }

        // Use relative URL (same domain)
        const response = await fetch('/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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


















































































































