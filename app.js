const WHATSAPP_NUMBER = "971XXXXXXXXX";

const deliveryZones = {
    dubai: {
        name: "Dubai",
        nameAr: "دبي",
        fee: 18,
        freeThreshold: 100
    },
    sharjah_ajman: {
        name: "Sharjah / Ajman",
        nameAr: "الشارقة / عجمان",
        fee: 18,
        freeThreshold: 100
    },
    abu_dhabi: {
        name: "Abu Dhabi",
        nameAr: "أبو ظبي",
        fee: 18,
        freeThreshold: 100
    },
    other: {
        name: "Other Emirates",
        nameAr: "إمارات أخرى",
        fee: 18,
        freeThreshold: 100
    }
};

const DELIVERY_TIME = "2-5 business days";
const DELIVERY_TIME_AR = "٢-٥ أيام عمل";

const policies = {
    shipping: `<h2>Shipping & Delivery</h2><h2 class="arabic-heading">الشحن والتوصيل</h2><p><strong>Coverage:</strong> We currently deliver within the UAE only.</p><p class="arabic-text"><strong>التغطية:</strong> نقوم حالياً بالتوصيل داخل الإمارات العربية المتحدة فقط.</p><p><strong>Processing Time:</strong> Orders are processed within 24–48 hours of payment confirmation.</p><p class="arabic-text"><strong>وقت المعالجة:</strong> يتم معالجة الطلبات خلال ٢٤-٤٨ ساعة من تأكيد الدفع.</p><p><strong>Delivery Timeline:</strong> 2-5 business days for all locations.</p><p class="arabic-text"><strong>مدة التوصيل:</strong> ٢-٥ أيام عمل لجميع المواقع.</p><p><strong>Delivery Fees:</strong></p><p class="arabic-text"><strong>رسوم التوصيل:</strong></p><ul><li><strong>All UAE:</strong> 18 AED (FREE on orders over 100 AED)</li><li class="arabic-text"><strong>جميع أنحاء الإمارات:</strong> ١٨ درهم (مجاناً للطلبات فوق ١٠٠ درهم)</li></ul><p><strong>Tracking:</strong> You will receive tracking information via WhatsApp once your order ships.</p><p class="arabic-text"><strong>التتبع:</strong> ستتلقى معلومات التتبع عبر واتساب بمجرد شحن طلبك.</p>`,
    returns: `<h2>Returns & Refunds</h2><h2 class="arabic-heading">الإرجاع والاسترداد</h2><p><strong>7-Day Return Window:</strong> Returns are accepted within 7 days of delivery only. No exceptions.</p><p class="arabic-text"><strong>فترة الإرجاع ٧ أيام:</strong> يتم قبول المرتجعات خلال ٧ أيام من التسليم فقط. بدون استثناءات.</p><p><strong>Unopened Items Only:</strong> Items must be completely unused, unopened, and in original sealed packaging with all tags and seals intact.</p><p class="arabic-text"><strong>المنتجات غير المفتوحة فقط:</strong> يجب أن تكون المنتجات غير مستخدمة تماماً، غير مفتوحة، وفي العبوة الأصلية المغلقة مع جميع الملصقات والأختام سليمة.</p><p><strong>No Returns on Opened Items:</strong> Once opened, used, or packaging is damaged, items cannot be returned for any reason.</p><p class="arabic-text"><strong>لا إرجاع للمنتجات المفتوحة:</strong> بمجرد الفتح أو الاستخدام أو تلف العبوة، لا يمكن إرجاع المنتجات لأي سبب.</p><p><strong>Return Shipping Costs:</strong> All return shipping costs are the buyer's responsibility. We do not provide prepaid return labels.</p><p class="arabic-text"><strong>تكاليف شحن الإرجاع:</strong> جميع تكاليف شحن الإرجاع على عاتق المشتري. لا نوفر ملصقات إرجاع مدفوعة مسبقاً.</p><p><strong>Inspection Required:</strong> All returns are inspected upon receipt. Items showing any signs of use, missing components, or damaged packaging will be rejected.</p><p class="arabic-text"><strong>الفحص مطلوب:</strong> يتم فحص جميع المرتجعات عند الاستلام. سيتم رفض المنتجات التي تظهر أي علامات استخدام أو مكونات مفقودة أو عبوة تالفة.</p><p><strong>Refund Process:</strong> Refunds are issued only after inspection confirms the item is unopened and undamaged. Processing takes 5-7 business days after we receive the return.</p><p class="arabic-text"><strong>عملية الاسترداد:</strong> يتم إصدار المبالغ المستردة فقط بعد أن يؤكد الفحص أن المنتج غير مفتوح وغير تالف. تستغرق المعالجة ٥-٧ أيام عمل بعد استلام الإرجاع.</p><p><strong>Non-Returnable Items:</strong> Sale items, clearance items, items with damaged packaging, or items showing any signs of use are not eligible for return.</p><p class="arabic-text"><strong>المنتجات غير القابلة للإرجاع:</strong> منتجات التخفيض، منتجات التصفية، المنتجات ذات العبوة التالفة، أو المنتجات التي تظهر أي علامات استخدام غير مؤهلة للإرجاع.</p><p><strong>How to Initiate a Return:</strong> Contact us via WhatsApp or email within 7 days of delivery with your order number and reason for return.</p><p class="arabic-text"><strong>كيفية بدء الإرجاع:</strong> اتصل بنا عبر واتساب أو البريد الإلكتروني خلال ٧ أيام من التسليم مع رقم طلبك وسبب الإرجاع.</p>`,
    privacy: `<h2>Privacy Policy</h2><h2 class="arabic-heading">سياسة الخصوصية</h2><p><strong>Information Collection:</strong> We collect only the information necessary to process and fulfill your order (name, phone number, delivery address, email).</p><p class="arabic-text"><strong>جمع المعلومات:</strong> نجمع فقط المعلومات الضرورية لمعالجة وتنفيذ طلبك (الاسم، رقم الهاتف، عنوان التوصيل، البريد الإلكتروني).</p><p><strong>Data Usage:</strong> Your information is used solely for order processing, delivery coordination, and customer support.</p><p class="arabic-text"><strong>استخدام البيانات:</strong> تُستخدم معلوماتك فقط لمعالجة الطلبات، وتنسيق التوصيل، ودعم العملاء.</p><p><strong>Third-Party Sharing:</strong> Your data is never sold or shared with third parties except for delivery partners who need your address to complete delivery.</p><p class="arabic-text"><strong>المشاركة مع أطراف ثالثة:</strong> لا يتم بيع بياناتك أو مشاركتها مع أطراف ثالثة أبداً باستثناء شركاء التوصيل الذين يحتاجون إلى عنوانك لإتمام التوصيل.</p><p><strong>Data Security:</strong> We use secure communication channels (WhatsApp, encrypted email) to protect your information.</p><p class="arabic-text"><strong>أمن البيانات:</strong> نستخدم قنوات اتصال آمنة (واتساب، بريد إلكتروني مشفر) لحماية معلوماتك.</p><p><strong>Your Rights:</strong> You may request deletion of your data at any time by contacting us.</p><p class="arabic-text"><strong>حقوقك:</strong> يمكنك طلب حذف بياناتك في أي وقت عن طريق الاتصال بنا.</p>`,
    terms: `<h2>Terms of Service</h2><h2 class="arabic-heading">شروط الخدمة</h2><p><strong>Order Agreement:</strong> By placing an order, you agree to provide accurate information and accept these terms.</p><p class="arabic-text"><strong>اتفاقية الطلب:</strong> بتقديم طلب، فإنك توافق على تقديم معلومات دقيقة وقبول هذه الشروط.</p><p><strong>Payment:</strong> Full payment is required before order processing begins. We accept bank transfer and online payment methods.</p><p class="arabic-text"><strong>الدفع:</strong> يلزم الدفع الكامل قبل بدء معالجة الطلب. نقبل التحويل البنكي وطرق الدفع الإلكتروني.</p><p><strong>Product Accuracy:</strong> We strive to display accurate product information and images. Actual products may vary slightly from images shown.</p><p class="arabic-text"><strong>دقة المنتج:</strong> نسعى لعرض معلومات وصور المنتج بدقة. قد تختلف المنتجات الفعلية قليلاً عن الصور المعروضة.</p><p><strong>Right to Refuse Service:</strong> ORLO reserves the right to refuse or cancel any order if fraud, misuse, or policy violations are detected.</p><p class="arabic-text"><strong>الحق في رفض الخدمة:</strong> تحتفظ أورلو بالحق في رفض أو إلغاء أي طلب في حالة اكتشاف احتيال أو إساءة استخدام أو انتهاكات للسياسة.</p><p><strong>Liability:</strong> ORLO is not responsible for delivery delays caused by courier services, incorrect addresses provided by customers, or force majeure events.</p><p class="arabic-text"><strong>المسؤولية:</strong> أورلو غير مسؤولة عن تأخيرات التوصيل الناتجة عن خدمات التوصيل، أو العناوين غير الصحيحة المقدمة من العملاء، أو أحداث القوة القاهرة.</p><p><strong>Changes to Terms:</strong> We reserve the right to update these terms at any time. Continued use of our service constitutes acceptance of updated terms.</p><p class="arabic-text"><strong>التغييرات على الشروط:</strong> نحتفظ بالحق في تحديث هذه الشروط في أي وقت. الاستخدام المستمر لخدمتنا يشكل قبولاً للشروط المحدثة.</p><p><strong>Contact:</strong> For questions about these terms, contact us at info@orlostore.com</p><p class="arabic-text"><strong>الاتصال:</strong> للاستفسارات حول هذه الشروط، اتصل بنا على info@orlostore.com</p>`
};

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let selectedCategory = "All Products";
let selectedDeliveryZone = localStorage.getItem("deliveryZone") || "dubai";

function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }
function saveDeliveryZone() { localStorage.setItem("deliveryZone", selectedDeliveryZone); }
function getCategories() { return ["All Products", ...new Set(products.map(p => p.category))]; }
function calculateDeliveryFee(subtotal) { const zone = deliveryZones[selectedDeliveryZone]; if (subtotal >= zone.freeThreshold) { return 0; } return zone.fee; }
function getAmountUntilFreeDelivery(subtotal) { const zone = deliveryZones[selectedDeliveryZone]; if (subtotal >= zone.freeThreshold) { return 0; } return zone.freeThreshold - subtotal; }
function generateOrderNumber() { const date = new Date(); const year = date.getFullYear().toString().slice(-2); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0'); const random = Math.floor(Math.random() * 9000) + 1000; return `ORLO-${year}${month}${day}-${random}`; }

function renderProducts(list) { 
    const grid = document.getElementById("productsGrid"); 
    if (!list.length) { 
        grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#999;padding:3rem;">No products found</p>`; 
        return; 
    } 
    grid.innerHTML = list.map(p => `
        <div class="product-card">
            ${p.featured ? `<span class="badge">Best Seller</span>` : ""}
            <a href="product.html?product=${p.slug}" style="text-decoration:none;">
                <div class="product-image">${p.image}</div>
            </a>
            <div class="product-info">
                <small>${p.category}</small>
                <a href="product.html?product=${p.slug}" style="text-decoration:none; color:inherit;">
                    <h3 class="product-title">${p.name}${p.nameAr ? `<br><span class="arabic-text" style="font-size:0.9rem;">${p.nameAr}</span>` : ''}</h3>
                </a>
                <p>${p.description}${p.descriptionAr ? `<br><span class="arabic-text" style="font-size:0.72rem;">${p.descriptionAr}</span>` : ''}</p>
                <div class="product-price">${p.price} AED</div>
                <button class="add-to-cart" onclick="addToCart(${p.id}, event)">Add to Cart</button>
            </div>
        </div>
    `).join(""); 
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
    container.innerHTML = getCategories().map(cat => `<button class="category-btn ${cat === selectedCategory ? "active" : ""}" onclick="loadProducts('${cat}')">${cat}<br><span class="arabic-text category-arabic">${categoryTranslations[cat]}</span></button>`).join(""); 
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
    const item = cart.find(i => i.id === id); 
    if (item) { 
        item.quantity++; 
    } else { 
        cart.push({ ...product, quantity: 1 }); 
    } 
    saveCart(); 
    updateCart(); 
    showNotification(`${product.name} added to cart!`, event); 
}

function updateCart() { 
    const cartItems = document.getElementById("cartItems"); 
    const cartCount = document.getElementById("cartCount"); 
    const cartFooter = document.querySelector(".cart-footer"); 
    
    if (!cart.length) { 
        cartItems.innerHTML = "<p style='text-align:center;padding:3rem;color:#999;font-size:1.1rem;'>Your cart is empty</p>"; 
        cartCount.textContent = 0; 
        cartFooter.innerHTML = `<div class="cart-total"><span>Total / الإجمالي:</span><span>0.00 AED</span></div>`; 
        return; 
    } 
    
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0); 
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0); 
    const deliveryFee = calculateDeliveryFee(subtotal); 
    const total = subtotal + deliveryFee; 
    const amountNeeded = Math.max(0, 100 - subtotal);
    
    cartCount.textContent = totalItems; 
    
    // Cart items display (top section - already in cartItems div)
    cartItems.innerHTML = cart.map(i => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem; border-bottom:1px solid #eee;">
            <div style="flex:1;">
                <strong style="font-size:0.9rem; color:#2c4a5c;">${i.name}</strong><br>
                <span style="color:#888; font-size:0.8rem;">${i.price} AED × ${i.quantity}</span><br>
                <span style="color:#e07856; font-weight:600; font-size:0.9rem;">${(i.price * i.quantity).toFixed(2)} AED</span>
            </div>
            <div style="display:flex; gap:0.4rem; align-items:center;">
                <button onclick="updateQuantity(${i.id}, -1)" style="padding:0.3rem 0.6rem; background:#f0f0f0; border:none; border-radius:4px; cursor:pointer; font-size:0.85rem; font-weight:600;">-</button>
                <span style="font-size:0.9rem; font-weight:600; min-width:20px; text-align:center;">${i.quantity}</span>
                <button onclick="updateQuantity(${i.id}, 1)" style="padding:0.3rem 0.6rem; background:#f0f0f0; border:none; border-radius:4px; cursor:pointer; font-size:0.85rem; font-weight:600;">+</button>
                <button onclick="removeFromCart(${i.id})" style="padding:0.3rem 0.6rem; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer; margin-left:0.3rem; font-size:0.85rem;">✕</button>
            </div>
        </div>
    `).join(""); 
    
    // Build cart footer: UPSELL FIRST, then SUMMARY, then BUTTON
    let footerHTML = '';
    
    // 1. UPSELL SECTION (only if under 100 AED)
    if (subtotal < 100) {
        const cartProductIds = cart.map(i => i.id);
        const recommendedProducts = products
            .filter(p => !cartProductIds.includes(p.id))
            .filter(p => p.price <= amountNeeded + 30)
            .sort((a, b) => Math.abs(a.price - amountNeeded) - Math.abs(b.price - amountNeeded))
            .slice(0, 3);
        
        if (recommendedProducts.length > 0) {
            footerHTML += `
                <div style="padding: 0.75rem 1rem; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 0.75rem;">
                    <div style="font-weight: 600; margin-bottom: 0.75rem; color: #2c4a5c; font-size: 0.9rem;">
                        Add these items to unlock free delivery:
                    </div>
                    ${recommendedProducts.map(p => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0;">
                            <div style="flex: 1;">
                                <div style="font-weight: 500; color: #2c4a5c; font-size: 0.85rem;">${p.name}</div>
                                <div style="font-size: 0.75rem; color: #888;">${p.price} AED</div>
                            </div>
                            <button onclick="addToCart(${p.id}, event)" style="padding: 0.4rem 0.8rem; background: #2c4a5c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; white-space: nowrap;">
                                Add
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }
    
    // 2. SUMMARY SECTION (always shown)
    footerHTML += `
        <div style="padding: 1rem; background: #f8f9fa; border-radius: 8px; margin-bottom: 0.75rem;">
            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 0.9rem; color: #2c4a5c;">
                <span>Subtotal / المجموع الفرعي:</span>
                <span>${subtotal.toFixed(2)} AED</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 0.9rem; color: #2c4a5c;">
                <span>Delivery / التوصيل:</span>
                <span style="${deliveryFee === 0 ? 'color: #28a745; font-weight: 600;' : ''}">${deliveryFee === 0 ? 'FREE / مجاني' : deliveryFee.toFixed(2) + ' AED'}</span>
            </div>
            <div style="border-top: 2px solid #ddd; margin: 0.5rem 0;"></div>
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 0 0.5rem; font-size: 1.1rem; font-weight: 700; color: #2c4a5c;">
                <span>Total / الإجمالي:</span>
                <span>${total.toFixed(2)} AED</span>
            </div>
        </div>
    `;
    
    // 3. CHECKOUT BUTTON (always shown)
    footerHTML += `
        <div style="padding: 0 1rem 1rem;">
            <button style="width: 100%; padding: 0.9rem; font-size: 0.95rem; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; background: #0066FF; color: white; transition: all 0.3s;" onclick="alert('Stripe payment coming soon! / الدفع عبر سترايب قريباً!')" onmouseover="this.style.background='#0052CC'" onmouseout="this.style.background='#0066FF'">
                💳 Pay with Card / الدفع بالبطاقة (Coming Soon)
            </button>
        </div>
    `;
    
    cartFooter.innerHTML = footerHTML;
}

function changeDeliveryZone(zone) { 
    selectedDeliveryZone = zone; 
    saveDeliveryZone(); 
    updateCart(); 
}

function updateQuantity(id, change) { 
    const item = cart.find(i => i.id === id); 
    if (item) { 
        item.quantity += change; 
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
    saveCart(); 
    updateCart(); 
}

function toggleCart() { 
    document.getElementById("cartSidebar").classList.toggle("active"); 
}

function checkout() { 
    if (!cart.length) { 
        alert("Your cart is empty!"); 
        return; 
    } 
    
    const orderNumber = generateOrderNumber(); 
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0); 
    const deliveryFee = calculateDeliveryFee(subtotal); 
    const total = subtotal + deliveryFee; 
    const zone = deliveryZones[selectedDeliveryZone]; 
    
    let message = `Hello ORLO, I'd like to order:%0A%0A*Order #${orderNumber}*%0A%0A`; 
    cart.forEach(i => { 
        message += `• ${i.name} × ${i.quantity} = ${(i.price * i.quantity).toFixed(2)} AED%0A`; 
    }); 
    message += `%0A─────────────────%0A`; 
    message += `Subtotal: ${subtotal.toFixed(2)} AED%0A`; 
    message += `Delivery (${zone.name}): ${deliveryFee === 0 ? 'FREE' : deliveryFee.toFixed(2) + ' AED'}%0A`; 
    message += `%0A*Total: ${total.toFixed(2)} AED*`; 
    message += `%0A%0ADelivery Location: ${zone.name}`; 
    message += `%0AEstimated Delivery: ${DELIVERY_TIME}`; 
    message += `%0A%0APlease confirm my delivery address and payment method.`; 
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank"); 
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

function showNotification(message, clickEvent) {
    const notification = document.createElement('div');
    
    let topPos = '100px';
    let leftPos = '50%';
    let transform = 'translateX(-50%)';
    
    // If we have the click event, find the product card and center notification over it
    if (clickEvent && clickEvent.target) {
        const button = clickEvent.target;
        // Find the parent product card
        const productCard = button.closest('.product-card');
        
        if (productCard) {
            const cardRect = productCard.getBoundingClientRect();
            // Position notification centered both horizontally AND vertically over the card
            topPos = (cardRect.top + window.scrollY + (cardRect.height / 2) - 20) + 'px'; // Center vertically (minus half notification height)
            leftPos = (cardRect.left + cardRect.width / 2) + 'px';
            transform = 'translateX(-50%)'; // Center horizontally
        } else {
            // Fallback if product card not found
            const rect = button.getBoundingClientRect();
            topPos = (rect.top + window.scrollY - 20) + 'px';
            leftPos = (rect.left + rect.width / 2) + 'px';
            transform = 'translateX(-50%)';
        }
    }
    
    notification.style.cssText = `
        position: absolute;
        top: ${topPos};
        left: ${leftPos};
        transform: ${transform};
        background: #e07856;
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        font-size: 0.95rem;
        animation: slideIn 0.3s ease-out;
        white-space: nowrap;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: ${transform} translateY(-10px) scale(0.9);
            }
            to {
                opacity: 1;
                transform: ${transform} translateY(0) scale(1);
            }
        }
    `;
    document.head.appendChild(style);
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.4s';
        setTimeout(() => notification.remove(), 400);
    }, 2000);
}

function toggleAbout() {
    const aboutSection = document.getElementById('about');
    const isVisible = aboutSection.style.display !== 'none';
    
    if (isVisible) {
        aboutSection.style.display = 'none';
    } else {
        aboutSection.style.display = 'block';
        aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
}

window.onload = () => { 
    createCategoryFilters(); 
    loadProducts(); 
    updateCart(); 
    
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
};
