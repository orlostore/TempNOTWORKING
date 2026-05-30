# ORLO REEL — UPDATED SPEC (v3.3 — pre-render checks + tighter price vignette, May 2026)

You are building a vertical reel/TikTok video for ORLO Store. This spec OVERRIDES anything from prior conversations. Follow exactly.

## Locked technicals
- 1080 × 1920, 30fps, 16s, H.264, CRF 18, AAC 192k, +faststart MP4
- Audio: trim to 16s, volume 0.7, 1.5s fade-out at 14.5s
- **Render frames at 2160 × 3840 (2×) then downsample to 1080 × 1920 with PIL `Image.LANCZOS`.** Non-negotiable — produces crisp type. JPEG quality 95 for frame export.

## Pre-render verification — NON-NEGOTIABLE (added v3.3)
Before exporting a single frame, verify these. If any check fails, **STOP and report back to the project owner before rendering** — do not silently work around it.

1. **Aspect ratio:** the output MUST be **native 1080 × 1920 (9:16)** edge-to-edge. **Letterboxing is forbidden** — no black bars top/bottom, no padding, no 16:9 source stretched into 9:16. If your source assets are 16:9, ASK for 9:16 versions; do not letterbox.
2. **Logo file:** the ORLO logo must be the **real official logo file** supplied by the project owner (navy organic blob + coral textured dot + cream "ORLO" wordmark). If the logo file is not in the brief package, **STOP and ask for it**. Do NOT:
   - Generate a logo from scratch.
   - Use a placeholder or stand-in logo.
   - Use an AI-rendered approximation of the logo.
   - Recolour, restyle, redraw, or modify the supplied logo in any way.
   Any reel rendered without the real official logo file is rejected on sight.
3. **Source product photo:** verify it is the actual product hero / lifestyle shot supplied by the project owner. If missing, ask before rendering.

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
- **End-card size:** 340 × 340 px, centred horizontally, y ≈ 220
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

## End card — REDESIGNED (v3 — fewer oranges, price reworked)
Cream `#F8F6F2` background, stacked top to bottom:

1. **ORLO logo** — 340 × 340 px, centred, y ≈ 220
2. **EN tagline** — "QUALITY IS A CLICK AWAY" — DM Sans 500, 44pt, **navy** `#1A3A52`, letter-spaced 5 px
3. **Coral divider** — 140 × 3 px, centred under the EN tagline (the only "loud" coral element above the pill)
4. **AR tagline** — "الجودة على بُعد نقرة" — Almarai **700** (was 800), 54pt, **navy** (was coral — reduce coral count)
5. **PRICE — REWORKED:** "AED 119" — **Cormorant Garamond italic 500**, 64pt, **navy**. Editorial price treatment, not a chunky marketing badge. Centred. Sits in the visual centre.
6. **SHOP NOW pill — REFINED:** navy `#1A3A52` rounded pill, **760 × 120 px** (was 720 × 110), border-radius 60. **1 px coral border** at `rgba(231,111,81,0.4)`. Inside, with generous internal padding:
   - "SHOP NOW" — DM Sans 800, 44pt, coral, **letter-spaced 0.18em**
   - Separator dot — cream, **70% opacity** (was 100%)
   - "تسوّق الآن" — Almarai 800, 44pt, coral
   - For UNRELEASED products only: text becomes "COMING SOON · قريباً" (same pill, same colours)
   - This is the ONE big coral moment on the end card — the visual focal point.
7. **URL** — "orlostore.com" — DM Sans 700, 36pt (was 44pt), **navy** (was coral — reduce coral count). Sits just below the pill.
8. **Trust badges row** at y ≈ H – 340, three columns: truck / lock / UAE flag, coral circle outlines at **40% opacity** (was 100% — recedes into footer), custom PIL-drawn pictograms (NEVER letter placeholders), EN labels (DM Sans 500, 32pt, navy), AR labels (Almarai 700, 30pt, grey `#A0A5AA`).

**Coral budget on end card (v3):** logo dot + coral divider + SHOP NOW pill text + tiny trust circles. **Three loud coral moments, not seven.** The SHOP NOW pill is the obvious focal point.

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
