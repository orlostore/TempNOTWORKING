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

// Show limit tooltip above quantity button (Glassmorphism style)
function showProductPageMaxLimitMessage(productId, maxAllowed) {
    // Remove any existing tooltip
    const existing = document.getElementById('limitTooltip');
    if (existing) existing.remove();
    
    // Clear any existing timer
    if (window.limitTooltipTimer) {
      clearTimeout(window.limitTooltipTimer);
    }
    
    // Determine message type
    const isStockLimit = maxAllowed < MAX_QTY_PER_PRODUCT;
    
    let messageEn, messageAr;
    if (isStockLimit) {
      messageEn = `Only <span class="highlight">${maxAllowed}</span> left in stock`;
      messageAr = `متبقي <span class="highlight">${toArabicNumerals(maxAllowed)}</span> فقط في المخزون`;
    } else {
      messageEn = `Limit of <span class="highlight">${MAX_QTY_PER_PRODUCT}</span> per order`;
      messageAr = `الحد الأقصى <span class="highlight">${toArabicNumerals(MAX_QTY_PER_PRODUCT)}</span> لكل طلب`;
    }
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.id = 'limitTooltip';
    tooltip.className = 'limit-tooltip';
    tooltip.innerHTML = `
      <button class="close-btn" onclick="closeLimitTooltip()">✕</button>
      ${messageEn}
      <span class="tooltip-text-ar">${messageAr}</span>
    `;
    
    // Find the correct container (the transformed button itself)
    // On mobile, desktop section is hidden so we must look within the mobile section
    const isMobile = window.innerWidth <= 768;
    let container;
    if (isMobile) {
      container = document.querySelector(`.mobile-cart-section [id="transformedBtn-${productId}"]`)
        || document.querySelector('.mobile-cart-section');
    } else {
      container = document.getElementById(`transformedBtn-${productId}`)
        || document.querySelector('.product-buybox');
    }
    
    if (container) {
      container.appendChild(tooltip);
    }
    
    // Auto-dismiss after 3 seconds
    window.limitTooltipTimer = setTimeout(() => {
      const tip = document.getElementById('limitTooltip');
      if (tip) {
        tip.classList.add('fade-out');
        setTimeout(() => {
          if (tip.parentNode) tip.remove();
        }, 300);
      }
    }, 3000);
}

// Close tooltip immediately
function closeLimitTooltip() {
  const tooltip = document.getElementById('limitTooltip');
  if (tooltip) {
    if (window.limitTooltipTimer) {
      clearTimeout(window.limitTooltipTimer);
    }
    tooltip.classList.add('fade-out');
    setTimeout(() => {
      if (tooltip.parentNode) tooltip.remove();
    }, 300);
  }
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
      showProductPageMaxLimitMessage(productId, maxAllowed);
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
    
    // Update ALL qty displays for this product (desktop and mobile)
    document.querySelectorAll(`[id^="qtyDisplay-${productId}"]`).forEach(el => {
      el.textContent = newQty;
    });
    // Also try the exact ID
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
  
  // Pulse badge on quantity increase
  if (change > 0 && typeof pulseBadge === 'function') pulseBadge();
}

// Reset transformed button back to Add to Cart
function resetToAddButton(productId) {
  // Reset ALL transformed buttons for this product (both desktop and mobile)
  document.querySelectorAll(`[id="transformedBtn-${productId}"]`).forEach(transformed => {
    const isMobile = transformed.closest('.mobile-product-page') !== null;
    const btnId = isMobile ? 'mobileAddToCartBtn' : 'addToCartBtn';
    const btnClass = isMobile ? 'mobile-add-to-cart' : 'add-to-cart-btn';
    
    transformed.outerHTML = `<button class="${btnClass}" id="${btnId}">Add to Cart | أضف إلى السلة</button>`;
  });
  
  // Re-attach click handlers
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const desktopBtn = document.getElementById('addToCartBtn');
  const mobileBtn = document.getElementById('mobileAddToCartBtn');
  
  const handler = function() {
    if (product.quantity === 0) return false;
    
    let localCart = JSON.parse(localStorage.getItem("cart")) || [];
    const item = localCart.find(i => i.id === product.id);
    const currentInCart = item ? item.quantity : 0;
    const maxAllowed = Math.min(MAX_QTY_PER_PRODUCT, product.quantity);
    
    if (currentInCart >= maxAllowed) {
      showProductPageMaxLimitMessage(product.id, maxAllowed);
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
    
    if (typeof pulseBadge === 'function') pulseBadge();
    
    transformToQtyButton(this, product);
    return true;
  };
  
  if (desktopBtn) desktopBtn.onclick = handler;
  if (mobileBtn) mobileBtn.onclick = handler;
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
  const titleArEl = document.getElementById("productTitleAr");
  if (titleArEl) titleArEl.innerText = product.nameAr || '';
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
    desktopAddBtn.textContent = "Out of Stock | نفد المخزون";
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
    mobileAddBtn.textContent = "Out of Stock | نفد المخزون";
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
    if (desktopAddBtn) transformToQtyButton(desktopAddBtn, product);
    if (mobileAddBtn) transformToQtyButton(mobileAddBtn, product);
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
      showProductPageMaxLimitMessage(product.id, maxAllowed);
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
    
    // Pulse the cart badge
    if (typeof pulseBadge === 'function') pulseBadge();
    
    return true;
  };

  if (!isOutOfStock && desktopAddBtn) {
    desktopAddBtn.onclick = function() {
      if (addToCartHandler()) {
        transformToQtyButton(this, product);
      }
    };
  }

  if (!isOutOfStock && mobileAddBtn) {
    mobileAddBtn.onclick = function() {
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
      lightboxImg.style.transform = 'scale(3)';
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

  if (!overlay || !closeBtn) return;

  carousel.addEventListener('click', () => {
    galleryScroll.innerHTML = product.images.map((img, index) => `
      <div class="gallery-image-wrapper" style="overflow:hidden;">
        <img src="${img}" alt="${product.name} ${index + 1}" style="transform-origin:center center;">
      </div>
    `).join('');

    // Add reset button if not already present
    let resetBtn = overlay.querySelector('.gallery-reset-btn');
    if (!resetBtn) {
      resetBtn = document.createElement('button');
      resetBtn.className = 'gallery-reset-btn';
      resetBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 105.64-8.36L1 10"/></svg> Reset';
      overlay.appendChild(resetBtn);
    }

    overlay.classList.add('active');
    if (bottomNav) bottomNav.style.display = 'none';
    document.body.style.overflow = 'hidden';

    // Pinch-to-zoom on each image
    galleryScroll.querySelectorAll('.gallery-image-wrapper img').forEach(img => {
      var scale = 1;
      var startDist = 0;
      var startScale = 1;
      var translateX = 0, translateY = 0;
      var startX = 0, startY = 0;
      var isPinching = false;
      var currentResetBtn = overlay.querySelector('.gallery-reset-btn');

      function resetZoom() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        img.style.transition = 'transform 0.3s';
        applyTransform();
        if (currentResetBtn) currentResetBtn.classList.remove('visible');
        setTimeout(function() { img.style.transition = ''; }, 300);
      }

      if (currentResetBtn) {
        currentResetBtn.addEventListener('click', resetZoom);
      }

      function getDistance(t1, t2) {
        return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      }

      function clampTranslate() {
        if (scale <= 1) { translateX = 0; translateY = 0; return; }
        var parent = img.parentElement.getBoundingClientRect();
        var maxX = ((img.offsetWidth * scale) - parent.width) / (2 * scale);
        var maxY = ((img.offsetHeight * scale) - parent.height) / (2 * scale);
        if (maxX < 0) maxX = 0;
        if (maxY < 0) maxY = 0;
        if (translateX > maxX) translateX = maxX;
        if (translateX < -maxX) translateX = -maxX;
        if (translateY > maxY) translateY = maxY;
        if (translateY < -maxY) translateY = -maxY;
      }

      function applyTransform() {
        img.style.transform = 'scale(' + scale + ') translate(' + translateX + 'px, ' + translateY + 'px)';
      }

      img.addEventListener('touchstart', function(e) {
        if (e.touches.length === 2) {
          e.preventDefault();
          isPinching = true;
          startDist = getDistance(e.touches[0], e.touches[1]);
          startScale = scale;
        } else if (e.touches.length === 1 && scale > 1) {
          startX = e.touches[0].clientX - translateX;
          startY = e.touches[0].clientY - translateY;
        }
      }, { passive: false });

      img.addEventListener('touchmove', function(e) {
        if (e.touches.length === 2 && isPinching) {
          e.preventDefault();
          var dist = getDistance(e.touches[0], e.touches[1]);
          scale = Math.min(Math.max(startScale * (dist / startDist), 1), 3);
          clampTranslate();
          applyTransform();
          if (scale > 1 && currentResetBtn) currentResetBtn.classList.add('visible');
          if (scale <= 1 && currentResetBtn) currentResetBtn.classList.remove('visible');
        } else if (e.touches.length === 1 && scale > 1) {
          e.preventDefault();
          e.stopPropagation();
          translateX = e.touches[0].clientX - startX;
          translateY = e.touches[0].clientY - startY;
          clampTranslate();
          applyTransform();
        }
      }, { passive: false });

      img.addEventListener('touchend', function(e) {
        isPinching = false;
        if (scale <= 1) {
          scale = 1;
          translateX = 0;
          translateY = 0;
          img.style.transition = 'transform 0.3s';
          applyTransform();
          if (currentResetBtn) currentResetBtn.classList.remove('visible');
          setTimeout(function() { img.style.transition = ''; }, 300);
        }
      });

      // Double-tap to reset
      var lastTap = 0;
      img.addEventListener('touchend', function(e) {
        if (e.touches.length > 0) return;
        var now = Date.now();
        if (now - lastTap < 300) {
          resetZoom();
        }
        lastTap = now;
      });
    });
  });

  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('active');
    const rb = overlay.querySelector('.gallery-reset-btn');
    if (rb) rb.classList.remove('visible');
    if (bottomNav) bottomNav.style.display = '';
    document.body.style.overflow = '';
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      const rb = overlay.querySelector('.gallery-reset-btn');
      if (rb) rb.classList.remove('visible');
      if (bottomNav) bottomNav.style.display = '';
      document.body.style.overflow = '';
    }
  });
}

window.changeMainImage = function(imgSrc, index) {
  const mainImg = document.getElementById('mainImage');
  if (mainImg) mainImg.src = imgSrc;
  document.querySelectorAll('.thumbnail').forEach((thumb, i) => thumb.classList.toggle('active', i === index));
};

function setupSearch() {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  
  const doSearch = () => {
    if (!searchInput) return;
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
  
  // Handle account button in bottom nav
  const bottomAccountBtn = document.getElementById('bottomAccountBtn');
  if (bottomAccountBtn) {
    bottomAccountBtn.onclick = function() {
      const token = localStorage.getItem('orlo_token') || sessionStorage.getItem('orlo_token');
      if (token) {
        window.location.href = 'account.html';
      } else {
        window.location.href = 'login.html';
      }
    };
  }
  
  const cartIcon = document.getElementById('cartIcon');
  if (cartIcon) cartIcon.onclick = toggleCartSidebar;
  
  const mobileCartIcon = document.getElementById('mobileCartIcon');
  if (mobileCartIcon) mobileCartIcon.onclick = toggleCartSidebar;
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

// Listen for products ready event as backup trigger
window.addEventListener('productsReady', () => {
  console.log('📦 Product page: Products ready event received');
  // Re-initialize if products loaded after initial attempt
  if (document.getElementById('productTitle') && !document.getElementById('productTitle').innerText) {
    initProductPage();
  }
});

initProductPage();
