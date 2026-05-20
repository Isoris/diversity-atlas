// =============================================================================
// atlases/diversity/pages/per_chromosome/hotspots.js — θπ hotspots
// =============================================================================
// Stage:        per_chromosome
// Legacy DOM:   <div id="page3"> (renamed -> id="hotspots") (Diversity_atlas.html v2.4 lines 630-696)
// Renderers:    clusterizeOutliers, hsRender, plotsPage3 (legacy 2463-2579).
// =============================================================================

import { ensureData } from '../../shared/data_loader.js';
import { ensureTip }  from '../../shared/tooltip.js';
import { bindTip }    from '../../shared/tooltip.js';
import { fmtSci, fmt2, fmt3 } from '../../shared/formatters.js';
import { sortRows, applySortIndicators } from '../../shared/tables.js';
import { plotHeatmap } from '../../shared/plots.js';
import {
  buildSVG, svgClose, linScale, niceTicks, makeWarmScale
} from '../../shared/svg.js';
import {
  probeModeB, renderModeBBadge, distinctCount
} from '../../../../core/mode_b_badge.js';

let D = null;

// ─── Mode-B cross-check ─────────────────────────────────────────────────
// Probes one representative sample's pestPG at the fine 10 kb scale (the
// resolution at which the hotspot scan operates) and checks: (a) windows
// cover all 28 chroms, (b) per-window max θπ rises above the carve's
// 5.27e-3 hotspot threshold somewhere on the genome.

const _PROBE_SAMPLE_ID = 'CGA009';
const _PROBE_WIN_BP    = 10000;
const _PROBE_STEP_BP   = 2000;
const _HOTSPOT_PI_FLOOR = 5.27e-3;   // matches subtitle's 99th-percentile threshold

function _compareHotspots(probeResult) {
  const rows = probeResult.rows;
  const nChroms = distinctCount(rows, 'Chr');
  let maxPi = -Infinity;
  for (const r of rows) {
    const tP = r && r.tP, ns = r && r.nSites;
    if (typeof tP === 'number' && typeof ns === 'number' && ns > 0) {
      const pi = tP / ns;
      if (pi > maxPi) maxPi = pi;
    }
  }
  const haveMax = Number.isFinite(maxPi);
  const chromsOk = (nChroms === 28);
  const peakOk = haveMax && maxPi >= _HOTSPOT_PI_FLOOR;
  const pass = chromsOk && peakOk;
  const peakStr = haveMax ? maxPi.toExponential(2) : '—';
  const verdict = (!chromsOk)
    ? `(expected 28 chroms, got ${nChroms})`
    : (!peakOk)
      ? `(no window above hotspot floor ${_HOTSPOT_PI_FLOOR.toExponential(2)})`
      : `(peak above carve hotspot floor ${_HOTSPOT_PI_FLOOR.toExponential(2)})`;
  return {
    pass,
    summary: `${_PROBE_SAMPLE_ID} @ 10 kb · ${nChroms} chroms · ` +
             `${probeResult.n} windows · peak θπ = ${peakStr} ${verdict}`,
  };
}

function clusterizeOutliers() {
  const data = D.ST3.slice().sort((a, b) =>
    a.chr.localeCompare(b.chr) || (a.start - b.start));
  let cid = 0, prev = null;
  data.forEach(r => {
    if (!prev || prev.chr !== r.chr || (r.start - prev.end) > 1e6) cid += 1;
    r._cluster = cid;
    prev = r;
  });
  return data;
}

function hsRender() {
  const t = document.getElementById('hotspotTable');
  const state = t.__sort = t.__sort || { key: 'mean_th', dir: 'desc' };
  let rows = clusterizeOutliers();
  const cluCount = new Map();
  rows.forEach(r => { cluCount.set(r._cluster, (cluCount.get(r._cluster) || 0) + 1); });
  rows = sortRows(rows, state);
  const tbody = t.querySelector('tbody');
  tbody.innerHTML = rows.map(r => {
    const cn = cluCount.get(r._cluster);
    const cTag = cn > 1
      ? `<span style="color:var(--accent);">cluster ${r._cluster} (${cn} wins)</span>`
      : `<span style="color:var(--ink-dim);">solo (${r._cluster})</span>`;
    return `<tr>
      <td>${r.chr}</td>
      <td class="num">${(r.start/1e6).toFixed(2)}</td>
      <td class="num">${(r.end/1e6).toFixed(2)}</td>
      <td class="num">${fmtSci(r.mean_th, 2)}</td>
      <td class="num"><b>${r.fold.toFixed(2)}×</b></td>
      <td class="num">${r.pct}</td>
      <td>${cTag}</td>
    </tr>`;
  }).join('');
  applySortIndicators('hotspotTable');
}

function plotsPage3() {
  const chrLen = D.ST1.map(c => ({ chr: c.chr, len_bp: c.n_win * 5e5, mean: c.mean }))
                        .sort((a, b) => parseInt(a.chr.replace('LG','')) - parseInt(b.chr.replace('LG','')));
  const totalGenome = chrLen.reduce((a, c) => a + c.len_bp, 0);
  const W = 1180, H = 220;
  const padL = 40, padR = 20, padT = 36, padB = 40;
  const xS_ = linScale(0, totalGenome, padL, W - padR);
  const allMeans = D.ST1.map(c => c.mean);
  const maxM = Math.max(...allMeans), minM = Math.min(...allMeans);
  const yS_ = linScale(minM * 0.95, maxM * 1.1, H - padB, padT);
  const arr = buildSVG(W, H);

  let cumX = 0;
  chrLen.forEach((c, i) => {
    const x0 = xS_(cumX), x1 = xS_(cumX + c.len_bp);
    const y = yS_(c.mean);
    arr.push(`<rect x="${x0}" y="${y}" width="${x1-x0}" height="${H-padB-y}" ` +
             `fill="${i % 2 ? 'rgba(72,200,120,0.30)' : 'rgba(72,200,120,0.55)'}" stroke="var(--accent)" stroke-width="0.4"/>`);
    arr.push(`<text class="axis-text" x="${(x0+x1)/2}" y="${H-padB+12}" text-anchor="middle" font-size="8">${c.chr.replace('LG','')}</text>`);
    cumX += c.len_bp;
  });
  arr.push(`<line class="axis-line" x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}"/>`);
  const yt = niceTicks(minM*0.95, maxM*1.1, 5);
  yt.forEach(v => {
    const y = yS_(v);
    arr.push(`<text class="axis-text" x="${padL-2}" y="${y+3}" text-anchor="end" font-size="8">${fmtSci(v,2)}</text>`);
  });
  cumX = 0;
  const outliersByChr = {};
  D.ST3.forEach(o => {
    outliersByChr[o.chr] = outliersByChr[o.chr] || [];
    outliersByChr[o.chr].push(o);
  });
  chrLen.forEach(c => {
    const ous = outliersByChr[c.chr] || [];
    ous.forEach(o => {
      const xMid = xS_(cumX + (o.centre || (o.start + o.end) / 2));
      const yPk = yS_(Math.min(o.mean_th, maxM * 1.1));
      arr.push(`<line x1="${xMid}" y1="${padT}" x2="${xMid}" y2="${H-padB}" stroke="var(--bad)" stroke-width="0.7" stroke-opacity="0.55"/>`);
      arr.push(`<circle data-i="${D.ST3.indexOf(o)}" cx="${xMid}" cy="${yPk}" r="3.0" fill="var(--bad)" fill-opacity="0.9" stroke="var(--bad)"/>`);
    });
    cumX += c.len_bp;
  });
  arr.push(`<text class="title-text" x="${padL}" y="${padT-14}">Cohort-mean θπ per chromosome with 19 outlier windows (red ticks)</text>`);
  arr.push(`<text class="annot-text" x="${W-padR}" y="${padT-14}" text-anchor="end">y: per-chr mean θπ · max ${fmtSci(maxM,2)}</text>`);
  document.getElementById('plotGenomeManhattan').innerHTML = svgClose(arr);
  const el = document.getElementById('plotGenomeManhattan').querySelector('svg');
  bindTip(el, i => D.ST3[i],
    o => `<b>${o.chr}</b> · ${(o.start/1e6).toFixed(1)}–${(o.end/1e6).toFixed(1)} Mb<div class="row">θπ: ${fmtSci(o.mean_th, 2)}</div><div class="row">${o.fold.toFixed(2)}× genome mean</div><div class="row">${o.pct} percentile</div>`);

  // Hotspot heatmap (samples × outlier windows)
  const cols = Object.keys(D.ST3b[0]).filter(k => k !== 'Sample').map(k => ({ label: k, key: k }));
  const samples = D.ST3b.slice().map(r => {
    const vals = cols.map(c => r[c.key]).filter(v => v != null);
    return Object.assign({}, r, { _avg: vals.reduce((a,v) => a+v, 0) / (vals.length || 1) });
  }).sort((a, b) => b._avg - a._avg);

  let vMin = Infinity, vMax = -Infinity;
  samples.forEach(r => cols.forEach(c => {
    const v = r[c.key];
    if (v != null && isFinite(v)) {
      if (v < vMin) vMin = v;
      if (v > vMax) vMax = v;
    }
  }));
  const colorScale = makeWarmScale(vMin, vMax);

  plotHeatmap('plotHotspotHeatmap', {
    rows: samples.map(s => ({ label: s.Sample })),
    cols: cols,
    values: (r, c) => samples[r][cols[c].key],
    colorScale: colorScale,
    cellW: 36, cellH: 4, padL: 80, padT: 110,
    tooltip: (row, col, v) =>
      `<b>${row.label}</b><div class="row">${col.label}</div><div class="row">θπ: ${v == null ? '—' : fmtSci(v, 2)}</div>`
  });
}

function wireSorting() {
  document.querySelectorAll('#hotspotTable th').forEach(th => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (!k) return;
      const t = document.getElementById('hotspotTable');
      const state = t.__sort;
      if (state.key === k) state.dir = state.dir === 'asc' ? 'desc' : 'asc';
      else { state.key = k; state.dir = (k === 'chr' || k === 'cluster') ? 'asc' : 'desc'; }
      hsRender();
    });
  });
}

export async function mount(root, atlasState, registry) {
  ensureTip();
  const ctx = await ensureData();
  D = ctx.D;
  hsRender();
  plotsPage3();
  wireSorting();

  // Mode-B probe — non-blocking; failure leaves the badge in its demo
  // state but does not affect page rendering.
  probeModeB(registry, 'samples_theta_pi_pestpg', {
    sample_id: _PROBE_SAMPLE_ID, win_bp: _PROBE_WIN_BP, step_bp: _PROBE_STEP_BP,
  })
    .then((r) => renderModeBBadge('hsModeBBadge', r, {
      label:    'fine-scale θπ',
      layerKey: 'samples_theta_pi_pestpg',
      compare:  _compareHotspots,
      provenance: ctx.PROVENANCE,
    }))
    .catch(() => renderModeBBadge('hsModeBBadge', { ok: false, reason: 'unknown' }, {
      label: 'fine-scale θπ', layerKey: 'samples_theta_pi_pestpg',
      provenance: ctx.PROVENANCE,
    }));
}

export async function unmount(root) {}
