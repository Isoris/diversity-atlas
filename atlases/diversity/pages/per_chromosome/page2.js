// =============================================================================
// atlases/diversity/pages/per_chromosome/page2.js — Per-chromosome diversity
// =============================================================================
// Stage:        per_chromosome
// Legacy DOM:   <div id="page2"> (Diversity_atlas.html v2.4 lines 509-625)
// Renderers:    chrTopStrip, thetaChrRender, frohChrRender, kwChrRender,
//               plotsPage2 (legacy lines 2259-2382).
// =============================================================================

import { ensureData } from '../../shared/data_loader.js';
import { ensureTip }  from '../../shared/tooltip.js';
import {
  fmtSci, fmt2, fmt3, fmt4, fmtP, sigClass
} from '../../shared/formatters.js';
import { sortRows, applySortIndicators } from '../../shared/tables.js';
import { plotBarH } from '../../shared/plots.js';

let D = null;

function chrTopStrip() {
  const ths = D.ST1, fr = D.S4;
  const meanT = ths.reduce((a, c) => a + c.mean, 0) / ths.length;
  const minT = Math.min(...ths.map(c => c.mean)), maxT = Math.max(...ths.map(c => c.mean));
  const meanF = fr.reduce((a, c) => a + c.mean, 0) / fr.length;
  const cells = [
    { lbl: 'chromosomes', val: '28', sub: '1,895 windows · 500 kb' },
    { lbl: 'mean θπ', val: fmtSci(meanT, 2), sub: 'range ' + fmtSci(minT, 2) + ' – ' + fmtSci(maxT, 2) },
    { lbl: 'genome F_ROH', val: meanF.toFixed(3), sub: 'mean of per-chrom means' },
    { lbl: 'top θπ chr', val: ths.slice().sort((a,b)=>b.mean-a.mean)[0].chr, sub: 'highest cohort-mean' },
    { lbl: 'top F_ROH chr', val: fr.slice().sort((a,b)=>b.mean-a.mean)[0].chr, sub: 'highest mean F_ROH' }
  ];
  document.getElementById('chrTopStrip').innerHTML = cells.map(c =>
    `<div class="stat-cell"><div class="lbl">${c.lbl}</div>` +
    `<div class="val">${c.val}</div><div class="sub">${c.sub}</div></div>`
  ).join('');
}

function thetaChrRender() {
  const t = document.getElementById('thetaChrTable');
  const state = t.__sort = t.__sort || { key: 'chr', dir: 'asc' };
  const rows = sortRows(D.ST1, state);
  const meanGenome = D.globals.theta_pi_mean;
  const tbody = t.querySelector('tbody');
  tbody.innerHTML = rows.map(r => {
    const cls = r.mean > meanGenome * 1.05 ? 'outlier-hi' : r.mean < meanGenome * 0.95 ? 'outlier-lo' : '';
    const barW = 60 * (r.mean - 4.2e-3) / (4.8e-3 - 4.2e-3 + 1e-12);
    return `<tr>
      <td>${r.chr}</td>
      <td class="num">${r.n_win}</td>
      <td class="num ${cls}">${fmtSci(r.mean, 3)}<span class="cell-bar" style="width:${Math.max(0,barW).toFixed(0)}px"></span></td>
      <td class="num">${fmtSci(r.median, 3)}</td>
      <td class="num">${fmtSci(r.iqr, 2)}</td>
      <td class="num">${fmtSci(r.q25, 3)}</td>
      <td class="num">${fmtSci(r.q75, 3)}</td>
      <td class="num">${fmtSci(r.min, 2)}</td>
      <td class="num">${fmtSci(r.max, 2)}</td>
    </tr>`;
  }).join('');
  applySortIndicators('thetaChrTable');
}

function frohChrRender() {
  const t = document.getElementById('frohChrTable');
  const state = t.__sort = t.__sort || { key: 'mean', dir: 'desc' };
  const rows = sortRows(D.S4, state);
  const tbody = t.querySelector('tbody');
  const maxMean = Math.max(...D.S4.map(r => r.mean));
  tbody.innerHTML = rows.map(r => {
    const barW = 60 * r.mean / maxMean;
    return `<tr>
      <td>${r.chr}</td>
      <td class="num">${r.n}</td>
      <td class="num">${fmt3(r.mean)}<span class="cell-bar" style="width:${barW.toFixed(0)}px"></span></td>
      <td class="num">${fmt3(r.median)}</td>
      <td class="num">${fmt3(r.sd)}</td>
      <td class="num">${fmt3(r.min)}</td>
      <td class="num">${fmt3(r.max)}</td>
    </tr>`;
  }).join('');
  applySortIndicators('frohChrTable');
}

function kwChrRender() {
  const t = document.getElementById('kwChrTable');
  const state = t.__sort = t.__sort || { key: 'p_bh', dir: 'asc' };
  const rows = sortRows(D.S6, state);
  const tbody = t.querySelector('tbody');
  tbody.innerHTML = rows.map(r => {
    const c = sigClass(r.p_bh);
    return `<tr>
      <td>${r.chr}</td>
      <td class="num">${r.n}</td>
      <td class="num">${fmt3(r.median_froh)}</td>
      <td class="num">${fmt3(r.iqr_froh)}</td>
      <td class="num">${fmt2(r.h)}</td>
      <td class="num">${fmtP(r.p_raw)}</td>
      <td class="num ${c}">${fmtP(r.p_bh)}</td>
      <td class="num ${c}">${r.sig || ''}</td>
    </tr>`;
  }).join('');
  applySortIndicators('kwChrTable');
}

function plotsPage2() {
  const stT = D.ST1.slice().sort((a, b) => b.mean - a.mean);
  plotBarH('plotChrTheta',
    stT.map(r => ({
      label: r.chr, value: r.mean, q25: r.q25, q75: r.q75,
      tooltip: `<b>${r.chr}</b><div class="row">mean θπ: ${fmtSci(r.mean, 3)}</div><div class="row">median: ${fmtSci(r.median, 3)}</div><div class="row">IQR: ${fmtSci(r.iqr, 2)}</div><div class="row">${r.n_win} windows</div>`
    })),
    { xLabel: 'mean θπ (per chr)', valFmt: v => fmtSci(v, 2), rowH: 11, refValue: D.globals.theta_pi_mean, refLabel: 'genome mean' });

  const stF = D.S4.slice().sort((a, b) => b.mean - a.mean);
  plotBarH('plotChrFroh',
    stF.map(r => ({
      label: r.chr, value: r.mean, sd: r.sd,
      tooltip: `<b>${r.chr}</b><div class="row">mean F_ROH: ${fmt3(r.mean)}</div><div class="row">SD: ${fmt3(r.sd)}</div><div class="row">range: ${fmt3(r.min)} – ${fmt3(r.max)}</div><div class="row">n = ${r.n}</div>`
    })),
    { xLabel: 'mean F_ROH (per chr)', valFmt: fmt3, rowH: 11, refValue: D.globals.froh_mean, refLabel: 'genome mean' });

  const kwSorted = D.S6.slice().sort((a, b) => a.p_bh - b.p_bh);
  plotBarH('plotChrKW',
    kwSorted.map(r => {
      const lp = r.p_bh ? -Math.log10(r.p_bh) : 0;
      return {
        label: r.chr, value: lp,
        color: r.p_bh <= 0.001 ? 'var(--bad)' : r.p_bh <= 0.05 ? 'var(--accent)' : 'var(--ink-dim)',
        tooltip: `<b>${r.chr}</b><div class="row">P (BH): ${fmtP(r.p_bh)}</div><div class="row">P (raw): ${fmtP(r.p_raw)}</div><div class="row">KW H: ${fmt2(r.h)}</div><div class="row">${r.sig || 'n.s.'}</div>`
      };
    }),
    { xLabel: '−log₁₀(P_BH)', xMin: 0,
      xMax: Math.max(4, Math.max(...kwSorted.map(r => r.p_bh ? -Math.log10(r.p_bh) : 0)) * 1.05),
      valFmt: v => v.toFixed(2), rowH: 11,
      refValue: -Math.log10(0.05), refLabel: 'α=0.05' });

  const szSorted = D.SZ.slice().sort((a, b) => a.gap_worst - b.gap_worst);
  plotBarH('plotHMMStability',
    szSorted.map(r => ({
      label: r.chr, value: r.gap_worst,
      color: r.stability === 'very_stable' ? 'var(--good)' :
             r.stability === 'stable' ? 'var(--accent)' : 'var(--bad)',
      tooltip: `<b>${r.chr}</b><div class="row">gap best–worst: ${fmt4(r.gap_worst)}</div><div class="row">gap best–5th: ${fmt4(r.gap_5th)}</div><div class="row">stability: ${r.stability}</div><div class="row">best replicate: ${r.best_rep}/20</div>`
    })),
    { xLabel: 'gap best–worst (lower = more stable)', valFmt: v => fmt4(v), rowH: 11 });
}

function wireTableSorting() {
  ['thetaChrTable','frohChrTable','kwChrTable'].forEach(id => {
    document.querySelectorAll('#' + id + ' th').forEach(th => {
      th.addEventListener('click', () => {
        const k = th.dataset.sort;
        if (!k) return;
        const t = document.getElementById(id);
        const state = t.__sort = t.__sort || { key: null, dir: 'asc' };
        if (state.key === k) state.dir = state.dir === 'asc' ? 'desc' : 'asc';
        else { state.key = k; state.dir = (k === 'chr') ? 'asc' : 'desc'; }
        if (id === 'thetaChrTable') thetaChrRender();
        else if (id === 'frohChrTable') frohChrRender();
        else kwChrRender();
      });
    });
  });
}

export async function mount(root, atlasState, registry) {
  ensureTip();
  const ctx = await ensureData();
  D = ctx.D;
  chrTopStrip();
  thetaChrRender();
  frohChrRender();
  kwChrRender();
  plotsPage2();
  wireTableSorting();
}

export async function unmount(root) {}
