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
import { probeModeB, renderModeBBadge, medianOf, relDiff } from '../../shared/mode_b_badge.js';
import { statCellHTML, wireInterpIcons, interpIcon } from '../../shared/interp.js';
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

  // F_HOM and S_ROH (= total ROH length in Mb per sample) are per-sample
  // numbers in D.S1. The cohort summary cells below aggregate them on the
  // fly so we don't depend on a new field in globals.
  const fhomVals = D.S1.map(r => r.f_hom).filter(v => v != null && isFinite(v));
  const fhomMean = fhomVals.length ? fhomVals.reduce((s, v) => s + v, 0) / fhomVals.length : null;
  const fhomSd = (() => {
    if (fhomVals.length < 2 || fhomMean == null) return null;
    const m2 = fhomVals.reduce((s, v) => s + (v - fhomMean) ** 2, 0) / fhomVals.length;
    return Math.sqrt(m2);
  })();
  const srohValsMb = D.S1.map(r => (r.roh_total_bp || 0) / 1e6);
  const srohMean = srohValsMb.reduce((s, v) => s + v, 0) / srohValsMb.length;
  const srohSd = (() => {
    if (srohValsMb.length < 2) return 0;
    const m2 = srohValsMb.reduce((s, v) => s + (v - srohMean) ** 2, 0) / srohValsMb.length;
    return Math.sqrt(m2);
  })();

  const cells = [
    { lbl: 'samples', val: g.n_samples,
      sub: g.n_pruned81 + ' in pruned81',
      interp: '<b>Total hatchery cohort, n = ' + g.n_samples + '.</b><br>' +
              'The 81 <i>pruned81</i> samples are the NAToRA-retained subset after removing kin-related individuals (κ &ge; 0.0884). The 145 dropped samples are kin-related to at least one retained sample. Cohort-level statistics on this page use all 226 by default; cluster/ancestry analyses on page 4 use the 81-sample subset.' },

    { lbl: 'callable genome', val: g.callable_mb + ' Mb',
      sub: 'mosdepth pass-mask',
      interp: '<b>Sum of genomic positions passing the depth/quality mask</b> (mosdepth ≥ 4×, ≤ 2× the per-sample median; non-N reference). Per-sample θπ and F_ROH are normalised by this length, so different callable-genome sizes between samples do not distort comparisons.' },

    { lbl: 'mean H', val: fmtSci(g.h_mean, 2),
      sub: 'SD ' + fmtSci(g.h_sd, 1),
      interp: '<b>Per-sample heterozygosity averaged across the cohort.</b> Range across 226 samples: ' + fmtSci(g.h_min, 2) + ' &ndash; ' + fmtSci(g.h_max, 2) + '.<br>' +
              'Low H may indicate inbreeding, recent bottleneck, or ascertainment bias. High H may indicate outbred lineage or admixture. Cross-check with F_ROH and F_HOM to disambiguate.' },

    { lbl: 'mean F_ROH', val: g.froh_mean.toFixed(3),
      sub: '± ' + g.froh_sd.toFixed(3) + ' (≥ 1 Mb)',
      interp: '<b>Mean fraction of callable genome inside ROH ≥ 1 Mb.</b> Range: ' + g.froh_min.toFixed(3) + ' &ndash; ' + g.froh_max.toFixed(3) + '.<br>' +
              '≈ ' + (g.froh_mean * 100).toFixed(0) + '% of each genome is autozygous on long blocks — high for an outbred wild population, typical for hatchery broodstock with limited founder size. A higher F_ROH in a sub-population (vs. a control) suggests a smaller effective founder size and recent close-kin mating.' },

    { lbl: 'mean F_HOM', val: fhomMean != null ? fhomMean.toFixed(3) : '—',
      sub: fhomSd != null ? '± ' + fhomSd.toFixed(3) : 'expected-vs-observed het',
      interp: '<b>F_HOM = (H<sub>expected</sub> − H<sub>observed</sub>) / H<sub>expected</sub></b>, the heterozygosity-deficit inbreeding estimator.<br>' +
              'Cross-validates F_ROH: high F_ROH should give high F_HOM (and vice versa). Discordance is diagnostic: F_ROH ≫ F_HOM may indicate over-called ROH (false-positive tracts); F_HOM ≫ F_ROH may indicate Wahlund-effect / population structure that ROH calls miss. The two estimators agreeing strengthens confidence in the ROH set.' },

    { lbl: 'mean S_ROH', val: srohMean.toFixed(0) + ' Mb',
      sub: '± ' + srohSd.toFixed(0) + ' Mb / sample',
      interp: '<b>S_ROH = sum of ROH segment lengths per sample, in Mb.</b> Raw equivalent of F_ROH (which is S_ROH / callable_genome).<br>' +
              'Useful for comparing absolute autozygosity load between samples with different callable-genome sizes (where F_ROH normalises out the genome-size effect). S_ROH × class breakdown lives on page 5.' },

    { lbl: 'ρ(H, F_ROH)', val: g.rho_h_froh.toFixed(3),
      sub: 'P = ' + fmtP(g.rho_h_froh_p),
      interp: '<b>Spearman rank correlation between per-sample H and per-sample F_ROH.</b> Strong negative correlation (≈ ' + g.rho_h_froh.toFixed(2) + ') confirms that high-F_ROH samples have suppressed heterozygosity — the expected mechanical effect of autozygosity, since ROH tracts are by definition homozygous-by-descent and have H = 0 inside them. Departure from −1 reflects out-of-ROH diversity variation.' },

    { lbl: 'ngsF-HMM stable', val: '26/28',
      sub: 'chromosomes very_stable',
      interp: '<b>26 of 28 chromosomes pass the &ldquo;very stable&rdquo; ngsF-HMM convergence criterion</b> across the 10 replicate inference runs. The 2 unstable chromosomes (see page 6 for which) carry lower-confidence ROH calls; flag samples whose F_ROH is dominated by tracts on those chromosomes.' },
  ];
  document.getElementById('ssTopStrip').innerHTML = cells.map(statCellHTML).join('');
  wireInterpIcons(document.getElementById('ssTopStrip'));
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
    { lbl: 'H (genome-wide)', val: fmtH(s.h), sub: 'percentile ' + ranks.h.toFixed(0),
      interp: '<b>Per-sample heterozygosity.</b> Cohort percentile shown. ' +
              (s.h > g.h_mean + 1.5*g.h_sd ? 'Elevated vs cohort &mdash; possible hybrid / off-target. ' :
               s.h < g.h_mean - 1.5*g.h_sd ? 'Depressed vs cohort &mdash; consistent with elevated F_ROH. ' :
               'Within cohort range.') },
    { lbl: 'F_ROH', val: fmt3(s.f_roh), sub: 'percentile ' + ranks.f_roh.toFixed(0),
      interp: '<b>Fraction of callable genome inside ROH ≥ 1 Mb.</b> ' +
              (s.f_roh > 0.35 ? 'Top-decile autozygosity &mdash; recent inbreeding signal.' :
               s.f_roh < 0.10 ? 'Low autozygosity for this cohort &mdash; likely outbred or migrant.' :
               'Typical for this cohort.') },
    { lbl: 'F_HOM', val: fmt3(s.f_hom), sub: 'cross-validates F_ROH',
      interp: '<b>F_HOM = (H<sub>expected</sub> − H<sub>observed</sub>) / H<sub>expected</sub></b>. ' +
              'Should agree with F_ROH for a clean autozygosity signal. Discordance is diagnostic of ROH-calling artefacts or population structure.' },
    { lbl: 'ROH n tracts', val: s.roh_n, sub: 'mean length ' + fmtKb(s.roh_mean_bp) + ' kb',
      interp: '<b>Number of ROH segments called.</b> Many short tracts → ancient autozygosity (deep coancestry); few long tracts → recent inbreeding (close-kin parents).' },
    { lbl: 'S_ROH (total)', val: fmtMb(s.roh_total_bp) + ' Mb',
      sub: fmtPct(s.roh_total_bp / s.callable_bp) + ' of callable',
      interp: '<b>S_ROH = total length of this sample\'s ROH segments.</b> Raw equivalent of F_ROH (which is S_ROH / callable genome). Useful when comparing absolute autozygosity load across samples with different callable-genome sizes.' },
    { lbl: 'longest ROH', val: fmtMb(s.roh_longest_bp) + ' Mb', sub: 'recent inbreeding if > 8 Mb',
      interp: '<b>Length of this sample\'s longest single ROH.</b> &gt; 8 Mb is consistent with first-cousin or closer mating in the immediate parental generation; &gt; 16 Mb is consistent with parent-offspring / full-sib mating.' },
    { lbl: 'θ inside ROH', val: fmtSci(s.th_in, 2), sub: 'expected: depressed',
      interp: '<b>Pairwise nucleotide diversity within this sample\'s ROH calls.</b> Should be near 0 (ROHs are by definition homozygous-by-descent). Non-trivial θ_in flags potential ROH-call errors.' },
    { lbl: 'θ outside ROH', val: fmtSci(s.th_out, 2), sub: 'expected: ≈ pop mean',
      interp: '<b>Pairwise nucleotide diversity outside ROH.</b> Should approximate the population θ (≈ 4N<sub>e</sub>μ). Compare to mean H from the cohort stat strip.' },
    { lbl: 'θ ratio in/out', val: fmt3(s.th_ratio), sub: 'cohort typical 0.20–0.30',
      interp: '<b>θ<sub>in-ROH</sub> / θ<sub>out-of-ROH</sub>.</b> Typical 0.20–0.30 (4–5× depression inside ROH). Higher ratios flag possible false-positive ROH tracts; lower ratios indicate exceptionally clean autozygosity calls.' }
  ];
  document.getElementById('sdGrid').innerHTML = cells.map(c => {
    const q = c.interp ? ' ' + interpIcon(c.interp) : '';
    return `<div><div class="lbl">${c.lbl}${q}</div><div class="val">${c.val}</div>` +
      `<div style="font-size:9.5px;color:var(--ink-dim);margin-top:2px;">${c.sub}</div></div>`;
  }).join('');
  wireInterpIcons(document.getElementById('sdGrid'));
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
// Helpers live in shared/mode_b_badge.js so the chromosomes + ancestry
// pages reuse the same probe + render path. The page stays interactive
// regardless of probe outcome — this is a cross-check, not a dependency.

function _compareSamplesHet(probeResult) {
  const observed = medianOf(probeResult.rows, 'het_genomewide', 'h', 'H');
  const baseline = (D && D.globals && (D.globals.h_median ?? D.globals.h_mean)) || null;
  const diff = relDiff(observed, baseline);
  const obsStr = observed != null ? observed.toExponential(3) : '—';
  const baseStr = baseline != null ? baseline.toExponential(3) : '—';
  if (diff == null) {
    return { pass: true,
             summary: `${probeResult.n} samples · median H = ${obsStr} (no carve median to compare)` };
  }
  const pass = diff < 0.01;
  const verdict = pass
    ? `(matches carve median ${baseStr} within 1 %)`
    : `(differs from carve ${baseStr} by ${(diff * 100).toFixed(1)} %)`;
  return { pass,
           summary: `${probeResult.n} samples · median H = ${obsStr} ${verdict}` };
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
  probeModeB(registry, 'samples_genomewide_het')
    .then((r) => renderModeBBadge('ssModeBBadge', r, {
      label:    'per-sample H',
      layerKey: 'samples_genomewide_het',
      compare:  _compareSamplesHet,
    }))
    .catch(() => renderModeBBadge('ssModeBBadge', { ok: false, reason: 'unknown' }, {
      label: 'per-sample H', layerKey: 'samples_genomewide_het',
    }));
}

export async function unmount(root) {
  // Page is replaced wholesale by the router on next navigate;
  // nothing to clean up beyond the implicit DOM removal.
}
