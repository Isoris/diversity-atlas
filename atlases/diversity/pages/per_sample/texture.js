// =============================================================================
// atlases/diversity/pages/per_sample/texture.js — Per-sample texture (DDI, χ_min)
// =============================================================================
// Stage:        per_sample
// New page:     2026-05-12 (this round) — companion to the F_ROH|H framework.
//
// Reads:
//   D.S1                 — for K=8 ancestry, F_ROH, and genome-wide H per sample.
//   D.WIN_METRICS        — optional texture-metrics payload loaded by
//                          shared/data_loader.js. Absent / empty payload
//                          triggers the placeholder render path. See the
//                          schema block in page9.html for the canonical shape.
//
// Computes nothing on the client beyond:
//   - cohort summary fall-back (if WIN_METRICS.cohort_summary fields are null)
//   - four-class quadrant assignment (mosaic_rich, mosaic_poor,
//     diffuse_diverse, diffuse_depleted)
//
// All real numerics (DDI, χ_min, median/MAD H_w, per-sample H_w arrays) come
// from the upstream pipeline (catfish-diversity-analysis phase_2_discovery
// step 04, to be written).
// =============================================================================

import { ensureData } from '../../shared/data_loader.js';
import { ensureTip }  from '../../shared/tooltip.js';
import { fmtSci, fmt3, fmtH, clusterSwatch } from '../../shared/formatters.js';
import { plotScatter } from '../../shared/plots.js';
import { buildSVG, svgClose, linScale, niceTicks } from '../../shared/svg.js';
import { probeModeB, renderModeBBadge } from '../../../../core/mode_b_badge.js';

// ─── Mode-B cross-check ─────────────────────────────────────────────────
// texture_metrics_payload is loaded today as a stub (`{}` placeholder). The
// probe surfaces "○ data pending" until the upstream pipeline
// (04_window_H_and_DDI.sh) ships a real payload; flips to ● when per_sample[]
// is populated and matches the cohort N (226).

function _extractTextureRows(payload) {
  return (payload && Array.isArray(payload.per_sample)) ? payload.per_sample : null;
}

function _compareTexture(probeResult) {
  const carveN = 226;   // cohort size (could read D.globals.n_samples but the
                        // texture page renders before D is populated by mount)
  const pass = probeResult.n >= 200;   // tolerate a few drops
  const cohortMed = (probeResult.payload && probeResult.payload.cohort_summary
                     && probeResult.payload.cohort_summary.median_h_gw);
  const medStr = (typeof cohortMed === 'number') ? cohortMed.toExponential(2) : '—';
  return {
    pass,
    summary: `${probeResult.n}/${carveN} samples · cohort median H_w = ${medStr}`,
  };
}

const txState = {
  classFilter: 'all',
  clusterFilter: '',
  selectedSample: null,
};

let D = null;
let WM = null;            // texture payload (or null when pending)
let CLUSTER_COLORS = null;
let MERGED = null;        // joined per-sample rows: S1 ∪ WM.per_sample
let COHORT = null;        // { h_med, ddi_med, ddi_p25, ddi_p75, ... }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function quantile(arr, q) {
  const xs = arr.filter(v => v != null && isFinite(v)).slice().sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const idx = (xs.length - 1) * q;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return xs[lo];
  return xs[lo] + (xs[hi] - xs[lo]) * (idx - lo);
}

function median(arr) { return quantile(arr, 0.5); }

function classifyQuadrant(h, ddi, hMed, ddiMed) {
  if (h == null || ddi == null || hMed == null || ddiMed == null) return null;
  const hHi = h >= hMed, ddiHi = ddi >= ddiMed;
  if (hHi && ddiHi)   return 'mosaic_rich';
  if (hHi && !ddiHi)  return 'diffuse_diverse';
  if (!hHi && ddiHi)  return 'mosaic_poor';
  return 'diffuse_depleted';
}

function hasTexture() {
  return WM && Array.isArray(WM.per_sample) && WM.per_sample.length > 0
      && WM.per_sample.some(r => r.ddi != null);
}

// ---------------------------------------------------------------------------
// Merge S1 + WM per_sample into a single working set
// ---------------------------------------------------------------------------
function buildMerged() {
  const wmIdx = new Map();
  if (WM && Array.isArray(WM.per_sample)) {
    WM.per_sample.forEach(r => wmIdx.set(r.sample, r));
  }
  MERGED = D.S1.map(s => {
    const w = wmIdx.get(s.sample) || {};
    return {
      sample: s.sample,
      k8: s.k8,
      f_roh: s.f_roh,
      h_gw: w.h_gw != null ? w.h_gw : s.h,
      ddi: w.ddi != null ? w.ddi : null,
      chi_min: w.chi_min != null ? w.chi_min : null,
      chi_min_chr: w.chi_min_chr || null,
      chi_min_pos: w.chi_min_pos != null ? w.chi_min_pos : null,
      median_H_w: w.median_H_w != null ? w.median_H_w : null,
      mad_H_w: w.mad_H_w != null ? w.mad_H_w : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Cohort summary (use WM.cohort_summary when populated, else fall back)
// ---------------------------------------------------------------------------
function buildCohort() {
  const s = (WM && WM.cohort_summary) || {};
  const hs   = MERGED.map(r => r.h_gw);
  const ddis = MERGED.map(r => r.ddi);
  COHORT = {
    n_samples:      s.n_samples != null      ? s.n_samples      : MERGED.length,
    n_windows:      s.n_windows != null      ? s.n_windows      : null,
    h_gw_median:    s.h_gw_median != null    ? s.h_gw_median    : median(hs),
    ddi_median:     s.ddi_median != null     ? s.ddi_median     : median(ddis),
    ddi_p25:        s.ddi_p25 != null        ? s.ddi_p25        : quantile(ddis, 0.25),
    ddi_p75:        s.ddi_p75 != null        ? s.ddi_p75        : quantile(ddis, 0.75),
    ddi_min:        s.ddi_min != null        ? s.ddi_min        : quantile(ddis, 0.00),
    ddi_max:        s.ddi_max != null        ? s.ddi_max        : quantile(ddis, 1.00),
    chi_min_median: s.chi_min_median != null ? s.chi_min_median : median(MERGED.map(r => r.chi_min)),
  };
}

// ---------------------------------------------------------------------------
// Top strip
// ---------------------------------------------------------------------------
function txTopStrip() {
  const params = (WM && WM.params) || {};
  const winKb = params.win_kb != null ? params.win_kb + ' kb' : '— kb';
  const status = hasTexture() ? 'ready' : 'pending';
  const cells = [
    { lbl: 'window size',     val: winKb,                                       sub: 'non-overlapping' },
    { lbl: 'n windows',       val: COHORT.n_windows != null ? COHORT.n_windows.toLocaleString() : '—', sub: 'after callable filter' },
    { lbl: 'cohort median H', val: fmtSci(COHORT.h_gw_median, 2),               sub: 'genome-wide' },
    { lbl: 'cohort median DDI', val: COHORT.ddi_median != null ? fmt3(COHORT.ddi_median) : '—',
                                                                                sub: 'MAD/median across H_w' },
    { lbl: 'DDI IQR',         val: (COHORT.ddi_p25 != null && COHORT.ddi_p75 != null)
                                    ? (fmt3(COHORT.ddi_p25) + '–' + fmt3(COHORT.ddi_p75)) : '—',
                                                                                sub: 'within-cohort spread' },
    { lbl: 'status',          val: status,                                      sub: status === 'ready' ? 'texture_metrics.json loaded' : 'awaiting pipeline step 04' },
  ];
  const host = document.getElementById('txTopStrip');
  if (!host) return;
  host.innerHTML = cells.map(c =>
    `<div class="stat-cell"><div class="lbl">${c.lbl}</div>` +
    `<div class="val">${c.val}</div><div class="sub">${c.sub}</div></div>`
  ).join('');
}

// ---------------------------------------------------------------------------
// Filter logic
// ---------------------------------------------------------------------------
function txApply() {
  let rows = MERGED.slice();
  if (txState.clusterFilter) rows = rows.filter(r => r.k8 === txState.clusterFilter);
  if (txState.classFilter && txState.classFilter !== 'all') {
    rows = rows.filter(r => {
      const q = classifyQuadrant(r.h_gw, r.ddi, COHORT.h_gw_median, COHORT.ddi_median);
      return q === txState.classFilter;
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Scatter plot — DDI × H
// ---------------------------------------------------------------------------
function plotScatterDdiH() {
  const rows = txApply();
  document.getElementById('txCount').textContent = rows.length + ' / ' + MERGED.length + ' samples shown';
  document.getElementById('txScatterTag').textContent = MERGED.length + ' rows';

  if (!hasTexture()) {
    const host = document.getElementById('plotDdiVsH');
    if (host) host.innerHTML = '<div style="color:var(--ink-dim); padding:24px; text-align:center; font-style:italic;">DDI values not yet computed — see the &ldquo;data pending&rdquo; card above.</div>';
    return;
  }

  const fRohMax = Math.max(...MERGED.map(r => r.f_roh || 0));
  const points = rows.map(r => {
    const sizeBase = 2.4;
    const sizeMax  = 5.8;
    const sz = sizeBase + (sizeMax - sizeBase) * ((r.f_roh || 0) / (fRohMax || 1));
    const q = classifyQuadrant(r.h_gw, r.ddi, COHORT.h_gw_median, COHORT.ddi_median);
    return {
      x: r.h_gw,
      y: r.ddi,
      color: CLUSTER_COLORS[r.k8] || '#888',
      r: sz,
      tooltip:
        `<b>${r.sample}</b> · ${r.k8}` +
        `<div class="row">H = ${fmtH(r.h_gw)}</div>` +
        `<div class="row">DDI = ${fmt3(r.ddi)}</div>` +
        `<div class="row">χ<sub>min</sub> = ${fmt3(r.chi_min)} @ ${r.chi_min_chr || '—'}</div>` +
        `<div class="row">F_ROH = ${fmt3(r.f_roh)}</div>` +
        (q ? `<div class="row" style="color:var(--accent);">${q.replace('_', '-')}</div>` : ''),
      _sample: r.sample,
    };
  });

  const hs   = MERGED.map(r => r.h_gw).filter(v => v != null);
  const ddis = MERGED.map(r => r.ddi).filter(v => v != null);
  const xMin = Math.min(...hs) * 0.95;
  const xMax = Math.max(...hs) * 1.02;
  const yMin = Math.min(0, Math.min(...ddis) * 0.95);
  const yMax = Math.max(...ddis) * 1.05;

  plotScatter('plotDdiVsH', points, {
    xMin, xMax, yMin, yMax,
    xFmt: v => fmtSci(v, 2), yFmt: fmt3,
    xLabel: 'genome-wide H', yLabel: 'DDI (MAD/median H_w)',
    annot: 'cohort med H = ' + fmtSci(COHORT.h_gw_median, 2) +
           '  ·  med DDI = ' + fmt3(COHORT.ddi_median),
    W: 720, H: 320, padL: 64, padR: 18, padT: 14, padB: 40, r: 3.0,
  });

  // Overlay quadrant reference lines + click handlers (plotScatter doesn't
  // expose these so we patch them on after the fact).
  const host = document.getElementById('plotDdiVsH');
  const svg = host && host.querySelector('svg');
  if (svg) {
    const W = 720, H = 320, padL = 64, padR = 18, padT = 14, padB = 40;
    const xS = linScale(xMin, xMax, padL, W - padR);
    const yS = linScale(yMin, yMax, H - padB, padT);
    const xMed = xS(COHORT.h_gw_median), yMed = yS(COHORT.ddi_median);
    const refs = `
      <line class="ref-line" x1="${xMed}" y1="${padT}" x2="${xMed}" y2="${H-padB}" stroke-dasharray="3,3"/>
      <line class="ref-line" x1="${padL}" y1="${yMed}" x2="${W-padR}" y2="${yMed}" stroke-dasharray="3,3"/>
      <text class="annot-text" x="${W-padR-4}" y="${padT+10}" text-anchor="end" font-weight="600">mosaic-rich</text>
      <text class="annot-text" x="${padL+4}"   y="${padT+10}" font-weight="600">mosaic-poor</text>
      <text class="annot-text" x="${W-padR-4}" y="${H-padB-4}" text-anchor="end" font-weight="600">diffuse-diverse</text>
      <text class="annot-text" x="${padL+4}"   y="${H-padB-4}" font-weight="600">diffuse-depleted</text>`;
    svg.insertAdjacentHTML('beforeend', refs);

    svg.querySelectorAll('circle[data-i]').forEach(c => {
      const i = +c.getAttribute('data-i');
      const p = points[i];
      if (!p) return;
      c.style.cursor = 'pointer';
      c.addEventListener('click', () => {
        txState.selectedSample = p._sample;
        renderStrip(p._sample);
      });
    });
  }
}

// ---------------------------------------------------------------------------
// Per-window strip plot (per sample, on click)
// ---------------------------------------------------------------------------
function renderStrip(sampleId) {
  const host = document.getElementById('plotTxStrip');
  const tag = document.getElementById('txStripTag');
  if (!host) return;

  const row = MERGED.find(r => r.sample === sampleId);
  if (!row) return;

  if (tag) tag.textContent = sampleId;

  const hw      = (WM && WM.per_sample_H_w) ? WM.per_sample_H_w[sampleId] : null;
  const windows = WM && WM.windows;
  const chroms  = windows && Array.isArray(windows.chroms) ? windows.chroms : null;
  const cohMed  = windows && Array.isArray(windows.cohort_median_H_w) ? windows.cohort_median_H_w : null;
  const cohQ25  = windows && Array.isArray(windows.cohort_q25_H_w)    ? windows.cohort_q25_H_w    : null;
  const cohQ75  = windows && Array.isArray(windows.cohort_q75_H_w)    ? windows.cohort_q75_H_w    : null;

  if (!hw || !chroms || !cohMed) {
    host.innerHTML = '<div style="color:var(--ink-dim); padding:24px; text-align:center; font-style:italic;">' +
      'Per-window H<sub>w</sub> arrays not yet available for ' + sampleId + '. ' +
      'Pipeline step 04 produces <code>per_sample_H_w</code> in <code>texture_metrics.json</code>.' +
      '</div>';
    renderSampleDetail(row);
    return;
  }

  // Build a flat x-position vector and chrom-boundary positions
  let totalWin = 0;
  const boundaries = [];
  chroms.forEach((c, ci) => {
    if (ci > 0) boundaries.push(totalWin);
    totalWin += c.n_windows;
  });
  const W = 1180, H = 220;
  const padL = 56, padR = 14, padT = 12, padB = 32;
  const xS = linScale(0, totalWin, padL, W - padR);

  const valid = hw.filter(v => v != null && isFinite(v));
  const yVals = valid.concat(cohQ75.filter(v => v != null && isFinite(v)));
  const yMin = 0;
  const yMax = Math.max(...yVals) * 1.05;
  const yS = linScale(yMin, yMax, H - padB, padT);

  const arr = buildSVG(W, H);

  // Cohort Q25–Q75 ribbon (filled polygon, top = Q75, bottom = Q25)
  if (cohQ25 && cohQ75 && cohQ25.length === totalWin && cohQ75.length === totalWin) {
    const top = [], bot = [];
    for (let i = 0; i < totalWin; i++) {
      if (cohQ75[i] != null) top.push(xS(i) + ',' + yS(cohQ75[i]));
      if (cohQ25[i] != null) bot.push(xS(i) + ',' + yS(cohQ25[i]));
    }
    if (top.length > 0 && bot.length > 0) {
      const pts = top.join(' ') + ' ' + bot.reverse().join(' ');
      arr.push(`<polygon points="${pts}" fill="var(--ink-dim)" fill-opacity="0.15" stroke="none"/>`);
    }
  }

  // Cohort median line
  if (cohMed.length === totalWin) {
    let path = '';
    let started = false;
    for (let i = 0; i < totalWin; i++) {
      const v = cohMed[i];
      if (v == null) { started = false; continue; }
      const cmd = started ? 'L' : 'M';
      path += `${cmd}${xS(i)},${yS(v)} `;
      started = true;
    }
    if (path) arr.push(`<path d="${path}" fill="none" stroke="var(--ink-dim)" stroke-width="1" stroke-opacity="0.7"/>`);
  }

  // Sample H_w line
  let path = '';
  let started = false;
  for (let i = 0; i < totalWin; i++) {
    const v = hw[i];
    if (v == null) { started = false; continue; }
    const cmd = started ? 'L' : 'M';
    path += `${cmd}${xS(i)},${yS(v)} `;
    started = true;
  }
  if (path) arr.push(`<path d="${path}" fill="none" stroke="${CLUSTER_COLORS[row.k8] || 'var(--accent)'}" stroke-width="1.2"/>`);

  // Chromosome boundaries + labels
  let off = 0;
  chroms.forEach((c, ci) => {
    if (ci > 0) {
      const x = xS(off);
      arr.push(`<line class="grid-line" x1="${x}" y1="${padT}" x2="${x}" y2="${H-padB}" stroke-opacity="0.5"/>`);
    }
    const xMid = xS(off + c.n_windows / 2);
    if (ci % 2 === 0 || chroms.length <= 14) {
      arr.push(`<text class="axis-text" font-size="9" x="${xMid}" y="${H-padB+12}" text-anchor="middle">${c.chr}</text>`);
    }
    off += c.n_windows;
  });

  // y axis
  const yt = niceTicks(yMin, yMax, 5);
  yt.forEach(v => {
    const y = yS(v);
    arr.push(`<line class="grid-line" x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke-opacity="0.4"/>`);
    arr.push(`<text class="axis-text" x="${padL-4}" y="${y+3}" text-anchor="end">${fmtSci(v, 1)}</text>`);
  });
  arr.push(`<line class="axis-line" x1="${padL}" y1="${padT}" x2="${padL}" y2="${H-padB}"/>`);
  arr.push(`<line class="axis-line" x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}"/>`);

  // Sample median H_w reference
  if (row.median_H_w != null) {
    const y = yS(row.median_H_w);
    arr.push(`<line class="ref-line" x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke-dasharray="3,3"/>`);
    arr.push(`<text class="annot-text" x="${W-padR-4}" y="${y-3}" text-anchor="end">sample median H_w</text>`);
  }

  // χ_min window marker
  if (row.chi_min_chr && row.chi_min_pos != null) {
    let off2 = 0, hit = null;
    for (const c of chroms) {
      if (c.chr === row.chi_min_chr) {
        // Approximate window index from genomic position; pipeline step 04
        // can later emit chi_min_window_idx directly to avoid this estimate.
        const winBp = (WM && WM.params && WM.params.win_kb) ? WM.params.win_kb * 1000 : 50000;
        const idx = Math.floor(row.chi_min_pos / winBp);
        hit = off2 + Math.min(idx, c.n_windows - 1);
        break;
      }
      off2 += c.n_windows;
    }
    if (hit != null) {
      const xh = xS(hit);
      const yh = hw[hit] != null ? yS(hw[hit]) : H - padB - 4;
      arr.push(`<circle cx="${xh}" cy="${yh}" r="4" fill="var(--bad, #c64a4a)" fill-opacity="0.85" stroke="var(--bad, #c64a4a)" stroke-width="1"/>`);
      arr.push(`<text class="annot-text" x="${xh}" y="${yh-8}" text-anchor="middle" fill="var(--bad, #c64a4a)">χ<tspan font-size="7" dy="2">min</tspan></text>`);
    }
  }

  arr.push(`<text class="axis-text" x="${(padL+W-padR)/2}" y="${H-4}" text-anchor="middle">genome position (chromosomes concatenated)</text>`);

  host.innerHTML = svgClose(arr);
  renderSampleDetail(row);
}

function renderSampleDetail(row) {
  const card = document.getElementById('txSampleDetail');
  if (!card) return;
  card.style.display = 'block';
  document.getElementById('txdTitle').textContent = row.sample;

  const q = classifyQuadrant(row.h_gw, row.ddi, COHORT.h_gw_median, COHORT.ddi_median);
  const qLabel = q ? q.replace('_', '-') : '—';
  document.getElementById('txdSubtitle').innerHTML =
    'Ancestry ' + clusterSwatch(row.k8, CLUSTER_COLORS) +
    ' · class <b style="color:var(--accent);">' + qLabel + '</b>' +
    ' · F_ROH ' + fmt3(row.f_roh);

  const ddiArr     = MERGED.map(r => r.ddi).filter(v => v != null && isFinite(v)).sort((a,b)=>a-b);
  const chiArr     = MERGED.map(r => r.chi_min).filter(v => v != null && isFinite(v)).sort((a,b)=>a-b);
  const rankOf = (sorted, v) => {
    if (v == null || sorted.length === 0) return null;
    let i = 0;
    while (i < sorted.length && sorted[i] <= v) i++;
    return 100 * i / sorted.length;
  };

  const cells = [
    { lbl: 'H (genome-wide)', val: fmtH(row.h_gw),
      sub: 'cohort median ' + fmtSci(COHORT.h_gw_median, 2) },
    { lbl: 'DDI',             val: row.ddi != null ? fmt3(row.ddi) : '—',
      sub: row.ddi != null ? ('percentile ' + (rankOf(ddiArr, row.ddi) || 0).toFixed(0)) : '—' },
    { lbl: 'median H_w',      val: fmtSci(row.median_H_w, 2),
      sub: 'per-window median' },
    { lbl: 'MAD H_w',         val: fmtSci(row.mad_H_w, 2),
      sub: 'robust dispersion' },
    { lbl: 'χ_min',           val: row.chi_min != null ? fmt3(row.chi_min) : '—',
      sub: row.chi_min != null ? ('percentile ' + (rankOf(chiArr, row.chi_min) || 0).toFixed(0)) : '—' },
    { lbl: 'χ_min locus',     val: row.chi_min_chr || '—',
      sub: row.chi_min_pos != null ? ('@ ' + (row.chi_min_pos / 1e6).toFixed(2) + ' Mb') : '—' },
  ];
  document.getElementById('txdGrid').innerHTML = cells.map(c =>
    `<div><div class="lbl">${c.lbl}</div><div class="val">${c.val}</div>` +
    `<div style="font-size:9.5px;color:var(--ink-dim);margin-top:2px;">${c.sub}</div></div>`
  ).join('');

  let notes = '';
  if (q === 'mosaic_rich')
    notes += '· Mosaic-rich: high H combined with high DDI. Likely carrier of heterozygous large inversions or recently introgressed segments — high broodstock priority for genetic-rescue F1 propagation. ';
  else if (q === 'mosaic_poor')
    notes += '· Mosaic-poor: collapsed background with retained diversity pockets. Useful diagnostic of partial outbreeding on an otherwise homozygous chassis. ';
  else if (q === 'diffuse_diverse')
    notes += '· Diffusely diverse: high H spread evenly across the genome. Average breeding value, lower mechanistic rescue potential per allele. ';
  else if (q === 'diffuse_depleted')
    notes += '· Diffusely depleted: sustained drift, low H without compensating peaks. ';
  if (row.chi_min != null && row.chi_min < 0.25)
    notes += '· χ_min &lt; 0.25 — a sub-chromosomal collapse zone exists; check overlap with ROH atlas. ';
  if (!notes) notes = '· No flags raised.';
  document.getElementById('txdNotes').textContent = notes;
}

function closeTxDetail() {
  const card = document.getElementById('txSampleDetail');
  if (card) card.style.display = 'none';
  txState.selectedSample = null;
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
function txWire() {
  const sel = document.getElementById('txClusterFilter');
  if (sel && D.S9) {
    D.S9.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.k; opt.textContent = c.k + ' (n=' + c.n + ')';
      sel.appendChild(opt);
    });
    sel.addEventListener('change', e => {
      txState.clusterFilter = e.target.value;
      plotScatterDdiH();
    });
  }
  document.querySelectorAll('.pill[data-tx-class]').forEach(p => {
    p.addEventListener('click', () => {
      txState.classFilter = p.dataset.txClass;
      document.querySelectorAll('.pill[data-tx-class]').forEach(x => x.classList.remove('on'));
      p.classList.add('on');
      plotScatterDdiH();
    });
  });
  const closeBtn = document.querySelector('#txSampleDetail [data-action="closeTxDetail"]');
  if (closeBtn) closeBtn.addEventListener('click', closeTxDetail);
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------
export async function mount(root, atlasState, registry) {
  ensureTip();
  const ctx = await ensureData();
  D = ctx.D;
  CLUSTER_COLORS = ctx.CLUSTER_COLORS;
  WM = ctx.WIN_METRICS;

  // Show the pending-data card when the texture payload is absent or empty.
  const missing = document.getElementById('txMissingCard');
  if (missing) missing.style.display = hasTexture() ? 'none' : 'block';

  buildMerged();
  buildCohort();
  txTopStrip();
  txWire();
  plotScatterDdiH();

  // Mode-B probe — non-blocking. Will report stub-payload today; flips to
  // ● when the upstream pipeline ships a populated per_sample[].
  probeModeB(registry, 'texture_metrics_payload', {}, { extractRows: _extractTextureRows })
    .then((r) => renderModeBBadge('txModeBBadge', r, {
      label:    'texture metrics',
      layerKey: 'texture_metrics_payload',
      compare:  _compareTexture,
      provenance: ctx.PROVENANCE,
    }))
    .catch(() => renderModeBBadge('txModeBBadge', { ok: false, reason: 'unknown' }, {
      label: 'texture metrics', layerKey: 'texture_metrics_payload',
      provenance: ctx.PROVENANCE,
    }));
}

export async function unmount(root) {
  // Page is replaced wholesale by the router on next navigate.
}
