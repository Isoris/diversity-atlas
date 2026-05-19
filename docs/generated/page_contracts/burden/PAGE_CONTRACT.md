# burden — functional burden / selection efficacy — Page Capability Contract

**Atlas**: diversity · **Stage**: functional · **Status**: scaffold spec (round 3; data pending)

## Purpose

Five co-located functional-burden / selection-efficacy layers per
sample:

1. **VESM deleterious burden** — count of variants with VESM ≥ threshold.
2. **πN / πS** — nonsynonymous vs synonymous diversity.
3. **π0 / π4** — zerofold vs fourfold diversity (a.k.a. πN/πS proxy).
4. **LOF count** — loss-of-function variant count per sample.
5. **ROH-overlap fraction** — fraction of LOF / VESM-high variants that
   sit inside an ROH on the same sample.

Plus:
- Variant inventory by snpEff impact class (black-grouse Nature 2024
  Fig 2c style).
- Transcript view (per-variant expanded card).
- Multiple-sequence-alignment (MSA) panel via pre-rendered SVGs.
- GERP panel (off by default — no upstream track yet).

## Architecture

Mode A backbone (`D.S1`, `D.S9`) + optional payload
`functional_burden.json` for the five layers + per-variant `msa_svg`
SVG assets fetched on demand. Stratified via shared pill toggle
(K=8 / family / sample / F_ROH-quartile).

Detector functions on mount: `hasBurden()` / `hasTranscripts()` /
`hasMSA()` — each renders a "data pending" card when its slice is
absent.

## Capabilities

- Render five-layer burden grid.
- Variant inventory table (snpEff impact class color-coded).
- Transcript drill-down.
- MSA panel (per-variant SVG).
- Stratification pill.
- GERP toggle (currently off).

## Required data

- **Registry says**: `requires_layers: []`, `requires_slots: []`
- **Actually consumed (Mode A)**: `D.S1`, `D.S9`
- **Optional (round-3)**: `ctx.FUNCTIONAL_BURDEN` payload
  ([`functional_burden_payload`](../../../../atlases/diversity/registries/data/layers.registry.json)),
  per-variant `msa_svg` files
- **Cross-atlas dep**: gene model + CDS FASTA from `genome-atlas`
  (required for the πN/πS + π0/π4 calculations upstream)

## User interactions

- Stratification pill.
- Variant row click → transcript drawer.
- Transcript card "view MSA" button → MSA panel.
- GERP toggle.

## Outputs

Preview only.

## Connected analyses / adapters

- **Optional payload IN**: `data/functional_burden.json` (currently
  stub).
- **MSA asset IN**: `data/msa/<variant_id>.svg`
  (`registry.resolve('msa_svg', { variant_id })`).
- **Upstream pipeline (proposed)**:
  `catfish-diversity-analysis/11_functional_burden/` (bcftools csq +
  snpEff + VESM + custom splice).
- **Schemas**:
  [`functional_burden_v1.schema.json`](../../../../atlases/diversity/registries/schemas/functional_burden_v1.schema.json).

## Status and known issues

- **Round-3 spec only** — page renders "data pending" until upstream
  pipeline lands.
- **Cross-atlas dep on `genome-atlas`** for gene model / CDS — wire
  must wait for both atlases to be online together.
- **GERP track absent** — panel toggle disabled until cluster-side
  GERP ≥ 4 conservation track ships.

## Documents

- **Registry doc**: [pages.registry.json](../../../../atlases/diversity/registries/data/pages.registry.json) → `pages.burden`
- **Per-page README**: [pages/functional/README.md](../../../../atlases/diversity/pages/functional/README.md)
- **Spec**: `_handoff_docs/SPEC_2026-05-12_functional_burden.md`

**Confidence**: medium (page wired, data pending)
