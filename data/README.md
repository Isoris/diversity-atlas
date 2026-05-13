# data/

Results live here. **The atlas does not store; it explores.**

This directory holds the JSON payloads (and assets) that the diversity
atlas reads from. The atlas package at `atlases/diversity/` is a
**viewer** — it fetches from this folder, renders, exports — but does
not own the data.

> ## Architectural rule (user direction, 2026-05-12)
>
> The atlas is built to **get** results, **request actions** that
> produce results, and **export** what it sees — but **never store**.
> Anything that looks like canonical data lives in `data/` (this
> folder), not inside the atlas package.
>
> Move them again any time. The atlas just needs to know the
> URL paths — see `atlases/diversity/shared/data_loader.js` and
> `atlases/diversity/registries/data/files.registry.json` for the
> two places where paths are declared.

## Current contents

| File | Page that reads it | Status |
|---|---|---|
| `embedded_tables.json` | pages 1–7 (everything legacy) | populated (~2.4 MB, carved from `Diversity_atlas.html` v2.4) |
| `texture_metrics.json` | page 9 (texture: DDI / χ_min) | empty stub |
| `functional_burden.json` | page 10 (functional burden) | empty stub |
| `roh_gene_overlap.json` | page 5 (ROH × gene-model extension) | empty stub |
| `divergence_network.json` | page 11 (group divergence) | empty stub |
| `msa/<variant_id>.svg` | page 10 (MSA panel) | not produced yet |

Empty stubs render "data pending" fallbacks in their pages without
errors. As soon as a real payload lands at the expected path, the
page lights up — no atlas-side changes needed.

## Where do these come from?

See `_handoff_docs/DATA_PROVENANCE.md` for the full per-value upstream
map. Quick summary:

- `embedded_tables.json` ← carved from `Diversity_atlas.html` v2.4,
  which was itself prepared from **Table 3 of the manuscript** plus
  supplementary tables. Long-term, should be replaced by per-table
  exports from `catfish-diversity-analysis` `09_final_tables/`.
- The four optional payloads ← upstream pipeline products that don't
  exist yet. Each has a SPEC in `_handoff_docs/SPEC_2026-05-12_*.md`
  describing the schema and the pipeline step that should produce it.
- `msa/*.svg` ← per-variant alignments rendered by
  [pyMSAviz](https://github.com/moshi4/pyMSAviz) for the
  top-burden variants flagged by `functional_burden.json`.

## Long-term

The right long-term design (flagged in `DATA_PROVENANCE.md` §2.4 and
§6) is for the atlas to fetch directly from canonical pipeline
output paths in `catfish-diversity-analysis` / `genome-atlas`,
possibly via HTTP from a separate static-host or a content-addressed
store. The atlas would then have no local `data/` at all — it just
points its `data_loader.js` URLs at the canonical store.

This folder is the **intermediate step** that gets the JSON out of
the atlas package. The next step is to put it somewhere else
entirely (separate repo, S3 bucket, whatever) and update
`data_loader.js` + `files.registry.json` accordingly.

## What about `Diversity_atlas.html`?

Still at the repo root. Kept as the legacy carve source-of-truth
until the per-table export path replaces it. Do not edit by hand.
