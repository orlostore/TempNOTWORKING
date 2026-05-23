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

**Reality check on this migration: it is NOT just copy-paste.** Every
`!important` in the overlay's `/* CART */` block exists because
`app.min.js` injects inline `style="..."` attributes when rendering the
cart, and inline styles beat external CSS unless overridden with
`!important`. Drop the `!important` markers without also patching
`app.min.js` to remove its inline styles, and the cart visually
regresses to the old look on EVERY page.

So the migration is a **coordinated CSS + JS edit pass**, ~1 hour of
focused work. Detailed steps below.

The cart restyle (sidebar shape, header font, footer cream bg, checkout
button colors, sticky-bottom mobile, outlined-navy remove button, product
image, cart item color overrides) currently lives **duplicated** inside
the `<style id="edit-overlay">` block in both `draftnewindexR1.html`
and `terms-and-conditions.html`, using `!important` to override the
inline styles `app.min.js` injects.

#### The 8 surgical `app.min.js` patches needed at migration

These can be done one by one with `sed`, `perl`, or a Python script. Each
needs verification before moving to the next.

| # | Inline today | Replace with |
|---|---|---|
| **1** | `<button id="stripeBtn" style="...background: #2c4a5c; ...">` (logged-in variant) | Remove `background: #2c4a5c;` from inline style. Same for `onmouseover="this.style.background='#1e3545'"` and `onmouseout`. Let `#stripeBtn` CSS class control color. |
| **2** | `<div style="background: linear-gradient(135deg, #2c4a5c, #1e3545); color: white; text-align: center; padding: 10px 10px; ...">` (Pay by Card label) | Add `class="checkout-header-band"`. Remove inline `background:`, `color:`. Add CSS `.checkout-header-band { background: var(--primary); color: #fff; ... }`. |
| **3** | `<div style="display: flex; gap: 8px; background: linear-gradient(135deg, #2c4a5c, #1e3545); padding: 2px 10px 8px;">` (buttons wrapper) | Add `class="checkout-buttons-wrap"`. Remove inline `background:`. Style via class. |
| **4** | `<button id="stripeBtn" ... style="...background: #3d6178; ...">Sign in</button>` and same for `#stripeBtnGuest` | Remove inline `background: #3d6178;`. Let `#stripeBtn`/`#stripeBtnGuest` CSS class control color. |
| **5** | `<div style="background: #f8f9fa; border-radius: 8px;">` (Subtotal/Delivery/Total wrapper) | Add `class="cart-summary"`. Remove inline `background:`. Style via class. |
| **6** | `<strong style="font-size:${p}; color:#2c4a5c;">${name}</strong>` (cart item product name) | Remove `color:#2c4a5c;` from the inline. Let `.cart-items strong` CSS class control color. |
| **7** | `<span style="color:#e07856; font-weight:600; font-size:${g};">AED ${price}</span>` (cart item price) | Remove `color:#e07856;`. Let `.cart-items span.price` (or similar — add a class) CSS control color. |
| **8** | `<button onclick="removeFromCart(${d})" style="padding:${y}; background:#dc3545; ...">` (remove button) | Remove `background:#dc3545; color:white;`. Let CSS class control. |

After those 8 edits, the inline style attributes hold only **layout** properties (padding, font-size, etc.) that don't conflict with the new design, and the new design's colors / backgrounds / shapes are driven entirely by `styles.css`.

#### Migration sequence

- [ ] **1. Backup** — branch off main as `claude/cart-migration` for testing.
- [ ] **2. Copy the entire `/* CART — Edit-look restyle */` block** out of `draftnewindexR1.html`'s `<style id="edit-overlay">`. Paste it into `styles.css` near the existing `.cart-sidebar` rules. Overwrite the existing cart-related rules in `styles.css` (the old `.cart-sidebar { ... }`, `.cart-header { ... }`, `.cart-footer { ... }`, `.checkout-btn { ... }`).
- [ ] **3. Delete the same `/* CART */` block from `terms-and-conditions.html`'s overlay** — it was a duplicate of R1's.
- [ ] **4. Patch `app.min.js`** — apply the 8 surgical edits in the table above. Verify each with `grep` afterwards (e.g., `grep -c '#2c4a5c' app.min.js` should drop to zero hits inside cart-render strings).
- [ ] **5. Replace the attribute selectors with class selectors** in the migrated CSS:
  - `[style*="linear-gradient(135deg, #2c4a5c"]` → `.checkout-header-band, .checkout-buttons-wrap` (depending on context)
  - `[style*="background: #f8f9fa"]` → `.cart-summary`
- [ ] **6. Drop ALL `!important` markers** from the migrated cart rules. Verify by visually testing the cart in dev / preview after each removal pass.
- [ ] **7. Drop the inline `style="display:none"` from the cart-item image template** in `app.min.js` — it was hiding the image on production. After migration, image is the new default everywhere.
- [ ] **8. Remove the `<div id="cartItem-N" style="display:flex; ...">` inline `display:flex`** from `app.min.js`'s cart-item template, so our new `display:grid` becomes the default without `!important`.
- [ ] **9. Delete the dead `.checkout-btn.whatsapp-btn`** rule from `styles.css` — no element ever uses the `whatsapp-btn` class.
- [ ] **10. Reconcile mobile cart heights** — the overlay currently overrides `.cart-sidebar { height: calc(100vh - 85px) !important; height: calc(100dvh - 85px) !important; }` because (a) the base 70px was too tight (clipped buttons against the nav) and (b) `100vh` doesn't adjust when Chrome's URL bar hides on scroll, exposing the page behind the cart. The two-line declaration uses `100vh` as fallback and `100dvh` (dynamic viewport) for modern browsers (Chrome 108+, Safari 15.4+). 85px matches the actual mobile bottom nav height with home-indicator safe area. The breathing room above the buttons comes from `bottom: 25px` on `.cart-checkout-fixed`, NOT from making the sidebar shorter (which would expose the page). Update the base rule in `styles.css`'s `@media (max-width:768px)` block to use both `100vh` and `100dvh` calcs. Drop the `!important`s.
- [ ] **11. Reconcile mobile cart-footer padding** — overlay sets `.cart-footer { padding-bottom: 150px !important; }` for mobile. Move that to `styles.css` mobile media query (without `!important`).
- [ ] **12. Reconcile cart-checkout-fixed positioning** — overlay sets `.cart-checkout-fixed { position: absolute; bottom: 0; ... }` for mobile (replacing the old `position: sticky; top: 0;`). Move to `styles.css` mobile media query.
- [ ] **13. Test on Firebase preview channel** — deploy `claude/cart-migration` to a `r1-cart-migration` preview channel. Open in incognito on mobile + desktop. Verify cart looks identical to current R1 cart. Take side-by-side screenshots if anything seems off.
- [ ] **14. Merge to main** — once visual parity confirmed, merge the branch.

#### Migration risk

- **Low** if the 8 patches are done carefully and tested. The cart's behavior (JS event handlers, checkout flow, Stripe integration) does NOT change — we only touch presentational inline attributes.
- **Medium-to-high if rushed.** Missing one hex value means the cart looks half-old-half-new and it's hard to spot which patch was missed without methodical comparison.

#### Time estimate

- ~10 min: copy CSS into `styles.css`
- ~25 min: apply 8 `app.min.js` patches with verification
- ~10 min: drop `!important` markers; convert attribute selectors → class selectors
- ~15 min: deploy to preview channel + visual testing on mobile/desktop
- ~5 min: deploy to main

**Total: ~1 hour focused work.** Schedule for a quiet day.

Migration steps:

- [ ] **Lift the cart block into `styles.css`**: open `draftnewindexR1.html`,
      copy the `/* ═══ CART — Edit-look restyle ═══ */` block
      (everything between that comment header and the `/* Small draft
      marker */` comment), paste it into `styles.css` near the existing
      `.cart-sidebar` rules. Overwrite the old cart rules.
- [ ] **Delete the duplicate** from `terms-and-conditions.html` (same
      copy lives there).
- [ ] **Patch `app.min.js` to use CSS variables for the Stripe button
      colors** so we can drop the `!important`s from the migrated CSS:
      - Find `style="width: 100%; padding: 0.9rem; ... background: #2c4a5c; ...` (logged-in stripeBtn) →
        change `#2c4a5c` to `var(--primary)` and the hover handlers
        `onmouseover="this.style.background='#1e3545'"` /
        `onmouseout="this.style.background='#2c4a5c'"` →
        `onmouseover="this.style.filter='brightness(0.85)'"` /
        `onmouseout="this.style.filter=''"`
      - Find `linear-gradient(135deg, #2c4a5c, #1e3545)` (guest sign-up
        promo background) → replace with `var(--primary)` solid or a
        new gradient using CSS variables
      - Find `<button id="stripeBtnGuest"` (guest direct checkout) →
        same color treatment
      - Also: the cart-item template has inline `color:#2c4a5c` on the
        product name `<strong>` and `color:#e07856` on the price
        `<span>`. Either replace those literal hex values with
        `var(--primary)` and `var(--accent)` inline, OR strip the inline
        colors and let the class-based CSS in styles.css do it.
- [ ] **Drop all `!important` markers** from the migrated cart rules
      once the inline JS colors are gone.
- [ ] **Delete dead CSS**: `.checkout-btn.whatsapp-btn` rules in
      styles.css are unused — no `<button class="whatsapp-btn">` is
      ever rendered. Remove them.
- [ ] **Cart-item image — flip the default**. The `<img class="cart-item-image">`
      element is currently rendered with inline `style="display:none"` so
      it stays invisible on production `index.html`; R1 and T&C overlays
      override with `display: block !important`. At cutover, when R1 IS
      the new index.html, we WANT the image visible everywhere. Steps:
      remove the inline `style="display:none"` from the cart-item template
      in `app.min.js`; lift the full `.cart-items img.cart-item-image`
      rule (without the `display: block !important`, just the size /
      background / border properties) into `styles.css` as the new global
      default. Drop the `!important`s.
- [ ] **Guest sign-up wrapper gradient** — currently overridden via
      `[style*="linear-gradient(135deg, #2c4a5c"]` attribute selector
      with `!important`. Migration: find the inline
      `style="...background: linear-gradient(135deg, #2c4a5c, #1e3545); padding: 2px 10px 8px;"`
      in `app.min.js`, replace with `class="guest-checkout-wrapper"`
      (with no inline background). Then add a clean
      `.guest-checkout-wrapper { background: var(--bg); padding: 14px;
      border-radius: 12px; border: 1px solid rgba(26,58,82,0.10); }`
      block in `styles.css`. Drop the attribute selector from the
      migrated CSS.
- [ ] **Totals summary box** (`#f8f9fa` background) — currently
      overridden via `[style*="background: #f8f9fa"]`. Migration: find
      the inline `style="background: #f8f9fa; border-radius: 8px;"`
      that wraps the Subtotal / Delivery / Total rows in `app.min.js`,
      replace the inline background with `class="cart-summary"` (keep
      the border-radius via the class). Add a clean `.cart-summary`
      rule in `styles.css` (background transparent or inherit). Drop
      the attribute selector from the migrated CSS.
- [ ] **Horizontal cart-item layout** — implemented in overlays as
      `display: flex !important; align-items: center; gap: 12px;`. This
      matches the original flex layout from `app.min.js` but with cleaner
      gap/align values. Migration: lift the rule into `styles.css`. The
      inline `display: flex` from `app.min.js` already matches; just
      need to harmonise the inline `gap: 0.3rem` etc. with the new
      values (or strip the inline gap so the class wins without
      `!important`).
- [ ] **Mobile checkout bar positioning** — `app.min.js` puts the
      Pay-by-Card / Sign-in / As-Guest HTML into `#cartCheckoutFixed`
      on mobile (NOT into `.cart-footer`). The overlay positions that
      element absolutely to the bottom of `.cart-sidebar`:
      ```css
      @media (max-width:514.56px) {
        .cart-checkout-fixed {
          position: absolute; top: auto; bottom: 0; left: 0; right: 0;
          background: var(--bg); border-top: 1px solid var(--draft-border);
          z-index: 10; padding: 10px 14px;
        }
        .cart-footer { padding-bottom: 110px; }
      }
      ```
      Migration: lift these into `styles.css`'s
      `@media (max-width:514.56px)` block, replacing the current
      `.cart-checkout-fixed { position: sticky; top: 0; ... }` rule.
      Drop the `!important`s. Rationale: cart-sidebar is default
      `calc(100vh - 70px)` tall on mobile (the 70px leaves room for
      the floating mobile bottom nav). Pinning `.cart-checkout-fixed`
      `bottom: 0` of the sidebar puts the checkout bar exactly above
      the nav. The cart-footer padding-bottom keeps its content
      (Add AED 25 + totals) from being covered by the absolute child.

Estimated migration effort: 30–45 minutes of mechanical edits.

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
