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
    
    // Find the correct container (the transformed button or its parent)
    const isMobile = window.innerWidth <= 768;
    let container;
    if (isMobile) {
      container = document.querySelector(`.mobile-product-page [id="transformedBtn-${productId}"]`)
        || document.querySelector('.mobile-product-page .early-price-inline')
        || document.querySelector('.mobile-cart-section');
    } else {
      container = document.getElementById(`transformedBtn-${productId}`)
        || document.querySelector('.early-price-inline')
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

// Transform button to quantity control (matches grid cart style)
function transformToQtyButton(btn, product) {
  const localCart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = localCart.find(i => i.id === product.id);
  const qty = item ? item.quantity : 1;
  
  btn.dataset.originalText = btn.textContent;
  btn.dataset.productId = product.id;
  
  btn.outerHTML = `
    <div class="grid-qty-control product-btn-transformed" id="transformedBtn-${product.id}">
      <button class="grid-qty-btn" onclick="productQtyChange(${product.id}, -1)">−</button>
      <span class="grid-qty-display" id="qtyDisplay-${product.id}" onclick="if(typeof toggleCart === 'function') toggleCart(); else if(typeof toggleCartSidebar === 'function') toggleCartSidebar();" style="cursor:pointer;">${qty}</span>
      <button class="grid-qty-btn" onclick="productQtyChange(${product.id}, 1)">+</button>
    </div>
  `;
  updateTierHighlight(product.id);
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
  updateTierHighlight(productId);

  // Pulse badge on quantity increase
  if (change > 0 && typeof pulseBadge === 'function') pulseBadge();
}

// Reset transformed button back to Add to Cart
function resetToAddButton(productId) {
  const product = products.find(p => p.id === productId);
  const hasVariants = product && product.variants && product.variants.length > 0;

  // Reset ALL transformed buttons for this product (both desktop and mobile)
  document.querySelectorAll(`[id="transformedBtn-${productId}"]`).forEach(transformed => {
    const isMobile = transformed.closest('.mobile-product-page') !== null;
    const isInline = transformed.closest('.early-price-inline') !== null;

    if (isInline) {
      // Non-variant inline button inside early-price row
      const btnId = isMobile ? 'earlyCartMobile' : 'earlyCartDesktop';
      transformed.outerHTML = `<button class="inline-add-to-cart" id="${btnId}">Add to Cart | <span class="arabic-text">أضف إلى السلة</span></button>`;
    } else {
      const btnId = isMobile ? 'mobileAddToCartBtn' : 'addToCartBtn';
      const btnClass = isMobile ? 'mobile-add-to-cart' : 'add-to-cart-btn';
      transformed.outerHTML = `<button class="${btnClass}" id="${btnId}">Add to Cart | <span class="arabic-text">أضف إلى السلة</span></button>`;
    }
  });

  if (!product) return;

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

  // Re-attach click handlers — find buttons by their actual IDs
  if (!hasVariants) {
    const desktopBtn = document.getElementById('earlyCartDesktop');
    const mobileBtn = document.getElementById('earlyCartMobile');
    if (desktopBtn) desktopBtn.onclick = handler;
    if (mobileBtn) mobileBtn.onclick = handler;
  } else {
    const desktopBtn = document.getElementById('addToCartBtn');
    const mobileBtn = document.getElementById('mobileAddToCartBtn');
    if (desktopBtn) desktopBtn.onclick = handler;
    if (mobileBtn) mobileBtn.onclick = handler;
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

  const hasVariants = product.variants && product.variants.length > 0;
  const hasTiers = product.pricingTiers && product.pricingTiers.length > 0;
  // For variant products, out-of-stock means ALL variants are 0
  const isOutOfStock = hasVariants
    ? product.variants.every(v => v.quantity === 0)
    : product.quantity === 0;
  const threshold = typeof FREE_DELIVERY_THRESHOLD !== 'undefined' ? FREE_DELIVERY_THRESHOLD : 75;

  // Track selected variant (product-page-scoped)
  window._selectedVariant = null;
  
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

  // Extra spec fields (only shown when filled)
  descriptionHTML += buildExtraSpecsHTML(product);

  document.getElementById("productDescription").innerHTML = descriptionHTML;
  // Hide standalone price when pricing tiers are present (dynamic bar replaces it)
  const productPriceEl = document.getElementById("productPrice");
  if (hasTiers) {
    productPriceEl.style.display = 'none';
  } else {
    productPriceEl.innerText = "AED " + product.price;
  }

  // === EARLY PRICE ===
  const earlyPriceDesktop = document.getElementById("earlyPriceDesktop");
  const earlyPriceMobile = document.getElementById("earlyPriceMobile");
  if (hasVariants && product.price) {
    const earlyHTML = `<div class="early-price-row"><span class="early-price-en">AED ${product.price} or less</span><span class="early-price-ar arabic-text">${product.price} درهم أو أقل</span></div>`;
    const hintHTML = `<a class="early-price-hint" id="__HINT_ID__"><span>Click to choose design & quantity for exact price ▼</span><span class="arabic-text">اضغط لاختيار التصميم والكمية للسعر الدقيق ▼</span></a>`;
    if (earlyPriceDesktop) {
      earlyPriceDesktop.innerHTML = earlyHTML + hintHTML.replace('__HINT_ID__', 'earlyHintDesktop');
      document.getElementById('earlyHintDesktop').onclick = function() {
        const btn = document.getElementById('addToCartBtn');
        if (btn) btn.scrollIntoView({behavior:'smooth', block:'end'});
      };
    }
    if (earlyPriceMobile) {
      earlyPriceMobile.innerHTML = earlyHTML + hintHTML.replace('__HINT_ID__', 'earlyHintMobile');
      document.getElementById('earlyHintMobile').onclick = function() {
        const btn = document.getElementById('mobileAddToCartBtn');
        const bottomNav = document.getElementById('mobileBottomNav');
        if (btn) {
          const btnRect = btn.getBoundingClientRect();
          const navHeight = bottomNav ? bottomNav.offsetHeight : 0;
          const targetY = window.scrollY + btnRect.bottom - (window.innerHeight - navHeight);
          window.scrollTo({top: targetY, behavior: 'smooth'});
        }
      };
    }
  } else if (product.price) {
    // Non-variant products: show price + Add to Cart inline
    const earlyHTML = `<div class="early-price-row early-price-inline"><span class="early-price-en">AED ${product.price}</span><button class="inline-add-to-cart" id="__BTN_ID__">Add to Cart | <span class="arabic-text">أضف إلى السلة</span></button><span class="early-price-ar arabic-text">${product.price} درهم</span></div>`;
    if (earlyPriceDesktop) earlyPriceDesktop.innerHTML = earlyHTML.replace('__BTN_ID__', 'earlyCartDesktop');
    if (earlyPriceMobile) earlyPriceMobile.innerHTML = earlyHTML.replace('__BTN_ID__', 'earlyCartMobile');
  } else {
    if (earlyPriceDesktop) earlyPriceDesktop.style.display = 'none';
    if (earlyPriceMobile) earlyPriceMobile.style.display = 'none';
  }

  // === VARIANT SELECTOR (Desktop) ===
  if (hasVariants) {
    renderVariantSelector('variantSelectorDesktop', product, false);
  }

  // === PRICING TIERS (Desktop) ===
  if (hasTiers) {
    renderPricingTiers('pricingTiersDesktop', product);
  }

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
            <img src="${img}" alt="${product.name} ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}" onclick="changeMainImage('${img}', ${index})" style="object-fit:contain;">
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

  // Desktop button: use inline early-price button for non-variant, buybox button for variant
  let desktopAddBtn;
  if (!hasVariants) {
    desktopAddBtn = document.getElementById("earlyCartDesktop");
    // Inject delivery info below early-price container, then hide buybox entirely
    const deliveryHTML = `<div class="early-delivery-info"><div class="delivery-item"><span class="delivery-icon"><svg class="inline-icon" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></span><div class="delivery-en">Free delivery over AED ${threshold}</div><div class="delivery-ar arabic-text">توصيل مجاني فوق ${toArabicNumerals(threshold)} درهم</div></div></div>`;
    if (earlyPriceDesktop) earlyPriceDesktop.insertAdjacentHTML('afterend', deliveryHTML);
    // Hide entire buybox
    const buybox = document.querySelector('.product-buybox');
    if (buybox) buybox.style.display = 'none';
    if (isOutOfStock && desktopAddBtn) {
      desktopAddBtn.innerHTML = 'Out of Stock | <span class="arabic-text">نفد المخزون</span>';
      desktopAddBtn.disabled = true;
      desktopAddBtn.style.background = "#999";
      desktopAddBtn.style.cursor = "not-allowed";
    }
  } else {
    desktopAddBtn = document.getElementById("addToCartBtn");
    if (isOutOfStock && desktopAddBtn) {
      desktopAddBtn.innerHTML = 'Out of Stock | <span class="arabic-text">نفد المخزون</span>';
      desktopAddBtn.disabled = true;
      desktopAddBtn.style.background = "#999";
      desktopAddBtn.style.cursor = "not-allowed";
    } else if (desktopAddBtn && !isOutOfStock) {
      desktopAddBtn.innerHTML = 'Select a design | <span class="arabic-text">اختر تصميم</span>';
      desktopAddBtn.disabled = true;
      desktopAddBtn.style.background = "#999";
      desktopAddBtn.style.cursor = "not-allowed";
    }
  }

  // MOBILE VERSION
  document.getElementById("mobileProductTitle").innerText = product.name;
  document.getElementById("mobileProductTitleAr").innerText = product.nameAr || '';
  document.getElementById("mobileProductCategory").innerText = product.category;
  // Hide standalone price when pricing tiers are present (dynamic bar replaces it)
  const mobilePriceEl = document.getElementById("mobileProductPrice");
  if (hasTiers) {
    mobilePriceEl.parentElement.style.display = 'none';
  } else {
    mobilePriceEl.innerText = "AED " + product.price;
  }

  // === VARIANT SELECTOR (Mobile) ===
  if (hasVariants) {
    renderVariantSelector('variantSelectorMobile', product, true);
  }

  // === PRICING TIERS (Mobile) ===
  if (hasTiers) {
    renderPricingTiers('pricingTiersMobile', product);
  }

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

  // Mobile button: use inline early-price button for non-variant, buybox button for variant
  let mobileAddBtn;
  if (!hasVariants) {
    mobileAddBtn = document.getElementById("earlyCartMobile");
    // Place mobile delivery info below early-price container, hide buybox
    const mobileBuyboxCompact = document.querySelector('.mobile-buybox-compact');
    if (earlyPriceMobile) {
      // Build delivery HTML below early-price container for mobile
      const mobileDeliveryHTML = `<div class="early-delivery-info"><div class="delivery-item"><span class="delivery-icon"><svg class="inline-icon" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></span><div class="delivery-en">Free delivery over AED ${threshold}</div><div class="delivery-ar arabic-text">توصيل مجاني فوق ${toArabicNumerals(threshold)} درهم</div></div></div>`;
      earlyPriceMobile.insertAdjacentHTML('afterend', mobileDeliveryHTML);
    }
    if (mobileBuyboxCompact) mobileBuyboxCompact.style.display = 'none';
    if (isOutOfStock && mobileAddBtn) {
      mobileAddBtn.innerHTML = 'Out of Stock | <span class="arabic-text">نفد المخزون</span>';
      mobileAddBtn.disabled = true;
      mobileAddBtn.style.background = "#999";
      mobileAddBtn.style.cursor = "not-allowed";
    }
  } else {
    mobileAddBtn = document.getElementById("mobileAddToCartBtn");
    if (isOutOfStock && mobileAddBtn) {
      mobileAddBtn.innerHTML = 'Out of Stock | <span class="arabic-text">نفد المخزون</span>';
      mobileAddBtn.disabled = true;
      mobileAddBtn.style.background = "#999";
      mobileAddBtn.style.cursor = "not-allowed";
    } else if (mobileAddBtn && !isOutOfStock) {
      mobileAddBtn.innerHTML = 'Select a design | <span class="arabic-text">اختر تصميم</span>';
      mobileAddBtn.disabled = true;
      mobileAddBtn.style.background = "#999";
      mobileAddBtn.style.cursor = "not-allowed";
    }
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

  // Extra specs for mobile
  detailsHTML += buildMobileExtraSpecsHTML(product);

  if (detailsContainer) detailsContainer.innerHTML = detailsHTML;

  // Check if product already in cart - show transformed button
  // For variant products, don't auto-transform (variant must be selected first)
  if (!hasVariants) {
    const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = existingCart.find(i => i.id === product.id && !i.variantId);

    if (existingItem && !isOutOfStock) {
      if (desktopAddBtn) transformToQtyButton(desktopAddBtn, product);
      if (mobileAddBtn) transformToQtyButton(mobileAddBtn, product);
    }
  }

  // ADD TO CART HANDLER - self-contained, uses localStorage directly
  const addToCartHandler = () => {
    const sv = window._selectedVariant;

    // For variant products, must have a variant selected
    if (hasVariants && !sv) return false;

    // Check stock
    const stockQty = hasVariants ? sv.quantity : product.quantity;
    if (stockQty === 0) return false;

    // Get cart from localStorage
    let localCart = JSON.parse(localStorage.getItem("cart")) || [];

    // Find matching cart item (variant-aware)
    const item = hasVariants
      ? localCart.find(i => i.id === product.id && i.variantId === sv.id)
      : localCart.find(i => i.id === product.id && !i.variantId);
    const currentInCart = item ? item.quantity : 0;

    const maxAllowed = Math.min(MAX_QTY_PER_PRODUCT, stockQty);
    if (currentInCart >= maxAllowed) {
      showProductPageMaxLimitMessage(product.id, maxAllowed);
      return false;
    }

    if (item) {
      item.quantity++;
    } else {
      const cartItem = { ...product, quantity: 1 };
      if (hasVariants) {
        cartItem.variantId = sv.id;
        cartItem.variantName = sv.name;
        cartItem.variantNameAr = sv.nameAr || '';
        cartItem.variantImage = sv.image || '';
      }
      localCart.push(cartItem);
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

  // Store reference for use in selectVariant
  addToCartHandlerRef = addToCartHandler;

  if (!isOutOfStock && desktopAddBtn) {
    desktopAddBtn.onclick = function() {
      if (addToCartHandler()) {
        if (hasVariants && window._selectedVariant) {
          transformToQtyButtonVariant(this, product, window._selectedVariant);
        } else {
          transformToQtyButton(this, product);
        }
      }
    };
  }

  if (!isOutOfStock && mobileAddBtn) {
    mobileAddBtn.onclick = function() {
      if (addToCartHandler()) {
        if (hasVariants && window._selectedVariant) {
          transformToQtyButtonVariant(this, product, window._selectedVariant);
        } else {
          transformToQtyButton(this, product);
        }
      }
    };
  }

  const mainImg = document.getElementById('mainImage');
  if (mainImg) {
    mainImg.style.cursor = 'zoom-in';
    mainImg.onclick = () => {
      // Find the currently active thumbnail index instead of always opening image 0
      const activeThumbnail = document.querySelector('.thumbnail.active');
      const activeIndex = activeThumbnail ? parseInt(activeThumbnail.getAttribute('data-index') || '0') : 0;
      openEnhancedLightbox(product, activeIndex);
    };
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
    // Lock body scroll properly (prevents iOS body scroll bleed behind overlay)
    var scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + scrollY + 'px';
    document.body.style.width = '100%';
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
        overlay.style.overflowY = 'auto';
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
          overlay.style.overflowY = 'hidden';
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
          overlay.style.overflowY = 'auto';
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

  function closeGalleryOverlay() {
    overlay.classList.remove('active');
    const rb = overlay.querySelector('.gallery-reset-btn');
    if (rb) rb.classList.remove('visible');
    if (bottomNav) bottomNav.style.display = '';
    // Restore body scroll position properly
    var scrollY = parseInt(document.body.style.top || '0') * -1;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, scrollY);
  }

  closeBtn.addEventListener('click', closeGalleryOverlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeGalleryOverlay();
    }
  });
}

// === VARIANT SELECTOR RENDERING ===
function renderVariantSelector(containerId, product, isMobile) {
  const container = document.getElementById(containerId);
  if (!container || !product.variants || product.variants.length === 0) return;

  const prefix = isMobile ? 'mob' : 'dsk';

  let tilesHTML = product.variants.map(v => {
    const isOOS = v.quantity === 0;
    const isLow = v.quantity > 0 && v.quantity <= 3;
    let stockLabel = v.quantity > 0 ? 'In Stock' : 'Sold out';
    let classes = 'variant-tile';
    if (isOOS) classes += ' out-of-stock';
    if (isLow) classes += ' low-stock';

    const imgHTML = v.image
      ? `<img src="${v.image}" alt="${v.name}" style="width:100%;aspect-ratio:1;object-fit:contain;border-radius:6px;background:#f8f8f8;">`
      : `<div style="width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:#f8f8f8;border-radius:6px;font-size:1.5rem;">📦</div>`;

    return `
      <div class="${classes}" data-variant-id="${v.id}" id="${prefix}-vtile-${v.id}"
           onclick="${isOOS ? '' : `selectVariant(${v.id}, ${product.id}, '${prefix}')`}">
        ${imgHTML}
        <div class="variant-tile-name">${v.name}</div>
        <div class="variant-tile-stock">${stockLabel}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="variant-section" style="${isMobile ? 'padding: 0 16px;' : ''}">
      <div class="variant-label">
        <span>Choose Design | <span class="arabic-text">اختر التصميم</span></span>
        <span class="variant-selected-name" id="${prefix}-selectedName"></span>
      </div>
      <div class="variant-grid">${tilesHTML}</div>
    </div>
  `;
}

// === PRICING TIERS RENDERING ===
function renderPricingTiers(containerId, product) {
  const container = document.getElementById(containerId);
  if (!container || !product.pricingTiers || product.pricingTiers.length === 0) return;

  const tiers = product.pricingTiers;
  const basePrice = product.price;

  // Get current total qty in cart for this product (all variants combined)
  const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
  const totalQty = localCart.filter(i => i.id === product.id).reduce((s, i) => s + i.quantity, 0);

  // Find the active tier based on cart qty
  let activeTierIndex = 0;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (totalQty >= tiers[i].minQty) { activeTierIndex = i; break; }
  }

  let tiersHTML = tiers.map((t, i) => {
    const isActive = i === activeTierIndex;
    const isLast = i === tiers.length - 1;
    const savePercent = basePrice > 0 ? Math.round((1 - t.pricePerUnit / basePrice) * 100) : 0;
    const qtyLabel = t.minQty === 1 ? '1 pc' : `${t.minQty}+ pcs`;

    return `
      <div class="tier-item ${isActive ? 'active' : ''} ${isLast && tiers.length > 1 ? 'best-deal' : ''}" data-min-qty="${t.minQty}">
        <div class="tier-row-top"><span class="tier-qty">${qtyLabel}</span><span class="tier-price">AED ${t.pricePerUnit}</span></div>
        <div class="tier-row-bottom">each${savePercent > 0 ? ` · <span class="tier-save">Save ${savePercent}%</span>` : ''}</div>
      </div>
    `;
  }).join('');

  const activePrice = tiers[activeTierIndex].pricePerUnit;
  const activeSave = basePrice > 0 ? Math.round((1 - activePrice / basePrice) * 100) : 0;

  container.innerHTML = `
    <div class="pricing-tiers" data-product-id="${product.id}" style="margin-bottom:1rem; ${containerId.includes('Mobile') ? 'padding: 0 16px;' : ''}">
      <div class="pricing-tiers-label">Quantity Pricing | <span class="arabic-text">تسعير الكمية</span></div>
      <div class="tier-table">${tiersHTML}</div>
      <div class="your-price-bar${activeSave > 0 ? ' has-savings' : ''}" style="margin-top:6px;">
        <span class="your-price-label">Your price per piece</span>
        <span class="your-price-value">AED ${activePrice}</span>
        <span class="your-price-label-ar arabic-text">سعرك لكل قطعة</span>
        ${activeSave > 0 ? `<span class="your-price-badge">Save ${activeSave}%</span>` : ''}
      </div>
    </div>
  `;
}

// Update tier highlight and dynamic price bar based on current cart quantity
function updateTierHighlight(productId) {
  const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
  const totalQty = localCart.filter(i => i.id === productId).reduce((s, i) => s + i.quantity, 0);
  const product = products.find(p => p.id === productId);
  const basePrice = product ? product.price : 0;

  document.querySelectorAll(`.pricing-tiers[data-product-id="${productId}"]`).forEach(container => {
    const tierItems = container.querySelectorAll('.tier-item');
    let activeTierIndex = 0;
    tierItems.forEach((item, i) => {
      const minQty = parseInt(item.dataset.minQty) || 1;
      if (totalQty >= minQty) activeTierIndex = i;
    });
    tierItems.forEach((item, i) => {
      item.classList.toggle('active', i === activeTierIndex);
    });

    // Update "Your price" bar
    if (product && product.pricingTiers && product.pricingTiers.length > 0) {
      const activePrice = product.pricingTiers[activeTierIndex].pricePerUnit;
      const savePct = basePrice > 0 ? Math.round((1 - activePrice / basePrice) * 100) : 0;
      const bar = container.querySelector('.your-price-bar');
      if (bar) {
        bar.classList.toggle('has-savings', savePct > 0);
        bar.querySelector('.your-price-value').textContent = `AED ${activePrice}`;
        const existingBadge = bar.querySelector('.your-price-badge');
        if (savePct > 0) {
          if (existingBadge) {
            existingBadge.textContent = `Save ${savePct}%`;
          } else {
            const badge = document.createElement('span');
            badge.className = 'your-price-badge';
            badge.textContent = `Save ${savePct}%`;
            bar.appendChild(badge);
          }
        } else if (existingBadge) {
          existingBadge.remove();
        }
      }
    }
  });
}

// === EXTRA SPECS HELPER (Desktop) ===
function buildExtraSpecsHTML(product) {
  let html = '';
  const specs = [
    { en: 'Wattage', ar: 'القدرة الكهربائية', val: product.wattage, valAr: product.wattage },
    { en: 'Voltage', ar: 'الجهد الكهربائي', val: product.voltage, valAr: product.voltage },
    { en: 'Plug Type', ar: 'نوع القابس', val: product.plugType, valAr: product.plugTypeAr || product.plugType },
    { en: 'Base Type', ar: 'نوع القاعدة', val: product.baseType, valAr: product.baseTypeAr || product.baseType },
    { en: 'Material', ar: 'المادة', val: product.material, valAr: product.materialAr || product.material },
  ];
  specs.forEach(s => {
    if (s.val) {
      html += `
        <div class="product-desc-block">
          <div class="product-desc-en">
            <div class="product-desc-label">${s.en}</div>
            <div class="product-desc-value">${s.val}</div>
          </div>
          <div class="product-desc-ar">
            <div class="product-desc-label">${s.ar}</div>
            <div class="product-desc-value">${s.valAr || ''}</div>
          </div>
        </div>
      `;
    }
  });
  return html;
}

// === EXTRA SPECS HELPER (Mobile) ===
function buildMobileExtraSpecsHTML(product) {
  let html = '';
  const specs = [
    { en: 'Wattage', ar: 'القدرة الكهربائية', val: product.wattage, valAr: product.wattage },
    { en: 'Voltage', ar: 'الجهد الكهربائي', val: product.voltage, valAr: product.voltage },
    { en: 'Plug Type', ar: 'نوع القابس', val: product.plugType, valAr: product.plugTypeAr || product.plugType },
    { en: 'Base Type', ar: 'نوع القاعدة', val: product.baseType, valAr: product.baseTypeAr || product.baseType },
    { en: 'Material', ar: 'المادة', val: product.material, valAr: product.materialAr || product.material },
  ];
  specs.forEach(s => {
    if (s.val) {
      html += `
        <div class="mobile-detail-block">
          <div class="mobile-detail-title"><span>${s.en}</span><span class="arabic-text">${s.ar}</span></div>
          <div class="mobile-detail-content"><p>${s.val}</p><p class="arabic-text">${s.valAr || ''}</p></div>
        </div>
      `;
    }
  });
  return html;
}

// === VARIANT SELECTION HANDLER ===
function selectVariant(variantId, productId, prefix) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  const variant = product.variants.find(v => v.id === variantId);
  if (!variant || variant.quantity === 0) return;

  window._selectedVariant = variant;

  // Highlight selected tile (for both desktop and mobile)
  ['dsk', 'mob'].forEach(p => {
    document.querySelectorAll(`[id^="${p}-vtile-"]`).forEach(el => el.classList.remove('selected'));
    const tile = document.getElementById(`${p}-vtile-${variantId}`);
    if (tile) tile.classList.add('selected');
    const nameEl = document.getElementById(`${p}-selectedName`);
    if (nameEl) nameEl.textContent = '✓ ' + variant.name;
  });

  // Swap main image to variant image
  if (variant.image) {
    const mainImg = document.getElementById('mainImage');
    if (mainImg) mainImg.src = variant.image;
    // Mobile carousel — scroll to first or swap first image
    const mobileCarousel = document.getElementById('mobileCarousel');
    if (mobileCarousel) {
      const firstSlideImg = mobileCarousel.querySelector('.mobile-carousel-slide img');
      if (firstSlideImg) firstSlideImg.src = variant.image;
      mobileCarousel.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }

  // Enable Add to Cart buttons
  const desktopBtn = document.getElementById('addToCartBtn');
  const mobileBtn = document.getElementById('mobileAddToCartBtn');

  [desktopBtn, mobileBtn].forEach(btn => {
    if (btn && !btn.classList.contains('product-btn-transformed') && btn.tagName === 'BUTTON') {
      btn.innerHTML = 'Add to Cart | <span class="arabic-text">أضف إلى السلة</span>';
      btn.disabled = false;
      btn.style.background = '#1a3a52';
      btn.style.cursor = 'pointer';
    }
  });

  // If this variant is already in cart, show quantity stepper
  const localCart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingItem = localCart.find(i => i.id === product.id && i.variantId === variantId);
  if (existingItem) {
    // Transform button OR replace existing stepper with this variant's stepper
    if (desktopBtn && desktopBtn.tagName === 'BUTTON') {
      transformToQtyButtonVariant(desktopBtn, product, variant);
    } else {
      // Button is already a stepper (for a different variant) — swap it
      const desktopTransformed = document.querySelector('.desktop-product .product-btn-transformed');
      if (desktopTransformed) replaceStepperForVariant(desktopTransformed, product, variant);
    }
    if (mobileBtn && mobileBtn.tagName === 'BUTTON') {
      transformToQtyButtonVariant(mobileBtn, product, variant);
    } else {
      const mobileTransformed = document.querySelector('.mobile-product-page .product-btn-transformed');
      if (mobileTransformed) replaceStepperForVariant(mobileTransformed, product, variant);
    }
  } else {
    // Reset to "Add to Cart" if not in cart — check if currently transformed
    const desktopTransformed = document.querySelector('.desktop-product .product-btn-transformed');
    if (desktopTransformed) {
      desktopTransformed.outerHTML = `<button class="add-to-cart-btn" id="addToCartBtn">Add to Cart | <span class="arabic-text">أضف إلى السلة</span></button>`;
      const newBtn = document.getElementById('addToCartBtn');
      if (newBtn) {
        newBtn.onclick = function() {
          if (addToCartHandlerRef()) transformToQtyButtonVariant(this, product, window._selectedVariant);
        };
      }
    }
    const mobileTransformed = document.querySelector('.mobile-product-page .product-btn-transformed');
    if (mobileTransformed) {
      mobileTransformed.outerHTML = `<button class="mobile-add-to-cart" id="mobileAddToCartBtn">Add to Cart | <span class="arabic-text">أضف إلى السلة</span></button>`;
      const newBtn = document.getElementById('mobileAddToCartBtn');
      if (newBtn) {
        newBtn.onclick = function() {
          if (addToCartHandlerRef()) transformToQtyButtonVariant(this, product, window._selectedVariant);
        };
      }
    }
  }
}

// Replace an existing stepper div with a different variant's stepper
function replaceStepperForVariant(stepperDiv, product, variant) {
  const localCart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = localCart.find(i => i.id === product.id && i.variantId === variant.id);
  const qty = item ? item.quantity : 1;

  stepperDiv.outerHTML = `
    <div class="grid-qty-control product-btn-transformed" id="transformedBtn-${product.id}">
      <button class="grid-qty-btn" onclick="productVariantQtyChange(${product.id}, ${variant.id}, -1)">−</button>
      <span class="grid-qty-display" id="qtyDisplay-${product.id}-${variant.id}" onclick="if(typeof toggleCart === 'function') toggleCart(); else if(typeof toggleCartSidebar === 'function') toggleCartSidebar();" style="cursor:pointer;">${qty}</span>
      <button class="grid-qty-btn" onclick="productVariantQtyChange(${product.id}, ${variant.id}, 1)">+</button>
    </div>
  `;
}

// Transform button to qty control for variant items
function transformToQtyButtonVariant(btn, product, variant) {
  const localCart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = localCart.find(i => i.id === product.id && i.variantId === variant.id);
  const qty = item ? item.quantity : 1;

  btn.outerHTML = `
    <div class="grid-qty-control product-btn-transformed" id="transformedBtn-${product.id}">
      <button class="grid-qty-btn" onclick="productVariantQtyChange(${product.id}, ${variant.id}, -1)">−</button>
      <span class="grid-qty-display" id="qtyDisplay-${product.id}-${variant.id}" onclick="if(typeof toggleCart === 'function') toggleCart(); else if(typeof toggleCartSidebar === 'function') toggleCartSidebar();" style="cursor:pointer;">${qty}</span>
      <button class="grid-qty-btn" onclick="productVariantQtyChange(${product.id}, ${variant.id}, 1)">+</button>
    </div>
  `;
  updateTierHighlight(product.id);
}

// Handle quantity change for variant items on product page
function productVariantQtyChange(productId, variantId, change) {
  let localCart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = localCart.find(i => i.id === productId && i.variantId === variantId);
  const product = products.find(p => p.id === productId);
  const variant = product ? product.variants.find(v => v.id === variantId) : null;

  if (!item) return;

  const newQty = item.quantity + change;

  if (change > 0) {
    const maxAllowed = Math.min(MAX_QTY_PER_PRODUCT, variant ? variant.quantity : MAX_QTY_PER_PRODUCT);
    if (newQty > maxAllowed) {
      showProductPageMaxLimitMessage(productId, maxAllowed);
      return;
    }
  }

  if (newQty <= 0) {
    localCart = localCart.filter(i => !(i.id === productId && i.variantId === variantId));
    localStorage.setItem("cart", JSON.stringify(localCart));
    // Reset buttons back to "Add to Cart"
    document.querySelectorAll(`[id="transformedBtn-${productId}"]`).forEach(el => {
      const isMobile = el.closest('.mobile-product-page') !== null;
      const btnId = isMobile ? 'mobileAddToCartBtn' : 'addToCartBtn';
      const btnClass = isMobile ? 'mobile-add-to-cart' : 'add-to-cart-btn';
      el.outerHTML = `<button class="${btnClass}" id="${btnId}">Add to Cart | <span class="arabic-text">أضف إلى السلة</span></button>`;
    });
    // Re-attach handlers
    const newDesktopBtn = document.getElementById('addToCartBtn');
    const newMobileBtn = document.getElementById('mobileAddToCartBtn');
    if (newDesktopBtn) newDesktopBtn.onclick = function() {
      if (addToCartHandlerRef()) transformToQtyButtonVariant(this, product, window._selectedVariant);
    };
    if (newMobileBtn) newMobileBtn.onclick = function() {
      if (addToCartHandlerRef()) transformToQtyButtonVariant(this, product, window._selectedVariant);
    };
  } else {
    item.quantity = newQty;
    localStorage.setItem("cart", JSON.stringify(localCart));
    // Update ALL matching qty displays (desktop + mobile have same ID)
    document.querySelectorAll(`[id="qtyDisplay-${productId}-${variantId}"]`).forEach(el => {
      el.textContent = newQty;
    });
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
  updateTierHighlight(productId);
  if (change > 0 && typeof pulseBadge === 'function') pulseBadge();
}

// Reference to addToCartHandler (set inside initProductPage, used by selectVariant)
var addToCartHandlerRef = function() { return false; };

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
  
  if (bottomHomeBtn) bottomHomeBtn.onclick = function() {
    if (cartSidebar && cartSidebar.classList.contains('active')) {
      cartSidebar.classList.remove('active');
      if (bottomCartBtn) bottomCartBtn.classList.remove('cart-active');
      document.body.style.overflow = '';
      return;
    }
    window.location.href = 'index.html';
  };
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
  if (closeCart) closeCart.onclick = function() { if (cartSidebar) { cartSidebar.classList.remove('active'); if (bottomCartBtn) bottomCartBtn.classList.remove('cart-active'); document.body.style.overflow = ''; } };
  
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
    const chevron = '<svg class="menu-chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>';
    overlay.innerHTML = `
      <div class="mobile-menu">
        <a href="index.html#products">
            <div class="menu-icon-box"><svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></svg></div>
            <div class="menu-text"><span class="menu-en">Shop</span><span class="menu-ar">تسوق</span></div>
            ${chevron}
        </a>
        <a href="index.html?showAbout=true#about">
            <div class="menu-icon-box"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></div>
            <div class="menu-text"><span class="menu-en">About</span><span class="menu-ar">من نحن</span></div>
            ${chevron}
        </a>
        <a href="index.html#contact">
            <div class="menu-icon-box"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
            <div class="menu-text"><span class="menu-en">Contact</span><span class="menu-ar">اتصل بنا</span></div>
            ${chevron}
        </a>
        <a href="index.html#terms">
            <div class="menu-icon-box"><svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg></div>
            <div class="menu-text"><span class="menu-en">Terms</span><span class="menu-ar">الشروط</span></div>
            ${chevron}
        </a>
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
