#!/usr/bin/env node
/* verify-footer.js — fail loudly if any target page's footer block has drifted from the others.
 * Hash-compares the block between the ORLO FOOTER markers in every target.
 * Run from CLI or wired into pre-commit. Exit 0 = all identical, exit 1 = drift detected.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO = path.join(__dirname, '..');
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

function extract(file) {
  const fp = path.join(REPO, file);
  if (!fs.existsSync(fp)) return null;
  const html = fs.readFileSync(fp, 'utf8');
  const s = html.indexOf(START_MARKER);
  const e = html.indexOf(END_MARKER);
  if (s === -1 || e === -1 || e <= s) return null;
  return html.slice(s, e + END_MARKER.length);
}

const blocks = TARGETS.map(f => ({ file: f, block: extract(f) }));
const missing = blocks.filter(b => b.block === null);
const present = blocks.filter(b => b.block !== null);

if (present.length === 0) {
  console.error('✗ No pages have the ORLO FOOTER markers. Run: node scripts/sync-footer.js');
  process.exit(1);
}

const canonical = present[0].block;
const canonicalHash = crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 8);
const drift = present.filter(b => b.block !== canonical);

if (drift.length === 0 && missing.length === 0) {
  console.log('✓ All ' + present.length + ' pages have identical footer (sha256:' + canonicalHash + ').');
  process.exit(0);
}

if (drift.length > 0) {
  console.error('✗ Footer DRIFT detected. Canonical hash: ' + canonicalHash);
  drift.forEach(b => {
    const h = crypto.createHash('sha256').update(b.block).digest('hex').slice(0, 8);
    console.error('   - ' + b.file + '  (hash: ' + h + ')');
  });
}
if (missing.length > 0) {
  console.error('✗ Pages without the ORLO FOOTER markers:');
  missing.forEach(b => console.error('   - ' + b.file));
}
console.error('\nFix: node scripts/sync-footer.js');
process.exit(1);
