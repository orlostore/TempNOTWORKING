// ==========================================
// PRODUCTS (OPTIMIZED FOR CONVERSION)
// ==========================================

const products = [
    {
        id: 1,
        name: "Cable Management Kit",
        description: "Keep your desk clean and clutter-free in minutes (315 pieces)",
        price: 65,
        category: "Workspace",
        image: "📦",
        featured: true
    },
    {
        id: 2,
        name: "Wireless Charging Stand",
        description: "Fast, safe Qi charging — perfect for desk or bedside",
        price: 120,
        category: "Phone Accessories",
        image: "📱",
        featured: true
    },
    {
        id: 3,
        name: "LED Strip Lights",
        description: "Smart RGB lighting to upgrade your space instantly (5m)",
        price: 95,
        category: "Home",
        image: "💡"
    },
    {
        id: 4,
        name: "Laptop Stand",
        description: "Adjustable aluminum stand for better posture & airflow",
        price: 110,
        category: "Workspace",
        image: "💻",
        featured: true
    }
];

// ==========================================
// TRANSLATIONS
// ==========================================

const categoryTranslations = {
    "All Products": "جميع المنتجات",
    "Workspace": "مساحة العمل",
    "Phone Accessories": "إكسسوارات الهاتف",
    "Home": "المنزل"
};

const WHATSAPP_NUMBER = "971XXXXXXXXX";

// ==========================================
// DELIVERY
// ==========================================

const deliveryZones = {
    dubai: { name: "Dubai", nameAr: "دبي", fee: 15, freeThreshold: 150 },
    sharjah_ajman: { name: "Sharjah / Ajman", nameAr: "الشارقة / عجمان", fee: 20, freeThreshold: 200 },
    abu_dhabi: { name: "Abu Dhabi", nameAr: "أبو ظبي", fee: 30, freeThreshold: 250 },
    other: { name: "Other Emirates", nameAr: "إمارات أخرى", fee: 45, freeThreshold: 350 }
};

const DELIVERY_TIME = "2–5 business days";
const DELIVERY_TIME_AR = "٢–٥ أيام عمل";

// ==========================================
// STATE
// ==========================================

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let selectedCategory = "All Products";
let selectedDeliveryZone = localStorage.getItem("deliveryZone") || "dubai";

// ==========================================
// HELPERS
// ==========================================

const saveCart = () => localStorage.setItem("cart", JSON.stringify(cart));
const saveDeliveryZone = () => localStorage.setItem("deliveryZone", selectedDeliveryZone);

const getCategories = () => ["All Products", ...new Set(products.map(p => p.category))];

const calculateDeliveryFee = subtotal => {
    const zone = deliveryZones[selectedDeliveryZone];
    return subtotal >= zone.freeThreshold ? 0 : zone.fee;
};

const getAmountUntilFreeDelivery = subtotal => {
    const zone = deliveryZones[selectedDeliveryZone];
    return Math.max(0, zone.freeThreshold - subtotal);
};

const generateOrderNumber = () => {
    const d = new Date();
    return `ORLO-${d.getFullYear().toString().slice(-2)}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(1000+Math.random()*9000)}`;
};

// ==========================================
// RENDER PRODUCTS (BEST SELLERS FIRST)
// ==========================================

function renderProducts(list) {
    const grid = document.getElementById("productsGrid");

    if (!list.length) {
        grid.innerHTML = `
            <p style="grid-column:1/-1;text-align:center;color:#888;padding:3rem;">
                No products found — try another category
            </p>`;
        return;
    }

    const sorted = [...list].sort((a, b) => (b.featured === true) - (a.featured === true));

    grid.innerHTML = sorted.map(p => `
        <div class="product-card">
            ${p.featured ? `<span class="badge">Best Seller</span>` : ""}
            <div class="product-image">${p.image}</div>
            <div class="product-info">
                <small>${p.category}</small>
                <h3 class="product-title">${p.name}</h3>
                <p>${p.description}</p>
                <div class="product-price">${p.price} AED</div>
                <button class="add-to-cart" onclick="addToCart(${p.id})">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join("");
}

function loadProducts(category = "All Products") {
    selectedCategory = category;
    const list = category === "All Products"
        ? products
        : products.filter(p => p.category === category);

    renderProducts(list);
    updateCategoryButtons();
}

function createCategoryFilters() {
    document.getElementById("categoryFilters").innerHTML = getCategories().map(cat => `
        <button class="category-btn ${cat === selectedCategory ? "active" : ""}"
            onclick="loadProducts('${cat}')">
            ${cat}<br>
            <span class="arabic-text">${categoryTranslations[cat]}</span>
        </button>
    `).join("");
}

function updateCategoryButtons() {
    document.querySelectorAll(".category-btn").forEach(btn => {
        btn.classList.toggle("active", btn.textContent.includes(selectedCategory));
    });
}

// ==========================================
// CART
// ==========================================

function addToCart(id) {
    const product = products.find(p => p.id === id);
    const item = cart.find(i => i.id === id);

    item ? item.quantity++ : cart.push({ ...product, quantity: 1 });

    saveCart();
    updateCart();
    showNotification(`${product.name} added to cart`);
}

function updateCart() {
    const cartItems = document.getElementById("cartItems");
    const cartCount = document.getElementById("cartCount");
    const cartFooter = document.querySelector(".cart-footer");

    if (!cart.length) {
        cartItems.innerHTML = `<p style="text-align:center;padding:3rem;color:#999;">Your cart is empty</p>`;
        cartCount.textContent = 0;
        cartFooter.innerHTML = `<div class="cart-total">0.00 AED</div>`;
        return;
    }

    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee = calculateDeliveryFee(subtotal);
    const total = subtotal + deliveryFee;
    const amountUntilFree = getAmountUntilFreeDelivery(subtotal);
    const zone = deliveryZones[selectedDeliveryZone];

    cartCount.textContent = cart.reduce((s, i) => s + i.quantity, 0);

    cartItems.innerHTML = cart.map(i => `
        <div class="cart-item">
            <strong>${i.name}</strong><br>
            ${i.price} AED × ${i.quantity}
        </div>
    `).join("");

    cartFooter.innerHTML = `
        ${amountUntilFree > 0
            ? `<div class="free-delivery-hint">
                Add ${amountUntilFree.toFixed(2)} AED for FREE delivery
               </div>`
            : `<div class="free-delivery-achieved">✓ Free delivery unlocked</div>`
        }
        <p style="font-size:0.85rem;opacity:0.85;">
            🚚 Delivery in ${DELIVERY_TIME}
        </p>
        <div class="cart-total">
            <strong>Total:</strong> ${total.toFixed(2)} AED
        </div>
        <button class="checkout-btn whatsapp-btn" onclick="checkout()">
            Order via WhatsApp
        </button>
    `;
}

// ==========================================
// WHATSAPP CHECKOUT (HUMAN & TRUSTED)
// ==========================================

function checkout() {
    if (!cart.length) return alert("Your cart is empty");

    const orderNumber = generateOrderNumber();
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee = calculateDeliveryFee(subtotal);
    const total = subtotal + deliveryFee;
    const zone = deliveryZones[selectedDeliveryZone];

    let message = `Hello ORLO 👋%0A%0AI'd like to place an order:%0A`;
    message += `*Order #${orderNumber}*%0A%0A`;

    cart.forEach(i => {
        message += `• ${i.name} × ${i.quantity} = ${(i.price * i.quantity).toFixed(2)} AED%0A`;
    });

    message += `%0A──────────────%0A`;
    message += `Subtotal: ${subtotal.toFixed(2)} AED%0A`;
    message += `Delivery (${zone.name}): ${deliveryFee === 0 ? "FREE" : deliveryFee + " AED"}%0A`;
    message += `*Total: ${total.toFixed(2)} AED*%0A%0A`;
    message += `Delivery time: ${DELIVERY_TIME}%0A`;
    message += `Please help me complete the order. Thank you!`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
}

// ==========================================
// INIT
// ==========================================

window.onload = () => {
    createCategoryFilters();
    loadProducts();
    updateCart();
};

