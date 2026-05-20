// =============================================================================
// atlases/diversity/shared/interp.js
// =============================================================================
// Tiny "?" icon that shows a biological-interpretation tooltip on hover or
// click. Reuses shared/tooltip.js — no new tooltip element, no new state.
//
// Usage from a renderer:
//   import { interpIcon, wireInterpIcons } from '../../shared/interp.js';
//   const html = `<div class="lbl">F_ROH ${interpIcon('Fraction of callable...')}</div>`;
//   ... after inserting the html into the DOM, call wireInterpIcons() once.
//
// You can call wireInterpIcons() with no argument to scan document, or pass a
// root element to scan a subtree (useful when re-rendering a single card).
// =============================================================================

import { showTip, hideTip } from './tooltip.js';

/**
 * Returns the inline HTML for a "?" icon carrying interpretation text.
 * The text is stored on a data-interp attribute (HTML-attribute-escaped).
 * @param {string} text - Interpretation text. May contain light HTML markup
 *                        (e.g. <b>, <i>, <code>); double quotes are escaped.
 * @returns {string} HTML snippet (a single inline <span>).
 */
export function interpIcon(text) {
  if (text == null) return '';
  const safe = String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
  return `<span class="interp-icon" data-interp="${safe}" tabindex="0" aria-label="What is this?">?</span>`;
}

/**
 * Wire all .interp-icon elements under `root` to show/hide the shared
 * tooltip on hover. Idempotent — a flag prevents double-binding.
 * @param {Element|null} root - root to scan (defaults to document).
 */
export function wireInterpIcons(root) {
  const scope = root || document;
  scope.querySelectorAll('.interp-icon').forEach(icon => {
    if (icon._interpWired) return;
    icon._interpWired = true;
    const text = icon.getAttribute('data-interp');
    icon.addEventListener('mouseenter', e => showTip(text, e));
    icon.addEventListener('mousemove',  e => showTip(text, e));
    icon.addEventListener('mouseleave', hideTip);
    icon.addEventListener('focus',      e => showTip(text, e));
    icon.addEventListener('blur',       hideTip);
    icon.addEventListener('click',      e => {
      showTip(text, e);
      e.stopPropagation();
    });
  });
}

/**
 * Convenience renderer for a stat-strip cell that includes an interp icon.
 * Returns the HTML string for one .stat-cell.
 *
 * @param {object} cell  - { lbl, val, sub, interp }
 * @returns {string} HTML
 */
export function statCellHTML(cell) {
  const q = cell.interp ? ' ' + interpIcon(cell.interp) : '';
  return `<div class="stat-cell">` +
    `<div class="lbl">${cell.lbl}${q}</div>` +
    `<div class="val">${cell.val}</div>` +
    `<div class="sub">${cell.sub || ''}</div>` +
    `</div>`;
}
