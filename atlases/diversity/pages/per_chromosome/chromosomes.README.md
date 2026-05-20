# chromosomes (was page2)

**Stage:** per_chromosome · **Module:** [chromosomes.js](chromosomes.js) · **Fragment:** [chromosomes.html](chromosomes.html)

## Renders

Per-chromosome diversity — θπ + F_ROH + per-chromosome Kruskal-Wallis
tests. Top strip with cohort-vs-chromosome summary cells; main table
ranking 29 chromosomes by mean θπ and F_ROH; per-chromosome KW
significance overlay; ngsF-HMM stability flag column from `D.SZ`.

## Reads (slots / aliases)

From [shared/data_loader.js](../../shared/data_loader.js)
(slot `embedded_tables`):

| alias | source table | used for |
|---|---|---|
| `D.ST1`     | `dt_ST1`    | per-chrom θπ |
| `D.S4`      | `dt_S4`     | per-chrom F_ROH |
| `D.S6`      | `dt_S6`     | per-chrom KW tests |
| `D.SZ`      | `dt_SZ`     | ngsF-HMM stability flags |
| `D.globals` | `dt_globals`| cohort-wide reference |

## Fallback behavior

Required spine (`embedded_tables`) — no per-page fallback.

---

## Mode-B cross-check

This page renders a small inline `data-source-badge` above its first card.
Probes `samples_theta_pi_pestpg` for one representative sample (CGA009)
at the 500 kb scale — the closest-to-carve resolution. Cross-checks 28
distinct chroms (strict) + per-window mean θπ within 30 % of
`D.globals.theta_pi_mean` (loose, since per-sample θπ is noisier than
cohort mean).

See [`atlas-core/docs/SPEC_mode_b_pattern.md`](../../../../../atlas-core/docs/SPEC_mode_b_pattern.md)
for the full pattern (helper API, comparator authoring, workspace tally).

