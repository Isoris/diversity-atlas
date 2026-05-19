# Diversity Atlas — Page Contract Index

Per-page capability contracts for all 11 Diversity Atlas pages
(post-2026-05-19 renames). Each contract follows the Inversion Atlas
template: Purpose · Architecture · Capabilities · Required data ·
Interactions · Outputs · Adapters · Status · Documents.

## By stage

### per_sample

- [`samples`](page_contracts/samples/PAGE_CONTRACT.md) — per-sample master table + 5 distribution plots · round 1
- [`roh`](page_contracts/roh/PAGE_CONTRACT.md) — ROH composition + round-3 gene-burden extension · round 1 + 3
- [`texture`](page_contracts/texture/PAGE_CONTRACT.md) — DDI + χ_min per-sample texture · round 2 (data pending)

### per_chromosome

- [`chromosomes`](page_contracts/chromosomes/PAGE_CONTRACT.md) — per-chromosome θπ + F_ROH + KW · round 1
- [`hotspots`](page_contracts/hotspots/PAGE_CONTRACT.md) — 19 θπ outlier windows + per-sample heatmap · round 1

### stratified

- [`ancestry`](page_contracts/ancestry/PAGE_CONTRACT.md) — K=8 stratified tests + K-sweep · round 1
- [`divergence`](page_contracts/divergence/PAGE_CONTRACT.md) — group-divergence network · round 3 (data pending)

### functional

- [`burden`](page_contracts/burden/PAGE_CONTRACT.md) — functional burden / selection efficacy · round 3 (data pending)

### qc

- [`pruning_qc`](page_contracts/pruning_qc/PAGE_CONTRACT.md) — NAToRA + ngsF-HMM + Spearman matrix · round 1

### meta

- [`about`](page_contracts/about/PAGE_CONTRACT.md) — headline numbers + methods · round 1 (final)
- [`roadmap`](page_contracts/roadmap/PAGE_CONTRACT.md) — what's shipped vs planned · round 1 (static)

## Round phasing

| round | new pages |
|-------|-----------|
| 1 | samples, chromosomes, hotspots, ancestry, roh, pruning_qc, about, roadmap |
| 2 | texture |
| 3 | burden, divergence, roh × gene-overlap extension |

## Adapter modes (IN side)

| mode | path | status |
|------|------|--------|
| **Mode A — snapshot** | [`shared/data_loader.js`](../../atlases/diversity/shared/data_loader.js) → `embedded_tables.json` | active (all pages today) |
| **Mode B — extractor pipeline** | [`harvest_file`](../../atlases/diversity/registries/runners/harvest_file.py) → per-layer extractor → typed envelope | wired but not yet consumed by any page |

Mode B is the long-term direction. Pages will swap layer-by-layer
without rewriting the renderer (see `_v2_changes_2026-05-20` in
[layers.registry.json](../../atlases/diversity/registries/data/layers.registry.json)).

## Stage READMEs

- [`pages/per_sample/README.md`](../../atlases/diversity/pages/per_sample/README.md)
- [`pages/per_chromosome/README.md`](../../atlases/diversity/pages/per_chromosome/README.md)
- [`pages/stratified/README.md`](../../atlases/diversity/pages/stratified/README.md)
- [`pages/functional/README.md`](../../atlases/diversity/pages/functional/README.md)
- [`pages/qc/README.md`](../../atlases/diversity/pages/qc/README.md)
- [`pages/meta/README.md`](../../atlases/diversity/pages/meta/README.md)
