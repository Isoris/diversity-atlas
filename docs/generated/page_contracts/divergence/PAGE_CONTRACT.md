# divergence — group-divergence network — Page Capability Contract

**Atlas**: diversity · **Stage**: stratified · **Status**: scaffold spec (round 3; data pending)

## Purpose

Pairwise divergence between groups in the cohort, rendered as a
node-link plot. Nodes = K=8 ancestry groups by default (alternative
groupings: per-farm / sex / karyotype). Edges = pairwise F_ST / D_XY /
d_A; edge thickness ∝ divergence.

## Architecture

Mode A backbone (`D.S1`, `D.S9`) for group membership + optional payload
`divergence_network.json` for the pairwise statistic matrix. Detector
function on mount: `hasNetwork()` → "data pending" card otherwise.

Two layouts:
- **Circular** (default) — groups on a circle, edges as chords.
- **Force-directed** (toggle) — d3-style force simulation.

## Capabilities

- Render circular layout.
- Toggle force-directed layout.
- Toggle edge metric (F_ST / D_XY / d_A).
- Edge filter via caret menu (Show all / Top-N / Significant only).
- Alternative groupings (farm / sex / karyotype).
- Hover edge → group_a · group_b · statistic + bootstrap p tooltip.

## Required data

- **Registry says**: `requires_layers: []`, `requires_slots: []`
- **Actually consumed (Mode A)**: `D.S1`, `D.S9`
- **Optional (round-3)**: `ctx.DIVERGENCE_NETWORK` payload
  ([`divergence_network_payload`](../../../../atlases/diversity/registries/data/layers.registry.json))

## User interactions

- Layout toggle.
- Edge-metric toggle.
- Caret menu filter.
- Alternative-grouping selector.

## Outputs

Preview only.

## Connected analyses / adapters

- **Optional payload IN**: `data/divergence_network.json` (currently
  stub).
- **Upstream pipeline (proposed)**:
  `catfish-diversity-analysis/phase_3_pairwise/02_group_divergence.sh`
  (realSFS + bootstrap).
- **Schema**:
  [`divergence_network_v1.schema.json`](../../../../atlases/diversity/registries/schemas/divergence_network_v1.schema.json).

## Status and known issues

- **Round-3 spec only** — page renders "data pending" until upstream
  pipeline lands.
- **F_ST estimator choice (Weir & Cockerham / Hudson / Reynolds) is
  pipeline-side** — atlas reads whichever number ships.
- **Cross-atlas pointer**: per-pairwise θπ in het-inversion vs
  collinear segments is routed to the `population-atlas` (see §10 of
  layers.registry.json) — NOT registered here.

## Documents

- **Registry doc**: [pages.registry.json](../../../../atlases/diversity/registries/data/pages.registry.json) → `pages.divergence`
- **Per-page README**: [pages/stratified/README.md](../../../../atlases/diversity/pages/stratified/README.md)
- **Spec**: `_handoff_docs/SPEC_2026-05-12_divergence_network.md`

**Confidence**: medium (page wired, data pending)
