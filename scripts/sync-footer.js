#!/usr/bin/env node
/* sync-footer.js — propagate the canonical Customer Enquiries footer to all customer-facing pages.
 *
 * Reads _footer-canonical.html (single source of truth) and writes it into each target page
 * between the ORLO FOOTER markers. On the first run for a page (no markers yet), it detects
 * the legacy footer block and replaces that. Idempotent — running it twice in a row makes no
 * further changes.
 *
 * First-run seed handles two legacy shapes:
 *   1. Pattern B (12/14 pages): <section class="cs-footer-section">…</section>
 *   2. Pattern A (cart.html):   <div class="cs-section">…</div> + <nav class="legal-footer">…</nav> + <div class="legal-copyright">…</div>
 *
 * terms-and-conditions.html was seeded by hand (nested div balance is not regex-safe).
 */
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');
const CANONICAL = fs.readFileSync(path.join(REPO, '_footer-canonical.html'), 'utf8').trimEnd();
const START_MARKER = '<!-- ═══ ORLO FOOTER';
const END_MARKER = '<!-- ═══ /ORLO FOOTER ═══ -->';

const TARGETS = [
  'index.html',
  'product.html', 'product1.html',
  'cart.html',
  'account.html',
  'login.html', 'signup.html',
  'forgot-password.html', 'reset-password.html', 'verify-email.html',
  'success.html', 'cancel.html', 'track.html',
  'terms-and-conditions.html',
];

let updated = 0, unchanged = 0, skipped = 0;

TARGETS.forEach(file => {
  const fp = path.join(REPO, file);
  if (!fs.existsSync(fp)) { console.log('  SKIP (missing): ' + file); skipped++; return; }
  const original = fs.readFileSync(fp, 'utf8');
  let next;

  const sIdx = original.indexOf(START_MARKER);
  const eIdx = original.indexOf(END_MARKER);
  if (sIdx !== -1 && eIdx !== -1 && eIdx > sIdx) {
    // Markers exist — replace between them.
    next = original.slice(0, sIdx) + CANONICAL + original.slice(eIdx + END_MARKER.length);
  } else {
    // First-run seed: try Pattern B (cs-footer-section) first, then the cart-style legacy shape.
    const patB = /<section class="cs-footer-section">[\s\S]*?<\/section>/;
    // cart.html legacy — cs-section block + sibling legal-footer nav + legal-copyright div, with comments between.
    const patA_cart = /<div class="cs-section">[\s\S]*?<\/div>\s*(?:<!--[^>]*-->\s*)?<nav class="legal-footer">[\s\S]*?<\/nav>\s*<div class="legal-copyright">[\s\S]*?<\/div>/;

    if (patB.test(original))           next = original.replace(patB, CANONICAL);
    else if (patA_cart.test(original)) next = original.replace(patA_cart, CANONICAL);
    else {
      console.log('  SKIP (no footer found): ' + file);
      skipped++;
      return;
    }
  }

  if (next === original) { console.log('  unchanged: ' + file); unchanged++; return; }
  fs.writeFileSync(fp, next);
  console.log('  ✓ updated: ' + file);
  updated++;
});

console.log('\nDone. ' + updated + ' updated, ' + unchanged + ' unchanged, ' + skipped + ' skipped.');
