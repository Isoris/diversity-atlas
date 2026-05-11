// =============================================================================
// atlases/diversity/shared/formatters.js
// =============================================================================
// Number / probability / cluster formatters used across all diversity pages.
// Extracted verbatim from Diversity_atlas.html v2.4 (legacy lines 1610-1635).
// =============================================================================

export const fmtSci = (v, digits) => v == null || !isFinite(v) ? '—' :
  Number(v).toExponential(digits == null ? 2 : digits);
export const fmt2 = v => v == null ? '—' : Number(v).toFixed(2);
export const fmt3 = v => v == null ? '—' : Number(v).toFixed(3);
export const fmt4 = v => v == null ? '—' : Number(v).toFixed(4);
export const fmtH = v => v == null ? '—' : Number(v).toFixed(5);
export const fmtMb = v => v == null ? '—' : (v / 1e6).toFixed(2);
export const fmtKb = v => v == null ? '—' : Math.round(v / 1e3);
export const fmtP = p => {
  if (p == null) return '—';
  if (p >= 0.001) return Number(p).toFixed(4);
  return Number(p).toExponential(2);
};
export const fmtPct = v => v == null ? '—' : (Number(v) * 100).toFixed(1) + '%';

export const sigClass = p => {
  if (p == null) return '';
  if (p <= 0.001) return 'sig-3';
  if (p <= 0.01)  return 'sig-2';
  if (p <= 0.05)  return 'sig-1';
  return '';
};

export function clusterSwatch(k, CLUSTER_COLORS) {
  const c = (CLUSTER_COLORS && CLUSTER_COLORS[k]) || '#888';
  return '<span class="k-swatch" style="background:' + c + '"></span>' + (k || '—');
}
