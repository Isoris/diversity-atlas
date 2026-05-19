# roh — ROH composition + gene-burden extension — Page Capability Contract

**Atlas**: diversity · **Stage**: per_sample · **Status**: active (round 3 extension wired)

## Purpose

Runs of Homozygosity composition for the 226-sample cohort. Six views:
- Length-class bins per sample (S8) — short / medium / long / very long
- Per-chrom × per-sample F_ROH heatmap (S8b)
- ROH length spectrum across cohort (S8c)
- Het in/out of ROH per sample (S12 + S12_summary)
- Long-tract drill-down (S8c_long)
- ROH × gene-model overlap (round-3 extension):
  - Plot A — cumulative gene-burden across F_ROH quartiles
  - Plot B — biotype × peak heatmap-table

## Architecture

Mode A snapshot + optional round-3 payload `roh_gene_overlap.json` for
the gene-model extension. Renders "data pending" cards when the optional
payload is empty or absent.

## Capabilities

- All six views above.
- Stratify by K=8 / family / sample / F_ROH-quartile (shared pill
  toggle from
  [`shared/stratification.js`](../../../../atlases/diversity/shared/stratification.js)).
- Length-class threshold config (persisted to localStorage).

## Required data

- **Registry says**: `requires_layers: []`, `requires_slots: []`
- **Actually consumed (Mode A)**: `D.S8`, `D.S8b`, `D.S1`, `D.S4`,
  `D.SD4`, `D.S12`, `D.S12_summary`, `D.S8c_long`
- **Optional (round-3)**: `ctx.ROH_GENE_OVERLAP` payload
  (`roh_gene_overlap.json`)
- **Future Mode B layers**: `samples_roh_per_sample`,
  `cohort_froh_per_chrom`, `cohort_roh_length_bins` (all DISABLED today
  — `diversity_roh` root is empty on disk)

## User interactions

- View toggle (6 views).
- Stratification pill.
- Length-class threshold drag.
- Heatmap cell click → sample × chrom detail.

## Outputs

Preview only.

## Connected analyses / adapters

- **IN adapter (Mode B, DISABLED)**:
  [`harvest_file → roh_per_sample`](../../../../atlases/diversity/registries/extractors/roh_per_sample.py) →
  [`samples_roh_per_sample_v1`](../../../../atlases/diversity/registries/schemas/schema_out/samples_roh_per_sample_v1.schema.json).
  Extractor written defensively; layers carry `disabled: true` until the
  pipeline ships.
- **Optional payload**: `roh_gene_overlap.json` — currently a stub on
  disk (see [`layers.registry.json::roh_gene_overlap_payload`](../../../../atlases/diversity/registries/data/layers.registry.json)).
- **Upstream pipeline**: `catfish-diversity-analysis` Module 04_roh
  (currently empty); gene-overlap extension targets a future
  `phase_3_pairwise/03_roh_gene_burden.sh`.

## Status and known issues

- **`diversity_roh` empty on disk** — three layers
  (`samples_roh_per_sample`, `cohort_froh_per_chrom`,
  `cohort_roh_length_bins`) carry `disabled: true`. Page falls back to
  snapshot reads.
- **Gene-burden extension is data-blocked** on a constraint proxy (pLI
  analog) decision — see `SPEC_2026-05-12_roh_gene_burden.md §6.2`.

## Documents

- **Registry doc**: [pages.registry.json](../../../../atlases/diversity/registries/data/pages.registry.json) → `pages.roh`
- **Per-page README**: [pages/per_sample/README.md](../../../../atlases/diversity/pages/per_sample/README.md)
- **Spec**: `_handoff_docs/SPEC_2026-05-12_roh_gene_burden.md`

**Confidence**: high (Mode A); medium (Mode B — depends on disabled layers landing)
