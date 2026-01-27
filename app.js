/* ============================================================
   ORLO - CORE APPLICATION LOGIC
   ============================================================ */

// 1. GLOBAL STATE
let cart = JSON.parse(localStorage.getItem('orlo_cart')) || [];

// 2. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    renderCategories();
    updateCartCount();
    setupSearch();
    
    // Check if we are on a mobile device to apply specific behavior
    if (window.innerWidth <= 514.56) {
        setupMobileHero();
    }
});

// 3. PRODUCT RENDERING
function renderProducts(filter = 'all', searchQuery = '') {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    let filtered = products;

    if (filter !== 'all') {
        filtered = products.filter(p => p.category === filter);
    }

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.nameAr.includes(query) ||
            p.description.toLowerCase().includes(query)
        );
    }

    grid.innerHTML = filtered.map(product => `
        <div class="product-card" onclick="window.location.href='product.html?id=${product.id}'">
            ${product.featured ? '<span class="badge">Best Seller</span>' : ''}
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" style="width:100%; height:100%; object-fit:contain;">
            </div>
            <div class="product-info">
                <small>${product.category}</small>
                <h3 class="product-title">${product.name}</h3>
                <p>${product.description}</p>
                <div class="product-price">${product.price} AED</div>
                <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${product.id})">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// 4. CATEGORY LOGIC
function renderCategories() {
    const container = document.getElementById('categoryFilters');
    if (!container) return;

    const categories = ['all', ...new Set(products.map(p => p.category))];
    
    container.innerHTML = categories.map(cat => {
        const trans = categoryTranslations[cat] || { en: cat, ar: cat };
        return `
            <button class="category-btn ${cat === 'all' ? 'active' : ''}" onclick="filterByCategory('${cat}', this)">
                ${trans.en}
                <span class="category-arabic">${trans.ar}</span>
            </button>
        `;
    }).join('');
}

function filterByCategory(category, btn) {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(category);
}

// 5. CART LOGIC
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCartCount();
    
    // Show a smaller, subtle notification for mobile
    showCartNotification(product.name);
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Updates the Desktop Icon AND the new Mobile Bottom Bar Icon
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
        if (sidebar.classList.contains('active')) renderCartItems();
    }
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:2rem;">Your cart is empty.</p>';
        updateTotals(0);
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div style="flex:1">
                <h4>${item.name}</h4>
                <p>${item.price} AED x ${item.quantity}</p>
            </div>
            <div class="quantity-controls">
                <button onclick="changeQty(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="changeQty(${item.id}, 1)">+</button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    updateTotals(total);
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        saveCart();
        updateCartCount();
        renderCartItems();
    }
}

function saveCart() {
    localStorage.setItem('orlo_cart', JSON.stringify(cart));
}

function updateTotals(total) {
    const totalEl = document.getElementById('cartTotalAmount');
    if (totalEl) totalEl.textContent = total + ' AED';
}

// 6. SEARCH LOGIC
function setupSearch() {
    const input = document.getElementById('searchInput');
    if (input) {
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }
}

function handleSearch() {
    const query = document.getElementById('searchInput').value;
    renderProducts('all', query);
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

// 7. NEW MOBILE-SPECIFIC FUNCTIONS
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

function setupMobileHero() {
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.addEventListener('click', () => {
            // Optional: Toggle full description on click
            hero.classList.toggle('expanded');
        });
    }
}

function showCartNotification(productName) {
    // Create a temporary small toast notification
    const toast = document.createElement('div');
    toast.className = 'cart-notification';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--primary);
        color: white;
        padding: 10px 20px;
        border-radius: 25px;
        font-size: 12px;
        z-index: 10001;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    `;
    toast.textContent = `Added: ${productName}`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 2000);
}

// 8. WHATSAPP CHECKOUT
function checkoutWhatsApp() {
    if (cart.length === 0) return;

    let message = "New Order from ORLO:\n\n";
    cart.forEach(item => {
        message += `• ${item.name} (x${item.quantity}) - ${item.price * item.quantity} AED\n`;
    });
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `\nTotal: ${total} AED`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/971XXXXXXXXX?text=${encoded}`, '_blank');
}
