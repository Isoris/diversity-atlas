# roadmap — what's shipped vs planned — Page Capability Contract

**Atlas**: diversity · **Stage**: meta · **Status**: active (static)

## Purpose

Static narrative of what's shipped in the diversity atlas versus
what's still planned but not yet built. Companion to `about` (which
documents methods) — `roadmap` documents the work plan.

## Architecture

Pure static HTML fragment. No data reads. No future renderer planned.

## Capabilities

- Render the roadmap narrative.
- Section headings act as anchor links.

## Required data

- **Registry says**: `requires_layers: []`, `requires_slots: []`
- **Actually consumed**: none

## User interactions

- Anchor-link navigation.

## Outputs

None.

## Connected analyses / adapters

- None.

## Status and known issues

- None. Static content; edits go in the HTML fragment.

## Documents

- **Registry doc**: [pages.registry.json](../../../../atlases/diversity/registries/data/pages.registry.json) → `pages.roadmap`
- **Per-page README**: [pages/meta/README.md](../../../../atlases/diversity/pages/meta/README.md)

**Confidence**: high
