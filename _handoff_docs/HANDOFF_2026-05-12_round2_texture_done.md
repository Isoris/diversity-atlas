# HANDOFF — round 2 (texture: DDI + χ_min) DONE

**Date:** 2026-05-12
**Atlas:** diversity
**Branch:** `claude/add-window-diversity-metrics-o21xy`
**Status:** atlas-side scaffolding shipped; awaits upstream pipeline step 04.

---

## Scope of this round

Atlas-side only. The pipeline scripts (`03_per_chromosome_heterozygosity.sh`,
`04_window_H_and_DDI.sh`) belong in `catfish-diversity-analysis` and are
**not in this repo**.

What landed here:

1. **New page9 `texture`** (per_sample stage) — DDI × H scatter (cohort) +
   per-window H strip (per sample on click) + χ_min marker + sample-detail
   panel with quadrant classification.
2. **Optional data layer `texture_metrics.json`** registered as a `files`
   entry. Round-2 ships an empty stub; page9 detects an empty payload and
   renders the "data pending" card.
3. **`shared/data_loader.js`** now fetches `texture_metrics.json` in parallel
   with `embedded_tables.json` and exposes the parsed object as
   `ctx.WIN_METRICS`. A missing or 404 file resolves to `null` (no error)
   so pages 1–8 are unaffected.
4. **Registries updated** — `manifest.json` (page9 entry, version bumped to
   `2026-05-12-round2-texture`), `pages.registry.json` (page9 _label/_doc),
   `files.registry.json` (texture_metrics entry with `optional: true`).

What did NOT land (deliberately deferred):

- Cross-page integration into page1 (DDI / χ_min columns in master table) —
  defer until real data exists, to avoid placeholder columns in the
  cohort-facing view.
- DDI distributions per K cluster on page4 (ancestry) — same rationale.
- Pipeline scripts `03_*` / `04_*` — wrong repo (per user direction).
- Tests (unit + smoke) — the diversity atlas does not yet have a test
  harness in this repo. Adding one is a separate piece of architectural
  work, not gated on this metric.

---

## Files changed / added

| Path | Change |
|---|---|
| `atlases/diversity/manifest.json` | + page9 entry; version → round2-texture |
| `atlases/diversity/registries/data/pages.registry.json` | + page9 block |
| `atlases/diversity/registries/data/files.registry.json` | + texture_metrics entry |
| `atlases/diversity/shared/data_loader.js` | + optional texture fetch in parallel; ctx.WIN_METRICS |
| `atlases/diversity/pages/per_sample/page9.html` | NEW — DDI scatter card + strip card + methods card + pending-data card |
| `atlases/diversity/pages/per_sample/page9.js` | NEW — full renderer, gracefully handles missing texture payload |
| `atlases/diversity/data/texture_metrics.json` | NEW — empty stub with `params{}` populated; rest null/empty |
| `_handoff_docs/HANDOFF_2026-05-12_round2_texture_done.md` | this file |

---

## Canonical data schema (page9 consumer)

```jsonc
{
  "params": {
    "win_kb": 50,                       // primary window size
    "step_kb": 50,                      // non-overlapping
    "min_callable_per_window": 15000,   // 30% of 50 kb
    "mad_constant": 1.4826,             // R mad() default
    "chi_min_neighbors": 5,             // ±5-window smoothing on denominator
    "h_proxy": "tP / nSites per window from per-sample ANGSD pestPG"
  },
  "cohort_summary": {
    "n_samples": 226,
    "n_windows": null,                  // = sum(chroms[].n_windows)
    "h_gw_median": null,
    "ddi_median": null,
    "ddi_p25": null, "ddi_p75": null,
    "ddi_min": null, "ddi_max": null,
    "chi_min_median": null
  },
  "per_sample": [
    {
      "sample": "CGA009",
      "h_gw": 0.00470,                  // genome-wide H (matches S1.h)
      "ddi": null,                      // MAD(H_w) / median(H_w)
      "chi_min": null,                  // min_w [ H_w / cohort_median_smoothed(H_w) ]
      "chi_min_chr": null,
      "chi_min_pos": null,              // bp, window start
      "median_H_w": null,
      "mad_H_w": null
    }
  ],
  "windows": {
    "chroms": [                          // in concatenation order for the strip plot
      { "chr": "LG1", "n_windows": 480, "len_bp": 24000000 }
    ],
    "cohort_median_H_w": [],             // flat array, length = sum(n_windows)
    "cohort_q25_H_w":    [],
    "cohort_q75_H_w":    []
  },
  "per_sample_H_w": {
    "CGA009": []                         // length = sum(n_windows); null for filtered windows
  }
}
```

The page is data-driven from this schema. Once the upstream pipeline
populates this file in place, page9 renders without further atlas-side code
changes.

### Size note

At 50 kb windows on ~700 Mb callable × 226 samples, the
`per_sample_H_w` matrix is ≈ 3.2 M floats ≈ 25 MB as JSON. That is
borderline for an inline atlas-data fetch. Options to consider when the
real data arrives:

1. Ship `per_sample_H_w` as a sidecar parquet/arrow file loaded
   lazily on first sample-click rather than at page mount.
2. Quantize to 16-bit fixed-point and store as a base64 binary blob.
3. Split into per-chromosome JSON shards.

Round 2 codepath assumes option 0 (single JSON); revisit at populate time.

---

## Open questions (still open — DEFERRED to upstream pipeline session)

These come from §6 of the originating handoff document. Atlas-side code
adopts the recommended defaults so the page renders; the real decisions are
the pipeline's:

1. **Window size:** 50 kb primary (handoff recommendation). Sensitivity
   sweep at 10 / 100 / 500 kb belongs in the pipeline's supplementary run.
   `params.win_kb` is read by page9 from the loaded payload — page renders
   any window size.
2. **Min callable threshold:** 30% of nominal window (15 kb at WIN=50 kb).
   `params.min_callable_per_window` is metadata only; pipeline does the
   filtering.
3. **MAD constant:** 1.4826 (Gaussian-consistent). For non-Gaussian H_w
   distributions, raw MAD (constant 1) is a valid alternative; page9
   does not assume which one — it just displays the computed DDI value.
4. **χ_min denominator:** per-window with ±5-neighbour smoothing. Encoded
   in `params.chi_min_neighbors`. Atlas does not recompute χ_min on the
   client — the pipeline emits it.
5. **Page numbering:** appended as page9 (last position). The kickoff rule
   defers renumbering to the complete end of migrations. The legacy
   diversity tab-bar order is preserved.

---

## Validation hooks (for whoever populates texture_metrics.json)

When the real payload lands, verify:

- Spearman ρ(DDI, n_het_inversions_per_sample) > 0 — mechanistic
  validation per §6.7 of the originating handoff. Requires the inversion
  atlas per-sample heterozygous-inversion count; not consumed here yet.
- Spearman ρ(DDI, F_ROH_genome) — expect mild negative or near-zero;
  strong negative would suggest DDI is just collapsing into "ROH burden".
- ρ(DDI, K-cluster assignment one-hots) — promote to the page4 ancestry
  rollup once confirmed (see deferred work above).

---

## Next session — recommended next moves

1. Populate `texture_metrics.json` upstream and drop it into
   `atlases/diversity/data/`.
2. After visual QC of page9 against real data, decide on cross-page
   integration into page1 + page4. (Both edits are small once the
   numbers exist.)
3. Add the manuscript-text snippets from §5 of the originating handoff to
   v20 draft — methods, results, discussion paragraphs ready to paste.
4. (Optional) Sensitivity sweep at 10 / 100 / 500 kb windows — supplementary
   only.

---

## Provenance

- Originating handoff: chat dated 2026-05-12 (in-session brief), referencing
  the per-chromosome H + DDI framework drafted 2026-05-11.
- Atlas this lives in: `diversity-atlas` repo, `atlases/diversity/`.
- Pipeline repo (where step 03/04 belong): `catfish-diversity-analysis`.
- Framework parent: F_ROH|H (round 1, MODULE_3 / autozygosity discussion v2,
  2026-04).
