// Replace your existing createCategoryFilters function with this exact code
function createCategoryFilters() {
    const filterContainer = document.querySelector('.category-filters');
    if (!filterContainer) return;

    // Define the specific categories you requested
    const displayCategories = [
        { id: 'all', label: 'All products', labelAr: 'كل المنتجات' },
        { id: 'Lights', label: 'Lights', labelAr: 'إضاءة' },
        { id: 'Home', label: 'Home', labelAr: 'المنزل' },
        { id: 'Workspace', label: 'Workplace', labelAr: 'مكان العمل' }
    ];

    filterContainer.innerHTML = displayCategories.map(cat => `
        <button class="filter-btn ${cat.id === 'all' ? 'active' : ''}" 
                onclick="filterByCategory('${cat.id}', this)">
            ${cat.label}<br>
            <span class="arabic-text" style="font-size: 0.8rem;">${cat.labelAr}</span>
        </button>
    `).join('');
}

function filterByCategory(category, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const grid = document.getElementById('productsGrid');
    grid.style.opacity = '0';
    
    setTimeout(() => {
        if (category === 'all') {
            loadProducts();
        } else {
            const filtered = products.filter(p => p.category === category);
            renderProducts(filtered);
        }
        grid.style.opacity = '1';
    }, 200);
}
