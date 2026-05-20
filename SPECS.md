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
| _none yet — all 11 per-page SPECs sit in `specs_todo/`; they describe both v1 (current scaffolds, mostly DEMO-backed) and v2 (envelope-aware target) state. SPECs will migrate to `specs_done/` page-by-page as the consume-stage migrations land. The `samples` page is closest — its envelope-advertise provenance badge already ships with a 14-assertion smoke._ | | |

## Backlog — `specs_todo/` (all 11 pages, written 2026-05-20)

### Per-page SPECs

Each SPEC documents the biological hypothesis, data input (current
DEMO-backed vs target envelope shape), per-view math, statistical null
models, failure modes, cross-page hooks, and v1-vs-v2 promotion criteria.
Substance ~150–400 lines per page, matching the meiosis-atlas SPEC
depth standard.

| stage          | page id      | SPEC | lines | scope summary |
|----------------|--------------|------|-------|---------------|
| per_sample     | `samples`    | [SPEC_samples_page.md](specs_todo/SPEC_samples_page.md)             | 218 | per-sample table; envelope-advertise shipped; envelope-consume v2 |
| per_sample     | `roh`        | [SPEC_roh_page.md](specs_todo/SPEC_roh_page.md)                     | 277 | ROH bins + heatmap + length spectrum; shared stratification pill |
| per_sample     | `texture`    | [SPEC_texture_page.md](specs_todo/SPEC_texture_page.md)             | 237 | DDI (CoV of windowed H) + χ_min (cohort-relative floor) |
| per_chromosome | `chromosomes`| [SPEC_chromosomes_page.md](specs_todo/SPEC_chromosomes_page.md)     | 222 | per-chrom θπ + F_ROH + KW omnibus + per-chrom Mann-Whitney + Bonferroni |
| per_chromosome | `hotspots`   | [SPEC_hotspots_page.md](specs_todo/SPEC_hotspots_page.md)           | 224 | θπ outlier windows above 99th percentile; per-sample support heatmap |
| stratified     | `ancestry`   | [SPEC_ancestry_page.md](specs_todo/SPEC_ancestry_page.md)           | 252 | K=8 hard-call + K-sweep + per-cluster KW + Spearman Q-correlations |
| stratified     | `divergence` | [SPEC_divergence_page.md](specs_todo/SPEC_divergence_page.md)       | 265 | group-divergence node-link graph; FST/DXY/dA; references legacy _handoff_docs spec |
| functional     | `burden`     | [SPEC_burden_page.md](specs_todo/SPEC_burden_page.md)               | 397 | 5 layers (VESM/πN/πS/π0/π4/LOF/ROH-overlap) × 4 stratifications; bootstrap CIs; cross-stratum KW |
| qc             | `pruning_qc` | [SPEC_pruning_qc_page.md](specs_todo/SPEC_pruning_qc_page.md)       | 314 | NAToRA pruning + ngsF-HMM stability + Spearman matrix + het in/out ROH |
| meta           | `about`      | [SPEC_about_page.md](specs_todo/SPEC_about_page.md)                 | 172 | methods (SD1-SD8) + glossary + headline tiles + lineage diagram |
| meta           | `roadmap`    | [SPEC_roadmap_page.md](specs_todo/SPEC_roadmap_page.md)             | 107 | inverse view of specs_todo — what's planned but not shipped |

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
