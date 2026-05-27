# ORLO REEL — UPDATED SPEC (v3 elevation — May 2026)

You are building a vertical reel/TikTok video for ORLO Store. This spec OVERRIDES anything from prior conversations. Follow exactly.

## Locked technicals
- 1080 × 1920, 30fps, 16s, H.264, CRF 18, AAC 192k, +faststart MP4
- Audio: trim to 16s, volume 0.7, 1.5s fade-out at 14.5s
- **Render frames at 2160 × 3840 (2×) then downsample to 1080 × 1920 with PIL `Image.LANCZOS`.** Non-negotiable — produces crisp type. JPEG quality 95 for frame export.

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

## Coral accent line — TWO places, different rules
- **INTRO (0.0–1.5s):** coral divider 140 × 3 px, **CENTRED HORIZONTALLY** below the centered intro logo. Centered. Not left-aligned.
- **CORNER-PARKED (scenes 2.0–14.0s):** coral mini-line 60 × 3 px, **LEFT-ALIGNED with the corner logo's left edge**, ~10 px below the 125×125 logo. Brand signature on every scene.
- These are different. Don't confuse them.

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
- 10.0–14.0s: Optional second beat or product detail close-up
- 14.0–16.0s: End card (v3 layout above)

## Visual rules (LOCKED)
- Hard cuts only — no crossfades between scenes
- Logo rock-solid throughout at 100% opacity once parked
- **NO price during scenes** — price lives only on end card
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

## v3 changelog vs v2
- Cormorant italic weight **300 → 500** (was breaking at downsample, looked thin vs Arabic)
- Almarai scene headlines: 700 **@ 88% opacity** (was 700 at 100% — too bold vs italic English)
- EN+AR cadence: stacked → **sequential beats**
- Intro coral line: explicitly **CENTERED** under intro logo (was left-aligned by mistake)
- Price: DM Sans 800 92pt coral → **Cormorant italic 500 64pt navy** (editorial, not marketing)
- AR tagline on end card: 800 coral → **700 navy** (reduce coral, balance weight)
- URL on end card: coral 44pt → **navy 36pt** (reduce coral, hierarchy)
- Trust badges: 100% coral circles → **40% opacity** (recedes, no longer competing)
- SHOP NOW pill: 720×110 → **760×120**, added **1px coral border**, separator dot **70% opacity**, "SHOP NOW" gains **0.18em tracking**
- Total coral elements on end card: **7 → 3** (logo dot, divider, SHOP NOW pill) — Hermès register, one focal point not seven
