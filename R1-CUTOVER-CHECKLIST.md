# R1 Cutover Checklist

Use this when promoting `draftnewindexR1.html` to production as the new
`index.html`. Everything listed here is either **intentionally in
draft state** or a **temporary patch** that needs to be reverted /
applied at cutover.

Keep this file up to date as you make further draft-only changes — add
each new exception with a checkbox so nothing gets forgotten.

---

## 1. Cutover steps (do these in order)

### 1.1 Rename and replace

- [ ] `git mv draftnewindexR1.html index.html` (overwrites the current
      `index.html`)
- [ ] Delete the file `draftnewindex.html` (the original draft, now
      superseded)

### 1.2 Remove draft-only markers in the new `index.html`

- [ ] **`<title>`** — restore the keyword-rich production title:
      `ORLO Store | Desk Organizers, Office Decor & Unique Gifts | Dubai UAE`
      (currently: `ORLO — Draft Preview (The Edit look)`)
- [ ] **Robots meta** — delete the line
      `<meta name="robots" content="noindex,nofollow">`
      so Google can index the page
- [ ] **Draft marker** — delete the element
      `<div class="draft-marker">Draft · The Edit look</div>`
      and its associated `.draft-marker` CSS block in the
      `edit-overlay` style
- [ ] **Comment header** — the giant comment box at the top of the
      `edit-overlay` `<style>` (lines around `DRAFT OVERLAY — cosmetic
      only`) can be rewritten or removed once it's no longer a draft

### 1.3 Revert the temporary `app.min.js` patch

- [ ] In `app.min.js`, the `toggleMobileMenu()` homepage-detection
      check was patched to recognise `draftnewindexR1.html` as the
      homepage:
      ```js
      n = window.location.pathname.endsWith("index.html")
       || window.location.pathname.endsWith("/")
       || window.location.pathname.endsWith("draftnewindexR1.html")
      ```
      Once R1 IS the new `index.html`, the third clause is no longer
      needed. Remove it so the check is back to:
      ```js
      n = window.location.pathname.endsWith("index.html")
       || window.location.pathname.endsWith("/")
      ```
      (Search `app.min.js` for `draftnewindexR1` and delete the
      `|| ...` clause.)

### 1.4 External integrations to update

- [ ] **Stripe Dashboard** → Settings → Branding → Terms of service /
      Privacy URLs → set to
      `https://orlostore.com/terms-and-conditions.html#terms` and
      `...#privacy`
- [ ] **Meta Business Manager** → Data Sources → CAPI → Privacy Policy
      URL → `https://orlostore.com/terms-and-conditions.html#privacy`
- [ ] **Apple Pay merchant verification** (if applicable) → same URLs
- [ ] **Google Search Console** → request indexing of:
      - `https://orlostore.com/` (the new index)
      - `https://orlostore.com/terms-and-conditions.html`
- [ ] **`sitemap.xml`** — if you have one, add the T&C page

### 1.5 Smoke test after deploy

- [ ] `https://orlostore.com/` loads the new home (was R1)
- [ ] Tab title shows the production keyword title, not "Draft Preview"
- [ ] `view-source:https://orlostore.com/` does NOT contain
      `noindex,nofollow`
- [ ] Footer policy links (Shipping · Returns · Privacy · Terms ·
      Exchange) all navigate to `terms-and-conditions.html#anchor`
- [ ] Mobile bottom-nav Menu → Shop / About / Contact / Terms — all
      stay on the homepage (Shop/About/Contact are in-page anchors,
      Terms navigates to T&C page)
- [ ] No "Draft · The Edit look" floating text in bottom-left

---

## 2. What we know was changed but kept (do NOT revert)

These are deliberate and stay live:

- ✅ Self-hosted Cormorant Garamond, DM Sans, Almarai (all in `/fonts/`)
- ✅ `@font-face` declarations in `styles.css` (centralised)
- ✅ Dark mode toggle on R1 and T&C
- ✅ Full editorial type system (DM Sans body + Cormorant headings)
- ✅ Restored Organization JSON-LD (full 8 fields, incl. Facebook)
- ✅ Restored long-form SEO content section
- ✅ UTM tracking script
- ✅ T&C page restyled to match The Edit
- ✅ Anchor IDs on T&C `.policy-section` divs
- ✅ Footer policy strip → real `terms-and-conditions.html#anchor` URLs
- ✅ Back arrow on T&C
- ✅ Bottom-nav indicator defaults to Menu on T&C
- ✅ Mobile-menu Terms link → `terms-and-conditions.html`

---

## 3. Items we deliberately deferred (do later, separate sessions)

Not blockers for cutover. Sequence as separate sprints.

### Phase 2 — typography sweep across other pages
- [ ] Switch `font-family: 'Inter'` → `'DM Sans'` on:
  - `account.html`
  - `login.html`
  - `forgot-password.html`
  - `reset-password.html`
  - `signup.html`
  - `verify-email.html`
  - `cancel.html`
  - `product.html`
  - `shop.html`
- [ ] After all pages migrated, remove the Inter `@font-face` from
      `styles.css` and delete `fonts/inter-latin-variable.woff2`

### Phase 2.5 — Cart migration (from R1/T&C overlays into styles.css)

**Reality check**: This is NOT a copy-paste. The `!important` markers in
the overlay exist because `app.min.js` injects inline `style="..."`
attributes when rendering the cart. Drop the `!important`s without
patching the inline styles in `app.min.js`, and the cart regresses to
the old look. The migration is a **coordinated CSS + JS edit pass**.

The cart restyle currently lives **duplicated** in the
`<style id="edit-overlay">` block of both `draftnewindexR1.html` and
`terms-and-conditions.html`. The T&C block is a verbatim copy of R1's
— delete it after lifting R1's into `styles.css`.

#### Current overlay cart values (the source of truth as of this commit)

CSS block lives in R1's `edit-overlay` between the comment `/* ═══════
CART — Edit-look restyle ═══════ */` and the next non-cart rule.

**Desktop / shared rules:**

```css
.cart-sidebar { width: 440px; right: -440px; border-radius: 16px 0 0 16px; box-shadow: -8px 0 32px rgba(26,58,82,0.12); background: var(--surface); border-left: 1px solid var(--draft-border); }
.cart-sidebar.active { right: 0; }
[data-theme="dark"] .cart-sidebar { box-shadow: -8px 0 32px rgba(0,0,0,0.4); }

.cart-header { background: var(--primary); padding: 1rem 1.4rem; border-bottom: none; }
.cart-header h2 { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 1.25rem; letter-spacing: -0.01em; color: #fff; }
.cart-header h2 span { font-family: 'Almarai', sans-serif; font-weight: 400; font-size: 0.95rem; opacity: 0.85; margin-left: 8px; }

.cart-items { padding: 0.6rem 1.4rem 0.4rem; }     /* tightened — was 1.2rem 1.4rem 0.5rem */

.cart-footer { background: var(--bg); border-top: 1px solid var(--draft-border); padding: 0.6rem 1.4rem; }    /* tightened — was 1.2rem 1.4rem */
[data-theme="dark"] .cart-footer { background: #0d1f2d; }

.cart-total { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 1.35rem; color: var(--draft-text); margin-bottom: 0.9rem; }

.cart-sidebar #stripeBtn,
.cart-sidebar #stripeBtnGuest {
  background: var(--primary); color: #fff; border-radius: 10px;
  font-family: 'DM Sans', sans-serif; font-weight: 500; letter-spacing: 0.02em;
  padding: 0.95rem 1rem; transition: filter .2s ease, transform .2s ease;
}
.cart-sidebar #stripeBtn:hover,
.cart-sidebar #stripeBtnGuest:hover { filter: brightness(0.85); transform: translateY(-1px); }

/* Cart item rows — horizontal flex, image | info | controls all in one row */
.cart-items > div[id^="cartItem-"] {
  display: flex; align-items: center; gap: 12px;
  padding: 0.6rem 0;     /* tightened — was 0.9rem 0 */
  border-bottom: 1px solid var(--draft-border);
}
.cart-items > div[id^="cartItem-"] img.cart-item-image {
  display: block;        /* unhide (was display:none inline default for production safety) */
  width: 60px; height: 60px;
  object-fit: contain; background: #fff; border-radius: 8px; flex-shrink: 0;
  margin-right: 0;       /* gap handles spacing */
  border: 1px solid var(--draft-border);
}
.cart-items > div[id^="cartItem-"] strong { color: var(--draft-text); font-family: 'DM Sans', sans-serif; font-weight: 500; }
[data-theme="dark"] .cart-items > div[id^="cartItem-"] strong { color: var(--draft-text); }
.cart-items > div[id^="cartItem-"] span[style*="#e07856"] { color: var(--accent); font-family: 'DM Sans', sans-serif; }
.cart-items > div[id^="cartItem-"] span[style*="#888"] { color: var(--draft-muted); }
.cart-items > div[id^="cartItem-"] > div:nth-of-type(2) { flex-shrink: 0; gap: 6px; }

/* Quantity − / + buttons */
.cart-items > div[id^="cartItem-"] button[onclick^="updateQuantity"] {
  background: var(--bg); color: var(--draft-text); border: 1px solid var(--draft-border);
  border-radius: 6px; font-family: 'DM Sans', sans-serif; transition: background .2s ease;
}
.cart-items > div[id^="cartItem-"] button[onclick^="updateQuantity"]:hover { background: var(--draft-border); }

/* Remove button — outlined navy circle */
.cart-items > div[id^="cartItem-"] button[onclick^="removeFromCart"] {
  background: transparent; color: var(--primary); border: 1px solid var(--draft-border);
  border-radius: 50%; width: 30px; height: 30px; padding: 0;
  display: inline-flex; align-items: center; justify-content: center;
  transition: border-color .2s ease, color .2s ease;
}
[data-theme="dark"] .cart-items > div[id^="cartItem-"] button[onclick^="removeFromCart"] { color: var(--draft-text); }
.cart-items > div[id^="cartItem-"] button[onclick^="removeFromCart"]:hover { border-color: var(--accent); color: var(--accent); }
.cart-items > div[id^="cartItem-"] button[onclick^="removeFromCart"] svg { width: 14px; height: 14px; }

/* Attribute-selector overrides (kill the inline gradients/colors from app.min.js) */
.cart-sidebar [style*="linear-gradient(135deg, #2c4a5c"] {
  background: var(--bg); padding: 14px; border-radius: 12px;
  border: 1px solid var(--draft-border); box-shadow: none;
}
[data-theme="dark"] .cart-sidebar [style*="linear-gradient(135deg, #2c4a5c"] {
  background: #0d1f2d; border-color: rgba(255,255,255,0.10);
}
.cart-sidebar [style*="background: #f8f9fa"],
.cart-sidebar [style*="background:#f8f9fa"] { background: transparent; border: none; }
/* Kill the inline padding-bottom on the buttons-row wrapper so buttons sit flush */
.cart-sidebar [style*="padding: 2px 10px 8px"] { padding: 2px 10px 0; }
```

**Mobile media query (`@media (max-width: 514.56px)`):**

```css
.cart-sidebar { width: 100%; right: -100%; border-radius: 0; top: 0; bottom: 0; height: auto; }
.cart-sidebar.active { right: 0; }
.cart-checkout-fixed {
  position: absolute; top: auto; bottom: 85px; left: 0; right: 0;
  background: var(--bg); border-top: 1px solid var(--draft-border); border-bottom: none;
  box-shadow: 0 -2px 8px rgba(26,58,82,0.08); z-index: 10;
  padding: 10px 14px 0 14px;     /* no bottom padding so buttons touch mobile nav top */
}
.cart-footer { padding-bottom: 220px; padding-top: 0.5rem; }    /* clears the absolute checkout bar */
[data-theme="dark"] .cart-checkout-fixed { background: #0d1f2d; }
```

#### App.min.js inline-style patches needed at migration

These eight surgical edits remove the inline colors/gradients that
force us to use `!important`. Apply with python/sed, verify with grep
after each.

| # | Find (in app.min.js) | Replace with |
|---|---|---|
| 0 | Checkout OUTER wrapper `<div style="border-radius: 9px; overflow: hidden; box-shadow: 0 3px 10px rgba(44,74,92,0.15);">` | **Option C**: Add `class="checkout-card"`. Strip the inline `border-radius`, `overflow`, `box-shadow`. CSS class: `.checkout-card { background: var(--surface); border: 1px solid var(--draft-border); border-radius: 14px; box-shadow: 0 2px 10px rgba(26,58,82,0.08); padding: 14px; }`. |
| 1 | `<button id="stripeBtn"` logged-in variant with inline `background: #2c4a5c` + `onmouseover/onmouseout` hover handlers | Strip the inline `background`. Strip the hover handlers. Let CSS rule control. |
| 2 | Pay-by-Card label `<div style="background: linear-gradient(135deg, #2c4a5c, #1e3545); color: white; text-align: center; padding: 10px 10px; ...">` | **Option C**: Add `class="checkout-card-header"`. Strip inline `background:`, `color:`, `padding:`, `font-size:`, `font-weight:`. CSS class: `.checkout-card-header { color: var(--primary); font-family: 'Cormorant Garamond', serif; font-size: 1.05rem; font-weight: 400; letter-spacing: -0.01em; padding: 0 0 10px 0; text-align: center; }`. Inner Arabic span: `font-family: 'Almarai'; color: var(--draft-muted); font-size: 0.78rem; margin-left: 6px;`. |
| 3 | Buttons wrapper `<div style="display: flex; gap: 8px; background: linear-gradient(135deg, #2c4a5c, #1e3545); padding: 2px 10px 8px;">` | **Option C**: Add `class="checkout-card-buttons"`. Strip inline `background:` and `padding:`. CSS class: `.checkout-card-buttons { display: flex; gap: 8px; padding: 0; }`. |
| 4 | Sign-in `<button id="stripeBtn" ... style="...background: #3d6178;...">` and As-Guest `<button id="stripeBtnGuest" ...>` | Strip the inline `background: #3d6178`. Both buttons get colored via `#stripeBtn` / `#stripeBtnGuest` CSS rules. |
| 5 | Totals box `<div style="background: #f8f9fa; border-radius: 8px;">` | Add `class="cart-summary"`. Strip inline `background:`. Add `.cart-summary { background: transparent; border-radius: 8px; }` in styles.css. |
| 6 | Cart item product name `<strong style="font-size:${p}; color:#2c4a5c;">` | Strip `color:#2c4a5c;`. Let `.cart-items strong` CSS rule control. |
| 7 | Cart item price `<span style="color:#e07856; font-weight:600; font-size:${g};">` | Strip `color:#e07856;`. Add a class (e.g. `cart-item-price`) and style via `.cart-item-price { color: var(--accent); }`. |
| 8 | Remove button `<button onclick="removeFromCart(...)" style="padding:${y}; background:#dc3545; ...">` | Strip `background:#dc3545; color:white; border:none;`. Let the outlined-navy CSS rule control. |

Also strip `style="display:none"` from the `<img class="cart-item-image">`
template — at cutover, image should be the default everywhere, not
hidden by default.

#### Migration sequence

- [ ] **1. Branch** off main as `claude/cart-migration` (not directly on main).
- [ ] **2. Copy** R1's `/* ═══════ CART ═══════ */` block from the `edit-overlay` into `styles.css`. Overwrite the existing cart rules in styles.css. Strip the `!important` markers in the migrated version.
- [ ] **3. Delete** the same block from T&C's overlay (was a verbatim duplicate).
- [ ] **4. Apply the 8 `app.min.js` patches** in the table above, one at a time. After each: `grep -c '#2c4a5c' app.min.js` etc. to verify the inline hex/string is gone.
- [ ] **5. Convert attribute selectors → class selectors** in the migrated CSS:
  - `[style*="linear-gradient(135deg, #2c4a5c"]` → `.checkout-header-band, .checkout-buttons-wrap`
  - `[style*="background: #f8f9fa"]` → `.cart-summary`
  - `[style*="padding: 2px 10px 8px"]` → `.checkout-buttons-wrap` (with the padding baked into the class)
- [ ] **6. Strip `style="display:none"`** from the cart-item-image element in `app.min.js`. Add `display: block` to the migrated CSS as the default.
- [ ] **7. Delete dead `.checkout-btn.whatsapp-btn`** rules from `styles.css` — no element ever uses that class.
- [ ] **8. Reconcile base mobile rules** in `styles.css`'s `@media (max-width:768px)` block:
  - Replace `.cart-sidebar { height: calc(100vh - 70px); padding-bottom: 0; }` with `.cart-sidebar { top: 0; bottom: 0; height: auto; }`
  - Replace `.cart-checkout-fixed { position: sticky; top: 0; ... }` with `.cart-checkout-fixed { position: absolute; bottom: 85px; padding: 10px 14px 0 14px; ... }` (full ruleset from overlay above)
  - Add `.cart-footer { padding-bottom: 220px; padding-top: 0.5rem; }`
- [ ] **9. Deploy to Firebase preview channel** (`r1-cart-migration`). Open in incognito on mobile and desktop. Compare cart visually to the current R1 cart — should be pixel-identical.
- [ ] **10. Merge to main** once visual parity is confirmed.

#### Risk and time

- **Low risk** if the 8 patches land cleanly. The cart behavior (event handlers, checkout flow, Stripe) does NOT change — only inline presentational attributes get moved to CSS classes.
- **Medium risk if rushed** — missing one hex value means a half-old/half-new cart.
- **Time**: ~10 min CSS copy + ~25 min JS patches + ~10 min selector cleanup + ~15 min preview channel test + ~5 min merge = **~65 min focused work.**

Schedule for a quiet hour. Don't migrate while still iterating on R1's cart visuals.

### Phase 3 — self-host The Edit's fonts
- [x] **DONE** — `orlo-the-edit.html` no longer loads from Google
      Fonts CDN. The `<link rel="preconnect" href="fonts.googleapis.com">`
      and the `<link href="https://fonts.googleapis.com/css2?...">`
      were replaced with 8 inline `@font-face` declarations pointing
      at `/fonts/` (Cormorant 300, 400, 600 + 300i, 400i; DM Sans
      300, 400, 500). Two preloads added for the most-used regular
      weights. The Edit is now fully self-hosted, no third-party
      font requests, no visitor IPs sent to Google for font delivery.

### Phase 4 — repo cleanup
- [ ] Delete unused Spectral files from `/fonts/`:
      - `spectral-v15-latin-300.woff2`
      - `spectral-v15-latin-regular.woff2`
      - `spectral-v15-latin-italic.woff2`
      - `spectral-v15-latin-500.woff2`
      - `spectral-v15-latin-600.woff2`
- [ ] Delete unused DM Sans extras (uploaded but unused):
      - `dm-sans-v17-latin-300italic.woff2`
      - `dm-sans-v17-latin-italic.woff2`
      - `dm-sans-v17-latin-500italic.woff2`
      - `dm-sans-v17-latin-600.woff2`
- [ ] Delete safety-copy HTML files no longer needed:
      - `indexbeforetagsremoval.html`
      - `indexgemeni.html`
      - `draftnewindex.html` (after cutover — replaced by R1)
- [ ] Move internal mockup files into a `mockups/` subfolder:
      - All `mockup-*.html`, `marketing-*.html`, `category-*.html`,
        `anim-*.html`, `dangling-*.html`, `color-preview.html`,
        `email-preview-*.html`, `fb-cover.html`, `Testdl.html`,
        `dltest.html`, `mockups-*.html`

### Phase 5 — discussed but not yet decided
- [ ] **`font-display: optional`** on DM Sans + Almarai — would
      eliminate FOUT on repeat visits at the cost of first-paint
      fallback for slow connections. Currently using `swap`.
- [ ] **Smart back-arrow behaviour on more pages** — extend the T&C
      back-arrow pattern to account, login, etc.
- [ ] **Bottom-nav indicator defaults** — extend the
      "default-to-current-section" logic from T&C to other pages
      (Account → Login active, Cart open → Cart active, etc.)
- [ ] **Eleventy migration** — only after R1 is live and stable for
      a few weeks. See conversation notes from session
      `claude/draftnewindex-index-seo-S5Vmm` for plan.

---

## 4. Known acceptable trade-offs

These are NOT bugs to fix — they're intentional design decisions:

- **FOUT flash on cross-page navigation** (e.g., promo banner font
  shifts when navigating R1 → T&C). Normal web-font behaviour;
  disappears on repeat visits as fonts cache. The Edit has the same.
- **Mobile-menu uses page reload, not SPA navigation**. Browser
  reloads the new HTML on each click. Same as today.
- **Top nav still shows Shop / About / Contact as in-page anchors on
  R1**. Correct: those sections exist on R1 itself.

---

## 5. Quick reference — file map

| File | Status | Role |
|---|---|---|
| `draftnewindexR1.html` | DRAFT | New homepage candidate. Becomes `index.html` at cutover. |
| `index.html` | LIVE (legacy) | Current production homepage. Replaced at cutover. |
| `draftnewindex.html` | DEPRECATED | Original draft, superseded by R1. Delete at cutover. |
| `terms-and-conditions.html` | LIVE | Policy page. Linked from R1 and (post-cutover) from the new index.html. |
| `styles.css` | LIVE | Shared stylesheet. Now centralises all `@font-face`. |
| `app.min.js` | LIVE | Shared JS. Contains the **temporary patch** documented in §1.3. |
| `R1-CUTOVER-CHECKLIST.md` | THIS FILE | Delete after cutover and Phases 2-4 done. |

---

## 6. Original 7-point SEO audit — resolution map

Cross-reference of the seven SEO / technical regressions identified
when first comparing `index.html` vs `draftnewindex.html`. Each row
shows what we did about it and where to look in this checklist if
there's still an action.

| # | Original issue | Status | Where in this checklist |
|---|---|---|---|
| **1** | **Indexability** — draft `<title>` ("ORLO — Draft Preview") + `<meta name="robots" content="noindex,nofollow">` | 🟡 **Intentional draft state** — keep until cutover | §1.2 (revert at cutover) |
| **2** | **Organization JSON-LD** weakened — `name` changed to "ORLO", `@id` / `legalName` / `alternateName` / `slogan` / Facebook `sameAs` all dropped, weaker `description` | ✅ **Fixed in R1** — full 8-field block restored verbatim, incl. Facebook `sameAs` and `@id` hook for future `BlogPosting` schemas on The Edit | §2 (don't revert) |
| **3** | **UTM tracking script** — initially flagged as removed | ⚪ **False alarm** — script was actually present in the draft (my error in the original audit). No action ever needed; UTM capture into `sessionStorage.orlo_utm` works on both R1 and T&C | — |
| **4** | **SEO content section** reduced from 5 paragraphs + bullets + `<strong>` keyword anchors → 1 short paragraph per language; ~100 fewer indexable words; "Why Shop at ORLO?" lost | ✅ **Fixed in R1** — full 5-paragraph English + 3-paragraph Arabic block restored, all `<strong>` tags back, "Why Shop at ORLO?" sub-heading and 4-bullet list per language back. Body uses DM Sans 16px / 1.85 line-height to match Edit reading rhythm | §2 (don't revert) |
| **5** | **T&C restructure** — homepage `#terms` section with 5 `<h3>` cards deleted; only path to Shipping / Returns / Privacy / Exchange was a faded footer strip with `href="#"` calling JS modals; standalone `terms-and-conditions.html` page existed but was orphaned (no inbound links anywhere) | ✅ **Fixed across files** — orphan page restyled to match Edit (Cormorant headings, DM Sans body, full header/footer/cart, dark mode, back arrow, menu-active indicator); 5 anchor IDs added (`#shipping`, `#returns`, `#exchange`, `#privacy`, `#terms`); R1's footer strip + top-menu link now point to real `terms-and-conditions.html#anchor` URLs; mobile-menu Terms link also routes there via `app.min.js` patch | §2 (T&C page), §1.4 (Stripe/Meta URL updates at cutover) |
| **6** | **Internal linking** — new "The Edit" teaser CTA added (`orlo-the-edit.html` link) | ✅ **Net positive** — kept as-is, gives Google a crawlable destination + drives content-marketing funnel | §2 (don't revert) |
| **7** | **Third-party dependency** — Google Fonts CDN added for Cormorant Garamond + Spectral; extra DNS+TLS request, visitor IPs sent to Google | ✅ **Fully fixed** — all fonts on R1, T&C, and `orlo-the-edit.html` now self-hosted from `/fonts/`. Zero Google Fonts requests anywhere. Spectral dropped entirely; Cormorant + DM Sans + Almarai is the unified set | §3 Phase 3 marked complete |

### Items beyond the original 7 (added during the work)

Several improvements were made beyond the original audit. Logging
them here so the historical record is complete:

| Addition | Status |
|---|---|
| Self-hosted **DM Sans** (3 weights) added to `styles.css` | ✅ live |
| Self-hosted **Cormorant Garamond** (5 weights) added to `styles.css` | ✅ live |
| Centralised `@font-face` declarations in `styles.css` (was: duplicated per-page) | ✅ live |
| Dark-mode toggle persisted across R1 and T&C via `localStorage.orlo_draft_theme` | ✅ live |
| `WebPage` JSON-LD on T&C linked to Organization `@id` | ✅ live |
| Back arrow on T&C with `history.back()` smart-fallback | ✅ live |
| Bottom-nav indicator defaults to Menu on T&C | ✅ live |
| Mobile-menu (`toggleMobileMenu()`) homepage detection patched to recognise R1 | 🟡 temp — see §1.3 to revert at cutover |
| **Cart restyled to Edit look** — soft 16px radius, navy-tinted shadow, Cormorant header h2 and total, cream footer, sticky-bottom mobile checkout, outlined-navy remove button (was alarm red), product image with `clean.webp` selection, color overrides for inline-styled name + price | 🟡 lives in R1 + T&C overlays as `!important` overrides + one surgical `app.min.js` image patch — see §3 Phase 2.5 to migrate to `styles.css` and drop the `!important`s |
