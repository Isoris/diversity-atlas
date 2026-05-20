# IDEA — Per-base standing variation track across an inversion

**Date captured:** 2026-05-14
**Doc type:** IDEA (parked) — not a SPEC, not a decision, not yet a build target.
**Target atlas:** **Inversion Atlas** (per-candidate view) — *not* diversity-atlas.
**Cross-atlas role of diversity-atlas:** provides the per-base / per-window diversity
substrate the view consumes. This note is filed here only because that
is where the user message arrived; it should be mirrored or moved to
`inversion-atlas/_handoff_docs/` once that repo is touched.

> ## Status — IDEA, on the side
>
> User direction (2026-05-14): *"just keep the idea on side ok ...
> i am really not sure"*. The metric question is **not** resolved,
> the upstream substrate (per-base allele frequencies inside inversion
> intervals) **does not yet exist**, and no design session has happened.
> Do not start building from this note. It exists so that when a
> future session picks up the standing-variation-vs-inversion question,
> the framing and candidate metrics are already written down.

---

## 1. What the view answers (the question, verbatim from user)

> "New mutations are usually too slow. A population cannot wait for
> the perfect new mutation at every locus. So adaptation often uses
> **standing genetic variation**: alleles that already exist in the
> population, alleles brought by migrants, and old haplotypes already
> segregating. This is why inversions matter: they do not need to
> invent new alleles. They can **repackage** them."
>
> "Inversions can evolve with new mutations (rare) but they compose
> with standing genetic variation + migration of alleles in and out
> + meiotic recombination events, maybe more, but mostly that."

The view shows, for one selected inversion candidate, what the
standing-variation landscape looks like base-by-base across the
inversion interval — so the reader can see whether the inversion
is sitting on a high-diversity region (lots of repackageable
alleles) or a quiet region (less to repackage). Companion to the
existing per-candidate plots in the Inversion Atlas.

### 1.1 Why inversions matter mechanistically — coadapted combinations, not slow recombination

User clarification (2026-05-14):

> "Recombination is **not 'too slow' in general** — it is **too disruptive**.
> Normal meiosis can recombine alleles every generation. That is fast.
> But the problem is:
>
> ```
> local good combination:    A — B — C
> migrant combination:       a — b — c
>
> recombination can create:  A — b — C
>                            a — B — c
>                            A — B — c
> ```
>
> Some of these mixed haplotypes may have lower fitness because they
> break a coadapted combination. So for inversions: the issue is **not
> that recombination is too slow**. The issue is that recombination is
> **too free/random** and can break locally coadapted allele
> combinations faster than selection can rebuild them."

**Implication for this view.** The reason a standing-variation track
across an inversion is interesting is *not* simply "there's lots of
diversity here". It is:

1. Inversions **suppress recombination** within the inverted interval
   (heterozygotes for the inversion can't recombine across the
   breakpoints without producing unbalanced gametes).
2. So the inverted arrangement **preserves coadapted combinations** of
   the alleles already present at the moment the inversion arose +
   any subsequent migrants whose haplotypes survive selection inside
   the arrangement.
3. The "repackaging" the user describes is: the inversion captures a
   particular *combination* of standing variants, then locks it
   against shuffle.

This shifts the diagnostic question the view answers from *"how much
variation is here?"* (single-track π) to *"what combination of
variation does this arrangement carry, and how does it differ from
the standard arrangement?"* — which is fundamentally a **two-track
question** (Track 5 in §3: per-karyotype overlay). A π track alone
under-uses the data because the *combination* is the thing inversions
protect, not the *amount*. The SFS-shape track (option C in §2) and
the per-karyotype contrast (Track 5) are therefore more diagnostic
than the simple π track on its own.

This connects to:
- The classical Dobzhansky framing of inversions as protectors of
  coadapted gene complexes.
- Hoffmann & Rieseberg 2008 (*Annu. Rev. Ecol. Evol. Syst.*) "Revisiting
  the impact of inversions in evolution: from population genetic
  markers to drivers of adaptive shifts and speciation?"
- Kirkpatrick & Barton 2006 (*Genetics*) "Chromosome inversions, local
  adaptation and speciation".

Add the corresponding citations to the methods card when this view
ships.

---

## 2. What it might display — the metric question (UNRESOLVED)

User wording: *"I think its maybe the allele count per allele +
the per site diversity but I am really not sure."*

Candidate metrics to plot per base (or per small window) across
the inversion interval — none chosen yet:

- **(A) Per-site π** (nucleotide diversity). What the existing
  per-window θπ tracks already show, just at finer resolution.
  Simple, well-understood, but doesn't separate "standing" from
  "fixed" or "new" variation.
- **(B) Per-site allele count (S/L)** — number of segregating
  alleles per base across the cohort. The user's guess; this is
  closer to Watterson's θ_W than to π.
- **(C) Folded site-frequency-spectrum (SFS) summary per window** —
  distribution of minor allele frequencies. Standing variation
  tends to populate intermediate frequencies; new mutations sit at
  low frequencies. The shape of the SFS would let the reader
  visually distinguish "lots of repackageable standing alleles"
  from "mostly low-frequency / new".
- **(D) Allele-age proxy** — fraction of sites whose minor allele
  frequency exceeds some threshold (e.g. MAF > 0.05). Sites above
  threshold are likely *not* new mutations; they're standing variation.
- **(E) Migration-aware variant** — per-site allele frequency
  partitioned by inferred source (in-cohort vs migrant from a
  reference population). Would explicitly show the "migration in/out"
  contribution. Requires labelled donor populations.
- **(F) Combined two-track** — π on top, SFS shape or MAF > 0.05
  fraction below. Lets the reader see both *how much* variation is
  there and *what kind*.

Most pop-gen-correct interpretation of the user's framing is
probably (F) with (C) or (D) as the secondary track — π alone
under-uses the data because the *frequency distribution* is what
distinguishes standing variation from new mutations.

**After the §1.1 clarification** (recombination is disruptive, not
slow; inversions protect coadapted combinations): the *most*
diagnostic track is not any single-arrangement metric, it is the
**per-karyotype contrast** between INV and STD arrangements (Track 5
in §3). The single-track metric question above is therefore the
second-order decision; the first-order decision is *which
single-track metric to compute per karyotype*. Whatever metric wins
in §2, compute it three times (STD/STD, HET, INV/INV) and overlay.

A useful additional metric the §1.1 framing surfaces:
- **(G) Linkage-disequilibrium / haplotype-block length per window**.
  Inversions protect haplotype blocks from being broken up; LD inside
  the inversion should be elevated relative to the standard
  arrangement. A per-window mean |r²| or block-length proxy
  (compared between STD/STD and INV/INV) makes the
  recombination-suppression effect *directly visible*. This is the
  cleanest reading of the §1.1 mechanism.

---

## 3. Companion-view layout (sketch only)

```
┌────────────────────────────────────────────────────────────────┐
│ Inversion candidate: INV_LG07_v3                                │
│   chr07: 12.3 Mb – 15.8 Mb · 3.5 Mb · 41 samples carrying       │
├────────────────────────────────────────────────────────────────┤
│ Track 1: gene model (existing — already in inversion atlas)     │
├────────────────────────────────────────────────────────────────┤
│ Track 2: per-base π (option A)                                  │
│   ─── ───── ───── ─────── (line chart, ≤50 kb resolution)       │
├────────────────────────────────────────────────────────────────┤
│ Track 3: per-base allele count or MAF > 0.05 fraction           │
│   ▮▮ ▮▮▮ ▮▮▮▮ ▮▮ ▮ ▮▮▮▮▮ (bar/heat per window)                  │
├────────────────────────────────────────────────────────────────┤
│ Track 4 (stretch): SFS shape per window                         │
│   ░░▒▓ ▒▒▓█ ░▒▓█ ░░▒▓ … (small SFS sparkline per window)        │
├────────────────────────────────────────────────────────────────┤
│ Track 5 (stretch): per-karyotype overlay                         │
│   STD/STD π in grey · HET π in orange · INV/INV π in red         │
│   — overlapping lines on the same per-base axis                  │
└────────────────────────────────────────────────────────────────┘
```

Per-karyotype overlay (Track 5) is the most diagnostic component —
the *difference* in standing variation between STD/STD and INV/INV
is what reveals whether the inversion is sheltering / fixing / losing
alleles relative to the standard arrangement. Pairs with the
inversion-overlay companion already specced for the Diversity
Atlas's functional-burden page
(`SPEC_2026-05-12_functional_burden.md` §10).

---

## 4. Cross-atlas boundary

| Concern | Atlas |
|---|---|
| Per-candidate inversion track UI | Inversion Atlas (this view lives there) |
| Per-base / per-window π inside inversion intervals | Diversity Atlas (data layer; reuses θπ tracks from `catfish-diversity-analysis / 02_heterozygosity/`) |
| Per-site allele counts / SFS | Diversity Atlas (data layer; new product) |
| Karyotype calls per sample per candidate | Inversion Atlas (consumed for Track 5) |
| MAF > 0.05 threshold / allele-age proxy | Genome Atlas if allele-age data exists; otherwise compute upstream |

Same pattern as the existing functional-burden inversion overlay:
the data product is generated upstream in `catfish-diversity-analysis`
(under `02_heterozygosity/` or a new sibling step) and surfaced into
the Inversion Atlas's per-candidate page via a JSON slot.

---

## 5. Pipeline product (sketch, not specced)

If this becomes a build target, the upstream pipeline emits per
candidate:

```jsonc
// inversion_standing_variation_<candidate_id>.json (sketch only)
{
  "candidate_id": "INV_LG07_v3",
  "chrom": "chr07",
  "start": 12300000,
  "end":   15800000,
  "window_bp": 50000,
  "metric_set": ["pi_per_site", "n_segregating", "maf_gt_005_frac", "sfs_per_window"],
  "windows": [
    { "start": 12300000, "end": 12350000,
      "pi": null, "n_seg": null, "maf_gt_005_frac": null,
      "sfs": null,
      "per_karyotype": {
        "STD/STD": { "pi": null, "n_samples": null },
        "HET":     { "pi": null, "n_samples": null },
        "INV/INV": { "pi": null, "n_samples": null }
      }
    }
    // ... ~70 windows for a 3.5 Mb inversion at 50 kb resolution
  ]
}
```

Size is tiny (~70 windows × a handful of metrics × 3 karyotype
overlays ≈ low tens of kB per candidate). Embed per-candidate or
load on demand from `data/inversion_standing_variation/<id>.json`.

---

## 6. Open questions to resolve before this becomes a SPEC

1. **Metric choice** (§2) — most important. Likely a session of its
   own. Note (per §1.1): the first-order decision is "always show
   per-karyotype overlay"; the single-track metric choice (π / SFS /
   MAF-threshold / LD) is second-order. Add option (G) per-window LD
   to the menu when this becomes a SPEC.
2. **Window size** — 1 kb (true per-base is too noisy for line plots)
   vs 10 kb vs 50 kb. 50 kb matches the existing θπ tracks for
   visual continuity; 10 kb gives more resolution at the breakpoints.
3. **MAF threshold for "standing"** — if option (D) is chosen, the
   threshold is itself a decision. 0.05 is conventional; some
   literature uses 0.01 or 0.1.
4. **Migration source labelling** — if option (E) is wanted, requires
   either a confirmed donor population in the cohort or imputation
   from a reference. Probably out of scope for v1.
5. **Per-karyotype track sample-size handling** — INV/INV homozygotes
   may be too few in any one candidate to estimate π reliably. Need
   to decide on a minimum-n threshold below which the per-karyotype
   line is suppressed or shown faintly with a "n=X" warning.
6. **Relationship to per-window θπ tracks already in the diversity
   atlas** — overlap with `D.ST1` and `D.ST3`. The new product
   either reuses those windows (good — reuses existing pipeline) or
   adds a finer-resolution sibling.

---

## 7. Why this is parked (not built)

- User explicitly said "just keep the idea on side".
- The metric question is unresolved (six options, no obvious winner).
- The upstream substrate (per-base / per-window allele frequencies
  *inside inversion intervals*, partitioned by karyotype) does not
  exist as a canonical pipeline output yet.
- The view lives in the Inversion Atlas, which is a separate repo
  this session does not have checked out — building would require
  cross-repo coordination.

When a future session takes this up:
1. Start by resolving §6 question 1 (which metric / track set).
2. Confirm the upstream pipeline can emit the schema in §5 (likely
   under `catfish-diversity-analysis / 02_heterozygosity/` or a new
   step keyed by candidate ID).
3. Then upgrade this `IDEA_*.md` to a `SPEC_*.md` and proceed via
   the same decision-resolution flow the other round-3 specs used.
