/**
 * shop.js — Shop page initialization
 * Overrides the default window.onload from app.js with shop-specific behavior.
 * This page shows ONLY the products grid with category filters and breadcrumb.
 */

(function() {
    // app.js sets window.onload — we override it for this page
    window.onload = function() {
        createCategoryFilters();

        var urlParams = new URLSearchParams(window.location.search);
        var categoryParam = urlParams.get('category');
        loadProducts(categoryParam || 'All Products');
        updateCart();

        // Update breadcrumb if a specific category is selected
        if (categoryParam && categoryParam !== 'All Products') {
            var breadcrumb = document.getElementById('categoryBreadcrumb');
            if (breadcrumb) {
                breadcrumb.innerHTML =
                    '<a href="index.html">Home</a>' +
                    '<span class="crumb-sep">/</span>' +
                    '<a href="shop.html">Shop</a>' +
                    '<span class="crumb-sep">/</span>' +
                    '<span class="crumb-current">' + categoryParam + '</span>';
            }
        }

        // Auto-open cart if redirected back from login
        if (urlParams.get('openCart') === 'true') {
            setTimeout(function() { toggleCart(); }, 300);
            var cleanUrl = window.location.href.split('?')[0];
            window.history.replaceState({}, '', cleanUrl);
        }

        // Handle bundle param — auto-add bundle products to cart
        var bundleParam = urlParams.get('bundle');
        if (bundleParam) {
            var BUNDLES = {
                'desk-upgrade': [
                    { slug: 'prodesk-cable-management-kit-300pcs', qty: 1 },
                    { slug: 'dangling-buddies-fridge-magnets', qty: 1 }
                ]
            };
            var bundleDef = BUNDLES[bundleParam];
            function applyBundle(def) {
                var added = false;
                var variantSlugs = [];
                def.forEach(function(item) {
                    var product = products.find(function(p) { return p.slug === item.slug; });
                    if (!product || product.quantity === 0) return;
                    // Products with variants need user to pick — add non-variant ones, flag variant ones
                    if (product.variants && product.variants.length > 0) {
                        variantSlugs.push(item.slug);
                        return;
                    }
                    var existing = cart.find(function(c) { return c.id === product.id; });
                    if (!existing) {
                        cart.push(Object.assign({}, product, { quantity: item.qty }));
                        added = true;
                    }
                });
                if (added) {
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCart();
                    updateCartCounts();
                    if (variantSlugs.length === 0) {
                        setTimeout(function() { toggleCart(); }, 400);
                    }
                }
                if (variantSlugs.length > 0 && typeof orloToast === 'function') {
                    orloToast('Pick your Dangling Buddy character to complete the bundle!', 'info');
                    // Scroll to the variant product card so user can pick
                    setTimeout(function() {
                        var card = document.querySelector('[data-slug="' + variantSlugs[0] + '"]');
                        if (!card) {
                            // Try finding the product card by searching links
                            var links = document.querySelectorAll('a[href*="' + variantSlugs[0] + '"]');
                            if (links.length > 0) card = links[0].closest('.product-card') || links[0];
                        }
                        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 600);
                }
                if (!added && variantSlugs.length === 0 && typeof orloToast === 'function') {
                    orloToast('Bundle products are currently unavailable.', 'error');
                }
            }

            if (bundleDef && products.length > 0) {
                applyBundle(bundleDef);
            } else if (bundleDef) {
                // Wait for products to load via productsReady event
                var bundleApplied = false;
                window.addEventListener('productsReady', function() {
                    if (!bundleApplied && products.length > 0) {
                        bundleApplied = true;
                        applyBundle(bundleDef);
                    }
                });
                // Fallback timeout in case event already fired
                setTimeout(function() {
                    if (!bundleApplied && products.length > 0) {
                        bundleApplied = true;
                        applyBundle(bundleDef);
                    }
                }, 5000);
            } else if (!bundleDef && typeof orloToast === 'function') {
                orloToast('Unknown bundle.', 'error');
            }
            // Clean URL
            var cleanBundleUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanBundleUrl);
        }

        // Handle search param
        var searchTerm = urlParams.get('search');
        if (searchTerm) {
            var searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = searchTerm;
                searchProducts();
            }
        }

        // Promo banner threshold
        if (typeof FREE_DELIVERY_THRESHOLD !== 'undefined') {
            var promoBanner = document.querySelector('.mobile-promo-banner');
            if (promoBanner) {
                promoBanner.innerHTML = (typeof SVG_TRUCK_INLINE !== 'undefined' ? SVG_TRUCK_INLINE : '') +
                    ' Free delivery over AED ' + FREE_DELIVERY_THRESHOLD +
                    ' | <span class="arabic-text">توصيل مجاني فوق ' + FREE_DELIVERY_THRESHOLD + ' درهم</span>';
            }
        }

        // Hamburger menu
        var hamburger = document.getElementById("hamburger");
        var navLinks = document.getElementById("navLinks");
        if (hamburger && navLinks) {
            hamburger.addEventListener('click', function() {
                hamburger.classList.toggle("active");
                navLinks.classList.toggle("active");
                if (navLinks.classList.contains("active")) { lockScroll(); } else { unlockScroll(); }
            });
            navLinks.querySelectorAll("a").forEach(function(link) {
                link.addEventListener("click", function() {
                    hamburger.classList.remove("active");
                    navLinks.classList.remove("active");
                    unlockScroll();
                });
            });
        }

        // Search
        var searchBtn = document.getElementById("searchBtn");
        var searchInputEl = document.getElementById("searchInput");
        if (searchBtn) searchBtn.onclick = function() {
            var dd = document.getElementById('searchAutocomplete');
            if (dd) dd.classList.remove('active');
            searchProducts();
        };
        if (searchInputEl) {
            searchInputEl.addEventListener('input', function() {
                showAutocomplete(this.value.toLowerCase().trim());
            });
            searchInputEl.addEventListener('keydown', function(e) {
                if (e.key === 'ArrowDown') { e.preventDefault(); navigateAutocomplete(1); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); navigateAutocomplete(-1); }
                else if (e.key === 'Enter') {
                    e.preventDefault();
                    var dd = document.getElementById('searchAutocomplete');
                    if (dd) dd.classList.remove('active');
                    searchProducts();
                } else if (e.key === 'Escape') {
                    var dd = document.getElementById('searchAutocomplete');
                    if (dd) dd.classList.remove('active');
                }
            });
            searchInputEl.addEventListener('blur', function() {
                setTimeout(function() {
                    var dd = document.getElementById('searchAutocomplete');
                    if (dd) dd.classList.remove('active');
                }, 150);
            });
        }

        // Price sort arrows
        var sortAscBtn = document.getElementById('sortPriceAsc');
        var sortDescBtn = document.getElementById('sortPriceDesc');
        function updateSortArrows() {
            if (sortAscBtn) sortAscBtn.classList.toggle('active', activeSort === 'price-asc');
            if (sortDescBtn) sortDescBtn.classList.toggle('active', activeSort === 'price-desc');
        }
        if (sortAscBtn) {
            sortAscBtn.addEventListener('click', function() {
                activeSort = activeSort === 'price-asc' ? 'default' : 'price-asc';
                updateSortArrows();
                var term = document.getElementById('searchInput').value.trim();
                if (term) { searchProducts(); } else { loadProducts(selectedCategory); }
            });
        }
        if (sortDescBtn) {
            sortDescBtn.addEventListener('click', function() {
                activeSort = activeSort === 'price-desc' ? 'default' : 'price-desc';
                updateSortArrows();
                var term = document.getElementById('searchInput').value.trim();
                if (term) { searchProducts(); } else { loadProducts(selectedCategory); }
            });
        }

        // Cart buttons
        var cartIcon = document.getElementById("cartIcon");
        var closeCartBtn = document.getElementById("closeCart");
        var mobileCartIcon = document.getElementById("mobileCartIcon");
        if (cartIcon) cartIcon.onclick = toggleCart;
        if (closeCartBtn) closeCartBtn.onclick = toggleCart;
        if (mobileCartIcon) mobileCartIcon.onclick = toggleCart;

        // Policy modal
        var policyModal = document.getElementById("policyModal");
        if (policyModal) policyModal.onclick = function(e) {
            if (e.target.id === "policyModal") closePolicy();
        };

        // Mobile bottom nav
        var bottomHomeBtn = document.getElementById("bottomHomeBtn");
        var bottomCartBtn = document.getElementById("bottomCartBtn");
        var bottomMenuBtn = document.getElementById("bottomMenuBtn");
        var bottomAccountBtn = document.getElementById("bottomAccountBtn");

        function moveIndicator(index) {
            var indicator = document.getElementById('bottomNavIndicator');
            if (indicator) indicator.style.left = 'calc(' + (index * 25) + '% + 12.5% - 25px)';
        }
        document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item').forEach(function(item, i) {
            item.addEventListener('click', function() { moveIndicator(i); });
        });
        moveIndicator(0);

        if (bottomHomeBtn) {
            bottomHomeBtn.onclick = function() {
                var cartSidebar = document.getElementById("cartSidebar");
                if (cartSidebar && cartSidebar.classList.contains("active")) {
                    cartSidebar.classList.remove("active");
                    if (bottomCartBtn) bottomCartBtn.classList.remove("cart-active");
                    unlockScroll();
                    return;
                }
                window.location.href = 'index.html';
            };
        }
        if (bottomCartBtn) bottomCartBtn.onclick = toggleCart;
        if (bottomMenuBtn) {
            bottomMenuBtn.onclick = function() {
                var cartSidebar = document.getElementById("cartSidebar");
                if (cartSidebar && cartSidebar.classList.contains("active")) {
                    cartSidebar.classList.remove("active");
                    if (bottomCartBtn) bottomCartBtn.classList.remove("cart-active");
                    unlockScroll();
                }
                toggleMobileMenu();
            };
        }
        if (bottomAccountBtn) {
            bottomAccountBtn.onclick = function() {
                var token = localStorage.getItem('orlo_token') || sessionStorage.getItem('orlo_token');
                window.location.href = token ? 'account.html' : 'login.html';
            };
        }

        // Update account link
        updateAccountLink();
    };

    function updateAccountLink() {
        var token = localStorage.getItem('orlo_token') || sessionStorage.getItem('orlo_token');
        var customer = JSON.parse(localStorage.getItem('orlo_customer') || sessionStorage.getItem('orlo_customer') || 'null');
        var accountLink = document.getElementById('accountLink');
        var bottomAccountLabel = document.getElementById('bottomAccountLabel');
        if (token && customer) {
            var firstName = customer.name ? customer.name.split(' ')[0] : 'Account';
            if (accountLink) { accountLink.innerHTML = firstName + '<br><span class="arabic-text">حسابي</span>'; accountLink.href = 'account.html'; }
            if (bottomAccountLabel) bottomAccountLabel.textContent = firstName;
        }
    }
})();
