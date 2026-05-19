# roh (was page5)

**Stage:** per_sample · **Module:** [roh.js](roh.js) · **Fragment:** [roh.html](roh.html)

## Renders

ROH composition — length-class bins, per-chr × per-sample F_ROH heatmap,
length spectrum.

Round-3 extension (ROH × gene-model): two extra cards consumed from the
optional `roh_gene_overlap` slot when present:
- **Plot A** — cumulative high-constraint-gene burden stack vs ROH-block
  rank, per K=8 group.
- **Plot B** — biotype × peak heatmap-table over named ROH peaks.

Stratified by K=8 / family / per-sample / F_ROH-quartile via the shared
pill toggle from [shared/stratification.js](../../shared/stratification.js)
(also used by `burden`).

## Reads (slots / aliases)

From [shared/data_loader.js](../../shared/data_loader.js):

| slot | alias | used for |
|---|---|---|
| `embedded_tables` | `D.S8`        | length-class bin counts |
| `embedded_tables` | `D.S8b`       | per-chr × per-sample F_ROH heatmap |
| `embedded_tables` | `D.S1`        | per-sample summary |
| `embedded_tables` | `D.S4`        | per-chr F_ROH |
| `embedded_tables` | `D.SD4`       | ROH bin-scheme metadata |
| `embedded_tables` | `D.S12`       | het in/out ROH per sample |
| `embedded_tables` | `D.S12_summary` | aggregate het in/out |
| `embedded_tables` | `D.S8c_long` | long-tract spectrum |
| `roh_gene_overlap` (optional) | `ctx.ROH_GENE_OVERLAP` | round-3 burden cards |

## Fallback behavior

When `roh_gene_overlap.json` is empty / absent, the round-3 burden cards
are hidden; the legacy ROH composition view renders unchanged.

## Upstream pipeline

ROH calls: [catfish-diversity-analysis/02_roh/](../../../../../catfish-diversity-analysis/02_roh/)
(`STEP_A03_run_ngsF_HMM.sh` + `STEP_A04_parse_roh_and_het.sh`).

The `roh_gene_overlap.json` adapter is **not yet written** — see
[_handoff_docs/SPEC_2026-05-12_roh_gene_burden.md](../../../../_handoff_docs/SPEC_2026-05-12_roh_gene_burden.md)
§4 + §5 for the target schema. Constraint proxy is still data-blocked
(pLI analog for catfish; possibly GERP ≥ 4 from teleost alignment when
that track ever lands).
