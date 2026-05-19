// =============================================================================
// atlases/diversity/pages/per_sample/samples.js — Samples
// =============================================================================
// Stage:        per_sample
// Legacy DOM:   <div id="page1"> (renamed -> id="samples") (Diversity_atlas.html v2.4 lines 407-504)
// Renderers:    ssTopStrip, ssRender, ssWire, renderSampleDetail, plotsPage1
//               (extracted verbatim from legacy lines 2047-2254).
//
// Page-private state lives at module scope and is reset on every mount() —
// each fragment injection installs a fresh DOM, so old references stale out.
// =============================================================================

import { ensureData } from '../../shared/data_loader.js';
import { ensureTip }  from '../../shared/tooltip.js';
import { listLayers, getLayer } from '../../shared/api_client.js';
import {
  fmtSci, fmt2, fmt3, fmtH, fmtMb, fmtKb, fmtP, fmtPct, clusterSwatch
} from '../../shared/formatters.js';
import { sortRows } from '../../shared/tables.js';
import { plotHist, plotScatter } from '../../shared/plots.js';

const ssState = {
  sortKey: 'sample', sortDir: 'asc',
  pruneFilter: 'all', clusterFilter: '', searchText: '',
  selectedSample: null,
};

let D = null;
let CLUSTER_COLORS = null;

function ssTopStrip() {
  const g = D.globals;
  const cells = [
    { lbl: 'samples',          val: g.n_samples,                  sub: g.n_pruned81 + ' in pruned81' },
    { lbl: 'callable genome',  val: g.callable_mb + ' Mb',         sub: 'mosdepth pass-mask' },
    { lbl: 'mean H',           val: fmtSci(g.h_mean, 2),           sub: 'SD ' + fmtSci(g.h_sd, 1) },
    { lbl: 'mean F_ROH',       val: g.froh_mean.toFixed(3),        sub: '± ' + g.froh_sd.toFixed(3) + ' (≥ 1 Mb)' },
    { lbl: 'ρ(H, F_ROH)',      val: g.rho_h_froh.toFixed(3),       sub: 'P = ' + fmtP(g.rho_h_froh_p) },
    { lbl: 'ngsF-HMM stable',  val: '26/28',                       sub: 'chromosomes very_stable' }
  ];
  document.getElementById('ssTopStrip').innerHTML = cells.map(c =>
    `<div class="stat-cell"><div class="lbl">${c.lbl}</div>` +
    `<div class="val">${c.val}</div><div class="sub">${c.sub}</div></div>`
  ).join('');
}

function ssApply() {
  let rows = D.S1.slice();
  if (ssState.pruneFilter === 'pruned81') rows = rows.filter(r => r.pruned81);
  else if (ssState.pruneFilter === 'dropped') rows = rows.filter(r => !r.pruned81);
  if (ssState.clusterFilter) rows = rows.filter(r => r.k8 === ssState.clusterFilter);
  if (ssState.searchText) {
    const q = ssState.searchText.toLowerCase();
    rows = rows.filter(r => r.sample.toLowerCase().includes(q));
  }
  return sortRows(rows, { key: ssState.sortKey, dir: ssState.sortDir });
}

function ssRender() {
  const rows = ssApply();
  const g = D.globals;
  const hi_h = g.h_mean + 1.5*g.h_sd, lo_h = g.h_mean - 1.5*g.h_sd;
  const hi_froh = g.froh_mean + 1.5*g.froh_sd, lo_froh = g.froh_mean - 1.5*g.froh_sd;
  const tbody = document.querySelector('#sampleTable tbody');
  tbody.innerHTML = rows.map(r => {
    const hCls = r.h != null && (r.h > hi_h ? 'outlier-hi' : r.h < lo_h ? 'outlier-lo' : '');
    const fCls = r.f_roh != null && (r.f_roh > hi_froh ? 'outlier-hi' : r.f_roh < lo_froh ? 'outlier-lo' : '');
    const sel = ssState.selectedSample === r.sample ? ' row-selected' : '';
    return `<tr class="srow${sel}" data-sample="${r.sample}">
      <td>${r.sample}</td>
      <td>${clusterSwatch(r.k8, CLUSTER_COLORS)}</td>
      <td class="${r.pruned81 ? 'pruned-yes' : 'pruned-no'}">${r.pruned81 ? '✓' : '·'}</td>
      <td class="num ${hCls}">${fmtH(r.h)}</td>
      <td class="num ${fCls}">${fmt3(r.f_roh)}</td>
      <td class="num">${r.f_hom == null ? '—' : Number(r.f_hom).toFixed(3)}</td>
      <td class="num">${r.roh_n}</td>
      <td class="num">${fmtMb(r.roh_total_bp)}</td>
      <td class="num">${fmtMb(r.roh_longest_bp)}</td>
      <td class="num">${fmtKb(r.roh_mean_bp)}</td>
      <td class="num">${fmtSci(r.th_in, 2)}</td>
      <td class="num">${fmtSci(r.th_out, 2)}</td>
      <td class="num">${fmt3(r.th_ratio)}</td>
    </tr>`;
  }).join('');
  document.querySelectorAll('#sampleTable th').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === ssState.sortKey) {
      th.classList.add(ssState.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
  document.getElementById('ssCount').textContent = rows.length + ' / ' + D.globals.n_samples + ' samples shown';
  tbody.querySelectorAll('tr.srow').forEach(tr => {
    tr.addEventListener('click', () => {
      ssState.selectedSample = tr.dataset.sample;
      const s = D.S1.find(x => x.sample === ssState.selectedSample);
      renderSampleDetail(s);
      ssRender();
    });
  });
}

function percentileOf(arr, v) {
  if (v == null) return 0;
  const sorted = arr.filter(x => x != null).slice().sort((a,b) => a-b);
  let lo = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] <= v) lo = i + 1; else break;
  }
  return 100 * lo / sorted.length;
}

function renderSampleDetail(s) {
  if (!s) return;
  const card = document.getElementById('sampleDetail');
  card.classList.add('on');
  document.getElementById('sdTitle').textContent = s.sample;
  document.getElementById('sdSubtitle').innerHTML =
    'Ancestry cluster ' + clusterSwatch(s.k8, CLUSTER_COLORS) +
    ' · ' + (s.pruned81 ? '<span style="color:var(--good)">in pruned81</span>'
                        : '<span style="color:var(--ink-dimmer)">excluded by kin pruning</span>');
  const g = D.globals;
  const ranks = {
    h: percentileOf(D.S1.map(x => x.h), s.h),
    f_roh: percentileOf(D.S1.map(x => x.f_roh), s.f_roh)
  };
  const cells = [
    { lbl: 'H (genome-wide)', val: fmtH(s.h), sub: 'percentile ' + ranks.h.toFixed(0) },
    { lbl: 'F_ROH', val: fmt3(s.f_roh), sub: 'percentile ' + ranks.f_roh.toFixed(0) },
    { lbl: 'F_HOM', val: fmt3(s.f_hom), sub: 'cross-validates F_ROH' },
    { lbl: 'ROH n tracts', val: s.roh_n, sub: 'mean length ' + fmtKb(s.roh_mean_bp) + ' kb' },
    { lbl: 'ROH total', val: fmtMb(s.roh_total_bp) + ' Mb', sub: fmtPct(s.roh_total_bp / s.callable_bp) + ' of callable' },
    { lbl: 'longest ROH', val: fmtMb(s.roh_longest_bp) + ' Mb', sub: 'recent inbreeding if > 8 Mb' },
    { lbl: 'θ inside ROH', val: fmtSci(s.th_in, 2), sub: 'expected: depressed' },
    { lbl: 'θ outside ROH', val: fmtSci(s.th_out, 2), sub: 'expected: ≈ pop mean' },
    { lbl: 'θ ratio in/out', val: fmt3(s.th_ratio), sub: 'cohort typical 0.20–0.30' }
  ];
  document.getElementById('sdGrid').innerHTML = cells.map(c =>
    `<div><div class="lbl">${c.lbl}</div><div class="val">${c.val}</div>` +
    `<div style="font-size:9.5px;color:var(--ink-dim);margin-top:2px;">${c.sub}</div></div>`
  ).join('');
  let notes = '';
  if (s.f_roh > 0.35) notes += '· F_ROH in the top decile — recent inbreeding signal. ';
  if (s.h > g.h_mean + 1.5*g.h_sd) notes += '· H elevated — possible hybrid or non-target sample. ';
  if (s.h < g.h_mean - 1.5*g.h_sd) notes += '· H depressed — consistent with elevated F_ROH. ';
  if (s.th_ratio > 0.4) notes += '· θ in/out ratio higher than typical — ROH calls may include false positives. ';
  if (!notes) notes = '· No flags raised.';
  document.getElementById('sdNotes').textContent = notes;
  if (typeof card.scrollIntoView === 'function')
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeSampleDetail() {
  document.getElementById('sampleDetail').classList.remove('on');
  ssState.selectedSample = null;
  ssRender();
}

function ssWire() {
  document.querySelectorAll('#sampleTable th').forEach(th => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (!k) return;
      if (ssState.sortKey === k) ssState.sortDir = ssState.sortDir === 'asc' ? 'desc' : 'asc';
      else { ssState.sortKey = k; ssState.sortDir = (k === 'sample') ? 'asc' : 'desc'; }
      ssRender();
    });
  });
  document.getElementById('ssSearch').addEventListener('input', e => {
    ssState.searchText = e.target.value; ssRender();
  });
  document.querySelectorAll('.pill[data-prune-filter]').forEach(p => {
    p.addEventListener('click', () => {
      ssState.pruneFilter = p.dataset.pruneFilter;
      document.querySelectorAll('.pill[data-prune-filter]').forEach(x => x.classList.remove('on'));
      p.classList.add('on');
      ssRender();
    });
  });
  const allPill = document.querySelector('.pill[data-prune-filter="all"]');
  if (allPill) allPill.classList.add('on');
  const sel = document.getElementById('ssClusterFilter');
  if (sel) {
    D.S9.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.k; opt.textContent = c.k + ' (n=' + c.n + ')';
      sel.appendChild(opt);
    });
    sel.addEventListener('change', e => { ssState.clusterFilter = e.target.value; ssRender(); });
  }
  // close button on detail card
  const closeBtn = document.querySelector('#sampleDetail [data-action="closeSampleDetail"]');
  if (closeBtn) closeBtn.addEventListener('click', closeSampleDetail);
}

function plotsPage1() {
  const g = D.globals;
  plotHist('plotHHist', D.S1.map(s => s.h), {
    xLabel: 'genome-wide H', valFmt: v => fmtSci(v, 2),
    refLines: [{ value: g.h_mean, label: 'mean ' + fmtSci(g.h_mean, 2) }, { value: g.h_median, label: 'median' }]
  });
  plotHist('plotFRohHist', D.S1.map(s => s.f_roh), {
    xLabel: 'F_ROH (≥ 1 Mb)', valFmt: fmt3,
    refLines: [{ value: g.froh_mean, label: 'mean ' + g.froh_mean.toFixed(3) }, { value: g.froh_median, label: 'median' }]
  });
  const pts1 = D.S1.map(s => ({
    x: s.h, y: s.f_roh, color: CLUSTER_COLORS[s.k8] || '#888',
    tooltip: `<b>${s.sample}</b> · ${s.k8}<div class="row">H = ${fmtH(s.h)}</div><div class="row">F_ROH = ${fmt3(s.f_roh)}</div>`
  }));
  plotScatter('plotHvsFroh', pts1, {
    xMin: g.h_min * 0.95, xMax: g.h_max * 1.02, yMin: 0, yMax: g.froh_max * 1.05,
    xFmt: v => fmtSci(v, 2), yFmt: fmt3, xLabel: 'H', yLabel: 'F_ROH',
    annot: 'ρ = ' + g.rho_h_froh.toFixed(3) + '  ·  P = ' + fmtSci(g.rho_h_froh_p, 1)
  });
  const longestVals = D.S1.map(s => s.roh_longest_bp / 1e6);
  const lMax = Math.max(...longestVals);
  const pts2 = D.S1.map(s => ({
    x: s.h, y: s.roh_longest_bp / 1e6, color: CLUSTER_COLORS[s.k8] || '#888',
    tooltip: `<b>${s.sample}</b> · ${s.k8}<div class="row">H = ${fmtH(s.h)}</div><div class="row">longest ROH = ${fmtMb(s.roh_longest_bp)} Mb</div>`
  }));
  plotScatter('plotHvsLongest', pts2, {
    xMin: g.h_min * 0.95, xMax: g.h_max * 1.02, yMin: 0, yMax: lMax * 1.05,
    xFmt: v => fmtSci(v, 2), yFmt: v => v.toFixed(1),
    xLabel: 'H', yLabel: 'longest ROH (Mb)', annot: 'ρ = ' + g.rho_h_longest.toFixed(3)
  });
  const tInMax = Math.max(...D.S1.map(s => s.th_in || 0));
  const tOutMax = Math.max(...D.S1.map(s => s.th_out || 0));
  const pts3 = D.S1.map(s => ({
    x: s.th_out, y: s.th_in, color: CLUSTER_COLORS[s.k8] || '#888',
    tooltip: `<b>${s.sample}</b> · ratio ${fmt3(s.th_ratio)}<div class="row">in: ${fmtSci(s.th_in,2)}</div><div class="row">out: ${fmtSci(s.th_out,2)}</div>`
  }));
  plotScatter('plotThetaInOut', pts3, {
    xMin: 0, xMax: tOutMax * 1.05, yMin: 0, yMax: tInMax * 1.05,
    xFmt: v => fmtSci(v, 1), yFmt: v => fmtSci(v, 1),
    xLabel: 'θ outside ROH', yLabel: 'θ inside ROH',
    annot: 'mean ratio ' + fmt3(D.S1.reduce((a,s) => a + (s.th_ratio || 0), 0) / D.S1.length)
  });
  plotHist('plotPerSampleTheta', D.ST2.map(r => r.mean), {
    xLabel: 'per-sample mean θπ (1,895 windows)',
    valFmt: v => fmtSci(v, 2),
    refLines: [{ value: g.theta_pi_mean, label: 'cohort ' + fmtSci(g.theta_pi_mean, 2) }]
  });
}

// ─── Envelope-aware data-source badge (2026-05-14) ──────────────────────
// data_loader.js loads the `embedded_tables` slot via GET /api/diversity/
// embedded_tables (atlas-core's diversity_endpoint.py). The action
// pipeline's import_slot action wraps that same response into a
// staging_diversity_slot_v0 envelope. This badge surfaces whether such
// a capture exists for the slot — useful when reviewing whether the
// displayed numbers correspond to a registered, action-logged snapshot
// or are coming straight from a static file.

async function _findEmbeddedTablesEnvelope() {
  try {
    const list = await listLayers({
      layer_type: 'diversity_slot',
      stage:      'staging',
      limit:      50,
    });
    const rows = (list && list.layers) || [];
    // The diversity import_slot dispatcher encodes the layer_id as
    // `diversity_slot_<dataset_id>_<action_suffix>` without the slot
    // name, so we have to fetch each envelope to read payload.slot.
    // Chatty but cheap for a 50-row tail.
    let best = null;
    for (const row of rows) {
      try {
        const env = await getLayer(row.layer_id);
        const slot = env && env.payload && env.payload.slot;
        if (slot === 'embedded_tables') {
          if (best == null || (env.created_at || '') > (best.created_at || '')) {
            best = env;
          }
        }
      } catch (_e) { continue; }
    }
    return best;
  } catch (_e) { return null; }
}

function _renderProvenanceBadge(envelope) {
  const slot = document.getElementById('ssEnvelopeBadge');
  if (!slot) return;
  if (envelope == null) {
    slot.className = 'data-source-badge demo';
    slot.textContent =
      '◌  Live from /api/diversity/embedded_tables ' +
      '(no action-pipeline capture in the layers index).';
    slot.title = 'Run `atlas_action submit` with type=import_slot, ' +
                 'target.slot=embedded_tables to register a capture.';
    return;
  }
  const bytes = envelope.payload && envelope.payload.bytes;
  slot.className = 'data-source-badge live';
  slot.textContent =
    `●  Captured snapshot: ${envelope.layer_id} ` +
    (bytes ? `(${bytes.toLocaleString()} bytes) ` : '') +
    `· created ${envelope.created_at || '?'}`;
  slot.title = `Provenance: action_id=${envelope.provenance?.action_id || '?'}, ` +
               `runner=${envelope.provenance?.runner || '?'}`;
}

// ─── Mode-B cross-check (2026-05-20) ────────────────────────────────────
// Exercises the new layer-registry round-trip end-to-end in the browser:
// resolves samples_genomewide_het through atlas-core's registry (master_
// config root → static mount → parseDelimited) and compares the result's
// median H against D.globals.h_median (the manuscript-carve baseline).
//
// Fail modes (all soft):
//   - registry undefined  → shell didn't inject it (standalone test mode).
//   - resolve throws      → layer unreachable (no static mount, file
//                           missing, master_config not configured).
//   - empty result        → file present but parser couldn't make rows.
//
// The page stays interactive regardless. This badge is a probe, not a
// dependency — D.S1 reads are unchanged.

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

function _renderModeBBadge(result) {
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
  const matches = diff != null && diff < 0.01;   // within 1 %
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

// ─── Lifecycle ──────────────────────────────────────────────────────────

export async function mount(root, atlasState, registry) {
  ensureTip();
  const ctx = await ensureData();
  D = ctx.D;
  CLUSTER_COLORS = ctx.CLUSTER_COLORS;
  ssTopStrip();
  ssWire();
  ssRender();
  plotsPage1();

  // Envelope probe runs asynchronously after the synchronous render —
  // page is interactive immediately, badge updates when probe resolves.
  // Any failure (404, offline, CORS) silently leaves the slot empty.
  _findEmbeddedTablesEnvelope()
    .then(_renderProvenanceBadge)
    .catch(() => _renderProvenanceBadge(null));

  // Mode-B probe — exercise registry.resolve('samples_genomewide_het')
  // end-to-end against the on-disk pipeline output. Renders a cross-
  // check badge; failure is non-fatal.
  _probeModeBHet(registry)
    .then(_renderModeBBadge)
    .catch(() => _renderModeBBadge({ ok: false, reason: 'unknown' }));
}

export async function unmount(root) {
  // Page is replaced wholesale by the router on next navigate;
  // nothing to clean up beyond the implicit DOM removal.
}
