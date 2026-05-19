# samples — per-sample master table + 5 distribution plots — Page Capability Contract

**Atlas**: diversity · **Stage**: per_sample · **Status**: active (round 1)

## Purpose

Per-sample master table for the 226-sample pure *C. gariepinus* hatchery
cohort. Headline columns: sample id, genome-wide H, F_ROH, ROH length
bins, θπ summaries, K=8 cluster label. Click-row drill-down opens a
sample detail panel.

## Architecture

Reads exclusively from the `embedded_tables.json` snapshot (Mode A —
the legacy bulk-snapshot path loaded by
[`shared/data_loader.js`](../../../../atlases/diversity/shared/data_loader.js))
in round 1. Mode B (extractor-pattern, per-layer fetches via
[`harvest_file`](../../../../atlases/diversity/registries/runners/harvest_file.py))
is wired but not yet consumed — pages can swap reads layer-by-layer
without touching the page module.

Five companion plots:
- distribution of H
- distribution of F_ROH
- H vs F_ROH scatter
- per-K=8 group boxplot of H
- per-K=8 group boxplot of F_ROH

## Capabilities

- Render master table (sortable, column-config persisted to
  localStorage).
- Render the five distribution / relationship plots.
- Click row → sample detail panel (opens drawer).

## Required data

- **Registry says**: `requires_layers: []`, `requires_slots: []`
- **Actually consumed (Mode A snapshot)**: `D.globals`, `D.S1`,
  `D.S9`, `D.ST2`
- **Future Mode B layers**: `samples_genomewide_het`,
  `cohort_master_samples` (when 05_aggregated/ ships)

## User interactions

- Column sort (header click).
- Row click → drill-down.
- Plot hover → tooltip.

## Outputs

Preview only — no writes back to state.

## Connected analyses / adapters

- **IN adapter (Mode B)**:
  [`harvest_file → genomewide_het`](../../../../atlases/diversity/registries/extractors/genomewide_het.py) →
  [`samples_genomewide_het_v1`](../../../../atlases/diversity/registries/schemas/schema_out/samples_genomewide_het_v1.schema.json).
- **Upstream pipeline**: `catfish-diversity-analysis` Module
  02_heterozygosity (per-sample SFS → genomewide_heterozygosity.tsv).
- **Mode A loader**:
  [`shared/data_loader.js`](../../../../atlases/diversity/shared/data_loader.js).

## Status and known issues

- **D.S1 still loaded from snapshot**, not via `harvest_file`. Mode B
  swap is a future round.
- **F_ROH column shows "—" today** — `diversity_roh` root is empty on
  disk (see [`_handoff_docs/MISSING_DATA.md §2`](../../../../_handoff_docs/MISSING_DATA.md)).

## Documents

- **Registry doc**: [pages.registry.json](../../../../atlases/diversity/registries/data/pages.registry.json) → `pages.samples`
- **Per-page README**: [pages/per_sample/README.md](../../../../atlases/diversity/pages/per_sample/README.md)

**Confidence**: high
