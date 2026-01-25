let cart = JSON.parse(localStorage.getItem("cart")) || [];
let selectedCategory = "All Products";

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function getCategories() {
  return ["All Products", ...new Set(products.map(p => p.category))];
}

function renderProducts(list) {
  const grid = document.getElementById("productsGrid");

  if (!list.length) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center">No products found</p>`;
    return;
  }

  grid.innerHTML = list.map(p => `
    <div class="product-card">
      ${p.featured ? `<span class="badge">Best Seller</span>` : ``}
      <div class="product-image">${p.image}</div>
      <div class="product-info">
        <small>${p.category}</small>
        <h3 class="product-title">${p.name}</h3>
        <p>${p.description}</p>
        <div class="product-price">${p.price} AED</div>
        <button class="add-to-cart" onclick="addToCart(${p.id})">Add to Cart</button>
      </div>
    </div>
  `).join("");
}

function loadProducts(category = "All Products") {
  selectedCategory = category;
  const list = category === "All Products"
    ? products
    : products.filter(p => p.category === category);

  renderProducts(list);
  updateCategoryButtons();
}

function createCategoryFilters() {
  const container = document.getElementById("categoryFilters");
  container.innerHTML = getCategories().map(cat => `
    <button class="category-btn ${cat === selectedCategory ? "active" : ""}"
      onclick="loadProducts('${cat}')">
      ${cat}<br>
      <span class="arabic-text">${categoryTranslations[cat] || ""}</span>
    </button>
  `).join("");
}

function updateCategoryButtons() {
  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.classList.toggle("active", btn.innerText.includes(selectedCategory));
  });
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  const item = cart.find(i => i.id === id);

  if (item) item.quantity++;
  else cart.push({ ...product, quantity: 1 });

  saveCart();
  updateCart();
}

function updateCart() {
  document.getElementById("cartCount").innerText =
    cart.reduce((s, i) => s + i.quantity, 0);
}

function toggleCart() {
  document.getElementById("cartSidebar").classList.toggle("active");
}

function toggleAbout() {
  const about = document.getElementById("about");
  about.style.display = about.style.display === "none" ? "block" : "none";
}

window.onload = () => {
  createCategoryFilters();
  loadProducts();
  updateCart();

  document.getElementById("cartIcon").onclick = toggleCart;
  document.getElementById("closeCart").onclick = toggleCart;
};
