// Products - Fetches from D1 database via API

let products = [];

// Clean up legacy localStorage cache
try { localStorage.removeItem('orlo_products_cache'); localStorage.removeItem('orlo_products_cache_time'); } catch(e) {}

// Fetch products from D1 API
async function fetchProducts() {
    // Use server-injected bootstrap data if available — no API call needed
    if (window.__BOOTSTRAP_DATA__) {
        const data = window.__BOOTSTRAP_DATA__;
        window.__BOOTSTRAP_DATA__ = null;
        console.log('🚀 Loaded', data.length, 'products from bootstrap');
        return data;
    }
    try {
        const response = await (window._productsFetch || fetch('/api/products'));
        window._productsFetch = null;
        const data = await response.json();
        
        if (Array.isArray(data)) {
            console.log('🌐 Fetched', data.length, 'products from D1');
            return data;
        }
        return null;
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        return null;
    }
}

// Update UI if products changed
function updateUIIfNeeded(newProducts) {
    const oldJSON = JSON.stringify(products);
    const newJSON = JSON.stringify(newProducts);
    
    if (oldJSON !== newJSON) {
        products = newProducts;

        if (typeof createCategoryFilters === 'function') {
            createCategoryFilters();
        }
        if (typeof loadProducts === 'function') {
            loadProducts(typeof selectedCategory !== 'undefined' ? selectedCategory : 'All Products');
        }
        if (typeof populateHomepageSections === 'function') {
            populateHomepageSections();
        }
        console.log('🔄 Products updated!');
    }
}

// Main initialization
async function initProducts() {
    const freshProducts = await fetchProducts();

    if (freshProducts && freshProducts.length > 0) {
        products = freshProducts;

        if (typeof createCategoryFilters === 'function') {
            createCategoryFilters();
        }
        if (typeof loadProducts === 'function') {
            loadProducts(typeof selectedCategory !== 'undefined' ? selectedCategory : 'All Products');
        }
        if (typeof updateCart === 'function') {
            updateCart();
        }
        if (typeof populateHomepageSections === 'function') {
            populateHomepageSections();
        }
        window.dispatchEvent(new Event('productsReady'));
    }
}

// Auto-init
initProducts();
