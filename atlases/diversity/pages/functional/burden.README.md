# burden (was page10)

**Stage:** functional · **Module:** [burden.js](burden.js) · **Fragment:** [burden.html](burden.html)

## Renders

Functional burden / selection efficacy — five co-located layers:
1. **VESM deleterious burden** (per-sample / per-group).
2. **πN/πS** (proxy for purifying selection efficacy).
3. **π0/π4** (4-fold vs 0-fold synonymous baseline).
4. **LOF count** (high-impact / splice / nonsense per snpEff).
5. **ROH-overlap fraction** (variant burden inside ROH segments).

Variant inventory follows the black-grouse Nature 2024 Fig 2c snpEff
impact-class style. Transcript view + MSA panel for drilldown
(MSA SVGs pre-rendered by pyMSAviz upstream, served from `data/msa/`).
GERP panel is off by default (no upstream track yet).

Stratified by K=8 / family / per-sample / F_ROH-quartile via the shared
pill toggle from [shared/stratification.js](../../shared/stratification.js)
(same toggle that drives `roh`).

## Reads (slots / aliases)

From [shared/data_loader.js](../../shared/data_loader.js):

| slot | alias | used for |
|---|---|---|
| `embedded_tables` | `D.S1` | per-sample reference |
| `embedded_tables` | `D.S9` | K=8 cluster labels |
| `functional_burden` (optional) | `ctx.FUNCTIONAL_BURDEN` | all 5 layers + inventories |

Payload schema (per
[files.registry.json](../../registries/data/files.registry.json)
and [SPEC_2026-05-12_functional_burden.md](../../../../_handoff_docs/SPEC_2026-05-12_functional_burden.md) §4):

```
{
  variant_inventory: [...],
  snpeff_totals:     [...],
  gerp_inventory:    [...],        // off by default
  per_sample:        [{piN, piS, piN_piS, pi0_pi4, vesm_burden, lof_count, splice_count, ROH_overlap_fraction}],
  per_group['K=8']:  [...],
  pairwise_ks:       {...},        // K–S P-value matrices per layer
  top_burden_genes_by_group: {...},
  transcripts:       {...},
  splice_events:     [...],
  msa_links:         {variant_id: 'data/msa/<variant_id>.svg'}
}
```

## Fallback behavior

When `functional_burden.json` is absent or empty, renders a "data
pending" card; no partial-data view (the 5 layers are designed to be
read together).

## Upstream pipeline

Adapter **not yet written**. Upstream runs `bcftools csq + snpEff +
VESM + custom splice module`; see
[_handoff_docs/SPEC_2026-05-12_functional_burden.md](../../../../_handoff_docs/SPEC_2026-05-12_functional_burden.md)
for full schema.

---

## Mode-B cross-check

This page renders a small inline `data-source-badge` above its first card.
Probes `functional_burden_payload` (optional `data/functional_burden.json`),
extracting `per_sample[]`. Comparator surfaces sample count plus
`variant_inventory.length` + `per_group['K=8'].length`. Today's badge
reports `○ data pending` until the upstream csq + snpEff + VESM + splice
pipeline (Spec `SPEC_2026-05-12_functional_burden.md`) ships a real payload.

See [`atlas-core/docs/SPEC_mode_b_pattern.md`](../../../../../atlas-core/docs/SPEC_mode_b_pattern.md)
for the full pattern (helper API, comparator authoring, workspace tally).

