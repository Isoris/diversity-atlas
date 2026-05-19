// =============================================================================
// atlases/diversity/pages/meta/about.js — About / methods / glossary
// =============================================================================
// Stage:        meta
// Legacy DOM:   <div id="page7"> (renamed -> id="about") (Diversity_atlas.html v2.4 lines 1152-1377)
// Renderers:    aboutHeadline, aboutSDTables, coverageTableRender,
//               placeholderCardsRender (legacy lines 3154-3179, 3381-3746).
// =============================================================================

import { ensureData } from '../../shared/data_loader.js';
import { ensureTip } from '../../shared/tooltip.js';
import { fmtSci, fmtP } from '../../shared/formatters.js';
import { fillSimpleTable, applySortIndicators } from '../../shared/tables.js';

let D = null;

function aboutHeadline() {
  const g = D.globals;
  const cells = [
    { lbl: 'mean H',                val: fmtSci(g.h_mean, 2) + ' ± ' + fmtSci(g.h_sd, 1), sub: '226 samples' },
    { lbl: 'mean F_ROH',            val: g.froh_mean.toFixed(3) + ' ± ' + g.froh_sd.toFixed(3), sub: 'ROH ≥ 1 Mb' },
    { lbl: 'mean θπ (500 kb)',      val: fmtSci(g.theta_pi_mean, 2),    sub: 'genome-wide, 1,895 windows' },
    { lbl: 'ρ(H, F_ROH)',           val: g.rho_h_froh.toFixed(3),       sub: 'P = ' + fmtP(g.rho_h_froh_p) },
    { lbl: 'KW F_ROH × K8 all226',  val: fmtP(g.kw_froh_all226_p),      sub: 'highly significant' },
    { lbl: 'KW F_ROH × K8 pruned',  val: fmtP(g.kw_froh_pruned81_p),    sub: 'collapses → family signal' },
    { lbl: 'callable genome',       val: g.callable_mb + ' Mb',         sub: 'mosdepth' },
    { lbl: 'top θπ window',         val: 'LG22 19.0–19.5 Mb',           sub: '1.07 × 10⁻² (2.4× mean)' }
  ];
  document.getElementById('aboutHeadline').innerHTML = cells.map(c =>
    `<div class="stat-cell"><div class="lbl">${c.lbl}</div>` +
    `<div class="val">${c.val}</div><div class="sub">${c.sub}</div></div>`
  ).join('');
}

function aboutSDTables() {
  fillSimpleTable('sd1Table', D.SD1.header, D.SD1.rows);
  fillSimpleTable('sd2Table', D.SD2.header, D.SD2.rows);
  fillSimpleTable('sd3Table', D.SD3.header, D.SD3.rows);
  fillSimpleTable('sd5Table', D.SD5.header, D.SD5.rows);
  fillSimpleTable('sd6Table', D.SD6.header, D.SD6.rows);
  fillSimpleTable('sd7Table', D.SD7.header, D.SD7.rows);
  fillSimpleTable('sd8Table', D.SD8.header, D.SD8.rows);
}

function coverageTableRender() {
  const rows = [
    ["S1",  "per-sample master (226)",                "Tab 1 · Samples",          "✓ shipped", "good"],
    ["S2",  "global descriptive (means/medians/SD)",  "Tab 1 stat strip + Tab 7", "✓ shipped", "good"],
    ["S3",  "Spearman correlations",                  "Tab 6 · Pruning & QC",     "✓ shipped", "good"],
    ["S4",  "per-chromosome F_ROH (28 LGs)",          "Tab 2 · Chromosomes",      "✓ shipped", "good"],
    ["S4b", "per-sample × per-chr H (long format)",   D.S4b ? "Tab 7 · S4b real-data table" : "Tab 7 · placeholder card",
            D.S4b ? "✓ shipped" : "⚪ pending", D.S4b ? "good" : "dim"],
    ["S5",  "ancestry KW + pairwise contrasts",       "Tab 4 · Ancestry",         "✓ shipped", "good"],
    ["S6",  "per-chr ancestry KW (28 LGs)",           "Tab 2 · Chromosomes",      "✓ shipped", "good"],
    ["S7",  "K-sweep K=2–12",                         "Tab 4 · Ancestry",         "✓ shipped", "good"],
    ["S8",  "per-sample F_ROH bins (1,130 rows)",     "Tab 5 · ROH",              "✓ shipped", "good"],
    ["S8b", "per-chr × per-sample F_ROH (6,252 rows)", "Tab 5 heatmap",           "✓ shipped", "good"],
    ["S8c", "all ROH tracts (681,286 rows)",          "Tab 5 · long-ROH atlas (≥ 1 Mb subset, 5,850 tracts)", "◐ partial", "accent"],
    ["S9",  "K=8 cluster summary",                    "Tab 4 · Ancestry",         "✓ shipped", "good"],
    ["S10", "K=8 Q × H correlations",                 "Tab 4 · Ancestry",         "✓ shipped", "good"],
    ["S11", "NAToRA pruning (226)",                   "Tab 6 · Pruning & QC",     "✓ shipped", "good"],
    ["S12", "het in/out ROH (226)",                   "Tab 5 · S12 card (derived from S1)", "✓ shipped", "good"],
    ["SZ",  "ngsF-HMM convergence (28 LGs)",          "Tabs 2 + 6",               "✓ shipped", "good"],
    ["ST1", "per-chr θπ (28 LGs)",                    "Tab 2 · Chromosomes",      "✓ shipped", "good"],
    ["ST2", "per-sample θπ summary (226)",            "Tab 1 histogram",          "✓ shipped", "good"],
    ["ST3", "θπ outlier windows (19)",                "Tab 3 · Hotspots",         "✓ shipped", "good"],
    ["ST3b","226 × 19 outlier-θπ matrix",             "Tab 3 heatmap",            "✓ shipped", "good"],
    ["ST4", "per-sample × per-window θπ (428k rows)", "Tab 7 · pointer to external file", "📦 external", "accent"],
    ["ST5", "multi-scale θπ summary (28×4)",          D.ST5 ? "Tab 7 · ST5 real-data table" : "Tab 7 · placeholder card",
            D.ST5 ? "✓ shipped" : "⚪ pending", D.ST5 ? "good" : "dim"],
    ["REF", "inversion-support pointers",             D.REF ? "Tab 7 · REF real-data table" : "Tab 7 · placeholder card",
            D.REF ? "✓ shipped" : "⚪ pending", D.REF ? "good" : "dim"],
    ["SD1–SD8", "methods documentation (8 tables)",   "Tab 7 · About",            "✓ shipped", "good"],
  ];
  const colorMap = { good: 'var(--good)', dim: 'var(--ink-dim)', accent: 'var(--accent)' };
  const t = document.getElementById('coverageTable');
  t.querySelector('thead').innerHTML =
    '<tr><th>table</th><th>contents</th><th>where</th><th>status</th></tr>';
  t.querySelector('tbody').innerHTML = rows.map(r =>
    `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td>` +
    `<td style="color:${colorMap[r[4]]};font-weight:600;">${r[3]}</td></tr>`
  ).join('');
}

function placeholderCardsRender() {
  function metaToHTML(meta) {
    if (!meta) return '<i style="color:var(--ink-dim)">data block missing</i>';
    let out = '';
    if (meta.title)          out += `<p><b>${meta.title}</b></p>`;
    if (meta.description)    out += `<p style="color:var(--ink-dim)">${meta.description}</p>`;
    out += '<table class="dt" style="margin-top:6px"><tbody>';
    const skip = new Set(['title', 'description', 'schema', 'example_row']);
    for (const k of Object.keys(meta)) {
      if (skip.has(k)) continue;
      const v = meta[k];
      if (Array.isArray(v)) {
        out += `<tr><td><code>${k}</code></td><td>${v.join(' · ')}</td></tr>`;
      } else if (typeof v === 'object' && v != null) {
        out += `<tr><td><code>${k}</code></td><td>${JSON.stringify(v)}</td></tr>`;
      } else {
        out += `<tr><td><code>${k}</code></td><td>${v}</td></tr>`;
      }
    }
    out += '</tbody></table>';
    if (meta.schema && Array.isArray(meta.schema)) {
      out += '<div style="margin-top:10px"><b>Column schema</b></div>';
      out += '<table class="dt" style="margin-top:4px"><thead><tr>';
      const isMatrix = Array.isArray(meta.schema[0]);
      if (isMatrix) {
        out += '<th>column</th><th>type</th><th>description</th></tr></thead><tbody>';
        for (const r of meta.schema) {
          out += `<tr><td><code>${r[0]}</code></td><td>${r[1]||''}</td><td>${r[2]||''}</td></tr>`;
        }
      } else {
        out += '<th>column</th></tr></thead><tbody>';
        for (const c of meta.schema) {
          out += `<tr><td><code>${c}</code></td></tr>`;
        }
      }
      out += '</tbody></table>';
    }
    if (meta.example_row && Array.isArray(meta.example_row)) {
      out += '<div style="margin-top:8px;color:var(--ink-dim);font-size:10px">' +
             'example row: <code>' + meta.example_row.map(x => x == null ? 'null' : x).join(' | ') + '</code></div>';
    }
    return out;
  }

  function flipCardTagToShipped(el, n_rows) {
    const card = el.closest('.card');
    if (!card) return;
    const tag = card.querySelector('.card-tag');
    if (!tag) return;
    tag.classList.remove('pending');
    tag.classList.add('shipped');
    tag.textContent = '✓ ' + n_rows.toLocaleString() + ' rows';
  }

  function renderS4bTable(rows) {
    let out = '<p style="color:var(--ink-dim);font-size:10.5px">' +
      'Per-sample × per-chromosome heterozygosity from weighted aggregation of ' +
      '500 kb pestPG (Σ tP / Σ nSites). 226 samples × 28 chromosomes = ' +
      rows.length.toLocaleString() + ' rows. Display capped at 1,000 — use the ' +
      'sample/chrom filter to drill in.</p>';
    out += '<div class="toolbar"><input id="s4bSearch" type="search" ' +
      'placeholder="filter sample or chrom…" style="width:200px;" />' +
      '<span class="count" id="s4bCount"></span></div>';
    out += '<div style="max-height:340px;overflow-y:auto;border:1px solid var(--rule);border-radius:3px">';
    out += '<table class="dt" id="s4bTable"><thead><tr>' +
           '<th data-sort="sample">sample</th>' +
           '<th data-sort="chrom">chrom</th>' +
           '<th data-sort="H_chr">H_chr</th>' +
           '<th data-sort="callable">callable bp</th>' +
           '<th data-sort="n_windows">n windows</th>' +
           '</tr></thead><tbody></tbody></table></div>';
    return out;
  }
  function s4bWire(rows) {
    const state = { sortKey: 'sample', sortDir: 'asc', searchText: '' };
    function render() {
      let r = rows.slice();
      if (state.searchText) {
        const q = state.searchText.toLowerCase();
        r = r.filter(x => x[0].toLowerCase().includes(q) || x[1].toLowerCase().includes(q));
      }
      const keyIdx = { sample: 0, chrom: 1, H_chr: 2, callable: 3, n_windows: 4 };
      const k = keyIdx[state.sortKey] ?? 0;
      r.sort((a, b) => {
        const va = a[k], vb = b[k];
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === 'number') return state.sortDir === 'asc' ? va - vb : vb - va;
        return state.sortDir === 'asc' ? String(va).localeCompare(String(vb))
                                       : String(vb).localeCompare(String(va));
      });
      const cap = 1000;
      const slice = r.slice(0, cap);
      const tbody = document.querySelector('#s4bTable tbody');
      tbody.innerHTML = slice.map(x => `<tr>
        <td>${x[0]}</td><td>${x[1]}</td>
        <td class="num">${x[2] == null ? '—' : Number(x[2]).toExponential(2)}</td>
        <td class="num">${(x[3]/1e6).toFixed(1)} Mb</td>
        <td class="num">${x[4]}</td>
      </tr>`).join('');
      const note = r.length > cap ? ` · showing first ${cap}` : '';
      document.getElementById('s4bCount').textContent =
        r.length.toLocaleString() + ' / ' + rows.length.toLocaleString() + ' rows' + note;
      const t = document.getElementById('s4bTable');
      t.__sort = { key: state.sortKey, dir: state.sortDir };
      applySortIndicators('s4bTable');
    }
    document.querySelectorAll('#s4bTable th').forEach(th => {
      th.addEventListener('click', () => {
        const k = th.dataset.sort;
        if (!k) return;
        if (state.sortKey === k) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        else { state.sortKey = k; state.sortDir = (k === 'sample' || k === 'chrom') ? 'asc' : 'desc'; }
        render();
      });
    });
    document.getElementById('s4bSearch').addEventListener('input', e => {
      state.searchText = e.target.value; render();
    });
    render();
  }

  function renderST5Table(rows) {
    let out = '<p style="color:var(--ink-dim);font-size:10.5px">' +
      '28 chromosomes × 4 window scales = 112 rows. Outlier count uses the ' +
      'genome-wide P99 from main_500kb (5.27e-3) as a fixed reference threshold; ' +
      'finer scales reveal more local hotspots without inflating false positives ' +
      'against the canonical scale.</p>';
    out += '<div class="toolbar">' +
      '<select id="st5ScaleFilter">' +
      '<option value="">all scales</option>' +
      '<option value="main_500kb">main_500kb</option>' +
      '<option value="multi_50kb_10kb">multi_50kb_10kb</option>' +
      '<option value="multi_10kb_2kb">multi_10kb_2kb</option>' +
      '<option value="multi_5kb_1kb">multi_5kb_1kb</option>' +
      '</select><span class="count" id="st5Count"></span></div>';
    out += '<div style="max-height:340px;overflow-y:auto;border:1px solid var(--rule);border-radius:3px">';
    out += '<table class="dt" id="st5Table"><thead><tr>' +
           '<th data-sort="chrom">chrom</th>' +
           '<th data-sort="scale">scale</th>' +
           '<th data-sort="n_windows">n windows</th>' +
           '<th data-sort="mean">mean θπ</th>' +
           '<th data-sort="p99">P99 θπ</th>' +
           '<th data-sort="n_outliers">n outlier wins</th>' +
           '</tr></thead><tbody></tbody></table></div>';
    return out;
  }
  function st5Wire(rows) {
    const state = { sortKey: 'chrom', sortDir: 'asc', scale: '' };
    function render() {
      let r = rows.slice();
      if (state.scale) r = r.filter(x => x.scale === state.scale);
      const keyMap = {
        chrom: 'chrom', scale: 'scale', n_windows: 'n_windows',
        mean: 'mean_cohort_theta_pi', p99: 'p99_cohort_theta_pi',
        n_outliers: 'n_outlier_windows_above_genomewide_p99'
      };
      const k = keyMap[state.sortKey];
      r.sort((a, b) => {
        const va = a[k], vb = b[k];
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === 'number') return state.sortDir === 'asc' ? va - vb : vb - va;
        return state.sortDir === 'asc' ? String(va).localeCompare(String(vb))
                                       : String(vb).localeCompare(String(va));
      });
      const tbody = document.querySelector('#st5Table tbody');
      tbody.innerHTML = r.map(x => `<tr>
        <td>${x.chrom}</td><td><code>${x.scale}</code></td>
        <td class="num">${x.n_windows.toLocaleString()}</td>
        <td class="num">${x.mean_cohort_theta_pi == null ? '—' : Number(x.mean_cohort_theta_pi).toExponential(2)}</td>
        <td class="num">${x.p99_cohort_theta_pi == null ? '—' : Number(x.p99_cohort_theta_pi).toExponential(2)}</td>
        <td class="num">${x.n_outlier_windows_above_genomewide_p99}</td>
      </tr>`).join('');
      document.getElementById('st5Count').textContent = r.length + ' rows';
      const t = document.getElementById('st5Table');
      t.__sort = { key: state.sortKey, dir: state.sortDir };
      applySortIndicators('st5Table');
    }
    document.querySelectorAll('#st5Table th').forEach(th => {
      th.addEventListener('click', () => {
        const k = th.dataset.sort;
        if (!k) return;
        if (state.sortKey === k) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        else { state.sortKey = k; state.sortDir = (k === 'chrom' || k === 'scale') ? 'asc' : 'desc'; }
        render();
      });
    });
    document.getElementById('st5ScaleFilter').addEventListener('change', e => {
      state.scale = e.target.value; render();
    });
    render();
  }

  function renderREFTable(rows) {
    let out = '<p style="color:var(--ink-dim);font-size:10.5px">' +
      'Per-(candidate × scale) θπ tracks for MODULE_5E confirmation. ' +
      '356 inversion candidates × 4 window scales = ' +
      rows.length.toLocaleString() + ' rows. Each row points to a ' +
      'candidate-relative track TSV with windows ± 500 kb flank. Display ' +
      'capped at 1,000 — filter by scale or chromosome to drill in.</p>';
    out += '<div class="toolbar">' +
      '<select id="refScaleFilter">' +
      '<option value="">all scales</option>' +
      '<option value="main_500kb">main_500kb</option>' +
      '<option value="multi_50kb_10kb">multi_50kb_10kb</option>' +
      '<option value="multi_10kb_2kb">multi_10kb_2kb</option>' +
      '<option value="multi_5kb_1kb">multi_5kb_1kb</option>' +
      '</select>' +
      '<input id="refSearch" type="search" placeholder="filter chrom or candidate…" style="width:200px;" />' +
      '<span class="count" id="refCount"></span></div>';
    out += '<div style="max-height:340px;overflow-y:auto;border:1px solid var(--rule);border-radius:3px">';
    out += '<table class="dt" id="refTable"><thead><tr>' +
           '<th data-sort="candidate_id">candidate</th>' +
           '<th data-sort="chrom">chrom</th>' +
           '<th data-sort="start">start (Mb)</th>' +
           '<th data-sort="end">end (Mb)</th>' +
           '<th data-sort="scale">scale</th>' +
           '<th data-sort="n_inside">n inside</th>' +
           '<th data-sort="n_flank">n flank</th>' +
           '</tr></thead><tbody></tbody></table></div>';
    return out;
  }
  function refWire(rows) {
    const state = { sortKey: 'candidate_id', sortDir: 'asc', scale: '', searchText: '' };
    function render() {
      let r = rows.slice();
      if (state.scale) r = r.filter(x => x.scale === state.scale);
      if (state.searchText) {
        const q = state.searchText.toLowerCase();
        r = r.filter(x => String(x.candidate_id).toLowerCase().includes(q)
                        || String(x.chrom).toLowerCase().includes(q));
      }
      const keyMap = {
        candidate_id: 'candidate_id', chrom: 'chrom',
        start: 'candidate_start_bp', end: 'candidate_end_bp',
        scale: 'scale', n_inside: 'n_windows_inside_candidate',
        n_flank: 'n_windows_in_flank'
      };
      const k = keyMap[state.sortKey];
      r.sort((a, b) => {
        const va = a[k], vb = b[k];
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === 'number') return state.sortDir === 'asc' ? va - vb : vb - va;
        return state.sortDir === 'asc' ? String(va).localeCompare(String(vb))
                                       : String(vb).localeCompare(String(va));
      });
      const cap = 1000;
      const slice = r.slice(0, cap);
      const tbody = document.querySelector('#refTable tbody');
      tbody.innerHTML = slice.map(x => `<tr>
        <td><b>${x.candidate_id}</b></td>
        <td>${x.chrom}</td>
        <td class="num">${(x.candidate_start_bp/1e6).toFixed(2)}</td>
        <td class="num">${(x.candidate_end_bp/1e6).toFixed(2)}</td>
        <td><code>${x.scale}</code></td>
        <td class="num">${x.n_windows_inside_candidate}</td>
        <td class="num">${x.n_windows_in_flank}</td>
      </tr>`).join('');
      const note = r.length > cap ? ` · showing first ${cap}` : '';
      document.getElementById('refCount').textContent =
        r.length.toLocaleString() + ' / ' + rows.length.toLocaleString() + ' rows' + note;
      const t = document.getElementById('refTable');
      t.__sort = { key: state.sortKey, dir: state.sortDir };
      applySortIndicators('refTable');
    }
    document.querySelectorAll('#refTable th').forEach(th => {
      th.addEventListener('click', () => {
        const k = th.dataset.sort;
        if (!k) return;
        if (state.sortKey === k) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        else { state.sortKey = k;
          state.sortDir = (k === 'candidate_id' || k === 'chrom' || k === 'scale') ? 'asc' : 'desc';
        }
        render();
      });
    });
    document.getElementById('refScaleFilter').addEventListener('change', e => {
      state.scale = e.target.value; render();
    });
    document.getElementById('refSearch').addEventListener('input', e => {
      state.searchText = e.target.value; render();
    });
    render();
  }

  const containers = [
    { id: 's4bMetaBlock', data: D.S4b, meta: D.S4b_meta,
      render: renderS4bTable, wire: s4bWire },
    { id: 'st4MetaBlock', data: null,  meta: D.ST4_meta,
      render: null, wire: null },
    { id: 'st5MetaBlock', data: D.ST5, meta: D.ST5_meta,
      render: renderST5Table, wire: st5Wire },
    { id: 'refMetaBlock', data: D.REF, meta: D.REF_meta,
      render: renderREFTable, wire: refWire }
  ];
  containers.forEach(({id, data, meta, render, wire}) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (data && data.length && typeof render === 'function') {
      el.innerHTML = render(data);
      flipCardTagToShipped(el, data.length);
      if (typeof wire === 'function') wire(data);
    } else {
      el.innerHTML = metaToHTML(meta);
    }
  });
}

export async function mount(root, atlasState, registry) {
  ensureTip();
  const ctx = await ensureData();
  D = ctx.D;
  aboutHeadline();
  aboutSDTables();
  coverageTableRender();
  placeholderCardsRender();
}

export async function unmount(root) {}
