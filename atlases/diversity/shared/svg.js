// =============================================================================
// atlases/diversity/shared/svg.js
// =============================================================================
// SVG building blocks + small stats helpers used by every plot renderer.
// Extracted verbatim from Diversity_atlas.html v2.4 (legacy lines 1675-1729,
// 1967-1989).
// =============================================================================

export function buildSVG(W, H) {
  return [`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">`];
}

export function svgClose(arr) { arr.push('</svg>'); return arr.join(''); }

export function linScale(d0, d1, r0, r1) {
  const f = (r1 - r0) / (d1 - d0 || 1);
  return v => r0 + (v - d0) * f;
}

export function niceTicks(d0, d1, n) {
  const range = d1 - d0;
  if (range <= 0) return [d0];
  const step = Math.pow(10, Math.floor(Math.log10(range / n)));
  const err = range / (n * step);
  const mult = err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1;
  const s = step * mult;
  const t0 = Math.ceil(d0 / s) * s;
  const arr = [];
  for (let v = t0; v <= d1 + s * 0.0001; v += s) arr.push(Number(v.toFixed(12)));
  return arr;
}

export function histogram(values, nBins) {
  const v = values.filter(x => x != null && isFinite(x));
  if (v.length === 0) return { bins: [], min: 0, max: 1, max_count: 0 };
  const lo = Math.min(...v), hi = Math.max(...v);
  const w = (hi - lo) / nBins;
  const bins = Array.from({length: nBins}, (_, i) => ({
    x0: lo + i * w, x1: lo + (i + 1) * w, count: 0
  }));
  v.forEach(x => {
    let i = Math.floor((x - lo) / w);
    if (i >= nBins) i = nBins - 1;
    if (i < 0) i = 0;
    bins[i].count += 1;
  });
  return { bins, min: lo, max: hi, max_count: Math.max(...bins.map(b => b.count)) };
}

export function quantileSorted(sorted, p) {
  if (sorted.length === 0) return null;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

export function quartiles(values) {
  const v = values.filter(x => x != null).slice().sort((a, b) => a - b);
  return {
    n: v.length,
    min: v[0] || null, max: v[v.length - 1] || null,
    q05: quantileSorted(v, 0.05), q25: quantileSorted(v, 0.25),
    q50: quantileSorted(v, 0.50), q75: quantileSorted(v, 0.75),
    q95: quantileSorted(v, 0.95)
  };
}

export function makeSeqScale(vMin, vMax) {
  const span = vMax - vMin || 1;
  return v => {
    if (v == null) return 'var(--panel-2)';
    const t = Math.max(0, Math.min(1, (v - vMin) / span));
    const r = Math.round(20 + t * (60 - 20));
    const g = Math.round(34 + t * (220 - 34));
    const b = Math.round(48 + t * (130 - 48));
    return `rgb(${r},${g},${b})`;
  };
}

export function makeWarmScale(vMin, vMax) {
  const span = vMax - vMin || 1;
  return v => {
    if (v == null) return 'var(--panel-2)';
    const t = Math.max(0, Math.min(1, (v - vMin) / span));
    const r = Math.round(244 - t * (244 - 120));
    const g = Math.round(228 - t * 228);
    const b = Math.round(140 - t * 140);
    return `rgb(${Math.max(0,r)},${Math.max(0,g)},${Math.max(0,b)})`;
  };
}

export function percentileOf(arr, v) {
  const xs = arr.filter(x => x != null && isFinite(x)).slice().sort((a, b) => a - b);
  if (xs.length === 0) return null;
  let i = 0;
  while (i < xs.length && xs[i] < v) i++;
  return i / xs.length;
}
