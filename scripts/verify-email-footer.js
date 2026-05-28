#!/usr/bin/env node
/* verify-email-footer.js — fail loudly if the email-footer block has drifted between targets.
 * Hash-compares the block between the ORLO EMAIL FOOTER markers in every target.
 * Exit 0 = all identical, exit 1 = drift detected.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO = path.join(__dirname, '..');
const START_MARKER = '<!-- ═══ ORLO EMAIL FOOTER';
const END_MARKER = '<!-- ═══ /ORLO EMAIL FOOTER ═══ -->';
const TARGETS = ['functions/api/email-template.js', 'email-preview.html'];

function extract(file) {
  const fp = path.join(REPO, file);
  if (!fs.existsSync(fp)) return null;
  const src = fs.readFileSync(fp, 'utf8');
  const s = src.indexOf(START_MARKER);
  const e = src.indexOf(END_MARKER);
  if (s === -1 || e === -1 || e <= s) return null;
  return src.slice(s, e + END_MARKER.length);
}

const blocks = TARGETS.map(f => ({ file: f, block: extract(f) }));
const present = blocks.filter(b => b.block !== null);
const missing = blocks.filter(b => b.block === null);

if (present.length === 0) {
  console.error('✗ No targets have the ORLO EMAIL FOOTER markers. Run: node scripts/sync-email-footer.js');
  process.exit(1);
}

const canonical = present[0].block;
const canonicalHash = crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 8);
const drift = present.filter(b => b.block !== canonical);

if (drift.length === 0 && missing.length === 0) {
  console.log('✓ All ' + present.length + ' targets have identical email footer (sha256:' + canonicalHash + ').');
  process.exit(0);
}

if (drift.length > 0) {
  console.error('✗ Email-footer DRIFT detected. Canonical hash: ' + canonicalHash);
  drift.forEach(b => {
    const h = crypto.createHash('sha256').update(b.block).digest('hex').slice(0, 8);
    console.error('   - ' + b.file + '  (hash: ' + h + ')');
  });
}
if (missing.length > 0) {
  console.error('✗ Targets without the markers:');
  missing.forEach(b => console.error('   - ' + b.file));
}
console.error('\nFix: node scripts/sync-email-footer.js');
process.exit(1);
