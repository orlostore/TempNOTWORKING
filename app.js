// --- 1. CONSTANTS & CONFIGURATION ---
const WHATSAPP_NUMBER = "971XXXXXXXXX";

const deliveryZones = {
    dubai: { name: "Dubai", nameAr: "دبي", fee: 18, freeThreshold: 100 },
    sharjah_ajman: { name: "Sharjah / Ajman", nameAr: "الشارقة / عجمان", fee: 18, freeThreshold: 100 },
    abu_dhabi: { name: "Abu Dhabi", nameAr: "أبو ظبي", fee: 18, freeThreshold: 100 },
    other: { name: "Other Emirates", nameAr: "إمارات أخرى", fee: 18, freeThreshold: 100 }
};

const categoryTranslations = {
    "All Products": "كل المنتجات",
    "Workspace": "مساحة العمل",
    "Home": "المنزل",
    "Electronics": "إلكترونيات",
    "Accessories": "إكسسوارات"
};

const DELIVERY_TIME = "2-5 business days";
const DELIVERY_TIME_AR = "٢-٥ أيام عمل";

const policies = {
    shipping: `<h2>Shipping & Delivery</h2><h2 class="arabic-heading">الشحن والتوصيل</h2><p><strong>Coverage:</strong> We currently deliver within the UAE only.</p><p class="arabic-text"><strong>التغطية:</strong> نقوم حالياً بالتوصيل داخل الإمارات العربية المتحدة فقط.</p><p><strong>Processing Time:</strong> Orders are processed within 24–48 hours.</p><p class="arabic-text"><strong>وقت المعالجة:</strong> يتم معالجة الطلبات خلال ٢٤-٤٨ ساعة.</p>`,
    returns: `<h2>Returns & Refunds</h2><h2 class="arabic-heading">الإرجاع والاسترداد</h2><p>Returns are accepted within 7 days of delivery for unopened items.</p><p class="arabic-text">يتم قبول المرتجعات خلال ٧ أيام للمنتجات غير المفتوحة فقط.</p>`,
    privacy: `<h2>Privacy Policy</h2><h2 class="arabic-heading">سياسة الخصوصية</h2><p>We collect only necessary information to process your order.</p><p class="arabic-text">نجمع فقط المعلومات اللازمة لمعالجة طلبك.</p>`,
    terms: `<h2>Terms of Service</h2><h2 class="arabic-heading">شروط الخدمة</h2><p>By placing an order, you agree to our terms.</p><p class="arabic-text">بتقديم طلب، فإنك توافق على شروطنا.</p>`
};

// --- 2. STATE MANAGEMENT ---
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let selectedCategory = "All Products";
let selectedDeliveryZone = localStorage.getItem("deliveryZone") || "dubai";

// --- 3. HELPERS ---
const saveCart = () => localStorage.setItem("cart", JSON.stringify(cart));
const saveDeliveryZone = () => localStorage.setItem("deliveryZone", selectedDeliveryZone);
const getCategories = () => ["All Products", ...new Set(products.map(p => p.category))];

function calculateDeliveryFee(subtotal) {
    const zone = deliveryZones[selectedDeliveryZone];
    return subtotal >= zone.freeThreshold ? 0 : zone.fee;
}

function generateOrderNumber() {
    const date = new Date();
    const id = Math.floor(Math.random() * 9000) + 1000;
    return `ORLO-${date.toISOString().slice(2,10).replace(/-/g,'')}-${id}`;
}

// --- 4. UI RENDERING ---
function renderProducts(list) { 
    const grid = document.getElementById("productsGrid"); 
    if (!grid) return;
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
}

function createCategoryFilters() { 
    const container = document.getElementById("categoryFilters"); 
    if (!container) return;
    container.innerHTML = getCategories().map(cat => {
        const trans = categoryTranslations[cat] || cat;
        return `<button class="category-btn ${cat === selectedCategory ? "active" : ""}" onclick="loadProducts('${cat}')">
            ${cat}<br><span class="arabic-text category-arabic">${trans}</span>
        </button>`;
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
    const hero = document.querySelector(".hero"); 
    if (!term) { 
        loadProducts(selectedCategory); 
        if (hero) hero.classList.remove("hidden"); 
        return; 
    } 
    if (hero) hero.classList.add("hidden"); 
    const scoped = selectedCategory === "All Products" ? products : products.filter(p => p.category === selectedCategory); 
    const results = scoped.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)); 
    renderProducts(results); 
}

// --- 5. CART LOGIC ---
function addToCart(id, event) { 
    const product = products.find(p => p.id === id); 
    const item = cart.find(i => i.id === id); 
    if (item) { item.quantity++; } else { cart.push({ ...product, quantity: 1 }); } 
    saveCart(); 
    updateCart(); 
    showNotification(`${product.name} added to cart!`, event); 
}

function updateCart() { 
    const cartItems = document.getElementById("cartItems"); 
    const cartCount = document.getElementById("cartCount"); 
    const cartFooter = document.querySelector(".cart-footer"); 
    
    if (!cart.length) { 
        cartItems.innerHTML = "<p style='text-align:center;padding:3rem;color:#999;'>Your cart is empty</p>"; 
        cartCount.textContent = 0; 
        cartFooter.innerHTML = `<div class="cart-total" style="padding:1rem; text-align:center;">Total: 0.00 AED</div>`; 
        return; 
    } 
    
    const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0); 
    const deliveryFee = calculateDeliveryFee(subtotal); 
    const total = subtotal + deliveryFee; 
    const amountNeeded = Math.max(0, 100 - subtotal);
    
    cartCount.textContent = cart.reduce((s, i) => s + i.quantity, 0); 
    
    cartItems.innerHTML = cart.map(i => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.8rem; border-bottom:1px solid #eee;">
            <div style="flex:1;">
                <strong style="font-size:0.9rem;">${i.name}</strong><br>
                <span style="color:#888; font-size:0.8rem;">${i.price} AED × ${i.quantity}</span>
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem;">
                <button onclick="updateQuantity(${i.id}, -1)" style="padding:2px 8px;">-</button>
                <span style="min-width:20px; text-align:center;">${i.quantity}</span>
                <button onclick="updateQuantity(${i.id}, 1)" style="padding:2px 8px;">+</button>
                <button onclick="removeFromCart(${i.id})" style="color:#dc3545; background:none; border:none; cursor:pointer; margin-left:5px;">✕</button>
            </div>
        </div>
    `).join(""); 

    // --- Build Cart Footer ---
    let footerHTML = '';

    // 1. Upsell
    if (subtotal < 100) {
        const cartProductIds = cart.map(i => i.id);
        const recommended = products
            .filter(p => !cartProductIds.includes(p.id) && p.price <= (amountNeeded + 30))
            .slice(0, 2);
        
        if (recommended.length > 0) {
            footerHTML += `<div style="padding:10px; background:#fffbe6; border:1px solid #ffe58f; border-radius:8px; margin-bottom:10px; font-size:0.85rem;">
                <strong>Add for FREE delivery:</strong>
                ${recommended.map(p => `
                    <div style="display:flex; justify-content:space-between; margin-top:5px;">
                        <span>${p.name} (${p.price} AED)</span>
                        <button onclick="addToCart(${p.id}, event)" style="font-size:0.7rem;">Add</button>
                    </div>
                `).join('')}
            </div>`;
        }
    }

    // 2. Totals
    footerHTML += `
        <div style="padding:1rem; background:#f8f9fa; border-radius:8px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; font-size:0.9rem;"><span>Subtotal:</span><span>${subtotal.toFixed(2)} AED</span></div>
            <div style="display:flex; justify-content:space-between; font-size:0.9rem;"><span>Delivery:</span><span>${deliveryFee === 0 ? 'FREE' : deliveryFee.toFixed(2) + ' AED'}</span></div>
            <div style="display:flex; justify-content:space-between; font-weight:700; font-size:1.1rem; margin-top:8px; border-top:1px solid #ddd; padding-top:8px;">
                <span>Total:</span><span>${total.toFixed(2)} AED</span>
            </div>
        </div>
    `;

    // 3. Checkout Buttons
    footerHTML += `
        <div style="padding:0 1rem 1rem;">
            <button id="stripeBtn" style="width:100%; padding:12px; background:#0066FF; color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer;" onclick="checkout()">
                💳 Pay with Card
            </button>
            <button style="width:100%; margin-top:10px; background:none; border:none; color:#25D366; text-decoration:underline; cursor:pointer;" onclick="checkoutWhatsApp()">
                Or order via WhatsApp
            </button>
        </div>
    `;

    cartFooter.innerHTML = footerHTML;
}

// --- 6. CHECKOUT LOGIC ---
async function checkout() {
    const btn = document.getElementById("stripeBtn");
    const originalText = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = "Connecting...";

        const response = await fetch('/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cart: cart,
                deliveryZoneKey: selectedDeliveryZone
            }),
        });

        if (!response.ok) throw new Error('Server error');

        const data = await response.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error('No URL returned');
        }
    } catch (err) {
        console.error(err);
        alert("Payment server is busy. Please try WhatsApp!");
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function checkoutWhatsApp() {
    const orderNumber = generateOrderNumber();
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee = calculateDeliveryFee(subtotal);
    const zone = deliveryZones[selectedDeliveryZone];
    
    let text = `Hello ORLO! I'd like to order (Order #${orderNumber}):%0A%0A`;
    cart.forEach(i => text += `• ${i.name} x${i.quantity} = ${(i.price*i.quantity)} AED%0A`);
    text += `%0ATotal: ${(subtotal + deliveryFee).toFixed(2)} AED%0ALocation: ${zone.name}`;
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
}

// --- 7. UTILITY FUNCTIONS ---
function updateQuantity(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
        saveCart();
        updateCart();
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

function openPolicy(type) {
    document.getElementById("policyText").innerHTML = policies[type];
    document.getElementById("policyModal").style.display = "block";
}

function closePolicy() {
    document.getElementById("policyModal").style.display = "none";
}

function showNotification(msg, event) {
    const n = document.createElement('div');
    n.innerText = msg;
    n.style.cssText = `position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#e07856; color:white; padding:12px 24px; border-radius:30px; z-index:9999; box-shadow:0 4px 12px rgba(0,0,0,0.2);`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2500);
}

// --- 8. INITIALIZATION ---
window.onload = () => {
    createCategoryFilters();
    loadProducts();
    updateCart();

    // Event Listeners
    document.getElementById("cartIcon").onclick = toggleCart;
    document.getElementById("closeCart").onclick = toggleCart;
    document.getElementById("searchBtn").onclick = searchProducts;
    
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("navLinks");
    if (hamburger && navLinks) {
        hamburger.onclick = () => {
            hamburger.classList.toggle("active");
            navLinks.classList.toggle("active");
        };
    }
};
