# `pages/qc/` — Diversity Atlas QC stage

Quality-control diagnostics: NAToRA pruning, ngsF-HMM stability,
between-metric correlations.

## What each page does

| page | manifest stage | label | summary |
|------|----------------|-------|---------|
| `pruning_qc` | qc | pruning & QC | NAToRA (S11) + ngsF-HMM (SZ) + Spearman matrix (S3) + het in/out ROH (S1) |

## Vocabulary contracts

### NAToRA pruning verdict

| value | meaning |
|-------|---------|
| `retained` | sample survives relatedness pruning (n=81) |
| `pruned`   | sample dropped (n=145) |

### ngsF-HMM convergence flag

| value | meaning |
|-------|---------|
| `converged`     | run reached convergence within iteration budget |
| `non_converged` | run did not converge — interpret F_ROH with caution |
| `failed`        | run errored out (rare) |

### Spearman matrix metrics

Default columns:

| metric | meaning |
|--------|---------|
| `H`       | genome-wide heterozygosity |
| `F_ROH`   | runs-of-homozygosity fraction |
| `theta_pi`| cohort-mean per-window θπ |
| `BUSCO`   | per-sample assembly completeness (when available) |
| `cov`     | mean coverage |

Add/remove metrics via column config (persisted to localStorage).

## Cross-page dependencies

- **pruning_qc** is **the** source of truth for the `pruned81` sample
  list — every per-K ancestry layer in `pages/stratified/` references
  it.

## Round status

`pruning_qc` — round 1, active.

## IN / OUT adapters

| layer | runner | extractor | schema_out |
|-------|--------|-----------|-----------|
| `ancestry_het_pruned81_samples` | [`harvest_file`](../../registries/runners/harvest_file.py) | [`extractors/tsv_table.py`](../../registries/extractors/tsv_table.py) | [`tsv_table_v1`](../../registries/schemas/schema_out/tsv_table_v1.schema.json) |
| `ancestry_het_cluster_summary` (per-K convergence) | `harvest_file` | `tsv_table` | `tsv_table_v1` |

## SPECs relevant to QC

- NAToRA upstream documentation (Module 02_heterozygosity)
- ngsF-HMM stability protocol (Module 02_heterozygosity)

## Per-page contracts

[`docs/generated/page_contracts/pruning_qc/PAGE_CONTRACT.md`](../../../../docs/generated/page_contracts/pruning_qc/PAGE_CONTRACT.md)

## Notes for new contributors

- **`pruned81` is locked** — do not re-prune without regenerating
  every per-K ancestry layer that names `pruned81` in its file path.
- **NAToRA result is a snapshot** — re-running with new data would
  invalidate the pruned cohort id and break every downstream layer.
