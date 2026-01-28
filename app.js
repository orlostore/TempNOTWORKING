// --- 1. CONSTANTS & CONFIG ---
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

const policies = {
    shipping: `<h2>Shipping & Delivery</h2><h2 class="arabic-heading">الشحن والتوصيل</h2><p>Delivery takes 2-5 business days across the UAE.</p>`,
    returns: `<h2>Returns & Refunds</h2><h2 class="arabic-heading">الإرجاع والاسترداد</h2><p>7-day return policy for unopened items.</p>`,
    privacy: `<h2>Privacy Policy</h2><h2 class="arabic-heading">سياسة الخصوصية</h2><p>Your data is secure with us.</p>`,
    terms: `<h2>Terms of Service</h2><h2 class="arabic-heading">شروط الخدمة</h2><p>General terms and conditions.</p>`
};

// --- 2. STATE ---
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let selectedCategory = "All Products";
let selectedDeliveryZone = localStorage.getItem("deliveryZone") || "dubai";

// --- 3. HELPERS ---
const saveCart = () => localStorage.setItem("cart", JSON.stringify(cart));
const saveDeliveryZone = () => localStorage.setItem("deliveryZone", selectedDeliveryZone);
const getCategories = () => ["All Products", ...new Set(products.map(p => p.category))];
const calculateDeliveryFee = (subtotal) => {
    const zone = deliveryZones[selectedDeliveryZone];
    return subtotal >= zone.freeThreshold ? 0 : zone.fee;
};

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
    const hero = document.querySelector(".hero");
    if (hero) hero.classList.remove("hidden");
}

function createCategoryFilters() { 
    const container = document.getElementById("categoryFilters"); 
    if (!container) return;
    container.innerHTML = getCategories().map(cat => `
        <button class="category-btn ${cat === selectedCategory ? "active" : ""}" onclick="loadProducts('${cat}')">
            ${cat}<br><span class="arabic-text" style="font-size:0.7rem;">${categoryTranslations[cat] || ''}</span>
        </button>
    `).join(""); 
}

function updateCategoryButtons() { 
    document.querySelectorAll(".category-btn").forEach(btn => { 
        const catText = btn.innerText.split('\n')[0].trim();
        btn.classList.toggle("active", catText === selectedCategory); 
    }); 
}

function searchProducts() { 
    const input = document.getElementById("searchInput");
    const term = input.value.toLowerCase().trim(); 
    const hero = document.querySelector(".hero"); 
    if (!term) { loadProducts(selectedCategory); return; } 
    if (hero) hero.classList.add("hidden"); 
    const results = products.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)); 
    renderProducts(results); 
}

// --- 5. CART & CHECKOUT ---
function addToCart(id, event) { 
    const product = products.find(p => p.id === id); 
    const item = cart.find(i => i.id === id); 
    if (item) { item.quantity++; } else { cart.push({ ...product, quantity: 1 }); } 
    saveCart(); 
    updateCart(); 
    showNotification(`${product.name} added!`); 
}

function updateCart() { 
    const cartItems = document.getElementById("cartItems"); 
    const cartCount = document.getElementById("cartCount"); 
    const mobileCartCount = document.getElementById("mobileCartCount");
    const cartFooter = document.querySelector(".cart-footer"); 
    
    if (!cartItems || !cartCount) return;

    const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
    cartCount.textContent = totalQty;
    if (mobileCartCount) mobileCartCount.textContent = totalQty;

    if (!cart.length) { 
        cartItems.innerHTML = "<p style='text-align:center;padding:3rem;color:#999;'>Your cart is empty</p>"; 
        cartFooter.innerHTML = ""; 
        return; 
    } 
    
    const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0); 
    const deliveryFee = calculateDeliveryFee(subtotal); 
    const total = subtotal + deliveryFee; 

    cartItems.innerHTML = cart.map(i => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;">
            <div style="flex:1;"><strong>${i.name}</strong><br><small>${i.price} AED x ${i.quantity}</small></div>
            <div style="display:flex; align-items:center; gap:8px;">
                <button onclick="updateQuantity(${i.id}, -1)">-</button>
                <span>${i.quantity}</span>
                <button onclick="updateQuantity(${i.id}, 1)">+</button>
            </div>
        </div>
    `).join(""); 

    let footerHTML = `<div style="padding:15px; background:#f8f9fa; border-radius:8px;">`;
    if (subtotal < 100) {
        footerHTML += `<p style="font-size:0.8rem; color:#e07856; margin-bottom:8px;">Add <b>${(100-subtotal)} AED</b> more for FREE delivery!</p>`;
    }
    footerHTML += `
        <div style="display:flex; justify-content:space-between;"><span>Total:</span><span>${total.toFixed(2)} AED</span></div>
        <button id="stripeBtn" style="width:100%; margin-top:10px; padding:12px; background:#0066FF; color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer;" onclick="checkout()">💳 Pay with Card</button>
        <button style="width:100%; margin-top:8px; background:none; border:none; color:#25D366; text-decoration:underline; font-size:0.85rem; cursor:pointer;" onclick="checkoutWhatsApp()">Order via WhatsApp</button>
    </div>`;
    cartFooter.innerHTML = footerHTML;
}

async function checkout() {
    const btn = document.getElementById("stripeBtn");
    btn.disabled = true; btn.innerText = "Connecting...";
    try {
        const response = await fetch('/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart, deliveryZoneKey: selectedDeliveryZone }),
        });
        const data = await response.json();
        if (data.url) window.location.href = data.url;
        else throw new Error();
    } catch (err) {
        alert("Payment server error. Please use WhatsApp.");
        btn.disabled = false; btn.innerText = "💳 Pay with Card";
    }
}

function checkoutWhatsApp() {
    const subtotal = cart.reduce((s,i)=>s+(i.price*i.quantity),0);
    let text = `Hello ORLO, I want to order items worth ${subtotal} AED.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
}

// --- 6. INTERFACE FUNCTIONS ---
function updateQuantity(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
        saveCart(); updateCart();
    }
}

function toggleCart() { 
    const sidebar = document.getElementById("cartSidebar");
    if (sidebar) sidebar.classList.toggle("active"); 
}

function toggleAbout() {
    const about = document.getElementById("about");
    if (!about) return;
    about.style.display = (about.style.display === "none" || about.style.display === "") ? "block" : "none";
    if (about.style.display === "block") about.scrollIntoView({ behavior: "smooth" });
}

function openPolicy(type) {
    const textDiv = document.getElementById("policyText");
    const modal = document.getElementById("policyModal");
    if (textDiv && modal) {
        textDiv.innerHTML = policies[type];
        modal.style.display = "block";
    }
}
function closePolicy() { 
    const modal = document.getElementById("policyModal");
    if (modal) modal.style.display = "none"; 
}

function showNotification(msg) {
    const n = document.createElement('div');
    n.innerText = msg;
    n.style.cssText = `position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#2c4a5c; color:white; padding:12px 24px; border-radius:8px; z-index:10000; box-shadow:0 4px 15px rgba(0,0,0,0.2);`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2500);
}

// --- 7. INITIALIZATION ---
window.onload = () => {
    createCategoryFilters();
    loadProducts();
    updateCart();

    // Event Listeners for BOTH Desktop and Mobile cart icons
    const icons = ["cartIcon", "mobileCartIcon"];
    icons.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.onclick = toggleCart;
    });

    const closeCart = document.getElementById("closeCart");
    if (closeCart) closeCart.onclick = toggleCart;

    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) searchBtn.onclick = searchProducts;
    
    // Prevent search form refresh
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchProducts();
            }
        };
    }

    // Hamburger menu
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("navLinks");
    if (hamburger && navLinks) {
        hamburger.onclick = () => {
            hamburger.classList.toggle("active");
            navLinks.classList.toggle("active");
        };
    }

    // About toggle fix
    const aboutLinks = document.querySelectorAll('a[href="#about"]');
    aboutLinks.forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            toggleAbout();
            if (navLinks) navLinks.classList.remove("active");
            if (hamburger) hamburger.classList.remove("active");
        };
    });
};
