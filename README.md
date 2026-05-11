# diversity-atlas

Per-sample diversity lens for the 226-sample pure *C. gariepinus* hatchery cohort: per-sample heterozygosity, θπ tracks, ROH atlas, F_ROH framework, ancestry-Q stratification, and the inbreeding decomposition (recent vs ancient). Companion atlas to `inversion-atlas`, `population-atlas`, and `genome-atlas`; shares the `atlas-core` engine.

## Layout

```
atlases/diversity/               — atlas package (paired with atlas-core)
  manifest.json                  — atlas declaration: 8 pages, green accent
  pages/                         — page1 samples · page2 chromosomes · page3 hotspots ·
                                   page4 ancestry · page5 ROH · page6 pruning & QC ·
                                   page7 about · page8 roadmap
  registries/data/               — pages / layers / slots / files / operations registries
  css/diversity.css              — atlas-wide stylesheet (green accent)

Diversity_atlas.html             — legacy 2.5 MB single-file (kept as carve source-of-truth)
KICKOFF_diversity_atlas.md       — round-0 kickoff doc (page audit, open questions)
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
