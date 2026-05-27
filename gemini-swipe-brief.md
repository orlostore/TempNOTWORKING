# Help debugging: in-card horizontal swipe carousel on a Cloudflare Pages site

## Goal
On the homepage (`orlostore.com`), each product card on mobile should let the user **swipe horizontally** between the product's images, with **tiny dots** indicating position (Hermès / Aesop convention). Tap (no drag) navigates to the PDP as before. Vertical scroll passes through.

## Stack
- Cloudflare Pages + Cloudflare Functions (D1, R2)
- Plain vanilla JS, no React/Vue
- `body[data-cards="v2"]` on the homepage triggers a custom `window.renderProducts` override that paints product cards into `#productsGrid`
- Each product object from `/api/products` has `p.image` (string) and `p.images` (array of all URLs)

## What I built

In `index.html`, inside the `window.renderProducts` override:

```js
// Collect images
var imgs = [];
if (Array.isArray(p.images) && p.images.length > 0) {
  imgs = p.images.filter(function(s){ return s && typeof s === 'string' && s.indexOf('http') === 0; });
} else if (p.image && p.image.indexOf('http') === 0) {
  imgs = [p.image];
}

var imgsHTML = imgs.map(function(src, idx){
  var cdnSrc = 'https://res.cloudinary.com/.../fetch/.../' + esc(src);
  var attrs = idx === 0 ? 'fetchpriority="high"' : 'loading="lazy"';
  return '<img src="'+cdnSrc+'" ... '+attrs+'>';
}).join('');

var imgHTML = '<div class="card-img-track">'+imgsHTML+'</div>';
var dotsHTML = imgs.length > 1
  ? '<div class="card-img-dots">' + imgs.map(function(_,idx){
      return '<span class="' + (idx === 0 ? 'active' : '') + '"></span>';
    }).join('') + '</div>'
  : '';

// In the card template:
'<a href="..." class="card-link"><div class="card-img" data-img-count="'+imgs.length+'">'+imgHTML+badge+dotsHTML+'</div></a>'
```

After `grid.innerHTML = ...`, I call `initCardSwipe(grid)`:

```js
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
    var startX = 0, startY = 0, dx = 0, dy = 0, swiping = false, swiped = false;

    function go(n){
      index = Math.max(0, Math.min(count - 1, n));
      track.style.transition = 'transform .35s ease';
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      dots.forEach(function(d, i){ d.classList.toggle('active', i === index); });
    }

    cardImg.addEventListener('touchstart', function(e){
      var t = e.touches[0];
      startX = t.clientX; startY = t.clientY; dx = 0; dy = 0;
      swiping = true; swiped = false;
    }, {passive:true});
    cardImg.addEventListener('touchmove', function(e){
      if (!swiping) return;
      var t = e.touches[0];
      dx = t.clientX - startX;
      dy = Math.abs(t.clientY - startY);
      if (Math.abs(dx) > 14 && Math.abs(dx) > dy * 1.4) swiped = true;
    }, {passive:true});
    cardImg.addEventListener('touchend', function(){
      swiping = false;
      if (!swiped) return;
      if (Math.abs(dx) > 50) go(dx < 0 ? index+1 : index-1);
    });

    if (link) {
      link.addEventListener('click', function(ev){
        if (swiped) { ev.preventDefault(); ev.stopPropagation(); swiped = false; }
      }, true);
    }
  });
}
```

CSS (in `index.html`):

```css
body[data-cards="v2"] .card-img { position: relative; overflow: hidden; }
body[data-cards="v2"] .card-img-track { display: flex; width: 100%; will-change: transform; touch-action: pan-y; }
body[data-cards="v2"] .card-img-track img { flex: 0 0 100%; width: 100%; height: 100%; object-fit: cover; display: block; }
body[data-cards="v2"] .card-img-dots { position: absolute; bottom: 10px; left: 0; right: 0; display: flex; justify-content: center; gap: 6px; pointer-events: none; z-index: 3; }
body[data-cards="v2"] .card-img-dots span { width: 5px; height: 5px; border-radius: 50%; background: rgba(26,58,82,0.30); }
body[data-cards="v2"] .card-img-dots span.active { background: #1a3a52; width: 16px; border-radius: 3px; }
@media (hover: hover) {
  body[data-cards="v2"] .card-img-dots { display: none; }
}
```

There's also a pre-existing rule in `styles.css`:

```css
.card-img { position: relative; width: 100%; aspect-ratio: 1/1; overflow: hidden; background: transparent; padding: 0; display: block; }
.card-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
```

## Symptom
User reports "still not there" — swipe doesn't appear to work on the homepage. Possibilities I haven't ruled out:
1. Dots are visible but swipe isn't responding to touch
2. Dots aren't appearing (would suggest `imgs.length` is always 1 — meaning the products in the DB don't have multiple images uploaded)
3. Dots appear but the image doesn't visually change when swiping (would suggest the CSS transform isn't working — track height issue, flex layout issue)

## What I've already checked
- `p.images` IS the correct property name (verified in `functions/api/products.js` line 158: `images: [row.mainImage, row.image2, row.image3, ..., row.image8].filter(Boolean)`)
- No `touch-action: none` blocking
- No `.card-img > div` rule overriding the track
- Function is declared before being called (hoisted)
- Browser hard refresh done

## What I might be missing
- `.card-img-track` has no explicit `height` — could `<img>` children's `height:100%` collapse to 0 with `display: flex` row + no explicit container height?
- The pre-existing `.card-img img` rule (specificity 0,1,1) vs my `.card-img-track img` rule (specificity 0,2,1) — mine should win, but could the cascading affect anything?
- Browser-specific behavior on Chrome mobile Android (the user is on Xiaomi)
- The `<a class="card-link">` wrapping might intercept touch events before they reach `.card-img`?
- Cloudflare Pages might still be serving cached HTML

## Ask
Given the code above, what would you check first to figure out which of the three failure modes is happening? Any obvious bug I'm missing in the HTML/CSS/JS structure? Any Chrome-Android mobile-specific gotcha that breaks horizontal touch swipe inside an `<a>` tag?
