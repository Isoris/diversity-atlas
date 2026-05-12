// =============================================================================
// atlases/diversity/shared/palette.js
// =============================================================================
// Colour helpers for the diversity atlas.
//
// - kColor(k, CLUSTER_COLORS): K=8 ancestry colour from D.S9 (already loaded
//   into CLUSTER_COLORS by shared/data_loader.js). Falls back to a grey if k
//   is missing.
// - pairColor(ki, kj, CLUSTER_COLORS): Lab-space midpoint blend of two K=8
//   colours — used by the pairwise-segclass cross-K scatter to give each
//   (Gi, Gj) pair a colour the reader can decode without a 28-class legend.
//   Within-K pairs (ki === kj) return the pure K colour.
// - snpEffImpact palette: the 4-tier impact colours used by the variant
//   inventory panel (§3.1 of SPEC_2026-05-12_functional_burden.md), matching
//   the black-grouse Nature 2024 reference figure.
// - gerpHighlight: salmon/coral tone used to highlight the GERP ≥ 4 bin in
//   the constraint-score panel (§3.2).
//
// No external dependencies — Lab-space blending is implemented inline using
// the standard CIE D65 reference white (no d3-color needed).
// =============================================================================

const FALLBACK_GREY = '#888';

export function kColor(k, CLUSTER_COLORS) {
  if (!CLUSTER_COLORS) return FALLBACK_GREY;
  return CLUSTER_COLORS[k] || FALLBACK_GREY;
}

// --- sRGB ↔ Lab (CIE D65) ---------------------------------------------------
function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return { r: 136, g: 136, b: 136 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
function rgbToHex({ r, g, b }) {
  const h = v => Math.round(Math.max(0, Math.min(255, v)))
    .toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}
function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c) {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return 255 * v;
}
function rgbToXyz({ r, g, b }) {
  const rl = srgbToLinear(r), gl = srgbToLinear(g), bl = srgbToLinear(b);
  return {
    x: rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375,
    y: rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750,
    z: rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041,
  };
}
function xyzToRgb({ x, y, z }) {
  const r = x *  3.2404542 + y * -1.5371385 + z * -0.4985314;
  const g = x * -0.9692660 + y *  1.8760108 + z *  0.0415560;
  const b = x *  0.0556434 + y * -0.2040259 + z *  1.0572252;
  return { r: linearToSrgb(r), g: linearToSrgb(g), b: linearToSrgb(b) };
}
const Xn = 0.95047, Yn = 1.0, Zn = 1.08883;
const fL = t => t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + (16 / 116);
const fLinv = t => {
  const t3 = t * t * t;
  return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
};
function xyzToLab({ x, y, z }) {
  const fx = fL(x / Xn), fy = fL(y / Yn), fz = fL(z / Zn);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}
function labToXyz({ L, a, b }) {
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  return { x: Xn * fLinv(fx), y: Yn * fLinv(fy), z: Zn * fLinv(fz) };
}
function hexToLab(hex) { return xyzToLab(rgbToXyz(hexToRgb(hex))); }
function labToHex(lab) { return rgbToHex(xyzToRgb(labToXyz(lab))); }

export function pairColor(ki, kj, CLUSTER_COLORS) {
  if (ki === kj) return kColor(ki, CLUSTER_COLORS);
  const ci = hexToLab(kColor(ki, CLUSTER_COLORS));
  const cj = hexToLab(kColor(kj, CLUSTER_COLORS));
  return labToHex({
    L: (ci.L + cj.L) / 2,
    a: (ci.a + cj.a) / 2,
    b: (ci.b + cj.b) / 2,
  });
}

// --- snpEff impact-class palette (black-grouse Fig 2c) ----------------------
export const SNPEFF_IMPACT_COLORS = {
  High:     '#3F4D6A',   // dark slate
  Moderate: '#8FA8C8',   // light blue
  Low:      '#8F5577',   // mauve
  Modifier: '#E6C26B',   // yellow
};

// --- GERP highlight tone ---------------------------------------------------
export const GERP_HIGHLIGHT = '#E89A8A';

// --- Sequential ramps for hex-bin density and biotype heatmap ---------------
// pyMSAviz-aside, kept simple: one neutral grey ramp + one blue ramp.
export function greyRamp(t) {
  const v = Math.round(240 - t * 180);     // 240 → 60
  return `rgb(${v},${v},${v})`;
}
export function blueRamp(t) {
  // pale aqua to deep blue, matches the biotype-heatmap reference figure
  const r = Math.round(220 - t * 180);
  const g = Math.round(235 - t * 100);
  const b = Math.round(245 - t * 40);
  return `rgb(${r},${g},${b})`;
}
