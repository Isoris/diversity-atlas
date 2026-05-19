// Smoke tests for the shared Mode-B probe + badge helpers
// (atlases/diversity/shared/mode_b_badge.js).
//
// Tests the real shared module via dynamic import — no mirroring. Runs
// the same scenarios as before plus a real-disk variant that parses
// genomewide_heterozygosity.tsv exactly like LayerRouter.parseDelimited.
//
// Run from the diversity-atlas root:
//   node atlases/diversity/pages/per_sample/test_samples_modeb.js
import fs from 'node:fs';
import {
  probeModeB, renderModeBBadge, medianOf, relDiff,
} from '../../shared/mode_b_badge.js';

// ----- fake DOM ---------------------------------------------------------
const _domElements = new Map();
function _makeSlot(id) {
  const el = { id, className: '', textContent: '', title: '' };
  _domElements.set(id, el);
  return el;
}
globalThis.document = {
  getElementById(id) { return _domElements.get(id) || null; },
};

// ----- samples-page comparator (mirrors samples.js::_compareSamplesHet) -
function _compareSamplesHet(probeResult, D) {
  const observed = medianOf(probeResult.rows, 'het_genomewide', 'h', 'H');
  const baseline = (D && D.globals && (D.globals.h_median ?? D.globals.h_mean)) || null;
  const diff = relDiff(observed, baseline);
  const obsStr = observed != null ? observed.toExponential(3) : '—';
  const baseStr = baseline != null ? baseline.toExponential(3) : '—';
  if (diff == null) {
    return { pass: true,
             summary: `${probeResult.n} samples · median H = ${obsStr} (no carve median to compare)` };
  }
  const pass = diff < 0.01;
  const verdict = pass
    ? `(matches carve median ${baseStr} within 1 %)`
    : `(differs from carve ${baseStr} by ${(diff * 100).toFixed(1)} %)`;
  return { pass,
           summary: `${probeResult.n} samples · median H = ${obsStr} ${verdict}` };
}

function _renderForSamples(result, D) {
  return renderModeBBadge('ssModeBBadge', result, {
    label:    'per-sample H',
    layerKey: 'samples_genomewide_het',
    compare:  (r) => _compareSamplesHet(r, D),
  });
}

// ----- parseDelimited mirror (matches atlas-core/core/layer_router.js) -
function parseDelimited(text, sep) {
  const lines = text.split(/\r?\n/);
  const rows = [];
  let header = null;
  for (const line of lines) {
    if (line.length === 0) continue;
    if (line.startsWith('#')) continue;
    const fields = line.split(sep);
    if (fields.length === 0) continue;
    if (header === null) { header = fields; continue; }
    const row = {};
    for (let i = 0; i < header.length; i++) row[header[i]] = fields[i] ?? '';
    rows.push(row);
  }
  if (header === null) return [];
  for (const col of header) {
    let allNumeric = true;
    for (const row of rows) {
      const v = row[col];
      if (v === '' || v === 'NA' || v === 'NaN') continue;
      const n = Number(v);
      if (!Number.isFinite(n)) { allNumeric = false; break; }
    }
    if (allNumeric) {
      for (const row of rows) {
        const v = row[col];
        row[col] = (v === '' || v === 'NA' || v === 'NaN') ? null : Number(v);
      }
    }
  }
  return rows;
}

// ----- assert helper ----------------------------------------------------
function ok(cond, msg) {
  if (!cond) { console.error(`FAIL: ${msg}`); process.exit(1); }
  console.log(`  ok: ${msg}`);
}

// ----- test 1: happy path with fake rows --------------------------------
console.log('happy path with synthetic rows:');
{
  _domElements.clear();
  _makeSlot('ssModeBBadge');
  const fakeRows = Array.from({ length: 226 }, (_, i) => ({
    sample: `CGA${String(i).padStart(3, '0')}`,
    het_genomewide: 0.00455 + (i % 50) * 1e-5,
    n_sites_sfs: 5e8,
    sfs_bin0: 5e8, sfs_bin1: 2.3e6,
  }));
  const registry = { resolve: () => fakeRows };
  const D = { globals: { h_median: 0.00457 } };
  await probeModeB(registry, 'samples_genomewide_het').then((r) => _renderForSamples(r, D));
  const slot = document.getElementById('ssModeBBadge');
  ok(slot.className === 'data-source-badge live', 'live class when within 1 %');
  ok(slot.textContent.includes('226 samples'),    'badge mentions sample count');
  ok(slot.textContent.includes('matches carve'),  'badge claims match');
  ok(slot.title.includes('samples_genomewide_het'), 'title carries layer key');
}

// ----- test 2: registry undefined → demo --------------------------------
console.log('registry undefined → demo badge:');
{
  _domElements.clear();
  _makeSlot('ssModeBBadge');
  const D = { globals: { h_median: 0.00457 } };
  await probeModeB(undefined, 'samples_genomewide_het').then((r) => _renderForSamples(r, D));
  const slot = document.getElementById('ssModeBBadge');
  ok(slot.className === 'data-source-badge demo', 'demo class');
  ok(slot.textContent.includes('standalone'),      'hints at standalone mode');
}

// ----- test 3: resolve throws → demo + error string ---------------------
console.log('resolve throws → demo with error:');
{
  _domElements.clear();
  _makeSlot('ssModeBBadge');
  const registry = { resolve: () => { throw new Error('boom'); } };
  const D = { globals: { h_median: 0.00457 } };
  await probeModeB(registry, 'samples_genomewide_het').then((r) => _renderForSamples(r, D));
  const slot = document.getElementById('ssModeBBadge');
  ok(slot.className === 'data-source-badge demo', 'demo class');
  ok(slot.textContent.includes('boom'),           'badge surfaces the error message');
}

// ----- test 4: empty rows → demo ---------------------------------------
console.log('empty rows → demo:');
{
  _domElements.clear();
  _makeSlot('ssModeBBadge');
  const registry = { resolve: () => [] };
  const D = { globals: { h_median: 0.00457 } };
  await probeModeB(registry, 'samples_genomewide_het').then((r) => _renderForSamples(r, D));
  const slot = document.getElementById('ssModeBBadge');
  ok(slot.className === 'data-source-badge demo', 'demo class');
  ok(slot.textContent.includes('Mode B'),         'badge labels Mode B');
}

// ----- test 5: carve median differs > 1 % → ⚠ ---------------------------
console.log('median differs > 1 % → warning badge:');
{
  _domElements.clear();
  _makeSlot('ssModeBBadge');
  const fakeRows = [{ sample: 'A', het_genomewide: 0.01 }];
  const registry = { resolve: () => fakeRows };
  const D = { globals: { h_median: 0.005 } };   // 100 % off
  await probeModeB(registry, 'samples_genomewide_het').then((r) => _renderForSamples(r, D));
  const slot = document.getElementById('ssModeBBadge');
  ok(slot.className === 'data-source-badge demo', 'demo class (differs)');
  ok(slot.textContent.startsWith('⚠'),            'warning glyph');
  ok(slot.textContent.includes('differs from carve'), 'badge says differs');
}

// ----- test 6: real disk if present ------------------------------------
console.log('real-disk variant (skipped unless file present):');
{
  const candidates = [
    'E:/results_diversity/02_heterozygosity/04_summary/genomewide_heterozygosity.tsv',
    '/mnt/e/results_diversity/02_heterozygosity/04_summary/genomewide_heterozygosity.tsv',
  ];
  const disk = candidates.find((p) => { try { return fs.statSync(p).isFile(); } catch { return false; } });
  if (!disk) {
    console.log('  skip: genomewide_heterozygosity.tsv not present');
  } else {
    const text = fs.readFileSync(disk, 'utf-8');
    const rows = parseDelimited(text, '\t');
    _domElements.clear();
    _makeSlot('ssModeBBadge');
    const registry = { resolve: () => rows };
    const D = { globals: { h_median: 0.00457 } };  // approximate manuscript value
    await probeModeB(registry, 'samples_genomewide_het').then((r) => _renderForSamples(r, D));
    const slot = document.getElementById('ssModeBBadge');
    ok(rows.length > 200, `parsed ${rows.length} rows from real TSV`);
    ok(slot.textContent.includes('Mode B'), 'real-disk badge renders Mode B label');
    // Confirm the median is in the right ballpark — keep tolerance loose because
    // h_median above is hand-typed from the manuscript and may be slightly off.
    const median = medianOf(rows, 'het_genomewide', 'h', 'H');
    ok(median > 0.003 && median < 0.006, `median H in plausible range (${median.toExponential(3)})`);
  }
}

// ----- test 7: extractRows callback (object payload) -------------------
console.log('extractRows callback (object payload):');
{
  _domElements.clear();
  _makeSlot('ssModeBBadge');
  const payload = {
    cohort_summary: { median_h_gw: 0.0046 },
    per_sample: Array.from({ length: 226 }, (_, i) => ({ sample: `CGA${i}`, h_gw: 0.0045 })),
  };
  const registry = { resolve: () => payload };
  const probe = await probeModeB(registry, 'texture_metrics_payload', {}, {
    extractRows: (p) => (p && Array.isArray(p.per_sample)) ? p.per_sample : null,
  });
  ok(probe.ok === true, 'object payload with valid per_sample → ok');
  ok(probe.n === 226, 'extractRows pulled 226 rows from per_sample');
  ok(probe.payload === payload, 'raw payload exposed for top-level comparators');
}

// ----- test 8: stub payload (empty object) → distinct reason -----------
console.log('stub payload → stub-payload reason:');
{
  _domElements.clear();
  _makeSlot('ssModeBBadge');
  const registry = { resolve: () => ({}) };
  const probe = await probeModeB(registry, 'texture_metrics_payload', {}, {
    extractRows: (p) => (p && Array.isArray(p.per_sample)) ? p.per_sample : null,
  });
  ok(probe.ok === false, 'stub object → not ok');
  ok(probe.reason === 'stub-payload',
     `reason='stub-payload' (got '${probe.reason}')`);
  renderModeBBadge('ssModeBBadge', probe, { label: 'texture metrics', layerKey: 'texture_metrics_payload' });
  const slot = document.getElementById('ssModeBBadge');
  ok(slot.textContent.includes('data pending'), 'badge says "data pending" for stubs');
}

console.log('\nALL OK');
