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
