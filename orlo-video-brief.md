# ORLO REEL — UPDATED SPEC (v3.4 — end card generalized & calmed, May 2026)

You are building a vertical reel/TikTok video for ORLO Store. This spec OVERRIDES anything from prior conversations. Follow exactly.

## Locked technicals
- 1080 × 1920, 30fps, 16s, H.264, CRF 18, AAC 192k, +faststart MP4
- Audio: trim to 16s, volume 0.7, 1.5s fade-out at 14.5s
- **Render frames at 2160 × 3840 (2×) then downsample to 1080 × 1920 with PIL `Image.LANCZOS`.** Non-negotiable — produces crisp type. JPEG quality 95 for frame export.

## Required inputs — ASK FOR ALL OF THESE BEFORE RENDERING ANYTHING
Before producing a single frame, you must explicitly confirm the following with the project owner. If ANY item is missing or ambiguous, **STOP and ask** — do not guess, do not nickname, do not substitute. Treat this as a handshake: read the list back to the owner and wait for confirmation on each line.

1. **Exact product name (English).** Use the name as registered in the admin panel (e.g. "Vintage Dusty Pink Vespa"). Do NOT shorten, abbreviate, or invent a nickname like "Mini Vespa", "Pink Vespa", "Vintage Vespa". Ask: *"Confirm the exact product name as it appears on the website."*
2. **Exact product name (Arabic).** Required for the AR cadence in scenes 6.0–10.0s. Ask: *"Confirm the exact Arabic product name."*
3. **Current price in AED.** Required for both the 10–14s price-reveal beat AND the end-card price line. Ask: *"What is the current AED price to display?"* (Do not assume — prices change.)
4. **Clean catalogue square image** (1:1, warm beige #E5DCCF, product alone, no props). This is REQUIRED for the end card hero. Ask: *"Provide the clean catalogue square image — the end card cannot use the lifestyle / scene photo."* If only a lifestyle shot exists, STOP and request the clean version be generated via the admin's "Clean Catalogue Prompt" first.
5. **Source product photo(s) for the reel scenes** (2.0–14.0s). These can be lifestyle / scene / detail shots — different from the end-card hero. Ask: *"Which source photos should appear in scenes 2–14s?"*
6. **English scene headline copy** for scenes 2.0–6.0s. Cormorant italic 500, 72–80pt. Max 2 lines. Ask: *"Provide the English headline."*
7. **Arabic scene headline copy** for scenes 6.0–10.0s. Almarai 700 at 88% opacity. Max 2 lines. Ask: *"Provide the Arabic headline."*
8. **Official ORLO logo file** (navy organic blob + coral textured dot + cream "ORLO" wordmark). If not in the brief package, STOP and ask. Do NOT generate, redraw, recolour, or substitute. Ask: *"Confirm the official logo file is in the asset package."*
9. **Aspect ratio:** explicit confirmation that the output will be native 1080 × 1920 (9:16), edge to edge, no letterboxing. Ask: *"Confirm output is native 9:16, no letterboxing."*
10. **Any product-specific notes** — colour variant, collection name, special tag (NEW, Handmade), pairing context. Ask: *"Any product-specific notes I should know about?"*

Only after ALL ten items are confirmed in writing should rendering begin. If any item is missing mid-render, STOP and report back — do not silently work around it.

## Pre-render verification — final checks before exporting
After the inputs above are confirmed and rendering is underway, verify these last technical checks before exporting frames. If any fails, STOP.

1. **Aspect ratio confirmed:** native 1080 × 1920 (9:16) edge-to-edge. Letterboxing is forbidden — no black bars top/bottom, no padding, no 16:9 source stretched into 9:16.
2. **Logo file confirmed:** the real official ORLO logo file is in use — no AI-generated stand-ins, no placeholders, no recoloured / restyled versions. Any reel rendered without the real official logo is rejected on sight.
3. **Source product photo confirmed:** the actual supplied product hero / lifestyle photo is in use — no generated stand-ins.
4. **End-card hero confirmed:** the clean catalogue square (not the lifestyle scene) is in the end-card hero slot.
5. **Product name confirmed:** the EXACT admin-registered name is in the end-card name line — not a nickname or shortened form.

## Palette (use exactly)
- Cream bg: `#F8F6F2`
- Navy: `#1A3A52`
- Coral: `#E76F51`
- Grey (Arabic secondary on trust badges): `#A0A5AA`

## Fonts (no substitutes)
- **English headlines + product names:** Cormorant Garamond **ITALIC, weight 500** (NOT 300, NOT 400 — 500 has the body to balance Almarai 700 visually and won't break at downsample)
- **English system text** (taglines, CTAs, URL, badges): DM Sans 500/700/800
- **Arabic everything:** Almarai 400/700/800 — ONLY Almarai, never Noto Kufi, never Tajawal
- Render Arabic with raw strings + Almarai directly. DO NOT use `arabic_reshaper` + `python-bidi` (it reverses letters).
- Use Arabic comma `،` not Latin mid-dot `·` in Arabic strings.

## Logo
- File: the standard ORLO logo (navy organic blob + coral textured dot + cream "ORLO" wordmark). No UAE flag in the lockup. No tagline baked into the logo.
- **Intro size:** 360 × 360 px, centred, y ≈ 760
- **Corner-parked size** (scenes 2.0–14.0s): 125 × 125 px, anchored 50 px from top-left, 100% opacity, ROCK-SOLID throughout
- **End-card mark:** horizontal lock-up — badge (90 × 90) · 1px hairline divider (height 60, navy 25% opacity) · upright Cormorant Garamond wordmark "ORL[O]" (NOT italic). See End Card section for full lock-up spec.
- NEVER make white pixels transparent — only multiply the alpha channel if applying opacity

## Coral accent line — TWO places, same alignment rule (both CENTERED under their logo)
- **INTRO (0.0–1.5s):** coral divider 140 × 3 px, **CENTRED HORIZONTALLY** below the centered intro logo (centered with the logo's visual centre).
- **CORNER-PARKED (scenes 2.0–14.0s):** coral mini-line 60 × 3 px, **CENTERED UNDER the corner logo** (centered with the 125×125 logo's visual centre, ~x=113 in 1080-wide output coords), ~10 px below the logo. Persistent brand signature on every scene.
- Both lines are centered relative to their logo. Don't left-align either one.

## Scene headlines — typography (LOCKED v3)
- **English:** Cormorant Garamond italic, **weight 500**, 72–80pt, navy `#1A3A52`, line-height 1.15
- **Arabic:** Almarai 700 **at 88% opacity** (softens the bold so it balances the italic English visually), 60–66pt, navy, line-height 1.4
- **MAX 2 lines.** If your copy needs 3, shorten the copy.
- **Position:** upper-left, x ≈ 60, y ≈ 240, left-aligned, max-width 880px
- **NO text-shadow, NO drop-shadow, NO glow on type.** If contrast is weak against the image, soften the IMAGE with a subtle radial vignette behind the text — never blur the type.

## Bilingual cadence — SEQUENTIAL, not stacked
- **DO NOT stack EN + AR on the same frame** at headline sizes. Four big lines = wall of text.
- **Sequential beats:** EN appears alone for ~3 seconds, hard cut to AR alone for ~3 seconds. Same scene, same product, language swaps in the headline area.
- Both languages get their own breathing room.

## End card — LOCKED v3.4 (generalized, calmed, English-only)
A single locked frame that works for **every product reel**. Only three variables change per video — everything else stays drawn as below.

**Frame:** 1080 × 1920, background cream `#F8F6F2`. All bands measured against the 1080-wide source.

**Per-video variables (3 only):**
- Hero product photo
- Product name (1–2 words)
- Price

**Locked elements, top to bottom:**

1. **ORLO lock-up** — y ≈ 160 to 250, centred. Composite mark, three parts in a horizontal row:
   - Badge — the official ORLO PNG, **90 × 90 px**, transparent background
   - Hairline divider — **1 × 60 px**, navy `#1A3A52` at **25% opacity**, ~22 px gap each side
   - Wordmark — "ORL[O]" — **upright Cormorant Garamond 500, 38pt**, letter-spacing 0.16em. The final "O" is coral `#E76F51`; "ORL" is navy `#1A3A52`. **Not italic.**

2. **Product hero** — y ≈ 350 to 1140, 720 × 720 max, centred on cream. **MUST be the clean catalogue square** (warm beige #E5DCCF background, product alone, no props) — output from the admin "Clean Catalogue Prompt". NEVER the lifestyle catalogue / scene shot — the reel scenes already gave the lifestyle context; the end card is the commercial close where product clarity wins. If the clean catalogue square is missing for a product, STOP and ask before rendering.

3. **Product name** — y ≈ 1200, centred. **Cormorant Garamond italic 500, 54pt, navy.** Use the EXACT product name from the admin (e.g. "Vintage Dusty Pink Vespa"), not a nickname or shortened form like "Mini Vespa". 1–4 words.

4. **Price** — y ≈ 1300, centred. **DM Sans 500, 38pt, navy**, letter-spacing 0.02em. Format "AED 119".

5. **Hairline divider** — y ≈ 1420, 120 × 1 px, centred, navy at **20% opacity**. Ties name + price into a single block, separates from the CTA.

6. **Shop Now pill** — y ≈ 1485 to 1545, centred. **Explicit dimensions: 320 × 56 px** (not "auto-size to text"). Navy `#1A3A52` solid fill, no border, border-radius 28 px (or 999 — equivalent at this size). Inside: **"Shop Now"** in DM Sans 500, 28pt, cream `#F8F6F2`, letter-spacing 0.04em, vertically and horizontally centred. **English only inside the pill.** No Arabic, no separator dot.

7. **URL** — "orlostore.com" — y ≈ 1675, DM Sans 400, 26pt, `#6B7780` soft grey, letter-spacing 0.02em.

8. **Handle** — "@orlostore" — y ≈ 1750, DM Sans 400, 23pt, `#9AA5AA` lighter grey, letter-spacing 0.02em. Passive follow signal — never an explicit "Follow us" prompt.

**What's NOT on the end card:**
- No EN or AR tagline
- No trust badges (free delivery / lock / UAE flag) — those live on the PDP, cart, and site footer, not on a 2-second closing frame
- No "Follow us" copy — handle does the work passively
- No urgency chrome (no FREE delivery, no countdown, no strikethrough, no star rating) — opposite of the ORLO register
- No coral border on the pill, no coral divider, no Arabic anywhere on the end card

**Coral budget on end card (v3.4):** exactly **one** — the final "O" in the wordmark. Pill is solid navy, name and price are navy. The single coral note is the brand signature, not a focal point. Hero product is the focal point.

**Mockup reference:** `/end-card-mockup.html` in the repo. The Sample C frame (reduced) is the locked v3.4 layout.

## Timeline
- 0.0–1.5s: Logo intro (centered fade-in + CENTERED coral divider draws under it)
- 1.5–2.0s: Logo shrinks to top-left corner park; coral mini-line appears left-aligned under it
- 2.0–6.0s: Main scene, EN headline (Cormorant italic 500, 72–80pt navy, upper-left, max 2 lines)
- 6.0–10.0s: Same scene continues, headline swaps to AR (Almarai 700 @ 88% opacity, 60–66pt navy)
- **10.0–14.0s: Price-reveal beat (also the IG/TikTok cover-pick window). See section below.**
- 14.0–16.0s: End card (v3 layout above)

## Price-reveal beat — 10.0–14.0s (NEW in v3.1)
This beat exists so the still-frame **cover** that IG and TikTok show on the feed includes the price. Without it, viewers scroll past without ever seeing what the product costs.

- Headline area is **cleared** — no EN, no AR text. Let the product breathe.
- Product is shown clean (same scene continuing, or a close-up — your choice per concept).
- **Price element appears at frame 10.0s** and holds steady until 14.0s.

**Price treatment (LOCKED — Hermès register, NOT a marketing badge):**
- **Coral hairline divider** — 80 × 2 px, coral `#E76F51`, centred horizontally on the price column.
- **Price text** — "AED 119" — **Cormorant Garamond italic 500, 80pt, navy `#1A3A52` at 100% opacity**. Centred under the hairline. The numerals appear directly — no brackets, no quotes, no currency badge box.
- **NO Arabic price echo.** AED is universally understood in UAE — adding "د.إ ١١٩" creates redundant overlay text and breaks the editorial Hermès register. The English price alone, in Cormorant italic, IS the price treatment.
- **Vertical placement**: price column centred horizontally, vertical centre at y ≈ 1400 (lower-third of frame so the product still has the upper two-thirds for the hero shot).
- **No background, no card, no shadow, no border on the type itself.** The price sits naked on the scene like a printed magazine price tag.
- **Background legibility — REQUIRED for warm / wood / light-beige scenes (tightened v3.3):** if the scene behind the price column lacks contrast against navy type (typical for wood-top, beige-wall, brass-prop, cream-on-cream compositions), apply a **cream `#F8F6F2` radial vignette at 55–60% opacity, ~700px radius, soft falloff**, centred on the price column. v3.2 specified 30% / 500px — real-world output showed the price still getting lost on warm/wood scenes with brass or fabric props sitting under the price column. The bumped numbers soften a larger zone of the scene without touching the type.
- **Avoid the price column landing on busy props.** If a prop (binoculars, books, brass instrument, knot of fabric) sits at y ≈ 1400 directly under where the price will render, **shift the price up by ~150–200px** so the digits float over a calmer area of the scene. The lower-third placement is a default, not a rule — readability wins.
- Soften the SCENE behind the price — NEVER apply text-shadow, drop-shadow, or glow on the type itself. The price stays solid Cormorant italic; the vignette gives it a subtle cream halo so the navy reads cleanly at thumbnail scale. This stays consistent with the global "never blur type" rule.

**Cover-pick guidance for IG / TikTok upload:**
- IG: when uploading the Reel, set the cover frame to **~12.0s** (mid-price-reveal). The cover thumbnail on the feed will show product + price + corner-parked logo.
- TikTok: same — slide the cover picker to ~12.0s.
- This produces a single cover image where a passive scroller already knows: brand, product, price, and that it's bilingual.

## Visual rules (LOCKED)
- Hard cuts only — no crossfades between scenes
- Logo rock-solid throughout at 100% opacity once parked
- **Price appears ONLY in the 10–14s price-reveal beat and on the end card.** Never in the 2–10s headline beats.
- **NO CTA text during scenes** — CTA lives only in the end-card pill
- Bilingual SEQUENTIAL (see above) — never stacked at headline sizes
- Pacing: 15–16s. Don't overstuff.
- Pure black silhouettes for any tease/reveal effects (no grey, no transparency tricks)

## What to send with this brief
- Product image (clean PNG, ideally with transparent or beige bg)
- Product price (e.g. "AED 119")
- Concept brief (or ask Claude for ideas)
- Audio MP3
- Whether released or unreleased (decides SHOP NOW vs COMING SOON pill text)

DO NOT start rendering until the concept is confirmed. Render all 480 frames in one go.

---

## v3.4 changelog vs v3.3
- **End card fully redesigned and generalized.** A single locked frame that every reel reuses; only hero photo, product name, and price change per video. Mockup at `/end-card-mockup.html`.
- **Bilingual content removed from end card.** No EN tagline, no AR tagline, no Arabic inside the Shop Now pill. End card is English-only by design — the AR/EN cadence already happens earlier in the reel (scenes 2.0–10.0s); the close doesn't need to duplicate it. Cleaner, calmer, more like a Hermès or Aesop close.
- **Trust badges removed from end card.** Trust signals (free delivery, returns, secure checkout) live on the PDP, cart, and footer — not on a 2-second closing frame. Adding them on the end card splits attention with the Shop Now pill and dilutes both.
- **Logo at top is now the lock-up** (badge + 1px hairline + upright Cormorant wordmark with coral final O), reduced size 90×90 badge / 38pt wordmark. Was 340×340 badge alone. The lock-up matches the site header so the brand mark is consistent across surfaces.
- **Wordmark in the lock-up is UPRIGHT, not italic.** Cormorant Garamond italic is reserved for emotional beats (product name, headlines) — the wordmark itself stays upright to read as the brand signature.
- **Product name added** in the end-card body (Cormorant italic 500, 46pt) — replaces the EN/AR tagline pair. Names the thing the viewer just saw, signs off cleanly.
- **Price calmed:** 600/64pt → **500/32pt** in DM Sans. The big italic-Cormorant price treatment was for the 10–14s reveal beat (still in place there); on the end card it doesn't need to shout again. DM Sans 500 is quieter and pairs with the italic name above it.
- **Hairline divider added** between price and Shop Now pill (120×1, navy 20%). Visually groups name + price into a block.
- **Shop Now pill simplified:** solid navy fill, no coral border, cream text, English only, 24pt. Was 760×120 with 1px coral border and bilingual EN/AR coral text.
- **Handle added** below URL — "@orlostore", DM Sans 400, 23pt. Passive follow signal.
- **Footer text bumped for legibility:** URL 36pt → 26pt (wait — reduced because the old 36pt navy fought the pill; new 26pt soft-grey recedes correctly). Handle is also smaller and lighter than URL — clear hierarchy: pill > URL > handle.
- **Coral budget on end card: 1 element** (the wordmark's final O). Was 3+ in v3.

## v3.3 changelog vs v3.2
- **Added Pre-render verification block** — three explicit STOP-and-report-back checks before any rendering: (a) native 9:16 aspect ratio (no letterboxing), (b) real official ORLO logo file (no AI-generated stand-ins, no placeholders), (c) real source product photo. Triggered by a v3.2 reel that came back letterboxed AND with a placeholder-style logo — both should have been caught before frames were committed.
- **Price-reveal vignette bumped: 30% → 55–60% opacity, 500px → 700px radius.** Real-world output showed navy "AED 149" getting lost on a warm wood + brass-binocular scene with the v3.2 numbers. Larger and stronger vignette softens a bigger zone without violating the "never blur type" rule.
- **Price column position now defaultable, not fixed:** if a busy prop (binoculars, books, brass instrument, fabric knot) sits exactly under the price's y ≈ 1400 landing, shift the price up by 150–200px to a calmer area of the scene. Readability wins over rigid placement.

## v3.2 changelog vs v3.1
- **Arabic price echo REMOVED.** v3.1 said "optional but recommended"; v3.2 says explicitly DO NOT use. AED is universally understood in UAE; the Arabic line (د.إ ١١٩) created redundant overlay text and broke the editorial register. The English price alone, in Cormorant italic, IS the price treatment.
- **Price size bumped 72pt → 80pt.** Observed legibility issue on warm/wood scene backgrounds where 72pt navy was getting lost at thumbnail scale.
- **Price opacity locked at 100%** (was implicit, now explicit). No semi-transparency on the price text — it must be solid, pure navy.
- **Required cream radial vignette behind price on warm/wood/light backgrounds** — soften the SCENE, not the type. Keeps the "never blur type" rule intact while solving real-world contrast failures on wood-top / cream-wall product shots.

## v3.1 changelog vs v3
- **NEW: Price-reveal beat at 10–14s** with locked Hermès-register treatment (coral hairline + Cormorant italic 500 navy + optional Eastern-Arabic numeral echo). This is the IG/TikTok cover-pick window — viewer sees product + price on the feed thumbnail without playing the video.
- "NO price during scenes" rule relaxed to "NO price in the 2–10s headline beats" — price is now allowed (and required) in the 10–14s reveal.

## v3 changelog vs v2
- Cormorant italic weight **300 → 500** (was breaking at downsample, looked thin vs Arabic)
- Almarai scene headlines: 700 **@ 88% opacity** (was 700 at 100% — too bold vs italic English)
- EN+AR cadence: stacked → **sequential beats**
- Intro coral line: explicitly **CENTERED** under intro logo (was left-aligned by mistake)
- Corner-park coral line: **CENTERED** under corner logo (v3 originally said left-aligned — overridden, both lines now centered for visual consistency)
- Price: DM Sans 800 92pt coral → **Cormorant italic 500 64pt navy** (editorial, not marketing)
- AR tagline on end card: 800 coral → **700 navy** (reduce coral, balance weight)
- URL on end card: coral 44pt → **navy 36pt** (reduce coral, hierarchy)
- Trust badges: 100% coral circles → **40% opacity** (recedes, no longer competing)
- SHOP NOW pill: 720×110 → **760×120**, added **1px coral border**, separator dot **70% opacity**, "SHOP NOW" gains **0.18em tracking**
- Total coral elements on end card: **7 → 3** (logo dot, divider, SHOP NOW pill) — Hermès register, one focal point not seven
