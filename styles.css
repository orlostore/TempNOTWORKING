/* ===================== RESET ===================== */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* ===================== VARIABLES ===================== */
:root {
  --primary: #2c4a5c;
  --accent: #e07856;
  --accent-soft: rgba(224,120,86,.15);
  --text: #333;
  --muted: #666;
  --bg: #f8f9fa;
  --white: #ffffff;
  --radius: 10px;
  --shadow-sm: 0 3px 10px rgba(0,0,0,.08);
  --shadow-md: 0 6px 20px rgba(0,0,0,.12);
  --shadow-lg: 0 12px 40px rgba(0,0,0,.2);
}

/* ===================== ARABIC ===================== */
.arabic-text {
  font-family: 'Almarai', sans-serif;
  direction: rtl;
  display: block;
}

/* ===================== BASE ===================== */
body {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.65;
  font-size: 15px;
  overflow-x: hidden;
}

/* Accessibility */
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 3px solid var(--accent-soft);
  outline-offset: 2px;
}

/* ===================== HEADER ===================== */
header {
  background: var(--white);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 1000;
}

nav {
  max-width: 1600px;
  margin: auto;
  padding: 1.5rem 2.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

/* Logo — responsive, no jumps */
.logo-img {
  width: clamp(70px, 10vw, 140px);
  height: auto;
}

/* ===================== SEARCH ===================== */
.search-container {
  flex: 1;
  max-width: 680px;
  display: flex;
}

.search-input {
  flex: 1;
  padding: 1rem 1.4rem;
  border: 2px solid #ddd;
  border-radius: 28px 0 0 28px;
  font-size: 1.05rem;
}

.search-input:focus {
  border-color: var(--accent);
}

.search-btn {
  padding: 1rem 2rem;
  border-radius: 0 28px 28px 0;
  border: none;
  background: var(--accent);
  color: white;
  cursor: pointer;
  font-size: 1.35rem;
}

/* ===================== NAV LINKS ===================== */
.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
  align-items: center;
}

.nav-links a {
  text-decoration: none;
  color: var(--text);
  font-weight: 500;
  font-size: 1.05rem;
  text-align: center;
  line-height: 1.4;
}

.nav-links a .arabic-text {
  font-size: 0.9rem;
  color: var(--muted);
}

.nav-links a:hover {
  color: var(--accent);
}

/* ===================== CART ICON ===================== */
.cart-icon {
  position: relative;
  font-size: 1.9rem;
  cursor: pointer;
}

.cart-count {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--accent);
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: .8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

/* ===================== HERO ===================== */
.hero {
  background: linear-gradient(135deg, var(--primary), #3a5f75);
  color: #fff;
  padding: clamp(3rem, 6vw, 5rem) 2rem;
  text-align: center;
}

.hero h1 {
  font-size: clamp(2.2rem, 4vw, 3.2rem);
  font-weight: 700;
}

.hero-arabic {
  font-size: clamp(2.2rem, 4vw, 3.2rem);
  margin-bottom: 1.5rem;
}

.hero p {
  font-size: 1.25rem;
  max-width: 800px;
  margin: 0 auto 1rem;
  opacity: .95;
}

.hero .btn {
  background: var(--accent);
  padding: 1.15rem 3rem;
  border-radius: var(--radius);
  color: white;
  text-decoration: none;
  display: inline-block;
  font-weight: 600;
  font-size: 1.15rem;
  transition: transform .2s ease, box-shadow .2s ease;
}

.hero .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(224,120,86,.45);
}

/* ===================== CONTAINER ===================== */
.container {
  max-width: 1600px;
  margin: auto;
  padding: 3.5rem 2.5rem;
}

/* ===================== TITLES ===================== */
.section-title {
  text-align: center;
  margin-bottom: 2.5rem;
  color: var(--primary);
  font-size: 2.4rem;
  font-weight: 700;
}

.section-arabic {
  font-size: 2.1rem;
  color: var(--muted);
}

/* ===================== CATEGORIES ===================== */
.category-filters {
  display: flex;
  justify-content: center;
  gap: 1.25rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.category-btn {
  padding: 0.7rem 2rem;
  border-radius: 28px;
  border: 2px solid var(--primary);
  background: white;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all .25s ease;
}

.category-btn.active,
.category-btn:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

/* ===================== PRODUCTS ===================== */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2.5rem;
}

.product-card {
  background: white;
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: transform .25s ease, box-shadow .25s ease;
}

.product-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-md);
}

.badge {
  position: absolute;
  top: 14px;
  right: 14px;
  background: var(--accent);
  color: white;
  padding: .45rem 1.2rem;
  border-radius: 20px;
  font-size: .85rem;
  font-weight: 700;
}

.product-image {
  height: 250px;
  background: #f3f3f3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
}

.product-info {
  padding: 2rem;
}

.product-title {
  font-size: 1.25rem;
  margin: .75rem 0;
  color: var(--primary);
}

.product-price {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent);
}

.add-to-cart {
  width: 100%;
  padding: 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.add-to-cart:hover {
  background: #1e3545;
}

/* ===================== CART ===================== */
.cart-sidebar {
  position: fixed;
  top: 0;
  right: -100%;
  width: min(100%, 760px);
  height: 100vh;
  background: white;
  z-index: 5000;
  box-shadow: -2px 0 30px rgba(0,0,0,.35);
  transition: right .3s ease;
  display: flex;
  flex-direction: column;
}

.cart-sidebar.active {
  right: 0;
}

/* ===================== FOOTER ===================== */
footer {
  background: var(--primary);
  color: white;
  text-align: center;
  padding: 3rem 2rem;
}

.footer-links a {
  color: white;
  text-decoration: none;
  opacity: .9;
}

.footer-links a:hover {
  opacity: 1;
  text-decoration: underline;
}

/* ===================== MOTION REDUCTION ===================== */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}

/* ===================== MOBILE ===================== */
@media (max-width: 768px) {
  nav {
    flex-wrap: wrap;
    padding: 1.25rem 1.5rem;
  }

  .search-container {
    width: 100%;
    order: 3;
    margin-top: 1rem;
  }

  .hero p {
    font-size: 1.1rem;
  }

  .container {
    padding: 2.5rem 1.5rem;
  }
}

