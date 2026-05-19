# `pages/meta/` — Diversity Atlas meta stage

Atlas-level documentation: methods, glossary, headline numbers, data
lineage, roadmap.

## What each page does

| page | manifest stage | label | summary |
|------|----------------|-------|---------|
| `about`   | meta | about   | headline numbers + MODULE_3 methods (SD1-SD8) + coverage map + real-data/placeholder card grid |
| `roadmap` | meta | roadmap | static narrative of what's shipped vs planned |

## Vocabulary contracts

### Card status (per `about`)

| value | meaning |
|-------|---------|
| `real_data`    | card backed by a non-stub table in the snapshot |
| `placeholder`  | card present in the UI but data layer not yet shipped |
| `pending`      | data layer in flight (cluster-side run scheduled) |

The status is read off `*_meta` keys in the snapshot (`D.S4b_meta`,
`D.ST4_meta`, `D.ST5_meta`, `D.REF_meta`).

## Cross-page dependencies

- None. Both pages are documentation.

## Round status

| page | round | status |
|------|-------|--------|
| `about`   | round 1 | active (final shape; content edits ongoing) |
| `roadmap` | round 1 | active (static) |

## IN / OUT adapters

- None. Meta pages don't pull through `harvest_file`; they consume
  snapshot content only.

## SPECs relevant to meta

- None — content lives in the page fragments.

## Per-page contracts

- [`docs/generated/page_contracts/about/PAGE_CONTRACT.md`](../../../../docs/generated/page_contracts/about/PAGE_CONTRACT.md)
- [`docs/generated/page_contracts/roadmap/PAGE_CONTRACT.md`](../../../../docs/generated/page_contracts/roadmap/PAGE_CONTRACT.md)

## Notes for new contributors

- **`about` is the methods page** — when a methods card changes
  upstream, update `SD1..SD8` in the snapshot. Don't add data fetches
  here.
- **`roadmap` is pure static HTML** — edits go in the fragment, not in
  code.
