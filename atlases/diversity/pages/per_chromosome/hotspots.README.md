# hotspots (was page3)

**Stage:** per_chromosome · **Module:** [hotspots.js](hotspots.js) · **Fragment:** [hotspots.html](hotspots.html)

## Renders

θπ outlier windows — 19 hotspots above the 99th percentile, with a
per-sample × per-window heatmap. Hotspot table sortable by chromosome /
position / θπ; clicking a row populates the heatmap row.

## Reads (slots / aliases)

From [shared/data_loader.js](../../shared/data_loader.js)
(slot `embedded_tables`):

| alias | source table | used for |
|---|---|---|
| `D.ST1`   | `dt_ST1`   | per-chrom θπ context strip |
| `D.ST3`   | `dt_ST3`   | outlier-window inventory (19 hotspots) |
| `D.ST3b`  | `dt_ST3b`  | per-sample × per-window values |

## Fallback behavior

Required spine (`embedded_tables`) — no per-page fallback.
