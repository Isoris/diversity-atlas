# pruning_qc — NAToRA pruning + QC diagnostics — Page Capability Contract

**Atlas**: diversity · **Stage**: qc · **Status**: active

## Purpose

Cohort QC pages: NAToRA relatedness-pruning result, ngsF-HMM stability
matrix, Spearman correlation matrix between diversity metrics, het
in/out of ROH per sample.

## Architecture

Mode A snapshot.

Views:
- NAToRA pruning summary (S11) — 226 → 81 reduction
- ngsF-HMM stability heatmap (SZ)
- Spearman correlation matrix between H · F_ROH · θπ · BUSCO · cov (S3)
- Het in/out of ROH per sample (S1 + S9)

## Capabilities

- All four views above.
- Hover → metric pair tooltip with rho + p.

## Required data

- **Registry says**: `requires_layers: []`, `requires_slots: []`
- **Actually consumed (Mode A)**: `D.S11`, `D.SZ`, `D.S3`, `D.S1`,
  `D.S9`, `D.globals`
- **Future Mode B layers**: `ancestry_het_pruned81_samples` (NAToRA
  output), `ancestry_het_cluster_summary` (ngsF-HMM)

## User interactions

- Hover.
- Spearman cell click → scatter overlay (drawer).

## Outputs

Preview only.

## Connected analyses / adapters

- **IN adapter (Mode B)**: `harvest_file → tsv_table` for the per-K
  ancestry tables (pruned81 cohort). The pruning summary itself is
  embedded today.
- **Upstream pipeline**: NAToRA (relatedness pruning) + ngsF-HMM (run
  stability) — Module 02_heterozygosity post-processing.

## Status and known issues

- **NAToRA result is locked at 81 pruned samples** — re-pruning would
  invalidate the `pruned81` cohort label that propagates through every
  per-K ancestry layer.

## Documents

- **Registry doc**: [pages.registry.json](../../../../atlases/diversity/registries/data/pages.registry.json) → `pages.pruning_qc`
- **Per-page README**: [pages/qc/README.md](../../../../atlases/diversity/pages/qc/README.md)

**Confidence**: high
