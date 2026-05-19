// =============================================================================
// atlases/diversity/shared/mode_b_badge.js
// =============================================================================
// Shared "Mode B" probe + badge renderer for diversity-atlas pages.
//
// Mode A = the manuscript carve (data/embedded_tables.json → ctx.D).
// Mode B = the on-disk pipeline output behind layers.registry.json,
//          resolved through atlas-core's registry (master_config root →
//          static mount → parseDelimited).
//
// Pages call probeModeB() with a layer_key (+ optional args for templated
// layers) and a comparison callback that decides whether the resolved
// rows agree with the carve. The badge displays one of three states:
//
//   ●  match     — rows resolved, comparison.pass === true
//   ⚠  drift     — rows resolved but comparison.pass === false
//   ○  missing   — probe failed (registry not injected, fetch error,
//                  empty rows, etc.) — page still renders from Mode A
//
// All failure modes are non-fatal. The page never blocks on the probe.
//
// Why this lives in shared/ instead of per-page: each page that wires a
// Mode B cross-check needs the same fail-soft path, the same badge CSS
// classes (`.data-source-badge .live` / `.demo`), and the same call
// shape. Centralising removes drift between pages and lets a single
// stylistic tweak (e.g. swapping glyphs) propagate everywhere.
// =============================================================================


/**
 * Resolve a layer through the injected registry. Always returns; never
 * throws. Shape:
 *   { ok: true,  rows, payload, n, sample_keys }
 *   { ok: false, reason, error?, payload? }
 *
 * `opts.extractRows(payload) => Array | null` lets callers point at a
 * sub-array of an object payload — needed for the spec-driven JSON
 * payloads (texture_metrics_payload.per_sample, divergence_network_
 * payload.edges, etc.) that don't return a top-level row array. Default
 * extractor: pass through arrays, reject anything else (which is the
 * shape `format: tsv` layers produce via parseDelimited).
 *
 * `probeResult.payload` is always the raw resolved value when the probe
 * reached the registry — useful for comparators that need top-level
 * fields like `cohort_summary` alongside per-row stats.
 */
export async function probeModeB(registry, layerKey, args, opts) {
  if (!registry || typeof registry.resolve !== 'function') {
    return { ok: false, reason: 'registry-not-injected' };
  }
  const extractRows = (opts && opts.extractRows) || _defaultExtractRows;
  try {
    const payload = await Promise.resolve(registry.resolve(layerKey, args || {}));
    const rows = extractRows(payload);
    if (!Array.isArray(rows) || rows.length === 0) {
      // Distinguish empty payload (stub on disk) from missing payload
      // (no fetch). When the resolver returns nullish, the file is
      // unreachable. When it returns an empty-ish object, the upstream
      // pipeline shipped a stub.
      const reason = (payload == null) ? 'empty-result' : 'stub-payload';
      return { ok: false, reason, payload };
    }
    return {
      ok:          true,
      rows,
      payload,
      n:           rows.length,
      sample_keys: Object.keys(rows[0] || {}),
    };
  } catch (e) {
    return { ok: false, reason: 'resolve-threw', error: String(e && e.message || e) };
  }
}

function _defaultExtractRows(payload) {
  return Array.isArray(payload) ? payload : null;
}


/**
 * Render a Mode-B badge into a DOM slot.
 *
 * @param slotId      element id of the badge container
 * @param probeResult return value of probeModeB()
 * @param opts.label  short layer name shown in the badge text
 * @param opts.compare optional (probeResult) => { pass: bool, summary: str }
 *                     summarises whether rows agree with the carve.
 *                     pass=true → ● live, pass=false → ⚠ demo, omitted
 *                     → ● live with a generic "resolved" verdict.
 */
export function renderModeBBadge(slotId, probeResult, opts) {
  const slot = (typeof document !== 'undefined') && document.getElementById(slotId);
  if (!slot) return;
  const label = (opts && opts.label) || 'pipeline';

  if (!probeResult || !probeResult.ok) {
    slot.className = 'data-source-badge demo';
    const reason = (probeResult && probeResult.reason) || 'unknown';
    const hint = {
      'registry-not-injected': 'shell did not inject the registry — running standalone?',
      'empty-result':          'layer resolved but rows[] is empty — check the source.',
      'stub-payload':          'payload resolved but is a stub (upstream pipeline has not shipped yet).',
      'resolve-threw':         (probeResult && probeResult.error) || 'fetch / parse error',
      'unknown':               'no probe result',
    }[reason] || reason;
    slot.textContent = `○  Mode B (${label}) ` +
                       (reason === 'stub-payload' ? 'data pending' : 'unavailable') +
                       ` — ${hint}`;
    slot.title = `registry.resolve("${(opts && opts.layerKey) || '?'}") ` +
                 (reason === 'stub-payload' ? 'returned a stub payload' : 'failed') +
                 '; page still renders from D.* (manuscript carve).';
    return;
  }

  let verdict = '';
  let pass = true;
  if (opts && typeof opts.compare === 'function') {
    const cmp = opts.compare(probeResult) || {};
    pass = cmp.pass !== false;
    verdict = cmp.summary || '';
  } else {
    verdict = `(${probeResult.n} rows resolved)`;
  }
  slot.className = 'data-source-badge ' + (pass ? 'live' : 'demo');
  const tag = pass ? '●' : '⚠';
  slot.textContent = `${tag}  Mode B (${label}) — ${verdict}`;
  slot.title = `registry.resolve("${(opts && opts.layerKey) || label}") → ` +
               `${probeResult.n} rows, columns: ${probeResult.sample_keys.join(', ')}`;
}


/**
 * Statistic helpers — small enough that a shared import beats duplication.
 */
export function medianOf(rows, ...keys) {
  const xs = [];
  for (const r of rows || []) {
    for (const k of keys) {
      const v = r && r[k];
      if (typeof v === 'number' && Number.isFinite(v)) { xs.push(v); break; }
    }
  }
  if (xs.length === 0) return null;
  xs.sort((a, b) => a - b);
  const mid = xs.length >> 1;
  return (xs.length & 1) ? xs[mid] : 0.5 * (xs[mid - 1] + xs[mid]);
}

export function meanOf(rows, ...keys) {
  let sum = 0, n = 0;
  for (const r of rows || []) {
    for (const k of keys) {
      const v = r && r[k];
      if (typeof v === 'number' && Number.isFinite(v)) { sum += v; n += 1; break; }
    }
  }
  return n ? sum / n : null;
}

export function distinctCount(rows, key) {
  const s = new Set();
  for (const r of rows || []) if (r && r[key] != null) s.add(r[key]);
  return s.size;
}

/**
 * Relative-difference helper. Returns null when either input is null/NaN.
 * Used by all three pages to decide pass/drift against the carve baseline.
 */
export function relDiff(observed, baseline) {
  if (observed == null || baseline == null) return null;
  if (typeof observed !== 'number' || typeof baseline !== 'number') return null;
  if (!Number.isFinite(observed) || !Number.isFinite(baseline) || baseline === 0) return null;
  return Math.abs(observed - baseline) / Math.abs(baseline);
}
