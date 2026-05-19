# `pages/functional/` — Diversity Atlas functional stage

Functional burden / selection efficacy. The only page in this stage is
round-3 territory; data ships from the (proposed)
`catfish-diversity-analysis/11_functional_burden/` pipeline.

## What each page does

| page | manifest stage | label | summary |
|------|----------------|-------|---------|
| `burden` | functional | burden | five co-located layers (VESM, πN/πS, π0/π4, LOF, ROH-overlap) + variant inventory + transcript view + MSA panel |

## Vocabulary contracts

### Impact class (per snpEff, black-grouse Nature 2024 Fig 2c style)

Locked four-value enum on the variant inventory:

| value      | typical effects |
|------------|-----------------|
| `HIGH`     | frameshift, stop_gained, splice_acceptor/donor, start_lost |
| `MODERATE` | missense, inframe indel, splice_region |
| `LOW`      | synonymous, intron, 5′/3′ UTR |
| `MODIFIER` | intergenic, downstream, upstream |

### Stratification dimensions

`burden` shares the stratification pill with `roh`:

| value | meaning |
|-------|---------|
| `K=8`           | NGSadmix locked K=8 groups |
| `family`        | hatchery family id |
| `sample`        | one row per sample (no grouping) |
| `F_ROH-quartile`| F_ROH-binned samples (Q1..Q4) |

### VESM threshold

Default deleterious cutoff: VESM ≥ 0.5. User-configurable (persisted to
localStorage). The five-layer grid recomputes counts on change without
refetching.

### MSA asset path

`data/msa/<variant_id>.svg` where `variant_id` is the canonical
`chr:pos:ref:alt` form with underscored separators
(e.g. `chr07_12345678_A_G.svg`). Cross-referenced via
`functional_burden_payload.msa_links[variant_id]`.

## Cross-page dependencies

- **burden** shares the stratification pill with **roh** — single
  source of truth in
  [`shared/stratification.js`](../../shared/stratification.js).
- **Cross-atlas dep**: gene model + CDS FASTA come from
  `genome-atlas` (needed for the πN/πS + π0/π4 calculations upstream).
  Bidirectional handshake — atlas reads the resulting payload, doesn't
  re-derive.

## Round status

`burden` is **round 3 scaffold** — page wired, renderer in place,
detector functions `hasBurden() / hasTranscripts() / hasMSA()` return
false today (stub payload on disk). Renders "data pending" cards.

## IN / OUT adapters

| layer | runner | extractor | schema |
|-------|--------|-----------|--------|
| `functional_burden_payload` (optional, atlas-relative) | [`harvest_file`](../../registries/runners/harvest_file.py) | (file-content schema only) | [`functional_burden_v1`](../../registries/schemas/functional_burden_v1.schema.json) |
| `msa_svg` (cold, per-variant) | `harvest_file` | (binary passthrough) | (none — SVG) |

## SPECs relevant to functional

- `_handoff_docs/SPEC_2026-05-12_functional_burden.md` (full spec —
  five layers, variant inventory, transcript view, MSA panel)

## Per-page contracts

[`docs/generated/page_contracts/burden/PAGE_CONTRACT.md`](../../../../docs/generated/page_contracts/burden/PAGE_CONTRACT.md)

## Notes for new contributors

- **Round-3 spec only** — page renders "data pending" until the
  upstream `11_functional_burden/` pipeline ships.
- **GERP panel off by default** — no upstream conservation track yet.
  Toggle is in the panel header but disabled.
- **MSA assets are cold-tier**: fetched on demand per variant; missing
  variant → "MSA not available" fallback.
- **πN/πS + π0/π4 need a gene model** — cross-atlas dep on
  `genome-atlas`. Don't enable production builds before both atlases
  are live together.
