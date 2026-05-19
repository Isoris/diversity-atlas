# SPEC — diversity-atlas `roh` page (ROH composition)

**Status**: scaffold.

**Scaffolded in:** [`atlases/diversity/pages/per_sample/roh.html`](../atlases/diversity/pages/per_sample/roh.html) + `roh.js`.

---

## 1. Goal

Per the manifest tooltip: "ROH composition — length-class bins, per-chr ×
per-sample F_ROH heatmap, length spectrum."

Three views over runs-of-homozygosity:

1. **Length-class bins** — per-sample stacked bar: `F_ROH_short` (<1Mb)
   + `F_ROH_medium` (1-10Mb) + `F_ROH_long` (>10Mb). Long ROH indicate
   recent inbreeding; short ROH indicate ancient demographic history.
2. **Per-chr × per-sample F_ROH heatmap** — rows = samples, cols =
   chromosomes, cell intensity = F_ROH on that (sample, chrom). Surfaces
   chromosome-specific ROH (e.g. chromosomes under strong selection or
   with low recombination).
3. **Length spectrum** — histogram of all ROH segment lengths across
   the cohort. Used to choose the length-class thresholds.

## 2. Data dependencies

Producer: `diversity_roh` root in `master_config.yaml`
(`/mnt/e/results_diversity/04_roh`). Layer not yet registered as an
envelope (per registry: a `roh_per_sample.v1` adapter would land here).

Cross-page link: [`burden`](SPEC_burden_page.md) page uses the ROH
overlap fraction as one of its 5 layers. Common stratification pill
(K=8 / family / per-sample / F_ROH-quartile) is shared between the two
pages.

## 3. Stratification pill

Shared with `burden`. Five options:
- `all` (default — cohort aggregate)
- `K=8 ancestry cluster` — colours by cluster
- `family` — by family-hub assignment
- `per-sample` — no aggregation; one row per sample
- `F_ROH-quartile` — bins samples by overall F_ROH (Q1–Q4)

The pill control lives in a shared module
([`atlases/diversity/shared/strat_pill.js`](../atlases/diversity/shared/) — TBD)
so both pages stay synchronised.

## 4. Surface

```
#rohViewSelect     — radio: bins / heatmap / spectrum
#rohStratPill      — shared stratification toggle
#rohLengthThresholdEditor — short/medium/long boundaries (default 1Mb / 10Mb)
#rohMainView       — main viz (bar / heatmap / histogram)
#rohSummary        — text summary: cohort F_ROH median, IQR, n samples with F_ROH > 0.10
#rohDataSource     — envelope status badge
```

## 5. Open work

- **Adapter pair** — needs a `roh_per_sample` IN/OUT adapter following the [cookbook](../../atlas-core/docs/SPEC_atlas_adapter_cookbook.md). Producer file: per-sample ROH segment TSV.
- **Cohort-vs-individual mode** — toggle to view one sample against cohort distribution. Today only cohort view.
- **Inbreeding-pedigree overlay** — when ROH-by-descent is computed (vs ROH-by-state), overlay with pedigree-expected inbreeding from the relatedness atlas's ngsRelate output.
- **Cross-page consistency** — confirm the stratification pill state can be promoted to atlas state so navigating between `roh` and `burden` preserves the choice.
