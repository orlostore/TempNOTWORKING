const WHATSAPP_NUMBER = "971XXXXXXXXX";

// ... (Keep your existing deliveryZones and policies constants here)

function createCategoryFilters() {
    const filterContainer = document.querySelector('.category-filters');
    if (!filterContainer) return;

    // Hardcoded categories as requested, anchored to the left
    const displayCategories = [
        { id: 'all', label: 'All products', labelAr: 'كل المنتجات' },
        { id: 'Lights', label: 'Lights', labelAr: 'إضاءة' },
        { id: 'Home', label: 'Home', labelAr: 'المنزل' },
        { id: 'Workspace', label: 'Workplace', labelAr: 'مكان العمل' }
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
    // Visual feedback for active button
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.style.opacity = '0';
    
    setTimeout(() => {
        if (category === 'all') {
            renderProducts(products);
        } else {
            const filtered = products.filter(p => p.category === category);
            renderProducts(filtered);
        }
        grid.style.opacity = '1';
    }, 200);
}

// ... (Keep your existing renderProducts and loadProducts functions here)

window.onload = () => { 
    createCategoryFilters(); 
    if (document.getElementById('productsGrid')) {
        renderProducts(products);
    }
    updateCart(); 
    
    // Header Logic - Fixed to work across all pages
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("navLinks");
    
    if (hamburger && navLinks) {
        hamburger.onclick = () => {
            hamburger.classList.toggle("active");
            navLinks.classList.toggle("active");
        };
    }
    
    // Event listeners for search and cart
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchInput");
    if (searchBtn) searchBtn.onclick = searchProducts; 
    if (searchInput) {
        searchInput.onkeypress = (e) => { if (e.key === "Enter") searchProducts(); };
    }
    
    const cartIcon = document.getElementById("cartIcon");
    const closeCart = document.getElementById("closeCart");
    if (cartIcon) cartIcon.onclick = toggleCart; 
    if (closeCart) closeCart.onclick = toggleCart; 
};
