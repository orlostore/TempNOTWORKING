// Get product slug from URL
const params = new URLSearchParams(window.location.search);
const slug = params.get("product");

// Convert number to Arabic numerals
function toArabicNumerals(num) {
  const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).split('').map(d => arabicNums[parseInt(d)] || d).join('');
}

// Wait for products to load, then display
async function initProductPage() {// Products - Fetches from D1 database via API

let products = [];

// Cache settings
const CACHE_KEY = 'orlo_products_cache';
const CACHE_TIME_KEY = 'orlo_products_cache_time';
const CACHE_DURATION = 60 * 1000; // 1 minute (shorter since D1 is fast)

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
    try {
        const response = await fetch('/api/products');
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
            loadProducts();
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
            loadProducts();
        }
        if (typeof updateCart === 'function') {
            updateCart();
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
                loadProducts();
            }
            if (typeof updateCart === 'function') {
                updateCart();
            }
        }
    }
}

// Auto-init
initProducts();
  // Wait for products to be loaded from Google Sheets
  let attempts = 0;
  while (products.length === 0 && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  // Find product
  const product = products.find(p => p.slug === slug);

  if (!product) {
    document.body.innerHTML = "<h2 style='text-align:center;padding:2.4rem;'>Product not found</h2>";
    return;
  }

  // Get threshold from app.js (will be available after app.js loads)
  const threshold = typeof FREE_DELIVERY_THRESHOLD !== 'undefined' ? FREE_DELIVERY_THRESHOLD : 75;
  
  // Update all threshold displays
  document.querySelectorAll('.threshold-value').forEach(el => el.textContent = threshold);
  document.querySelectorAll('.threshold-value-ar').forEach(el => el.textContent = toArabicNumerals(threshold));

  // =====================
  // DESKTOP VERSION
  // =====================
  document.getElementById("productTitle").innerText = product.name;
  document.getElementById("productCategory").innerText = product.category;

  // Build detailed description with two-column bilingual layout
  let descriptionHTML = '';
  
  // 1. Description
  const descEn = product.detailedDescription || product.description || '';
  const descAr = product.detailedDescriptionAr || product.descriptionAr || '';
  if (descEn || descAr) {
    descriptionHTML += `
      <div class="product-desc-block">
        <div class="product-desc-en">
          <div class="product-desc-label">Description</div>
          <div class="product-desc-value">${descEn}</div>
        </div>
        <div class="product-desc-ar">
          <div class="product-desc-label">معلومات المنتج</div>
          <div class="product-desc-value">${descAr}</div>
        </div>
      </div>
    `;
  }

  // 2. Colors
  if (product.colors || product.colorsAr) {
    descriptionHTML += `
      <div class="product-desc-block">
        <div class="product-desc-en">
          <div class="product-desc-label">Available Colors</div>
          <div class="product-desc-value">${product.colors || ''}</div>
        </div>
        <div class="product-desc-ar">
          <div class="product-desc-label">الألوان المتاحة</div>
          <div class="product-desc-value">${product.colorsAr || ''}</div>
        </div>
      </div>
    `;
  }

  // 3. Packaging
  if (product.packaging || product.packagingAr) {
    descriptionHTML += `
      <div class="product-desc-block">
        <div class="product-desc-en">
          <div class="product-desc-label">Packaging</div>
          <div class="product-desc-value">${product.packaging || ''}</div>
        </div>
        <div class="product-desc-ar">
          <div class="product-desc-label">التعبئة والتغليف</div>
          <div class="product-desc-value">${product.packagingAr || ''}</div>
        </div>
      </div>
    `;
  }

  // 4. Specifications
  if ((product.specifications && product.specifications.length > 0) || (product.specificationsAr && product.specificationsAr.length > 0)) {
    descriptionHTML += `
      <div class="product-desc-block">
        <div class="product-desc-en">
          <div class="product-desc-label">Specifications</div>
          <div class="product-desc-value">${product.specifications ? product.specifications.join('<br>') : ''}</div>
        </div>
        <div class="product-desc-ar">
          <div class="product-desc-label">المواصفات</div>
          <div class="product-desc-value">${product.specificationsAr ? product.specificationsAr.join('<br>') : ''}</div>
        </div>
      </div>
    `;
  }

  document.getElementById("productDescription").innerHTML = descriptionHTML;
  document.getElementById("productPrice").innerText = "AED " + product.price;

  // Desktop gallery
  const gallery = document.getElementById("gallery");
  if (product.images && product.images.length > 0) {
    const isEmoji = !product.images[0].startsWith('http');
    
    if (isEmoji) {
      gallery.innerHTML = `
        <div class="image-gallery">
          <div class="main-image-container" style="font-size: 100px; display: flex; align-items: center; justify-content: center; min-height: 350px;">
            ${product.images[0]}
          </div>
        </div>
      `;
    } else {
      // Only show thumbnails if more than 1 image
      const thumbnailsHTML = product.images.length > 1 ? `
        <div class="thumbnail-strip">
          ${product.images.map((img, index) => `
            <img src="${img}" 
                 alt="${product.name} ${index + 1}" 
                 class="thumbnail ${index === 0 ? 'active' : ''}" 
                 onclick="changeMainImage('${img}', ${index})"
                 style="object-fit:contain;">
          `).join('')}
        </div>
      ` : '';
      
      gallery.innerHTML = `
        <div class="image-gallery">
          <div class="main-image-container">
            <img id="mainImage" src="${product.images[0]}" alt="${product.name}" class="main-product-image">
            <div class="zoom-hint">🔍 Click to zoom</div>
          </div>
          ${thumbnailsHTML}
        </div>
      `;
    }
  }

  // =====================
  // MOBILE VERSION
  // =====================
  document.getElementById("mobileProductTitle").innerText = product.name;
  document.getElementById("mobileProductTitleAr").innerText = product.nameAr || '';
  document.getElementById("mobileProductCategory").innerText = product.category;
  document.getElementById("mobileProductPrice").innerText = "AED " + product.price;

  // Mobile carousel
  const mobileCarousel = document.getElementById("mobileCarousel");
  const mobileDots = document.getElementById("mobileDots");
  
  if (product.images && product.images.length > 0) {
    const isEmoji = !product.images[0].startsWith('http');
    
    if (isEmoji) {
      mobileCarousel.innerHTML = `
        <div class="mobile-carousel-slide">
          <div style="font-size: 80px;">${product.images[0]}</div>
        </div>
      `;
      mobileDots.innerHTML = '<div class="mobile-dot active"></div>';
    } else {
      // Create slides
      mobileCarousel.innerHTML = product.images.map((img, index) => `
        <div class="mobile-carousel-slide" data-index="${index}">
          <img src="${img}" alt="${product.name} ${index + 1}">
        </div>
      `).join('');
      
      // Create dots
      mobileDots.innerHTML = product.images.map((_, index) => `
        <div class="mobile-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
      `).join('');
      
      // Setup carousel scroll detection
      setupMobileCarousel();
      
      // Setup gallery click
      setupGalleryOverlay(product);
    }
  }

  // =====================
  // MOBILE DETAILS SECTION (Description, Colors, Packaging, Specs - in order)
  // =====================
  const detailsContainer = document.getElementById("mobileDetailsSection");
  let detailsHTML = '';

  // 1. Description (always show if available)
  const mobileDescEn = product.detailedDescription || product.description || '';
  const mobileDescAr = product.detailedDescriptionAr || product.descriptionAr || '';
  
  if (mobileDescEn || mobileDescAr) {
    detailsHTML += `
      <div class="mobile-detail-block">
        <div class="mobile-detail-title">
          <span>Description</span>
          <span class="arabic-text">معلومات المنتج</span>
        </div>
        <div class="mobile-detail-content">
          <p>${mobileDescEn}</p>
          <p class="arabic-text">${mobileDescAr}</p>
        </div>
      </div>
    `;
  }

  // 2. Colors (if available)
  if (product.colors) {
    detailsHTML += `
      <div class="mobile-detail-block">
        <div class="mobile-detail-title">
          <span>Available Colors</span>
          <span class="arabic-text">الألوان المتاحة</span>
        </div>
        <div class="mobile-detail-content">
          <p>${product.colors}</p>
          <p class="arabic-text">${product.colorsAr || ''}</p>
        </div>
      </div>
    `;
  }

  // 3. Packaging (if available)
  if (product.packaging) {
    detailsHTML += `
      <div class="mobile-detail-block">
        <div class="mobile-detail-title">
          <span>Packaging</span>
          <span class="arabic-text">التعبئة والتغليف</span>
        </div>
        <div class="mobile-detail-content">
          <p>${product.packaging}</p>
          <p class="arabic-text">${product.packagingAr || ''}</p>
        </div>
      </div>
    `;
  }

  // 4. Specifications (if available)
  if (product.specifications && product.specifications.length > 0) {
    detailsHTML += `
      <div class="mobile-detail-block">
        <div class="mobile-detail-title">
          <span>Specifications</span>
          <span class="arabic-text">المواصفات</span>
        </div>
        <div class="mobile-detail-content">
          <p>${product.specifications.join('<br>')}</p>
          <p class="arabic-text">${product.specificationsAr ? product.specificationsAr.join('<br>') : ''}</p>
        </div>
      </div>
    `;
  }

  if (detailsContainer) {
    detailsContainer.innerHTML = detailsHTML;
  }

  // =====================
  // ADD TO CART BUTTONS
  // =====================
  const addToCartHandler = () => {
    // Get current cart from localStorage
    let localCart = JSON.parse(localStorage.getItem("cart")) || [];
    const item = localCart.find(i => i.id === product.id);
    
    if (item) {
      item.quantity++;
    } else {
      localCart.push({ ...product, quantity: 1 });
    }
    
    // Save to localStorage
    localStorage.setItem("cart", JSON.stringify(localCart));
    
    // IMPORTANT: Sync app.js cart variable with localStorage
    // This is needed because app.js has its own cart variable
    if (typeof cart !== 'undefined') {
      // Clear and repopulate the app.js cart array
      cart.length = 0;
      localCart.forEach(item => cart.push(item));
    }
    
    // Update cart counts
    const totalItems = localCart.reduce((s, i) => s + i.quantity, 0);
    const cartCount = document.getElementById("cartCount");
    const bottomCartCount = document.getElementById("bottomCartCount");
    if (cartCount) cartCount.textContent = totalItems;
    if (bottomCartCount) bottomCartCount.textContent = totalItems;
    
    // Update cart display immediately (from app.js)
    if (typeof updateCart === 'function') {
      updateCart();
    }
    
    return true;
  };

  // Desktop button
  document.getElementById("addToCartBtn").onclick = function() {
    addToCartHandler();
    const btn = this;
    const originalText = btn.textContent;
    btn.textContent = "✓ Added!";
    btn.style.background = "#28a745";
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = "";
    }, 2000);
  };

  // Mobile button
  document.getElementById("mobileAddToCartBtn").onclick = function() {
    addToCartHandler();
    const btn = this;
    const originalText = btn.textContent;
    btn.textContent = "✓ Added! | تمت الإضافة";
    btn.style.background = "#28a745";
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = "";
    }, 2000);
  };

  // Desktop lightbox - Enhanced version with product info
  const mainImg = document.getElementById('mainImage');
  if (mainImg) {
    mainImg.style.cursor = 'zoom-in';
    mainImg.onclick = () => {
      openEnhancedLightbox(product, 0);
    };
  }
}

// Enhanced Lightbox with product info, thumbnails, and arrows
function openEnhancedLightbox(product, startIndex) {
  let currentIndex = startIndex;
  const images = product.images;
  
  // Build info HTML - Two column layout (English left, Arabic right)
  let infoHTML = `
    <div class="lightbox-title-row">
      <div class="lightbox-title">${product.name}</div>
      <div class="lightbox-title-ar">${product.nameAr || ''}</div>
    </div>
    <div class="lightbox-divider"></div>
  `;
  
  // 1. Description (first - what is the product?)
  const lbDescEn = product.detailedDescription || product.description;
  const lbDescAr = product.detailedDescriptionAr || product.descriptionAr;
  if (lbDescEn || lbDescAr) {
    infoHTML += `
      <div class="lightbox-detail-block">
        <div class="lightbox-detail-en">
          <div class="lightbox-detail-label">Description</div>
          <div class="lightbox-detail-value">${lbDescEn || ''}</div>
        </div>
        <div class="lightbox-detail-ar">
          <div class="lightbox-detail-label">معلومات المنتج</div>
          <div class="lightbox-detail-value">${lbDescAr || ''}</div>
        </div>
      </div>
    `;
  }
  
  // 2. Colors
  if (product.colors || product.colorsAr) {
    infoHTML += `
      <div class="lightbox-detail-block">
        <div class="lightbox-detail-en">
          <div class="lightbox-detail-label">Available Colors</div>
          <div class="lightbox-detail-value">${product.colors || ''}</div>
        </div>
        <div class="lightbox-detail-ar">
          <div class="lightbox-detail-label">الألوان المتاحة</div>
          <div class="lightbox-detail-value">${product.colorsAr || ''}</div>
        </div>
      </div>
    `;
  }
  
  // 3. Packaging
  if (product.packaging || product.packagingAr) {
    infoHTML += `
      <div class="lightbox-detail-block">
        <div class="lightbox-detail-en">
          <div class="lightbox-detail-label">Packaging</div>
          <div class="lightbox-detail-value">${product.packaging || ''}</div>
        </div>
        <div class="lightbox-detail-ar">
          <div class="lightbox-detail-label">التعبئة والتغليف</div>
          <div class="lightbox-detail-value">${product.packagingAr || ''}</div>
        </div>
      </div>
    `;
  }
  
  // 4. Specifications (last - technical details)
  if ((product.specifications && product.specifications.length > 0) || (product.specificationsAr && product.specificationsAr.length > 0)) {
    infoHTML += `
      <div class="lightbox-detail-block">
        <div class="lightbox-detail-en">
          <div class="lightbox-detail-label">Specifications</div>
          <div class="lightbox-detail-value">${product.specifications ? product.specifications.join('<br>') : ''}</div>
        </div>
        <div class="lightbox-detail-ar">
          <div class="lightbox-detail-label">المواصفات</div>
          <div class="lightbox-detail-value">${product.specificationsAr ? product.specificationsAr.join('<br>') : ''}</div>
        </div>
      </div>
    `;
  }
  
  // Build thumbnails HTML
  const thumbnailsHTML = images.length > 1 ? `
    <div class="lightbox-thumbnails">
      ${images.map((img, i) => `
        <div class="lightbox-thumb ${i === currentIndex ? 'active' : ''}" data-index="${i}">
          <img src="${img}" alt="Thumbnail ${i + 1}">
        </div>
      `).join('')}
    </div>
  ` : '';
  
  // Build arrows HTML (only if multiple images)
  const arrowsHTML = images.length > 1 ? `
    <button class="lightbox-arrow prev">‹</button>
    <button class="lightbox-arrow next">›</button>
  ` : '';
  
  // Counter HTML
  const counterHTML = images.length > 1 ? `
    <div class="lightbox-counter">${currentIndex + 1} / ${images.length}</div>
  ` : '';
  
  // Create lightbox
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <button class="lightbox-close">×</button>
    <div class="lightbox-content">
      <div class="lightbox-image-section">
        <div class="lightbox-main-image">
          ${arrowsHTML}
          <img src="${images[currentIndex]}" alt="${product.name}" id="lightboxMainImg">
          ${counterHTML}
        </div>
        ${thumbnailsHTML}
      </div>
      <div class="lightbox-info-section">
        ${infoHTML}
      </div>
    </div>
  `;
  
  document.body.appendChild(lightbox);
  document.body.style.overflow = 'hidden';
  
  // Get elements
  const lightboxImg = document.getElementById('lightboxMainImg');
  const lightboxMainImageContainer = lightbox.querySelector('.lightbox-main-image');
  const counter = lightbox.querySelector('.lightbox-counter');
  const thumbs = lightbox.querySelectorAll('.lightbox-thumb');
  
  // Click to toggle 2x zoom
  let isZoomed = false;
  
  lightboxMainImageContainer.addEventListener('click', (e) => {
    // Don't zoom if clicking on arrows
    if (e.target.classList.contains('lightbox-arrow')) return;
    
    isZoomed = !isZoomed;
    
    if (isZoomed) {
      lightboxImg.style.transform = 'scale(2)';
      lightboxImg.style.cursor = 'zoom-out';
      // Set initial position based on click
      const rect = lightboxMainImageContainer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      lightboxImg.style.transformOrigin = `${x}% ${y}%`;
    } else {
      lightboxImg.style.transform = 'scale(1)';
      lightboxImg.style.cursor = 'zoom-in';
      lightboxImg.style.transformOrigin = 'center center';
    }
  });
  
  lightboxMainImageContainer.addEventListener('mousemove', (e) => {
    if (!isZoomed) return;
    
    const rect = lightboxMainImageContainer.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    lightboxImg.style.transformOrigin = `${x}% ${y}%`;
  });
  
  // Update image function
  const updateImage = (index) => {
    currentIndex = index;
    lightboxImg.src = images[currentIndex];
    if (counter) counter.textContent = `${currentIndex + 1} / ${images.length}`;
    
    // Update active thumbnail
    thumbs.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === currentIndex);
    });
  };
  
  // Arrow click handlers
  const prevBtn = lightbox.querySelector('.lightbox-arrow.prev');
  const nextBtn = lightbox.querySelector('.lightbox-arrow.next');
  
  if (prevBtn) {
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
      updateImage(newIndex);
    };
  }
  
  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
      updateImage(newIndex);
    };
  }
  
  // Thumbnail click handlers
  thumbs.forEach((thumb, i) => {
    thumb.onclick = (e) => {
      e.stopPropagation();
      updateImage(i);
    };
  });
  
  // Keyboard navigation
  const handleKeydown = (e) => {
    if (e.key === 'ArrowLeft' && images.length > 1) {
      const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
      updateImage(newIndex);
    } else if (e.key === 'ArrowRight' && images.length > 1) {
      const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
      updateImage(newIndex);
    } else if (e.key === 'Escape') {
      closeLightbox();
    }
  };
  
  document.addEventListener('keydown', handleKeydown);
  
  // Close function
  const closeLightbox = () => {
    document.body.removeChild(lightbox);
    document.body.style.overflow = 'auto';
    document.removeEventListener('keydown', handleKeydown);
  };
  
  // Close handlers
  lightbox.querySelector('.lightbox-close').onclick = closeLightbox;
  lightbox.onclick = (e) => {
    if (e.target === lightbox) closeLightbox();
  };
}

// Mobile carousel scroll handler
function setupMobileCarousel() {
  const carousel = document.getElementById('mobileCarousel');
  const dots = document.querySelectorAll('.mobile-dot');
  
  carousel.addEventListener('scroll', () => {
    const scrollLeft = carousel.scrollLeft;
    const slideWidth = carousel.offsetWidth;
    const currentIndex = Math.round(scrollLeft / slideWidth);
    
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  });
  
  // Click on dot to scroll
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      carousel.scrollTo({
        left: index * carousel.offsetWidth,
        behavior: 'smooth'
      });
    });
  });
}

// Gallery overlay (click image to open full gallery)
function setupGalleryOverlay(product) {
  const carousel = document.getElementById('mobileCarousel');
  const overlay = document.getElementById('galleryOverlay');
  const galleryScroll = document.getElementById('galleryScroll');
  const closeBtn = document.getElementById('galleryClose');
  const bottomNav = document.getElementById('mobileBottomNav');
  
  // Click on carousel to open gallery
  carousel.addEventListener('click', () => {
    // Build vertical gallery
    galleryScroll.innerHTML = product.images.map((img, index) => `
      <div class="gallery-image-wrapper">
        <img src="${img}" alt="${product.name} ${index + 1}">
      </div>
    `).join('');
    
    // Show overlay, hide bottom nav
    overlay.classList.add('active');
    if (bottomNav) bottomNav.style.display = 'none';
    document.body.style.overflow = 'hidden';
  });
  
  // Close gallery
  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('active');
    if (bottomNav) bottomNav.style.display = '';
    document.body.style.overflow = '';
  });
  
  // Also close on overlay background click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      if (bottomNav) bottomNav.style.display = '';
      document.body.style.overflow = '';
    }
  });
}

// Change main image (desktop)
window.changeMainImage = function(imgSrc, index) {
  const mainImg = document.getElementById('mainImage');
  mainImg.src = imgSrc;
  
  document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === index);
  });
};

// =====================
// SEARCH FUNCTIONALITY
// =====================
function setupSearch() {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  
  const doSearch = () => {
    const term = searchInput.value.trim();
    if (term) {
      // Redirect to index.html with search parameter
      window.location.href = `index.html?search=${encodeURIComponent(term)}`;
    } else {
      window.location.href = 'index.html';
    }
  };
  
  if (searchBtn) {
    searchBtn.onclick = doSearch;
  }
  
  if (searchInput) {
    searchInput.onkeypress = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSearch();
      }
    };
  }
}

// =====================
// CART TOGGLE FUNCTIONALITY (shared by mobile and desktop)
// =====================
function toggleCartSidebar() {
  const cartSidebar = document.getElementById('cartSidebar');
  const bottomCartBtn = document.getElementById('bottomCartBtn');
  const bottomHomeBtn = document.getElementById('bottomHomeBtn');
  
  if (cartSidebar) {
    cartSidebar.classList.toggle('active');
    
    if (cartSidebar.classList.contains('active')) {
      if (bottomCartBtn) bottomCartBtn.classList.add('cart-active');
      if (bottomHomeBtn) bottomHomeBtn.classList.remove('home-active');
      // Update cart display
      if (typeof updateCart === 'function') {
        updateCart();
      }
    } else {
      if (bottomCartBtn) bottomCartBtn.classList.remove('cart-active');
    }
  }
}

// =====================
// BOTTOM NAV FUNCTIONALITY
// =====================
function setupBottomNav() {
  const bottomHomeBtn = document.getElementById('bottomHomeBtn');
  const bottomCartBtn = document.getElementById('bottomCartBtn');
  const bottomMenuBtn = document.getElementById('bottomMenuBtn');
  const cartSidebar = document.getElementById('cartSidebar');
  
  // Home button - go to index.html
  if (bottomHomeBtn) {
    bottomHomeBtn.onclick = function() {
      window.location.href = 'index.html';
    };
  }
  
  // Cart button - toggle cart sidebar
  if (bottomCartBtn) {
    bottomCartBtn.onclick = toggleCartSidebar;
  }
  
  // Menu button - show mobile menu overlay
  if (bottomMenuBtn) {
    bottomMenuBtn.onclick = function() {
      // Close cart if open
      if (cartSidebar && cartSidebar.classList.contains('active')) {
        cartSidebar.classList.remove('active');
        if (bottomCartBtn) bottomCartBtn.classList.remove('cart-active');
      }
      
      productPageToggleMobileMenu();
    };
  }
  
  // Close cart button
  const closeCart = document.getElementById('closeCart');
  if (closeCart) {
    closeCart.onclick = function() {
      if (cartSidebar) {
        cartSidebar.classList.remove('active');
        if (bottomCartBtn) bottomCartBtn.classList.remove('cart-active');
      }
    };
  }
  
  // Desktop cart icon (in nav)
  const cartIcon = document.getElementById('cartIcon');
  if (cartIcon) {
    cartIcon.onclick = toggleCartSidebar;
  }
}

// Mobile menu toggle - renamed to avoid conflict with app.js
function productPageToggleMobileMenu() {
  let overlay = document.querySelector('.mobile-menu-overlay');
  
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    overlay.innerHTML = `
      <div class="mobile-menu">
        <a href="index.html#products"><span class="menu-en">🛍️ Shop</span> | <span class="menu-ar">تسوق</span></a>
        <a href="index.html?showAbout=true#about"><span class="menu-en">ℹ️ About</span> | <span class="menu-ar">من نحن</span></a>
        <a href="index.html#contact"><span class="menu-en">📧 Contact</span> | <span class="menu-ar">اتصل بنا</span></a>
        <a href="index.html#terms"><span class="menu-en">📋 Terms</span> | <span class="menu-ar">الشروط</span></a>
      </div>
    `;
    document.body.appendChild(overlay);
    
    // Close when clicking outside the menu
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    };
    
    // Add click handlers to menu links
    overlay.querySelectorAll('.mobile-menu a').forEach(link => {
      link.onclick = () => {
        overlay.classList.remove('active');
      };
    });
  }
  
  overlay.classList.toggle('active');
}

// =====================
// INITIALIZE
// =====================
window.addEventListener('DOMContentLoaded', () => {
  // Update cart count
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  
  const cartCount = document.getElementById("cartCount");
  const bottomCartCount = document.getElementById("bottomCartCount");
  if (cartCount) cartCount.textContent = totalItems;
  if (bottomCartCount) bottomCartCount.textContent = totalItems;
  
  // Setup search
  setupSearch();
  
  // Setup bottom nav
  setupBottomNav();
});

// Start loading product page
initProductPage();
