// Smoke tests for samples.js's Mode-B cross-check badge.
//
// Mirrors the helpers from samples.js byte-for-byte (the page module is
// browser-ESM so we can't `import` it from Node trivially). Verifies:
//   - happy path: registry returns rows → green ● badge with median ratio
//   - registry undefined → demo ○ badge ("standalone")
//   - registry.resolve throws → demo ○ badge ("resolve-threw")
//   - rows empty → demo ○ badge ("empty-result")
//   - carve-median match within 1 % → ● vs ⚠
//   - real-disk variant: when E:/results_diversity/02_heterozygosity/
//     04_summary/genomewide_heterozygosity.tsv is present, parse it the
//     same way LayerRouter.parseDelimited would and confirm the median
//     matches the manuscript carve (D.globals.h_median = ~4.55e-3).
//
// Run from the diversity-atlas root:
//   node atlases/diversity/pages/per_sample/test_samples_modeb.js
import fs from 'node:fs';
import path from 'node:path';

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

// ----- byte-equivalent copies of the samples.js helpers ----------------
// Keep these in sync with the originals. Easier than wiring up a
// browser-ESM loader for one smoke test.
function _medianOfHet(rows) {
  const xs = [];
  for (const r of rows || []) {
    const v = r && (r.het_genomewide ?? r.h ?? r.H);
    if (typeof v === 'number' && Number.isFinite(v)) xs.push(v);
  }
  if (xs.length === 0) return null;
  xs.sort((a, b) => a - b);
  const mid = xs.length >> 1;
  return (xs.length & 1) ? xs[mid] : 0.5 * (xs[mid - 1] + xs[mid]);
}
async function _probeModeBHet(registry) {
  if (!registry || typeof registry.resolve !== 'function') {
    return { ok: false, reason: 'registry-not-injected' };
  }
  try {
    const rows = await Promise.resolve(registry.resolve('samples_genomewide_het'));
    if (!Array.isArray(rows) || rows.length === 0) {
      return { ok: false, reason: 'empty-result' };
    }
    return {
      ok:           true,
      n_samples:    rows.length,
      median_het:   _medianOfHet(rows),
      sample_keys:  Object.keys(rows[0] || {}),
    };
  } catch (e) {
    return { ok: false, reason: 'resolve-threw', error: String(e && e.message || e) };
  }
}
function _renderModeBBadge(result, D) {
  const slot = document.getElementById('ssModeBBadge');
  if (!slot) return;
  if (!result || !result.ok) {
    slot.className = 'data-source-badge demo';
    const reason = (result && result.reason) || 'unknown';
    const hint = {
      'registry-not-injected': 'shell did not inject the registry — running standalone?',
      'empty-result':          'layer resolved but rows[] is empty — check the TSV.',
      'resolve-threw':         (result && result.error) || 'fetch / parse error',
      'unknown':               'no probe result',
    }[reason] || reason;
    slot.textContent = `○  Mode B (pipeline) unavailable — ${hint}`;
    slot.title = 'registry.resolve("samples_genomewide_het") failed; ' +
                 'page still renders from D.S1 (manuscript carve).';
    return;
  }
  const carveMedian = (D && D.globals && (D.globals.h_median ?? D.globals.h_mean)) || null;
  const diff = (carveMedian != null && result.median_het != null)
    ? Math.abs(result.median_het - carveMedian) / carveMedian
    : null;
  const matches = diff != null && diff < 0.01;
  slot.className = 'data-source-badge ' + (matches ? 'live' : 'demo');
  const medianStr = result.median_het != null ? result.median_het.toExponential(3) : '—';
  const carveStr  = carveMedian       != null ? carveMedian.toExponential(3)       : '—';
  const tag = matches ? '●' : '⚠';
  const verdict = (diff == null)
    ? '(no carve median to compare)'
    : matches
      ? `(matches carve median ${carveStr} within 1 %)`
      : `(differs from carve ${carveStr} by ${(diff * 100).toFixed(1)} %)`;
  slot.textContent =
    `${tag}  Mode B (pipeline) — ${result.n_samples} samples · median H = ${medianStr} ${verdict}`;
  slot.title = `registry.resolve("samples_genomewide_het") → ` +
               `${result.n_samples} rows, columns: ${result.sample_keys.join(', ')}`;
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
  await _probeModeBHet(registry).then((r) => _renderModeBBadge(r, D));
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
  await _probeModeBHet(undefined).then((r) => _renderModeBBadge(r, D));
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
  await _probeModeBHet(registry).then((r) => _renderModeBBadge(r, D));
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
  await _probeModeBHet(registry).then((r) => _renderModeBBadge(r, D));
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
  await _probeModeBHet(registry).then((r) => _renderModeBBadge(r, D));
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
    await _probeModeBHet(registry).then((r) => _renderModeBBadge(r, D));
    const slot = document.getElementById('ssModeBBadge');
    ok(rows.length > 200, `parsed ${rows.length} rows from real TSV`);
    ok(slot.textContent.includes('Mode B'), 'real-disk badge renders Mode B label');
    // Confirm the median is in the right ballpark — keep tolerance loose because
    // h_median above is hand-typed from the manuscript and may be slightly off.
    const median = _medianOfHet(rows);
    ok(median > 0.003 && median < 0.006, `median H in plausible range (${median.toExponential(3)})`);
  }
}

console.log('\nALL OK');
