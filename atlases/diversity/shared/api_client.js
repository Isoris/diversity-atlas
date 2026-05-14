// atlases/diversity/shared/api_client.js
// =============================================================================
// Thin wrapper around the atlas-core unified server (atlas_server.py) for the
// action pipeline. Contract: atlas-core/toolkit_registries/PIPELINE_FLOW.md.
//
// Endpoints this wraps:
//
//   POST /api/actions           — submit an action manifest
//   GET  /api/actions/{id}      — read the latest action log entry
//   GET  /api/layers            — list/filter the layer envelope index
//   GET  /api/layers/{layer_id} — fetch one envelope (full JSON)
//
// Static slot reads (GET /api/diversity/{slot}) stay in shared/data_loader.js
// — that's the per-slot loader the legacy renderers use. This module focuses
// on the new action-pipeline endpoints so pages have one import surface for
// envelope-aware work.
//
// Convention: throwing on non-2xx (matches atlas-core/core/layer_api.js + the
// relatedness-atlas api_client). Callers wrap with try/catch where they need
// fail-soft behaviour.
// =============================================================================

const BASE = '';   // same origin as the served workspace

// ---------------------------------------------------------------------------
// Action pipeline
// ---------------------------------------------------------------------------

// GET /api/layers — filter the envelope index.
//   filters: { layer_type, dataset_id, stage, status, limit }
// Returns: { layers: [...index_rows], n, total }.
export async function listLayers(filters = {}) {
  const q = new URLSearchParams();
  for (const k of ['layer_type', 'dataset_id', 'stage', 'status']) {
    const v = filters[k];
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  if (filters.limit !== undefined && filters.limit !== null) {
    q.set('limit', String(Number(filters.limit) | 0));
  }
  const qs = q.toString();
  const url = `${BASE}/api/layers${qs ? '?' + qs : ''}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new ApiError(resp.status, url, await _safeText(resp));
  return resp.json();
}

// GET /api/layers/{layer_id} — fetch one full envelope.
export async function getLayer(layer_id) {
  if (!layer_id) throw new Error('api_client.getLayer: layer_id required');
  const url = `${BASE}/api/layers/${encodeURIComponent(layer_id)}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new ApiError(resp.status, url, await _safeText(resp));
  return resp.json();
}

// Convenience: most-recent envelope of `layer_type` matching the optional
// dataset_id / stage / status filters. Returns null when no match (NOT an
// error — pages should branch on null).
export async function resolveLatestLayer(layer_type, opts = {}) {
  if (!layer_type) throw new Error('api_client.resolveLatestLayer: layer_type required');
  const list = await listLayers({ ...opts, layer_type });
  const rows = (list && list.layers) || [];
  if (rows.length === 0) return null;
  return getLayer(rows[rows.length - 1].layer_id);
}

// POST /api/actions — submit a manifest. Atlas precedence (server-side):
// ?atlas=… > manifest.atlas_id > master_config.atlas.active_atlas.
// Returns: { ok, action_id, atlas_id, produced_layers }.
export async function submitAction(manifest, { atlas } = {}) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('api_client.submitAction: manifest object required');
  }
  const q = atlas ? `?atlas=${encodeURIComponent(atlas)}` : '';
  const url = `${BASE}/api/actions${q}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(manifest),
  });
  if (!resp.ok) throw new ApiError(resp.status, url, await _safeText(resp));
  return resp.json();
}

// GET /api/actions/{action_id} — latest log entry.
export async function getActionLog(action_id) {
  if (!action_id) throw new Error('api_client.getActionLog: action_id required');
  const url = `${BASE}/api/actions/${encodeURIComponent(action_id)}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new ApiError(resp.status, url, await _safeText(resp));
  return resp.json();
}

// Generate an action_id matching ^act_[A-Za-z0-9_]+$.
export function newActionId(tag) {
  const ms = Date.now();
  const tail = tag || Math.random().toString(36).slice(2, 5).padEnd(3, '0');
  return `act_${ms}_${tail}`;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(status, url, body) {
    super(`[atlas-server] ${status} ${url}: ${body}`);
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

async function _safeText(resp) { try { return await resp.text(); } catch (_) { return ''; } }
