# about — headline numbers + methods + data lineage — Page Capability Contract

**Atlas**: diversity · **Stage**: meta · **Status**: active (final shape)

## Purpose

Cohort-level methods page: headline numbers, MODULE_3 methods
(SD1-SD8), coverage map, glossary, data lineage (where each table on
the atlas came from).

Doubles as the "what's shipped vs what's placeholder" inventory via
S4b / ST4 / ST5 / REF cards.

## Architecture

Mostly static fragment with a handful of dynamic reads from the Mode A
snapshot. No future Mode B promotion planned — this is methods/docs
content, not data.

## Capabilities

- Headline numbers (n samples, n SNPs, mean coverage, median H, …)
- MODULE_3 methods cards (SD1..SD8).
- Coverage map.
- Glossary.
- Real-data / placeholder card grid (S4b, ST4, ST5, REF).

## Required data

- **Registry says**: `requires_layers: []`, `requires_slots: []`
- **Actually consumed (Mode A)**: `D.globals`, `D.SD1..D.SD8`,
  `D.S4b`, `D.S4b_meta`, `D.ST4_meta`, `D.ST5`, `D.ST5_meta`, `D.REF`,
  `D.REF_meta`

## User interactions

- Glossary search.
- Card click → expand methods detail.

## Outputs

None.

## Connected analyses / adapters

- None. Documentation page.

## Status and known issues

- Final shape. Future edits are content-only.

## Documents

- **Registry doc**: [pages.registry.json](../../../../atlases/diversity/registries/data/pages.registry.json) → `pages.about`
- **Per-page README**: [pages/meta/README.md](../../../../atlases/diversity/pages/meta/README.md)

**Confidence**: high
