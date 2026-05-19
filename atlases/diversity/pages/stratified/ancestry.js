// =============================================================================
// atlases/diversity/pages/stratified/ancestry.js — Ancestry × diversity
// =============================================================================
// Stage:        stratified
// Legacy DOM:   <div id="page4"> (renamed -> id="ancestry") (Diversity_atlas.html v2.4 lines 701-855)
// Renderers:    kwRender, pairwiseRender, clRender, kSweepRender, qHRender,
//               plotsPage4 (legacy lines 2584-2751).
// =============================================================================

import { ensureData } from '../../shared/data_loader.js';
import { ensureTip, bindTip } from '../../shared/tooltip.js';
import {
  fmtSci, fmt3, fmtH, fmtP, sigClass, clusterSwatch
} from '../../shared/formatters.js';
import { sortRows, applySortIndicators } from '../../shared/tables.js';
import { plotBoxes, plotBarH } from '../../shared/plots.js';
import { buildSVG, svgClose, linScale, niceTicks, quartiles } from '../../shared/svg.js';
import {
  probeModeB, renderModeBBadge, distinctCount
} from '../../shared/mode_b_badge.js';

let D = null;
let CLUSTER_COLORS = null;

// ─── Mode-B cross-check ─────────────────────────────────────────────────
// Resolves ancestry_het_kruskal_all (the K-sweep aggregate, single file
// under 02_heterozygosity/05_ancestry_heterozygosity/tables/). Cross-
// checks the resolved row count against D.S7 (the carve's K-sweep
// trajectory) and the distinct-K coverage against the K=2..12 grid the
// pipeline writes. Pass if both counts agree within a small tolerance.

function _compareKSweep(probeResult) {
  const rows = probeResult.rows;
  // The K column may be 'K', 'k', or under a different label depending on
  // how the upstream R wrote the header. Probe a few common spellings.
  let nKObserved = distinctCount(rows, 'K');
  if (nKObserved === 0) nKObserved = distinctCount(rows, 'k');
  if (nKObserved === 0) {
    // Fall back: scan all columns for one that looks like a small int.
    const keys = Object.keys(rows[0] || {});
    for (const k of keys) {
      const dc = distinctCount(rows, k);
      if (dc >= 3 && dc <= 15 && /K|cluster/i.test(k)) { nKObserved = dc; break; }
    }
  }

  const carveSweep = (D && Array.isArray(D.S7)) ? D.S7 : [];
  const carveRows  = carveSweep.length;
  const carveKs    = new Set(carveSweep.map((r) => r && r.k).filter((x) => x != null)).size;

  // The aggregate file has one row per (K × panel × test); D.S7 has one
  // row per (K × panel). Expect rows >= carveRows (the pipeline may emit
  // more tests than the carve materialises). Use a soft floor.
  const rowsOk  = carveRows === 0 || rows.length >= Math.max(1, carveRows - 2);
  const ksOk    = carveKs   === 0 || nKObserved >= Math.max(1, carveKs - 1);
  const pass = rowsOk && ksOk;

  const ksStr = nKObserved > 0 ? `${nKObserved} distinct K` : '(K column not detected)';
  const carveStr = carveRows
    ? `(carve D.S7 has ${carveRows} rows · ${carveKs} K values)`
    : '(no D.S7 baseline)';
  return {
    pass,
    summary: `K-sweep aggregate · ${probeResult.n} rows · ${ksStr} ${carveStr}`,
  };
}

function kwRender() {
  const tbody = document.querySelector('#kwTable tbody');
  tbody.innerHTML = D.S5_kw.map(t => {
    const p = t['P-value'];
    const pCls = sigClass(p);
    return `<tr>
      <td>${t['Test'] || '—'}</td>
      <td>${t['Variable'] || '—'}</td>
      <td>${t['Panel'] || '—'}</td>
      <td class="num">${t['n'] || '—'}</td>
      <td class="num">${t['Statistic H'] != null ? Number(t['Statistic H']).toFixed(2) : '—'}</td>
      <td class="num ${pCls}">${fmtP(p)}</td>
    </tr>`;
  }).join('');
}

function pairwiseRender() {
  const tbody = document.querySelector('#pairwiseTable tbody');
  tbody.innerHTML = D.S5_pair.map(p => `<tr>
    <td>${p.contrast}</td>
    <td class="num sig-3">${fmtSci(p.p_bh, 2)}</td>
  </tr>`).join('');
}

function clRender() {
  const t = document.getElementById('clusterTable');
  const state = t.__sort = t.__sort || { key: 'k', dir: 'asc' };
  const rows = sortRows(D.S9, state);
  const tbody = t.querySelector('tbody');
  tbody.innerHTML = rows.map(r => `<tr>
    <td>${clusterSwatch(r.k, CLUSTER_COLORS)}</td>
    <td class="num">${r.n}</td>
    <td class="num">${fmtH(r.mean_h)}</td>
    <td class="num">${fmtH(r.median_h)}</td>
    <td class="num">${fmtSci(r.sd_h, 2)}</td>
    <td class="num">${fmtSci(r.iqr_h, 2)}</td>
    <td class="num">${fmtH(r.min_h)}</td>
    <td class="num">${fmtH(r.max_h)}</td>
    <td class="num">${(r.mean_qmax * 100).toFixed(1)}%</td>
  </tr>`).join('');
  applySortIndicators('clusterTable');
}

function kSweepRender() {
  const t = document.getElementById('kSweepTable');
  const state = t.__sort = t.__sort || { key: 'k', dir: 'asc' };
  const rows = sortRows(D.S7, state);
  const tbody = t.querySelector('tbody');
  tbody.innerHTML = rows.map(r => `<tr>
    <td>${r.k}</td>
    <td>${r.panel}</td>
    <td class="num">${r.n}</td>
    <td class="num">${r.n_groups}</td>
    <td class="num ${sigClass(r.kw_p)}">${fmtP(r.kw_p)}</td>
    <td class="num ${sigClass(r.anova_p)}">${fmtP(r.anova_p)}</td>
    <td>${r.strongest_q || '—'}</td>
    <td class="num">${r.rho == null ? '—' : Number(r.rho).toFixed(3)}</td>
    <td class="num">${fmtP(r.rho_p)}</td>
  </tr>`).join('');
  applySortIndicators('kSweepTable');
}

function qHRender() {
  const t = document.getElementById('qHTable');
  const state = t.__sort = t.__sort || { key: 'comp', dir: 'asc' };
  const rows = sortRows(D.S10, state);
  const tbody = t.querySelector('tbody');
  tbody.innerHTML = rows.map(r => `<tr>
    <td>${r.comp}</td>
    <td>${r.panel}</td>
    <td class="num">${r.n}</td>
    <td class="num">${r.pearson_r == null ? '—' : Number(r.pearson_r).toFixed(3)}</td>
    <td class="num">${fmtP(r.pearson_p)}</td>
    <td class="num">${fmtP(r.pearson_p_bh)}</td>
    <td class="num">${r.spearman_rho == null ? '—' : Number(r.spearman_rho).toFixed(3)}</td>
    <td class="num">${fmtP(r.spearman_p)}</td>
    <td class="num">${fmtP(r.spearman_p_bh)}</td>
  </tr>`).join('');
  applySortIndicators('qHTable');
}

function plotsPage4() {
  // Cluster F_ROH boxes
  const groupsF = D.S9.map(c => {
    const v = D.S1.filter(s => s.k8 === c.k).map(s => s.f_roh).filter(x => x != null).sort((a,b)=>a-b);
    const q = quartiles(v);
    return Object.assign({}, q, { label: `${c.k} (n=${c.n})`, color: c.color, n: v.length, points: v });
  });
  plotBoxes('plotClusterFRoh', groupsF, {
    W: 480, valFmt: fmt3, xLabel: 'F_ROH',
    refValue: D.globals.froh_mean, refLabel: 'cohort mean',
    xMin: 0.0, xMax: 0.45
  });

  // Cluster H boxes
  const groupsH = D.S9.map(c => {
    const v = D.S1.filter(s => s.k8 === c.k).map(s => s.h).filter(x => x != null).sort((a,b)=>a-b);
    const q = quartiles(v);
    return Object.assign({}, q, { label: `${c.k} (n=${c.n})`, color: c.color, n: v.length, points: v });
  });
  plotBoxes('plotClusterH', groupsH, {
    W: 480, valFmt: v => fmtSci(v, 2), xLabel: 'H',
    refValue: D.globals.h_mean, refLabel: 'cohort mean'
  });

  // K-sweep KW P trajectory
  const W = 480, H = 240;
  const padL = 50, padR = 14, padT = 16, padB = 38;
  const allK = [...new Set(D.S7.map(r => r.k))].sort((a,b) => a-b);
  const kMin = Math.min(...allK), kMax = Math.max(...allK);
  const lpVals = D.S7.map(r => r.kw_p ? -Math.log10(r.kw_p) : 0);
  const yMax = Math.max(2, Math.max(...lpVals) * 1.1);
  const xS_ = linScale(kMin, kMax, padL, W - padR);
  const yS_ = linScale(0, yMax, H - padB, padT);
  const arr = buildSVG(W, H);

  allK.forEach(k => {
    const x = xS_(k);
    arr.push(`<line class="grid-line" x1="${x}" y1="${padT}" x2="${x}" y2="${H-padB}"/>`);
    arr.push(`<text class="axis-text" x="${x}" y="${H-padB+12}" text-anchor="middle">K=${k}</text>`);
  });
  const yt = niceTicks(0, yMax, 5);
  yt.forEach(v => {
    const y = yS_(v);
    arr.push(`<line class="grid-line" x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}"/>`);
    arr.push(`<text class="axis-text" x="${padL-4}" y="${y+3}" text-anchor="end">${v.toFixed(1)}</text>`);
  });
  arr.push(`<line class="axis-line" x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}"/>`);
  arr.push(`<line class="axis-line" x1="${padL}" y1="${padT}" x2="${padL}" y2="${H-padB}"/>`);

  [0.05, 0.01].forEach(alpha => {
    const y = yS_(-Math.log10(alpha));
    arr.push(`<line class="ref-line" x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}"/>`);
    arr.push(`<text class="annot-text" x="${W-padR-2}" y="${y-3}" text-anchor="end">α=${alpha}</text>`);
  });

  ['all226', 'pruned81'].forEach((panel, idx) => {
    const color = panel === 'all226' ? 'var(--accent)' : 'var(--accent-2)';
    const pts = D.S7.filter(r => r.panel === panel).sort((a,b) => a.k - b.k);
    const path = pts.map((p,i) => {
      const x = xS_(p.k), y = yS_(p.kw_p ? -Math.log10(p.kw_p) : 0);
      return (i === 0 ? 'M' : 'L') + x + ',' + y;
    }).join(' ');
    arr.push(`<path d="${path}" fill="none" stroke="${color}" stroke-width="1.5"/>`);
    pts.forEach(p => {
      const x = xS_(p.k), y = yS_(p.kw_p ? -Math.log10(p.kw_p) : 0);
      arr.push(`<circle data-i="${D.S7.indexOf(p)}" cx="${x}" cy="${y}" r="3.5" fill="${color}" stroke="${color}"/>`);
    });
    const xL = W - padR - 80 - idx * 70;
    arr.push(`<rect x="${xL}" y="${padT-6}" width="9" height="9" fill="${color}"/>`);
    arr.push(`<text class="axis-text" x="${xL+12}" y="${padT+1}">${panel}</text>`);
  });

  arr.push(`<text class="axis-text" x="${(padL+W-padR)/2}" y="${H-4}" text-anchor="middle">K (NGSadmix clusters)</text>`);
  arr.push(`<text class="axis-text" x="14" y="${(padT+H-padB)/2}" text-anchor="middle" transform="rotate(-90 14 ${(padT+H-padB)/2})">−log₁₀(KW P)</text>`);

  document.getElementById('plotKSweep').innerHTML = svgClose(arr);
  const el = document.getElementById('plotKSweep').querySelector('svg');
  bindTip(el, i => D.S7[i],
    r => `<b>K=${r.k} · ${r.panel}</b><div class="row">KW P (H): ${fmtP(r.kw_p)}</div><div class="row">ANOVA P: ${fmtP(r.anova_p)}</div><div class="row">strongest Q: ${r.strongest_q}</div>`);

  // Q × H bars
  plotBarH('plotQH',
    D.S10.map(r => ({
      label: r.comp,
      value: r.spearman_rho || 0,
      color: r.spearman_p_bh != null && r.spearman_p_bh < 0.05 ? 'var(--accent)' : 'var(--ink-dim)',
      tooltip: `<b>${r.comp}</b><div class="row">Spearman ρ: ${(r.spearman_rho||0).toFixed(3)}</div><div class="row">P (raw): ${fmtP(r.spearman_p)}</div><div class="row">P (BH): ${fmtP(r.spearman_p_bh)}</div>`
    })),
    { xLabel: 'Spearman ρ (Q vs H)', xMin: -0.2, xMax: 0.2, valFmt: v => v.toFixed(3),
      rowH: 20, refValue: 0, refLabel: '' });
}

function wireSorting() {
  ['clusterTable','kSweepTable','qHTable'].forEach(id => {
    document.querySelectorAll('#' + id + ' th').forEach(th => {
      th.addEventListener('click', () => {
        const k = th.dataset.sort;
        if (!k) return;
        const t = document.getElementById(id);
        const state = t.__sort = t.__sort || { key: null, dir: 'asc' };
        if (state.key === k) state.dir = state.dir === 'asc' ? 'desc' : 'asc';
        else { state.key = k; state.dir = 'asc'; }
        if (id === 'clusterTable') clRender();
        else if (id === 'kSweepTable') kSweepRender();
        else qHRender();
      });
    });
  });
}

export async function mount(root, atlasState, registry) {
  ensureTip();
  const ctx = await ensureData();
  D = ctx.D;
  CLUSTER_COLORS = ctx.CLUSTER_COLORS;
  kwRender();
  pairwiseRender();
  clRender();
  kSweepRender();
  qHRender();
  plotsPage4();
  wireSorting();

  // Mode-B probe — non-blocking; failure leaves the badge in its demo
  // state but does not affect page rendering.
  probeModeB(registry, 'ancestry_het_kruskal_all')
    .then((r) => renderModeBBadge('ancModeBBadge', r, {
      label:    'K-sweep KW',
      layerKey: 'ancestry_het_kruskal_all',
      compare:  _compareKSweep,
    }))
    .catch(() => renderModeBBadge('ancModeBBadge', { ok: false, reason: 'unknown' }, {
      label: 'K-sweep KW', layerKey: 'ancestry_het_kruskal_all',
    }));
}

export async function unmount(root) {}
