// Get product slug from URL
const params = new URLSearchParams(window.location.search);
const slug = params.get("product");

// === MAX QUANTITY PER PRODUCT ===
var MAX_QTY_PER_PRODUCT = 10;

// Convert number to Arabic numerals
function toArabicNumerals(num) {
  const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).split('').map(d => arabicNums[parseInt(d)] || d).join('');
}

// Show max limit message (red notification)
function showProductPageMaxLimitMessage() {
    const existing = document.getElementById('maxLimitMsg');
    if (existing) existing.remove();
    
    const msg = document.createElement('div');
    msg.id = 'maxLimitMsg';
    msg.innerHTML = `Maximum ${MAX_QTY_PER_PRODUCT} per item | الحد الأقصى ${MAX_QTY_PER_PRODUCT} لكل منتج`;
    msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#dc3545;color:white;padding:12px 24px;border-radius:8px;z-index:9999;font-size:14px;font-weight:600;box-shadow:0 4px 15px rgba(220,53,69,0.4);text-align:center;';
    document.body.appendChild(msg);
    
    setTimeout(() => {
        if (msg.parentNode) msg.remove();
    }, 3000);
}

// Transform button to quantity control (Premium Glass style)
function transformToQtyButton(btn, product) {
  const localCart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = localCart.find(i => i.id === product.id);
  const qty = item ? item.quantity : 1;
  
  btn.dataset.originalText = btn.textContent;
  btn.dataset.productId = product.id;
  
  btn.outerHTML = `
    <div class="product-btn-transformed" id="transformedBtn-${product.id}">
      <button class="qty-btn minus" onclick="productQtyChange(${product.id}, -1)">−</button>
      <div class="center-section" onclick="if(typeof toggleCart === 'function') toggleCart(); else if(typeof toggleCartSidebar === 'function') toggleCartSidebar();">
        <span class="cart-icon">🛒</span>
        <span class="qty-display" id="qtyDisplay-${product.id}">${qty}</span>
      </div>
      <button class="qty-btn plus" onclick="productQtyChange(${product.id}, 1)">+</button>
    </div>
  `;
}

// Handle quantity change from transformed button
function productQtyChange(productId, change) {
  let localCart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = localCart.find(i => i.id === productId);
  const product = products.find(p => p.id === productId);
  
  if (!item) return;
  
  const newQty = item.quantity + change;
  
  if (change > 0) {
    const maxAllowed = Math.min(MAX_QTY_PER_PRODUCT, product ? product.quantity : MAX_QTY_PER_PRODUCT);
    if (newQty > maxAllowed) {
      showProductPageMaxLimitMessage();
      return;
    }
  }
  
  if (newQty <= 0) {
    localCart = localCart.filter(i => i.id !== productId);
    localStorage.setItem("cart", JSON.stringify(localCart));
    resetToAddButton(productId);
  } else {
    item.quantity = newQty;
    localStorage.setItem("cart", JSON.stringify(localCart));
    
    const qtyDisplay = document.getElementById(`qtyDisplay-${productId}`);
    if (qtyDisplay) qtyDisplay.textContent = newQty;
  }
  
  if (typeof cart !== 'undefined') {
    cart.length = 0;
    localCart.forEach(i => cart.push(i));
  }
  
  const totalItems = localCart.reduce((s, i) => s + i.quantity, 0);
  const cartCount = document.getElementById("cartCount");
  const bottomCartCount = document.getElementById("bottomCartCount");
  const mobileCartCount = document.getElementById("mobileCartCount");
  if (cartCount) cartCount.textContent = totalItems;
  if (bottomCartCount) bottomCartCount.textContent = totalItems;
  if (mobileCartCount) mobileCartCount.textContent = totalItems;
  
  if (typeof updateCart === 'function') updateCart();
}

// Reset transformed button back to Add to Cart
function resetToAddButton(productId) {
  const transformed = document.getElementById(`transformedBtn-${productId}`);
  if (!transformed) return;
  
  const product = products.find(p => p.id === productId);
  const isMobile = transformed.closest('.mobile-product-page') !== null;
  const btnId = isMobile ? 'mobileAddToCartBtn' : 'addToCartBtn';
  const btnClass = isMobile ? 'mobile-add-to-cart' : 'add-to-cart-btn';
  
  transformed.outerHTML = `<button class="${btnClass}" id="${btnId}">Add to Cart | أضف إلى السلة</button>`;
  
  const newBtn = document.getElementById(btnId);
  if (newBtn && product) {
    newBtn.onclick = function() {
      if (product.quantity === 0) return false;
      
      let localCart = JSON.parse(localStorage.getItem("cart")) || [];
      const item = localCart.find(i => i.id === product.id);
      const currentInCart = item ? item.quantity : 0;
      const maxAllowed = Math.min(MAX_QTY_PER_PRODUCT, product.quantity);
      
      if (currentInCart >= maxAllowed) {
        showProductPageMaxLimitMessage();
        return false;
      }
      
      if (item) {
        item.quantity++;
      } else {
        localCart.push({ ...product, quantity: 1 });
      }
      
      localStorage.setItem("cart", JSON.stringify(localCart));
      
      if (typeof cart !== 'undefined') {
        cart.length = 0;
        localCart.forEach(i => cart.push(i));
      }
      
      const totalItems = localCart.reduce((s, i) => s + i.quantity, 0);
      const cartCount = document.getElementById("cartCount");
      const bottomCartCount = document.getElementById("bottomCartCount");
      const mobileCartCount = document.getElementById("mobileCartCount");
      if (cartCount) cartCount.textContent = totalItems;
      if (bottomCartCount) bottomCartCount.textContent = totalItems;
      if (mobileCartCount) mobileCartCount.textContent = totalItems;
      
      if (typeof updateCart === 'function') updateCart();
      
      transformToQtyButton(this, product);
      return true;
    };
  }
}

// Wait for products to load, then display
async function initProductPage() {
  let attempts = 0;
  while (typeof products === 'undefined' || products.length === 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
    if (attempts > 50) break;
  }

  const product = products.find(p => p.slug === slug);

  if (!product) {
    document.body.innerHTML = "<h2 style='text-align:center;padding:2.4rem;'>Product not found</h2>";
    return;
  }

  const isOutOfStock = product.quantity === 0;
  const threshold = typeof FREE_DELIVERY_THRESHOLD !== 'undefined' ? FREE_DELIVERY_THRESHOLD : 75;
  
  document.querySelectorAll('.threshold-value').forEach(el => el.textContent = threshold);
  document.querySelectorAll('.threshold-value-ar').forEach(el => el.textContent = toArabicNumerals(threshold));

  // DESKTOP VERSION
  document.getElementById("productTitle").innerText = product.name;
  document.getElementById("productCategory").innerText = product.category;

  let descriptionHTML = '';
  
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
      const thumbnailsHTML = product.images.length > 1 ? `
        <div class="thumbnail-strip">
          ${product.images.map((img, index) => `
            <img src="${img}" alt="${product.name} ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', ${index})" style="object-fit:contain;">
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

  const desktopAddBtn = document.getElementById("addToCartBtn");
  if (isOutOfStock && desktopAddBtn) {
    desktopAddBtn.textContent = "Out of Stock | نفذ المخزون";
    desktopAddBtn.disabled = true;
    desktopAddBtn.style.background = "#999";
    desktopAddBtn.style.cursor = "not-allowed";
  }

  // MOBILE VERSION
  document.getElementById("mobileProductTitle").innerText = product.name;
  document.getElementById("mobileProductTitleAr").innerText = product.nameAr || '';
  document.getElementById("mobileProductCategory").innerText = product.category;
  document.getElementById("mobileProductPrice").innerText = "AED " + product.price;

  const mobileCarousel = document.getElementById("mobileCarousel");
  const mobileDots = document.getElementById("mobileDots");
  
  if (product.images && product.images.length > 0) {
    const isEmoji = !product.images[0].startsWith('http');
    
    if (isEmoji) {
      mobileCarousel.innerHTML = `<div class="mobile-carousel-slide"><div style="font-size: 80px;">${product.images[0]}</div></div>`;
      mobileDots.innerHTML = '<div class="mobile-dot active"></div>';
    } else {
      mobileCarousel.innerHTML = product.images.map((img, index) => `
        <div class="mobile-carousel-slide" data-index="${index}">
          <img src="${img}" alt="${product.name} ${index + 1}">
        </div>
      `).join('');
      
      mobileDots.innerHTML = product.images.map((_, index) => `
        <div class="mobile-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
      `).join('');
      
      setupMobileCarousel();
      setupGalleryOverlay(product);
    }
  }

  const mobileAddBtn = document.getElementById("mobileAddToCartBtn");
  if (isOutOfStock && mobileAddBtn) {
    mobileAddBtn.textContent = "Out of Stock | نفذ المخزون";
    mobileAddBtn.disabled = true;
    mobileAddBtn.style.background = "#999";
    mobileAddBtn.style.cursor = "not-allowed";
  }

  // MOBILE DETAILS SECTION
  const detailsContainer = document.getElementById("mobileDetailsSection");
  let detailsHTML = '';

  const mobileDescEn = product.detailedDescription || product.description || '';
  const mobileDescAr = product.detailedDescriptionAr || product.descriptionAr || '';
  
  if (mobileDescEn || mobileDescAr) {
    detailsHTML += `
      <div class="mobile-detail-block">
        <div class="mobile-detail-title"><span>Description</span><span class="arabic-text">معلومات المنتج</span></div>
        <div class="mobile-detail-content"><p>${mobileDescEn}</p><p class="arabic-text">${mobileDescAr}</p></div>
      </div>
    `;
  }

  if (product.colors) {
    detailsHTML += `
      <div class="mobile-detail-block">
        <div class="mobile-detail-title"><span>Available Colors</span><span class="arabic-text">الألوان المتاحة</span></div>
        <div class="mobile-detail-content"><p>${product.colors}</p><p class="arabic-text">${product.colorsAr || ''}</p></div>
      </div>
    `;
  }

  if (product.packaging) {
    detailsHTML += `
      <div class="mobile-detail-block">
        <div class="mobile-detail-title"><span>Packaging</span><span class="arabic-text">التعبئة والتغليف</span></div>
        <div class="mobile-detail-content"><p>${product.packaging}</p><p class="arabic-text">${product.packagingAr || ''}</p></div>
      </div>
    `;
  }

  if (product.specifications && product.specifications.length > 0) {
    detailsHTML += `
      <div class="mobile-detail-block">
        <div class="mobile-detail-title"><span>Specifications</span><span class="arabic-text">المواصفات</span></div>
        <div class="mobile-detail-content"><p>${product.specifications.join('<br>')}</p><p class="arabic-text">${product.specificationsAr ? product.specificationsAr.join('<br>') : ''}</p></div>
      </div>
    `;
  }

  if (detailsContainer) detailsContainer.innerHTML = detailsHTML;

  // Check if product already in cart - show transformed button
  const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingItem = existingCart.find(i => i.id === product.id);
  
  if (existingItem && !isOutOfStock) {
    const desktopBtn = document.getElementById("addToCartBtn");
    if (desktopBtn) transformToQtyButton(desktopBtn, product);
    
    const mobileBtn = document.getElementById("mobileAddToCartBtn");
    if (mobileBtn) transformToQtyButton(mobileBtn, product);
  }

  // ADD TO CART HANDLER - self-contained, uses localStorage directly
  const addToCartHandler = () => {
    if (product.quantity === 0) return false;

    // Get cart from localStorage
    let localCart = JSON.parse(localStorage.getItem("cart")) || [];
    const item = localCart.find(i => i.id === product.id);
    const currentInCart = item ? item.quantity : 0;
    
    const maxAllowed = Math.min(MAX_QTY_PER_PRODUCT, product.quantity);
    if (currentInCart >= maxAllowed) {
      showProductPageMaxLimitMessage();
      return false;
    }
    
    if (item) {
      item.quantity++;
    } else {
      localCart.push({ ...product, quantity: 1 });
    }
    
    // Save to localStorage
    localStorage.setItem("cart", JSON.stringify(localCart));
    
    // Sync with app.js cart variable if it exists (app.js loads after)
    if (typeof cart !== 'undefined') {
      cart.length = 0;
      localCart.forEach(i => cart.push(i));
    }
    
    // Update cart counts
    const totalItems = localCart.reduce((s, i) => s + i.quantity, 0);
    const cartCount = document.getElementById("cartCount");
    const bottomCartCount = document.getElementById("bottomCartCount");
    const mobileCartCount = document.getElementById("mobileCartCount");
    if (cartCount) cartCount.textContent = totalItems;
    if (bottomCartCount) bottomCartCount.textContent = totalItems;
    if (mobileCartCount) mobileCartCount.textContent = totalItems;
    
    // Update cart display if app.js is loaded
    if (typeof updateCart === 'function') {
      updateCart();
    }
    
    return true;
  };

  if (!isOutOfStock) {
    document.getElementById("addToCartBtn").onclick = function() {
      if (addToCartHandler()) {
        transformToQtyButton(this, product);
      }
    };
  }

  if (!isOutOfStock) {
    document.getElementById("mobileAddToCartBtn").onclick = function() {
      if (addToCartHandler()) {
        transformToQtyButton(this, product);
      }
    };
  }

  const mainImg = document.getElementById('mainImage');
  if (mainImg) {
    mainImg.style.cursor = 'zoom-in';
    mainImg.onclick = () => openEnhancedLightbox(product, 0);
  }
}

function openEnhancedLightbox(product, startIndex) {
  let currentIndex = startIndex;
  const images = product.images;
  
  let infoHTML = `
    <div class="lightbox-title-row">
      <div class="lightbox-title">${product.name}</div>
      <div class="lightbox-title-ar">${product.nameAr || ''}</div>
    </div>
    <div class="lightbox-divider"></div>
  `;
  
  const lbDescEn = product.detailedDescription || product.description;
  const lbDescAr = product.detailedDescriptionAr || product.descriptionAr;
  if (lbDescEn || lbDescAr) {
    infoHTML += `<div class="lightbox-detail-block"><div class="lightbox-detail-en"><div class="lightbox-detail-label">Description</div><div class="lightbox-detail-value">${lbDescEn || ''}</div></div><div class="lightbox-detail-ar"><div class="lightbox-detail-label">معلومات المنتج</div><div class="lightbox-detail-value">${lbDescAr || ''}</div></div></div>`;
  }
  
  if (product.colors || product.colorsAr) {
    infoHTML += `<div class="lightbox-detail-block"><div class="lightbox-detail-en"><div class="lightbox-detail-label">Available Colors</div><div class="lightbox-detail-value">${product.colors || ''}</div></div><div class="lightbox-detail-ar"><div class="lightbox-detail-label">الألوان المتاحة</div><div class="lightbox-detail-value">${product.colorsAr || ''}</div></div></div>`;
  }
  
  if (product.packaging || product.packagingAr) {
    infoHTML += `<div class="lightbox-detail-block"><div class="lightbox-detail-en"><div class="lightbox-detail-label">Packaging</div><div class="lightbox-detail-value">${product.packaging || ''}</div></div><div class="lightbox-detail-ar"><div class="lightbox-detail-label">التعبئة والتغليف</div><div class="lightbox-detail-value">${product.packagingAr || ''}</div></div></div>`;
  }
  
  if ((product.specifications && product.specifications.length > 0) || (product.specificationsAr && product.specificationsAr.length > 0)) {
    infoHTML += `<div class="lightbox-detail-block"><div class="lightbox-detail-en"><div class="lightbox-detail-label">Specifications</div><div class="lightbox-detail-value">${product.specifications ? product.specifications.join('<br>') : ''}</div></div><div class="lightbox-detail-ar"><div class="lightbox-detail-label">المواصفات</div><div class="lightbox-detail-value">${product.specificationsAr ? product.specificationsAr.join('<br>') : ''}</div></div></div>`;
  }
  
  const thumbnailsHTML = images.length > 1 ? `<div class="lightbox-thumbnails">${images.map((img, i) => `<div class="lightbox-thumb ${i === currentIndex ? 'active' : ''}" data-index="${i}"><img src="${img}" alt="Thumbnail ${i + 1}"></div>`).join('')}</div>` : '';
  const arrowsHTML = images.length > 1 ? `<button class="lightbox-arrow prev">‹</button><button class="lightbox-arrow next">›</button>` : '';
  const counterHTML = images.length > 1 ? `<div class="lightbox-counter">${currentIndex + 1} / ${images.length}</div>` : '';
  
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <button class="lightbox-close">×</button>
    <div class="lightbox-content">
      <div class="lightbox-image-section">
        <div class="lightbox-main-image">${arrowsHTML}<img src="${images[currentIndex]}" alt="${product.name}" id="lightboxMainImg">${counterHTML}</div>
        ${thumbnailsHTML}
      </div>
      <div class="lightbox-info-section">${infoHTML}</div>
    </div>
  `;
  
  document.body.appendChild(lightbox);
  document.body.style.overflow = 'hidden';
  
  const lightboxImg = document.getElementById('lightboxMainImg');
  const lightboxMainImageContainer = lightbox.querySelector('.lightbox-main-image');
  const counter = lightbox.querySelector('.lightbox-counter');
  const thumbs = lightbox.querySelectorAll('.lightbox-thumb');
  
  let isZoomed = false;
  
  lightboxMainImageContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('lightbox-arrow')) return;
    isZoomed = !isZoomed;
    if (isZoomed) {
      lightboxImg.style.transform = 'scale(2)';
      lightboxImg.style.cursor = 'zoom-out';
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
  
  const updateImage = (index) => {
    currentIndex = index;
    lightboxImg.src = images[currentIndex];
    if (counter) counter.textContent = `${currentIndex + 1} / ${images.length}`;
    thumbs.forEach((thumb, i) => thumb.classList.toggle('active', i === currentIndex));
  };
  
  const prevBtn = lightbox.querySelector('.lightbox-arrow.prev');
  const nextBtn = lightbox.querySelector('.lightbox-arrow.next');
  
  if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); updateImage(currentIndex === 0 ? images.length - 1 : currentIndex - 1); };
  if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); updateImage(currentIndex === images.length - 1 ? 0 : currentIndex + 1); };
  
  thumbs.forEach((thumb, i) => { thumb.onclick = (e) => { e.stopPropagation(); updateImage(i); }; });
  
  const handleKeydown = (e) => {
    if (e.key === 'ArrowLeft' && images.length > 1) updateImage(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
    else if (e.key === 'ArrowRight' && images.length > 1) updateImage(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
    else if (e.key === 'Escape') closeLightbox();
  };
  
  document.addEventListener('keydown', handleKeydown);
  
  const closeLightbox = () => {
    document.body.removeChild(lightbox);
    document.body.style.overflow = 'auto';
    document.removeEventListener('keydown', handleKeydown);
  };
  
  lightbox.querySelector('.lightbox-close').onclick = closeLightbox;
  lightbox.onclick = (e) => { if (e.target === lightbox) closeLightbox(); };
}

function setupMobileCarousel() {
  const carousel = document.getElementById('mobileCarousel');
  const dots = document.querySelectorAll('.mobile-dot');
  
  carousel.addEventListener('scroll', () => {
    const scrollLeft = carousel.scrollLeft;
    const slideWidth = carousel.offsetWidth;
    const currentIndex = Math.round(scrollLeft / slideWidth);
    dots.forEach((dot, index) => dot.classList.toggle('active', index === currentIndex));
  });
  
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      carousel.scrollTo({ left: index * carousel.offsetWidth, behavior: 'smooth' });
    });
  });
}

function setupGalleryOverlay(product) {
  const carousel = document.getElementById('mobileCarousel');
  const overlay = document.getElementById('galleryOverlay');
  const galleryScroll = document.getElementById('galleryScroll');
  const closeBtn = document.getElementById('galleryClose');
  const bottomNav = document.getElementById('mobileBottomNav');
  
  carousel.addEventListener('click', () => {
    galleryScroll.innerHTML = product.images.map((img, index) => `<div class="gallery-image-wrapper"><img src="${img}" alt="${product.name} ${index + 1}"></div>`).join('');
    overlay.classList.add('active');
    if (bottomNav) bottomNav.style.display = 'none';
    document.body.style.overflow = 'hidden';
  });
  
  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('active');
    if (bottomNav) bottomNav.style.display = '';
    document.body.style.overflow = '';
  });
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      if (bottomNav) bottomNav.style.display = '';
      document.body.style.overflow = '';
    }
  });
}

window.changeMainImage = function(imgSrc, index) {
  const mainImg = document.getElementById('mainImage');
  mainImg.src = imgSrc;
  document.querySelectorAll('.thumbnail').forEach((thumb, i) => thumb.classList.toggle('active', i === index));
};

function setupSearch() {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  
  const doSearch = () => {
    const term = searchInput.value.trim();
    if (term) window.location.href = `index.html?search=${encodeURIComponent(term)}`;
    else window.location.href = 'index.html';
  };
  
  if (searchBtn) searchBtn.onclick = doSearch;
  if (searchInput) searchInput.onkeypress = (e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
}

function toggleCartSidebar() {
  const cartSidebar = document.getElementById('cartSidebar');
  const bottomCartBtn = document.getElementById('bottomCartBtn');
  const bottomHomeBtn = document.getElementById('bottomHomeBtn');
  
  if (cartSidebar) {
    cartSidebar.classList.toggle('active');
    
    if (cartSidebar.classList.contains('active')) {
      if (bottomCartBtn) bottomCartBtn.classList.add('cart-active');
      if (bottomHomeBtn) bottomHomeBtn.classList.remove('home-active');
      // Update cart display - app.js should be loaded by now
      if (typeof updateCart === 'function') {
        updateCart();
      }
    } else {
      if (bottomCartBtn) bottomCartBtn.classList.remove('cart-active');
    }
  }
}

function setupBottomNav() {
  const bottomHomeBtn = document.getElementById('bottomHomeBtn');
  const bottomCartBtn = document.getElementById('bottomCartBtn');
  const bottomMenuBtn = document.getElementById('bottomMenuBtn');
  const cartSidebar = document.getElementById('cartSidebar');
  
  if (bottomHomeBtn) bottomHomeBtn.onclick = function() { window.location.href = 'index.html'; };
  if (bottomCartBtn) bottomCartBtn.onclick = toggleCartSidebar;
  if (bottomMenuBtn) {
    bottomMenuBtn.onclick = function() {
      if (cartSidebar && cartSidebar.classList.contains('active')) {
        cartSidebar.classList.remove('active');
        if (bottomCartBtn) bottomCartBtn.classList.remove('cart-active');
      }
      productPageToggleMobileMenu();
    };
  }
  
  const closeCart = document.getElementById('closeCart');
  if (closeCart) closeCart.onclick = function() { if (cartSidebar) { cartSidebar.classList.remove('active'); if (bottomCartBtn) bottomCartBtn.classList.remove('cart-active'); } };
  
  const cartIcon = document.getElementById('cartIcon');
  if (cartIcon) cartIcon.onclick = toggleCartSidebar;
}

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
    overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('active'); };
    overlay.querySelectorAll('.mobile-menu a').forEach(link => { link.onclick = () => overlay.classList.remove('active'); });
  }
  
  overlay.classList.toggle('active');
}

window.addEventListener('DOMContentLoaded', () => {
  // Update cart count from localStorage
  const localCart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalItems = localCart.reduce((s, i) => s + i.quantity, 0);
  
  const cartCount = document.getElementById("cartCount");
  const bottomCartCount = document.getElementById("bottomCartCount");
  const mobileCartCount = document.getElementById("mobileCartCount");
  if (cartCount) cartCount.textContent = totalItems;
  if (bottomCartCount) bottomCartCount.textContent = totalItems;
  if (mobileCartCount) mobileCartCount.textContent = totalItems;
  
  setupSearch();
  setupBottomNav();
});

initProductPage();
