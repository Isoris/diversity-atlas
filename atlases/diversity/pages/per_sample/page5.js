// =============================================================================
// atlases/diversity/pages/per_sample/page5.js — ROH composition
// =============================================================================
// Stage:        per_sample
// Legacy DOM:   <div id="page5"> (Diversity_atlas.html v2.4 lines 860-1023)
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

let D = null;

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

export async function mount(root, atlasState, registry) {
  ensureTip();
  const ctx = await ensureData();
  D = ctx.D;
  rohTopStrip();
  binSchemeRender();
  rohWire();
  rohRender();
  plotsPage5();
  s12Wire();
  s12Render();
  s8cWire();
  s8cRender();
}

export async function unmount(root) {}
