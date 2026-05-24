# Cart Migration Runbook — execute tonight

**Purpose**: lift the cart restyle from R1/T&C overlay blocks into `styles.css` so the same cart visuals apply on ALL pages (not just R1/T&C), and so the codebase has a single source of truth for cart CSS.

**Estimated time**: ~60-75 min focused.

**Source of truth before starting**: §2.5 of `R1-CUTOVER-CHECKLIST.md` is synced verbatim with R1's overlay as of commit `44f36f1`.

---

## Pre-flight (5 min)

- [ ] Pull latest main: `git fetch origin && git checkout main && git pull origin main`
- [ ] Verify §2.5 of `R1-CUTOVER-CHECKLIST.md` matches current R1 overlay (it should after `44f36f1`)
- [ ] Verify all 8 app.min.js patch targets still exist (already confirmed in earlier session):
  ```
  grep -c 'border-radius: 9px; overflow: hidden; box-shadow: 0 3px 10px rgba(44,74,92,0.15)' app.min.js   # → 1
  grep -oc 'linear-gradient(135deg, #2c4a5c, #1e3545)' app.min.js                                          # → 2
  grep -oc '#f8f9fa' app.min.js                                                                            # → 1
  grep -oc 'color:#2c4a5c' app.min.js                                                                      # → 1
  grep -oc 'color:#e07856' app.min.js                                                                      # → 2 (one in cart, one in upsell — only patch the cart one)
  grep -oc '#dc3545' app.min.js                                                                            # → 1
  grep -oc 'padding: 2px 10px 8px' app.min.js                                                              # → 1
  ```
- [ ] Create branch: `git checkout -b claude/cart-migration`

---

## Step 1 — Append migrated CSS to `styles.css` (10 min)

Open `styles.css`. Append a new section at the end (don't replace existing rules yet — that happens in Step 6).

CSS to add (exact source: §2.5 of CUTOVER CHECKLIST, with `!important` stripped and attribute selectors replaced with class selectors per the patches below):

```css
/* ═══════════════════════════════════════════════════════════
   CART — Edit-look (migrated from R1/T&C overlays).
   Source of truth: R1-CUTOVER-CHECKLIST.md §2.5.
   ═══════════════════════════════════════════════════════════ */

.cart-sidebar { width: 440px; right: -440px; border-radius: 16px 0 0 16px; box-shadow: -8px 0 32px rgba(26,58,82,0.12); background: var(--surface); border-left: 1px solid var(--draft-border); }
.cart-sidebar.active { right: 0; }
[data-theme="dark"] .cart-sidebar { box-shadow: -8px 0 32px rgba(0,0,0,0.4); }

.cart-header { background: var(--primary); padding: 1rem 1.4rem; border-bottom: none; }
.cart-header h2 { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 1.25rem; letter-spacing: -0.01em; color: #fff; }
.cart-header h2 span { font-family: 'Almarai', sans-serif; font-weight: 400; font-size: 0.95rem; opacity: 0.85; margin-left: 8px; }

.cart-items {
  padding: 0.6rem 1.4rem 0.4rem;
  background:
    linear-gradient(var(--surface) 30%, rgba(255,255,255,0)) center top / 100% 30px no-repeat,
    linear-gradient(rgba(255,255,255,0), var(--surface) 70%) center bottom / 100% 30px no-repeat,
    radial-gradient(farthest-side at 50% 0, rgba(26,58,82,0.18), transparent 70%) center top / 100% 12px no-repeat,
    radial-gradient(farthest-side at 50% 100%, rgba(26,58,82,0.18), transparent 70%) center bottom / 100% 12px no-repeat;
  background-color: var(--surface);
  background-attachment: local, local, scroll, scroll;
}
[data-theme="dark"] .cart-items {
  background:
    linear-gradient(var(--surface) 30%, rgba(0,0,0,0)) center top / 100% 30px no-repeat,
    linear-gradient(rgba(0,0,0,0), var(--surface) 70%) center bottom / 100% 30px no-repeat,
    radial-gradient(farthest-side at 50% 0, rgba(0,0,0,0.35), transparent 70%) center top / 100% 12px no-repeat,
    radial-gradient(farthest-side at 50% 100%, rgba(0,0,0,0.35), transparent 70%) center bottom / 100% 12px no-repeat;
  background-color: var(--surface);
  background-attachment: local, local, scroll, scroll;
}

.cart-footer { background: var(--bg); border-top: 1px solid var(--draft-border); padding: 0.3rem 1.4rem; }
[data-theme="dark"] .cart-footer { background: #0d1f2d; }

.cart-total { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 1.35rem; letter-spacing: -0.01em; color: var(--draft-text); margin-bottom: 0.9rem; }

/* Stripe / guest checkout buttons */
.cart-sidebar #stripeBtn,
.cart-sidebar #stripeBtnGuest {
  background: var(--primary); color: #fff; border-radius: 10px;
  font-family: 'DM Sans', sans-serif; font-weight: 500;
  letter-spacing: 0.08em; text-transform: uppercase;
  padding: 0.95rem 1rem; transition: filter .2s ease, transform .2s ease;
}
.cart-sidebar #stripeBtn .arabic-text,
.cart-sidebar #stripeBtnGuest .arabic-text { text-transform: none; letter-spacing: 0; }
.cart-sidebar #stripeBtn:hover,
.cart-sidebar #stripeBtnGuest:hover { filter: brightness(0.85); transform: translateY(-1px); }

/* Cart item rows */
.cart-items > div[id^="cartItem-"] {
  display: flex; align-items: center; gap: 12px;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--draft-border);
}
.cart-items > div[id^="cartItem-"] img.cart-item-image {
  display: block; width: 60px; height: 60px;
  object-fit: contain; background: #fff; border-radius: 8px; flex-shrink: 0;
  margin-right: 0; border: 1px solid var(--draft-border);
}
.cart-items > div[id^="cartItem-"] strong {
  color: var(--draft-text); font-family: 'DM Sans', sans-serif; font-weight: 500;
}
.cart-items > div[id^="cartItem-"] .cart-item-price { color: var(--accent); font-family: 'DM Sans', sans-serif; }
.cart-items > div[id^="cartItem-"] span[style*="#888"] { color: var(--draft-muted); }
.cart-items > div[id^="cartItem-"] > div:nth-of-type(2) { flex-shrink: 0; gap: 6px; }

.cart-items > div[id^="cartItem-"] button[onclick^="updateQuantity"] {
  background: var(--bg); color: var(--draft-text); border: 1px solid var(--draft-border);
  border-radius: 6px; font-family: 'DM Sans', sans-serif; transition: background .2s ease;
}
.cart-items > div[id^="cartItem-"] button[onclick^="updateQuantity"]:hover { background: var(--draft-border); }

.cart-items > div[id^="cartItem-"] button[onclick^="removeFromCart"] {
  background: transparent; color: var(--primary); border: 1px solid var(--draft-border);
  border-radius: 50%; width: 30px; height: 30px; padding: 0;
  display: inline-flex; align-items: center; justify-content: center;
  transition: border-color .2s ease, color .2s ease;
}
[data-theme="dark"] .cart-items > div[id^="cartItem-"] button[onclick^="removeFromCart"] { color: var(--draft-text); }
.cart-items > div[id^="cartItem-"] button[onclick^="removeFromCart"]:hover { border-color: var(--accent); color: var(--accent); }
.cart-items > div[id^="cartItem-"] button[onclick^="removeFromCart"] svg { width: 14px; height: 14px; }

/* Option C — checkout pill outer wrapper (now uses CLASS, not attribute selector) */
.cart-sidebar .checkout-card {
  background: var(--surface);
  border: 1px solid var(--draft-border);
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(26,58,82,0.08);
  padding: 14px;
  overflow: visible;
}
[data-theme="dark"] .cart-sidebar .checkout-card {
  background: var(--surface); border-color: rgba(255,255,255,0.10);
}
.cart-sidebar .checkout-card > div {
  background: transparent; border-radius: 0; border: none; box-shadow: none;
}
.cart-sidebar .checkout-card-header {
  color: var(--primary);
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.05rem; font-weight: 400; letter-spacing: -0.01em;
  padding: 0 0 10px 0; text-align: center;
}
[data-theme="dark"] .cart-sidebar .checkout-card-header { color: var(--draft-text); }
.cart-sidebar .checkout-card-header span {
  font-family: 'Almarai', sans-serif; color: var(--draft-muted);
  font-size: 0.78rem; opacity: 1; margin-left: 6px; font-weight: 400;
}
.cart-sidebar .checkout-card-buttons {
  display: flex; gap: 8px; padding: 0;
}

/* Totals summary box — now uses CLASS, not attribute selector */
.cart-sidebar .cart-summary {
  background: transparent; border: none;
  border-radius: 8px;
  padding: 0.15rem 0.75rem 0.125rem;
}
.cart-sidebar .cart-summary > div {
  padding-top: 0.05rem; padding-bottom: 0.05rem;
}
.cart-sidebar .cart-summary > div[style*="border-top"] {
  margin: 0.05rem 0; padding: 0;
  border-top-color: var(--draft-border);
}
.cart-sidebar .cart-summary > div:last-of-type {
  padding-top: 0.1rem; padding-bottom: 0.05rem;
}

/* Mobile cart layout (≤514.56px) */
@media (max-width: 514.56px) {
  .cart-sidebar { width: 100%; right: -100%; border-radius: 0; top: 0; bottom: 0; height: auto; }
  .cart-sidebar.active { right: 0; }
  .cart-checkout-fixed {
    position: absolute; top: auto; bottom: 85px; left: 0; right: 0;
    background: var(--bg);
    border-top: 1px solid var(--draft-border); border-bottom: none;
    box-shadow: 0 -2px 8px rgba(26,58,82,0.08);
    z-index: 10;
    padding: 10px 14px 0 14px;
  }
  .cart-footer { padding-bottom: 220px; padding-top: 0.25rem; }
  [data-theme="dark"] .cart-checkout-fixed { background: #0d1f2d; }
}
```

- [ ] **Verify**: `grep -c 'CART — Edit-look' styles.css` → 1

---

## Step 2 — Apply the 8 `app.min.js` patches (25 min)

Each patch: use Python script. After each patch, run the grep verification to confirm the inline value is gone and the class is added.

### Patch 0: Add `checkout-card` class to outer wrapper

**Find** (1 occurrence):
```
<div style="border-radius: 9px; overflow: hidden; box-shadow: 0 3px 10px rgba(44,74,92,0.15);">
```

**Replace with**:
```
<div class="checkout-card">
```

**Verify**: `grep -c 'class="checkout-card"' app.min.js` → 1; `grep -c 'border-radius: 9px; overflow: hidden; box-shadow: 0 3px 10px rgba(44,74,92,0.15)' app.min.js` → 0

### Patch 1: Logged-in stripeBtn — strip background + hover handlers

**Find** (the logged-in variant):
```
<button id="stripeBtn" \n                style="width: 100%; padding: 0.9rem; font-size: 0.85rem; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; background: #2c4a5c; color: white; transition: all 0.3s;" \n                onclick="checkout()" \n                onmouseover="this.style.background='#1e3545'" \n                onmouseout="this.style.background='#2c4a5c'">
```

**Replace with** (strip background + hover handlers; CSS class controls color):
```
<button id="stripeBtn" \n                style="width: 100%; padding: 0.9rem; font-size: 0.85rem; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; color: white; transition: all 0.3s;" \n                onclick="checkout()">
```

**Verify**: `grep -c 'background: #2c4a5c; color: white' app.min.js` → should drop by 1; the logged-in stripeBtn no longer has inline background

### Patch 2: Pay-by-Card label — add `checkout-card-header` class

**Find**:
```
<div style="background: linear-gradient(135deg, #2c4a5c, #1e3545); color: white; text-align: center; padding: 10px 10px; font-size: 0.7rem; font-weight: 600; display:flex; align-items:center; justify-content:center; gap:5px;">
```

**Replace with** (strip background, color, text-align, padding, font-size, font-weight; keep display:flex layout for icon alignment):
```
<div class="checkout-card-header" style="display:flex; align-items:center; justify-content:center; gap:5px;">
```

**Verify**: `grep -c 'class="checkout-card-header"' app.min.js` → 1

### Patch 3: Buttons wrapper — add `checkout-card-buttons` class

**Find**:
```
<div style="display: flex; gap: 8px; background: linear-gradient(135deg, #2c4a5c, #1e3545); padding: 2px 10px 8px;">
```

**Replace with** (CSS class handles everything):
```
<div class="checkout-card-buttons">
```

**Verify**: `grep -c 'class="checkout-card-buttons"' app.min.js` → 1; `grep -oc 'linear-gradient(135deg, #2c4a5c, #1e3545)' app.min.js` → 0

### Patch 4: Sign-in + As-Guest button backgrounds

**Find** (Sign-in variant — `<button id="stripeBtn"` inside the guest wrapper):
```
style="flex: 1; padding: 9px 7px; border: none; font-family: 'Inter', sans-serif; font-size: 0.72rem; font-weight: 600; cursor: pointer; text-align: center; background: #3d6178; color: white; border-radius: 5px; transition: all 0.2s;"
```

**Replace with** (strip background, color, font, border-radius — let CSS class control):
```
style="flex: 1; padding: 9px 7px; border: none; font-size: 0.72rem; font-weight: 600; cursor: pointer; text-align: center; transition: all 0.2s;"
```

Apply same find/replace to `stripeBtnGuest` block (2 occurrences total).

**Verify**: `grep -oc '#3d6178' app.min.js` → 0

### Patch 5: Totals box — add `cart-summary` class

**Find**:
```
<div style="padding: ${i?"0.3rem 0.75rem 0.25rem":"0.6rem 1rem"}; background: #f8f9fa; border-radius: 8px;">
```

**Replace with** (CSS class controls bg + radius + padding):
```
<div class="cart-summary">
```

**Verify**: `grep -c 'class="cart-summary"' app.min.js` → 1; `grep -oc '#f8f9fa' app.min.js` → 0

### Patch 6: Cart item product name — strip inline color

**Find**:
```
<strong style="font-size:${p}; color:#2c4a5c;">
```

**Replace with**:
```
<strong style="font-size:${p};">
```

**Verify**: `grep -c 'color:#2c4a5c' app.min.js` → 0 (within cart-item template)

### Patch 7: Cart item price — strip inline color, add class

**Find**:
```
<span style="color:#e07856; font-weight:600; font-size:${g};">AED ${
```

**Replace with**:
```
<span class="cart-item-price" style="font-weight:600; font-size:${g};">AED ${
```

**Verify**: `grep -c 'class="cart-item-price"' app.min.js` → 1; first `color:#e07856` occurrence (the cart item price) is gone

### Patch 8: Remove button — strip alarm colors

**Find**:
```
<button onclick="removeFromCart(${d})" style="padding:${y}; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer; margin-left:0.2rem; font-size:${v};">
```

**Replace with** (strip background, color, border — let CSS handle):
```
<button onclick="removeFromCart(${d})" style="padding:${y}; cursor:pointer; margin-left:0.2rem; font-size:${v};">
```

**Verify**: `grep -oc '#dc3545' app.min.js` → 0

### Bonus: Strip `style="display:none"` from cart-item-image

**Find**:
```
<img class="cart-item-image" style="display:none" src=
```

**Replace with**:
```
<img class="cart-item-image" src=
```

This unhides the cart image on production (now that styles.css has the image rule globally).

---

## Step 3 — Remove cart block from R1 and T&C overlays (5 min)

Now that `styles.css` has the cart rules, the overlay blocks in R1 and T&C are duplicates.

- [ ] Open `draftnewindexR1.html`, delete the entire `/* CART — Edit-look restyle */` block (lines ~720-1026)
- [ ] Open `terms-and-conditions.html`, delete the same block (lines ~142-418)

---

## Step 4 — Reconcile base mobile rules in `styles.css` (5 min)

The base mobile rules in `styles.css` need updating so they don't fight the migrated rules.

- [ ] In `styles.css`'s `@media (max-width:768px)` block, find `.cart-sidebar { height: calc(100vh - 70px); padding-bottom: 0; }` and DELETE or comment out
- [ ] Find `.cart-checkout-fixed { display: block; position: sticky; top: 0; ... }` and DELETE — the migrated rules replace it for ≤514.56px viewports

---

## Step 5 — Delete dead `.checkout-btn.whatsapp-btn` (1 min)

- [ ] In `styles.css`, find `.checkout-btn.whatsapp-btn` rules (2 lines: bg green + hover) and delete. No element ever uses this class.

---

## Step 6 — Deploy to Firebase preview channel (10 min)

- [ ] Commit branch: `git add -A && git commit -m "Cart migration: move cart styles into styles.css + app.min.js class refactor"`
- [ ] Push branch: `git push -u origin claude/cart-migration`
- [ ] Deploy preview: `firebase hosting:channel:deploy r1-cart-migration --expires 7d` (the channel link will print)

---

## Step 7 — Visual test on preview URL (15 min)

Open the preview URL in incognito on mobile + desktop. Compare cart side-by-side with current R1 cart (https://orlostore.com/draftnewindexR1.html). Should be pixel-identical.

- [ ] Mobile: cart slides in, items render with images, scroll shadows show, totals area is tight, checkout card is Option C cream/white with Cormorant header, buttons are UPPERCASE navy, Sign in / As Guest touch mobile nav, no gap to homepage behind
- [ ] Desktop: cart slides in 440px wide, scroll shadows on items list, checkout card is Option C in flow inside cart-footer, looks identical to mobile design

---

## Step 8 — Merge to main (2 min)

If preview looks good:
- [ ] `git checkout main && git pull origin main`
- [ ] `git merge claude/cart-migration --no-ff -m "Merge cart migration"`
- [ ] `git push origin main`
- [ ] Verify Firebase auto-deploys

---

## Step 9 — Cleanup (3 min)

- [ ] Delete `claude/cart-migration` branch (`git branch -d claude/cart-migration && git push origin :claude/cart-migration`)
- [ ] Update `R1-CUTOVER-CHECKLIST.md` §2.5: mark all migration sub-tasks as `[x]` done
- [ ] Delete THIS runbook file (`CART-MIGRATION-RUNBOOK.md`) — purpose served
- [ ] Commit + push

---

## Rollback (if anything looks wrong on preview)

The migration is on a feature branch — nothing is on main yet. Just abandon the branch:
```
git checkout main
git branch -D claude/cart-migration
firebase hosting:channel:delete r1-cart-migration
```

Production is untouched.

---

## What I need from you tonight

1. **A green light** to start the migration (just say "go migrate" or similar)
2. **Approval after preview testing** — you verify the preview URL looks right before I merge to main
3. **Firebase CLI access** OR — if you don't have it set up — you handle the `firebase hosting:channel:deploy` step yourself with the URL I'll prep
