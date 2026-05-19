# `pages/stratified/` — Diversity Atlas stratified stage

Cohort-stratified tests: ancestry × diversity at K=8 (plus K-sweep
K=2..12), and group-divergence networks.

## What each page does

| page | manifest stage | label | summary |
|------|----------------|-------|---------|
| `ancestry`   | stratified | ancestry   | K=8 stratified F_ROH / H tests + K-sweep trajectory + per-Q correlations |
| `divergence` | stratified | divergence | group-divergence network (FST / DXY / dA between K=8 groups) |

## Vocabulary contracts

### K (NGSadmix cluster count)

Zero-padded two digits in file paths: `K02`, `K03`, …, `K12`. JS code
expects an integer (`K=8`); the [`tsv_table`](../../registries/extractors/tsv_table.py)
extractor parses both `K02_all226` and `K=8` from filenames.

### Cohort

Two values:

| value | meaning |
|-------|---------|
| `all226`   | full 226-sample cohort |
| `pruned81` | NAToRA-pruned 81-sample subset (relatedness-filtered) |

Pruned cohort id is **locked** — re-pruning would invalidate the label
that propagates through every per-K layer.

### F_ST estimator

The `divergence` page consumes whichever estimator the upstream
pipeline ships (Weir & Cockerham / Hudson / Reynolds — decision is
pipeline-side per `SPEC_2026-05-12_divergence_network.md §6`). Atlas
renders the number, not a choice.

### Edge filter modes (per `divergence`)

| mode | meaning |
|------|---------|
| `Show all`        | every pair rendered |
| `Top-N`           | top N edges by metric value (user-set N) |
| `Significant only`| bootstrap p ≤ 0.05 |

## Cross-page dependencies

- **ancestry** and **divergence** both consume `D.S1 + D.S9` for group
  membership. Shared via Mode A snapshot.
- **divergence** is **NOT** wired to the per-pairwise θπ in inversion
  vs collinear segments — that's owned by the `population-atlas` per
  the cross-atlas pointer in layers.registry.json §10.

## Round status

| page | round | status |
|------|-------|--------|
| `ancestry`   | round 1 | active |
| `divergence` | round 3 | scaffold (data pending) |

## IN / OUT adapters

| layer | runner | extractor | schema_out |
|-------|--------|-----------|-----------|
| `ancestry_het_kruskal` (+ 9 sibling per-K layers) | [`harvest_file`](../../registries/runners/harvest_file.py) | [`extractors/tsv_table.py`](../../registries/extractors/tsv_table.py) | [`ancestry_het_kruskal_v1`](../../registries/schemas/schema_out/ancestry_het_kruskal_v1.schema.json) (kruskal); [`tsv_table_v1`](../../registries/schemas/schema_out/tsv_table_v1.schema.json) (others) |
| `divergence_network_payload` (optional) | `harvest_file` | (file-content schema only) | [`divergence_network_v1`](../../registries/schemas/divergence_network_v1.schema.json) |

## SPECs relevant to stratified

- `_handoff_docs/SPEC_2026-05-12_divergence_network.md`
- Module 02_heterozygosity / `05_ancestry_heterozygosity/` R post-processing

## Per-page contracts

[`docs/generated/page_contracts/<page>/`](../../../../docs/generated/page_contracts/) — every stratified page has a contract.

## Notes for new contributors

- **R-style dot-suffixed columns** (`p.value`, `p_adj`): the
  `ancestry_het_kruskal_v1` extractor renames them to `p_value` /
  `p_value_adj`. JS consumers never see the dotted form.
- **22 per-K files on disk** (11 K × 2 cohorts) — page reads the
  active K only; pre-fetching wastes bandwidth.
- **Cross-K aggregates** (`*_all.tsv`) are separate layers from the
  per-K templates — used for the K-sweep trajectory plot.
