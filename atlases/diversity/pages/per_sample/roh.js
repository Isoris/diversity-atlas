// =============================================================================
// atlases/diversity/pages/per_sample/roh.js — ROH composition
// =============================================================================
// Stage:        per_sample
// Legacy DOM:   <div id="page5"> (renamed -> id="roh") (Diversity_atlas.html v2.4 lines 860-1023)
// Renderers:    rohTopStrip, binSchemeRender, rohRender, rohWire, plotsPage5,
//               s12Render/Wire, s8cRender/Wire (legacy 2756-3376).
// =============================================================================

import { ensureData } from '../../shared/data_loader.js';
import { ensureTip, showTip, hideTip, bindTip } from '../../shared/tooltip.js';
import { fmtSci, fmt3 } from '../../shared/formatters.js';
import { sortRows, applySortIndicators, fillSimpleTable } from '../../shared/tables.js';
import { plotHeatmap } from '../../shared/plots.js';
import {
  buildSVG, svgClose, linScale, makeWarmScale
} from '../../shared/svg.js';
import { mountStratificationPills, frohQuartiles } from '../../shared/stratification.js';
import { kColor, blueRamp } from '../../shared/palette.js';

let D = null;
let RGO = null;
let CLUSTER_COLORS = null;
const rgbState = { stratMode: 'K=8' };

function rohTopStrip() {
  const totals = {};
  D.S8.forEach(r => {
    if (!totals[r.class]) totals[r.class] = { n: 0, bp: 0 };
    totals[r.class].n += r.n_tracts || 0;
    totals[r.class].bp += r.bp || 0;
  });
  const orderedClasses = ['1-2Mb', '2-4Mb', '4-8Mb', '8-16Mb', '>16Mb'];
  const cells = orderedClasses.map(c => {
    const t = totals[c] || { n: 0, bp: 0 };
    return {
      lbl: c, val: (t.n || 0).toLocaleString(),
      sub: 'Σ ' + (t.bp / 1e9).toFixed(1) + ' Gb (cohort)'
    };
  });
  document.getElementById('rohTopStrip').innerHTML = cells.map(c =>
    `<div class="stat-cell"><div class="lbl">${c.lbl}</div>` +
    `<div class="val">${c.val}</div><div class="sub">${c.sub}</div></div>`
  ).join('');
}

function binSchemeRender() {
  if (D.SD4) fillSimpleTable('binSchemeTable', D.SD4.header, D.SD4.rows);
}

const rohState = { sortKey: 'sample', sortDir: 'asc',
                   classFilter: '', searchText: '' };

function rohRender() {
  let rows = D.S8.slice();
  if (rohState.classFilter) rows = rows.filter(r => r.class === rohState.classFilter);
  if (rohState.searchText) {
    const q = rohState.searchText.toLowerCase();
    rows = rows.filter(r => r.sample.toLowerCase().includes(q));
  }
  rows.sort((a,b) => {
    const k = rohState.sortKey;
    let av = a[k], bv = b[k];
    if (k === 'bp_mb') { av = a.bp / 1e6; bv = b.bp / 1e6; }
    if (typeof av === 'string') {
      const c = av.localeCompare(bv);
      return rohState.sortDir === 'asc' ? c : -c;
    }
    return rohState.sortDir === 'asc' ? av - bv : bv - av;
  });
  const tbody = document.querySelector('#rohBinsTable tbody');
  tbody.innerHTML = rows.slice(0, 500).map(r => `<tr>
    <td>${r.sample}</td>
    <td>${r.class}</td>
    <td class="num">${r.n_tracts}</td>
    <td class="num">${(r.bp || 0).toLocaleString()}</td>
    <td class="num">${(r.bp / 1e6).toFixed(2)}</td>
    <td class="num">${(r.pct || 0).toFixed(2)}%</td>
  </tr>`).join('');
  const t = document.getElementById('rohBinsTable');
  t.__sort = { key: rohState.sortKey, dir: rohState.sortDir };
  applySortIndicators('rohBinsTable');
  document.getElementById('rohCount').textContent = rows.length + ' rows · showing first 500';
}

function rohWire() {
  document.querySelectorAll('#rohBinsTable th').forEach(th => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (!k) return;
      if (rohState.sortKey === k) rohState.sortDir = rohState.sortDir === 'asc' ? 'desc' : 'asc';
      else { rohState.sortKey = k; rohState.sortDir = 'asc'; }
      rohRender();
    });
  });
  document.getElementById('rohSearch').addEventListener('input', e => {
    rohState.searchText = e.target.value; rohRender();
  });
  const sel = document.getElementById('rohClassFilter');
  [...new Set(D.S8.map(r => r.class))].forEach(c => {
    const opt = document.createElement('option'); opt.value = c; opt.textContent = c; sel.appendChild(opt);
  });
  sel.addEventListener('change', e => { rohState.classFilter = e.target.value; rohRender(); });
}

function plotsPage5() {
  const orderedClasses = ['1-2Mb', '2-4Mb', '4-8Mb', '8-16Mb', '>16Mb'];
  const classColors = ['#5fd49a', '#3cc08a', '#22a070', '#0e7a55', '#075c40'];

  // ROH length spectrum (cohort)
  const tally = {};
  D.S8.forEach(r => {
    if (!tally[r.class]) tally[r.class] = { n: 0, bp: 0 };
    tally[r.class].n += r.n_tracts || 0;
    tally[r.class].bp += r.bp || 0;
  });
  const W = 1100, H = 240;
  const padL = 70, padR = 90, padT = 24, padB = 36;
  const halfW = (W - padL - padR) / 2;
  const arr = buildSVG(W, H);

  {
    const maxN = Math.max(...orderedClasses.map(c => (tally[c] && tally[c].n) || 0));
    const xS_ = linScale(0, maxN * 1.1, padL, padL + halfW - 16);
    arr.push(`<text class="title-text" x="${padL}" y="${padT-8}">Tract count by length class</text>`);
    orderedClasses.forEach((c, i) => {
      const y = padT + 8 + i * 38;
      const v = (tally[c] && tally[c].n) || 0;
      const x1 = xS_(v);
      arr.push(`<text class="axis-text" x="${padL-6}" y="${y+15}" text-anchor="end">${c}</text>`);
      arr.push(`<rect x="${padL}" y="${y}" width="${Math.max(1,x1-padL)}" height="22" fill="${classColors[i]}" fill-opacity="0.55" stroke="${classColors[i]}" stroke-width="0.5"/>`);
      arr.push(`<text class="axis-text" x="${x1+4}" y="${y+15}">${v.toLocaleString()}</text>`);
    });
  }
  {
    const xMid = padL + halfW + 10;
    const maxBp = Math.max(...orderedClasses.map(c => (tally[c] && tally[c].bp) || 0));
    const xS_ = linScale(0, maxBp * 1.1, xMid, xMid + halfW - 20);
    arr.push(`<text class="title-text" x="${xMid}" y="${padT-8}">Total ROH (Gb) by length class</text>`);
    orderedClasses.forEach((c, i) => {
      const y = padT + 8 + i * 38;
      const v = (tally[c] && tally[c].bp) || 0;
      const x1 = xS_(v);
      arr.push(`<text class="axis-text" x="${xMid-6}" y="${y+15}" text-anchor="end">${c}</text>`);
      arr.push(`<rect x="${xMid}" y="${y}" width="${Math.max(1,x1-xMid)}" height="22" fill="${classColors[i]}" fill-opacity="0.55" stroke="${classColors[i]}" stroke-width="0.5"/>`);
      arr.push(`<text class="axis-text" x="${x1+4}" y="${y+15}">${(v/1e9).toFixed(2)} Gb</text>`);
    });
  }
  document.getElementById('plotROHSpectrum').innerHTML = svgClose(arr);

  // Per-sample stacked F_ROH composition
  const bySample = {};
  D.S8.forEach(r => {
    if (!bySample[r.sample]) bySample[r.sample] = {};
    bySample[r.sample][r.class] = (r.bp || 0);
  });
  const allSamples = D.S1.slice().sort((a, b) => b.f_roh - a.f_roh);

  function renderStacked(view) {
    let lineup, titleSuffix;
    if (view === 'all') {
      lineup = allSamples.slice();
      titleSuffix = '· all 226 samples (sorted by F_ROH desc)';
    } else if (view === 'top') {
      lineup = allSamples.slice(0, 100);
      titleSuffix = '· top 100 by F_ROH';
    } else {
      const top = allSamples.slice(0, 60);
      const bot = allSamples.slice(-60);
      lineup = top.concat([{ sample: '__sep__' }]).concat(bot);
      titleSuffix = '· top 60 (left) | bottom 60 (right)';
    }

    const rowW = view === 'all' ? 4 : (view === 'top' ? 6 : 7);
    const padL2 = 110, padR2 = 60, padT2 = 26, padB2 = 30;
    const W2x = padL2 + padR2 + lineup.length * rowW;
    const H2 = 220;
    const yS_ = linScale(0, 1, H2 - padB2, padT2);
    const arr2 = buildSVG(W2x, H2);

    arr2.push(`<text class="title-text" x="${padL2}" y="${padT2-8}">Stacked F_ROH composition ${titleSuffix}</text>`);
    arr2.push(`<line class="axis-line" x1="${padL2}" y1="${H2-padB2}" x2="${W2x-padR2}" y2="${H2-padB2}"/>`);
    arr2.push(`<line class="axis-line" x1="${padL2}" y1="${padT2}" x2="${padL2}" y2="${H2-padB2}"/>`);
    [0, 0.25, 0.5, 0.75, 1].forEach(v => {
      const y = yS_(v);
      arr2.push(`<line class="grid-line" x1="${padL2}" y1="${y}" x2="${W2x-padR2}" y2="${y}"/>`);
      arr2.push(`<text class="axis-text" x="${padL2-4}" y="${y+3}" text-anchor="end">${(v*100).toFixed(0)}%</text>`);
    });

    lineup.forEach((s, i) => {
      const x = padL2 + i * rowW;
      if (s.sample === '__sep__') {
        arr2.push(`<line x1="${x+rowW/2}" y1="${padT2}" x2="${x+rowW/2}" y2="${H2-padB2}" stroke="var(--ink-dim)" stroke-width="1" stroke-dasharray="3,3"/>`);
        arr2.push(`<text class="annot-text" x="${x+rowW/2}" y="${H2-padB2+12}" text-anchor="middle">↑ low F_ROH</text>`);
        return;
      }
      const comp = bySample[s.sample] || {};
      const total = orderedClasses.reduce((a, c) => a + (comp[c] || 0), 0);
      if (total === 0) return;
      let acc = 0;
      orderedClasses.forEach((c, ci) => {
        const v = (comp[c] || 0) / total;
        const y0 = yS_(acc + v), y1 = yS_(acc);
        arr2.push(`<rect data-i="${i}" data-ci="${ci}" x="${x}" y="${y0}" width="${Math.max(0.4, rowW-0.6)}" height="${y1-y0}" fill="${classColors[ci]}" fill-opacity="0.78" stroke="${classColors[ci]}" stroke-width="0.3"/>`);
        acc += v;
      });
    });

    orderedClasses.forEach((c, i) => {
      const xL = W2x - padR2 + 8;
      const yL = padT2 + 6 + i * 18;
      arr2.push(`<rect x="${xL}" y="${yL}" width="10" height="10" fill="${classColors[i]}" fill-opacity="0.78"/>`);
      arr2.push(`<text class="axis-text" x="${xL+14}" y="${yL+9}">${c}</text>`);
    });

    arr2.push(`<text class="axis-text" x="14" y="${(padT2+H2-padB2)/2}" text-anchor="middle" transform="rotate(-90 14 ${(padT2+H2-padB2)/2})">% of total ROH</text>`);
    document.getElementById('plotROHStacked').innerHTML = svgClose(arr2);

    const ssvg = document.getElementById('plotROHStacked').querySelector('svg');
    ssvg.addEventListener('mousemove', evt => {
      const t = evt.target;
      if (t.tagName !== 'rect' || t.getAttribute('data-i') == null) { hideTip(); return; }
      const i = parseInt(t.getAttribute('data-i'), 10);
      const ci = parseInt(t.getAttribute('data-ci'), 10);
      const s = lineup[i];
      if (!s || s.sample === '__sep__') { hideTip(); return; }
      const comp = bySample[s.sample] || {};
      const total = orderedClasses.reduce((a, c) => a + (comp[c] || 0), 0);
      const cClass = orderedClasses[ci];
      const cBp = comp[cClass] || 0;
      const cPct = total > 0 ? (cBp / total * 100).toFixed(1) : '0';
      showTip(`<b>${s.sample}</b> · F_ROH ${s.f_roh.toFixed(3)}` +
              `<div class="row">${cClass}: ${(cBp/1e6).toFixed(2)} Mb (${cPct}%)</div>`, evt);
    });
    ssvg.addEventListener('mouseleave', hideTip);

    const cEl = document.getElementById('stackCount');
    if (cEl) {
      const drawn = lineup.filter(s => s.sample !== '__sep__').length;
      cEl.textContent = drawn + ' samples plotted';
    }
  }

  renderStacked('contrast');

  document.querySelectorAll('.pill[data-stack-view]').forEach(p => {
    p.addEventListener('click', () => {
      document.querySelectorAll('.pill[data-stack-view]').forEach(x => x.classList.remove('on'));
      p.classList.add('on');
      renderStacked(p.dataset.stackView);
    });
  });

  // Per-chromosome × per-sample F_ROH heatmap (S8b)
  const sampleOrder = D.S1.slice().sort((a, b) => b.f_roh - a.f_roh).map(s => s.sample);
  const chrOrder = D.S4.slice()
    .sort((a, b) => parseInt(a.chr.replace('LG','')) - parseInt(b.chr.replace('LG','')))
    .map(c => c.chr);
  const cellMap = new Map();
  D.S8b.forEach(r => { cellMap.set(r.chr + '|' + r.sample, r.froh); });
  const sampleFRohMap = new Map();
  D.S1.forEach(s => { sampleFRohMap.set(s.sample, s.f_roh); });
  const sampleK8Map = new Map();
  D.S1.forEach(s => { sampleK8Map.set(s.sample, s.k8); });
  plotHeatmap('plotChrSampleHeatmap', {
    rows: sampleOrder.map(s => ({ label: s, _sample: s })),
    cols: chrOrder.map(c => ({ label: c.replace('LG',''), _chr: c })),
    values: (r, c) => {
      const v = cellMap.get(chrOrder[c] + '|' + sampleOrder[r]);
      return v == null ? null : Math.min(v, 1.0);
    },
    colorScale: makeWarmScale(0, 1),
    cellW: 20, cellH: 3, padL: 80, padT: 50,
    tooltip: (row, col, v) => {
      const raw = cellMap.get(col._chr + '|' + row._sample);
      const k8 = sampleK8Map.get(row._sample);
      const samFroh = sampleFRohMap.get(row._sample);
      const overflow = raw != null && raw > 1
        ? '<div class="row" style="color:var(--bad);">⚠ &gt; 1 (callable-mask shortfall, see S4 caveat)</div>'
        : '';
      return `<b>${row._sample}</b> · ${k8} · sample F_ROH ${samFroh == null ? '—' : samFroh.toFixed(3)}` +
             `<div class="row">${col._chr}</div>` +
             `<div class="row">F_ROH: ${raw == null ? '—' : raw.toFixed(3)}</div>` +
             overflow;
    }
  });
}

// S12
const s12State = { sortKey: 'sample', sortDir: 'asc', searchText: '', filter: 'all' };

function s12Render() {
  if (!D.S12) return;
  let rows = D.S12.slice();
  if (s12State.filter === 'outliers') rows = rows.filter(r => r.is_outlier_low_ratio);
  if (s12State.searchText) {
    const q = s12State.searchText.toLowerCase();
    rows = rows.filter(r => r.sample.toLowerCase().includes(q));
  }
  rows = sortRows(rows, { key: s12State.sortKey, dir: s12State.sortDir });
  const tbody = document.querySelector('#s12Table tbody');
  tbody.innerHTML = rows.map(r => {
    const flag = r.is_outlier_low_ratio
      ? '<span style="color:var(--bad);font-weight:600;">⚠ low</span>'
      : '<span style="color:var(--ink-dim);">·</span>';
    return `<tr>
      <td>${r.sample}</td>
      <td class="num">${(r.callable_bp_in_ROH/1e6).toFixed(1)} Mb</td>
      <td class="num">${(r.callable_bp_out_ROH/1e6).toFixed(1)} Mb</td>
      <td class="num">${fmtSci(r.het_in_ROH, 2)}</td>
      <td class="num">${fmtSci(r.het_out_ROH, 2)}</td>
      <td class="num">${r.het_ratio_out_over_in == null ? '—' : Number(r.het_ratio_out_over_in).toFixed(2)}</td>
      <td>${flag}</td>
    </tr>`;
  }).join('');
  document.getElementById('s12Count').textContent = rows.length + ' / 226 samples';
  const t = document.getElementById('s12Table');
  t.__sort = { key: s12State.sortKey, dir: s12State.sortDir };
  applySortIndicators('s12Table');
  if (D.S12_summary) {
    document.getElementById('s12MedianRatio').textContent =
      Number(D.S12_summary.median).toFixed(2);
    document.getElementById('s12Q05').textContent =
      Number(D.S12_summary.q05).toFixed(2);
  }
}

function s12Wire() {
  document.querySelectorAll('#s12Table th').forEach(th => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (!k) return;
      if (s12State.sortKey === k) s12State.sortDir = s12State.sortDir === 'asc' ? 'desc' : 'asc';
      else { s12State.sortKey = k; s12State.sortDir = (k === 'sample') ? 'asc' : 'desc'; }
      s12Render();
    });
  });
  document.getElementById('s12Search').addEventListener('input', e => {
    s12State.searchText = e.target.value; s12Render();
  });
  document.querySelectorAll('.pill[data-s12-filter]').forEach(p => {
    p.addEventListener('click', () => {
      s12State.filter = p.dataset.s12Filter;
      document.querySelectorAll('.pill[data-s12-filter]').forEach(x => x.classList.remove('on'));
      p.classList.add('on');
      s12Render();
    });
  });
}

// S8c
const s8cState = { sortKey: 'len_bp', sortDir: 'desc', searchText: '',
                   chrFilter: '', minLenMb: 1 };

function s8cRender() {
  if (!D.S8c_long) return;
  let rows = D.S8c_long.map(r => ({ chr: r[0], start: r[1], end: r[2], sample: r[3], len_bp: r[4] }));
  if (s8cState.chrFilter) rows = rows.filter(r => r.chr === s8cState.chrFilter);
  if (s8cState.minLenMb > 1) rows = rows.filter(r => r.len_bp >= s8cState.minLenMb * 1e6);
  if (s8cState.searchText) {
    const q = s8cState.searchText.toLowerCase();
    rows = rows.filter(r => r.sample.toLowerCase().includes(q));
  }
  rows = sortRows(rows, { key: s8cState.sortKey, dir: s8cState.sortDir });
  const tbody = document.querySelector('#s8cTable tbody');
  const cap = 1000;
  const slice = rows.slice(0, cap);
  tbody.innerHTML = slice.map(r => `<tr>
    <td>${r.sample}</td>
    <td>${r.chr}</td>
    <td class="num">${(r.start/1e6).toFixed(2)}</td>
    <td class="num">${(r.end/1e6).toFixed(2)}</td>
    <td class="num">${(r.len_bp/1e6).toFixed(2)}</td>
  </tr>`).join('');
  const note = rows.length > cap ? ` · showing first ${cap}` : '';
  document.getElementById('s8cCount').textContent = rows.length.toLocaleString() + ' tracts' + note;
  const t = document.getElementById('s8cTable');
  t.__sort = { key: s8cState.sortKey, dir: s8cState.sortDir };
  applySortIndicators('s8cTable');
}

function s8cWire() {
  if (!D.S8c_long) return;
  document.querySelectorAll('#s8cTable th').forEach(th => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (!k) return;
      if (s8cState.sortKey === k) s8cState.sortDir = s8cState.sortDir === 'asc' ? 'desc' : 'asc';
      else { s8cState.sortKey = k; s8cState.sortDir = (k === 'sample' || k === 'chr') ? 'asc' : 'desc'; }
      s8cRender();
    });
  });
  document.getElementById('s8cSearch').addEventListener('input', e => {
    s8cState.searchText = e.target.value; s8cRender();
  });
  const chrSel = document.getElementById('s8cChrFilter');
  const chrs = [...new Set(D.S8c_long.map(r => r[0]))].sort();
  chrs.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    chrSel.appendChild(opt);
  });
  chrSel.addEventListener('change', e => { s8cState.chrFilter = e.target.value; s8cRender(); });
  document.getElementById('s8cLenFilter').addEventListener('change', e => {
    s8cState.minLenMb = parseFloat(e.target.value); s8cRender();
  });
}

// =============================================================================
// ROH × gene-model views — Plot A (cumulative) + Plot B (biotype heatmap)
// =============================================================================
// Scaffolded with no-data fallback per
//   _handoff_docs/SPEC_2026-05-12_roh_gene_burden.md
// Activates only when ROH_GENE_OVERLAP payload is non-empty; otherwise both
// cards render "data pending" text and the rest of page 5 is unaffected.
// =============================================================================

function hasRohGeneOverlap() {
  return RGO && (
    (Array.isArray(RGO.peaks) && RGO.peaks.length > 0) ||
    (RGO.per_group_cumulative && Array.isArray(RGO.per_group_cumulative['K=8'])
       && RGO.per_group_cumulative['K=8'].length > 0)
  );
}

function familyAvailableForRgb() {
  return RGO && Array.isArray(RGO.per_family_cumulative)
      && RGO.per_family_cumulative.length > 0;
}

function plotRohGeneCumulative() {
  const host = document.getElementById('plotRohGeneCumulative');
  const tag = document.getElementById('rohGeneBurdenTag');
  if (!host) return;
  if (!hasRohGeneOverlap()) {
    host.innerHTML = '<div style="color:var(--ink-dim); padding:24px; text-align:center; font-style:italic; font-size:11px;">' +
      'ROH × gene-model intersection not yet available. Constraint proxy is still pending in genome-atlas (BUSCO / OrthoFinder / dN/dS / ohnolog / GERP).</div>';
    if (tag) tag.textContent = '⏳ awaiting ROH × gene-model overlap';
    return;
  }

  let series = [];
  if (rgbState.stratMode === 'K=8') {
    series = (RGO.per_group_cumulative['K=8'] || []).map(s => ({
      label: s.group, color: kColor(s.group, CLUSTER_COLORS), xs: s.x_blocks, ys: s.y_cum,
    }));
  } else if (rgbState.stratMode === 'family') {
    series = (RGO.per_family_cumulative || []).map(s => ({
      label: s.family_id, color: '#8aa6c7', xs: s.x_blocks, ys: s.y_cum,
    }));
  } else if (rgbState.stratMode === 'froh_q') {
    series = (RGO.per_quartile_cumulative || []).map(s => ({
      label: s.quartile, color: '#c46b6b', xs: s.x_blocks, ys: s.y_cum,
    }));
  } else if (rgbState.stratMode === 'sample') {
    series = [];   // drill-down only, populated by table-row click
  }

  if (series.length === 0 || series.every(s => !Array.isArray(s.xs) || s.xs.length === 0)) {
    host.innerHTML = '<div style="color:var(--ink-dim); padding:24px; text-align:center; font-style:italic; font-size:11px;">' +
      `No payload for stratification "${rgbState.stratMode}".</div>`;
    if (tag) tag.textContent = `mode: ${rgbState.stratMode}`;
    return;
  }
  if (tag) tag.textContent = `mode: ${rgbState.stratMode}`;

  const W = 880, H = 320;
  const padL = 60, padR = 140, padT = 12, padB = 36;
  const allX = series.flatMap(s => s.xs || []);
  const allY = series.flatMap(s => s.ys || []);
  const xMax = Math.max(...allX, 1);
  const yMax = Math.max(...allY, 1);
  const xS = linScale(0, xMax, padL, W - padR);
  const yS = linScale(yMax, 0, padT, H - padB);
  const arr = buildSVG(W, H);
  // axes
  const yt = niceTicksLocal(0, yMax, 5);
  yt.forEach(v => {
    const y = yS(v);
    arr.push(`<line class="grid-line" x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}"/>`);
    arr.push(`<text class="axis-text" x="${padL-4}" y="${y+3}" text-anchor="end">${v}</text>`);
  });
  const xt = niceTicksLocal(0, xMax, 6);
  xt.forEach(v => {
    const x = xS(v);
    arr.push(`<line class="grid-line" x1="${x}" y1="${padT}" x2="${x}" y2="${H-padB}"/>`);
    arr.push(`<text class="axis-text" x="${x}" y="${H-padB+12}" text-anchor="middle">${v}</text>`);
  });
  series.forEach(s => {
    if (!Array.isArray(s.xs) || s.xs.length === 0) return;
    const pts = s.xs.map((x, i) => `${xS(x)},${yS(s.ys[i] || 0)}`).join(' ');
    arr.push(`<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2"/>`);
  });
  // legend
  series.forEach((s, i) => {
    const y = padT + i * 16;
    arr.push(`<rect x="${W-padR+8}" y="${y}" width="12" height="12" fill="${s.color}"/>`);
    arr.push(`<text class="axis-text" x="${W-padR+24}" y="${y+10}" text-anchor="start">${s.label}</text>`);
  });
  arr.push(`<text class="axis-text" x="${(padL+W-padR)/2}" y="${H-4}" text-anchor="middle">ROH blocks added (ranked)</text>`);
  host.innerHTML = svgClose(arr);
}

function niceTicksLocal(lo, hi, n) {
  const range = hi - lo;
  if (range <= 0) return [lo];
  const step = Math.pow(10, Math.floor(Math.log10(range / n)));
  const err = range / (n * step);
  const mult = err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1;
  const s = step * mult;
  const t0 = Math.ceil(lo / s) * s;
  const out = [];
  for (let v = t0; v <= hi + s * 0.0001; v += s) out.push(Number(v.toFixed(12)));
  return out;
}

function plotRohBiotype() {
  const host = document.getElementById('plotRohBiotype');
  const tag = document.getElementById('rohBiotypeTag');
  if (!host) return;
  const peaks = (RGO && Array.isArray(RGO.peaks)) ? RGO.peaks : [];
  if (peaks.length === 0) {
    host.innerHTML = '<div style="color:var(--ink-dim); padding:24px; text-align:center; font-style:italic; font-size:11px;">' +
      'No named ROH peak / biotype intersection data yet.</div>';
    if (tag) tag.textContent = '⏳ awaiting ROH × gene-model overlap';
    return;
  }
  // 9 canonical biotypes per reference figure
  const biotypeOrder = [
    'Protein_coding', 'Pseudogene', 'lncRNA', 'miRNA',
    'Transcribed_pseudogene', 'snoRNA', 'tRNA', 'snRNA', 'Antisense_RNA'
  ];
  // Filter to biotypes that appear in at least one peak
  const present = biotypeOrder.filter(b =>
    peaks.some(p => p.biotype_counts && p.biotype_counts[b] > 0));
  if (present.length === 0) {
    host.innerHTML = '<div style="color:var(--ink-dim); padding:18px; text-align:center; font-style:italic; font-size:11px;">' +
      'No biotype counts populated.</div>';
    return;
  }
  const maxCount = Math.max(
    1,
    ...peaks.flatMap(p => present.map(b => p.biotype_counts && p.biotype_counts[b] || 0))
  );
  const cellW = 110, cellH = 22;
  const W = 240 + peaks.length * cellW;
  const H = 36 + present.length * cellH + 24;
  const labelW = 200;
  const arr = buildSVG(W, H);

  // Colour legend
  arr.push(`<text class="axis-text" x="14" y="14" text-anchor="start" style="font-weight:600;">Gene count</text>`);
  for (let i = 0; i < 100; i++) {
    arr.push(`<rect x="${110 + i}" y="6" width="1.1" height="10" fill="${blueRamp(i / 99)}"/>`);
  }
  arr.push(`<text class="axis-text" x="108" y="22" text-anchor="end">1</text>`);
  arr.push(`<text class="axis-text" x="212" y="22" text-anchor="start">${maxCount}</text>`);

  // Column headers
  peaks.forEach((p, j) => {
    const x = labelW + j * cellW;
    arr.push(`<text class="axis-text" x="${x + cellW/2}" y="34" text-anchor="middle" style="font-weight:600;">${p.name || ('peak ' + (j+1))}</text>`);
  });

  // Rows
  present.forEach((b, i) => {
    const y = 36 + i * cellH;
    arr.push(`<text class="axis-text" x="${labelW - 8}" y="${y + cellH - 6}" text-anchor="end">${b}</text>`);
    peaks.forEach((p, j) => {
      const x = labelW + j * cellW;
      const v = (p.biotype_counts && p.biotype_counts[b]) || 0;
      const t = v > 0 ? Math.max(0.05, v / maxCount) : 0;
      const fill = v > 0 ? blueRamp(t) : '#fff';
      arr.push(`<rect x="${x}" y="${y}" width="${cellW - 1}" height="${cellH - 2}" fill="${fill}" stroke="#ddd" stroke-width="0.5"/>`);
      if (v > 0) {
        const ink = t > 0.55 ? '#fff' : '#222';
        arr.push(`<text x="${x + cellW/2}" y="${y + cellH - 6}" text-anchor="middle" style="font-size:10px; fill:${ink};">${v}</text>`);
      }
    });
  });
  host.innerHTML = svgClose(arr);
  if (tag) tag.textContent = `${present.length} biotypes × ${peaks.length} peaks`;
}

function rgbWire() {
  const stratHost = document.getElementById('rgbStratPills');
  if (stratHost) {
    mountStratificationPills(stratHost, {
      initial: rgbState.stratMode,
      familyAvailable: familyAvailableForRgb(),
      onChange: m => {
        rgbState.stratMode = m;
        plotRohGeneCumulative();
      },
    });
  }
}

export async function mount(root, atlasState, registry) {
  ensureTip();
  const ctx = await ensureData();
  D = ctx.D;
  CLUSTER_COLORS = ctx.CLUSTER_COLORS;
  RGO = ctx.ROH_GENE_OVERLAP;
  rohTopStrip();
  binSchemeRender();
  rohWire();
  rohRender();
  plotsPage5();
  s12Wire();
  s12Render();
  s8cWire();
  s8cRender();
  rgbWire();
  plotRohGeneCumulative();
  plotRohBiotype();
}

export async function unmount(root) {}
