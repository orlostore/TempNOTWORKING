// Products - Fetches from D1 database via API

let products = [];

// Cache settings
const CACHE_KEY = 'orlo_products_cache';
const CACHE_TIME_KEY = 'orlo_products_cache_time';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Load from cache (instant)
function loadFromCache() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            products = JSON.parse(cached);
            console.log('⚡ Loaded', products.length, 'products from cache');
            return true;
        }
    } catch (e) {
        console.log('No cache available');
    }
    return false;
}

// Save to cache
function saveToCache(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
        console.log('Could not save to cache');
    }
}

// Check if cache is expired
function isCacheExpired() {
    const cacheTime = localStorage.getItem(CACHE_TIME_KEY);
    if (!cacheTime) return true;
    return (Date.now() - parseInt(cacheTime)) > CACHE_DURATION;
}

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
        saveToCache(newProducts);
        
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
    // Step 1: Load from cache instantly
    const hasCache = loadFromCache();
    
    // Step 2: Show cached products immediately
    if (hasCache) {
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
    }

    // Step 3: Fetch fresh data
    const freshProducts = await fetchProducts();

    if (freshProducts && freshProducts.length > 0) {
        if (hasCache) {
            updateUIIfNeeded(freshProducts);
        } else {
            products = freshProducts;
            saveToCache(freshProducts);

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
        }
        window.dispatchEvent(new Event('productsReady'));
    }
}

// Auto-init
initProducts();
