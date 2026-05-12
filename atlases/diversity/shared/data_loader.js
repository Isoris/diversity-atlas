// =============================================================================
// atlases/diversity/shared/data_loader.js
// =============================================================================
// One-shot loader for the 37 embedded data tables that the legacy
// Diversity_atlas.html v2.4 inlined as <script type="application/json">.
//
// In the migrated tree those blobs live in
//   atlases/diversity/data/embedded_tables.json
// keyed by their original "dt_*" id. This module fetches that file once,
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

const DATA_URL          = 'atlases/diversity/data/embedded_tables.json';
const TEXTURE_DATA_URL  = 'atlases/diversity/data/texture_metrics.json';

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

// The texture (DDI / χ_min) payload is *optional*. It is consumed by
// pages/per_sample/page9.js and any future cross-page integrations
// (planned: DDI/χ_min columns in page1 master table, DDI per-cluster
// rollup on page4). Absent or empty file → WIN_METRICS resolves to null
// and consumers fall back to a "data pending" render. See the schema
// block in pages/per_sample/page9.html for the canonical shape.
async function fetchTextureMetrics() {
  try {
    const res = await fetch(TEXTURE_DATA_URL);
    if (!res.ok) return null;
    return await res.json();
  } catch (_e) {
    return null;
  }
}

export async function ensureData() {
  if (_cache) return _cache;
  if (_inflight) return _inflight;
  _inflight = (async () => {
    const [res, wm] = await Promise.all([fetch(DATA_URL), fetchTextureMetrics()]);
    if (!res.ok) throw new Error(`embedded_tables.json fetch failed: ${res.status}`);
    const raw = await res.json();
    const D = {};
    for (const [id, alias] of Object.entries(ALIAS)) {
      D[alias] = (id in raw) ? raw[id] : null;
    }
    const CLUSTER_COLORS = {};
    if (Array.isArray(D.S9)) {
      D.S9.forEach(c => { CLUSTER_COLORS[c.k] = c.color; });
    }
    _cache = { D, CLUSTER_COLORS, WIN_METRICS: wm };
    return _cache;
  })();
  return _inflight;
}
