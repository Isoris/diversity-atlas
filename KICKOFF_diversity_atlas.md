# 🟢 KICKOFF — Diversity Atlas migration

**Date:** 2026-05-07
**Atlas ID (proposed):** `diversity`
**Repo (proposed):** `diversity-atlas` (sibling to
`catfish-diversity-analysis`, the analysis-pipeline repo)
**Cohort:** 226-sample pure *C. gariepinus* hatchery cohort, LANTA.
**Status:** No migration yet. Round 0 / scoping.
**⚠️ This is the biggest of the three sibling atlases (~2.5 MB v2.4).
Expect the page audit alone to take a session.**

---

## What exists today

A single-file HTML, but real-sized:
- `Diversity_atlas.html` — ~2.5 MB, v2.4 (built late April 2026,
  in the chat that closed at `Atlas_apr30_v12.tar.gz`).

This is **not** a thin scaffold like the Genome / Population
atlases — it has real per-sample H content, θπ visualization, and
ROH atlas pieces. The 2.5 MB figure means a meaningful amount of
inlined data + rendering code already exists.

Cross-link rewrite already done in chat 07759823.

Beyond the single HTML: no decomposition into pages-as-modules,
no `manifest.json`, no registries, no test harness.

The **analysis pipeline** that feeds this atlas is real:
`catfish-diversity-analysis` repo (per the four-repo split,
chat 6144abe7), holding MODULE_3 (per-sample H, θπ, ROH, F_ROH,
ngsF-HMM).

---

## What this atlas is for

Per the v4 session memory + chat 6144abe7 boundary:
*"Diversity Atlas — population-genetic-diversity lens (θπ, F_ROH,
ROH atlas, ancestry-Q stratification, kinship/relatedness)."*

The **corrected per-sample-diversity boundary** (chat 6144abe7):
- per-sample H / θπ / F_ROH / ROH BEDs → **Diversity Atlas**
- cohort-level PCA / K / kinship matrix / unrelated subset →
  **Population Atlas**
- Diversity Atlas **consumes ancestry labels** from Population
  Atlas's canonical K assignment to stratify per-sample metrics.

Note that the v4 memory line lists "kinship/relatedness" under
Diversity, but the chat 6144abe7 boundary moves kinship to
Population. Trust the newer boundary.

---

## Why this is the biggest migration of the three

- **2.5 MB single-file** vs 63 KB / 27 KB scaffolds for Population
  / Genome. That's roughly 30–80× more content to decompose.
- Existing rendering code in the file isn't structured as
  `atlas-core`-style modules — it's inline. The migration is closer
  to the Inversion Atlas's own migration (extracting hundreds of
  LOC per page into the page-module shape) than to a greenfield
  skeleton like the Genome Atlas's.
- Round 1 alone may need a **pre-round-0 audit session** that
  catalogues every renderer, every page-like view, every data
  layer the current 2.5 MB file knows about. Without that, you'll
  end up flying blind into the migration.

For comparison: the Inversion Atlas migration started from a
larger flat HTML and has consumed ~18 rounds across multiple chats
to get to 17/21 pages. The Diversity Atlas is smaller than
Inversion's starting point, but not by an order of magnitude.

---

## Open questions for Quentin (must answer before round 1)

### Q1 — what's actually inside `Diversity_atlas.html`?

The 2.5 MB file's contents aren't catalogued anywhere reachable
from this session. **Before round 1, do an audit session** whose
sole output is:
- A list of every "page-like view" currently in the file (the
  in-page tabs / sections).
- A list of every inlined data layer (per-sample H array, θπ track
  schema, ROH BED schema, …).
- A list of every renderer (canvas drawers, SVG composers, table
  builders).
- A list of cross-references to the Inversion Atlas (any
  `state.candidate` reads? any popstats-style live queries?).

This audit becomes the input to Q2 + Q3. It's the equivalent of
the Inversion Atlas's early "Batch 1 notes" + "Batch 2 notes" +
scope-check audits before page-by-page migration started.

### Q2 — page list (depends on Q1)

Plausible pages (your call after the audit):

| # | Page | What it shows |
|---|---|---|
| 1 | `per_sample_h` | Genome-wide heterozygosity per sample, stratified by ancestry-Q |
| 2 | `theta_pi_tracks` | Per-window θπ tracks per sample / per group |
| 3 | `roh_atlas` | ROH segments per sample, length-class histograms |
| 4 | `f_roh` | F_ROH per sample (genome-wide + per chrom + per length class) |
| 5 | `f_roh_h_framework` | The diversity-contextualized F_ROH|H framework |
| 6 | `inbreeding_decomp` | Recent vs ancient inbreeding decomposition |
| 7 | `efhd` (?) | EFHD signal (overlaps with Population Atlas's founder_space) |

Some of these are already in the v2.4 HTML; others are aspirational.
Decide post-audit.

### Q3 — stages

Likely candidates:
- **`per_sample`** (h, theta_pi, roh)
- **`aggregated`** (f_roh, f_roh|h, inbreeding decomp)
- **`stratified`** (ancestry-Q stratification views)

Decide.

### Q4 — do we keep inlined data or move to layer files?

The Inversion Atlas's discipline is that data lives in
`atlases/inversion/data/` + a layer registry; pages read layers
through the engine. The 2.5 MB of the current Diversity Atlas
suggests there's a lot of inlined data. Migration round 1 needs
to decide:
- **(a) Strict** — extract every inline data blob into a JSON
  layer file, register in `layers.registry.json`. Most consistent
  with the Inversion Atlas. Bigger round-1 cost.
- **(b) Lazy** — keep inline data in the page module for now, only
  promote to layer-registry on a per-page basis as it becomes
  necessary. Faster round 1, more debt.

Recommended: **(b)** unless the audit shows the inline data is
genuinely re-used across multiple pages, in which case (a) for
those layers.

### Q5 — overlap with Population Atlas

Per the Population Atlas kickoff Q4:
- Per-sample H / F_ROH = Diversity. Confirmed.
- Cohort-level structure (PCA, K, kinship) = Population. Confirmed.
- Ancestry labels = produced by Population, consumed by Diversity.

The Diversity Atlas's `stratified` stage pages need to load
ancestry labels from somewhere. Options:
- **(a)** Layer file `ancestry_labels.json` that the Population
  Atlas writes and the Diversity Atlas reads (loose coupling via
  the file system).
- **(b)** Shared `slots.registry.json` entry across both atlases
  (tight coupling, but cleaner).
- **(c)** Just duplicate the labels in each atlas's `data/` dir
  for round 1, decide later.

Defer to round 3+ when this overlap actually appears in a page.

### Q6 — repo location

Two natural homes:
- **(a) Its own repo** `diversity-atlas/`, sibling to
  `catfish-diversity-analysis/`. Most consistent. Recommended.
- **(b) Inside `catfish-diversity-analysis/`** as `docs/atlas/`.

Decide: (a) or (b)?

---

## First-round plan (once Q1–Q6 are answered)

### Round -1 (recommended): pre-migration audit

Before round 1, schedule a **separate session** whose only job is
to:
1. Open `Diversity_atlas.html` (2.5 MB) and produce the inventory
   asked for in Q1.
2. Write a `DIVERSITY_ATLAS_AUDIT.md` that lists every page-like
   view, every renderer, every inlined data layer.
3. Recommend a page order based on which pages are most
   self-contained vs which cross-reference others.

Without this audit, the first migration round risks the same kind
of "didn't see the dependency" mistakes the Inversion Atlas
migration ran into in its early rounds.

Estimated time: ~1-2 hours of one session.

### Round 0 (this kickoff)
- ✅ Folder created, current HTML dropped in.
- ✅ This kickoff doc read.
- ⏳ Q1–Q6 answered (some can defer to post-audit).
- ⏳ Audit session scheduled.

### Round 1 — skeleton + first page (post-audit)
Goal: same as Genome / Population atlases' round 1 — boot
`atlas-core` with the Diversity Atlas + one real page rendering.

Steps:
1. Create `diversity-atlas/` repo structure mirroring
   `inversion-atlas/`.
2. Write `manifest.json` from the audit's page list.
3. **Pick the most self-contained page** from the audit and carve
   it out. Recommended candidates (subject to audit):
   - `per_sample_h` (the H landscape) — simplest, no cross-page
     dependencies.
   - `roh_atlas` (the ROH segment view per sample) — also
     standalone.
   Avoid `f_roh_h_framework` / `inbreeding_decomp` /
   `stratified_*` pages until later — they cross-reference
   ancestry labels (Population Atlas dep) or earlier per-sample
   pages.
4. Unit + smoke tests for the page.
5. Test harness.
6. Verify.
7. Write `HANDOFF_<date>_diversity_round1_done.md` +
   `CONTINUE_HERE_<date>_post_round1.md`.

Estimated time: 2-3 hours (longer than Genome/Population round 1
because there's real existing content to extract, not just
skeleton).

### Round 2+
One page per round.

---

## Reference paths in the Inversion Atlas

Same as the Genome and Population kickoffs. The Diversity Atlas
migration will especially benefit from looking at:

- **Page-with-real-content templates** rather than just thin loader
  stubs. The Inversion Atlas's `page1` (4500+ LOC, multiple
  sub-modules) is the closest analog to what Diversity Atlas pages
  will look like once decomposed.
- The Inversion Atlas's `BATCH_1_NOTES.md` /
  `BATCH_2_NOTES.md` — early scope audits done before page-by-page
  migration started. The Diversity Atlas audit should produce
  similar artefacts.

Specific paths:
- Manifest: `inversion-atlas/atlases/inversion/manifest.json`
- Pages registry: `.../registries/data/pages.registry.json`
- Layers registry: `.../registries/data/layers.registry.json`
- Slots registry: `.../registries/data/slots.registry.json`
- Simple template: `.../pages/review/page7.{html,js}` +
  `page7/_state.js` + `tests/test_review_page7.js` +
  `tests/smoke_review_page7_round5.mjs`
- Real-content template (sub-modules): `.../pages/discovery/page1/`
- Big-existing-content reorganization: see the page1 migration
  trail (rounds 1–4) in `handoff/PAGE_MIGRATION_RECIPE.md` /
  audit log.
- Migration recipe: `handoff/PAGE_MIGRATION_RECIPE.md`
- Architectural-discipline rule (registry content out-of-scope):
  `handoff/HANDOFF_2026-05-07_chat38_round5_step17_done.md`
- Early audits / batch notes: `inversion-atlas/atlases/inversion/pages/discovery/BATCH_1_NOTES.md`
  + `pages/review/BATCH_2_NOTES.md`

---

## What round 1 should NOT do

- **Don't migrate every page in one round.** The 2.5 MB file is
  the temptation to "just decompose everything." Resist. The
  Inversion Atlas was a 4-MB-ish flat HTML and took 18 rounds.
- **Don't write to `atlas-core`.** Atlas-core is shared; per-atlas
  pages live in `atlases/diversity/...`.
- **Don't merge MODULE_3 analysis code into the atlas repo.** The
  atlas only consumes outputs.

---

## Cross-atlas boundary checklist

Same as Population Atlas kickoff. Recap:

| Metric | Belongs in |
|---|---|
| PCA / PCAngsd / NGSadmix / K | Population |
| ngsRelate / NAToRA / kinship matrix | Population |
| Per-sample H / θπ / F_ROH | Diversity |
| ROH atlas / ROH length classes | Diversity |
| Ancestry-Q stratification (per-sample) | Diversity (consumes labels from Population) |
| Inversion calls / breakpoints | Inversion |
| Assembly stats / synteny / TE density | Genome |

If round-1's first page touches anything from outside the
"Diversity" rows, defer it.

---

## Three-cohort discipline

The Diversity Atlas describes the **226-sample pure *C. gariepinus*
hatchery cohort**. Same cohort as the Inversion Atlas and the
Population Atlas. **Not** the F₁ hybrid (Genome Atlas only),
**not** the wild *C. macrocephalus* (future paper).

---

## What to do right now

1. **Schedule the audit session first** (round -1). The kickoff's
   Q1 is too important to skip.
2. Drop `Diversity_atlas.html` into
   `~/Atlas_workspace/diversity-atlas/`.
3. Drop this kickoff into the same folder.
4. After the audit, answer Q2–Q6 and schedule round 1.
5. Recommended ordering: do **Genome Atlas round 1 first** (it
   becomes the skeleton template), **then Diversity Atlas audit +
   round 1**, **then Population Atlas round 1**.
