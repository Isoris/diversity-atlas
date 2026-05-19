# `pages/per_sample/` — Diversity Atlas per-sample stage

Per-sample diversity lens for the 226-sample pure *C. gariepinus*
hatchery cohort. Where every page's row is one sample.

## What each page does

| page | manifest stage | label | summary |
|------|----------------|-------|---------|
| `samples` | per_sample | samples | per-sample master table — H, F_ROH, ROH bins, θπ summaries; click-row drill-down |
| `roh`     | per_sample | ROH     | ROH composition — length-class bins, per-chr × per-sample heatmap, length spectrum, het in/out ROH; round-3 gene-burden extension |
| `texture` | per_sample | texture | per-sample DDI × H + per-window H strip (χ_min marker); round-2 spec; data pending |

## Vocabulary contracts

### Sample ID

All sample IDs match `^CGA[0-9]+$` (e.g. `CGA009`). Schemas enforce
this pattern; the IN-side TSV may carry a `sample` column which the
extractor normalises to `sample_id`.

### F_ROH quartiles

`F_ROH-quartile` is a shared stratification dimension across `roh` /
`texture` / `burden`. Quartile boundaries are recomputed each session
from the active cohort (all226 vs pruned81); persisted to localStorage
on first compute.

### Length classes (per `roh`)

| label | length range |
|-------|--------------|
| short      | 100 kb – 500 kb |
| medium     | 500 kb – 1 Mb  |
| long       | 1 Mb – 5 Mb     |
| very long  | > 5 Mb          |

Thresholds are user-configurable (persisted to localStorage). Schema
imposes no enum.

## Cross-page dependencies

- **samples** and **roh** both consume `D.S1` — shared via the Mode A
  snapshot loader.
- **texture** and **roh** share the F_ROH-quartile stratification pill
  ([`shared/stratification.js`](../../shared/stratification.js)).
- **roh** → **samples** drill-down: clicking a sample row in `roh`'s
  per-chrom heatmap opens the same drawer that `samples` opens on row
  click. State coordination via `_pageState`.

## Round status

| page | round | status |
|------|-------|--------|
| `samples` | round 1 | active (snapshot reads) |
| `roh`     | round 1 + round 3 extension | active (snapshot + optional payload) |
| `texture` | round 2 | scaffold (data pending) |

## IN / OUT adapters

| layer | runner | extractor | schema_out |
|-------|--------|-----------|-----------|
| `samples_genomewide_het` | [`harvest_file`](../../registries/runners/harvest_file.py) | [`extractors/genomewide_het.py`](../../registries/extractors/genomewide_het.py) | [`samples_genomewide_het_v1`](../../registries/schemas/schema_out/samples_genomewide_het_v1.schema.json) |
| `samples_sfs`            | `harvest_file` | [`extractors/sfs_ml.py`](../../registries/extractors/sfs_ml.py) | [`sample_sfs_v1`](../../registries/schemas/schema_out/sample_sfs_v1.schema.json) |
| `samples_roh_per_sample` (DISABLED) | `harvest_file` | [`extractors/roh_per_sample.py`](../../registries/extractors/roh_per_sample.py) | [`samples_roh_per_sample_v1`](../../registries/schemas/schema_out/samples_roh_per_sample_v1.schema.json) |
| `texture_metrics_payload` (optional) | `harvest_file` | (file-content schema only) | [`texture_metrics_v1`](../../registries/schemas/texture_metrics_v1.schema.json) |

## SPECs relevant to per_sample

- `_handoff_docs/SPEC_2026-05-12_roh_gene_burden.md` (round-3 ROH ×
  gene extension)
- `_handoff_docs/SPEC_2026-05-12_*.md` (texture metrics — data_loader.js
  header)

## Per-page contracts

[`docs/generated/page_contracts/<page>/`](../../../../docs/generated/page_contracts/) — every per-sample page has a contract.

## Notes for new contributors

- **Mode A vs Mode B**: round 1 reads everything from
  `embedded_tables.json` (Mode A). The Mode B extractor pipeline is
  wired but not yet consumed by any page — see the `_v2_changes_2026-05-20`
  note in [layers.registry.json](../../registries/data/layers.registry.json).
- **`diversity_roh` is empty on disk** — three ROH layers carry
  `disabled: true`. The page falls back to snapshot reads.
