// =============================================================================
// atlases/diversity/shared/tooltip.js
// =============================================================================
// Shared #plotTip helper. Every page module calls ensureTip() at mount(),
// then uses showTip / moveTip / hideTip / bindTip exactly like the legacy
// inline IIFE did.
// =============================================================================

let _tip = null;

export function ensureTip() {
  if (_tip && document.body.contains(_tip)) return _tip;
  let el = document.getElementById('plotTip');
  if (!el) {
    el = document.createElement('div');
    el.id = 'plotTip';
    el.className = 'plot-tip';
    document.body.appendChild(el);
  }
  _tip = el;
  return _tip;
}

export function showTip(html, evt) {
  const tip = ensureTip();
  tip.innerHTML = html;
  tip.classList.add('on');
  moveTip(evt);
}

export function moveTip(evt) {
  const tip = ensureTip();
  const x = evt.clientX + 14, y = evt.clientY + 14;
  const w = window.innerWidth, h = window.innerHeight;
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  tip.style.left = (x + tw > w - 8 ? x - tw - 28 : x) + 'px';
  tip.style.top  = (y + th > h - 8 ? y - th - 28 : y) + 'px';
}

export function hideTip() {
  if (_tip) _tip.classList.remove('on');
}

export function bindTip(svgRoot, getRow, formatter) {
  svgRoot.addEventListener('mousemove', evt => {
    const t = evt.target;
    const idx = t.getAttribute && t.getAttribute('data-i');
    if (idx == null) { hideTip(); return; }
    const row = getRow(parseInt(idx, 10));
    if (row) showTip(formatter(row), evt);
    else hideTip();
  });
  svgRoot.addEventListener('mouseleave', hideTip);
}
