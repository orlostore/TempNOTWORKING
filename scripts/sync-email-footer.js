#!/usr/bin/env node
/* sync-email-footer.js — propagate the canonical email footer to the production template + preview mockup.
 *
 * Reads _footer-canonical-email.html (single source of truth) and writes it into each target between
 * the ORLO EMAIL FOOTER markers. Idempotent — running it twice in a row makes no further changes.
 *
 * Targets:
 *   - functions/api/email-template.js  (the JS that customers' emails are rendered from)
 *   - email-preview.html               (the in-browser mockup that compares v1 vs v4 side-by-side)
 *
 * The canonical block is an email-safe <tr><td>...</td></tr> table row, inlined styles, table layout,
 * SVG icons (Outlook desktop falls back to empty circle borders — acceptable). Matches the website
 * canonical footer's content exactly: Customer Enquiries / Email / WhatsApp (9am–6pm) / Follow (IG+TT) /
 * legal nav (T&C / Privacy / Returns / Shipping / Exchange) / Copyright.
 */
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');
const CANONICAL = fs.readFileSync(path.join(REPO, '_footer-canonical-email.html'), 'utf8').trimEnd();
const START_MARKER = '<!-- ═══ ORLO EMAIL FOOTER';
const END_MARKER = '<!-- ═══ /ORLO EMAIL FOOTER ═══ -->';

const TARGETS = [
  'functions/api/email-template.js',
  'email-preview.html',
];

let updated = 0, unchanged = 0, missing = 0;

TARGETS.forEach(file => {
  const fp = path.join(REPO, file);
  if (!fs.existsSync(fp)) { console.log('  SKIP (missing): ' + file); missing++; return; }
  const original = fs.readFileSync(fp, 'utf8');
  const sIdx = original.indexOf(START_MARKER);
  const eIdx = original.indexOf(END_MARKER);
  if (sIdx === -1 || eIdx === -1 || eIdx <= sIdx) {
    console.error('  ✗ Missing markers in ' + file);
    process.exit(1);
  }
  const next = original.slice(0, sIdx) + CANONICAL + original.slice(eIdx + END_MARKER.length);
  if (next === original) { console.log('  unchanged: ' + file); unchanged++; return; }
  fs.writeFileSync(fp, next);
  console.log('  ✓ updated: ' + file);
  updated++;
});

console.log('\nDone. ' + updated + ' updated, ' + unchanged + ' unchanged' + (missing ? ', ' + missing + ' missing' : '') + '.');
