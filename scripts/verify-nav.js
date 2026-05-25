#!/usr/bin/env node
/* verify-nav.js — fail loudly if any target page's bottom-nav block has drifted from the others.
 * Hash-compares the block between the ORLO BOTTOM NAV markers in every target.
 * Run from CLI or wired into pre-commit. Exit 0 = all identical, exit 1 = drift detected.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO = path.join(__dirname, '..');
const START_MARKER = '<!-- ═══ ORLO BOTTOM NAV';
const END_MARKER = '<!-- ═══ /ORLO BOTTOM NAV ═══ -->';

const TARGETS = [
  'index.html', 'shop.html',
  'product.html', 'product1.html',
  'cart.html',
  'account.html',
  'login.html', 'signup.html',
  'forgot-password.html', 'reset-password.html', 'verify-email.html',
  'success.html', 'cancel.html', 'track.html',
  'terms-and-conditions.html',
  'draftnewindex.html', 'draftnewindexR1.html',
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
  console.error('✗ No pages have the ORLO BOTTOM NAV markers. Run: node scripts/sync-nav.js');
  process.exit(1);
}

const canonical = present[0].block;
const canonicalHash = crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 8);
const drift = present.filter(b => b.block !== canonical);

if (drift.length === 0 && missing.length === 0) {
  console.log('✓ All ' + present.length + ' pages have identical bottom nav (sha256:' + canonicalHash + ').');
  process.exit(0);
}

if (drift.length > 0) {
  console.error('✗ Bottom-nav DRIFT detected. Canonical hash: ' + canonicalHash);
  drift.forEach(b => {
    const h = crypto.createHash('sha256').update(b.block).digest('hex').slice(0, 8);
    console.error('   - ' + b.file + '  (hash: ' + h + ')');
  });
}
if (missing.length > 0) {
  console.error('✗ Pages without the ORLO BOTTOM NAV markers:');
  missing.forEach(b => console.error('   - ' + b.file));
}
console.error('\nFix: node scripts/sync-nav.js');
process.exit(1);
