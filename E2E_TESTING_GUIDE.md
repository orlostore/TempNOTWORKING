# Orlo E2E Testing Guide — Customer & Owner

A complete step-by-step walkthrough to test every feature in Orlo from both the **customer** (shopper) and **owner** (admin) perspectives.

> **Prerequisite:** Stripe is in **test mode** (`sk_test_...`). Use test cards listed at the bottom.

---

## PART 1: OWNER (Admin) Testing

### Phase 1 — Admin Access & Login

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Open `/admin.html` | Admin login prompt appears |
| 2 | Enter admin key (or use `?key=YOUR_KEY` URL) | Dashboard loads with product list, stats, and sidebar |
| 3 | Try an incorrect admin key | Access denied / error shown |

---

### Phase 2 — Product Management (CRUD)

#### 2A — Add a Product

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Click "Add Product" in admin dashboard | Product form opens |
| 2 | Fill in all fields: name, nameAr, slug, description, descriptionAr, price, quantity, category, categoryAr, images (mainImage + extras) | All fields accept input |
| 3 | Save the product | Product appears in admin product list |
| 4 | Open the storefront (`/index.html`) | New product appears in catalog |
| 5 | Click the product | Product detail page (`/product.html?slug=...`) loads with correct info |
| 6 | Switch to Arabic | Arabic name, description, and category display correctly in RTL layout |

#### 2B — Edit a Product

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | In admin, find the product you just created | Product is listed |
| 2 | Click Edit, change the price from e.g. 25 to 35 AED | Form pre-fills with current values |
| 3 | Save | Price updates in admin list |
| 4 | Refresh storefront product page | New price (35 AED) shows on the product page |

#### 2C — Delete a Product

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | In admin, delete the test product | Product removed from list |
| 2 | Refresh storefront | Product no longer appears in catalog |
| 3 | Visit the old product URL directly | Appropriate "not found" or redirect behavior |

---

### Phase 3 — Inventory / Restock

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | In admin, find a product and note its stock quantity | Current quantity visible |
| 2 | Use quick-restock to **set** quantity to 50 | Quantity shows 50 |
| 3 | Use quick-restock to **add** 20 | Quantity shows 70 |
| 4 | Set quantity to 0 | Product shows as "Out of Stock" on storefront |
| 5 | Set quantity back to 10 | Product is purchasable again |
| 6 | Check low-stock alerts — set a product to quantity 3 | Admin dashboard shows yellow/red warning indicator |

---

### Phase 4 — Order Management (Admin)

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Navigate to Orders section in admin | Order list loads |
| 2 | View a completed order's details | Shows customer email, items, quantities, total, delivery zone, and Stripe session ID |
| 3 | Mark an order as "Shipped" via ship-order | Order status updates; shipping notification email sent to customer |
| 4 | Cancel an order from admin | Order marked cancelled; stock restored if applicable |

---

### Phase 5 — Process Returns (Admin)

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Find an order with a return request (create one from customer side first — see Part 2, Phase 8) | Return request visible in admin |
| 2 | Approve the return | Status updates; customer notified |
| 3 | Deny a return request | Status updates to denied; customer notified |

---

### Phase 6 — User Management (Admin)

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Navigate to Users section | List of registered customers loads |
| 2 | View customer details | Shows email, verification status, order count |

---

### Phase 7 — Store Settings (Admin)

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Navigate to Settings | Store settings page loads |
| 2 | Update any available settings (delivery zones, thresholds, etc.) | Changes save and take effect on storefront |

---

### Phase 8 — Product Reordering & Import

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Reorder products in admin (drag or use reorder controls) | Display order changes on storefront |
| 2 | (Optional) Test Google Sheets import via `/api/admin/import` | Products imported correctly |

---

### Phase 9 — Activity Log

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | After performing several admin actions, check Activity log | Recent actions (add/edit/delete/restock/ship) are logged |

---

## PART 2: CUSTOMER Testing

### Phase 1 — Browsing & Discovery

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Open `/index.html` (homepage) | Products load with images, names, prices |
| 2 | Scroll through the catalog | All products display correctly |
| 3 | Filter by category (click a category) | Only products in that category show |
| 4 | Search for a product by name | Matching products appear |
| 5 | Click a product card | Navigates to `/product.html?slug=...` with full details |
| 6 | View product images (swipe/click through gallery) | All images load and are swipeable |
| 7 | Check product specifications, packaging, colors info | All details display correctly |
| 8 | Switch language to Arabic | All text switches to Arabic; layout switches to RTL |
| 9 | Switch back to English | All text returns to English; layout returns to LTR |
| 10 | Test on mobile (or Chrome DevTools mobile mode) | Bottom navigation works; layout is responsive; touch-friendly |

---

### Phase 2 — Shopping Cart

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Add a product to cart | Cart icon updates with item count; toast/confirmation shown |
| 2 | Add another different product | Cart count increases; both items visible |
| 3 | Open cart view | Both items listed with names, prices, quantities |
| 4 | Increase quantity of an item | Quantity updates; total recalculates |
| 5 | Decrease quantity to 1 | Quantity shows 1 |
| 6 | Remove an item from cart | Item disappears; total recalculates |
| 7 | Close browser completely, then reopen site | Cart items persist (localStorage); quantities preserved |
| 8 | Try adding an out-of-stock product (quantity=0 in admin) | "Add to Cart" is disabled / "Out of Stock" shown |
| 9 | Try adding more than available stock (e.g., product has 3, try adding 5) | Capped at available quantity or error shown |

---

### Phase 3 — Delivery Zone & Pricing

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Add items totaling ~50 AED to cart | Subtotal shows 50 AED |
| 2 | Select delivery zone: **Dubai** | Delivery fee shows (e.g., 18 AED) |
| 3 | Switch to **Abu Dhabi** | Delivery fee changes to Abu Dhabi rate |
| 4 | Switch to other zones | Fee updates for each zone |
| 5 | Check "X AED more for free delivery" message | Message shows correct remaining amount |
| 6 | Add items to cross free delivery threshold (75 AED) | Delivery fee changes to **FREE**; message disappears |
| 7 | Check smart upsell suggestions | Products suggested to reach free delivery threshold |

---

### Phase 4 — Product Variants

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Go to a product with variants (e.g., different colors/sizes) | Variant selector is visible |
| 2 | Select a specific variant | Price updates to variant-specific price; image may change |
| 3 | Add to cart | Cart shows correct variant name and variant price |
| 4 | Change variant and add again | Both variants appear as separate cart items |

---

### Phase 5 — Tier/Quantity Discounts

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Find a product with pricing tiers | Tier pricing info is visible on product page |
| 2 | Add quantity below the tier threshold | Regular price shown |
| 3 | Increase quantity to hit a tier discount (e.g., buy 5+ for 10% off) | Discounted unit price applies; total recalculates |
| 4 | Verify total = discounted_price × quantity + delivery | Math checks out |

---

### Phase 6 — Checkout & Payment (Stripe Test Mode)

#### 6A — Happy Path: Successful Purchase

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Add 1-2 items to cart | Items in cart |
| 2 | Select delivery zone | Delivery fee calculated |
| 3 | Click "Pay by Card" | Redirected to Stripe Checkout page |
| 4 | Enter test card: `4242 4242 4242 4242`, any future expiry, any CVC | Card accepted |
| 5 | Complete payment | Redirected to `/success.html` with order confirmation |
| 6 | Check: cart is cleared | Cart is empty |
| 7 | Check: Stripe Dashboard shows successful payment | Payment visible in Stripe |
| 8 | Check: Stock decremented in admin dashboard | Quantities reduced by purchased amounts |

#### 6B — Declined Card

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Add items, proceed to Stripe checkout | Stripe page loads |
| 2 | Use decline card: `4000 0000 0000 0002` | "Card declined" error on Stripe page |
| 3 | Go back to store | Cart is preserved; stock unchanged |

#### 6C — Customer Cancels on Stripe

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Proceed to Stripe checkout, then click "Back" or close tab | Redirected to `/cancel.html` or nothing (tab closed) |
| 2 | Return to store | Cart preserved; stock unchanged; "Your cart is still waiting" message |

#### 6D — Insufficient Stock at Checkout

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | In admin, set product quantity to 2 | Stock is 2 |
| 2 | Add 3 of that product to cart | Cart shows 3 |
| 3 | Click "Pay by Card" | Error: "Only 2 available" — NOT redirected to Stripe |

#### 6E — Stock Changes Between Cart & Checkout

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Add 5 items (product has 5 in stock) | Cart shows 5 |
| 2 | In another browser/admin, reduce stock to 2 | Stock is now 2 |
| 3 | Click "Pay by Card" | Server-side check catches it; error shown with updated availability |

#### 6F — 3D Secure Authentication

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Checkout with card: `4000 0027 6000 3184` | 3DS challenge appears |
| 2 | Complete 3DS authentication | Payment succeeds; redirected to success page; stock deducted |

#### 6G — 3D Secure Failure

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Checkout with card: `4000 0084 0000 1629` | 3DS challenge appears |
| 2 | Fail the authentication | Payment fails; no stock deducted; cart preserved |

#### 6H — Other Card Errors

| Card | Scenario | Expected |
|------|----------|----------|
| `4000 0000 0000 9995` | Insufficient funds | Error shown |
| `4000 0000 0000 0069` | Expired card | Error shown |
| `4000 0000 0000 0127` | Incorrect CVC | Error shown |

---

### Phase 7 — Account Management

#### 7A — Signup

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Go to `/signup.html` | Signup form loads |
| 2 | Enter name, email, password | Fields validate |
| 3 | Submit | Account created; verification email sent |
| 4 | Check email inbox | Verification email received with link |
| 5 | Click verification link | Redirected to `/verify-email.html`; account verified |

#### 7B — Login

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Go to `/login.html` | Login form loads |
| 2 | Enter valid email & password | Logged in successfully |
| 3 | Check logged-in state | User icon/name shown; account page accessible |
| 4 | Try wrong password | Error message shown |
| 5 | Try unverified account | Appropriate message (verify first or resend link) |

#### 7C — Forgot Password & Reset

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Go to `/forgot-password.html` | Form loads with email field |
| 2 | Enter registered email, submit | "Reset link sent" message |
| 3 | Check email for reset link | Email received with reset link |
| 4 | Click link → `/reset-password.html` | Reset form loads with token |
| 5 | Enter new password, submit | Password updated successfully |
| 6 | Log in with new password | Login succeeds |

#### 7D — Account Page

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Go to `/account.html` while logged in | Account dashboard loads |
| 2 | View order history | Past orders listed with details (items, totals, dates, status) |
| 3 | View/edit profile info | Profile section shows name, email |
| 4 | Update profile (name, etc.) | Changes saved |
| 5 | Change password | Password updated; can log in with new password |
| 6 | Manage saved addresses | Can add/edit/delete delivery addresses |

#### 7E — Guest Checkout → Account Creation

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Do NOT log in | Guest state |
| 2 | Add items and complete payment as guest | Payment succeeds; success page shown |
| 3 | On success page, click "Create Account" | Account created with email from Stripe session |
| 4 | Check email | Temporary password and verification email sent |
| 5 | Log in with temporary password | Login works; order visible in account history |

#### 7F — Resend Verification Email

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Log in with unverified account | Prompt to verify appears |
| 2 | Click "Resend verification email" | New verification email sent |
| 3 | Click link in email | Account verified |

---

### Phase 8 — Post-Purchase (Customer)

#### 8A — Order History & Tracking

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Log in and go to `/account.html` | Account page loads |
| 2 | View orders section | Recent order(s) visible with status |
| 3 | After admin marks order as shipped | Status updates to "Shipped"; customer receives shipping notification email |

#### 8B — Cancel Order (Customer)

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Find a recent order that hasn't shipped | Cancel option available |
| 2 | Request cancellation | Order cancelled; stock restored |

#### 8C — Return Request

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Find a delivered/shipped order | Return option available |
| 2 | Submit return request | Request submitted; status shows "Return Requested" |
| 3 | Wait for admin to process (see Part 1, Phase 5) | Status updates to approved/denied |

---

### Phase 9 — Bilingual (Arabic) End-to-End

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Switch to Arabic from any page | Language switches; RTL layout activates |
| 2 | Browse products | Arabic names, descriptions, categories shown |
| 3 | Add to cart | Cart shows Arabic product names |
| 4 | Go through checkout | All UI text in Arabic |
| 5 | View account page in Arabic | Profile, orders in Arabic |
| 6 | Switch back to English | Everything returns to LTR English |

---

### Phase 10 — Mobile-Specific Testing

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Open site on mobile (or Chrome DevTools → mobile mode) | Responsive layout loads |
| 2 | Bottom navigation bar | Home, Cart, Menu accessible via bottom nav |
| 3 | Browse and tap a product | Product page loads correctly |
| 4 | Swipe through product images | Image carousel works with touch |
| 5 | Add to cart from mobile | Cart updates; checkout button visible (fixed position) |
| 6 | Complete full checkout on mobile | Stripe page is mobile-optimized; success page renders correctly |
| 7 | Test on both portrait and landscape | Layout adapts properly |

---

## PART 3: WEBHOOK & BACKEND INTEGRITY

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Complete a purchase and check Stripe Dashboard → Webhooks → Recent events | `checkout.session.completed` event sent and acknowledged (200) |
| 2 | In Stripe, "Resend" the same webhook event | Returns 200 with `duplicate: true`; stock NOT deducted twice |
| 3 | Check `processed_webhooks` table in D1 | Webhook session IDs are recorded for idempotency |
| 4 | Verify Stripe receipt email | Customer receives automatic receipt from Stripe |

---

## PART 4: SEO & SECURITY CHECKS

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Visit `/sitemap.xml` | Valid sitemap with correct domain URLs |
| 2 | Visit `/robots.txt` | Admin, account, success, cancel pages disallowed |
| 3 | Check response headers on any page | Security headers present (X-Frame-Options, HSTS, CSP, etc.) |
| 4 | Try accessing `/api/admin/product` without admin key | Access denied |
| 5 | Try accessing `/account.html` without being logged in | Redirect to login or access denied |

---

## Stripe Test Cards Quick Reference

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0069` | Expired card |
| `4000 0000 0000 0127` | Incorrect CVC |
| `4000 0027 6000 3184` | 3D Secure required (success) |
| `4000 0084 0000 1629` | 3D Secure required (failure) |
| `4000 0000 0000 3220` | 3D Secure 2 required |

**For all test cards:** Any future expiry date, any 3-digit CVC, any name/address.

---

## Testing Checklist Summary

### Owner (Admin) — 9 Phases
- [ ] Admin login & access control
- [ ] Add / Edit / Delete products
- [ ] Inventory restock & low-stock alerts
- [ ] Order management (view, ship, cancel)
- [ ] Return processing (approve/deny)
- [ ] User management
- [ ] Store settings
- [ ] Product reordering & import
- [ ] Activity log

### Customer — 10 Phases
- [ ] Browsing, filtering, search, product detail
- [ ] Cart (add, remove, persist, out-of-stock)
- [ ] Delivery zones & free delivery threshold
- [ ] Product variants
- [ ] Tier/quantity discounts
- [ ] Checkout & payment (8 sub-scenarios)
- [ ] Account (signup, login, forgot password, profile, addresses)
- [ ] Post-purchase (order history, cancel, return)
- [ ] Full Arabic end-to-end
- [ ] Mobile-specific testing

### Backend & Integrity
- [ ] Webhook idempotency
- [ ] SEO & security headers
- [ ] Admin endpoint protection
