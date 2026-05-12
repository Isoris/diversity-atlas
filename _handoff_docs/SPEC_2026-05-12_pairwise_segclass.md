# SPEC — Pairwise θπ in het-inversion vs collinear segments (cross-atlas request)

**Date:** 2026-05-12
**Originating atlas:** diversity-atlas (request raised; placement deferred)
**Target atlas:** **population-atlas** (per cross-atlas boundary)
**Target page:** new — proposed `pairwise_segclass` (stage: pairwise / structure)
**Reference figure:** Fig. S22, Massilani et al. (archaic-introgression paper) —
absolute divergence (D<sub>XY</sub>) between non-African population pairs
measured in Neanderthal vs Denisovan segments. The catfish analog
substitutes inversion-class segmentation for archaic-class segmentation.

This is a **spec only**, not an implementation. It is written so a
population-atlas session can pick the work up cold without re-deriving
the design.

---

## 1. Scientific premise

Genome-wide pairwise diversity (θπ between sample pairs, or D<sub>XY</sub>)
averages over genome segments that may have very different evolutionary
histories. In the catfish cohort the most informative segment partition is
**heterozygous large inversions vs collinear background**, because:

1. Inversions suppress recombination → haplotypes within an inversion
   accumulate divergence independently of the collinear background.
2. The cohort already has annotated large-inversion candidates
   (inversion-atlas pages 1–6).
3. Inversion polymorphism is one of two mechanistic hypotheses behind
   the "mosaic-rich" sample class identified by DDI (page9 of the
   Diversity Atlas, this session); the other is recent introgression.
4. The hatchery cohort lacks any archaic-hominid analog — there is no
   pre-defined "ancient introgressed" segment class to stratify on.

The plot answers: **which sample pairs sit above the identity line?**
Those pairs are "more divergent in the inversion segments than the
collinear background predicts" — strong candidates for inversion-
mediated haplotype divergence. If those pairs are enriched for cross-K-
cluster comparisons, that confirms inversions as drivers of the broodline
structure observed in the K=8 ancestry partition.

---

## 2. The plot

- **x-axis:** mean pairwise θπ between samples *i* and *j*, computed
  *only* over collinear (non-inversion) windows.
- **y-axis:** mean pairwise θπ between samples *i* and *j*, computed
  *only* over heterozygous-inversion windows
  (windows overlapping a large-inversion BED entry where at least one of
  *i*, *j* is heterozygous for that inversion).
- **Each dot:** one sample pair (226 choose 2 = 25,425 pairs).
- **Dot colour:**
  - light grey: within-K-cluster pair
  - **highlight (cluster-pair palette):** cross-K-cluster pair —
    label by the unordered (K_i, K_j) pair, e.g. "K1×K7"
- **Dashed reference:** y = x (identity). Optional secondary
  reference: ordinary-least-squares fit through within-cluster pairs.
- **Marginal rugs:** y-density and x-density on the axes (the original
  figure had no marginals but they help compare to the per-class
  distribution).
- **Hover:** sample_i, sample_j, K_i, K_j, n_windows_inv, n_windows_col,
  θπ_inv, θπ_col, ratio.

### Display modes (toggle)

1. **All pairs** (25k dots, alpha-blended)
2. **Cross-K only** (≈ 18k dots if K=8 clusters are roughly balanced)
3. **One cluster pair at a time** (dropdown picker, ≈ 200–800 dots)
4. **Cluster-pair means** (collapses to 28 cluster-pair points + error
   bars; analogous to the figure's per-population-pair point density)

---

## 3. Data shape (file the page consumes)

Single payload, planned at
`atlases/population/data/pairwise_segclass.json`:

```jsonc
{
  "params": {
    "win_kb": 50,
    "step_kb": 50,
    "min_callable_per_window": 15000,
    "inversion_set": "large_inv_v3_2026-04",
    "het_definition": "at least one sample of the pair is het for the inversion call",
    "h_proxy": "pairwise θπ_ij_w = 2 * p_i * p_j over called sites in window w"
  },
  "cohort_summary": {
    "n_samples": 226,
    "n_pairs": 25425,
    "n_pairs_cross_K": null,
    "n_windows_inv": null,
    "n_windows_col": null,
    "rho_inv_col": null,         // Spearman ρ across pairs
    "pct_above_identity": null,
    "pct_above_identity_cross_K": null
  },
  "pairs": [
    {
      "i": "CGA009", "j": "CGA010",
      "k_i": "K1",   "k_j": "K3",
      "theta_pi_inv": 1.42e-4,
      "theta_pi_col": 8.30e-5,
      "n_win_inv": 312,
      "n_win_col": 13380,
      "cross_k": true,
      "k_pair": "K1×K3"
    }
    // ... 25,425 entries
  ],
  "cluster_pair_summary": [
    {
      "k_pair": "K1×K7",
      "n_pairs": 412,
      "theta_pi_inv_mean": null, "theta_pi_inv_sd": null,
      "theta_pi_col_mean": null, "theta_pi_col_sd": null,
      "above_identity_pct": null
    }
    // 28 K-pair rows (K=8 choose 2 = 28)
  ]
}
```

### Size estimate

25,425 pairs × ~10 floats = ~250k numbers. JSON-encoded ~ 4–6 MB.
Comfortably embeddable; no need for parquet/binary.

If the K-only display mode is the primary view, the page can lazily load
`pairs[]` only when the user toggles to all-pairs mode — first load
streams just the `cluster_pair_summary[]` (28 rows).

---

## 4. Pipeline (where the data comes from)

Belongs in **`catfish-population-analysis`** (not diversity-analysis, not
inversion-popgen-toolkit). New step, proposed:

`phase_3_pairwise/05_pairwise_theta_segclass.sh`

Substrate inputs:

1. Per-sample, per-window pestPG (already produced by
   `catfish-diversity-analysis/phase_2_discovery/02_run_heterozygosity.sh`).
   Need to derive *pairwise* θπ_ij per window, not per-sample θπ.
2. Large-inversion BEDs from
   `inversion-atlas/atlases/inversion/data/large_inversions_v3.bed`
   (canonical name TBC; check the inversion-atlas data registry).
3. Per-sample inversion genotypes (0/1/2) from
   `inversion-atlas/atlases/inversion/data/inversion_genotypes.tsv`
   (canonical name TBC).
4. K=8 ancestry labels — already in Diversity Atlas D.S1.k8.

Compute:

```
for each sample pair (i, j):
  for each large inversion I:
    is_het_pair = (i_geno_I in {1} or j_geno_I in {1}) and (i ≠ j)
    if is_het_pair:
      contribute window-set of I to "inv" bucket
  remaining windows = "col" bucket
  θπ_ij_inv = mean over inv-bucket windows of 2 * (het_i + het_j)/2
              (or proper IBS-based estimator; ANGSD has a per-pair option)
  θπ_ij_col = same over col-bucket windows
```

Pipeline detail beyond this spec belongs in the analysis repo, not here.

---

## 5. Cross-atlas dependencies summary

| Input | Source repo / file | Status |
|---|---|---|
| per-sample windowed pestPG | catfish-diversity-analysis | exists |
| large-inversion BEDs | inversion-atlas | exists |
| per-sample inversion genotypes | inversion-atlas | exists |
| K=8 ancestry labels | population-atlas (canonical), diversity-atlas (D.S1 mirror) | exists |
| **pairwise θπ per segment class** | **NEW — catfish-population-analysis** | **does not exist** |

The pipeline product is what gates this page. Everything else is already
available.

---

## 6. Why this lives in the Population Atlas (not Diversity)

Per `0_READ_ME_FIRST.md` cohort boundary:

| Concern | Atlas |
|---|---|
| per-sample H, θπ, F_ROH, ROH, DDI, χ_min | Diversity |
| **pairwise between-sample metrics, kinship, structure** | **Population** |
| inversion calls, breakpoints, genotypes | Inversion |

Pairwise θπ is per-pair, not per-sample. It is structurally a Population
Atlas concern, mirroring the page-3 kinship matrix that already sits there.
The split is enforced even though the *mechanistic* motivation (inversion-
mediated divergence between mosaic-rich samples) emerges from the
Diversity Atlas's DDI metric on page 9.

Cross-link policy: Diversity Atlas page 9 (texture) sample-detail panel
should, when the population-atlas page exists, include a "see pairs with
this sample" link that deep-links into the population-atlas pairwise
scatter filtered to this sample's pairs. That is a future cross-atlas
registry decision, not a round-2 deliverable.

---

## 7. Round-1 (population-atlas) plan when ready

Predicates: (a) population-atlas has had its round-1 migration to the
atlas-core architecture (currently it is still a flat 63 KB scaffold per
`KICKOFF_population_atlas.md`); (b) the pairwise pipeline above has run
and emitted `pairwise_segclass.json`.

Then:

1. Create `atlases/population/pages/pairwise/pageN.{html,js}` (page number
   TBD by the population-atlas page list).
2. Register in `manifest.json`, `pages.registry.json`,
   `files.registry.json` (mirror what was done for diversity-atlas page9
   this round — `_handoff_docs/HANDOFF_2026-05-12_round2_texture_done.md`
   is the template).
3. Renderer: scatter plot reusing `atlases/population/shared/plots.js`
   (or, if population-atlas doesn't yet have a shared plots module,
   port `atlases/diversity/shared/plots.js` and `svg.js` over).
4. Display modes (per §2 above) as pill-toggle.
5. Test stub: load the empty-stub file and verify the page renders the
   "data pending" path; load a populated file and verify ≥1 dot draws.

Estimated effort: 2-3 hours once data exists. Without data, the
data-pending scaffold alone is ~1 hour.

---

## 8. What the diversity-atlas does in the meantime

This round (2026-05-12):

- ✅ Page 8 (roadmap) gains a "Cross-atlas requests" card pointing at
  this spec.
- ✅ Spec file in `_handoff_docs/SPEC_2026-05-12_pairwise_segclass.md`.

Nothing else in the diversity-atlas changes. The pairwise scatter does
not, and should not, appear inside the Diversity Atlas.

---

## 9. Open design questions for the population-atlas session

(Distinct from §6 questions in the diversity round-2 handoff; those were
about DDI/χ_min and are settled by atlas-side defaults until pipeline
emits them.)

1. **Estimator for pairwise θπ within a window:** simple per-site
   IBS-based 2pq estimator, or the ANGSD `-doPwTheta`-style maximum-
   likelihood pairwise SAF? IBS is faster; ML is more correct under low
   coverage.
2. **Inversion-segment definition:** the entire BED interval, or
   BED minus the breakpoint padding zone? The breakpoints themselves
   often carry mapping artifacts.
3. **Heterozygous-inversion threshold:** require pair to be (1, 0) or
   (0, 1), or also include (1, 1) pairs (both het, possibly in
   *trans* haplotypes that still separate inversion-internal lineages)?
   The biology argues for (1, 0)/(0, 1) only; the statistics may benefit
   from including (1, 1).
4. **Cluster-pair palette:** how to colour 28 K-pair categories
   distinctly? Reuse the K=8 ancestry palette and combine pairs via
   midpoint blending, or use a separate categorical 28-class palette?
5. **Pair-density rendering:** at 25k overlapping dots, switching from
   alpha-blended scatter to 2D hex-bin density (with cross-K pairs
   overlaid as individual dots) avoids the visual mush at the origin.

All of these are pipeline / rendering choices, not atlas-architecture
choices. Decide at population-atlas page-build time.

---

## 10. Provenance

- Reference figure: Fig. S22 (D<sub>XY</sub> in Neanderthal vs Denisova
  segments between non-African population pairs).
- Catfish-context analog proposed: 2026-05-12 (this session).
- Routing decision (Population Atlas vs Diversity Atlas):
  user-confirmed 2026-05-12.
- Originating chat session: continuation of the diversity-atlas round-2
  texture session (DDI / χ_min).
- Authors of upstream framework: Quentin Andres (cohort & inversion
  framework), Claude (atlas-side design).
- Status: **spec only**. No pipeline run. No atlas page.
