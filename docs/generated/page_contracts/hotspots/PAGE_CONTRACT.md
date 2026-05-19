# hotspots — θπ outlier windows — Page Capability Contract

**Atlas**: diversity · **Stage**: per_chromosome · **Status**: active

## Purpose

19 θπ outlier windows above the 99th percentile of the cohort
distribution, listed with chromosomal coordinates and a per-sample ×
per-window heatmap showing which samples drive each hotspot.

## Architecture

Mode A snapshot. Sources: `D.ST1` (per-chrom θπ context), `D.ST3` (the
hotspot list), `D.ST3b` (per-sample × per-window matrix).

## Capabilities

- Render the 19-row hotspot table (chrom · start · end · cohort θπ ·
  percentile rank).
- Render the per-sample heatmap (rows = samples, cols = hotspots,
  cell = sample θπ in that window).
- Filter rows by chrom / p-rank / sample.

## Required data

- **Registry says**: `requires_layers: []`, `requires_slots: []`
- **Actually consumed (Mode A)**: `D.ST1`, `D.ST3`, `D.ST3b`

## User interactions

- Row click → highlight hotspot column in heatmap.
- Heatmap cell hover → sample + θπ tooltip.
- Filter inputs (chrom / sample).

## Outputs

Preview only.

## Connected analyses / adapters

- No Mode B adapter yet — hotspot detection lives in the cluster-side
  Module 03 post-processing. Future round will add an
  `import_hotspots` action + `cohort_hotspots_v1` schema_out.

## Status and known issues

- **19 hotspots is a snapshot of the 2026-05 cohort run** — when the
  cohort or threshold changes, the snapshot must be regenerated and
  re-embedded. Mode B promotion would make this dynamic.

## Documents

- **Registry doc**: [pages.registry.json](../../../../atlases/diversity/registries/data/pages.registry.json) → `pages.hotspots`
- **Per-page README**: [pages/per_chromosome/README.md](../../../../atlases/diversity/pages/per_chromosome/README.md)

**Confidence**: high
