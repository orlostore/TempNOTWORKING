const WHATSAPP_NUMBER = "971XXXXXXXXX";

// 1. Specific categories aligned to your request
const displayCategories = [
    { id: 'all', label: 'All products', labelAr: 'كل المنتجات' },
    { id: 'Lights', label: 'Lights', labelAr: 'إضاءة' },
    { id: 'Home', label: 'Home', labelAr: 'المنزل' },
    { id: 'Workspace', label: 'Workplace', labelAr: 'مكان العمل' }
];

function createCategoryFilters() {
    const filterContainer = document.querySelector('.category-filters');
    if (!filterContainer) return;

    const displayCategories = [
        { id: 'all', label: 'All products', labelAr: 'كل المنتجات' },
        { id: 'Home', label: 'Home', labelAr: 'المنزل' },
        { id: 'Workspace', label: 'Workplace', labelAr: 'مكان العمل' },
        { id: 'Cable Management', label: 'Cable Management', labelAr: 'تنظيم الكابلات' },
        { id: 'Silicon Ware', label: 'Silicon Ware', labelAr: 'منتجات السيليكون' }
    ];

    filterContainer.innerHTML = displayCategories.map(cat => `
        <button class="filter-btn ${cat.id === 'all' ? 'active' : ''}" 
                onclick="filterByCategory('${cat.id}', this)">
            <span class="eng-text">${cat.label}</span>
            <span class="arabic-text">${cat.labelAr}</span>
        </button>
    `).join('');
}

function filterByCategory(category, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.style.opacity = '0';
    setTimeout(() => {
        const filtered = category === 'all' ? products : products.filter(p => p.category === category);
        renderProducts(filtered);
        grid.style.opacity = '1';
    }, 200);
}

function renderProducts(productsToRender) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = productsToRender.map(p => `
        <div class="product-card">
            <a href="product.html?product=${p.slug}">
                <div class="product-image">${p.image}</div>
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p class="price">${p.price} AED</p>
                </div>
            </a>
        </div>
    `).join('');
}

function updateCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const desktopCount = document.getElementById("cartCount");
    const mobileCount = document.getElementById("mobileCartCount");
    if (desktopCount) desktopCount.innerText = count;
    if (mobileCount) mobileCount.innerText = count;
}

function toggleCart() {
    document.getElementById("cartSidebar").classList.toggle("open");
}

window.onload = () => {
    createCategoryFilters();
    if (document.getElementById('productsGrid')) renderProducts(products);
    updateCart();

    // Unified Header Logic
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("navLinks");
    if (hamburger && navLinks) {
        hamburger.onclick = () => {
            hamburger.classList.toggle("active");
            navLinks.classList.toggle("active");
        };
    }

    const cartIcon = document.getElementById("cartIcon");
    const mobileCartIcon = document.getElementById("mobileCartIcon");
    const closeCart = document.getElementById("closeCart");
    if (cartIcon) cartIcon.onclick = toggleCart;
    if (mobileCartIcon) mobileCartIcon.onclick = toggleCart;
    if (closeCart) closeCart.onclick = toggleCart;
};
