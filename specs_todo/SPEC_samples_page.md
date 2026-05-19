# SPEC — diversity-atlas `samples` page (per-sample table)

**Status**: shipped (envelope-aware migration landed as commit 28 of the
toolkit_registries action-pipeline branch — per
[atlas-core/toolkit_registries/STATUS.md](../../atlas-core/toolkit_registries/STATUS.md)
§1 commit 28: "diversity-atlas `per_sample/page1` migration"). 14-assertion
smoke test green; wired into the umbrella.

**Implemented in:**
- [`atlases/diversity/pages/per_sample/samples.html`](../atlases/diversity/pages/per_sample/samples.html)
- [`atlases/diversity/pages/per_sample/samples.js`](../atlases/diversity/pages/per_sample/samples.js)
- [`atlases/diversity/pages/per_sample/test_samples_provenance.js`](../atlases/diversity/pages/per_sample/test_samples_provenance.js)

This SPEC is **retrospective** — the migration shipped before the SPEC.

---

## 1. Goal

Per the manifest tooltip: "per-sample table — H, F_ROH, ROH bins, θπ
summaries. Click row for drill-down."

A flat sortable table with one row per sample in the cohort, surfacing
the four primary per-sample diversity statistics:

- `H` — genome-wide heterozygosity
- `F_ROH` — runs-of-homozygosity fraction
- ROH length-class bins (`F_ROH_short`, `F_ROH_medium`, `F_ROH_long`)
- per-sample θπ summary stats (mean / median across chromosomes)

Row click → drill-down view (per-chromosome breakdown for the chosen
sample).

## 2. Envelope-aware data source

`mount()` probes `listLayers()` filtered to `staging_diversity_slot_v0`
envelopes, then fetches each envelope to find ones with
`payload.slot === "embedded_tables"`. This is the **list+get fan-out**
pattern (commit 28 in STATUS.md).

When at least one matching envelope exists, renders a provenance badge
above the table:
- `payload.summary.n_rows` × `payload.summary.n_cols` shape
- humanised byte count
- last `created_at`
- `action_id`

When no matching envelope: falls back to DEMO data; badge says so.

## 3. Tested paths

14 assertions covering:
- envelope present (1 matching) → provenance badge rendered
- envelope present (multiple) → most-recent-wins
- partial-fetch-failure resilience (some envelopes 503, the others
  still display)
- fail-soft on full server outage

Test name was renamed at some point — the umbrella now correctly
references `test_samples_provenance.js` (fixed in this session).

## 4. Open work

- **Switch from advertise → consume** — the table cells still come from DEMO; production should bind to the envelope's `payload.rows`.
- **Per-stat normalisation toggle** — H and F_ROH have different units; a "normalize to z-score" toggle would help cross-stat comparison.
- **Per-family / per-sex shading** — rows colour-tinted by family or sex would surface batch effects visually.
