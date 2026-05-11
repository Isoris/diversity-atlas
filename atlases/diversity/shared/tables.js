// =============================================================================
// atlases/diversity/shared/tables.js
// =============================================================================
// Generic sortable-table helpers shared by every diversity page.
// Extracted verbatim from Diversity_atlas.html v2.4 (legacy lines 1998-2042).
// =============================================================================

export function fillSimpleTable(tableId, headerArr, rows) {
  const t = document.getElementById(tableId);
  if (!t) return;
  const thead = t.querySelector('thead'), tbody = t.querySelector('tbody');
  thead.innerHTML = '<tr>' + headerArr.map(h => '<th>' + (h == null ? '—' : h) + '</th>').join('') + '</tr>';
  tbody.innerHTML = rows.map(r =>
    '<tr>' + r.map((c, i) => {
      const cls = (i === 0 ? '' : 'num');
      const txt = c == null ? '—' : (typeof c === 'string' ? c : String(c));
      return '<td class="' + cls + '">' + txt + '</td>';
    }).join('') + '</tr>'
  ).join('');
}

export function applySortIndicators(tableId) {
  const t = document.getElementById(tableId);
  if (!t) return;
  const state = t.__sort;
  t.querySelectorAll('th').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (state && th.dataset.sort === state.key) {
      th.classList.add(state.dir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
}

export function sortRows(rows, state) {
  if (!state || !state.key) return rows;
  const k = state.key;
  return rows.slice().sort((a, b) => {
    let av = a[k], bv = b[k];
    if (typeof av === 'string' && typeof bv === 'string') {
      const am = av.match(/LG(\d+)/), bm = bv.match(/LG(\d+)/);
      if (am && bm) {
        const ai = parseInt(am[1], 10), bi = parseInt(bm[1], 10);
        return state.dir === 'asc' ? ai - bi : bi - ai;
      }
      const c = av.localeCompare(bv);
      return state.dir === 'asc' ? c : -c;
    }
    if (typeof av === 'boolean') { av = av ? 1 : 0; bv = bv ? 1 : 0; }
    if (av == null) av = -Infinity;
    if (bv == null) bv = -Infinity;
    return state.dir === 'asc' ? av - bv : bv - av;
  });
}
