# texture — DDI + χ_min within-genome dispersion — Page Capability Contract

**Atlas**: diversity · **Stage**: per_sample · **Status**: scaffold spec (round 2; data pending)

## Purpose

Per-sample texture metrics complementing `roh`:
- **DDI** — Diversity Distribution Index — within-genome dispersion of
  per-window H.
- **χ_min** — cohort-relative diversity floor — how low a sample's
  diversity floor is relative to the cohort median.

Companion to the F_ROH | H framework on `roh`. Round-2 spec ships;
upstream pipeline (`STEP_A06_window_H_and_DDI.sh`) not yet written.

## Architecture

Mode A snapshot for the per-sample backbone (`D.S1`, `D.S9`) + Mode B
optional payload (`texture_metrics.json`) for the per-window H strips
that drive DDI / χ_min. Renders a "data pending" card when the texture
payload is empty.

Detector function on page mount: `hasTexture()` → check non-empty;
fall through to placeholder otherwise.

## Capabilities

- Per-sample DDI × H scatter (one dot per sample).
- Per-window H strip per sample (χ_min marker).
- Stratification pill (K=8 / family / F_ROH-quartile).

## Required data

- **Registry says**: `requires_layers: []`, `requires_slots: []`
- **Actually consumed (Mode A)**: `D.S1`, `D.S9`
- **Optional (round-2)**: `ctx.WIN_METRICS` payload
  ([`texture_metrics_payload`](../../../../atlases/diversity/registries/data/layers.registry.json))

## User interactions

- Stratification pill.
- Sample click → per-window strip in drawer.

## Outputs

Preview only.

## Connected analyses / adapters

- **Optional payload IN**: file at `data/texture_metrics.json`
  (currently stub).
- **Upstream pipeline (proposed)**:
  `catfish-diversity-analysis/04_window_diversity_texture/STEP_A06_window_H_and_DDI.sh`.
- **Schema**:
  [`texture_metrics_v1.schema.json`](../../../../atlases/diversity/registries/schemas/texture_metrics_v1.schema.json).

## Status and known issues

- **Round-2 spec only** — page renders "data pending" until upstream
  pipeline lands.
- **Payload size estimate** ≈ 25 MB at 50 kb windows × 226 samples;
  may need parquet/binary encoding when it grows.

## Documents

- **Registry doc**: [pages.registry.json](../../../../atlases/diversity/registries/data/pages.registry.json) → `pages.texture`
- **Per-page README**: [pages/per_sample/README.md](../../../../atlases/diversity/pages/per_sample/README.md)
- **Spec**: `_handoff_docs/SPEC_2026-05-12_*.md` (data_loader.js header)

**Confidence**: medium (page wired, data pending)
