// ==========================================
// CONFIGURATION & DATA
// ==========================================

const CONFIG = {
    whatsappNumber: "971XXXXXXXXX",
    storeName: "ORLO",
    storeEmail: "info@orlostore.com",
    deliveryTime: "2-5 business days",
    deliveryTimeAr: "٢-٥ أيام عمل",
    itemsPerPage: 4
};

const PRODUCTS = [
    {
        id: 1,
        name: "Cable Management Kit",
        description: "315-piece adhesive cable organizer with clips, ties, and sleeves for complete wire control",
        price: 65,
        category: "Workspace",
        image: "📦",
        featured: true,
        inStock: true,
        tags: ["organizer", "desk", "essential"]
    },
    {
        id: 2,
        name: "Wireless Charging Stand",
        description: "Fast Qi charging stand compatible with all smartphones, supports 15W fast charging",
        price: 120,
        category: "Phone Accessories",
        image: "📱",
        featured: true,
        inStock: true,
        tags: ["charging", "phone", "fast"]
    },
    {
        id: 3,
        name: "LED Strip Lights",
        description: "RGB smart LED strip (5m) with app control, voice commands, and 16 million colors",
        price: 95,
        category: "Home",
        image: "💡",
        featured: false,
        inStock: true,
        tags: ["lights", "smart", "home"]
    },
    {
        id: 4,
        name: "Laptop Stand",
        description: "Adjustable aluminum stand with ergonomic design and non-slip pads",
        price: 110,
        category: "Workspace",
        image: "💻",
        featured: true,
        inStock: true,
        tags: ["laptop", "ergonomic", "adjustable"]
    },
    {
        id: 5,
        name: "Desk Organizer",
        description: "Multi-compartment desk organizer with pen holders and phone slot",
        price: 45,
        category: "Workspace",
        image: "🗃️",
        featured: false,
        inStock: true,
        tags: ["organizer", "desk"]
    },
    {
        id: 6,
        name: "Phone Case",
        description: "Premium protective case with shock absorption and raised edges",
        price: 35,
        category: "Phone Accessories",
        image: "📱",
        featured: false,
        inStock: true,
        tags: ["case", "protection", "phone"]
    }
];

const CATEGORY_TRANSLATIONS = {
    "All Products": "جميع المنتجات",
    "Workspace": "مساحة العمل",
    "Phone Accessories": "إكسسوارات الهاتف",
    "Home": "المنزل"
};

const DELIVERY_ZONES = {
    dubai: {
        name: "Dubai",
        nameAr: "دبي",
        fee: 15,
        freeThreshold: 150
    },
    sharjah_ajman: {
        name: "Sharjah / Ajman",
        nameAr: "الشارقة / عجمان",
        fee: 20,
        freeThreshold: 200
    },
    abu_dhabi: {
        name: "Abu Dhabi",
        nameAr: "أبو ظبي",
        fee: 30,
        freeThreshold: 250
    },
    other: {
        name: "Other Emirates",
        nameAr: "إمارات أخرى",
        fee: 45,
        freeThreshold: 350
    }
};

const POLICIES = {
    shipping: {
        title: "Shipping & Delivery",
        titleAr: "الشحن والتوصيل",
        content: `<h2>Shipping & Delivery</h2>
                 <h2 class="arabic-heading">الشحن والتوصيل</h2>
                 <p><strong>Coverage:</strong> We currently deliver within the UAE only.</p>
                 <p class="arabic-text"><strong>التغطية:</strong> نقوم حالياً بالتوصيل داخل الإمارات العربية المتحدة فقط.</p>
                 <p><strong>Processing Time:</strong> Orders are processed within 24–48 hours of payment confirmation.</p>
                 <p class="arabic-text"><strong>وقت المعالجة:</strong> يتم معالجة الطلبات خلال ٢٤-٤٨ ساعة من تأكيد الدفع.</p>
                 <p><strong>Delivery Timeline:</strong> 2-5 business days for all locations.</p>
                 <p class="arabic-text"><strong>مدة التوصيل:</strong> ٢-٥ أيام عمل لجميع المواقع.</p>
                 <p><strong>Delivery Fees:</strong></p>
                 <p class="arabic-text"><strong>رسوم التوصيل:</strong></p>
                 <ul>
                     <li><strong>Dubai:</strong> 15 AED (FREE on orders over 150 AED)</li>
                     <li class="arabic-text"><strong>دبي:</strong> ١٥ درهم (مجاناً للطلبات فوق ١٥٠ درهم)</li>
                     <li><strong>Sharjah / Ajman:</strong> 20 AED (FREE on orders over 200 AED)</li>
                     <li class="arabic-text"><strong>الشارقة / عجمان:</strong> ٢٠ درهم (مجاناً للطلبات فوق ٢٠٠ درهم)</li>
                     <li><strong>Abu Dhabi:</strong> 30 AED (FREE on orders over 250 AED)</li>
                     <li class="arabic-text"><strong>أبو ظبي:</strong> ٣٠ درهم (مجاناً للطلبات فوق ٢٥٠ درهم)</li>
                     <li><strong>Other Emirates:</strong> 45 AED (FREE on orders over 350 AED)</li>
                     <li class="arabic-text"><strong>إمارات أخرى:</strong> ٤٥ درهم (مجاناً للطلبات فوق ٣٥٠ درهم)</li>
                 </ul>
                 <p><strong>Tracking:</strong> You will receive tracking information via WhatsApp once your order ships.</p>
                 <p class="arabic-text"><strong>التتبع:</strong> ستتلقى معلومات التتبع عبر واتساب بمجرد شحن طلبك.</p>`
    },
    returns: {
        title: "Returns & Refunds",
        titleAr: "الإرجاع والاسترداد",
        content: `<h2>Returns & Refunds</h2>
                 <h2 class="arabic-heading">الإرجاع والاسترداد</h2>
                 <p><strong>7-Day Return Window:</strong> Returns are accepted within 7 days of delivery only. No exceptions.</p>
                 <p class="arabic-text"><strong>فترة الإرجاع ٧ أيام:</strong> يتم قبول المرتجعات خلال ٧ أيام من التسليم فقط. بدون استثناءات.</p>
                 <p><strong>Unopened Items Only:</strong> Items must be completely unused, unopened, and in original sealed packaging.</p>
                 <p class="arabic-text"><strong>المنتجات غير المفتوحة فقط:</strong> يجب أن تكون المنتجات غير مستخدمة تماماً، غير مفتوحة، وفي العبوة الأصلية المغلقة.</p>
                 <p><strong>How to Initiate a Return:</strong> Contact us via WhatsApp or email within 7 days of delivery.</p>
                 <p class="arabic-text"><strong>كيفية بدء الإرجاع:</strong> اتصل بنا عبر واتساب أو البريد الإلكتروني خلال ٧ أيام من التسليم.</p>`
    },
    privacy: {
        title: "Privacy Policy",
        titleAr: "سياسة الخصوصية",
        content: `<h2>Privacy Policy</h2>
                 <h2 class="arabic-heading">سياسة الخصوصية</h2>
                 <p><strong>Information Collection:</strong> We collect only necessary information to process your order.</p>
                 <p class="arabic-text"><strong>جمع المعلومات:</strong> نجمع فقط المعلومات الضرورية لمعالجة طلبك.</p>
                 <p><strong>Data Security:</strong> We use secure communication channels to protect your information.</p>
                 <p class="arabic-text"><strong>أمن البيانات:</strong> نستخدم قنوات اتصال آمنة لحماية معلوماتك.</p>
                 <p><strong>Your Rights:</strong> You may request deletion of your data at any time by contacting us.</p>
                 <p class="arabic-text"><strong>حقوقك:</strong> يمكنك طلب حذف بياناتك في أي وقت عن طريق الاتصال بنا.</p>`
    },
    terms: {
        title: "Terms of Service",
        titleAr: "شروط الخدمة",
        content: `<h2>Terms of Service</h2>
                 <h2 class="arabic-heading">شروط الخدمة</h2>
                 <p><strong>Order Agreement:</strong> By placing an order, you agree to provide accurate information.</p>
                 <p class="arabic-text"><strong>اتفاقية الطلب:</strong> بتقديم طلب، فإنك توافق على تقديم معلومات دقيقة.</p>
                 <p><strong>Payment:</strong> Full payment is required before order processing begins.</p>
                 <p class="arabic-text"><strong>الدفع:</strong> يلزم الدفع الكامل قبل بدء معالجة الطلب.</p>
                 <p><strong>Contact:</strong> For questions about these terms, contact us at info@orlostore.com</p>
                 <p class="arabic-text"><strong>الاتصال:</strong> للاستفسارات حول هذه الشروط، اتصل بنا على info@orlostore.com</p>`
    }
};

// ==========================================
// STATE MANAGEMENT
// ==========================================

class StateManager {
    constructor() {
        this.cart = this.loadFromStorage('cart') || [];
        this.selectedCategory = 'All Products';
        this.selectedDeliveryZone = this.loadFromStorage('deliveryZone') || 'dubai';
        this.currentPage = 1;
        this.searchTerm = '';
        this.isLoading = false;
    }

    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }

    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            return null;
        }
    }

    getCategories() {
        const categories = ['All Products'];
        PRODUCTS.forEach(product => {
            if (!categories.includes(product.category)) {
                categories.push(product.category);
            }
        });
        return categories;
    }

    getFilteredProducts() {
        let filtered = PRODUCTS;
        
        // Apply category filter
        if (this.selectedCategory !== 'All Products') {
            filtered = filtered.filter(p => p.category === this.selectedCategory);
        }
        
        // Apply search filter
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(term) ||
                p.description.toLowerCase().includes(term) ||
                p.tags.some(tag => tag.toLowerCase().includes(term))
            );
        }
        
        return filtered;
    }

    getPaginatedProducts() {
        const filtered = this.getFilteredProducts();
        const start = (this.currentPage - 1) * CONFIG.itemsPerPage;
        const end = start + CONFIG.itemsPerPage;
        return filtered.slice(0, end);
    }

    hasMoreProducts() {
        return this.getPaginatedProducts().length < this.getFilteredProducts().length;
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getDeliveryFee() {
        const zone = DELIVERY_ZONES[this.selectedDeliveryZone];
        const subtotal = this.getCartTotal();
        return subtotal >= zone.freeThreshold ? 0 : zone.fee;
    }

    getAmountUntilFreeDelivery() {
        const zone = DELIVERY_ZONES[this.selectedDeliveryZone];
        const subtotal = this.getCartTotal();
        return subtotal >= zone.freeThreshold ? 0 : zone.freeThreshold - subtotal;
    }

    addToCart(productId) {
        const product = PRODUCTS.find(p => p.id === productId);
        if (!product) return false;

        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }
        
        this.saveToStorage('cart', this.cart);
        return true;
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveToStorage('cart', this.cart);
    }

    updateQuantity(productId, change) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;

        item.quantity += change;
        
        if (item.quantity <= 0) {
            this.removeFromCart(productId);
        } else {
            this.saveToStorage('cart', this.cart);
        }
    }

    clearCart() {
        this.cart = [];
        this.saveToStorage('cart', this.cart);
    }
}

// ==========================================
// INITIALIZE APPLICATION
// ==========================================

const state = new StateManager();
const dom = {
    productsGrid: document.getElementById('productsGrid'),
    categoryFilters: document.getElementById('categoryFilters'),
    cartItems: document.getElementById('cartItems'),
    cartCount: document.getElementById('cartCount'),
    cartSidebar: document.getElementById('cartSidebar'),
    cartFooter: document.getElementById('cartFooter'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    cartIcon: document.getElementById('cartIcon'),
    closeCart: document.getElementById('closeCart'),
    policyModal: document.getElementById('policyModal'),
    policyContent: document.getElementById('policyContent'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    navLinks: document.getElementById('navLinks'),
    backToTop: document.getElementById('backToTop'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    loadMoreContainer: document.getElementById('loadMoreContainer')
};

// ==========================================
// UI COMPONENTS
// ==========================================

class UI {
    static showLoading() {
        if (dom.loadingSpinner) {
            dom.loadingSpinner.style.display = 'flex';
        }
    }

    static hideLoading() {
        if (dom.loadingSpinner) {
            setTimeout(() => {
                dom.loadingSpinner.style.opacity = '0';
                setTimeout(() => {
                    dom.loadingSpinner.style.display = 'none';
                    dom.loadingSpinner.style.opacity = '1';
                }, 300);
            }, 500);
        }
    }

    static showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;font-size:1.2rem;">✕</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    static updateBackToTop() {
        if (!dom.backToTop) return;
        
        if (window.scrollY > 300) {
            dom.backToTop.style.display = 'flex';
        } else {
            dom.backToTop.style.display = 'none';
        }
    }

    static scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    static toggleMobileMenu() {
        if (dom.navLinks) {
            dom.navLinks.classList.toggle('active');
            dom.mobileMenuBtn.classList.toggle('active');
            dom.mobileMenuBtn.setAttribute('aria-expanded', 
                dom.mobileMenuBtn.classList.contains('active')
            );
        }
    }

    static closeMobileMenu() {
        if (dom.navLinks) {
            dom.navLinks.classList.remove('active');
            dom.mobileMenuBtn.classList.remove('active');
            dom.mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
    }
}

// ==========================================
// PRODUCT RENDERING
// ==========================================

function renderProducts() {
    const products = state.getPaginatedProducts();
    
    if (!products.length) {
        dom.productsGrid.innerHTML = `
            <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <p style="font-size: 1.2rem; color: var(--text-light); margin-bottom: 1rem;">
                    No products found${state.searchTerm ? ` for "${state.searchTerm}"` : ''}
                </p>
                ${state.searchTerm ? `
                    <button onclick="clearSearch()" style="background: var(--accent); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: var(--radius-sm); cursor: pointer; font-weight: 600;">
                        Clear Search
                    </button>
                ` : ''}
            </div>
        `;
        dom.loadMoreContainer.style.display = 'none';
        return;
    }

    const productsHTML = products.map(product => `
        <article class="product-card">
            ${product.featured ? `<span class="badge" role="status" aria-label="Best Seller">Best Seller</span>` : ''}
            <div class="product-image" role="img" aria-label="${product.name}">
                ${product.image}
            </div>
            <div class="product-info">
                <small>${product.category}</small>
                <h3 class="product-title">${product.name}</h3>
                <p>${product.description}</p>
                <div class="product-price">${product.price.toFixed(2)} AED</div>
                <button class="add-to-cart" onclick="addToCart(${product.id})" aria-label="Add ${product.name} to cart">
                    Add to Cart
                </button>
            </div>
        </article>
    `).join('');

    dom.productsGrid.innerHTML = productsHTML;
    
    // Show/hide load more button
    if (state.hasMoreProducts()) {
        dom.loadMoreContainer.style.display = 'block';
    } else {
        dom.loadMoreContainer.style.display = 'none';
    }
}

function renderCategoryFilters() {
    const categories = state.getCategories();
    
    const filtersHTML = categories.map(category => `
        <button class="category-btn ${category === state.selectedCategory ? 'active' : ''}" 
                onclick="filterByCategory('${category}')"
                aria-label="${category} ${CATEGORY_TRANSLATIONS[category]}">
            ${category}<br>
            <span class="arabic-text">${CATEGORY_TRANSLATIONS[category]}</span>
        </button>
    `).join('');

    dom.categoryFilters.innerHTML = filtersHTML;
}

function filterByCategory(category) {
    state.selectedCategory = category;
    state.currentPage = 1;
    renderCategoryFilters();
    renderProducts();
    
    // Scroll to products section on mobile
    if (window.innerWidth < 768) {
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    }
}

function clearSearch() {
    state.searchTerm = '';
    dom.searchInput.value = '';
    state.currentPage = 1;
    renderProducts();
}

function searchProducts() {
    state.searchTerm = dom.searchInput.value.trim();
    state.currentPage = 1;
    renderProducts();
}

function loadMoreProducts() {
    state.currentPage++;
    renderProducts();
}

// ==========================================
// CART MANAGEMENT
// ==========================================

function renderCart() {
    const cart = state.cart;
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Update cart count
    dom.cartCount.textContent = cartCount;
    
    // Render cart items
    if (!cart.length) {
        dom.cartItems.innerHTML = `
            <div class="empty-cart">
                <p>Your cart is empty</p>
                <p class="arabic-text">سلة التسوق فارغة</p>
                <a href="#products" class="continue-shopping" onclick="toggleCart()">
                    Continue Shopping
                </a>
            </div>
        `;
        renderCartFooter();
        return;
    }
    
    const cartItemsHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price.toFixed(2)} AED × ${item.quantity}</div>
                <div class="cart-item-total">${(item.price * item.quantity).toFixed(2)} AED</div>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, -1)" aria-label="Decrease quantity">-</button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, 1)" aria-label="Increase quantity">+</button>
                <button class="remove-btn" onclick="removeFromCart(${item.id})" aria-label="Remove item">✕</button>
            </div>
        </div>
    `).join('');
    
    dom.cartItems.innerHTML = cartItemsHTML;
    renderCartFooter();
}

function renderCartFooter() {
    const cart = state.cart;
    if (!cart.length) return;
    
    const subtotal = state.getCartTotal();
    const deliveryFee = state.getDeliveryFee();
    const total = subtotal + deliveryFee;
    const amountUntilFree = state.getAmountUntilFreeDelivery();
    const zone = DELIVERY_ZONES[state.selectedDeliveryZone];
    
    let deliveryMessage = '';
    if (amountUntilFree > 0) {
        deliveryMessage = `
            <div class="delivery-message free-delivery-hint">
                Add <strong>${amountUntilFree.toFixed(2)} AED</strong> more for FREE delivery!<br>
                <span class="arabic-text">أضف <strong>${amountUntilFree.toFixed(2)} درهم</strong> للحصول على توصيل مجاني!</span>
            </div>
        `;
    } else {
        deliveryMessage = `
            <div class="delivery-message free-delivery-achieved">
                ✓ You qualify for FREE delivery! / توصيل مجاني!
            </div>
        `;
    }
    
    const cartFooterHTML = `
        <div class="delivery-section">
            <div class="delivery-header">
                <span class="delivery-icon">🚚</span>
                <span>Delivery Location / موقع التوصيل</span>
            </div>
            <select id="deliveryZoneSelect" class="delivery-select" onchange="changeDeliveryZone(this.value)">
                ${Object.entries(DELIVERY_ZONES).map(([key, zone]) => `
                    <option value="${key}" ${key === state.selectedDeliveryZone ? 'selected' : ''}>
                        ${zone.name} / ${zone.nameAr}
                    </option>
                `).join('')}
            </select>
            ${deliveryMessage}
            <div class="delivery-time">
                <span>Delivery: ${CONFIG.deliveryTime} / التوصيل: ${CONFIG.deliveryTimeAr}</span>
            </div>
        </div>
        
        <div class="cart-summary">
            <div class="summary-row">
                <span>Subtotal / المجموع الفرعي:</span>
                <span>${subtotal.toFixed(2)} AED</span>
            </div>
            <div class="summary-row delivery-row">
                <span>Delivery / التوصيل (${zone.name} / ${zone.nameAr}):</span>
                <span class="${deliveryFee === 0 ? 'free-delivery' : ''}">
                    ${deliveryFee === 0 ? 'FREE / مجاني' : deliveryFee.toFixed(2) + ' AED'}
                </span>
            </div>
            <div class="cart-total">
                <span>Total / الإجمالي:</span>
                <span id="cartTotal">${total.toFixed(2)} AED</span>
            </div>
        </div>
        
        <button class="checkout-btn stripe-btn" onclick="checkoutWithStripe()" ${cart.length === 0 ? 'disabled' : ''}>
            💳 Pay with Card / الدفع بالبطاقة
        </button>
        <button class="checkout-btn whatsapp-btn" onclick="checkoutWithWhatsApp()" ${cart.length === 0 ? 'disabled' : ''}>
            📱 Order via WhatsApp / اطلب عبر واتساب
        </button>
    `;
    
    dom.cartFooter.innerHTML = cartFooterHTML;
}

function addToCart(productId) {
    if (state.addToCart(productId)) {
        const product = PRODUCTS.find(p => p.id === productId);
        renderCart();
        UI.showNotification(`${product.name} added to cart!`);
    }
}

function removeFromCart(productId) {
    state.removeFromCart(productId);
    renderCart();
    UI.showNotification('Item removed from cart', 'info');
}

function updateCartQuantity(productId, change) {
    state.updateQuantity(productId, change);
    renderCart();
}

function changeDeliveryZone(zone) {
    state.selectedDeliveryZone = zone;
    state.saveToStorage('deliveryZone', zone);
    renderCart();
}

function toggleCart() {
    dom.cartSidebar.classList.toggle('active');
    document.body.style.overflow = dom.cartSidebar.classList.contains('active') ? 'hidden' : '';
    
    if (dom.cartSidebar.classList.contains('active')) {
        renderCart();
    }
}

// ==========================================
// CHECKOUT FUNCTIONS
// ==========================================

function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `ORLO-${year}${month}${day}-${random}`;
}

function checkoutWithWhatsApp() {
    const cart = state.cart;
    if (!cart.length) {
        UI.showNotification('Your cart is empty!', 'warning');
        return;
    }
    
    const orderNumber = generateOrderNumber();
    const subtotal = state.getCartTotal();
    const deliveryFee = state.getDeliveryFee();
    const total = subtotal + deliveryFee;
    const zone = DELIVERY_ZONES[state.selectedDeliveryZone];
    
    let message = `Hello ${CONFIG.storeName}, I'd like to order:%0A%0A`;
    message += `*Order #${orderNumber}*%0A%0A`;
    
    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} × ${item.quantity} = ${(item.price * item.quantity).toFixed(2)} AED%0A`;
    });
    
    message += `%0A─────────────────%0A`;
    message += `Subtotal: ${subtotal.toFixed(2)} AED%0A`;
    message += `Delivery (${zone.name}): ${deliveryFee === 0 ? 'FREE' : deliveryFee.toFixed(2) + ' AED'}%0A`;
    message += `%0A*Total: ${total.toFixed(2)} AED*%0A%0A`;
    message += `Delivery Location: ${zone.name}%0A`;
    message += `Estimated Delivery: ${CONFIG.deliveryTime}%0A%0A`;
    message += `Please confirm my delivery address and payment method.`;
    
    const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
}

async function checkoutWithStripe() {
    const cart = state.cart;
    if (!cart.length) {
        UI.showNotification('Your cart is empty!', 'warning');
        return;
    }
    
    const stripeBtn = document.querySelector('.checkout-btn.stripe-btn');
    if (stripeBtn) {
        stripeBtn.disabled = true;
        stripeBtn.innerHTML = 'Processing... / جارٍ المعالجة...';
    }
    
    try {
        // In a real implementation, you would make an API call here
        // For now, we'll simulate the process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate success - in reality, you would redirect to Stripe
        UI.showNotification('Proceeding to secure payment...', 'info');
        
        // For demo purposes, we'll show a success message
        setTimeout(() => {
            state.clearCart();
            renderCart();
            toggleCart();
            UI.showNotification('Payment successful! Thank you for your order.', 'success');
            
            if (stripeBtn) {
                stripeBtn.disabled = false;
                stripeBtn.innerHTML = '💳 Pay with Card / الدفع بالبطاقة';
            }
        }, 2000);
        
    } catch (error) {
        console.error('Checkout error:', error);
        UI.showNotification('Payment failed. Please try again.', 'error');
        
        if (stripeBtn) {
            stripeBtn.disabled = false;
            stripeBtn.innerHTML = '💳 Pay with Card / الدفع بالبطاقة';
        }
    }
}

// ==========================================
// POLICY MODAL
// ==========================================

function openPolicy(type) {
    if (!POLICIES[type]) return;
    
    const policy = POLICIES[type];
    dom.policyContent.innerHTML = policy.content;
    dom.policyModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Set modal title for screen readers
    dom.policyModal.setAttribute('aria-labelledby', 'policyTitle');
}

function closePolicy() {
    dom.policyModal.style.display = 'none';
    document.body.style.overflow = '';
}

// ==========================================
// ABOUT SECTION
// ==========================================

function toggleAbout() {
    const aboutSection = document.getElementById('about');
    if (!aboutSection) return;
    
    const isVisible = aboutSection.style.display !== 'none';
    
    if (isVisible) {
        aboutSection.style.display = 'none';
    } else {
        aboutSection.style.display = 'block';
        aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Close mobile menu if open
    UI.closeMobileMenu();
}

// ==========================================
// INITIALIZATION
// ==========================================

function initialize() {
    // Show loading spinner
    UI.showLoading();
    
    // Set current year in footer
    const currentYear = document.getElementById('currentYear');
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }
    
    // Initialize event listeners
    setupEventListeners();
    
    // Initial render
    renderCategoryFilters();
    renderProducts();
    renderCart();
    
    // Hide loading spinner
    setTimeout(() => UI.hideLoading(), 800);
    
    // Check for URL parameters
    checkUrlParameters();
}

function setupEventListeners() {
    // Search functionality
    if (dom.searchBtn) {
        dom.searchBtn.addEventListener('click', searchProducts);
    }
    
    if (dom.searchInput) {
        dom.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchProducts();
            }
        });
        
        // Debounced search for better UX
        let searchTimeout;
        dom.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (e.target.value.length > 2 || e.target.value.length === 0) {
                    searchProducts();
                }
            }, 500);
        });
    }
    
    // Cart functionality
    if (dom.cartIcon) {
        dom.cartIcon.addEventListener('click', toggleCart);
        dom.cartIcon.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleCart();
            }
        });
    }
    
    if (dom.closeCart) {
        dom.closeCart.addEventListener('click', toggleCart);
    }
    
    // Mobile menu
    if (dom.mobileMenuBtn) {
        dom.mobileMenuBtn.addEventListener('click', UI.toggleMobileMenu);
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (dom.navLinks && dom.navLinks.classList.contains('active') &&
            !dom.navLinks.contains(e.target) && 
            !dom.mobileMenuBtn.contains(e.target)) {
            UI.closeMobileMenu();
        }
    });
    
    // Back to top
    if (dom.backToTop) {
        dom.backToTop.addEventListener('click', UI.scrollToTop);
    }
    
    // Scroll event for back to top button
    window.addEventListener('scroll', UI.updateBackToTop);
    
    // Close policy modal when clicking overlay
    dom.policyModal.addEventListener('click', (e) => {
        if (e.target === dom.policyModal) {
            closePolicy();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (dom.cartSidebar.classList.contains('active')) {
                toggleCart();
            }
            if (dom.policyModal.style.display === 'block') {
                closePolicy();
            }
            UI.closeMobileMenu();
        }
    });
    
    // Prevent body scroll when cart is open
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                document.body.style.overflow = 
                    dom.cartSidebar.classList.contains('active') ? 'hidden' : '';
            }
        });
    });
    
    observer.observe(dom.cartSidebar, { attributes: true });
}

function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('success') === 'true') {
        state.clearCart();
        renderCart();
        UI.showNotification('Payment successful! Thank you for your order.', 'success');
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
        UI.showNotification('Payment was canceled. Your cart is still saved.', 'info');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// ==========================================
// START APPLICATION
// ==========================================

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);

// Make functions available globally for onclick handlers
window.filterByCategory = filterByCategory;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.changeDeliveryZone = changeDeliveryZone;
window.toggleCart = toggleCart;
window.checkoutWithWhatsApp = checkoutWithWhatsApp;
window.checkoutWithStripe = checkoutWithStripe;
window.openPolicy = openPolicy;
window.closePolicy = closePolicy;
window.toggleAbout = toggleAbout;
window.searchProducts = searchProducts;
window.clearSearch = clearSearch;
window.loadMoreProducts = loadMoreProducts;
window.UI = UI;
