// =============================================================================
// atlases/diversity/shared/plots.js
// =============================================================================
// Generic plot renderers: histogram, scatter, horizontal bars, boxes, heatmap.
// Extracted verbatim from Diversity_atlas.html v2.4 (legacy lines 1731-1965).
// =============================================================================

import { buildSVG, svgClose, linScale, niceTicks, histogram } from './svg.js';
import { bindTip, showTip, hideTip } from './tooltip.js';
import { fmt3 } from './formatters.js';

// ---------------------------------------------------------------------------
// Histogram
// ---------------------------------------------------------------------------
export function plotHist(containerId, values, opts) {
  opts = opts || {};
  const W = opts.W || 480, H = opts.H || 200;
  const padL = opts.padL || 50, padR = opts.padR || 14, padT = opts.padT || 8, padB = opts.padB || 32;
  const nBins = opts.bins || 30;
  const valFmt = opts.valFmt || fmt3;
  const xLabel = opts.xLabel || '';
  const refLines = opts.refLines || [];
  const h = histogram(values, nBins);
  const xS = linScale(h.min, h.max, padL, W - padR);
  const yS = linScale(0, h.max_count * 1.05, H - padB, padT);
  const arr = buildSVG(W, H);
  const xt = niceTicks(h.min, h.max, 6);
  xt.forEach(v => {
    const x = xS(v);
    arr.push(`<line class="grid-line" x1="${x}" y1="${padT}" x2="${x}" y2="${H-padB}"/>`);
    arr.push(`<text class="axis-text" x="${x}" y="${H-padB+12}" text-anchor="middle">${valFmt(v)}</text>`);
  });
  const yt = niceTicks(0, h.max_count, 4);
  yt.forEach(v => {
    const y = yS(v);
    arr.push(`<line class="grid-line" x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}"/>`);
    arr.push(`<text class="axis-text" x="${padL-4}" y="${y+3}" text-anchor="end">${v}</text>`);
  });
  arr.push(`<line class="axis-line" x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}"/>`);
  arr.push(`<line class="axis-line" x1="${padL}" y1="${padT}" x2="${padL}" y2="${H-padB}"/>`);
  h.bins.forEach((b, i) => {
    const x = xS(b.x0), y = yS(b.count), w = xS(b.x1) - xS(b.x0) - 1, hh = yS(0) - yS(b.count);
    if (b.count > 0)
      arr.push(`<rect class="bar-fill" data-i="${i}" x="${x}" y="${y}" width="${Math.max(1,w)}" height="${hh}"/>`);
  });
  refLines.forEach(r => {
    const x = xS(r.value);
    arr.push(`<line class="ref-line" x1="${x}" y1="${padT}" x2="${x}" y2="${H-padB}"/>`);
    arr.push(`<text class="annot-text" x="${x}" y="${padT+8}" text-anchor="middle">${r.label}</text>`);
  });
  if (xLabel) arr.push(`<text class="axis-text" x="${(padL+W-padR)/2}" y="${H-4}" text-anchor="middle">${xLabel}</text>`);
  const host = document.getElementById(containerId);
  if (!host) return;
  host.innerHTML = svgClose(arr);
  const el = host.querySelector('svg');
  bindTip(el, i => h.bins[i],
    b => `<b>n = ${b.count}</b><div class="row">${valFmt(b.x0)} – ${valFmt(b.x1)}</div>`);
}

// ---------------------------------------------------------------------------
// Scatter
// ---------------------------------------------------------------------------
export function plotScatter(containerId, points, opts) {
  opts = opts || {};
  const W = opts.W || 480, H = opts.H || 240;
  const padL = opts.padL || 56, padR = opts.padR || 14, padT = opts.padT || 12, padB = opts.padB || 38;
  const xS_ = linScale(opts.xMin, opts.xMax, padL, W - padR);
  const yS_ = linScale(opts.yMin, opts.yMax, H - padB, padT);
  const xFmt = opts.xFmt || fmt3, yFmt = opts.yFmt || fmt3;
  const arr = buildSVG(W, H);
  const xt = niceTicks(opts.xMin, opts.xMax, 6);
  xt.forEach(v => {
    const x = xS_(v);
    arr.push(`<line class="grid-line" x1="${x}" y1="${padT}" x2="${x}" y2="${H-padB}"/>`);
    arr.push(`<text class="axis-text" x="${x}" y="${H-padB+12}" text-anchor="middle">${xFmt(v)}</text>`);
  });
  const yt = niceTicks(opts.yMin, opts.yMax, 5);
  yt.forEach(v => {
    const y = yS_(v);
    arr.push(`<line class="grid-line" x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}"/>`);
    arr.push(`<text class="axis-text" x="${padL-4}" y="${y+3}" text-anchor="end">${yFmt(v)}</text>`);
  });
  arr.push(`<line class="axis-line" x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}"/>`);
  arr.push(`<line class="axis-line" x1="${padL}" y1="${padT}" x2="${padL}" y2="${H-padB}"/>`);
  points.forEach((p, i) => {
    const x = xS_(p.x), y = yS_(p.y);
    const fill = p.color || 'var(--accent)';
    arr.push(`<circle data-i="${i}" cx="${x}" cy="${y}" r="${opts.r || 2.6}" ` +
             `fill="${fill}" fill-opacity="0.62" stroke="${fill}" stroke-width="0.6"/>`);
  });
  if (opts.xLabel) arr.push(`<text class="axis-text" x="${(padL+W-padR)/2}" y="${H-4}" text-anchor="middle">${opts.xLabel}</text>`);
  if (opts.yLabel) {
    const xPos = 14, yPos = (padT+H-padB)/2;
    arr.push(`<text class="axis-text" x="${xPos}" y="${yPos}" text-anchor="middle" transform="rotate(-90 ${xPos} ${yPos})">${opts.yLabel}</text>`);
  }
  if (opts.annot) arr.push(`<text class="annot-text" x="${W-padR-4}" y="${padT+10}" text-anchor="end" font-weight="600">${opts.annot}</text>`);
  const host = document.getElementById(containerId);
  if (!host) return;
  host.innerHTML = svgClose(arr);
  const el = host.querySelector('svg');
  bindTip(el, i => points[i], p => p.tooltip || `(${xFmt(p.x)}, ${yFmt(p.y)})`);
}

// ---------------------------------------------------------------------------
// Horizontal bars
// ---------------------------------------------------------------------------
export function plotBarH(containerId, items, opts) {
  opts = opts || {};
  const W = opts.W || 480;
  const rowH = opts.rowH || 14;
  const padL = opts.padL || 70, padR = opts.padR || 60, padT = opts.padT || 12, padB = opts.padB || 22;
  const H = padT + padB + items.length * rowH;
  const xMin = opts.xMin != null ? opts.xMin : 0;
  const xMax = opts.xMax != null ? opts.xMax : Math.max(...items.map(x => x.value));
  const xS_ = linScale(xMin, xMax, padL, W - padR);
  const valFmt = opts.valFmt || fmt3;
  const arr = buildSVG(W, H);
  const xt = niceTicks(xMin, xMax, 5);
  xt.forEach(v => {
    const x = xS_(v);
    arr.push(`<line class="grid-line" x1="${x}" y1="${padT}" x2="${x}" y2="${H-padB}"/>`);
    arr.push(`<text class="axis-text" x="${x}" y="${H-padB+11}" text-anchor="middle">${valFmt(v)}</text>`);
  });
  arr.push(`<line class="axis-line" x1="${padL}" y1="${padT}" x2="${padL}" y2="${H-padB}"/>`);
  arr.push(`<line class="axis-line" x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}"/>`);
  if (opts.refValue != null) {
    const xR = xS_(opts.refValue);
    arr.push(`<line class="ref-line" x1="${xR}" y1="${padT}" x2="${xR}" y2="${H-padB}"/>`);
    arr.push(`<text class="annot-text" x="${xR}" y="${padT-2}" text-anchor="middle">${opts.refLabel || ''}</text>`);
  }
  items.forEach((it, i) => {
    const y = padT + i * rowH + 1;
    const x0 = xS_(xMin), x1 = xS_(it.value);
    arr.push(`<text class="axis-text" x="${padL-4}" y="${y+rowH-4}" text-anchor="end">${it.label}</text>`);
    arr.push(`<rect data-i="${i}" x="${x0}" y="${y}" width="${Math.max(1,x1-x0)}" height="${rowH-3}" ` +
             `fill="${it.color || 'var(--accent)'}" fill-opacity="0.55" stroke="${it.color || 'var(--accent)'}" stroke-width="0.5"/>`);
    if (it.q25 != null && it.q75 != null) {
      const xq25 = xS_(it.q25), xq75 = xS_(it.q75);
      arr.push(`<line x1="${xq25}" y1="${y+(rowH-3)/2}" x2="${xq75}" y2="${y+(rowH-3)/2}" stroke="var(--ink)" stroke-width="0.6" stroke-opacity="0.65"/>`);
      arr.push(`<line x1="${xq25}" y1="${y+1}" x2="${xq25}" y2="${y+rowH-4}" stroke="var(--ink)" stroke-width="0.6" stroke-opacity="0.65"/>`);
      arr.push(`<line x1="${xq75}" y1="${y+1}" x2="${xq75}" y2="${y+rowH-4}" stroke="var(--ink)" stroke-width="0.6" stroke-opacity="0.65"/>`);
    }
    if (it.sd != null) {
      const xL = xS_(Math.max(xMin, it.value - it.sd));
      const xRR = xS_(Math.min(xMax, it.value + it.sd));
      arr.push(`<line x1="${xL}" y1="${y+(rowH-3)/2}" x2="${xRR}" y2="${y+(rowH-3)/2}" stroke="var(--ink-dim)" stroke-width="0.7"/>`);
    }
    arr.push(`<text class="axis-text" x="${W-padR+4}" y="${y+rowH-4}">${valFmt(it.value)}</text>`);
  });
  if (opts.xLabel) arr.push(`<text class="axis-text" x="${(padL+W-padR)/2}" y="${H-4}" text-anchor="middle">${opts.xLabel}</text>`);
  const host = document.getElementById(containerId);
  if (!host) return;
  host.innerHTML = svgClose(arr);
  const el = host.querySelector('svg');
  bindTip(el, i => items[i], it => it.tooltip || `<b>${it.label}</b><div class="row">${valFmt(it.value)}</div>`);
}

// ---------------------------------------------------------------------------
// Boxes
// ---------------------------------------------------------------------------
export function plotBoxes(containerId, groups, opts) {
  opts = opts || {};
  const W = opts.W || 480;
  const rowH = opts.rowH || 28;
  const padL = opts.padL || 80, padR = opts.padR || 90, padT = opts.padT || 18, padB = opts.padB || 28;
  const H = padT + padB + groups.length * rowH;
  const allVals = groups.flatMap(g => [g.q05, g.q95]).filter(x => x != null);
  const xMin = opts.xMin != null ? opts.xMin : Math.min(...allVals);
  const xMax = opts.xMax != null ? opts.xMax : Math.max(...allVals);
  const xS_ = linScale(xMin, xMax, padL, W - padR);
  const valFmt = opts.valFmt || fmt3;
  const arr = buildSVG(W, H);
  arr.push(`<line class="axis-line" x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}"/>`);
  const xt = niceTicks(xMin, xMax, 6);
  xt.forEach(v => {
    const x = xS_(v);
    arr.push(`<line class="grid-line" x1="${x}" y1="${padT}" x2="${x}" y2="${H-padB}"/>`);
    arr.push(`<text class="axis-text" x="${x}" y="${H-padB+12}" text-anchor="middle">${valFmt(v)}</text>`);
  });
  if (opts.refValue != null) {
    const xR = xS_(opts.refValue);
    arr.push(`<line class="ref-line" x1="${xR}" y1="${padT}" x2="${xR}" y2="${H-padB}"/>`);
    arr.push(`<text class="annot-text" x="${xR}" y="${padT-4}" text-anchor="middle">${opts.refLabel || 'cohort mean'}</text>`);
  }
  groups.forEach((g, i) => {
    const cy = padT + i * rowH + rowH / 2;
    const color = g.color || 'var(--accent)';
    arr.push(`<text class="axis-text" x="${padL-6}" y="${cy+3}" text-anchor="end">${g.label}</text>`);
    if (Array.isArray(g.points) && g.points.length > 0) {
      g.points.forEach((p, pi) => {
        if (p == null || !isFinite(p)) return;
        const x = xS_(p);
        const jit = ((Math.sin((pi+1) * 12.9898 + i * 78.233) * 43758.5453) % 1);
        const dy = (jit - Math.floor(jit) - 0.5) * (rowH * 0.45);
        arr.push(`<circle cx="${x}" cy="${cy + dy}" r="1.2" fill="${color}" fill-opacity="0.45" stroke="${color}" stroke-width="0.3" stroke-opacity="0.6"/>`);
      });
    }
    if (g.q05 != null && g.q95 != null) {
      arr.push(`<line x1="${xS_(g.q05)}" y1="${cy}" x2="${xS_(g.q95)}" y2="${cy}" stroke="${color}" stroke-width="1.0"/>`);
    }
    if (g.q25 != null && g.q75 != null) {
      arr.push(`<rect data-i="${i}" x="${xS_(g.q25)}" y="${cy-9}" width="${xS_(g.q75)-xS_(g.q25)}" height="18" fill="${color}" fill-opacity="0.30" stroke="${color}" stroke-width="1.2"/>`);
    }
    if (g.q50 != null) {
      arr.push(`<line x1="${xS_(g.q50)}" y1="${cy-10}" x2="${xS_(g.q50)}" y2="${cy+10}" stroke="${color}" stroke-width="2"/>`);
    }
    arr.push(`<text class="axis-text" x="${W-padR+4}" y="${cy+3}">${g.note || ('med ' + valFmt(g.q50))}</text>`);
  });
  if (opts.xLabel) arr.push(`<text class="axis-text" x="${(padL+W-padR)/2}" y="${H-4}" text-anchor="middle">${opts.xLabel}</text>`);
  const host = document.getElementById(containerId);
  if (!host) return;
  host.innerHTML = svgClose(arr);
  const el = host.querySelector('svg');
  bindTip(el, i => groups[i], g => g.tooltip ||
    `<b>${g.label}</b><div class="row">n = ${g.n}</div>` +
    `<div class="row">median: ${valFmt(g.q50)}</div>` +
    `<div class="row">Q25–Q75: ${valFmt(g.q25)} – ${valFmt(g.q75)}</div>`);
}

// ---------------------------------------------------------------------------
// Heatmap
// ---------------------------------------------------------------------------
export function plotHeatmap(containerId, opts) {
  const cellW = opts.cellW || 14, cellH = opts.cellH || 4;
  const padL = opts.padL || 70, padR = opts.padR || 14, padT = opts.padT || 70, padB = opts.padB || 12;
  const rows = opts.rows, cols = opts.cols;
  const W = padL + padR + cols.length * cellW;
  const H = padT + padB + rows.length * cellH;
  const arr = buildSVG(W, H);
  cols.forEach((c, ci) => {
    const x = padL + ci * cellW + cellW / 2;
    arr.push(`<text class="axis-text" font-size="9" x="${x}" y="${padT - 6}" text-anchor="end" transform="rotate(-65 ${x} ${padT - 6})">${c.label}</text>`);
  });
  const rowLabelEvery = Math.max(1, Math.ceil(rows.length / 30));
  rows.forEach((r, ri) => {
    if (ri % rowLabelEvery === 0 || ri === rows.length - 1) {
      const y = padT + ri * cellH + cellH / 2 + 3;
      arr.push(`<text class="axis-text" font-size="8" x="${padL - 4}" y="${y}" text-anchor="end">${r.label}</text>`);
    }
  });
  for (let ri = 0; ri < rows.length; ri++) {
    for (let ci = 0; ci < cols.length; ci++) {
      const v = opts.values(ri, ci);
      const x = padL + ci * cellW;
      const y = padT + ri * cellH;
      const fill = (v == null) ? 'var(--panel-2)' : opts.colorScale(v);
      arr.push(`<rect data-r="${ri}" data-c="${ci}" x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${fill}" stroke="none"/>`);
    }
  }
  const host = document.getElementById(containerId);
  if (!host) return;
  host.innerHTML = svgClose(arr);
  const el = host.querySelector('svg');
  el.addEventListener('mousemove', evt => {
    const t = evt.target;
    if (t.tagName !== 'rect') { hideTip(); return; }
    const ri = parseInt(t.getAttribute('data-r'), 10);
    const ci = parseInt(t.getAttribute('data-c'), 10);
    if (!isFinite(ri) || !isFinite(ci)) { hideTip(); return; }
    const v = opts.values(ri, ci);
    if (opts.tooltip) showTip(opts.tooltip(rows[ri], cols[ci], v), evt);
  });
  el.addEventListener('mouseleave', hideTip);
}
