// =============================================================================
// atlases/diversity/pages/qc/pruning_qc.js — Pruning & QC
// =============================================================================
// Stage:        qc
// Legacy DOM:   <div id="page6"> (renamed -> id="pruning_qc") (Diversity_atlas.html v2.4 lines 1028-1147)
// Renderers:    prRender, prWire, hmmRender, spearmanRender, plotsPage6
//               (legacy lines 3034-3149).
// =============================================================================

import { ensureData } from '../../shared/data_loader.js';
import { ensureTip } from '../../shared/tooltip.js';
import {
  fmtSci, fmt2, fmt3, fmt4, fmtH, fmtP, sigClass, clusterSwatch
} from '../../shared/formatters.js';
import { sortRows, applySortIndicators } from '../../shared/tables.js';
import { plotHist, plotBoxes, plotBarH } from '../../shared/plots.js';
import { quartiles } from '../../shared/svg.js';
import {
  probeModeB, renderModeBBadge,
} from '../../../../core/mode_b_badge.js';

let D = null;
let CLUSTER_COLORS = null;

// ─── Mode-B cross-check ─────────────────────────────────────────────────
// Resolves ancestry_het_pruned81_samples — a single-column TSV listing the
// NAToRA-retained subset. Cross-checks: (a) row count agrees with
// D.globals.n_pruned81 (carve says 81), (b) sample IDs overlap with the
// carve's S11 "Retained" subset.

function _compareNATORA(probeResult) {
  const rows = probeResult.rows;
  // The first non-empty column is the sample id — pestPG-style header
  // detection. parseDelimited's numeric coercion does not fire on
  // string-typed CGA### values, so r.sample is always a string.
  const pipelineSamples = new Set();
  for (const r of rows) {
    const v = r && (r.sample ?? r.sample_id ?? r.Sample ?? Object.values(r)[0]);
    if (typeof v === 'string' && v.length > 0) pipelineSamples.add(v);
  }

  const carveCount = (D && D.globals && D.globals.n_pruned81) ?? null;
  const carveRetained = (D && Array.isArray(D.S11))
    ? D.S11.filter((r) => r && r.status === 'Retained').map((r) => r.sample)
    : [];
  const overlap = carveRetained.filter((s) => pipelineSamples.has(s)).length;

  const countOk = (carveCount == null) || (pipelineSamples.size === carveCount);
  const overlapOk = carveRetained.length === 0 || overlap === carveRetained.length;
  const pass = countOk && overlapOk;

  const carveStr = carveCount != null ? `${carveCount}` : '(no carve count)';
  const overlapStr = carveRetained.length
    ? `${overlap}/${carveRetained.length} carve-retained samples present`
    : '(no S11 baseline)';
  return {
    pass,
    summary: `${pipelineSamples.size} samples in pipeline file ` +
             `(carve n_pruned81 = ${carveStr}) · ${overlapStr}`,
  };
}

const prState = { sortKey: 'sample', sortDir: 'asc',
                  statusFilter: 'all', clusterFilter: '' };

function prRender() {
  let rows = D.S11.slice();
  if (prState.statusFilter !== 'all') rows = rows.filter(r => r.status === prState.statusFilter);
  if (prState.clusterFilter) rows = rows.filter(r => r.k8 === prState.clusterFilter);
  rows = sortRows(rows, { key: prState.sortKey, dir: prState.sortDir });
  const tbody = document.querySelector('#pruneTable tbody');
  tbody.innerHTML = rows.map(r => {
    const stCls = r.status === 'Retained' ? 'pruned-yes' : 'pruned-no';
    return `<tr>
      <td>${r.sample}</td>
      <td class="${stCls}">${r.status}</td>
      <td>${clusterSwatch(r.k8, CLUSTER_COLORS)}</td>
      <td class="num">${fmtH(r.h)}</td>
      <td class="num">${fmt3(r.f_hom)}</td>
      <td class="num">${fmt3(r.f_roh)}</td>
    </tr>`;
  }).join('');
  document.getElementById('prCount').textContent = rows.length + ' samples';
  const t = document.getElementById('pruneTable');
  t.__sort = { key: prState.sortKey, dir: prState.sortDir };
  applySortIndicators('pruneTable');
}

function prWire() {
  document.querySelectorAll('#pruneTable th').forEach(th => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (!k) return;
      if (prState.sortKey === k) prState.sortDir = prState.sortDir === 'asc' ? 'desc' : 'asc';
      else { prState.sortKey = k; prState.sortDir = (k === 'sample') ? 'asc' : 'desc'; }
      prRender();
    });
  });
  document.querySelectorAll('.pill[data-prune-status]').forEach(p => {
    p.addEventListener('click', () => {
      prState.statusFilter = p.dataset.pruneStatus;
      document.querySelectorAll('.pill[data-prune-status]').forEach(x => x.classList.remove('on'));
      p.classList.add('on');
      prRender();
    });
  });
  const sel = document.getElementById('prClusterFilter');
  D.S9.forEach(c => {
    const opt = document.createElement('option'); opt.value = c.k; opt.textContent = c.k + ' (n=' + c.n + ')';
    sel.appendChild(opt);
  });
  sel.addEventListener('change', e => { prState.clusterFilter = e.target.value; prRender(); });
}

function hmmRender() {
  const t = document.getElementById('hmmTable');
  const state = t.__sort = t.__sort || { key: 'chr', dir: 'asc' };
  const rows = sortRows(D.SZ, state);
  const tbody = t.querySelector('tbody');
  tbody.innerHTML = rows.map(r => {
    const stCol = r.stability === 'very_stable' ? 'sig-1' : r.stability === 'stable' ? '' : 'sig-2';
    return `<tr>
      <td>${r.chr}</td>
      <td class="num">${r.reps}</td>
      <td class="num">${r.best_rep}</td>
      <td class="num">${r.best_ll == null ? '—' : Number(r.best_ll).toFixed(2)}</td>
      <td class="num">${fmt4(r.gap_worst)}</td>
      <td class="num">${fmt4(r.gap_5th)}</td>
      <td class="${stCol}">${r.stability}</td>
    </tr>`;
  }).join('');
  applySortIndicators('hmmTable');
}

function spearmanRender() {
  const tbody = document.querySelector('#spearmanTable tbody');
  tbody.innerHTML = D.S3.map(r => {
    const cls = sigClass(r.p);
    return `<tr>
      <td>${r.v1}</td>
      <td>${r.v2}</td>
      <td class="num">${r.n}</td>
      <td class="num">${Number(r.rho).toFixed(3)}</td>
      <td class="num ${cls}">${fmtP(r.p)}</td>
      <td>${r.dir}</td>
    </tr>`;
  }).join('');
}

function plotsPage6() {
  const ret = D.S11.filter(r => r.status === 'Retained').map(r => r.f_roh).filter(x => x != null).sort((a,b)=>a-b);
  const rem = D.S11.filter(r => r.status === 'Removed').map(r => r.f_roh).filter(x => x != null).sort((a,b)=>a-b);
  const groups = [
    Object.assign({}, quartiles(ret), { label: `Retained (n=${ret.length})`, color: 'var(--good)', n: ret.length, points: ret }),
    Object.assign({}, quartiles(rem), { label: `Removed (n=${rem.length})`, color: 'var(--bad)', n: rem.length, points: rem })
  ];
  plotBoxes('plotPruneFRoh', groups, {
    W: 480, valFmt: fmt3, xLabel: 'F_ROH',
    refValue: D.globals.froh_mean, refLabel: 'cohort mean',
    xMin: 0, xMax: 0.45, padL: 110
  });

  const szSorted = D.SZ.slice().sort((a,b) => a.gap_worst - b.gap_worst);
  plotBarH('plotHMMRanked',
    szSorted.map(r => ({
      label: r.chr, value: r.gap_worst,
      color: r.stability === 'very_stable' ? 'var(--good)' :
             r.stability === 'stable' ? 'var(--accent)' : 'var(--bad)',
      tooltip: `<b>${r.chr}</b><div class="row">stability: ${r.stability}</div><div class="row">gap best–worst: ${fmt4(r.gap_worst)}</div><div class="row">gap best–5th: ${fmt4(r.gap_5th)}</div>`
    })),
    { xLabel: 'gap best–worst (lower = stable)', valFmt: v => fmt4(v), rowH: 11 });

  plotHist('plotHetInOutHist', D.S1.map(s => s.th_ratio), {
    xLabel: 'θ in/out ROH ratio', valFmt: fmt2,
    refLines: [{ value: 0.25, label: 'typical 0.25' }]
  });
}

function wireSorting() {
  document.querySelectorAll('#hmmTable th').forEach(th => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (!k) return;
      const t = document.getElementById('hmmTable');
      const state = t.__sort = t.__sort || { key: null, dir: 'asc' };
      if (state.key === k) state.dir = state.dir === 'asc' ? 'desc' : 'asc';
      else { state.key = k; state.dir = (k === 'chr') ? 'asc' : 'desc'; }
      hmmRender();
    });
  });
}

export async function mount(root, atlasState, registry) {
  ensureTip();
  const ctx = await ensureData();
  D = ctx.D;
  CLUSTER_COLORS = ctx.CLUSTER_COLORS;
  prWire();
  prRender();
  const allPill = document.querySelector('.pill[data-prune-status="all"]');
  if (allPill) allPill.classList.add('on');
  hmmRender();
  wireSorting();
  spearmanRender();
  plotsPage6();

  // Mode-B probe — non-blocking; failure leaves the badge in its demo
  // state but does not affect page rendering.
  probeModeB(registry, 'ancestry_het_pruned81_samples')
    .then((r) => renderModeBBadge('prModeBBadge', r, {
      label:    'NAToRA pruned81',
      layerKey: 'ancestry_het_pruned81_samples',
      compare:  _compareNATORA,
      provenance: ctx.PROVENANCE,
    }))
    .catch(() => renderModeBBadge('prModeBBadge', { ok: false, reason: 'unknown' }, {
      label: 'NAToRA pruned81', layerKey: 'ancestry_het_pruned81_samples',
      provenance: ctx.PROVENANCE,
    }));
}

export async function unmount(root) {}
