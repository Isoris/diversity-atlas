# SPEC — Functional Burden / Selection Efficacy (new diversity-atlas page)

**Date:** 2026-05-12
**Target atlas:** diversity-atlas (new page — "main home" for functional burden)
**Target page:** new `atlases/diversity/pages/<section>/pageN.{html,js}` —
  *Functional Burden / Selection Efficacy*. Section + page-number deferred (see §6.1).
**Companion overlay:** Inversion Atlas per-candidate consequence panel —
  small per-karyotype subset of the same layers (see §10). **Not** a new
  Inversion Atlas page; a panel inside the existing per-candidate view.
**Status:** spec only. No pipeline run. No new page code.

> ## ⚠ UNFINISHED — decisions deferred
>
> User wrote this page brief on 2026-05-12 but several upstream choices
> are still open. Do not start the build session without resolving them.
>
> 1. **Page location & number.** Options on the table: new
>    `stratified/page10.html` (alongside page 4) / new
>    `per_sample/page10.html` (alongside pages 1, 5, 9) / new
>    `functional/page10.html` (new section) / fold into existing
>    page 5 as a second tab. See §6.1.
> 2. **πN/πS estimator.** Options on the table: site-count ratio
>    (Σ πN_sites / Σ πS_sites) / Watterson-θ ratio (θN/θS) / Tajima-θ
>    ratio per-window then averaged / block-jackknife mean across
>    chromosomes. See §6.2.
> 3. **0-fold/4-fold degeneracy source.** Options on the table:
>    snpEff CDS annotations + custom degeneracy classifier / VEP
>    + Ensembl degeneracy table / custom from genome-atlas CDS FASTA
>    (Biopython three-codon enumeration) / dN/dS-pipeline by-product
>    if (D) below is already chosen for ROH-burden spec. See §6.3.
> 4. **VESM payload source.** Options on the table: pre-computed
>    VESM scores from genome-atlas (canonical) / on-the-fly VESM
>    prediction per-cohort / a non-VESM substitute (SIFT / PolyPhen-2
>    / MutPred / AlphaMissense-fish) if VESM-for-catfish isn't ready.
>    See §6.4.
> 5. **LOF caller.** Options on the table: snpEff "HIGH" impact
>    (stop-gain / start-loss / splice-donor/acceptor / frameshift)
>    / LOFTEE (Ensembl VEP plugin) / custom rule set. See §6.5.
> 6. **Stratification axis.** Same question as the ROH-burden
>    spec (`SPEC_2026-05-12_roh_gene_burden.md` §6.3). Whatever
>    is picked there should match here for consistency. See §6.6.

**Motivation (verbatim from user, 2026-05-12):**

> "πN/πS or π0-fold/π4-fold belongs on the same page as VESM, because
> both are about functional burden / selection efficacy / deleterious
> variation. But they are not the same layer."
>
> User reference: Harrang et al. 2013; Lohmueller 2014; Do et al. 2015;
> Henn et al. 2015 — πN/πS and π0/π4 as common measures of selection
> efficacy *within species*.

The page answers, per fish / family / ancestry group / cohort:

**What is the functional genetic health of this stratum?**

Five layers, ordered from variant-effect prediction → population-genetic
signal → realised homozygous burden:

| # | Layer | What it measures | Interpretation |
|---|---|---|---|
| 1 | VESM / deleterious predictor | predicted-damaging variant count or score sum | direct functional-risk score |
| 2 | πN/πS | nonsynonymous π ÷ synonymous π | coding burden / selection-efficacy proxy |
| 3 | π0-fold/π4-fold | π at 0-fold degenerate sites ÷ π at 4-fold degenerate sites | codon-position version of (2); independent of transcript model quality |
| 4 | LOF burden | stop-gain + frameshift + splice-disrupting allele counts | high-confidence severe burden |
| 5 | ROH-overlap burden | fraction of (1)/(2)/(3)/(4) that falls inside ROH | inbreeding-realised burden |

Layers 1, 4, 5 are *counts* (deterministic given an annotation).
Layers 2, 3 are *ratios* (need a denominator and a confidence interval).

---

## 1. Why these belong on one page

All five layers describe **deleterious variation realised in this cohort**.
They differ in how they detect it:

- VESM and LOF say *"this variant is predicted to be damaging"* — sequence-
  level / per-variant.
- πN/πS and π0/π4 say *"this population is carrying more protein-changing
  diversity than its silent baseline predicts"* — population-genetic
  signal across all variants, no per-variant labelling required.
- ROH-overlap says *"and X% of that burden is homozygous"* — realised vs
  latent.

Putting them on separate pages forces the reader to assemble the
interpretation manually. Co-locating them lets the page answer the
composite question "is this stratum carrying more damaging variation
than expected, and is it being expressed?" in one read.

This is also where layers disagree, which is itself diagnostic
(quoting user wording):

> If INV/INV has high πN/πS **and** high VESM burden, the inversion
> arrangement may shelter protein-changing/deleterious variants.
>
> If πN/πS is high but VESM is not high, there is more coding variation,
> but not clearly predicted damaging.
>
> If VESM is high but πN/πS is normal, there may be a few strong-effect
> variants rather than broad coding burden.

The page is the place those three cases become visible side by side.

---

## 2. Cross-atlas dependency

This is **not** a cross-atlas request the way the pairwise-θπ spec was —
the burden statistics are per-cohort summaries that live in
diversity-atlas. But every layer pulls upstream products from
genome-atlas:

| Concern | Atlas |
|---|---|
| Per-sample VCF (genotypes) | Diversity (have) |
| K=8 ancestry labels | Diversity `D.S1.k8` (have) |
| ROH BEDs (per-sample, all 226) | Diversity (have) |
| **Gene model BED + CDS FASTA** | **Genome Atlas (canonical) — NOT YET IN DIVERSITY** |
| **0-fold/4-fold site partition** | **Genome Atlas — DOES NOT YET EXIST** |
| **Annotated VCF (snpEff or VEP, syn/missense/LOF)** | **Genome Atlas pipeline — NOT YET RUN for v2** |
| **VESM scores per site** | **Genome Atlas — DOES NOT YET EXIST for catfish** |
| **Inversion karyotype calls per sample per candidate** | **Inversion Atlas (for the overlay panel only)** |

Same boundary pattern as the ROH-burden spec: the data product is
generated upstream and surfaced into the diversity-atlas as one or
more JSON slots loaded by `shared/data_loader.js`.

---

## 3. Page layout

```
┌────────────────────────────────────────────────────────────────────┐
│ Stat strip (5 cells, cohort-wide):                                 │
│   π    πN/πS    π0/π4    VESM burden    LOF count                 │
│  (with sub-line: 226 samples · K=8 grouping · genome-wide)         │
├────────────────────────────────────────────────────────────────────┤
│ Stratification pill toggle: [K=8 ▼] [family] [F_ROH-quartile]      │
│                                                  [sample drill ▼]  │
├────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────┐                  │
│ │ πN/πS per group      │ │ π0/π4 per group      │                  │
│ │ (boxes + strip)      │ │ (boxes + strip)      │                  │
│ └──────────────────────┘ └──────────────────────┘                  │
│ ┌──────────────────────┐ ┌──────────────────────┐                  │
│ │ VESM burden per      │ │ LOF count per        │                  │
│ │ group (boxes + strip)│ │ group (boxes + strip)│                  │
│ └──────────────────────┘ └──────────────────────┘                  │
├────────────────────────────────────────────────────────────────────┤
│ Sortable table: per-sample, 226 rows                               │
│   sample · K=8 · F_ROH · π · πN · πS · πN/πS · π0/π4 ·             │
│   VESM_burden · LOF_count · ROH_overlap_fraction                   │
│   (CIs on πN/πS and π0/π4 via block-jackknife — see §6.2)          │
├────────────────────────────────────────────────────────────────────┤
│ ROH-overlap stripe (full-width):                                   │
│   For each group, what fraction of VESM/LOF variants falls inside  │
│   ROH? Stacked bar — "in ROH" vs "outside ROH"                     │
└────────────────────────────────────────────────────────────────────┘
```

UI affordances (matching existing diversity-atlas page conventions):
- Stratification pill toggle (same set as ROH-burden — see §6.6).
- Plot-type pill toggle (boxes / boxes+strip / violin) — same as page 4.
- Sortable table with all-226 / outliers-only / search.
- Hover tooltips on every plot, showing the underlying counts behind
  each ratio (since a ratio with tiny denominators is noise).
- Click a sample row → drill-down panel like page 1.
- Click a group label → filter to that group across all plots
  (intra-page brushing, not implemented elsewhere yet — flag if
  out of scope for v1).

---

## 4. Pipeline product (data layer schema)

Goal: one JSON slot, two render modes (group-level + per-sample), with
all five layers in one payload so the page doesn't need to multiplex
fetches.

```json
{
  "_doc": "Functional burden / selection efficacy layers, per sample + per group. Single payload.",
  "version": "v1",
  "generated_at": "2026-05-12T00:00:00Z",
  "pipeline_steps": [
    "vcf annotation (snpEff or VEP) → syn/missense/LOF tags per site",
    "0-fold/4-fold site partition from CDS FASTA",
    "per-sample π, πN, πS, π0, π4 via ANGSD/realSFS or scikit-allel",
    "VESM scoring (or substitute — see §6.4) per site",
    "LOF tally per sample",
    "ROH × functional-site intersection (extends ROH-burden product)"
  ],
  "estimator": {
    "piN_piS_method": "TBD — see §6.2",
    "pi0_pi4_method": "TBD — see §6.3",
    "ci_method": "block-jackknife across chromosomes",
    "block_size_bp": 5000000
  },
  "per_sample": [
    {
      "sample_id": "FISH_0001",
      "k8": "G3",
      "family_id": null,
      "F_ROH": 0.18,
      "pi": null,
      "piN": null, "piS": null, "piN_piS": null, "piN_piS_ci": [null, null],
      "pi0": null, "pi4": null, "pi0_pi4": null, "pi0_pi4_ci": [null, null],
      "vesm_burden": null,
      "vesm_n_sites": null,
      "lof_count": null,
      "lof_in_roh": null,
      "vesm_in_roh_frac": null
    }
  ],
  "per_group": {
    "K=8": [
      {
        "group": "G1",
        "n_samples": null,
        "pi": null,
        "piN_piS": null, "piN_piS_ci": [null, null],
        "pi0_pi4": null, "pi0_pi4_ci": [null, null],
        "vesm_burden_mean": null,
        "lof_count_mean": null,
        "roh_overlap_frac": null
      }
    ]
  },
  "alternative_stratifications": {
    "family": [],
    "F_ROH_quartile": [],
    "karyotype": {}
  }
}
```

Size estimate: ~226 sample rows × ~15 numeric fields + 8 group rows ×
~12 numeric fields + alt stratifications ≈ small (low tens of kB).
Embed in `atlases/diversity/data/functional_burden.json`, load via
`shared/data_loader.js`.

Empty payload → page renders the same no-data fallback pattern as
page 9 (texture).

---

## 5. Pipeline (where the data comes from)

Pipeline steps in execution order. None of this lives in diversity-atlas;
all of it lives in catfish-diversity-analysis (population products) +
genome-atlas (annotation/CDS products).

1. **Annotate cohort VCF.** snpEff or VEP (decision: §6.5 — same tool
   for LOF and for syn/missense partition). Output: per-site
   functional class.
2. **Build 0-fold/4-fold partition.** From genome-atlas CDS FASTA;
   classify each CDS position by codon-degeneracy. Output: BED of
   0-fold sites and BED of 4-fold sites. Decision: §6.3.
3. **Compute π per class.** Per-sample π over (a) all sites, (b)
   missense, (c) synonymous, (d) 0-fold, (e) 4-fold. Estimator
   choice: §6.2.
4. **Score variants with VESM** (or substitute). Per-site score.
   Decision: §6.4.
5. **Tally LOF.** Per-sample count of high-impact alleles. Decision:
   §6.5.
6. **Intersect with ROH.** For VESM/LOF/missense — per-sample fraction
   inside an ROH call. Reuses the ROH × gene-model intersection
   product from `SPEC_2026-05-12_roh_gene_burden.md` if it lands first.
7. **Aggregate per group.** With block-jackknife CIs across
   chromosomes (default 5 Mb blocks).

Pipeline detail beyond this spec is up to the analysis repo.

---

## 6. Open design questions

### 6.1 Page location & number — **UNFINISHED**

No section / page-number chosen as of 2026-05-12. Options:

- **(A) `stratified/page10.html`** — alongside page 4 (K=8 boxes).
  Functional burden is mostly a group-stratification view, so this
  groups it with the other stratification page.
- **(B) `per_sample/page10.html`** — alongside pages 1, 5, 9. The
  per-sample table is the second-most-prominent component, so this
  groups it with the other per-sample pages.
- **(C) `functional/page10.html`** — new section. Cleaner conceptually:
  functional burden is its own theme, not a sub-flavour of "stratified"
  or "per_sample". Matches the user wording "Functional Burden /
  Selection Efficacy".
- **(D) Fold into page 5 as a second tab.** Page 5 is ROH; ROH-overlap
  is one of the five layers. Risks overloading page 5 with a
  conceptually broader payload.

Recommendation if no decision: (C), new `functional/` section, since
the user explicitly framed this as a top-level page ("Diversity Atlas
page: 'Functional Burden / Selection Efficacy'").

### 6.2 πN/πS estimator — **UNFINISHED**

- **(A) Site-count ratio** — Σ pairwise diffs at N-sites ÷ Σ pairwise
  diffs at S-sites. Simplest; what most papers report. Sensitive to
  small-denominator noise when stratified to small groups.
- **(B) Watterson θ ratio** — θN/θS. More variance-robust at low
  sample counts; less directly comparable to literature.
- **(C) Per-window Tajima θ, then mean** — robust to large-effect
  windows. Adds a window-size hyperparameter.
- **(D) Block-jackknife mean across chromosomes** — same estimator
  as (A) but with proper CIs. Probably wanted *on top* of whichever
  point estimator wins, not instead of one.

### 6.3 0-fold/4-fold degeneracy source — **UNFINISHED**

- **(A) snpEff CDS annotations + custom degeneracy classifier** —
  fits if snpEff is already in the annotation pipeline (§6.5).
- **(B) VEP + Ensembl degeneracy table** — fits if VEP wins §6.5.
- **(C) Custom from genome-atlas CDS FASTA** — Biopython
  three-codon enumeration. Tool-independent, slowest.
- **(D) dN/dS-pipeline by-product** — if the ROH-burden spec
  ends up picking dN/dS (option D in that spec's §6.2) for its
  constraint proxy, the 0-fold/4-fold partition falls out of
  that pipeline for free.

### 6.4 VESM payload source — **UNFINISHED**

- **(A) Pre-computed VESM scores from genome-atlas (canonical).**
  Assumes VESM-for-catfish is trained and tabled upstream.
- **(B) On-the-fly VESM prediction per-cohort.** Requires a VESM
  inference pipeline in catfish-diversity-analysis.
- **(C) Non-VESM substitute** (SIFT / PolyPhen-2 / MutPred /
  AlphaMissense fish-adapted). Pick if VESM-for-catfish isn't
  ready yet. The page label changes accordingly ("missense
  deleterious score" — agnostic to predictor).

### 6.5 LOF caller — **UNFINISHED**

- **(A) snpEff "HIGH" impact** — stop-gain, start-loss,
  splice-donor/acceptor, frameshift. Loose definition;
  high recall, lower precision.
- **(B) LOFTEE (Ensembl VEP plugin).** Stricter; designed to
  exclude likely-benign LOFs. Needs VEP, not snpEff.
- **(C) Custom rule set.** Define HIGH-impact criteria locally;
  most control, least standard.

### 6.6 Stratification axis — **UNFINISHED**

Same question as `SPEC_2026-05-12_roh_gene_burden.md` §6.3. Whatever
is picked there **must match here** for visual consistency across
the burden pages (page 5 ROH-burden and the new functional-burden
page should share the same pill toggle).

- **(A) K=8 group only.**
- **(B) K=8 + per-family toggle.**
- **(C) K=8 + per-sample drill-down.**
- **(D) K=8 + F_ROH-quartile toggle.**
- **(E) All modes selectable.**

---

## 7. Sortable-table column set (concrete, no decisions deferred)

For the per-sample table (lower half of the page). 11 columns:

| col | header | source | sort default |
|---|---|---|---|
| 1 | sample | `per_sample[i].sample_id` | asc |
| 2 | K=8 | `per_sample[i].k8` | — |
| 3 | F_ROH | `per_sample[i].F_ROH` | desc (toggle) |
| 4 | π | `per_sample[i].pi` | desc |
| 5 | πN | `per_sample[i].piN` | desc |
| 6 | πS | `per_sample[i].piS` | desc |
| 7 | πN/πS | `per_sample[i].piN_piS` | desc |
| 8 | π0/π4 | `per_sample[i].pi0_pi4` | desc |
| 9 | VESM burden | `per_sample[i].vesm_burden` | desc |
| 10 | LOF count | `per_sample[i].lof_count` | desc |
| 11 | VESM in ROH | `per_sample[i].vesm_in_roh_frac` | desc |

Outlier classing (`outlier-hi`/`outlier-lo`, same convention as page 1):
flag πN/πS > group mean + 1.5σ, π0/π4 > group mean + 1.5σ, VESM burden
> cohort mean + 1.5σ, LOF count > cohort mean + 1.5σ. Notes column
("flag") generated from these.

---

## 8. Interpretation card (text block, lower-page)

Static prose explaining how to read disagreement between layers.
Three cases verbatim from user wording (see §1 above). One paragraph,
no plots, sits at the bottom of the page next to the methods bullets.

---

## 9. Methods card (bullet list)

- π / πN / πS definitions
- 0-fold / 4-fold definitions (link to §6.3 decision once made)
- VESM model version and training cohort (or substitute model — §6.4)
- LOF criterion (§6.5)
- ROH source: `D.S5` (have) — same as page 5
- Block-jackknife CI window size: 5 Mb (default; tunable in payload)
- K=8 source: `D.S1.k8` (have)

---

## 10. Inversion-atlas overlay (companion, NOT a new page)

The Inversion Atlas re-uses the same five layers but **per inversion
candidate, per karyotype group**. Not a full burden page — a small
overlay panel inside the existing per-candidate view.

Wording from user (2026-05-12):

> In the Inversion Atlas, you only show these values per inversion
> candidate. The question becomes: *does this inversion arrangement
> carry more functional burden?*

Panel content per candidate:

| Karyotype | πN/πS | π0/π4 | VESM burden | LOF count | interpretation hint |
|---|---|---|---|---|---|
| STD/STD | … | … | … | … | normal / sheltered / impoverished |
| HET     | … | … | … | … | mixed |
| INV/INV | … | … | … | … | inversion may shelter burden |

Three rows × five numeric columns. Tiny table. Lives in the existing
per-candidate Inversion Atlas page, **not** a new page. The diversity
atlas's pipeline product (§4 above) emits the karyotype stratification
into `alternative_stratifications.karyotype` keyed by inversion ID,
and the Inversion Atlas's per-candidate page reads from that same
JSON when it lands.

No separate spec needed for the overlay — it's the same data product,
different stratification axis. The Inversion-Atlas-side rendering
should be tracked in `KICKOFF_inversion_atlas.md` or the equivalent
sibling-atlas roadmap, not here.

---

## 11. πN/πS reporting in nearly-neutral context — single value, no log–log fit

**Rationale (user direction, 2026-05-12):** a log–log πN/πS-vs-πS
slope test requires **many species** (Romiguier et al. 2014 used
~76 animal species over ~10⁵-fold Ne range). With one species (this
catfish cohort) and ≤8 intraspecific groups spanning a tiny Ne range,
the slope is not estimable in any useful sense. **Therefore, no
scatter plot, no slope fit.** Report πN/πS as a value (cohort-wide
+ per-group mini-table) and let the literature anchor provide the
nearly-neutral context.

### 11.1 Theory (why πN/πS is meaningful at all)

Under the nearly-neutral theory (Kimura 1979) with a gamma-distributed
DFE of shape β, Welch, Eyre-Walker & Waxman (2008) show that the
expected πN/πS is approximately proportional to Ne<sup>−β</sup>.
Higher-Ne species purge slightly deleterious variants more efficiently,
so πN/πS falls. Romiguier et al. (2014) confirmed this empirically
across ~76 animal species: log(πN/πS) decreases linearly with
log(πS), slope ≈ −β (negative; the shape parameter of the DFE).

This is **the reason πN/πS is informative** in the first place — it
locates a population on the efficacy-of-selection axis. But the slope
itself can only be measured at the comparative-genomic scale, which
is not what we have here.

### 11.2 What the page shows instead

**(a) One headline value.** Cohort-wide πN/πS reported in the §3 stat
strip (already specced), with block-jackknife 95 % CI. One number.

**(b) Per-group mini-table.** A small 8-row table beneath the
cohort-wide value, no plot:

| Group | n samples | πS | πN | πN/πS | 95 % CI | rank |
|---|---|---|---|---|---|---|
| G1 | … | … | … | … | … | 1 |
| G2 | … | … | … | … | … | 2 |
| …  | … | … | … | … | … | … |
| G8 | … | … | … | … | … | 8 |

Sorted by πN/πS descending. Coloured cells: top πN/πS in red
(weakest purifying selection), bottom in blue (strongest).
This is a *descriptive* table — no fit, no test of the log–log
prediction.

**(c) Literature anchor card** (static text, no plot):

> **Where does this cohort sit?**
> Romiguier et al. (2014) reported animal πN/πS spanning roughly
> 0.05 (large-Ne marine invertebrates) to 0.30 (small-Ne vertebrates),
> median ≈ 0.17. The log–log slope of πN/πS on πS across those
> ~76 animals was negative (Welch et al. 2008 / Kimura 1979 prediction
> confirmed). Teleosts in that survey clustered around πN/πS ≈ 0.10–0.20.
>
> **This cohort:** πN/πS = `<value>` (95 % CI `<lo>` – `<hi>`).
> Interpretation: weaker / typical / stronger purifying selection
> relative to the animal median.

Three pre-written interpretations depending on whether the cohort
value sits above, near, or below the animal median.

**(d) Caveat sentence (must be on the page).**

> A formal test of the Kimura/Welch/Romiguier log–log relationship
> requires comparative data across many species and is not performed
> here — this cohort is one species. The values above are reported
> for context only.

### 11.3 Why not the scatter

Spelled out so a build-session reviewer doesn't re-add it:

- **Single species, low Ne dispersion.** Group-level πS values within
  one hatchery cohort span <2× — far too narrow to fit a slope that
  literature work measures across ~10⁵-fold Ne range.
- **n = 8 points.** Even if the x-range were adequate, a slope CI
  from 8 points would be near-uninformative.
- **The visual implies a test that isn't being performed.** A scatter
  + fitted line invites the reader to read off β; we cannot honestly
  provide a β from this design. Better to omit the plot than to
  caveat it after the fact.

If a multi-species catfish/teleost cohort ever becomes available,
the scatter belongs in a comparative-genomics atlas, not here.

### 11.4 Counter-evidence noted but out-of-scope here

The nearly-neutral / gamma-DFE framework is not universal:

- **Shifts in selective pressure across lineages.** Elyashiv et al.
  (2010) showed gene-specific selection shifts between two closely
  related yeast species — the DFE itself can vary across taxa.
- **FGM predicts DFE-Ne coupling depends on organism characteristics.**
  Martin & Lenormand (2006), Lourenço et al. (2011), Tenaillon
  (2014): under Fisher's Geometric Model the DFE depends on organism
  "complexity", pleiotropy, and Ne, so a single global slope is an
  approximation, not a theorem.
- **Plants vs animals.** Whether plants share the animal slope is
  still open.

None of this is testable from one cohort. Mentioned here so the
literature-anchor card doesn't overstate the universality of the
Romiguier reference value.

### 11.5 Pipeline product additions

None. The cohort-wide πN/πS and per-group πN/πS are already in §4's
payload (`per_group["K=8"][i].piN_piS` + CIs). No new fields needed.

### 11.6 Page layout (where the mini-table sits)

Bottom-right, beside the §8 interpretation card. ~40 % column width.
Three stacked blocks: headline value (large, bold), 8-row sorted
table, literature-anchor card with one-sentence verdict.

```
┌────────────────────────────────────────────────────────────────────┐
│ (stat strip + group boxplots + per-sample table + ROH stripe)      │
│ ... rest of page above ...                                         │
├────────────────────────────────────────────────────────────────────┤
│ Interpretation card (§8)        │ πN/πS in context (§11)           │
│ — three-case text from §1 —     │   cohort value (bold)             │
│                                 │   8-row sorted group table        │
│                                 │   "Romiguier 2014 median 0.17" │
└────────────────────────────────────────────────────────────────────┘
```

### 11.7 References (for the methods card)

- Kimura, M. (1979). Model of effectively neutral mutations in
  which selective constraint is incorporated. *PNAS* 76: 3440–3444.
- Welch, J. J., Eyre-Walker, A., & Waxman, D. (2008). Divergence and
  polymorphism under the nearly neutral theory of molecular evolution.
  *Journal of Molecular Evolution* 67: 418–426.
- Romiguier, J., et al. (2014). Comparative population genomics in
  animals uncovers the determinants of genetic diversity.
  *Nature* 515: 261–263. — empirical πN/πS–πS log–log slope across
  ~76 animal species.
- Elyashiv, E., et al. (2010). Shifts in the intensity of purifying
  selection: an analysis of genome-wide polymorphism data from two
  closely related yeast species. *Genome Research* 20: 1558–1573.
- Martin, G., & Lenormand, T. (2006). A general multivariate
  extension of Fisher's Geometric Model. *Evolution* 60: 893–907.
- Lourenço, J., Galtier, N., & Glémin, S. (2011). Complexity,
  pleiotropy, and the fitness effect of mutations. *Evolution*
  65: 1559–1571.
- Tenaillon, O. (2014). The utility of Fisher's Geometric Model in
  evolutionary genetics. *Annual Review of Ecology, Evolution, and
  Systematics* 45: 179–201.
- Harrang, E., et al. (2013); Lohmueller, K. E. (2014); Do, R., et al.
  (2015); Henn, B. M., et al. (2015) — πN/πS and π0/π4 as standard
  measures of within-species selection efficacy (cited in §1).

---

## 12. Statistical comparisons between groups — Kolmogorov–Smirnov

For every per-sample layer (πN/πS, π0/π4, VESM burden, LOF count,
ROH-overlap fraction), the page also reports **pairwise two-sample
Kolmogorov–Smirnov (K–S) test P values** between groups. The K–S
statistic compares the full empirical CDF of two distributions, so
it detects differences in shape (skew, tail) that a Kruskal–Wallis
or median test would miss — which matters here because the burden
distributions are heavy-tailed (a handful of high-burden samples
drive the differences we want to surface).

### 12.1 Where K–S goes on the page

For each of the four group-level boxplot panels (§3, rows 2–3):
add a small **pairwise K–S P-value matrix** beside the boxplot.
For K=8 groups → 28 pairs, rendered as an 8×8 lower-triangular
heatmap, BH-corrected, coloured by significance (white = ns,
gradient to red for P < 0.05). Click a cell → highlights those
two groups' samples on the strip overlay.

This mirrors the pairwise S2 table on page 4 (`pairwiseTable`) but
uses K–S in place of whatever pairwise test page 4 ships. Page 4
already does Kruskal–Wallis omnibus + pairwise rank-based tests;
the burden page adds K–S because the burden distributions are
shape-different in ways median-based tests don't capture.

### 12.2 Where K–S goes in the payload

Add a `pairwise_ks` block per stratification mode in §4's payload:

```json
"per_group": {
  "K=8": [ ... ],
  "pairwise_ks": {
    "piN_piS":     { "groups": ["G1", ...], "P_matrix": [[null, ...]], "P_BH": [[null, ...]] },
    "pi0_pi4":     { ... },
    "vesm_burden": { ... },
    "lof_count":   { ... },
    "roh_overlap": { ... }
  }
}
```

Each layer's `P_matrix` is the raw two-sided K–S P (`scipy.stats.ks_2samp`
or equivalent), `P_BH` is Benjamini–Hochberg-adjusted across the 28
pairs. The page reads `P_BH`; raw P is kept for tooltips.

### 12.3 Inversion-atlas overlay use case (the strong test)

In the per-candidate Inversion Atlas panel (§10), K–S is the natural
test of *"does this inversion shelter functional burden?"* — compare
the burden distribution of INV/INV-carriers to STD/STD-carriers per
candidate (pairwise, two distributions, fits K–S exactly). The
overlay panel's interpretation cell uses sign(median INV/INV − STD/STD)
+ K–S P value to populate the verdict.

### 12.4 Caveats

- **Sample-size sensitivity.** K–S is sensitive with ≥ ~20 samples
  per group. K=8 groups range from ~10–60 samples in this cohort
  (`D.S1.k8`) — usable but underpowered for the smallest groups.
  The matrix tooltip should always show `n1, n2` alongside P.
- **Ties.** Discrete layers (LOF count) have many ties; use the
  exact-method K–S or the bootstrap variant rather than the asymptotic
  approximation.
- **Multiplicity.** 28 pairs × 5 layers = 140 P values. BH within each
  layer; do **not** flag a single-layer single-pair significance
  without context.

### 12.5 Implementation note

`scipy.stats.ks_2samp` is the standard. The page just reads the
pre-computed matrix; the pipeline is responsible for the computation
and the BH correction. No client-side K–S.

---

## 13. Open questions for the next session

1. §6.1–§6.6 — six unfinished design decisions above.
2. Should the per-sample drill-down (table click) open a panel
   showing **which genes** drove this sample's VESM/LOF burden, or
   just the numeric breakdown? If the former, need a per-sample
   gene-level export from the upstream pipeline.
3. Should πN/πS be reported per-chromosome as well (extra heatmap
   row in the page), or only per-sample / per-group?
4. Should the page mirror the K-sweep panel from page 4 — i.e. show
   πN/πS at K=2, K=3, …, K=8 to verify the result isn't an artefact
   of the chosen K? Defer; probably overkill for v1.
5. Should the cross-atlas overlay (§10) be tracked as a sub-issue in
   this repo, or owned by the Inversion Atlas repo?

---

## 14. Summary

| What | Where |
|---|---|
| Main page — five-layer functional burden | new diversity-atlas page (location TBD §6.1) |
| Per-candidate burden overlay | Inversion Atlas, existing per-candidate panel |
| Pipeline product | one JSON (functional_burden.json), six pipeline steps |
| Cross-atlas data deps | genome-atlas: gene model, CDS, annotation, VESM, degeneracy |
| Open decisions | 6 (location, πN/πS estimator, 0/4-fold source, VESM source, LOF caller, stratification axis) |
| Sibling spec to align with | `SPEC_2026-05-12_roh_gene_burden.md` (shares ROH × functional intersection + stratification choice) |

- Status: **spec only**. No pipeline run. No atlas page.
- Decisions deferred per user direction.
- Pairs with `SPEC_2026-05-12_roh_gene_burden.md` — both should be
  resolved together to share the same stratification toggle and the
  same upstream ROH × functional-site intersection.
