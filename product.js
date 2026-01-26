// Get product slug from URL
const params = new URLSearchParams(window.location.search);
const slug = params.get("product");

// Find product
const product = products.find(p => p.slug === slug);

if (!product) {
  document.body.innerHTML = "<h2 style='text-align:center;padding:2.4rem;'>Product not found</h2>";
  throw new Error("Product not found");
}

// Fill product data
document.getElementById("productTitle").innerText = product.name;
document.getElementById("productCategory").innerText = product.category;

// Build detailed description
let descriptionHTML = `
  <h3 style="margin-top:1.2rem;">Description</h3>
  <p>${product.detailedDescription || product.description}</p>
`;

if (product.detailedDescriptionAr) {
  descriptionHTML += `<p class="arabic-text" style="margin-top:0.8rem; font-family: 'Almarai', sans-serif; direction: rtl; text-align: right;">${product.detailedDescriptionAr}</p>`;
}

if (product.colors) {
  descriptionHTML += `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.6rem; margin-top:1.2rem;">
      <div>
        <h3 style="margin:0 0 0.6rem 0;">Available Colors</h3>
        <p style="margin:0;">${product.colors}</p>
      </div>
      <div style="text-align:right;">
        <h3 style="margin:0 0 0.6rem 0; font-family: 'Almarai', sans-serif;">الألوان المتاحة</h3>
        <p style="margin:0; font-family: 'Almarai', sans-serif; direction: rtl;">${product.colorsAr || ''}</p>
      </div>
    </div>
  `;
}

if (product.packaging) {
  descriptionHTML += `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.6rem; margin-top:1.2rem;">
      <div>
        <h3 style="margin:0 0 0.6rem 0;">Packaging</h3>
        <p style="margin:0;">${product.packaging}</p>
      </div>
      <div style="text-align:right;">
        <h3 style="margin:0 0 0.6rem 0; font-family: 'Almarai', sans-serif;">التعبئة والتغليف</h3>
        <p style="margin:0; font-family: 'Almarai', sans-serif; direction: rtl;">${product.packagingAr || ''}</p>
      </div>
    </div>
  `;
}

if (product.specifications && product.specifications.length > 0) {
  descriptionHTML += `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.6rem; margin-top:1.2rem;">
      <div>
        <h3 style="margin:0 0 0.6rem 0;">Specifications</h3>
        <ul style="margin:0; padding-left:1.2rem; line-height:1.8;">
          ${product.specifications.map(spec => `<li>${spec}</li>`).join('')}
        </ul>
      </div>
      <div style="text-align:right;">
        <h3 style="margin:0 0 0.6rem 0; font-family: 'Almarai', sans-serif;">المواصفات</h3>
        ${product.specificationsAr ? `<ul style="margin:0; padding-right:1.2rem; line-height:1.8; font-family: 'Almarai', sans-serif; direction: rtl;">${product.specificationsAr.map(spec => `<li>${spec}</li>`).join('')}</ul>` : ''}
      </div>
    </div>
  `;
}

document.getElementById("productDescription").innerHTML = descriptionHTML;
document.getElementById("productPrice").innerText = product.price + " AED";

// Display images - Amazon-style gallery
const gallery = document.getElementById("gallery");

if (product.images && product.images.length > 0) {
  // Main image container
  let galleryHTML = `
    <div class="image-gallery">
      <div class="main-image-container">
        <img id="mainImage" src="${product.images[0]}" alt="${product.name}" class="main-product-image">
        <div class="zoom-hint">🔍 Click to zoom</div>
      </div>
      <div class="thumbnail-strip">
        ${product.images.map((img, index) => `
          <img src="${img}" 
               alt="${product.name} ${index + 1}" 
               class="thumbnail ${index === 0 ? 'active' : ''}" 
               onclick="changeMainImage('${img}', ${index})"
               style="cursor:pointer;">
        `).join('')}
      </div>
    </div>
  `;
  
  gallery.innerHTML = galleryHTML;
}

// Function to change main image when thumbnail clicked
window.changeMainImage = function(imgSrc, index) {
  const mainImg = document.getElementById('mainImage');
  mainImg.src = imgSrc;
  
  // Update active thumbnail
  document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === index);
  });
};

// Zoom/Lightbox functionality
document.addEventListener('DOMContentLoaded', () => {
  const mainImg = document.getElementById('mainImage');
  if (mainImg) {
    mainImg.style.cursor = 'zoom-in';
    mainImg.onclick = () => {
      // Create lightbox
      const lightbox = document.createElement('div');
      lightbox.className = 'lightbox';
      lightbox.innerHTML = `
        <div class="lightbox-content">
          <span class="lightbox-close">&times;</span>
          <img src="${mainImg.src}" alt="${product.name}" class="lightbox-image">
        </div>
      `;
      document.body.appendChild(lightbox);
      document.body.style.overflow = 'hidden';
      
      // Close lightbox
      lightbox.onclick = (e) => {
        if (e.target === lightbox || e.target.className === 'lightbox-close') {
          document.body.removeChild(lightbox);
          document.body.style.overflow = 'auto';
        }
      };
    };
  }
});

// Add to cart functionality (uses same cart logic as main page)
document.getElementById("addToCartBtn").onclick = () => {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const item = cart.find(i => i.id === product.id);
  if (item) {
    item.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  
  // Update cart count if element exists
  const cartCount = document.getElementById("cartCount");
  if (cartCount) {
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    cartCount.textContent = totalItems;
  }
  
  alert(`${product.name} added to cart!`);
};

// Initialize cart count on page load
window.addEventListener('DOMContentLoaded', () => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartCount = document.getElementById("cartCount");
  if (cartCount) {
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    cartCount.textContent = totalItems;
  }
});
