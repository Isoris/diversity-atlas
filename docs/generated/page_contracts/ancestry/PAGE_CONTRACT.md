# ancestry — K=8 stratified tests + K-sweep — Page Capability Contract

**Atlas**: diversity · **Stage**: stratified · **Status**: active

## Purpose

Ancestry × diversity at K=8 (the locked cohort granularity), plus a
K-sweep trajectory from K=2 to K=12 showing how the test statistic
moves with K.

Views:
- Per-K=8 group boxplots of H (S5)
- Pairwise Wilcoxon (S5_pair)
- Per-cluster centroids (S9)
- K-sweep KW trajectory (S7)
- Per-Q-component × H correlations (S10)

## Architecture

Mode A snapshot. The K-sweep layer surfaces 22 underlying files (K=2..12
× cohort ∈ {all226, pruned81}) that are also wired via Mode B:

| layer | file path |
|-------|-----------|
| `ancestry_het_kruskal` | `tables/kruskal_K{K}_{cohort}.tsv` |
| `ancestry_het_anova`   | `tables/anova_K{K}_{cohort}.tsv` |
| `ancestry_het_pairwise_wilcox` | `tables/pairwise_wilcox_K{K}_{cohort}.tsv` |
| `ancestry_het_cluster_summary` | `tables/cluster_summary_K{K}_{cohort}.tsv` |
| `ancestry_het_merged`          | `tables/merged_K{K}_{cohort}.tsv` |
| ... (cross-K aggregates also present)

Page reads whichever K is active.

## Capabilities

- K toggle (2..12).
- Cohort toggle (all226 / pruned81).
- View toggle (boxplot / pairwise / centroids / K-sweep / Q-correl).
- Pairwise matrix hover → p-value tooltip.

## Required data

- **Registry says**: `requires_layers: []`, `requires_slots: []`
- **Actually consumed (Mode A)**: `D.S5_kw`, `D.S5_pair`, `D.S9`,
  `D.S7`, `D.S10`, `D.S1`, `D.globals`
- **Future Mode B layers**: all `ancestry_het_*` layers above

## User interactions

- K + cohort toggles.
- View toggle.
- Hover → statistic tooltip.

## Outputs

Preview only.

## Connected analyses / adapters

- **IN adapter (Mode B)**:
  [`harvest_file → tsv_table`](../../../../atlases/diversity/registries/extractors/tsv_table.py)
  parameterised by `(K, cohort)`. The
  [`ancestry_het_kruskal_v1`](../../../../atlases/diversity/registries/schemas/schema_out/ancestry_het_kruskal_v1.schema.json)
  schema normalises R-style dot-suffixed column names
  (`p.value → p_value`).
- **Upstream pipeline**: NGSadmix + R post-processing
  (`05_ancestry_heterozygosity/tables/`).

## Status and known issues

- **22 per-K files exist on disk** — page selectively reads the active
  K only. Pre-fetching all 22 wastes bandwidth.
- **Pruning-set definition** lives in `pruned81_samples.tsv` and is the
  source-of-truth for the `pruned81` cohort.

## Documents

- **Registry doc**: [pages.registry.json](../../../../atlases/diversity/registries/data/pages.registry.json) → `pages.ancestry`
- **Per-page README**: [pages/stratified/README.md](../../../../atlases/diversity/pages/stratified/README.md)

**Confidence**: high
