// =============================================================================
// atlases/diversity/shared/stratification.js
// =============================================================================
// Four-state stratification pill toggle, shared between the burden pages
// (page 5 ROH × gene-model views and page 10 functional burden).
//
// Resolved 2026-05-12 round-1 session:
//   SPEC_2026-05-12_roh_gene_burden.md §6.3 → option (E) all modes
//   SPEC_2026-05-12_functional_burden.md §6.6 → option (E) all modes
//
// States:
//   - "K=8"      — default ancestry-cluster view (always available)
//   - "family"   — per-family box (only if any sample row has a family_id)
//   - "sample"   — per-sample drill-down (always available)
//   - "froh_q"   — F_ROH quartile view (always available, since F_ROH exists)
//
// Both pages should mount one of these strips and listen for the
// `stratification:change` custom event on the document.
// =============================================================================

const PILL_LABELS = {
  'K=8':    'K=8',
  family:   'per-family',
  sample:   'per-sample',
  froh_q:   'F_ROH quartile',
};

/**
 * Render a stratification pill strip into `host` (an HTMLElement).
 * @param {HTMLElement} host - container; will be replaced with the pill strip.
 * @param {object} opts
 * @param {string} opts.initial - starting mode ("K=8" default).
 * @param {boolean} opts.familyAvailable - if false, the family pill renders
 *   greyed-out with a tooltip "no family metadata in cohort".
 * @param {(mode: string) => void} opts.onChange - called whenever the user
 *   clicks a different pill.
 * @returns {{ setMode: (m: string) => void, getMode: () => string }}
 *   Imperative handle for programmatic mode changes (e.g. external syncing).
 */
export function mountStratificationPills(host, opts) {
  opts = opts || {};
  let current = opts.initial || 'K=8';

  const modes = ['K=8', 'family', 'sample', 'froh_q'];
  host.classList.add('toolbar');
  host.classList.add('stratification-pills');
  host.innerHTML = modes.map(m => {
    const disabled = m === 'family' && opts.familyAvailable === false;
    const on = m === current ? 'on' : '';
    const cls = ['pill', on, disabled ? 'disabled' : ''].filter(Boolean).join(' ');
    const title = disabled
      ? 'No family_id metadata available in cohort'
      : `Stratify by ${PILL_LABELS[m]}`;
    return `<span class="${cls}" data-strat-mode="${m}" title="${title}">${PILL_LABELS[m]}</span>`;
  }).join('');

  function setMode(m) {
    if (!modes.includes(m)) return;
    if (m === 'family' && opts.familyAvailable === false) return;
    if (m === current) return;
    current = m;
    host.querySelectorAll('.pill[data-strat-mode]').forEach(p => {
      p.classList.toggle('on', p.dataset.stratMode === m);
    });
    if (typeof opts.onChange === 'function') opts.onChange(m);
    document.dispatchEvent(new CustomEvent('stratification:change', {
      detail: { mode: m }
    }));
  }

  host.querySelectorAll('.pill[data-strat-mode]').forEach(p => {
    if (p.classList.contains('disabled')) return;
    p.addEventListener('click', () => setMode(p.dataset.stratMode));
  });

  return {
    setMode,
    getMode: () => current,
  };
}

/**
 * Compute F_ROH quartile labels (Q1..Q4) for a list of samples.
 * @param {Array<{f_roh: number}>} samples
 * @returns {Map<number, "Q1"|"Q2"|"Q3"|"Q4">} keyed by index into samples.
 */
export function frohQuartiles(samples) {
  const valid = samples
    .map((s, i) => ({ i, v: s.f_roh }))
    .filter(r => r.v != null && isFinite(r.v))
    .sort((a, b) => a.v - b.v);
  const out = new Map();
  const n = valid.length;
  if (n === 0) return out;
  valid.forEach((r, rank) => {
    const q = rank < n / 4 ? 'Q1'
            : rank < n / 2 ? 'Q2'
            : rank < 3 * n / 4 ? 'Q3'
            : 'Q4';
    out.set(r.i, q);
  });
  return out;
}
