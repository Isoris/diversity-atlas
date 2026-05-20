# texture (was page9)

**Stage:** per_sample · **Module:** [texture.js](texture.js) · **Fragment:** [texture.html](texture.html)

## Renders

Per-sample texture — within-genome distributional metrics that complement
the F_ROH | H framework on `roh`:
- **DDI** (within-genome dispersion of `H_w`) — how variable the
  per-window heterozygosity is across the genome of one sample.
- **χ_min** (cohort-relative diversity floor) — the deepest depression
  of `H_w` relative to the cohort median at the same window.

Output: DDI × H scatter (one point per sample) + per-window H strip with
χ_min marker for the focal sample.

## Reads (slots / aliases)

From [shared/data_loader.js](../../shared/data_loader.js):

| slot | alias | used for |
|---|---|---|
| `embedded_tables` | `D.S1`  | per-sample H |
| `embedded_tables` | `D.S9`  | ancestry colour-coding |
| `texture_metrics` (optional) | `D.WIN_METRICS` | windowed payload |

The `texture_metrics` payload schema (per
[files.registry.json](../../registries/data/files.registry.json)):

```
{
  params: {...},
  cohort_summary: {...},
  per_sample: [{sample, h_gw, ddi, chi_min, chi_min_chr, chi_min_pos, median_H_w, mad_H_w}],
  windows:   { chroms: [...], cohort_median_H_w: [...], cohort_q25_H_w: [...], cohort_q75_H_w: [...] },
  per_sample_H_w: { sample_id: [H_w per window] }
}
```

Estimated full size ~25 MB at 50 kb windows × 226 samples; consider
parquet/binary if it grows beyond browser-comfort range.

## Fallback behavior

When `texture_metrics.json` is absent or empty, renders a "data pending"
card and the DDI × H scatter falls back to cohort-summary fields only.

## Upstream pipeline

[catfish-diversity-analysis/04_window_diversity_texture/](../../../../../catfish-diversity-analysis/04_window_diversity_texture/)
(`STEP_A06_window_H_and_DDI.sh` +
`compute_window_metrics.py`). Adapter that produces the JSON in the
schema above is **not yet written** for this session.

---

## Mode-B cross-check

This page renders a small inline `data-source-badge` above its first card.
Probes `texture_metrics_payload` (the optional `data/texture_metrics.json`)
through the registry, extracting `per_sample[]`. Today's badge reports
`○ data pending` since the file ships as an empty stub until the upstream
pipeline (`04_window_H_and_DDI.sh`) lands; auto-flips to `●` when 226
samples are present.

See [`atlas-core/docs/SPEC_mode_b_pattern.md`](../../../../../atlas-core/docs/SPEC_mode_b_pattern.md)
for the full pattern (helper API, comparator authoring, workspace tally).

