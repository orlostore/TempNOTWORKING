# Gemini brief — in-card image swipe still not working on Chrome Android (round 2)

You diagnosed this once already. The three fixes you recommended were applied. The user reports it's still not working. I then found a CSS specificity bug and rewrote the handler to use pointer events (matching the Popular Now carousel on the same page which works fine). Still nothing. Need fresh eyes.

---

## Goal

On the homepage product grid (`/index.html`), each product card has a square image tile. On mobile only, the user should be able to **swipe horizontally inside the tile to flip between that product's images** (Hermès / Net-a-Porter pattern). Dots overlay the bottom-center showing position. Tapping the tile (no drag) still navigates to the PDP via the parent `<a>`. Desktop hover stays untouched — dots are hidden via `@media (hover: hover)`.

The user has confirmed all products have ≥3 images.

The exact same page also has a **Popular Now carousel** at the top, which uses the same `display:flex` + `flex:0 0 100%` + `translateX(-N00%)` pattern and **works perfectly** on the same Chrome Android device. That's the user's clue: "I am worried it has something to do with the swipe of popular now" — meaning, what's different about ours vs theirs that makes ours fail?

---

## Stack

- Cloudflare Pages + Pages Functions
- Vanilla JS (no framework)
- `<body data-cards="v2">` opt-in attribute scopes the new card layout so it doesn't touch other pages
- Defer-loaded scripts: `products.min.js`, `app.min.js` (legacy `renderProducts` lives here, builds `.product-card` not `.card`)
- Inline `<script>` at bottom of index.html: replaces `window.renderProducts` inside a `DOMContentLoaded` handler, so app.min.js's hoisted `function renderProducts(){}` is overridden before window.onload calls it
- Re-render watchdog (rerender() called at 0, 200, 500, 1200, 2500ms after DOMContentLoaded) in case legacy render fired early
- Product object shape: `p.images` is an array (mainImage + image2..image8, filtered to truthy) — confirmed by reading `/functions/api/products.js:158`

---

## What we already tried (in order)

1. **Schema bug fix.** First implementation looped `p.image2`, `p.image3`, … which don't exist on the product object. Fixed to read `p.images` array. Committed.

2. **Your previous diagnosis (round 1) — three Chrome Android fixes.** All applied and committed (`49e060a`):
   - `touchmove` registered with `{passive: false}` so `e.preventDefault()` can run on confirmed horizontal motion (otherwise Chrome hijacks the gesture)
   - `.card-img-track { height: 100% }` so flex children don't collapse
   - `.card-img-track img { pointer-events: none }` so Android doesn't pop the long-press context menu

3. **CSS specificity collision in styles.css line 92.** Found during the round-2 investigation:
   ```css
   body[data-cards="v2"] .card-img > div:not(.sold-out-strip):not(.badge), …
       { width:100%; height:100%; object-fit:cover; display:block }
   ```
   That selector has specificity (0,4,2). It was matching `.card-img-track` and `.card-img-dots` as direct children of `.card-img` and **forcing them to `display:block`** — beating the in-head `body[data-cards="v2"] .card-img-track { display: flex }` rule (0,2,1). Result: the three images stacked vertically, `translateX` slid an empty column. Added `:not(.card-img-track):not(.card-img-dots)` to the exclusion list. Committed (`9add281`).

4. **Rewrote handler from touch events to pointer events.** Reasoning: Popular Now on the same page uses pointer events and works on Chrome Android; touch events on Chrome Android with `touch-action: pan-y` are fussier (passive vs non-passive, preventDefault timing, gesture-hijack on touches inside `<a>` targets). Switched to `pointerdown` / `pointermove` / `pointerup` / `pointercancel`. Committed (`68ca93f`).

User reports: **still not working after all four rounds.**

---

## Current code (verbatim, post-fix-4)

### `index.html` — `<head>` CSS (inline)

```css
body[data-cards="v2"] .card-img { position: relative; overflow: hidden; }
body[data-cards="v2"] .card-img-track { display: flex; width: 100%; height: 100%; will-change: transform; touch-action: pan-y; }
body[data-cards="v2"] .card-img-track img { flex: 0 0 100%; width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
body[data-cards="v2"] .card-img-dots { position: absolute; bottom: 10px; left: 0; right: 0; display: flex; justify-content: center; gap: 6px; pointer-events: none; z-index: 3; }
body[data-cards="v2"] .card-img-dots span { width: 5px; height: 5px; border-radius: 50%; background: rgba(26,58,82,0.30); transition: background .25s ease, width .25s ease; }
body[data-cards="v2"] .card-img-dots span.active { background: #1a3a52; width: 16px; border-radius: 3px; }
@media (hover: hover) { body[data-cards="v2"] .card-img-dots { display: none; } }
```

### `styles.css` line 91–92 (after round-3 fix)

```css
body[data-cards="v2"] .card-img{position:relative;width:100%;aspect-ratio:1/1;overflow:hidden;background:transparent;padding:0;display:block}
body[data-cards="v2"] .card-img > div:not(.sold-out-strip):not(.badge):not(.card-img-track):not(.card-img-dots),body[data-cards="v2"] .card-img img{width:100%;height:100%;object-fit:cover;display:block}
```

### `index.html` — `renderProducts` override (relevant portion)

```js
document.addEventListener('DOMContentLoaded', function(){
  if (document.body.dataset.cards !== 'v2') return;
  window.renderProducts = function(list, arabicMode){
    var grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = list.map(function(p, i){
      var imgs = [];
      if (Array.isArray(p.images) && p.images.length > 0) {
        imgs = p.images.filter(function(s){ return s && typeof s === 'string' && s.indexOf('http') === 0; });
      } else if (p.image && typeof p.image === 'string' && p.image.indexOf('http') === 0) {
        imgs = [p.image];
      }
      // build N <img>s into imgsHTML, wrap in .card-img-track …
      var imgHTML = '<div class="card-img-track">'+imgsHTML+'</div>';
      var dotsHTML = imgs.length > 1
        ? '<div class="card-img-dots" aria-hidden="true">' + imgs.map(function(_, idx){
            return '<span class="' + (idx === 0 ? 'active' : '') + '"></span>';
          }).join('') + '</div>'
        : '';
      // …
      return '<div class="card …">'+
        '<a href="'+pdpHref+'" class="card-link"><div class="card-img" data-img-count="'+imgs.length+'">'+imgHTML+badge+dotsHTML+'</div></a>'+
        '<div class="card-info"> … </div>'+
      '</div>';
    }).join('');
    initCardSwipe(grid);
  };

  function initCardSwipe(grid){
    grid.querySelectorAll('.card-img[data-img-count]').forEach(function(cardImg){
      if (cardImg._swipeInited) return;
      var count = parseInt(cardImg.dataset.imgCount, 10);
      if (!count || count < 2) return;
      cardImg._swipeInited = true;
      var track = cardImg.querySelector('.card-img-track');
      var dots = cardImg.querySelectorAll('.card-img-dots span');
      var link = cardImg.closest('.card-link');
      var index = 0;
      var sx = 0, sy = 0, dx = 0, swiping = false, swiped = false;

      function go(n){
        index = Math.max(0, Math.min(count - 1, n));
        track.style.transition = 'transform .35s ease';
        track.style.transform = 'translateX(-' + (index * 100) + '%)';
        dots.forEach(function(d, i){ d.classList.toggle('active', i === index); });
      }

      cardImg.addEventListener('pointerdown', function(e){
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        sx = e.clientX; sy = e.clientY;
        dx = 0; swiping = true; swiped = false;
      });
      cardImg.addEventListener('pointermove', function(e){
        if (!swiping) return;
        dx = e.clientX - sx;
        var dy = Math.abs(e.clientY - sy);
        if (Math.abs(dx) > 14 && Math.abs(dx) > dy * 1.4) swiped = true;
      });
      cardImg.addEventListener('pointerup', function(){
        if (!swiping) return;
        swiping = false;
        if (swiped && Math.abs(dx) > 40) go(dx < 0 ? index + 1 : index - 1);
        else if (swiped) go(index);
      });
      cardImg.addEventListener('pointercancel', function(){ swiping = false; });

      if (link) {
        link.addEventListener('click', function(ev){
          if (swiped) { ev.preventDefault(); ev.stopPropagation(); swiped = false; }
        }, true);
      }
    });
  }

  function rerender(){
    if (typeof products !== 'undefined' && Array.isArray(products) && products.length){
      window.renderProducts(products, document.documentElement.lang === 'ar');
    }
  }
  rerender();
  setTimeout(rerender, 200);
  setTimeout(rerender, 500);
  setTimeout(rerender, 1200);
  setTimeout(rerender, 2500);
});
```

### Popular Now carousel (in `app.min.js`, demonstrably WORKING on the same page / device) — for comparison

```js
function initPopularCarousel(root){
  if (root._inited) return;
  root._inited = true;
  // …
  let sx=0, sy=0, dx=0, swiping=false, swiped=false;
  root.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    sx = e.clientX; sy = e.clientY; dx = 0; swiping = true; swiped = false;
    stop();
  });
  root.addEventListener('pointermove', e => {
    if (!swiping) return;
    dx = e.clientX - sx;
    const dy = Math.abs(e.clientY - sy);
    if (Math.abs(dx) > 14 && Math.abs(dx) > dy * 1.4) swiped = true;
  });
  root.addEventListener('pointerup', () => {
    if (swiped && Math.abs(dx) > 50) { dx < 0 ? go(i+1) : go(i-1); }
    swiping = false; start();
  });
  root.addEventListener('pointercancel', () => { swiping = false; start(); });
  root.addEventListener('click', e => {
    if (swiped) { e.preventDefault(); e.stopPropagation(); swiped = false; }
  }, true);
}
```

CSS for Popular Now's track:

```css
.popular-track { display: flex; transition: transform .6s cubic-bezier(.45,.05,.55,.95); will-change: transform; }
.popular-slide { flex: 0 0 100%; … }
```

**No `touch-action` is set on the Popular Now root or track.** Yet it works. Mine has `touch-action: pan-y` on the track and doesn't work.

---

## DOM structure of one product card (post-render)

```html
<div class="card">
  <a href="product.html?product=…" class="card-link">
    <div class="card-img" data-img-count="3">
      <div class="card-img-track">
        <img src="…1.jpg">
        <img src="…2.jpg">
        <img src="…3.jpg">
      </div>
      <span class="badge">New</span>           <!-- optional -->
      <div class="card-img-dots" aria-hidden="true">
        <span class="active"></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </a>
  <div class="card-info">
    <a href="…" class="card-info-text">
      <div class="card-name">…</div>
      <div class="card-name-ar">…</div>
      <div class="card-price">…</div>
    </a>
    <button class="card-bag" aria-label="Add to bag" onclick="addToCart(…)">…</button>
  </div>
</div>
```

Note: `.card-img` is wrapped in `<a class="card-link" href="…">`. The Popular Now structure also wraps its slides in `<a class="popular-slide" href="…">` — but the pointer handlers there are attached to the **carousel root** (an outer `<div class="popular-carousel" id="popularCarousel">` that sits OUTSIDE the `<a>`s). Mine attaches to `.card-img` which is INSIDE the `<a>`.

**Hypothesis we haven't yet tried:** the parent `<a class="card-link">` is intercepting / cancelling the pointer gesture before `pointermove` ever crosses the 14px threshold, because mobile browsers eagerly start link-tap tracking on touchstart inside an `<a>`. Popular Now sidesteps this because its pointer listener is on the ancestor `<div>` outside the `<a>`s.

---

## What we ruled out

- ✅ Data: `imgs.length >= 3` confirmed by user (all products have minimum 3 images uploaded)
- ✅ Render path: `<body data-cards="v2">` is set; override is wired via DOMContentLoaded; rerender watchdog at 5 timepoints
- ✅ CSS: track gets `display:flex` (after specificity fix); imgs lay side-by-side; `touch-action: pan-y` on track
- ✅ Handler attached: `_swipeInited` flag prevents double-binding; `data-img-count` confirms count is on the element
- ✅ Pointer events vs touch events: switched to pointer events to match Popular Now

---

## Question

Given:
- The Popular Now carousel works with pointer events attached to a `<div>` **outside** the `<a>` slides
- The card swipe attaches pointer events to `.card-img` which is **inside** an `<a class="card-link" href="…">`
- Both have `display:flex` tracks with `flex: 0 0 100%` children and `translateX(-N00%)` to advance
- Both run on the same page on the same Chrome Android device

**Is the parent `<a>` the actual culprit?** Specifically: does an anchor element with `href` swallow pointer gestures on Chrome Android in a way a non-anchor wrapper doesn't — even when `pointer-events: none` is set on the child `<img>` and `touch-action: pan-y` is set on the track?

If yes, what's the best fix?
- (a) Move the `<a>` from wrapping `.card-img` to wrapping `.card-info` only, and use a JS click handler on `.card-img` to navigate on tap (without drag)?
- (b) Wrap `.card-img` in a non-anchor `<div>` and put the pointer handlers on it; keep PDP navigation on tap via JS?
- (c) Something else — `pointerdown` with `setPointerCapture` to claim the gesture before the `<a>` can react?
- (d) Use `e.stopPropagation()` on pointerdown to stop the event before it reaches the `<a>`?

Or is there another mechanism I'm missing? Open to anything.
