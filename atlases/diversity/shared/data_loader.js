// =============================================================================
// atlases/diversity/shared/data_loader.js
// =============================================================================
// One-shot loader for the 37 embedded data tables that the legacy
// Diversity_atlas.html v2.4 inlined as <script type="application/json">.
//
// In the migrated tree those blobs live in
//   data/embedded_tables.json
// (top-level, OUTSIDE the atlas package — the atlas is a viewer, not a
// store; see data/README.md for the architectural rule).
// They are keyed by their original "dt_*" id. This module fetches that file once,
// caches the parsed result, and re-publishes the data under the short
// names the legacy renderers use: D.globals, D.S1, ..., D.REF.
//
// Usage from a page module:
//   import { ensureData } from '../../shared/data_loader.js';
//   const { D, CLUSTER_COLORS } = await ensureData();
//
// The first call kicks off the fetch; concurrent callers await the same
// in-flight promise. Subsequent calls return the cached object.
// =============================================================================

// Each slot has two URLs: the semantic API endpoint (preferred) and the
// static relative path that the legacy renderers shipped with. The loader
// tries the API first and falls back to the static path so the atlas keeps
// rendering when served as a plain static site (e.g. from disk, or before
// the atlas_server diversity router is mounted).
const SLOT_URLS = {
  embedded_tables:    ['/api/diversity/embedded_tables',    'data/embedded_tables.json'],
  texture_metrics:    ['/api/diversity/texture_metrics',    'data/texture_metrics.json'],
  functional_burden:  ['/api/diversity/functional_burden',  'data/functional_burden.json'],
  roh_gene_overlap:   ['/api/diversity/roh_gene_overlap',   'data/roh_gene_overlap.json'],
  divergence_network: ['/api/diversity/divergence_network', 'data/divergence_network.json'],
};

// Map raw "dt_*" ids to the short alias the legacy code used.
const ALIAS = {
  dt_globals:                       'globals',
  dt_S1:                            'S1',
  dt_S2:                            'S2',
  dt_S3:                            'S3',
  dt_S4:                            'S4',
  dt_S5_kw:                         'S5_kw',
  dt_S5_pairwise:                   'S5_pair',
  dt_S6:                            'S6',
  dt_S7:                            'S7',
  dt_S8:                            'S8',
  dt_S8b:                           'S8b',
  dt_S9:                            'S9',
  dt_S10:                           'S10',
  dt_S11:                           'S11',
  dt_SZ:                            'SZ',
  dt_ST1:                           'ST1',
  dt_ST2:                           'ST2',
  dt_ST3:                           'ST3',
  dt_ST3b:                          'ST3b',
  dt_M3_SD1_pipeline_steps:         'SD1',
  dt_M3_SD2_angsd_parameters:       'SD2',
  dt_M3_SD3_window_scales:          'SD3',
  dt_M3_SD4_roh_bin_scheme:         'SD4',
  dt_M3_SD5_design_decisions:       'SD5',
  dt_M3_SD6_output_directories:     'SD6',
  dt_M3_SD7_canonical_outputs:      'SD7',
  dt_M3_SD8_software:               'SD8',
  dt_S8c_long:                      'S8c_long',
  dt_S12:                           'S12',
  dt_S12_summary:                   'S12_summary',
  dt_S4b_meta:                      'S4b_meta',
  dt_ST4_meta:                      'ST4_meta',
  dt_ST5_meta:                      'ST5_meta',
  dt_REF_meta:                      'REF_meta',
  dt_S4b:                           'S4b',
  dt_ST5:                           'ST5',
  dt_REF:                           'REF',
};

let _cache = null;
let _inflight = null;

// Try API endpoint first, fall back to the static relative path. Returns
// the parsed JSON or null if both URLs are unreachable / non-OK.
// The texture, functional_burden, roh_gene_overlap and divergence_network
// payloads are *optional* — absent → consumers render "data pending"
// fallbacks. embedded_tables is required; its caller throws on null.
async function fetchSlot(slot) {
  const urls = SLOT_URLS[slot];
  if (!urls) return null;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (_e) { /* try next */ }
  }
  return null;
}

export async function ensureData() {
  if (_cache) return _cache;
  if (_inflight) return _inflight;
  _inflight = (async () => {
    const [raw, wm, fb, rgo, dn] = await Promise.all([
      fetchSlot('embedded_tables'),
      fetchSlot('texture_metrics'),
      fetchSlot('functional_burden'),
      fetchSlot('roh_gene_overlap'),
      fetchSlot('divergence_network'),
    ]);
    if (raw === null) {
      throw new Error('embedded_tables fetch failed (tried /api/diversity/embedded_tables and data/embedded_tables.json)');
    }
    const D = {};
    for (const [id, alias] of Object.entries(ALIAS)) {
      D[alias] = (id in raw) ? raw[id] : null;
    }
    const CLUSTER_COLORS = {};
    if (Array.isArray(D.S9)) {
      D.S9.forEach(c => { CLUSTER_COLORS[c.k] = c.color; });
    }
    // Provenance block (added 2026-05-20 per MISSING_DATA.md #5).
    // Underscore-prefixed top-level keys carry the carve's version /
    // source / content-hash; surfaced via ctx.PROVENANCE for downstream
    // pages (e.g. the about page) or any cross-check that wants to
    // compare the carve fingerprint against a pipeline export. Absent
    // for legacy embedded_tables.json files without the block — fields
    // are null in that case.
    const PROVENANCE = {
      data_version:   raw._data_version   || null,
      source_html:    raw._source_html    || null,
      carved_at:      raw._carved_at      || null,
      content_sha256: raw._content_sha256 || null,
      n_dt_blobs:     raw._n_dt_blobs     || null,
    };
    _cache = {
      D,
      CLUSTER_COLORS,
      WIN_METRICS:        wm,
      FUNCTIONAL_BURDEN:  fb,
      ROH_GENE_OVERLAP:   rgo,
      DIVERGENCE_NETWORK: dn,
      PROVENANCE,
    };
    return _cache;
  })();
  return _inflight;
}
