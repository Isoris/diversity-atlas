# diversity-atlas

Per-sample diversity lens for the 226-sample pure *C. gariepinus* hatchery cohort: per-sample heterozygosity, θπ tracks, ROH atlas, F_ROH framework, ancestry-Q stratification, and the inbreeding decomposition (recent vs ancient). Companion atlas to `inversion-atlas`, `population-atlas`, and `genome-atlas`; shares the `atlas-core` engine.

## Layout

```
atlases/diversity/               — atlas package (paired with atlas-core)
                                   ATLAS IS A VIEWER, NOT A STORE.
                                   Reads results from data/ but does not own them.
  manifest.json                  — atlas declaration: 11 pages, green accent
  pages/                         — page1 samples · page2 chromosomes · page3 hotspots ·
                                   page4 ancestry · page5 ROH · page6 pruning & QC ·
                                   page7 about · page8 roadmap ·
                                   page9 texture (DDI / χ_min) ·
                                   page10 functional burden (VESM / πN/πS / LOF / splice / MSA) ·
                                   page11 group divergence (FST / DXY / dA network)
  registries/data/               — pages / layers / slots / files / operations registries
                                   (files.registry.json points at the data/ paths below)
  shared/                        — data_loader · formatters · plots · svg · tables ·
                                   tooltip · palette · stratification
  css/diversity.css              — atlas-wide stylesheet (green accent)

data/                            — RESULTS (lives outside the atlas — see data/README.md)
  embedded_tables.json           — required bulk snapshot (~2.4 MB)
  texture_metrics.json           — optional, page 9
  functional_burden.json         — optional, page 10
  roh_gene_overlap.json          — optional, page 5 extension
  divergence_network.json        — optional, page 11
  msa/<variant_id>.svg           — optional, page 10 MSA panel

Diversity_atlas.html             — legacy 2.5 MB single-file (kept as carve source-of-truth)
KICKOFF_diversity_atlas.md       — round-0 kickoff doc (page audit, open questions)
_handoff_docs/                   — round-N handoffs + spec docs for unbuilt pipeline products
                                   DATA_PROVENANCE.md — for-each-value upstream source map
0_READ_ME_FIRST.md               — overview of the four-atlas migration
```

## Build

```sh
# in atlas-core/
bash build/assemble.sh
cd ../atlas-workspace/
bash start.sh
# then open http://localhost:8000/#/diversity/page1
```

`atlas-core/build/atlas.config` already lists this atlas as `atlas_diversity = ../../diversity-atlas`.

## Cohort discipline

The Diversity Atlas describes the **226-sample pure *C. gariepinus* hatchery cohort** — same cohort as the Inversion Atlas and Population Atlas. NOT the F₁ hybrid (Genome Atlas only).

## Cross-atlas boundary

Per chat 6144abe7:
- per-sample H / θπ / F_ROH / ROH BEDs → **Diversity Atlas**
- cohort-level PCA / K / kinship matrix / unrelated subset → **Population Atlas**
- Diversity Atlas **consumes ancestry labels** from the Population Atlas's canonical K assignment to stratify per-sample metrics.
