# ORLO REEL — UPDATED SPEC (v2 elevation — May 2026)

You are building a vertical reel/TikTok video for ORLO Store. This spec OVERRIDES anything from prior conversations. Follow exactly.

## Locked technicals
- 1080 × 1920, 30fps, 16s, H.264, CRF 18, AAC 192k, +faststart MP4
- Audio: trim to 16s, volume 0.7, 1.5s fade-out at 14.5s
- Render frames at 2160 × 3840 (2×) then downsample to 1080 × 1920 with PIL Image.LANCZOS. This is non-negotiable — produces crisp type. JPEG quality 95 for frame export.

## Palette (use exactly)
- Cream bg: #F8F6F2
- Navy: #1A3A52
- Coral: #E76F51
- Grey (Arabic secondary): #A0A5AA

## Fonts (no substitutes)
- English headlines + product names: Cormorant Garamond ITALIC, weight 400 (NOT 300 — 300 breaks at downsample)
- English system text (taglines, CTAs, URL, badges): DM Sans 500/700/800
- Arabic everything: Almarai 400/700/800 — ONLY Almarai, never Noto Kufi, never Tajawal
- Render Arabic with raw strings + Almarai directly. DO NOT use arabic_reshaper + python-bidi (it reverses letters).
- Use Arabic comma ، not Latin mid-dot · in Arabic strings.

## Logo
- File: the standard ORLO logo (navy organic blob + coral textured dot + cream "ORLO" wordmark). No UAE flag in the lockup. No tagline baked into the logo.
- Intro: 360 × 360 px, centred, y ≈ 760
- Corner-parked (scenes 2.0–14.0s): 125 × 125 px, anchored 50 px from top-left, 100% opacity, ROCK-SOLID throughout
- End card: 340 × 340 px, centred, y ≈ 220
- NEVER make white pixels transparent — only multiply the alpha channel if applying opacity

## Coral accent line — UPDATED (was wrong before)
- 60 × 3 px coral (#E76F51) sits DIRECTLY BELOW the corner-parked logo at top-left, ~10 px below, left-aligned with logo's left edge
- It's a persistent brand signature on every scene
- NEVER under headline text, NEVER under product, NEVER under price

## Scene headlines — UPDATED (was too big, was blurry)
- English: Cormorant Garamond italic 400, 72–80pt, navy, line-height 1.15
- Arabic: Almarai 700, 60–66pt, navy, line-height 1.4
- MAX 2 lines. If copy needs 3, shorten the copy.
- Position: upper-left, x ≈ 60, y ≈ 240, left-aligned, max-width 880px
- NO text-shadow, NO drop-shadow, NO glow on type. If contrast is weak against image, soften the IMAGE with a subtle radial vignette behind text — not the type.

## End card — REDESIGNED (was missing price + CTA)
Cream #F8F6F2 background, stacked top to bottom:
1. ORLO logo, 340 × 340 px, centred, y ≈ 220
2. "QUALITY IS A CLICK AWAY" — DM Sans 500, 44pt, navy, 5px tracked
3. 140 × 3 px coral divider, centred
4. "الجودة على بُعد نقرة" — Almarai 800, 54pt, coral
5. **PRICE (MANDATORY):** "AED 84" (or actual price) — coral, DM Sans 800, 92pt, centred. Sits in lower-half visual centre.
6. **SHOP NOW PILL (MANDATORY):** navy #1A3A52 rounded pill, 720 × 110 px, border-radius 55. Inside: "SHOP NOW" (DM Sans 800, 44pt, coral) · separator dot (cream) · "تسوّق الآن" (Almarai 800, 44pt, coral). For UNRELEASED products only: text becomes "COMING SOON · قريباً" (same pill).
7. "orlostore.com" — DM Sans 700, 44pt, coral. Just below the pill.
8. Trust badges row at y ≈ H – 340, three columns: truck / lock / UAE flag, coral circle outlines (radius 44, stroke 4), custom PIL-drawn pictograms (NEVER letter placeholders), EN labels (DM Sans 500, 32pt, navy), AR labels (Almarai 700, 30pt, grey #A0A5AA).

## Timeline
- 0.0–1.5s: Logo intro (centered fade-in + coral divider draws under it)
- 1.5–2.0s: Logo shrinks to top-left corner park
- 2.0–14.0s: Main scene with product. Headline + Arabic translation appears. Coral accent under corner logo. **NO price during scenes** — price lives only on end card.
- 14.0–16.0s: End card

## Visual rules (LOCKED)
- Hard cuts only — no crossfades
- Logo rock-solid throughout at 100% opacity
- Bilingual everywhere: every EN headline gets an AR line directly below, same beat, same screen time
- Pacing: 15–16s. Don't overstuff.
- Pure black silhouettes for any tease/reveal effects (no grey, no transparency tricks)

## What I'm sending with this brief
- Product image (clean PNG, ideally with transparent or beige bg)
- Audio MP3
- Whether released or unreleased
- Concept note (or ask you to suggest)

DO NOT start rendering until I confirm the concept. Then render all 480 frames in one go.
