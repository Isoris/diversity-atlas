# pruning_qc (was page6)

**Stage:** qc · **Module:** [pruning_qc.js](pruning_qc.js) · **Fragment:** [pruning_qc.html](pruning_qc.html)

## Renders

Pruning & QC — relatedness pruning (NAToRA), ROH-caller stability
(ngsF-HMM), inter-metric Spearman correlation matrix, and het in/out of
ROH segments.

## Reads (slots / aliases)

From [shared/data_loader.js](../../shared/data_loader.js)
(slot `embedded_tables`):

| alias | source table | used for |
|---|---|---|
| `D.S11`     | `dt_S11`     | NAToRA pruning report |
| `D.SZ`      | `dt_SZ`      | ngsF-HMM stability per chrom |
| `D.S3`      | `dt_S3`      | Spearman correlation matrix |
| `D.S1`      | `dt_S1`      | per-sample reference |
| `D.S9`      | `dt_S9`      | cluster labels for stratified plots |
| `D.globals` | `dt_globals` | cohort headline |

## Fallback behavior

Required spine (`embedded_tables`) — no per-page fallback.

---

## Mode-B cross-check

This page renders a small inline `data-source-badge` above its first card.
Probes `ancestry_het_pruned81_samples` — the single-column TSV listing
the NAToRA-retained subset. Cross-checks row count against
`D.globals.n_pruned81` (carve says 81) AND that every `D.S11.status==='Retained'`
sample appears in the pipeline file.

See [`atlas-core/docs/SPEC_mode_b_pattern.md`](../../../../../atlas-core/docs/SPEC_mode_b_pattern.md)
for the full pattern (helper API, comparator authoring, workspace tally).

