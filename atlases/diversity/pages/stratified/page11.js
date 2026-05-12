// =============================================================================
// atlases/diversity/pages/stratified/page11.js — Group divergence network
// =============================================================================
// Stage:        stratified (new page, round 3)
// Spec:         _handoff_docs/SPEC_2026-05-12_divergence_network.md
//
// Reads:
//   D.S1                  — to populate the grouping pills (K=8 keys).
//   D.S9                  — for K=8 cluster palette.
//   ctx.DIVERGENCE_NETWORK — optional payload from divergence_network.json.
//                            Absent / empty → "data pending" path.
//
// Renderer is self-contained — uses native SVG (no D3), seeded RNG for the
// force-directed layout, and shared/tooltip.js for hover CIs. Edge filter
// (Show all / Top-N / Significant only) lives in the panel header as a
// <details> caret menu so click-toggle is native.
// =============================================================================

import { ensureData } from '../../shared/data_loader.js';
import { ensureTip, showTip, hideTip } from '../../shared/tooltip.js';
import { fmt2, fmt3, fmtSci, clusterSwatch } from '../../shared/formatters.js';
import { buildSVG, svgClose, linScale } from '../../shared/svg.js';
import { kColor } from '../../shared/palette.js';

const dnState = {
  grouping:   'K=8',          // K=8 | farm | sex | karyotype
  edgeStat:   'fst',          // fst | dxy | dA
  layout:     'circular',     // circular | force
  edgeFilter: 'topN',         // all | topN | sig
  edgeN:      8,
  selectedKaryotype: null,
};

let D = null;
let DN = null;
let CLUSTER_COLORS = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function hasNetwork() {
  return DN && Array.isArray(DN.nodes) && DN.nodes.length > 0
      && Array.isArray(DN.edges) && DN.edges.length > 0;
}

function currentGrouping() {
  // For "K=8" use DN.nodes/edges directly; for others look up
  // DN.alternative_groupings.<grouping>.{nodes, edges}.
  if (dnState.grouping === 'K=8') {
    return { nodes: DN.nodes || [], edges: DN.edges || [] };
  }
  const alt = (DN.alternative_groupings || {})[dnState.grouping];
  if (alt && Array.isArray(alt.nodes) && Array.isArray(alt.edges)) {
    return { nodes: alt.nodes, edges: alt.edges };
  }
  return { nodes: [], edges: [] };
}

function filteredEdges(edges) {
  const stat = dnState.edgeStat;   // fst | dxy | dA
  let pool = edges.slice().filter(e => e[stat] != null);
  if (dnState.edgeFilter === 'all') return pool;
  if (dnState.edgeFilter === 'sig') {
    return pool.filter(e => {
      const ci = e[stat + '_ci'];
      return Array.isArray(ci) && ((ci[0] > 0 && ci[1] > 0) || (ci[0] < 0 && ci[1] < 0));
    });
  }
  // topN
  pool.sort((a, b) => Math.abs(b[stat]) - Math.abs(a[stat]));
  return pool.slice(0, Math.max(1, dnState.edgeN));
}

// Mulberry32 — deterministic seedable RNG for the force layout
function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function layoutCircular(nodes, W, H) {
  const cx = W / 2, cy = H / 2;
  const r = Math.min(W, H) / 2 - 80;
  const sorted = nodes.slice().sort((a, b) => (a.group || '').localeCompare(b.group || ''));
  const n = sorted.length;
  const out = new Map();
  sorted.forEach((node, i) => {
    const theta = -Math.PI / 2 + (2 * Math.PI * i) / n;
    out.set(node.group, { x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta), node });
  });
  return out;
}

function layoutForce(nodes, edges, W, H) {
  const cx = W / 2, cy = H / 2;
  const r0 = Math.min(W, H) / 4;
  const rng = mulberry32(42);
  const out = new Map();
  // Start positions on a perturbed circle for determinism
  nodes.forEach((node, i) => {
    const theta = (2 * Math.PI * i) / nodes.length + (rng() - 0.5) * 0.4;
    out.set(node.group, {
      x: cx + r0 * Math.cos(theta), y: cy + r0 * Math.sin(theta),
      vx: 0, vy: 0, node,
    });
  });
  const stat = dnState.edgeStat;
  for (let iter = 0; iter < 200; iter++) {
    // Repulsion (Coulomb)
    const arr = Array.from(out.values());
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const dx = arr[i].x - arr[j].x;
        const dy = arr[i].y - arr[j].y;
        const d2 = Math.max(20, dx * dx + dy * dy);
        const f = 2400 / d2;
        arr[i].vx += dx * f; arr[i].vy += dy * f;
        arr[j].vx -= dx * f; arr[j].vy -= dy * f;
      }
    }
    // Attraction along edges; weighted by 1 - F_ST so high-divergence pairs sit further
    edges.forEach(e => {
      const ni = out.get(e.group_i), nj = out.get(e.group_j);
      if (!ni || !nj) return;
      const w = 1 - Math.min(0.9, Math.max(0.05, e[stat] || 0.1));
      const dx = nj.x - ni.x, dy = nj.y - ni.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - 160) * 0.04 * w;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      ni.vx += fx; ni.vy += fy;
      nj.vx -= fx; nj.vy -= fy;
    });
    // Update
    arr.forEach(n => {
      n.x += n.vx * 0.1; n.y += n.vy * 0.1;
      n.vx *= 0.85; n.vy *= 0.85;
      n.x = Math.max(60, Math.min(W - 60, n.x));
      n.y = Math.max(60, Math.min(H - 60, n.y));
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------
function renderTopStrip() {
  const host = document.getElementById('dnTopStrip');
  if (!host) return;
  const { nodes, edges } = currentGrouping();
  const cells = [
    { lbl: 'grouping',  val: dnState.grouping, sub: `${nodes.length} nodes` },
    { lbl: 'edge stat', val: dnState.edgeStat.toUpperCase(), sub: `${edges.length} edges` },
    { lbl: 'F_ST estimator', val: (DN && DN.fst_estimator) || '—', sub: 'pipeline-side' },
    { lbl: 'n_bootstrap',    val: (DN && DN.n_bootstrap)   || '—', sub: 'bootstrap reps' },
  ];
  host.innerHTML = cells.map(c =>
    `<div><div class="lbl">${c.lbl}</div><div class="val">${c.val}</div>` +
    `<div style="font-size:9.5px;color:var(--ink-dim);margin-top:2px;">${c.sub}</div></div>`
  ).join('');
}

function renderNetwork() {
  const host = document.getElementById('plotDnNetwork');
  const tag = document.getElementById('dnNetworkTag');
  if (!host) return;
  if (!hasNetwork()) {
    host.innerHTML = '<div style="color:var(--ink-dim); padding:48px; text-align:center; font-style:italic;">' +
      'Network data not yet available.</div>';
    if (tag) tag.textContent = '0 groups';
    return;
  }
  const { nodes, edges } = currentGrouping();
  if (nodes.length === 0) {
    host.innerHTML = '<div style="color:var(--ink-dim); padding:48px; text-align:center; font-style:italic;">' +
      `No payload for grouping "${dnState.grouping}". Atlas reads from alternative_groupings.</div>`;
    if (tag) tag.textContent = `${dnState.grouping}: 0 groups`;
    return;
  }
  const visibleEdges = filteredEdges(edges);
  if (tag) tag.textContent = `${nodes.length} groups · ${visibleEdges.length} / ${edges.length} edges`;

  const W = 880, H = 480;
  const pos = dnState.layout === 'force'
    ? layoutForce(nodes, edges, W, H)
    : layoutCircular(nodes, W, H);

  const piVals = nodes.map(n => n.pi).filter(v => v != null && isFinite(v));
  const piMin = piVals.length ? Math.min(...piVals) : 0;
  const piMax = piVals.length ? Math.max(...piVals) : 1;
  const rOf = v => v == null ? 22 : 16 + ((v - piMin) / (piMax - piMin || 1)) * 28;

  const stat = dnState.edgeStat;
  const eVals = visibleEdges.map(e => Math.abs(e[stat])).filter(v => v != null && isFinite(v));
  const eMax = eVals.length ? Math.max(...eVals) : 1;

  const arr = buildSVG(W, H);

  // Edges first (so nodes sit on top)
  visibleEdges.forEach((e, i) => {
    const ni = pos.get(e.group_i), nj = pos.get(e.group_j);
    if (!ni || !nj) return;
    const w = 1 + (Math.abs(e[stat]) / (eMax || 1)) * 6;
    arr.push(`<line data-edge="${i}" x1="${ni.x}" y1="${ni.y}" x2="${nj.x}" y2="${nj.y}" stroke="#5a6b8a" stroke-width="${w}" stroke-opacity="0.6" style="cursor:pointer;"/>`);
    const mx = (ni.x + nj.x) / 2, my = (ni.y + nj.y) / 2;
    arr.push(`<rect x="${mx-22}" y="${my-9}" width="44" height="14" fill="#fff" stroke="#5a6b8a" stroke-width="0.4" opacity="0.85" pointer-events="none"/>`);
    arr.push(`<text x="${mx}" y="${my+2}" text-anchor="middle" style="font-size:9.5px; fill:#222; pointer-events:none;">${fmt3(e[stat])}</text>`);
  });

  // Nodes
  Array.from(pos.entries()).forEach(([k, p]) => {
    const fill = (dnState.grouping === 'K=8') ? kColor(k, CLUSTER_COLORS) : '#8aa6c7';
    const r = rOf(p.node.pi);
    arr.push(`<circle data-node="${k}" cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="#222" stroke-width="1.2" style="cursor:pointer;"/>`);
    const piText = p.node.pi != null ? fmtSci(p.node.pi, 1) : '—';
    // Adaptive: inside if r*2 ≥ approx text width; else outside
    const approxW = 6.5 * piText.length;
    if (r * 2 >= approxW + 6) {
      arr.push(`<text x="${p.x}" y="${p.y - 2}" text-anchor="middle" style="font-size:10px; font-weight:600; fill:#fff; pointer-events:none;">${k}</text>`);
      arr.push(`<text x="${p.x}" y="${p.y + 10}" text-anchor="middle" style="font-size:9px; fill:#fff; pointer-events:none;">${piText}</text>`);
    } else {
      // Outside, with a tiny leader
      const dx = p.x - W / 2, dy = p.y - H / 2;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const lx = p.x + (dx / len) * (r + 14), ly = p.y + (dy / len) * (r + 14);
      arr.push(`<line x1="${p.x + (dx/len)*r}" y1="${p.y + (dy/len)*r}" x2="${lx}" y2="${ly}" stroke="#666" stroke-width="0.6"/>`);
      arr.push(`<text x="${lx}" y="${ly + 4}" text-anchor="${dx >= 0 ? 'start' : 'end'}" style="font-size:10px; fill:#222; pointer-events:none;">${k} π=${piText}</text>`);
    }
  });

  host.innerHTML = svgClose(arr);
  const svgEl = host.querySelector('svg');

  // Edge hover
  svgEl.querySelectorAll('line[data-edge]').forEach(l => {
    const i = +l.getAttribute('data-edge');
    const e = visibleEdges[i];
    const ci = (sk) => Array.isArray(e[sk + '_ci']) && e[sk + '_ci'][0] != null
      ? `(95 % CI: ${fmt3(e[sk + '_ci'][0])} – ${fmt3(e[sk + '_ci'][1])})` : '';
    l.addEventListener('mouseenter', ev => showTip(ev,
      `<b>${e.group_i} ↔ ${e.group_j}</b>` +
      `<div class="row">F_ST = ${fmt3(e.fst)} ${ci('fst')}</div>` +
      `<div class="row">D_XY = ${fmtSci(e.dxy, 2)} ${ci('dxy')}</div>` +
      `<div class="row">d_A   = ${fmtSci(e.dA, 2)}</div>` +
      `<div class="row">n samples: ${e.n_i || '?'} / ${e.n_j || '?'}</div>` +
      `<div class="row">bootstrap reps: ${(DN && DN.n_bootstrap) || '—'}</div>`));
    l.addEventListener('mousemove', ev => showTip(ev));
    l.addEventListener('mouseleave', hideTip);
  });

  // Node hover
  svgEl.querySelectorAll('circle[data-node]').forEach(c => {
    const k = c.getAttribute('data-node');
    const node = nodes.find(n => n.group === k);
    if (!node) return;
    c.addEventListener('mouseenter', ev => showTip(ev,
      `<b>${k}</b><div class="row">n = ${node.n_samples || '—'}</div>` +
      `<div class="row">π = ${fmtSci(node.pi, 2)}</div>`));
    c.addEventListener('mousemove', ev => showTip(ev));
    c.addEventListener('mouseleave', hideTip);
  });
}

function renderEdgeTable() {
  const tbody = document.querySelector('#dnEdgeTable tbody');
  const tag = document.getElementById('dnEdgeTableTag');
  if (!tbody) return;
  if (!hasNetwork()) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink-dim); font-style:italic;">data pending</td></tr>';
    if (tag) tag.textContent = '0 edges';
    return;
  }
  const { edges } = currentGrouping();
  const visible = filteredEdges(edges).slice().sort((a, b) => (b.fst || 0) - (a.fst || 0));
  tbody.innerHTML = visible.map(e =>
    `<tr><td>${e.group_i} ↔ ${e.group_j}</td>` +
    `<td>${fmt3(e.fst)}</td>` +
    `<td>${fmtSci(e.dxy, 2)}</td>` +
    `<td>${fmtSci(e.dA, 2)}</td>` +
    `<td>${e.n_i || '—'}</td>` +
    `<td>${e.n_j || '—'}</td></tr>`).join('');
  if (tag) tag.textContent = `${visible.length} edges`;
}

function dnRenderAll() {
  renderTopStrip();
  renderNetwork();
  renderEdgeTable();
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
function dnWire() {
  document.querySelectorAll('.pill[data-dn-grouping]').forEach(p => {
    p.addEventListener('click', () => {
      document.querySelectorAll('.pill[data-dn-grouping]').forEach(x => x.classList.remove('on'));
      p.classList.add('on');
      dnState.grouping = p.dataset.dnGrouping;
      // Apply mode-aware default edge filter
      if (dnState.grouping === 'farm') dnState.edgeFilter = 'topN';
      else if (['K=8', 'sex', 'karyotype'].includes(dnState.grouping)) dnState.edgeFilter = 'all';
      syncEdgeFilterRadios();
      dnRenderAll();
    });
  });

  document.querySelectorAll('.pill[data-dn-stat]').forEach(p => {
    p.addEventListener('click', () => {
      document.querySelectorAll('.pill[data-dn-stat]').forEach(x => x.classList.remove('on'));
      p.classList.add('on');
      dnState.edgeStat = p.dataset.dnStat;
      dnRenderAll();
    });
  });

  document.querySelectorAll('.pill[data-dn-layout]').forEach(p => {
    p.addEventListener('click', () => {
      document.querySelectorAll('.pill[data-dn-layout]').forEach(x => x.classList.remove('on'));
      p.classList.add('on');
      dnState.layout = p.dataset.dnLayout;
      renderNetwork();
    });
  });

  document.querySelectorAll('input[name="dn-edge"]').forEach(r => {
    r.addEventListener('change', () => {
      dnState.edgeFilter = r.value;
      dnRenderAll();
    });
  });
  const nInput = document.getElementById('dnEdgeN');
  if (nInput) nInput.addEventListener('change', e => {
    dnState.edgeN = Math.max(1, parseInt(e.target.value, 10) || 1);
    if (dnState.edgeFilter === 'topN') dnRenderAll();
  });
}

function syncEdgeFilterRadios() {
  const map = { all: 'dnEdgeAll', topN: 'dnEdgeTopN', sig: 'dnEdgeSig' };
  Object.entries(map).forEach(([v, id]) => {
    const el = document.getElementById(id);
    if (el) el.checked = (v === dnState.edgeFilter);
  });
}

// ---------------------------------------------------------------------------
// mount / unmount
// ---------------------------------------------------------------------------
export async function mount(root, atlasState, registry) {
  ensureTip();
  const ctx = await ensureData();
  D = ctx.D;
  CLUSTER_COLORS = ctx.CLUSTER_COLORS;
  DN = ctx.DIVERGENCE_NETWORK;

  const missing = document.getElementById('dnMissingCard');
  if (missing) missing.style.display = hasNetwork() ? 'none' : 'block';

  syncEdgeFilterRadios();
  dnWire();
  dnRenderAll();
}

export async function unmount(root) {
  // Router replaces the page wholesale; nothing to tear down.
}
