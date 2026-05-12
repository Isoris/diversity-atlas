// =============================================================================
// atlases/diversity/pages/functional/page10.js — Functional burden / selection
// =============================================================================
// Stage:        functional (new section, round 3)
// Spec:         _handoff_docs/SPEC_2026-05-12_functional_burden.md
//
// Reads:
//   D.S1                 — for K=8 ancestry, F_ROH per sample.
//   D.S9                 — for K=8 cluster palette.
//   ctx.FUNCTIONAL_BURDEN — optional payload loaded by shared/data_loader.js.
//                           Absent / empty → renders "data pending" path.
//
// Computes on the client:
//   - Quartile binning by F_ROH for the per-quartile stratification mode.
//   - Outlier flagging for the per-sample table (vs cohort mean ± 1.5σ).
//   - Top-N filtering for the variant-inventory chart's bar order.
//   - Confidence-tier filter for the transcript view.
//
// Everything else (πN/πS, π0/π4, VESM scores, LOF counts, splice events,
// K-S P-value matrices, MSA SVG paths) ships pre-computed in the payload.
// The annotator stack (csq + snpEff + VESM + custom splice module) runs
// upstream in catfish-diversity-analysis.
// =============================================================================

import { ensureData } from '../../shared/data_loader.js';
import { ensureTip, showTip, hideTip, bindTip } from '../../shared/tooltip.js';
import { fmt2, fmt3, fmtH, fmtPct, fmtSci, clusterSwatch } from '../../shared/formatters.js';
import { buildSVG, svgClose, linScale, niceTicks } from '../../shared/svg.js';
import { mountStratificationPills, frohQuartiles } from '../../shared/stratification.js';
import { SNPEFF_IMPACT_COLORS, GERP_HIGHLIGHT, kColor } from '../../shared/palette.js';

const fbState = {
  stratMode:        'K=8',        // K=8 | family | sample | froh_q
  selectedSample:   null,
  tableMode:        'all',        // all | outliers
  clusterFilter:    '',
  search:           '',
  sortKey:          'vesm_burden',
  sortDesc:         true,
  selectedGene:     null,
  selectedVariant:  null,
  gerpEnabled:      false,
  topCohortMode:    false,
};

let D = null;
let FB = null;          // FUNCTIONAL_BURDEN payload (or null)
let CLUSTER_COLORS = null;
let MERGED = null;      // joined per-sample rows: S1 ∪ FB.per_sample

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function hasBurden() {
  return FB && FB.per_sample && Array.isArray(FB.per_sample) && FB.per_sample.length > 0;
}
function hasInventory() {
  return FB && Array.isArray(FB.variant_inventory) && FB.variant_inventory.length > 0;
}
function hasGerp() {
  return FB && Array.isArray(FB.gerp_inventory) && FB.gerp_inventory.length > 0;
}
function familyAvailable() {
  return MERGED && MERGED.some(r => r.family_id != null);
}

function buildMerged() {
  const fbIdx = new Map();
  if (FB && Array.isArray(FB.per_sample)) {
    FB.per_sample.forEach(r => fbIdx.set(r.sample_id, r));
  }
  MERGED = (D.S1 || []).map(s => {
    const fb = fbIdx.get(s.sample) || {};
    return {
      sample:           s.sample,
      k8:               s.k8,
      f_roh:            s.f_roh,
      family_id:        fb.family_id || null,
      pi:               fb.pi != null ? fb.pi : null,
      piN:              fb.piN != null ? fb.piN : null,
      piS:              fb.piS != null ? fb.piS : null,
      piN_piS:          fb.piN_piS != null ? fb.piN_piS : null,
      pi0_pi4:          fb.pi0_pi4 != null ? fb.pi0_pi4 : null,
      vesm_burden:      fb.vesm_burden != null ? fb.vesm_burden : null,
      lof_count:        fb.lof_count != null ? fb.lof_count : null,
      splice_count:     fb.splice_count != null ? fb.splice_count : null,
      vesm_in_roh_frac: fb.vesm_in_roh_frac != null ? fb.vesm_in_roh_frac : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Top stat strip — five cells, cohort-wide
// ---------------------------------------------------------------------------
function fbTopStrip() {
  const host = document.getElementById('fbTopStrip');
  if (!host) return;
  const c = (FB && FB.cohort_summary) || {};
  const ci = a => Array.isArray(a) && a[0] != null && a[1] != null
    ? `${fmt3(a[0])}–${fmt3(a[1])}` : '—';

  const cells = [
    { lbl: 'π (cohort)',           val: c.pi != null ? fmtSci(c.pi, 2) : '—',
      sub: c.n_samples != null ? `${c.n_samples} samples` : '226 samples' },
    { lbl: 'π_N/π_S',              val: c.piN_piS != null ? fmt3(c.piN_piS) : '—',
      sub: `95 % CI ${ci(c.piN_piS_ci)}` },
    { lbl: 'π_0/π_4',              val: c.pi0_pi4 != null ? fmt3(c.pi0_pi4) : '—',
      sub: `95 % CI ${ci(c.pi0_pi4_ci)}` },
    { lbl: 'VESM burden (mean)',   val: c.vesm_burden != null ? fmt3(c.vesm_burden) : '—',
      sub: 'cohort mean' },
    { lbl: 'LOF count (mean)',     val: c.lof_count != null ? fmt2(c.lof_count) : '—',
      sub: 'high-confidence (csq ∩ snpEff)' },
  ];
  host.innerHTML = cells.map(c =>
    `<div><div class="lbl">${c.lbl}</div><div class="val">${c.val}</div>` +
    `<div style="font-size:9.5px;color:var(--ink-dim);margin-top:2px;">${c.sub}</div></div>`
  ).join('');
}

// ---------------------------------------------------------------------------
// Variant inventory — horizontal bar chart, snpEff impact × mutation type
// ---------------------------------------------------------------------------
function plotVariantInventory() {
  const host = document.getElementById('plotFbInventory');
  if (!host) return;
  const rows = (FB && Array.isArray(FB.variant_inventory)) ? FB.variant_inventory : [];
  if (rows.length === 0) {
    host.innerHTML = '<div style="color:var(--ink-dim); padding:24px; text-align:center; font-style:italic;">' +
      'snpEff variant inventory not yet available.</div>';
    return;
  }
  // Sort ascending by count so the longest bar is at the bottom
  const sorted = rows.slice().sort((a, b) => (a.n || 0) - (b.n || 0));
  const W = 700, H = 18 * sorted.length + 40;
  const padL = 200, padR = 60, padT = 8, padB = 24;

  const maxN = Math.max(...sorted.map(r => r.n || 1));
  const xS = v => padL + (Math.log10(Math.max(1, v)) / Math.log10(maxN)) * (W - padL - padR);

  const arr = buildSVG(W, H);

  // x-axis ticks (10^1, 10^3, 10^5, ...)
  const decades = [10, 100, 1000, 10000, 100000, 1000000, 10000000];
  decades.filter(d => d <= maxN).forEach(d => {
    const x = xS(d);
    arr.push(`<line class="grid-line" x1="${x}" y1="${padT}" x2="${x}" y2="${H-padB}"/>`);
    const exp = Math.log10(d);
    arr.push(`<text class="axis-text" x="${x}" y="${H-padB+12}" text-anchor="middle">10^${exp}</text>`);
  });

  sorted.forEach((r, i) => {
    const y = padT + i * 18 + 2;
    const bw = xS(r.n) - padL;
    const fill = SNPEFF_IMPACT_COLORS[r.impact] || '#888';
    arr.push(`<rect data-i="${i}" x="${padL}" y="${y}" width="${Math.max(2, bw)}" height="14" fill="${fill}" stroke="#222" stroke-width="0.4"/>`);
    arr.push(`<text class="axis-text" x="${padL-6}" y="${y+10}" text-anchor="end">${r.type}</text>`);
    arr.push(`<text class="axis-text" x="${padL + bw + 4}" y="${y+10}" text-anchor="start" style="font-size:9.5px;">${r.n.toLocaleString()}</text>`);
  });
  arr.push(`<text class="axis-text" x="${(padL+W-padR)/2}" y="${H-4}" text-anchor="middle">log10(Number of SNPs)</text>`);

  host.innerHTML = svgClose(arr);
  const svgEl = host.querySelector('svg');
  bindTip(svgEl, i => sorted[i],
    r => `<b>${r.type}</b><div class="row">impact: ${r.impact}</div><div class="row">N = ${r.n.toLocaleString()}</div>`);

  const tag = document.getElementById('fbInventoryTag');
  if (tag) tag.textContent = `${sorted.length} types · ${sorted.reduce((s, r) => s + (r.n || 0), 0).toLocaleString()} variants`;
}

// ---------------------------------------------------------------------------
// snpEff totals mini-panel — 4 bars
// ---------------------------------------------------------------------------
function plotSnpeffTotals() {
  const host = document.getElementById('plotFbSnpeffTotals');
  if (!host) return;
  const rows = (FB && Array.isArray(FB.snpeff_totals)) ? FB.snpeff_totals : [];
  if (rows.length === 0) {
    host.innerHTML = '<div style="color:var(--ink-dim); padding:12px; text-align:center; font-style:italic; font-size:10px;">data pending</div>';
    return;
  }
  const order = ['High', 'Moderate', 'Low', 'Modifier'];
  const sorted = order.map(impact => rows.find(r => r.impact === impact) || { impact, n: 0 });
  const W = 240, H = 92;
  const padL = 70, padR = 14, padT = 6, padB = 18;
  const maxN = Math.max(...sorted.map(r => r.n || 1));
  const xS = v => padL + (Math.log10(Math.max(1, v)) / Math.log10(maxN || 1)) * (W - padL - padR);
  const arr = buildSVG(W, H);
  sorted.forEach((r, i) => {
    const y = padT + i * 18 + 2;
    const bw = xS(r.n) - padL;
    const fill = SNPEFF_IMPACT_COLORS[r.impact] || '#888';
    arr.push(`<rect x="${padL}" y="${y}" width="${Math.max(2, bw)}" height="14" fill="${fill}" stroke="#222" stroke-width="0.4"/>`);
    arr.push(`<text class="axis-text" x="${padL-6}" y="${y+10}" text-anchor="end">${r.impact}</text>`);
    arr.push(`<text class="axis-text" x="${padL + bw + 4}" y="${y+10}" text-anchor="start" style="font-size:9.5px;">${(r.n || 0).toLocaleString()}</text>`);
  });
  host.innerHTML = svgClose(arr);
}

// ---------------------------------------------------------------------------
// GERP panel (off by default)
// ---------------------------------------------------------------------------
function plotGerp() {
  const host = document.getElementById('plotFbGerp');
  if (!host) return;
  if (!fbState.gerpEnabled) { host.style.display = 'none'; return; }
  host.style.display = 'block';

  const rows = (FB && Array.isArray(FB.gerp_inventory)) ? FB.gerp_inventory : [];
  if (rows.length === 0) {
    host.innerHTML = '<div style="color:var(--ink-dim); padding:24px; text-align:center; font-style:italic;">' +
      'No GERP track has been computed in genome-atlas yet.</div>';
    return;
  }
  const order = ['>=4', '3-4', '2-3', '1-2', '0-1', '<0'];
  const sorted = order.map(bin => rows.find(r => r.bin === bin) || { bin, n: 0 });
  const W = 600, H = 18 * sorted.length + 40;
  const padL = 80, padR = 60, padT = 8, padB = 24;
  const maxN = Math.max(...sorted.map(r => r.n || 1));
  const xS = v => padL + (Math.log10(Math.max(1, v)) / Math.log10(maxN || 1)) * (W - padL - padR);
  const arr = buildSVG(W, H);
  sorted.forEach((r, i) => {
    const y = padT + i * 18 + 2;
    const bw = xS(r.n) - padL;
    const fill = r.bin === '>=4' ? GERP_HIGHLIGHT : '#bbb';
    arr.push(`<rect x="${padL}" y="${y}" width="${Math.max(2, bw)}" height="14" fill="${fill}" stroke="#222" stroke-width="0.4"/>`);
    arr.push(`<text class="axis-text" x="${padL-6}" y="${y+10}" text-anchor="end">${r.bin}</text>`);
    arr.push(`<text class="axis-text" x="${padL + bw + 4}" y="${y+10}" text-anchor="start" style="font-size:9.5px;">${(r.n || 0).toLocaleString()}</text>`);
  });
  arr.push(`<text class="axis-text" x="${(padL+W-padR)/2}" y="${H-4}" text-anchor="middle">log10(Number of SNPs) · GERP ≥ 4 highlighted</text>`);
  host.innerHTML = svgClose(arr);
}

// ---------------------------------------------------------------------------
// Stratified group boxplots — πN/πS, π0/π4, VESM, LOF
// ---------------------------------------------------------------------------
function strataAndLabels() {
  if (!MERGED) return { strata: new Map(), order: [] };
  const strata = new Map();
  if (fbState.stratMode === 'K=8') {
    MERGED.forEach(r => {
      const k = r.k8 || 'unassigned';
      if (!strata.has(k)) strata.set(k, []);
      strata.get(k).push(r);
    });
  } else if (fbState.stratMode === 'family') {
    MERGED.forEach(r => {
      if (!r.family_id) return;
      if (!strata.has(r.family_id)) strata.set(r.family_id, []);
      strata.get(r.family_id).push(r);
    });
  } else if (fbState.stratMode === 'froh_q') {
    const q = frohQuartiles(MERGED);
    MERGED.forEach((r, i) => {
      const lab = q.get(i) || 'unassigned';
      if (!strata.has(lab)) strata.set(lab, []);
      strata.get(lab).push(r);
    });
  } else if (fbState.stratMode === 'sample') {
    // single-mode: each sample is its own stratum (used for drill-down only)
    return { strata, order: [] };
  }
  return { strata, order: Array.from(strata.keys()).sort() };
}

function plotGroupBoxes(hostId, field, label) {
  const host = document.getElementById(hostId);
  if (!host) return;
  const { strata, order } = strataAndLabels();
  const valid = order.filter(k => strata.get(k).some(r => r[field] != null));
  if (valid.length === 0) {
    host.innerHTML = '<div style="color:var(--ink-dim); padding:24px; text-align:center; font-style:italic; font-size:11px;">' +
      `${label}: data pending</div>`;
    return;
  }

  const W = 360, H = 200;
  const padL = 44, padR = 14, padT = 12, padB = 36;
  const allVals = valid.flatMap(k => strata.get(k).map(r => r[field]).filter(v => v != null && isFinite(v)));
  if (allVals.length === 0) {
    host.innerHTML = '<div style="color:var(--ink-dim); padding:24px; text-align:center; font-style:italic; font-size:11px;">' +
      `${label}: no valid values</div>`;
    return;
  }
  const vMin = Math.min(...allVals), vMax = Math.max(...allVals);
  const yS = linScale(vMax, vMin, padT, H - padB);
  const xS = (i) => padL + (i + 0.5) * ((W - padL - padR) / valid.length);

  const arr = buildSVG(W, H);
  const yt = niceTicks(vMin, vMax, 5);
  yt.forEach(v => {
    const y = yS(v);
    arr.push(`<line class="grid-line" x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}"/>`);
    arr.push(`<text class="axis-text" x="${padL-4}" y="${y+3}" text-anchor="end">${fmt3(v)}</text>`);
  });

  valid.forEach((k, i) => {
    const vals = strata.get(k).map(r => r[field]).filter(v => v != null && isFinite(v)).slice().sort((a, b) => a - b);
    if (vals.length === 0) return;
    const x = xS(i);
    const q25 = vals[Math.floor(vals.length * 0.25)];
    const q50 = vals[Math.floor(vals.length * 0.50)];
    const q75 = vals[Math.floor(vals.length * 0.75)];
    const lo = vals[0], hi = vals[vals.length - 1];
    const fill = (fbState.stratMode === 'K=8') ? kColor(k, CLUSTER_COLORS) : '#8aa6c7';

    arr.push(`<line x1="${x}" y1="${yS(lo)}" x2="${x}" y2="${yS(hi)}" stroke="#444" stroke-width="1"/>`);
    arr.push(`<rect x="${x-12}" y="${yS(q75)}" width="24" height="${yS(q25)-yS(q75)}" fill="${fill}" stroke="#222" stroke-width="0.8" opacity="0.85"/>`);
    arr.push(`<line x1="${x-12}" y1="${yS(q50)}" x2="${x+12}" y2="${yS(q50)}" stroke="#000" stroke-width="1.2"/>`);
    // strip overlay (jittered)
    vals.forEach((v, vi) => {
      const jitter = Math.sin((vi + 1) * 12.9898 + i * 78.233) * 0.4 * 12;
      arr.push(`<circle cx="${x + jitter}" cy="${yS(v)}" r="1.8" fill="#222" opacity="0.55"/>`);
    });
    arr.push(`<text class="axis-text" x="${x}" y="${H-padB+12}" text-anchor="middle">${k}</text>`);
  });
  arr.push(`<text class="axis-text" x="${(padL+W-padR)/2}" y="${H-4}" text-anchor="middle">${label}</text>`);
  host.innerHTML = svgClose(arr);
}

// ---------------------------------------------------------------------------
// Per-sample table
// ---------------------------------------------------------------------------
function isOutlier(r) {
  // VESM > cohort mean + 1.5σ OR LOF > cohort mean + 1.5σ OR πN/πS > mean + 1.5σ
  if (!MERGED) return false;
  const cols = ['vesm_burden', 'lof_count', 'piN_piS'];
  return cols.some(c => {
    const vals = MERGED.map(x => x[c]).filter(v => v != null && isFinite(v));
    if (vals.length === 0) return false;
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
    return r[c] != null && r[c] > mean + 1.5 * sd;
  });
}

function renderTable() {
  const tbody = document.querySelector('#fbTable tbody');
  const countEl = document.getElementById('fbCount');
  const tag = document.getElementById('fbTableTag');
  if (!tbody || !MERGED) return;

  let rows = MERGED.slice();
  if (fbState.search) {
    const q = fbState.search.toLowerCase();
    rows = rows.filter(r => (r.sample || '').toLowerCase().includes(q));
  }
  if (fbState.clusterFilter) rows = rows.filter(r => r.k8 === fbState.clusterFilter);
  if (fbState.tableMode === 'outliers') rows = rows.filter(isOutlier);

  rows.sort((a, b) => {
    const k = fbState.sortKey;
    const av = a[k], bv = b[k];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'string') return fbState.sortDesc ? bv.localeCompare(av) : av.localeCompare(bv);
    return fbState.sortDesc ? bv - av : av - bv;
  });

  tbody.innerHTML = rows.map(r => {
    const flagged = isOutlier(r);
    const cls = flagged ? ' class="outlier-hi"' : '';
    return `<tr${cls} data-sample="${r.sample}">
      <td>${r.sample}</td>
      <td>${clusterSwatch(r.k8, CLUSTER_COLORS)}</td>
      <td>${fmt3(r.f_roh)}</td>
      <td>${r.pi != null ? fmtSci(r.pi, 2) : '—'}</td>
      <td>${r.piN != null ? fmtSci(r.piN, 2) : '—'}</td>
      <td>${r.piS != null ? fmtSci(r.piS, 2) : '—'}</td>
      <td>${r.piN_piS != null ? fmt3(r.piN_piS) : '—'}</td>
      <td>${r.pi0_pi4 != null ? fmt3(r.pi0_pi4) : '—'}</td>
      <td>${r.vesm_burden != null ? fmt3(r.vesm_burden) : '—'}</td>
      <td>${r.lof_count != null ? r.lof_count : '—'}</td>
      <td>${r.splice_count != null ? r.splice_count : '—'}</td>
      <td>${r.vesm_in_roh_frac != null ? fmtPct(r.vesm_in_roh_frac) : '—'}</td>
    </tr>`;
  }).join('');

  if (countEl) countEl.textContent = `${rows.length} shown`;
  if (tag) tag.textContent = `${rows.length} / ${MERGED.length} rows`;
}

// ---------------------------------------------------------------------------
// ROH-overlap stripe — one stacked bar per group
// ---------------------------------------------------------------------------
function plotRohStripe() {
  const host = document.getElementById('plotFbRohStripe');
  if (!host) return;
  const { strata, order } = strataAndLabels();
  if (order.length === 0 || !hasBurden()) {
    host.innerHTML = '<div style="color:var(--ink-dim); padding:18px; text-align:center; font-style:italic; font-size:11px;">' +
      'ROH-overlap data pending.</div>';
    return;
  }
  const groups = order.map(k => {
    const vals = strata.get(k).map(r => r.vesm_in_roh_frac).filter(v => v != null);
    const mean = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    return { k, mean, n: vals.length };
  }).filter(g => g.mean != null);

  if (groups.length === 0) {
    host.innerHTML = '<div style="color:var(--ink-dim); padding:18px; text-align:center; font-style:italic; font-size:11px;">' +
      'No ROH-overlap fractions populated yet.</div>';
    return;
  }
  const W = 740, H = 30 * groups.length + 36;
  const padL = 60, padR = 80, padT = 8, padB = 22;
  const xS = linScale(0, 1, padL, W - padR);
  const arr = buildSVG(W, H);
  groups.forEach((g, i) => {
    const y = padT + i * 30 + 4;
    const inROH = xS(g.mean) - padL;
    const out = (W - padR) - xS(g.mean);
    arr.push(`<rect x="${padL}" y="${y}" width="${inROH}" height="22" fill="#c46b6b"/>`);
    arr.push(`<rect x="${xS(g.mean)}" y="${y}" width="${out}" height="22" fill="#e6e6e6"/>`);
    arr.push(`<text class="axis-text" x="${padL-6}" y="${y+14}" text-anchor="end">${g.k}</text>`);
    arr.push(`<text class="axis-text" x="${W-padR+6}" y="${y+14}" text-anchor="start">${fmtPct(g.mean)} in ROH</text>`);
  });
  arr.push(`<text class="axis-text" x="${(padL+W-padR)/2}" y="${H-4}" text-anchor="middle">fraction of VESM/LOF variants inside an ROH call</text>`);
  host.innerHTML = svgClose(arr);
}

// ---------------------------------------------------------------------------
// πN/πS in-context card (right-side mini table)
// ---------------------------------------------------------------------------
function renderPinPisCard() {
  const headline = document.getElementById('fbPinPisHeadline');
  const subline = document.getElementById('fbPinPisSubline');
  const tbody = document.querySelector('#fbPinPisTable tbody');
  if (!headline || !tbody) return;

  const c = (FB && FB.cohort_summary) || {};
  headline.textContent = c.piN_piS != null ? fmt3(c.piN_piS) : '—';
  if (c.piN_piS_ci && c.piN_piS_ci[0] != null) {
    subline.textContent = `cohort-wide value · 95 % CI ${fmt3(c.piN_piS_ci[0])} – ${fmt3(c.piN_piS_ci[1])}`;
  }

  const groups = (FB && FB.per_group && Array.isArray(FB.per_group['K=8'])) ? FB.per_group['K=8'] : [];
  if (groups.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--ink-dim); font-style:italic;">per-group data pending</td></tr>';
    return;
  }
  const sorted = groups.slice().sort((a, b) => (b.piN_piS || 0) - (a.piN_piS || 0));
  const max = Math.max(...groups.map(g => g.piN_piS || 0));
  tbody.innerHTML = sorted.map(g => {
    const t = max ? (g.piN_piS || 0) / max : 0;
    const bg = `rgba(196,107,107,${0.15 + 0.55 * t})`;
    return `<tr style="background:${bg};">
      <td>${clusterSwatch(g.group, CLUSTER_COLORS)}</td>
      <td>${g.n_samples || '—'}</td>
      <td>${g.pi != null ? fmtSci(g.pi, 2) : '—'}</td>
      <td>${g.piN_piS != null ? fmt3(g.piN_piS) : '—'}</td>
    </tr>`;
  }).join('');
}

// ---------------------------------------------------------------------------
// Transcript view — picker + lollipop renderer
// ---------------------------------------------------------------------------
function renderGenePicker() {
  const sel = document.getElementById('fbGenePicker');
  if (!sel) return;
  const byGroup = (FB && FB.top_burden_genes_by_group) || {};
  const transcripts = (FB && FB.transcripts) || {};
  const seen = new Set();
  let opts = '<option value="">— select gene —</option>';
  Object.entries(byGroup).forEach(([k, geneId]) => {
    if (!geneId || seen.has(geneId)) return;
    seen.add(geneId);
    const tx = Object.values(transcripts).find(t => t.gene_id === geneId);
    const symbol = (tx && tx.gene_symbol) || geneId;
    opts += `<option value="${geneId}">${k}: ${symbol}</option>`;
  });
  sel.innerHTML = opts;
}

function renderTranscriptView() {
  const host = document.getElementById('plotFbTranscript');
  const tag = document.getElementById('fbTranscriptTag');
  if (!host) return;
  const transcripts = (FB && FB.transcripts) || {};
  const tx = Object.values(transcripts).find(t => t.gene_id === fbState.selectedGene);
  if (!tx) {
    host.innerHTML = '<div style="color:var(--ink-dim); padding:24px; text-align:center; font-style:italic;">' +
      (fbState.selectedGene
        ? `No transcript payload for ${fbState.selectedGene} yet.`
        : 'Select a gene above to load its transcript track.') +
      '</div>';
    if (tag) tag.textContent = '⏳ awaiting transcripts payload';
    return;
  }
  if (tag) tag.textContent = `${tx.gene_symbol || tx.gene_id} · ${tx.chrom} · ${tx.exons ? tx.exons.length : 0} exons`;

  const W = 1100, H = 140;
  const padL = 30, padR = 30, padT = 30, padB = 40;
  const xS = linScale(tx.tx_start, tx.tx_end, padL, W - padR);
  const yMid = H / 2;
  const arr = buildSVG(W, H);

  arr.push(`<line x1="${padL}" y1="${yMid}" x2="${W-padR}" y2="${yMid}" stroke="#888" stroke-width="1"/>`);
  (tx.exons || []).forEach(ex => {
    const ex0 = xS(ex.start), ex1 = xS(ex.end);
    const fill = ex.type === 'CDS' ? '#3F4D6A' : '#bbb';
    arr.push(`<rect x="${ex0}" y="${yMid-10}" width="${Math.max(2, ex1-ex0)}" height="20" fill="${fill}"/>`);
  });

  (tx.variants || []).forEach((v, i) => {
    const x = xS(v.pos);
    const fill = SNPEFF_IMPACT_COLORS[v.snpeff_impact] || '#888';
    const score = v.vesm_score != null ? v.vesm_score : 0;
    const stroke = score > 0.8 ? '#8B0000' : score > 0.5 ? '#E07A1F' : '#444';
    const lh = 18 + score * 25;
    arr.push(`<line x1="${x}" y1="${yMid - 12}" x2="${x}" y2="${yMid - lh}" stroke="${stroke}" stroke-width="1"/>`);
    arr.push(`<circle data-i="${i}" data-variant="${v.pos}_${v.alt}" cx="${x}" cy="${yMid - lh}" r="4.5" fill="${fill}" stroke="${stroke}" stroke-width="1.2" style="cursor:pointer;"/>`);
    if (v.splice_event) {
      const marker = v.splice_event.event && v.splice_event.event.includes('gain') ? '▲' : '▼';
      arr.push(`<text x="${x}" y="${yMid + 26}" text-anchor="middle" style="font-size:10px;">${marker}</text>`);
    }
  });

  arr.push(`<text class="axis-text" x="${padL}" y="${H-padB+14}" text-anchor="start">${(tx.tx_start/1e6).toFixed(2)} Mb</text>`);
  arr.push(`<text class="axis-text" x="${W-padR}" y="${H-padB+14}" text-anchor="end">${(tx.tx_end/1e6).toFixed(2)} Mb</text>`);
  arr.push(`<text class="axis-text" x="${(padL+W-padR)/2}" y="${H-4}" text-anchor="middle">${tx.gene_symbol || tx.gene_id} · ${tx.chrom} (${tx.strand})</text>`);

  host.innerHTML = svgClose(arr);
  const svgEl = host.querySelector('svg');
  svgEl.querySelectorAll('circle[data-variant]').forEach(c => {
    const i = +c.getAttribute('data-i');
    const v = tx.variants[i];
    c.addEventListener('mouseenter', e => showTip(e,
      `<b>${v.csq_hgvsp || (v.ref+'→'+v.alt)}</b><div class="row">${v.consequence}</div>` +
      `<div class="row">snpEff ${v.snpeff_impact}</div>` +
      `<div class="row">VESM ${v.vesm_score != null ? fmt3(v.vesm_score) : '—'}</div>` +
      `<div class="row">${v.n_carriers || 0} carriers</div>`));
    c.addEventListener('mousemove', e => showTip(e));
    c.addEventListener('mouseleave', hideTip);
    c.addEventListener('click', () => {
      const variantId = `${tx.chrom}:${v.pos}:${v.ref}:${v.alt}`;
      fbState.selectedVariant = variantId;
      renderMsa();
    });
  });
}

// ---------------------------------------------------------------------------
// MSA panel — load pre-rendered SVG from FB.msa_links
// ---------------------------------------------------------------------------
function renderMsa() {
  const host = document.getElementById('fbMsaHost');
  const tag = document.getElementById('fbMsaTag');
  if (!host) return;
  const id = fbState.selectedVariant;
  if (!id) {
    host.innerHTML = 'no variant selected';
    if (tag) tag.textContent = 'click a lollipop above';
    return;
  }
  const links = (FB && FB.msa_links) || {};
  const path = links[id];
  if (!path) {
    host.innerHTML = `MSA SVG not available for <code>${id}</code> yet. pyMSAviz pre-rendering may not have run for this variant.`;
    if (tag) tag.textContent = `${id} — no MSA SVG`;
    return;
  }
  host.innerHTML = `<img src="${path}" alt="MSA for ${id}" style="max-width:100%; height:auto;"/>`;
  if (tag) tag.textContent = id;
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
function fbRenderAll() {
  fbTopStrip();
  plotVariantInventory();
  plotSnpeffTotals();
  plotGerp();
  plotGroupBoxes('plotFbPinPis', 'piN_piS',   'π_N/π_S');
  plotGroupBoxes('plotFbPi0Pi4', 'pi0_pi4',  'π_0/π_4');
  plotGroupBoxes('plotFbVesm',   'vesm_burden', 'VESM burden');
  plotGroupBoxes('plotFbLof',    'lof_count',  'LOF count');
  plotRohStripe();
  renderTable();
  renderPinPisCard();
  renderGenePicker();
  renderTranscriptView();
  renderMsa();
}

function fbWire() {
  // Stratification pills
  const stratHost = document.getElementById('fbStratPills');
  if (stratHost) {
    mountStratificationPills(stratHost, {
      initial: fbState.stratMode,
      familyAvailable: familyAvailable(),
      onChange: m => {
        fbState.stratMode = m;
        const tag = document.getElementById('fbStratTag');
        if (tag) tag.textContent = `mode: ${m}`;
        plotGroupBoxes('plotFbPinPis', 'piN_piS',   'π_N/π_S');
        plotGroupBoxes('plotFbPi0Pi4', 'pi0_pi4',  'π_0/π_4');
        plotGroupBoxes('plotFbVesm',   'vesm_burden', 'VESM burden');
        plotGroupBoxes('plotFbLof',    'lof_count',  'LOF count');
        plotRohStripe();
      },
    });
  }

  // Table mode pills
  document.querySelectorAll('.pill[data-fb-table-mode]').forEach(p => {
    p.addEventListener('click', () => {
      document.querySelectorAll('.pill[data-fb-table-mode]').forEach(x => x.classList.remove('on'));
      p.classList.add('on');
      fbState.tableMode = p.dataset.fbTableMode;
      renderTable();
    });
  });

  // Search + cluster filter
  const search = document.getElementById('fbSearch');
  if (search) search.addEventListener('input', e => { fbState.search = e.target.value; renderTable(); });
  const cf = document.getElementById('fbClusterFilter');
  if (cf) {
    const ks = Array.from(new Set((D.S1 || []).map(s => s.k8).filter(Boolean))).sort();
    ks.forEach(k => { cf.innerHTML += `<option value="${k}">${k}</option>`; });
    cf.addEventListener('change', e => { fbState.clusterFilter = e.target.value; renderTable(); });
  }

  // Table sorting via header click
  document.querySelectorAll('#fbTable th[data-sort]').forEach(th => {
    th.style.cursor = 'pointer';
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (fbState.sortKey === k) fbState.sortDesc = !fbState.sortDesc;
      else { fbState.sortKey = k; fbState.sortDesc = true; }
      renderTable();
    });
  });

  // Table row click → drill-down (sets sample for the per-sample stratification mode)
  document.querySelector('#fbTable tbody').addEventListener('click', e => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    fbState.selectedSample = tr.dataset.sample;
  });

  // GERP toggle
  const gerpToggle = document.getElementById('fbGerpToggle');
  const gerpStatus = document.getElementById('fbGerpStatus');
  if (gerpToggle) {
    gerpToggle.addEventListener('click', () => {
      fbState.gerpEnabled = !fbState.gerpEnabled;
      gerpToggle.classList.toggle('on', fbState.gerpEnabled);
      gerpToggle.textContent = fbState.gerpEnabled ? 'disable GERP panel' : 'enable GERP panel';
      if (gerpStatus) gerpStatus.textContent = fbState.gerpEnabled
        ? (hasGerp() ? 'GERP track loaded' : 'enabled — no data yet')
        : 'data pending';
      plotGerp();
    });
  }

  // Gene picker
  const genePicker = document.getElementById('fbGenePicker');
  if (genePicker) genePicker.addEventListener('change', e => {
    fbState.selectedGene = e.target.value || null;
    fbState.selectedVariant = null;
    renderTranscriptView();
    renderMsa();
  });
  const geneSearch = document.getElementById('fbGeneSearch');
  if (geneSearch) geneSearch.addEventListener('change', e => {
    const q = (e.target.value || '').trim();
    if (!q) return;
    const transcripts = (FB && FB.transcripts) || {};
    const hit = Object.values(transcripts).find(t =>
      (t.gene_symbol && t.gene_symbol.toLowerCase() === q.toLowerCase()) ||
      t.gene_id === q);
    if (hit) {
      fbState.selectedGene = hit.gene_id;
      fbState.selectedVariant = null;
      renderTranscriptView();
      renderMsa();
    }
  });
}

// ---------------------------------------------------------------------------
// mount / unmount
// ---------------------------------------------------------------------------
export async function mount(root, atlasState, registry) {
  ensureTip();
  const ctx = await ensureData();
  D = ctx.D;
  CLUSTER_COLORS = ctx.CLUSTER_COLORS;
  FB = ctx.FUNCTIONAL_BURDEN;

  const missing = document.getElementById('fbMissingCard');
  if (missing) missing.style.display = hasBurden() || hasInventory() ? 'none' : 'block';

  buildMerged();
  fbWire();
  fbRenderAll();
}

export async function unmount(root) {
  // Router replaces the page wholesale; nothing to tear down.
}
