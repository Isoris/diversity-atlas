# SPECS — diversity-atlas master index

Cross-cutting index of every specification in this repo. Mirrors the
inversion-atlas, meiosis-atlas, and relatedness-atlas conventions.

## Folder convention

```
specs_todo/   — design backlog (authored, not yet implemented)
specs_done/   — shipped (implementation matches the SPEC)
_handoff_docs/ — legacy specs authored before the folder convention;
                 indexed here, can be migrated into specs_todo/ later
                 with no content change
```

**Rule**: a SPEC never gets deleted. When code ships, move the SPEC
into `specs_done/` with an `Implemented in:` block.

## Atlas at a glance

The diversity-atlas presents per-sample, per-chromosome, and stratified
diversity views over the 226-sample pure *C. gariepinus* hatchery
cohort. Producer side:
[`catfish-diversity-analysis`](https://github.com/Isoris/catfish-diversity-analysis)
(ANGSD `-doThetas` pestPG outputs, ROH, het, ancestry). The atlas is the
consumer / browser UI.

Registered in `atlas-core/toolkit_registries/relatedness/01_registry/atlases.jsonl`
(if applicable — confirm at next registry pass).

## Shipped — `specs_done/`

| SPEC | what it covers | implementation |
|------|----------------|----------------|
| _none yet — first migration round in flight_ | | |

## Backlog — `specs_todo/`

### Per-page SPECs (one per visible page in the manifest)

| stage          | page id      | SPEC | tooltip summary |
|----------------|--------------|------|-----------------|
| per_sample     | `samples`    | [SPEC_samples_page.md](specs_todo/SPEC_samples_page.md)     | per-sample table — H, F_ROH, ROH bins, θπ; click row → drill-down |
| per_sample     | `roh`        | [SPEC_roh_page.md](specs_todo/SPEC_roh_page.md)             | ROH composition: length-class bins + heatmap + spectrum |
| per_sample     | `texture`    | [SPEC_texture_page.md](specs_todo/SPEC_texture_page.md)     | DDI + χ_min (per-sample texture metrics) |
| per_chromosome | `chromosomes`| [SPEC_chromosomes_page.md](specs_todo/SPEC_chromosomes_page.md) | per-chromosome θπ + F_ROH + KW tests |
| per_chromosome | `hotspots`   | [SPEC_hotspots_page.md](specs_todo/SPEC_hotspots_page.md)   | θπ outlier windows (19 above 99th percentile) |
| stratified     | `ancestry`   | [SPEC_ancestry_page.md](specs_todo/SPEC_ancestry_page.md)   | K=8 clusters + K-sweep + per-Q correlations + KW/pairwise |
| stratified     | `divergence` | [SPEC_divergence_page.md](specs_todo/SPEC_divergence_page.md) | group-divergence network (node-link plot) — references _handoff_docs/SPEC_2026-05-12_divergence_network.md |
| functional     | `burden`     | [SPEC_burden_page.md](specs_todo/SPEC_burden_page.md)       | VESM burden + πN/πS + LOF count + ROH overlap; 5 stratifications — references _handoff_docs/SPEC_2026-05-12_functional_burden.md |
| qc             | `pruning_qc` | [SPEC_pruning_qc_page.md](specs_todo/SPEC_pruning_qc_page.md) | NAToRA pruning + ngsF-HMM stability + Spearman matrix |
| meta           | `about`      | [SPEC_about_page.md](specs_todo/SPEC_about_page.md)         | methods (SD1-SD8), glossary, headline numbers, lineage |
| meta           | `roadmap`    | [SPEC_roadmap_page.md](specs_todo/SPEC_roadmap_page.md)     | what's planned but not yet shipped |

### Legacy product/feature SPECs (`_handoff_docs/`)

These predate the SPECS folder convention. Content is sound; could be
migrated into `specs_todo/` later with no content change.

| SPEC | page consumer | status |
|------|---------------|--------|
| [SPEC_2026-05-12_divergence_network.md](_handoff_docs/SPEC_2026-05-12_divergence_network.md) | `divergence` | spec only; no pipeline; no page code |
| [SPEC_2026-05-12_functional_burden.md](_handoff_docs/SPEC_2026-05-12_functional_burden.md)    | `burden`     | spec only; no pipeline run; no new page code |
| [SPEC_2026-05-12_pairwise_segclass.md](_handoff_docs/SPEC_2026-05-12_pairwise_segclass.md)    | future segclass page | 4/5 questions resolved 2026-05-12; one open |
| [SPEC_2026-05-12_roh_gene_burden.md](_handoff_docs/SPEC_2026-05-12_roh_gene_burden.md)        | `roh` + `burden` cross-page | spec only; round-1 decision status flagged at top |

Plus operational docs in `_handoff_docs/`:
- `DATA_PROVENANCE.md` — input file lineage
- `MISSING_DATA.md` — known gaps in the producer outputs

## Paired analysis repo

[`catfish-diversity-analysis`](https://github.com/Isoris/catfish-diversity-analysis) — producer of every diversity layer this atlas reads.

## Cross-atlas concerns

- **`ancestry` stratification** — the K=8 Q matrix is co-consumed by other atlases (relatedness's `karyotypes` page uses it for the ancestry stripe). Single source of truth lives here.
- **`burden` × ROH** — overlap with the relatedness/inversion-atlas's `inversion_signature` page (gene density × inversion span). Same upstream data; different framings.
- **Mode-B badge** ([`shared/mode_b_badge.js`](atlases/diversity/shared/mode_b_badge.js)) — the atlas's `staging_diversity_slot_v0` envelope provenance line; same pattern as relatedness's `data-source-badge`.
