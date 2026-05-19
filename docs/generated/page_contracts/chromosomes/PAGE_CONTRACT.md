# chromosomes — per-chromosome diversity — Page Capability Contract

**Atlas**: diversity · **Stage**: per_chromosome · **Status**: active

## Purpose

Per-chromosome view of cohort diversity:
- θπ distribution per chromosome (S2 / ST1)
- F_ROH per chromosome (S4)
- Per-chromosome Kruskal-Wallis tests (S6) of θπ across K=8 ancestry
  groups
- ngsF-HMM convergence (SZ)

## Architecture

Mode A snapshot (`embedded_tables.json` via
[`shared/data_loader.js`](../../../../atlases/diversity/shared/data_loader.js)).
No per-page sub-modules beyond what the legacy renderer ships.

## Capabilities

- Per-chromosome θπ violin / box plot.
- Per-chromosome F_ROH bar chart.
- Per-chromosome KW test table (statistic + p_value + p_value_adj).
- Per-chromosome ngsF-HMM convergence chip.

## Required data

- **Registry says**: `requires_layers: []`, `requires_slots: []`
- **Actually consumed (Mode A)**: `D.ST1`, `D.S4`, `D.S6`, `D.SZ`,
  `D.globals`
- **Future Mode B layers**: `samples_theta_pi_pestpg` (per-sample θπ
  windows aggregated to per-chrom), `cohort_master_per_chrom` (when
  05_aggregated/ ships)

## User interactions

- Chromosome hover → tooltip with median θπ + F_ROH + KW p.
- Click chromosome → set `activeChrom` slot (reserved for cross-page
  highlighting; not yet wired).

## Outputs

Preview only.

## Connected analyses / adapters

- **IN adapter (Mode B, future)**:
  [`harvest_file → pestpg`](../../../../atlases/diversity/registries/extractors/pestpg.py) →
  [`theta_pi_pestpg_v1`](../../../../atlases/diversity/registries/schemas/schema_out/theta_pi_pestpg_v1.schema.json).
- **Upstream pipeline**: ANGSD `-doThetas` + `thetaStat` per sample;
  cohort aggregation handled by the (planned)
  [`aggregate_pi`](../../../../atlases/diversity/registries/runners/aggregate_pi.py) runner
  once 05_aggregated/ outputs land.

## Status and known issues

- **Cohort aggregation is snapshot-only today** — the per-sample
  pestPG → cohort θπ rollup hasn't shipped from the cluster. Page
  currently reads pre-computed D.ST1.
- **05_aggregated/ root is empty on disk** — see [MISSING_DATA.md §3](../../../../_handoff_docs/MISSING_DATA.md).

## Documents

- **Registry doc**: [pages.registry.json](../../../../atlases/diversity/registries/data/pages.registry.json) → `pages.chromosomes`
- **Per-page README**: [pages/per_chromosome/README.md](../../../../atlases/diversity/pages/per_chromosome/README.md)

**Confidence**: high
