# ancestry (was page4)

**Stage:** stratified · **Module:** [ancestry.js](ancestry.js) · **Fragment:** [ancestry.html](ancestry.html)

## Renders

Ancestry × diversity — K=8 clusters as the canonical stratification, plus
K-sweep trajectory K=2..12 to argue for K choice. Per-Q correlations of
diversity vs admixture coordinates; KW omnibus + pairwise post-hoc
tables, with effect-size annotations.

## Reads (slots / aliases)

From [shared/data_loader.js](../../shared/data_loader.js)
(slot `embedded_tables`):

| alias | source table | used for |
|---|---|---|
| `D.S5_kw`   | `dt_S5_kw`       | KW omnibus by stratification |
| `D.S5_pair` | `dt_S5_pairwise` | pairwise post-hoc |
| `D.S9`      | `dt_S9`          | per-sample cluster assignments |
| `D.S7`      | `dt_S7`          | per-Q correlations |
| `D.S10`     | `dt_S10`         | K-sweep trajectory |
| `D.S1`      | `dt_S1`          | per-sample diversity inputs |
| `D.globals` | `dt_globals`     | cohort headline |

## Fallback behavior

Required spine (`embedded_tables`) — no per-page fallback.

---

## Mode-B cross-check

This page renders a small inline `data-source-badge` above its first card.
Probes `ancestry_het_kruskal_all` — the cross-K aggregate file
(`02_heterozygosity/05_ancestry_heterozygosity/tables/kruskal_results_all.tsv`).
Cross-checks the row count against `D.S7`'s K-sweep trajectory and the
distinct-K coverage. Pass when both counts agree within a small tolerance.

See [`atlas-core/docs/SPEC_mode_b_pattern.md`](../../../../../atlas-core/docs/SPEC_mode_b_pattern.md)
for the full pattern (helper API, comparator authoring, workspace tally).

