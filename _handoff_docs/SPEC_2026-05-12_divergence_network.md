# SPEC — Pairwise group-divergence network (diversity-atlas, stratified)

**Date:** 2026-05-12
**Target atlas:** **diversity-atlas** (per user direction 2026-05-12)
**Target page:** new — `atlases/diversity/pages/stratified/pageN.{html,js}`
(page number TBD at build time; alongside the existing `page4.html` K=8
cluster boxes)
**Status:** spec only. No pipeline. No page code.
**Reference figure:** user-provided 2026-05-12 — six coloured circles
(G1–G6) connected by dashed edges; numbers inside circles are
within-group π (≈ 1.19 × 10⁻³), numbers on edges are pairwise
divergence (FST / D<sub>XY</sub> / genetic distance).
**Sibling-atlas note:** the inversion-atlas should receive an
*overlay* version of the same plot (nodes = STD/HET/INV karyotype
classes, edges = same statistics restricted to inversion intervals).
That is **out of scope** for this spec per user 2026-05-12 ("do this
one but for the diversity one not for the inversion one"); record only.

---

## 1. What the plot answers

> *How different is each genetic group from every other genetic group, in
> the same single view that also shows within-group diversity?*

A diversity-atlas-native answer to that question consolidates four
statistics into one node-link diagram:

| Channel | Statistic | Per |
|---|---|---|
| Node colour | group identity | group |
| Node label (inside) | π or H̄ (within-group nucleotide diversity / heterozygosity) | group |
| Node radius | sample count *n* in group (sqrt-scaled) | group |
| Edge | F<sub>ST</sub> or D<sub>XY</sub> or d<sub>A</sub> | group pair |
| Edge thickness | divergence magnitude (linear) | group pair |
| Edge opacity / dash | significance / bootstrap support (optional) | group pair |

Per user framing: this is *diversity*, not *structure*. PCA and
ADMIXTURE already live (or will live) in the population-atlas; the
divergence network restates their result with summary statistics so the
diversity-atlas can answer "how much do groups differ?" without a
cross-atlas hop.

---

## 2. Cross-atlas boundary

User-confirmed boundary (2026-05-12):

| Atlas | Owns |
|---|---|
| **Population Atlas** | PCA, ADMIXTURE / NGSadmix, clade definitions, sample-to-group assignment, ancestry proportions |
| **Diversity Atlas** | π, H, F<sub>ST</sub>, D<sub>XY</sub>, d<sub>A</sub>, ROH, **pairwise group divergence network** |
| **Inversion Atlas** (overlay) | same statistics restricted to candidate inversion intervals; STD/HET/INV comparisons |

The diversity-atlas reads K-cluster labels from the population-atlas's
canonical assignment file (currently mirrored in D.S1.k8 — that mirror
becomes a thin reference once population-atlas round-1 lands).

This stays cleanly inside the diversity-atlas. Unlike the
pairwise-θπ-in-segments spec (which was routed to population-atlas
because the segmentation question is structurally pairwise-sample),
group-level π/F<sub>ST</sub>/D<sub>XY</sub> are diversity statistics
collapsed across samples within a group — first-class diversity-atlas
output.

---

## 3. Plot — nodes, edges, layout

### Nodes

- **One per group.** Default grouping = K=8 ancestry clusters from
  D.S1.k8.
- **Alternative node-grouping modes** (toggle):
  1. K=8 ancestry clusters (default)
  2. Farm / collection-site
  3. Sex / cohort year (if metadata permits)
  4. Karyotype class for a chosen large inversion
     (STD-hom / HET / INV-hom) — overlap with inversion-atlas; this
     mode is the bridge to the inversion-atlas overlay version
- **Colour** — the existing K=8 palette for mode 1; categorical
  palette for others.
- **Radius** — `r = r_min + k * sqrt(n_samples)`. Keeps small groups
  visible.
- **Inner text** — primary within-group statistic. Toggle:
  - π_within (default; nucleotide diversity)
  - H̄ (mean per-sample heterozygosity)
  - F̄_ROH (mean genome-wide F_ROH within the group)
  - Watterson θ_W
- **Hover** — group ID, *n* samples, all four within-group statistics
  plus their 95% CI bootstrap interval.

### Edges

- **Edge set** — fully connected: every group pair. With K=8 that is
  28 edges. With per-farm grouping the edge count can balloon; cap at
  top-N strongest edges or threshold by significance.
- **Primary edge statistic** — toggle:
  - F<sub>ST</sub> (default) — Reynolds, Hudson, or Weir-&-Cockerham
    estimator (note in `params`)
  - D<sub>XY</sub> (absolute divergence)
  - d<sub>A</sub> = D<sub>XY</sub> − (π₁ + π₂)/2 (net divergence)
  - Genetic distance (e.g. Nei's standard distance)
- **Thickness** — linear in statistic value, clamped at [t_min, t_max].
- **Style** — dashed (matches reference figure) or solid; user
  preference toggle.
- **Edge label** — numeric value of the chosen statistic, fixed at
  three significant figures.
- **Hover** — both group IDs, all four edge statistics, bootstrap CI.

### Layout

- **Default** — force-directed (D3-style or Fruchterman-Reingold). Edge
  length ∝ 1 / divergence: more-different groups push apart. Reads as
  a "map" of group relationships.
- **Alternative** — fixed circular layout (evenly spaced around a
  circle, edges drawn as chords). Cleaner read of edge weights but
  loses the spatial "distance" intuition.
- **Alternative** — anchored layout where node *x* = PC1, node *y* = PC2
  from the population-atlas PCA. Spatially aligns the divergence
  network with the structure picture. Requires reading the PCA
  coordinates from population-atlas — keep this as a stretch goal.

Layout choice: pill-toggle.

---

## 4. Data shape

Single payload, planned at
`atlases/diversity/data/divergence_network.json`:

```jsonc
{
  "params": {
    "grouping": "K=8",                  // one of: "K=8" | "farm" | "sex" | "karyotype:INV_LG07_v3"
    "fst_estimator": "Weir-Cockerham",  // or "Reynolds" | "Hudson"
    "n_bootstrap": 1000,
    "min_callable_sites_per_group_pair": 200000
  },
  "groups": [
    {
      "id": "K1",
      "n_samples": 31,
      "pi_within": 1.19e-3,
      "pi_within_ci95": [1.05e-3, 1.32e-3],
      "h_mean": 1.17e-3,
      "f_roh_mean": 0.082,
      "theta_w": 1.30e-3,
      "colour": "#4d8be0"   // mirrors K=8 palette
    }
    // ... 8 entries for K=8
  ],
  "edges": [
    {
      "i": "K1", "j": "K2",
      "fst": 0.041,    "fst_ci95":  [0.035, 0.048],
      "dxy": 1.32e-3,  "dxy_ci95":  [1.28e-3, 1.36e-3],
      "da":  1.45e-4,  "da_ci95":   [1.10e-4, 1.80e-4],
      "nei_d": 0.025
    }
    // ... C(8, 2) = 28 entries for K=8
  ],
  "alternative_groupings": {
    // optional secondary payloads keyed by grouping mode,
    // each with its own groups[] + edges[]
    "farm":         { "groups": [...], "edges": [...] },
    "karyotype:INV_LG07_v3": { "groups": [...], "edges": [...] }
  }
}
```

Size estimate: tiny. K=8 grouping = 8 nodes + 28 edges, all numeric.
Per-farm at ~12 farms = 12 nodes + 66 edges. Still under 50 KB
including bootstrap CIs and alternative groupings. Embed directly.

---

## 5. Pipeline (where the data comes from)

Belongs in **`catfish-diversity-analysis`**. Proposed step:

`phase_3_pairwise/02_group_divergence.sh`

(Sibling of the pairwise-θπ-in-segments step that was routed to
`catfish-population-analysis`.)

Substrate inputs:

1. Per-sample SAFs (already produced by phase-2 pipeline).
2. Group labels — K=8 from D.S1.k8 (also farm / sex / karyotype as
   alternative-grouping inputs).
3. Genome callability mask.

Compute per grouping mode:

```
for each group g:
  realSFS  per-group SFS → π, θ_W, H̄
  bootstrap 1000× over block-jackknife of windows for CIs

for each group pair (g1, g2):
  realSFS -fold 0 of joint SFS → FST (W&C), Dxy
  da = dxy - (pi_1 + pi_2) / 2
  bootstrap CIs
```

Pipeline detail beyond this spec is up to the analysis repo.

---

## 6. Atlas-side work when data lands

Mirrors the page9 (texture) round-2 pattern:

1. New page `atlases/diversity/pages/stratified/pageN.{html,js}`
   (number TBD; existing stratified page is `page4` for K=8 cluster
   boxes — this new page sits beside it).
2. Extend `atlases/diversity/data/data_loader.js` with a
   `DIVERGENCE_NETWORK` slot, graceful no-data fallback.
3. Register in `manifest.json`, `pages.registry.json`,
   `files.registry.json` (template:
   `_handoff_docs/HANDOFF_2026-05-12_round2_texture_done.md`).
4. Renderer: node-link layout in
   `atlases/diversity/shared/svg.js` (force-directed; D3 is already
   imported per existing pages — check before adding a dep). Reuse
   the K=8 colour scale from `shared/palette.js`.
5. Controls (pill-toggles):
   - Grouping mode (K=8 / farm / sex / karyotype)
   - Edge statistic (F<sub>ST</sub> / D<sub>XY</sub> / d<sub>A</sub> /
     Nei)
   - Node label statistic (π / H̄ / F_ROH / θ_W)
   - Layout (force-directed / circular / PCA-anchored)
6. Cross-link policy: page9 texture sample-detail panel may eventually
   deep-link a sample into the divergence-network page in the
   karyotype-grouping mode for that sample's inversion calls. Defer.

Estimated effort: 4–5 hours once data exists. Force-directed layout is
the largest single chunk; if D3 is not already loaded, ~1 hour added
for the dep.

---

## 7. Inversion-atlas sibling (out of scope, recorded only)

Per user 2026-05-12, the inversion-atlas should receive an overlay
version of the same plot:

- Nodes = STD-hom / HET / INV-hom for one selected large inversion.
- Edges = FST / Dxy restricted to that inversion's genomic interval.
- Companion view to inversion-atlas pages that show inversion-PCA
  separation. Restates the PCA separation as a divergence number —
  *"this inversion arrangement is not a PCA artefact, it has measurable
  F<sub>ST</sub> = 0.X from the standard arrangement"*.

That spec is **not** part of this document. When the inversion-atlas
session takes it up, the data slot can be a sibling of
`divergence_network.json` keyed by inversion ID, or reuse the
`alternative_groupings.karyotype:*` payload from §4 above. Up to that
session.

---

## 8. Open design questions (all decided at build time)

1. **F<sub>ST</sub> estimator** — Weir & Cockerham (most common, mild
   bias for small samples) vs Hudson (preferred for low-coverage
   ANGSD pipelines) vs Reynolds. Pipeline-side decision; the page just
   renders the number it's handed.
2. **Edge thresholding** — at per-farm grouping the edge count can
   pass 60. Cap at top-N by magnitude, or threshold by significance
   (e.g. only show edges where F<sub>ST</sub> CI excludes 0)?
3. **Node label readability vs node size** — at low *n* a small node
   can't contain the π label. Show label on hover only? Or always but
   offset outside the node?
4. **Force-directed vs circular default** — force-directed gives
   distance intuition but the layout is non-deterministic. Circular
   is reproducible. Default to circular and let the user switch to
   force?
5. **CI display** — render edge CIs as a ±range under the edge label?
   That adds ink to an already-busy diagram. Hover-only?

None of these block the spec; all are page-build decisions.

---

## 9. Provenance

- Reference figure: user-provided 2026-05-12, six-node group-divergence
  network panel.
- Routing decision (diversity-atlas, not inversion-atlas): user,
  2026-05-12 ("do this one but for the diversity one not for the
  inversion one").
- Cross-atlas boundary refined: user, 2026-05-12 (Population Atlas =
  structure; Diversity Atlas = π/F<sub>ST</sub>/D<sub>XY</sub>/ROH +
  group-divergence network; Inversion Atlas overlay = same stats inside
  inversion intervals).
- Inversion-atlas sibling: recorded, out of scope.
- Authors: upstream framework — Quentin Andres; atlas-side design —
  Claude.
- Status: **spec only.** No pipeline. No page code.
