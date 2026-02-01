// Google Sheets CSV URL
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRPRs_Wd4lFMv_WF6qfxHffAauQ8DoWvrPAIgs0vmz4m1lwBvIwqe0pLcsQc2PcA4xo96IsP5J0v50L/pub?output=csv';

// Cache settings
const CACHE_KEY = 'orlo_products_cache';
const CACHE_TIME_KEY = 'orlo_products_cache_time';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Products array - will be populated from cache or Google Sheets
let products = [];

// Parse CSV to array of objects
function parseCSV(csv) {
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Handle CSV with quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    data.push(obj);
  }
  return data;
}

// Convert sheet row to product object
function rowToProduct(row, index) {
  // Build images array
  const images = [];
  if (row.mainImage) images.push(row.mainImage);
  if (row.image2) images.push(row.image2);
  if (row.image3) images.push(row.image3);
  if (row.image4) images.push(row.image4);
  if (row.image5) images.push(row.image5);
  
  // If no images, use placeholder emoji
  if (images.length === 0) {
    images.push('📦');
  }
  
  // Parse specifications (split by |)
  const specs = row.specifications ? row.specifications.split('|').map(s => s.trim()).filter(s => s) : [];
  const specsAr = row.specificationsAr ? row.specificationsAr.split('|').map(s => s.trim()).filter(s => s) : [];
  
  return {
    id: index + 1,
    name: row.name || '',
    nameAr: row.nameAR || row.nameAr || '',
    slug: row.slug || '',
    description: row.description || '',
    descriptionAr: row.descriptionAr || '',
    detailedDescription: row.description || '',
    detailedDescriptionAr: row.descriptionAr || '',
    price: parseFloat(row.price) || 0,
    category: row.category || 'Workspace',
    categoryAr: row.categoryAr || row.categoryAR || '',
    featured: row.featured === '1' || row.featured === 'true' || row.featured === 'TRUE',
    image: images[0],
    images: images,
    colors: row.colors || '',
    colorsAr: row.colorsAR || row.colorsAr || '',
    packaging: row.packaging || '',
    packagingAr: row.packagingAr || '',
    specifications: specs,
    specificationsAr: specsAr,
    quantity: parseInt(row.quantity) || 0
  };
}

// Load from cache (instant)
function loadFromCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      products = JSON.parse(cached);
      console.log('⚡ Loaded', products.length, 'products from cache (instant!)');
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
    console.log('💾 Saved', data.length, 'products to cache');
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

// Fetch fresh products from Google Sheets
async function fetchFreshProducts() {
  try {
    const response = await fetch(SHEET_URL);
    const csv = await response.text();
    const rows = parseCSV(csv);
    
    const freshProducts = rows
      .filter(row => row.name && row.name.trim())
      .map((row, index) => rowToProduct(row, index));
    
    console.log('🌐 Fetched', freshProducts.length, 'products from Google Sheets');
    return freshProducts;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return null;
  }
}

// Update UI if products changed
function updateUIIfNeeded(newProducts) {
  // Check if products changed
  const oldJSON = JSON.stringify(products);
  const newJSON = JSON.stringify(newProducts);
  
  if (oldJSON !== newJSON) {
    products = newProducts;
    saveToCache(newProducts);
    
    // Refresh UI
    if (typeof createCategoryFilters === 'function') {
      createCategoryFilters();
    }
    if (typeof loadProducts === 'function') {
      loadProducts();
    }
    console.log('🔄 Products updated!');
  } else {
    console.log('✅ Products unchanged');
  }
}

// Main initialization
async function initProducts() {
  // Step 1: Load from cache INSTANTLY
  const hasCache = loadFromCache();
  
  // Step 2: Show cached products immediately
  if (hasCache) {
    if (typeof createCategoryFilters === 'function') {
      createCategoryFilters();
    }
    if (typeof loadProducts === 'function') {
      loadProducts();
    }
    if (typeof updateCart === 'function') {
      updateCart();
    }
  }
  
  // Step 3: Fetch fresh data in background
  const freshProducts = await fetchFreshProducts();
  
  if (freshProducts && freshProducts.length > 0) {
    if (hasCache) {
      // Update only if changed
      updateUIIfNeeded(freshProducts);
    } else {
      // First load - set products and update UI
      products = freshProducts;
      saveToCache(freshProducts);
      
      if (typeof createCategoryFilters === 'function') {
        createCategoryFilters();
      }
      if (typeof loadProducts === 'function') {
        loadProducts();
      }
      if (typeof updateCart === 'function') {
        updateCart();
      }
    }
  }
}

// Auto-init when script loads
initProducts();
