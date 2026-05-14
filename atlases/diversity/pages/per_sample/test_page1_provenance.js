// Smoke tests for diversity-atlas per_sample/page1.js's envelope-
// provenance badge.
//
// More interesting than the previous badge tests: the migration calls
// listLayers() then iterates with getLayer() to filter by payload.slot
// (the layer_id doesn't carry slot info, so each envelope must be
// fetched individually). The tests pin that fan-out + most-recent
// selection.
//
// Run from diversity-atlas root:
//   node atlases/diversity/pages/per_sample/test_page1_provenance.js
import { listLayers, getLayer } from '../../shared/api_client.js';

// ----- fake DOM ---------------------------------------------------------
const _domElements = new Map();
function _makeSlot(id) {
  const el = { id, className: '', textContent: '', title: '' };
  _domElements.set(id, el);
  return el;
}
globalThis.document = {
  getElementById(id) { return _domElements.get(id) || null; },
};

// ----- fetch mock -------------------------------------------------------
const _routes = [];
const _calls  = [];
function _route(p, fn) { _routes.push({ p, fn }); }
function _reset()      { _routes.length = 0; _calls.length = 0; _domElements.clear(); }
globalThis.fetch = async (url, init) => {
  _calls.push({ url, init });
  for (const r of _routes) if (r.p(url, init)) return _make(await r.fn(url, init));
  return _make({ status: 404, body: { error: 'no route', url } });
};
function _make({ status = 200, body = null, text = null } = {}) {
  const ok = status >= 200 && status < 300;
  const t = text ?? (body == null ? '' : JSON.stringify(body));
  return { ok, status, async json() { return body != null ? body : JSON.parse(t); }, async text() { return t; } };
}
function eq(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    console.error(`FAIL: ${msg}\n  expected: ${JSON.stringify(b)}\n  got: ${JSON.stringify(a)}`);
    process.exit(1);
  }
  console.log(`  ok: ${msg}`);
}

// ----- mirror page1.js helpers (byte-equivalent) ------------------------

async function _findEmbeddedTablesEnvelope() {
  try {
    const list = await listLayers({
      layer_type: 'diversity_slot', stage: 'staging', limit: 50,
    });
    const rows = (list && list.layers) || [];
    let best = null;
    for (const row of rows) {
      try {
        const env = await getLayer(row.layer_id);
        const slot = env && env.payload && env.payload.slot;
        if (slot === 'embedded_tables') {
          if (best == null || (env.created_at || '') > (best.created_at || '')) {
            best = env;
          }
        }
      } catch (_e) { continue; }
    }
    return best;
  } catch (_e) { return null; }
}

function _renderProvenanceBadge(envelope) {
  const slot = document.getElementById('ssEnvelopeBadge');
  if (!slot) return;
  if (envelope == null) {
    slot.className = 'data-source-badge demo';
    slot.textContent =
      '◌  Live from /api/diversity/embedded_tables ' +
      '(no action-pipeline capture in the layers index).';
    slot.title = 'Run `atlas_action submit` with type=import_slot, ' +
                 'target.slot=embedded_tables to register a capture.';
    return;
  }
  const bytes = envelope.payload && envelope.payload.bytes;
  slot.className = 'data-source-badge live';
  slot.textContent =
    `●  Captured snapshot: ${envelope.layer_id} ` +
    (bytes ? `(${bytes.toLocaleString()} bytes) ` : '') +
    `· created ${envelope.created_at || '?'}`;
  slot.title = `Provenance: action_id=${envelope.provenance?.action_id || '?'}, ` +
               `runner=${envelope.provenance?.runner || '?'}`;
}

// ----- tests ------------------------------------------------------------

console.log('happy path: 3 envelopes, only 1 matches embedded_tables:');
{
  _reset();
  _makeSlot('ssEnvelopeBadge');
  _route(
    (url) => url.startsWith('/api/layers?'),
    () => ({ body: { layers: [
      { layer_id: 'diversity_slot_main_226_hatchery_aaa' },
      { layer_id: 'diversity_slot_main_226_hatchery_bbb' },
      { layer_id: 'diversity_slot_main_226_hatchery_ccc' },
    ], n: 3, total: 3 } }),
  );
  _route(
    (url) => url === '/api/layers/diversity_slot_main_226_hatchery_aaa',
    () => ({ body: {
      layer_id: 'diversity_slot_main_226_hatchery_aaa',
      created_at: '2026-05-13T10:00:00Z',
      provenance: { action_id: 'act_aaa', runner: 'runners.import_slot.import_slot' },
      payload: { slot: 'texture_metrics', bytes: 100 },
    } }),
  );
  _route(
    (url) => url === '/api/layers/diversity_slot_main_226_hatchery_bbb',
    () => ({ body: {
      layer_id: 'diversity_slot_main_226_hatchery_bbb',
      created_at: '2026-05-14T15:00:00Z',
      provenance: { action_id: 'act_bbb', runner: 'runners.import_slot.import_slot' },
      payload: { slot: 'embedded_tables', bytes: 1500000 },
    } }),
  );
  _route(
    (url) => url === '/api/layers/diversity_slot_main_226_hatchery_ccc',
    () => ({ body: {
      layer_id: 'diversity_slot_main_226_hatchery_ccc',
      created_at: '2026-05-12T08:00:00Z',
      provenance: { action_id: 'act_ccc', runner: 'runners.import_slot.import_slot' },
      payload: { slot: 'embedded_tables', bytes: 1200000 },
    } }),
  );
  const env = await _findEmbeddedTablesEnvelope();
  eq(env && env.layer_id, 'diversity_slot_main_226_hatchery_bbb',
     'most-recent embedded_tables wins (bbb beats older ccc)');
  _renderProvenanceBadge(env);
  const slot = document.getElementById('ssEnvelopeBadge');
  eq(slot.className, 'data-source-badge live', 'live class');
  if (!slot.textContent.includes('diversity_slot_main_226_hatchery_bbb')) {
    console.error(`FAIL: badge missing layer_id: ${slot.textContent}`);
    process.exit(1);
  }
  console.log('  ok: badge advertises winning layer_id');
  if (!slot.textContent.includes('1,500,000 bytes')) {
    console.error(`FAIL: badge missing humanised bytes: ${slot.textContent}`);
    process.exit(1);
  }
  console.log('  ok: byte count humanised with thousands separators');
  if (!slot.title.includes('act_bbb')) {
    console.error(`FAIL: title missing action_id: ${slot.title}`);
    process.exit(1);
  }
  console.log('  ok: title carries action_id');
}

console.log('no embedded_tables match → demo badge:');
{
  _reset();
  _makeSlot('ssEnvelopeBadge');
  _route(
    (url) => url.startsWith('/api/layers?'),
    () => ({ body: { layers: [
      { layer_id: 'diversity_slot_main_226_hatchery_xyz' },
    ], n: 1, total: 1 } }),
  );
  _route(
    (url) => url === '/api/layers/diversity_slot_main_226_hatchery_xyz',
    () => ({ body: {
      layer_id: 'diversity_slot_main_226_hatchery_xyz',
      payload: { slot: 'functional_burden' },   // wrong slot
    } }),
  );
  const env = await _findEmbeddedTablesEnvelope();
  eq(env, null, 'no embedded_tables envelope → null');
  _renderProvenanceBadge(env);
  const slot = document.getElementById('ssEnvelopeBadge');
  eq(slot.className, 'data-source-badge demo', 'demo class');
  if (!slot.textContent.includes('Live from /api/diversity/embedded_tables')) {
    console.error(`FAIL: should explain DEMO source: ${slot.textContent}`);
    process.exit(1);
  }
  console.log('  ok: demo message mentions live endpoint fallback');
}

console.log('list fetch error → fail-soft to null:');
{
  _reset();
  _makeSlot('ssEnvelopeBadge');
  _route(() => true, () => ({ status: 503, text: 'unavailable' }));
  const env = await _findEmbeddedTablesEnvelope();
  eq(env, null, 'returns null on list 5xx');
  _renderProvenanceBadge(env);
  eq(document.getElementById('ssEnvelopeBadge').className,
     'data-source-badge demo', 'falls back to demo');
}

console.log('partial fetch failure: get fails for one envelope → others still considered:');
{
  _reset();
  _makeSlot('ssEnvelopeBadge');
  _route(
    (url) => url.startsWith('/api/layers?'),
    () => ({ body: { layers: [
      { layer_id: 'L_broken' },
      { layer_id: 'L_good' },
    ], n: 2, total: 2 } }),
  );
  _route((url) => url === '/api/layers/L_broken', () => ({ status: 500 }));
  _route(
    (url) => url === '/api/layers/L_good',
    () => ({ body: {
      layer_id: 'L_good',
      created_at: '2026-05-14T00:00:00Z',
      provenance: { action_id: 'act_g', runner: 'r' },
      payload: { slot: 'embedded_tables', bytes: 100 },
    } }),
  );
  const env = await _findEmbeddedTablesEnvelope();
  eq(env && env.layer_id, 'L_good', 'broken envelope skipped, good one returned');
}

console.log('empty index → null → demo badge:');
{
  _reset();
  _makeSlot('ssEnvelopeBadge');
  _route(() => true, () => ({ body: { layers: [], n: 0, total: 0 } }));
  const env = await _findEmbeddedTablesEnvelope();
  eq(env, null, 'empty index → null');
  _renderProvenanceBadge(env);
  eq(document.getElementById('ssEnvelopeBadge').className,
     'data-source-badge demo', 'demo class on empty');
}

console.log('missing slot in DOM → no throw:');
{
  _reset();
  // Don't create the slot element this time.
  _renderProvenanceBadge({
    layer_id: 'X',
    payload: { slot: 'embedded_tables', bytes: 100 },
    provenance: { action_id: 'act_x', runner: 'r' },
    created_at: '2026-05-14T00:00:00Z',
  });
  _renderProvenanceBadge(null);
  console.log('  ok: missing #ssEnvelopeBadge is a no-op');
}

console.log('\nALL OK');
