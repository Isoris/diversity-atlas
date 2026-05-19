# about (was page7)

**Stage:** meta · **Module:** [about.js](about.js) · **Fragment:** [about.html](about.html)

## Renders

Methods, glossary, headline numbers, data lineage. Card grid with:
- headline numbers (cohort size, mean H, mean F_ROH).
- MODULE_3 pipeline summary (SD1..SD8 tables).
- coverage map (S4b, ST4, ST5).
- canonical references (REF table) for citation lookup.

## Reads (slots / aliases)

From [shared/data_loader.js](../../shared/data_loader.js)
(slot `embedded_tables`):

| alias | source table | used for |
|---|---|---|
| `D.globals`  | `dt_globals`                  | headline numbers |
| `D.SD1..SD8` | `dt_M3_SD1..SD8_*`            | MODULE_3 method tables |
| `D.S4b`      | `dt_S4b`                      | coverage map (per-sample) |
| `D.S4b_meta` | `dt_S4b_meta`                 | coverage-map metadata |
| `D.ST4_meta` | `dt_ST4_meta`                 | placeholder card metadata |
| `D.ST5`      | `dt_ST5`                      | reference index |
| `D.ST5_meta` | `dt_ST5_meta`                 | reference index metadata |
| `D.REF`      | `dt_REF`                      | canonical citations |
| `D.REF_meta` | `dt_REF_meta`                 | citation metadata |

## Fallback behavior

Required spine (`embedded_tables`) — no per-page fallback.
