# ORLO Go-Live Checklist: temp-5lr.pages.dev -> orlostore.com

**Date:** March 2026
**Status:** PRE-LAUNCH

---

## SECTION 1: CRITICAL BLOCKERS (Must Fix Before Go-Live)

### 1.1 Hardcoded Staging URLs (6 instances found)

These still point to `temp-5lr.pages.dev` and WILL break emails in production:

| # | File | Line | What | Fix |
|---|------|------|------|-----|
| 1 | `functions/api/auth/signup.js` | ~52 | Verification email link | Change to `https://orlostore.com/verify-email.html?token=...` |
| 2 | `functions/api/auth/signup.js` | ~67 | Logo in verification email | Change to `https://orlostore.com/logo.png` |
| 3 | `functions/api/auth/verify.js` | ~79 | Re-verification email link | Change to `https://orlostore.com/verify-email.html?token=...` |
| 4 | `functions/api/auth/guest-to-account.js` | ~84 | Verification email link | Change to `https://orlostore.com/verify-email.html?token=...` |
| 5 | `functions/api/auth/guest-to-account.js` | ~99 | Logo in account email | Change to `https://orlostore.com/logo.png` |
| 6 | `functions/api/admin/ship-order.js` | ~101,135 | Logo + account link in shipping email | Change to `https://orlostore.com/...` |

### 1.2 Password Reset NOT Working

- **File:** `functions/api/auth/reset.js` (lines 36-61)
- The function saves a reset token to the database but **only logs to console** - no email is actually sent
- The email code is **commented out** with a TODO
- **Missing page:** `reset-password.html` does not exist at all - even if the email was sent, the link would 404
- **Action Required:**
  1. Implement email sending (Resend/SendGrid) in `reset.js`
  2. Create `reset-password.html` page
  3. Create backend endpoint to accept new password with token

### 1.3 Stripe: Switch from Test to Live

- [ ] In Cloudflare env vars: Change `STRIPE_SECRET_KEY` from `sk_test_...` to `sk_live_...`
- [ ] In Stripe Dashboard: Create a new webhook endpoint for `https://orlostore.com/webhook`
- [ ] Event to subscribe: `checkout.session.completed`
- [ ] Copy the new `whsec_...` secret to Cloudflare env var `STRIPE_WEBHOOK_SECRET`
- [ ] **DELETE** the old test webhook endpoint pointing to temp domain
- [ ] Verify the currency is set to AED in Stripe Dashboard settings
- [ ] Confirm Stripe account is fully activated (not restricted)

### 1.4 Admin Key Security

- **Current risk:** Admin key is passed via `?key=` query string (logged in browser history, server logs, referrer headers)
- [ ] Set a strong `ADMIN_KEY` in Cloudflare environment variables (NOT the default `Sy$tem88`)
- [ ] Consider: Remove the default key from `README (1).md` line 160 before making repo public

---

## SECTION 2: DOMAIN & DNS

- [ ] Custom domain `orlostore.com` added in Cloudflare Pages project settings
- [ ] DNS records configured (CNAME or A record pointing to Cloudflare Pages)
- [ ] `www.orlostore.com` redirects to `orlostore.com` (or vice versa - pick one)
- [ ] SSL/TLS set to "Full (strict)" in Cloudflare
- [ ] Test: `https://orlostore.com` loads correctly
- [ ] Test: `http://orlostore.com` redirects to HTTPS
- [ ] Old `temp-5lr.pages.dev` - decide: keep as redirect or disable after go-live

---

## SECTION 3: CLOUDFLARE ENVIRONMENT VARIABLES

Verify all these are set in **Cloudflare Pages > Settings > Environment Variables** for **Production**:

| Variable | Value | Status |
|----------|-------|--------|
| `STRIPE_SECRET_KEY` | `sk_live_...` (LIVE key) | [ ] |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (for orlostore.com webhook) | [ ] |
| `ADMIN_KEY` | Strong unique key (NOT Sy$tem88) | [ ] |
| `DB` binding | `orlo-inventory` D1 database | [ ] |
| `RESEND_API_KEY` (if using Resend) | API key for transactional emails | [ ] |

---

## SECTION 4: DATABASE (D1)

- [ ] Verify D1 database `orlo-inventory` is bound to the production Pages project
- [ ] Run `schema-migration.sql` if not already applied (variants, pricing tiers, extra specs)
- [ ] Verify `processed_webhooks` table exists (auto-created by webhook.js, but confirm)
- [ ] Verify `customers` table exists with proper columns (for auth)
- [ ] Spot check: products have correct prices, images, descriptions in both EN and AR
- [ ] Spot check: product quantities are accurate and not leftover test data
- [ ] Backup current database state before go-live

---

## SECTION 5: EMAILS & TRANSACTIONAL

Emails are sent from these flows - ALL need a working email provider:

| Flow | File | Currently Working? |
|------|------|--------------------|
| Signup verification | `functions/api/auth/signup.js` | Needs Resend API key |
| Re-send verification | `functions/api/auth/verify.js` | Needs Resend API key |
| Guest-to-account | `functions/api/auth/guest-to-account.js` | Needs Resend API key |
| Password reset | `functions/api/auth/reset.js` | **NOT IMPLEMENTED** (commented out) |
| Shipping notification | `functions/api/admin/ship-order.js` | Needs Resend API key |
| Stripe receipt | `functions/webhook.js` | Uses Stripe built-in (works if Stripe is live) |

**Action Items:**
- [ ] Sign up for Resend (or SendGrid) and get API key
- [ ] Set `RESEND_API_KEY` in Cloudflare env vars
- [ ] Verify sender domain `orlostore.com` in Resend (add DNS records)
- [ ] Set "from" address: `noreply@orlostore.com` or `orders@orlostore.com`
- [ ] Implement password reset email (currently just console.log)
- [ ] Create `reset-password.html` page

---

## SECTION 6: SEO & INDEXING

- [x] `sitemap.xml` - already uses `https://orlostore.com/` (verified)
- [x] `robots.txt` - already uses `https://orlostore.com/sitemap.xml` (verified)
- [x] `robots.txt` - admin/account/success/cancel pages are disallowed (verified)
- [ ] Submit sitemap to Google Search Console for `orlostore.com`
- [ ] Verify `<meta>` tags (title, description, og:image) on index.html and product.html
- [ ] Check: canonical URLs point to `orlostore.com` (not temp domain)
- [ ] Google Analytics property `G-B5JQFPTZT7` - verify it's tracking the right domain

---

## SECTION 7: SECURITY HEADERS

Already configured in `_headers` file (verified):
- [x] `X-Frame-Options: DENY`
- [x] `X-Content-Type-Options: nosniff`
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [x] `Strict-Transport-Security` with 1-year max-age
- [x] Content-Security-Policy present
- [x] Sensitive pages (account, login, signup, success, cancel) have `no-cache` headers

**Note:** CSP allows `'unsafe-inline'` for scripts - acceptable for now but consider removing later.

---

## SECTION 8: CLEANUP BEFORE GO-LIVE

### Files to Remove/Exclude (8 mockup files still in repo):
- [ ] `mockup-bottom-bar.html`
- [ ] `mockup-cart-price-colors.html`
- [ ] `mockup-new-layout.html`
- [ ] `mockup-pricing-ideas.html`
- [ ] `mockup-symbol-bg.html`
- [ ] `mockup-variant-selector.html`
- [ ] `mockups-buybox-symbol.html`
- [ ] `mockups-buybox.html`
- [ ] `category-mockups.html`
- [ ] `color-preview.html`
- [ ] `pricing-preview.html`
- [ ] `orlo-marketing-dashboard (1).html`
- [ ] `backups/product.js.bak`
- [ ] `backups/styles.css.bak`

### robots.txt Update
Currently only blocks 2 mockup files. If you keep them, block ALL mockups:
```
Disallow: /mockup*
Disallow: /mockups*
Disallow: /color-preview.html
Disallow: /pricing-preview.html
```

---

## SECTION 9: KNOWN ISSUES TO BE AWARE OF

### 9.1 Race Condition on Last-Item Purchase
- Two customers can both pass stock check for the last item, both pay, and both get charged
- The `MAX(0, quantity - ?)` prevents negative DB values but both orders go through
- **Risk level:** Low for now (small store), but be aware
- **Workaround:** Monitor inventory closely; refund manually if oversold

### 9.2 XSS Vulnerabilities (from audit)
- `app.js:1302` - Category from URL param used in `innerHTML` without escaping
- `product.js:419,665` - `product.category` used in `innerHTML`
- `product.js:409` - Breadcrumb with `product.name` in `innerHTML`
- **Risk:** Low since data comes from your own DB, but fix before allowing user-generated content

---

## SECTION 10: PAYMENT TESTING SCENARIOS

### Before switching to Stripe Live mode, run ALL of these on the test environment:

---

### Scenario 1: Happy Path - Single Item Purchase
```
Steps:
1. Add 1 item to cart
2. Select delivery zone (Dubai)
3. Click "Pay by Card"
4. On Stripe checkout, use test card: 4242 4242 4242 4242
5. Any future expiry, any CVC, any name
6. Complete payment

Expected:
- Redirected to success.html with order confirmation
- Stock decremented by 1 in admin dashboard
- Stripe dashboard shows successful payment
- Cart is cleared
```

### Scenario 2: Multi-Item Purchase with Free Delivery
```
Steps:
1. Add multiple items totaling > 75 AED
2. Select delivery zone
3. Verify delivery fee shows "FREE"
4. Complete checkout with test card 4242 4242 4242 4242

Expected:
- No delivery fee charged
- Correct total on Stripe checkout page
- All item quantities decremented after payment
```

### Scenario 3: Purchase with Variants
```
Steps:
1. Go to a product that has variants (e.g., different colors/sizes)
2. Select a specific variant
3. Add to cart
4. Verify cart shows correct variant name and price
5. Complete checkout

Expected:
- Correct variant price charged (not base product price)
- Variant-specific stock decremented (not product-level stock)
- Stripe line items show correct variant details
```

### Scenario 4: Tier/Quantity Discount
```
Steps:
1. Find a product with pricing tiers
2. Add enough quantity to hit a tier discount (e.g., buy 5+ for 10% off)
3. Verify discounted price shows in cart
4. Complete checkout

Expected:
- Discounted unit price applied correctly
- Total matches: discounted_price x quantity + delivery
- Stripe charges correct discounted amount
```

### Scenario 5: Out of Stock Rejection
```
Steps:
1. In admin, set a product quantity to 0
2. Try to add it to cart from the storefront

Expected:
- "Add to Cart" button is disabled / shows "Out of Stock"
- Cannot add to cart
```

### Scenario 6: Insufficient Stock at Checkout
```
Steps:
1. In admin, set product quantity to 2
2. Add 3 of that product to cart
3. Click "Pay by Card"

Expected:
- Error message: "Only X available" or "Insufficient stock"
- NOT redirected to Stripe
- Cart remains intact so user can adjust quantity
```

### Scenario 7: Stock Changes Between Cart and Checkout
```
Steps:
1. Add 5 items to cart (product has 5 in stock)
2. In a separate browser/admin, reduce stock to 2
3. Go back and click "Pay by Card"

Expected:
- Server-side stock check catches the discrepancy
- Error shown to customer with updated availability
- Customer NOT sent to Stripe for a quantity they can't fulfill
```

### Scenario 8: Declined Card
```
Steps:
1. Add items to cart
2. Click "Pay by Card"
3. On Stripe, use decline test card: 4000 0000 0000 0002
4. Try to complete payment

Expected:
- Stripe shows "Card declined" error
- Customer can try another card or go back
- No stock is deducted (webhook never fires)
- Cart is preserved
```

### Scenario 9: Customer Cancels on Stripe Page
```
Steps:
1. Add items to cart
2. Click "Pay by Card"
3. On Stripe checkout page, click "Back" or close the tab

Expected:
- Redirected to cancel.html OR nothing happens (tab closed)
- Stock is NOT deducted
- Cart is preserved in localStorage
- Message: "Your cart is still waiting"
```

### Scenario 10: 3D Secure Authentication
```
Steps:
1. Add items to cart
2. Click "Pay by Card"
3. Use test card requiring 3DS: 4000 0027 6000 3184
4. Complete 3D Secure authentication

Expected:
- 3DS challenge appears
- After authenticating, payment succeeds
- Redirected to success.html
- Stock deducted correctly
```

### Scenario 11: 3D Secure Failure
```
Steps:
1. Add items to cart
2. Click "Pay by Card"
3. Use test card: 4000 0084 0000 1629
4. Fail the 3DS authentication

Expected:
- Payment fails
- Customer remains on Stripe page with error
- No stock deducted
- Cart preserved
```

### Scenario 12: Duplicate Webhook (Idempotency Test)
```
Steps:
1. Complete a successful purchase
2. In Stripe Dashboard > Webhooks > Recent events
3. Find the checkout.session.completed event
4. Click "Resend" to trigger webhook again

Expected:
- Webhook returns 200 with "duplicate: true"
- Stock is NOT deducted a second time
- No duplicate processing
```

### Scenario 13: Guest Checkout -> Account Creation
```
Steps:
1. Do NOT log in
2. Add items and checkout as guest
3. Complete payment
4. On success page, click "Create Account"

Expected:
- Account created with email from Stripe session
- Temporary password sent via email
- User can log in with that password
- Verification email sent
```

### Scenario 14: Logged-In Customer Checkout
```
Steps:
1. Create account and log in
2. Add items to cart
3. Click "Pay by Card"
4. Complete payment

Expected:
- Stripe pre-fills customer name/email/address
- Order appears in account.html order history
- "Create Account" button NOT shown on success page
```

### Scenario 15: Cart Persistence
```
Steps:
1. Add items to cart
2. Close the browser completely
3. Reopen and go to the site

Expected:
- Cart items still there (localStorage)
- Quantities preserved
- Prices recalculated from fresh product data
```

### Scenario 16: Delivery Zone Pricing
```
Steps:
1. Add items totaling 50 AED
2. Switch between delivery zones (Dubai, Abu Dhabi, etc.)
3. Verify delivery fee changes per zone
4. Add more items to cross free delivery threshold

Expected:
- Correct zone-specific delivery fee shown
- Fee updates dynamically
- Shows "X AED more for free delivery" message
- Fee becomes 0 when threshold is crossed
```

### Scenario 17: Bilingual Cart/Checkout
```
Steps:
1. Switch site to Arabic
2. Add items to cart
3. Verify Arabic product names, category, descriptions shown
4. Go through checkout

Expected:
- All UI text in Arabic
- Product names show Arabic versions
- Cart totals formatted correctly
- RTL layout maintained throughout
```

### Scenario 18: Mobile Checkout Flow
```
Steps:
1. Open site on mobile device (or Chrome DevTools mobile mode)
2. Browse products, add to cart
3. Complete full checkout

Expected:
- Bottom navigation works
- Cart is accessible
- Checkout button is visible (fixed position)
- Stripe page is mobile-optimized
- Success/cancel pages render correctly on mobile
```

---

## SECTION 11: POST GO-LIVE VERIFICATION

After switching to live and deploying to orlostore.com:

- [ ] **Immediate (within 1 hour):**
  - [ ] Visit `https://orlostore.com` - homepage loads
  - [ ] Products load with correct images and prices
  - [ ] Add item to cart, verify cart works
  - [ ] Do a real purchase with your own card (small amount) - FULL END-TO-END
  - [ ] Verify stock decremented in admin
  - [ ] Verify Stripe dashboard shows the payment
  - [ ] Verify success page loads correctly
  - [ ] Check webhook logs in Cloudflare (Workers > Logs)
  - [ ] Test signup - verify email arrives
  - [ ] Test login
  - [ ] Test forgot password (if implemented by then)
  - [ ] Check admin panel at `/admin.html` loads and works

- [ ] **Within 24 hours:**
  - [ ] Google Search Console - submit sitemap
  - [ ] Google Analytics - verify events are tracking
  - [ ] Test from a different device/network
  - [ ] Test Arabic version end-to-end
  - [ ] Monitor Stripe webhook delivery success rate
  - [ ] Check Cloudflare Analytics for any 4xx/5xx errors

- [ ] **Within 1 week:**
  - [ ] Review Stripe payments - any issues?
  - [ ] Check inventory accuracy after real orders
  - [ ] Monitor email deliverability (not going to spam?)
  - [ ] Review error logs in Cloudflare

---

## SECTION 12: QUICK REFERENCE - STRIPE TEST CARDS

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

## Summary: Action Items Priority

### Must Do (Blocking Go-Live):
1. Fix 6 hardcoded `temp-5lr.pages.dev` URLs in function files
2. Switch Stripe to live keys + create production webhook
3. Set strong `ADMIN_KEY` in production env vars
4. Set up email provider (Resend) + configure sender domain

### Should Do (Important but can go live without):
5. Implement password reset email + create reset-password.html
6. Remove mockup/backup files from production
7. Update robots.txt to block all mockup files
8. Run all 18 test scenarios above

### Nice to Have (Post-Launch):
9. Fix XSS in category innerHTML usage
10. Address race condition for concurrent last-item purchases
11. Remove `'unsafe-inline'` from CSP
12. Set up monitoring/alerting for webhook failures
