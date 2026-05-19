# samples (was page1)

**Stage:** per_sample · **Module:** [samples.js](samples.js) · **Fragment:** [samples.html](samples.html)

## Renders

Per-sample master table + 5 distribution/relationship plots. Click any
table row for a sample-detail drill-down panel.

- Top strip: cohort headline numbers (mean H, mean F_ROH, n_samples,
  cluster count) from `D.globals`.
- Main table (`#sampleTable`): one row per of 226 samples with H, F_ROH,
  ROH-bin counts, θπ summaries. Sortable headers, filter by NAToRA
  pruning status (pill), cluster filter (`#ssClusterFilter`).
- Sample detail (`#sampleDetail`): per-sample card with envelope
  provenance badge (`#ssEnvelopeBadge`) + per-chromosome breakdown.

## Reads (slots / aliases)

From [shared/data_loader.js](../../shared/data_loader.js) (slot
`embedded_tables`):

| alias | source table | used for |
|---|---|---|
| `D.globals` | `dt_globals` | headline numbers, cohort totals |
| `D.S1`      | `dt_S1`      | per-sample H, F_ROH, ROH bins, θπ stats |
| `D.S9`      | `dt_S9`      | per-sample ancestry / cluster labels |
| `D.ST2`     | `dt_ST2`     | per-sample provenance envelopes |

## Fallback behavior

If `embedded_tables` is unreachable, the loader rejects and atlas-core
shows its global error banner. There is no per-page "data pending"
fallback on this page — it is the atlas's required spine.

## Tests

[test_samples_provenance.js](test_samples_provenance.js) — smoke tests
for the `_renderProvenanceBadge()` helper (envelope-provenance card on
the per-sample drill-down).

Run from `diversity-atlas/`:
```
node atlases/diversity/pages/per_sample/test_samples_provenance.js
```
