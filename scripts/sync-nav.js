#!/usr/bin/env node
/* sync-nav.js — propagate the canonical bottom-nav block to all customer-facing pages.
 *
 * Reads _nav-canonical.html (single source of truth) and writes it into each target page
 * between the ORLO BOTTOM NAV markers. On the first run for a page (no markers yet), it
 * detects the legacy <nav class="mobile-bottom-nav">…</nav> block and replaces that.
 * Idempotent — running it twice in a row makes no further changes.
 */
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');
const CANONICAL = fs.readFileSync(path.join(REPO, '_nav-canonical.html'), 'utf8').trimEnd();
const START_MARKER = '<!-- ═══ ORLO BOTTOM NAV';
const END_MARKER = '<!-- ═══ /ORLO BOTTOM NAV ═══ -->';

// Customer-facing pages — exact list, no globbing so mockups stay untouched.
const TARGETS = [
  'index.html',
  'product.html', 'product1.html',
  'cart.html',
  'account.html',
  'login.html', 'signup.html',
  'forgot-password.html', 'reset-password.html', 'verify-email.html',
  'success.html', 'cancel.html', 'track.html',
  'terms-and-conditions.html',
  'draftnewindex.html', 'draftnewindexR1.html',
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
    // Markers exist — replace between them
    next = original.slice(0, sIdx) + CANONICAL + original.slice(eIdx + END_MARKER.length);
  } else {
    // First-run seed: replace the legacy <nav class="mobile-bottom-nav"> ... </nav> block
    const legacy = /<nav\s+class="mobile-bottom-nav"[\s\S]*?<\/nav>/i;
    const m = original.match(legacy);
    if (m) {
      next = original.replace(legacy, CANONICAL);
    } else {
      console.log('  SKIP (no nav found): ' + file);
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
