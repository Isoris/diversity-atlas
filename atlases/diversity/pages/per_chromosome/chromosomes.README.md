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
