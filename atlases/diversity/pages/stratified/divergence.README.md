# divergence (was page11)

**Stage:** stratified · **Module:** [divergence.js](divergence.js) · **Fragment:** [divergence.html](divergence.html)

## Renders

Group-divergence network — node-link plot. Nodes = K=8 ancestry groups
(toggleable to per-farm / sex / karyotype:<inv_id>); edges = pairwise
FST (default) / DXY / dA, edge thickness ∝ divergence. Circular layout
default with a force-directed toggle. Customisable edge filter
(Show all / Top-N / Significant only) via a caret menu in the panel
header.

## Reads (slots / aliases)

From [shared/data_loader.js](../../shared/data_loader.js):

| slot | alias | used for |
|---|---|---|
| `embedded_tables` | `D.S1` | sample → group lookup |
| `embedded_tables` | `D.S9` | K=8 cluster labels |
| `divergence_network` (optional) | `ctx.DIVERGENCE_NETWORK` | nodes + edges payload |

Payload schema (per
[files.registry.json](../../registries/data/files.registry.json)):

```
{
  nodes: [{group_label, n_samples, pi, pi_ci}],
  edges: [{group_i, group_j, fst, fst_ci, dxy, dxy_ci, dA, n_bootstrap}],
  alternative_groupings: { farm: {...}, sex: {...}, karyotype:<inv_id>: {...} }
}
```

## Fallback behavior

When `divergence_network.json` is absent or empty, renders a "data
pending" card. Estimator (Weir & Cockerham vs Hudson vs Reynolds) is
chosen pipeline-side; the atlas displays whatever value ships.

## Upstream pipeline

Adapter **not yet written** — see
[_handoff_docs/SPEC_2026-05-12_divergence_network.md](../../../../_handoff_docs/SPEC_2026-05-12_divergence_network.md) §4
for the target schema.

---

## Mode-B cross-check

This page renders a small inline `data-source-badge` above its first card.
Probes `divergence_network_payload` (optional `data/divergence_network.json`),
extracting `edges[]`. Comparator cross-checks `n_edges === C(n_nodes, 2)` —
which holds for any grouping mode (K=8 → 28 edges, K-farm/sex → different
counts, all consistent with the n(n-1)/2 relation). Today: `○ data pending`
until the realSFS + bootstrap pipeline ships (Spec
`SPEC_2026-05-12_divergence_network.md`).

See [`atlas-core/docs/SPEC_mode_b_pattern.md`](../../../../../atlas-core/docs/SPEC_mode_b_pattern.md)
for the full pattern (helper API, comparator authoring, workspace tally).

