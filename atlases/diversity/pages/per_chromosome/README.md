# `pages/per_chromosome/` — Diversity Atlas per-chromosome stage

Per-chromosome diversity lens — where each page's row (or grid cell) is
one chromosome.

## What each page does

| page | manifest stage | label | summary |
|------|----------------|-------|---------|
| `chromosomes` | per_chromosome | chromosomes | per-chrom θπ + F_ROH + KW test + ngsF-HMM convergence |
| `hotspots`    | per_chromosome | hotspots    | 19 θπ outlier windows above 99th-percentile + per-sample × per-window heatmap |

## Vocabulary contracts

### Window scale (per `samples_theta_pi_pestpg`)

Four pre-baked scales on disk:

| scale | win_bp | step_bp |
|-------|--------|---------|
| `10kb` | 10 000 | 2 000 |
| `5kb`  | 5 000  | 1 000 |
| `50kb` | 50 000 | 10 000 |
| `500kb`| 500 000| 500 000 |

Other scales require the (PLANNED) [`run_thetastat`](../../registries/runners/run_thetastat.py)
runner to (re)compute from `.thetas.idx + .thetas.gz`.

### Hotspot cutoff

Default: `cohort_theta_pi_percentile ≥ 99`. The 19-window list is a
snapshot at this threshold — changing the threshold requires regenerating
`D.ST3` and re-embedding.

## Cross-page dependencies

- **chromosomes** is the source of truth for `D.ST1` (per-chrom θπ
  context). **hotspots** reads from the same table to position windows
  in chromosomal coordinates.
- **hotspots** per-sample heatmap rows are aligned with the
  per-sample order in `samples` (consistent sample-id sort).

## Round status

Both pages are round 1 (active, snapshot reads). Mode B per-window
fetch (`samples_theta_pi_pestpg` via `harvest_file` parameterised by
`{sample_id, win_bp, step_bp}`) is wired but not yet consumed.

## IN / OUT adapters

| layer | runner | extractor | schema_out |
|-------|--------|-----------|-----------|
| `samples_theta_pi_pestpg` | [`harvest_file`](../../registries/runners/harvest_file.py) | [`extractors/pestpg.py`](../../registries/extractors/pestpg.py) | [`theta_pi_pestpg_v1`](../../registries/schemas/schema_out/theta_pi_pestpg_v1.schema.json) |
| `aggregate_pi` (PLANNED)  | [`runners/aggregate_pi.py`](../../registries/runners/aggregate_pi.py) | (cohort rollup; pure-Python compute) | (schema TBD when 05_aggregated/ ships) |

## SPECs relevant to per_chromosome

- KICKOFF_diversity_atlas.md §scales (window-scale decision)

## Per-page contracts

[`docs/generated/page_contracts/<page>/`](../../../../docs/generated/page_contracts/) — every per-chromosome page has a contract.

## Notes for new contributors

- **pestPG annotation row**: ANGSD's `doThetaStat` prepends a single
  `#(indexStart...)` annotation line above the column header. The
  [`extractors/pestpg.py`](../../registries/extractors/pestpg.py)
  skips it via `params.comment_prefix`.
- **`tP / nSites` = π per window** — the extractor exposes both
  fields; downstream code divides at render time.
- **05_aggregated/ is empty on disk** — `cohort_master_per_chrom` is
  disabled until the cluster-side rollup ships.
