# IDEA — Tighter integration between samples (heterozygosity) and roh (inbreeding) pages

**Date captured:** 2026-05-20
**Doc type:** IDEA (parked) — not a SPEC, not a decision, not yet a build target.
**Target pages:** `atlases/diversity/pages/per_sample/samples.{html,js}` (H, θπ, F_ROH/F_HOM headline cells) and `atlases/diversity/pages/per_sample/roh.{html,js}` (ROH composition, length classes, S_ROH, per-chrom heatmap, ROH × gene-model extension). Both formerly known as page1 and page5 before the rename refactor.
**Status:** IDEA — user direction (2026-05-20): *"I am not sure but keep the idea."*

> ## Why this is parked
>
> The two pages cover topics that are **mathematically and biologically linked** but currently render side-by-side without deep cross-talk. The right *form* of integration is not obvious — see §4 for the menu of options, none chosen.

---

## 1. The observation, verbatim

User wording (2026-05-20):

> "Heterozygosity and inbreeding pages should be tightly integrative of each other because they are usually linked in some sort of ways. I am not sure but keep the idea."

## 2. Why the linkage is not just narrative — it's algebraic

The two pages already show numbers that are **definitions of each other**:

- **F_HOM = (H_expected − H_observed) / H_expected** — literally a heterozygosity-deficit estimator. The samples page shows F_HOM (round-3 addition) right next to H; the ROH page never mentions H.
- **F_ROH = S_ROH / callable_genome** — and a sample with high F_ROH has lower H by construction (ROH tracts have H = 0 inside them). The cohort already shows **ρ(H, F_ROH) = −0.70** in `D.globals.rho_h_froh` — the strongest single correlation in the atlas.
- **Recent inbreeding ⇒ long ROHs ⇒ local H = 0** in those tracts. **Ancient autozygosity ⇒ short ROHs scattered ⇒ background H depression**. Reading the ROH length-class distribution *is* reading a decomposition of the H signal into time-windowed components.
- **F_HOM and F_ROH should agree when both work correctly**. Discordant pairs are diagnostic: F_ROH ≫ F_HOM hints at false-positive ROH tracts; F_HOM ≫ F_ROH hints at Wahlund-effect / population structure. This cross-check is currently a one-liner in the F_HOM interp tooltip; it deserves a real visual.

## 3. Where the pages currently stop talking to each other

| What's there now | What's missing |
|---|---|
| samples drill-down shows F_HOM, F_ROH, S_ROH numbers for one sample | …but no mini-ROH-class bar for that sample (you have to navigate to the ROH page and search for the same sample) |
| samples scatter plot shows H × F_ROH | …but no way to pivot directly to that sample's ROH composition |
| ROH page shows length-class bins for the cohort | …but no H column next to each ROH-class strip — the implication "more long ROHs ⇒ lower H" is left to the reader |
| ROH page S8b heatmap shows per-chrom × per-sample F_ROH | …but the H counterpart (per-chrom × per-sample H) lives implicitly in θπ tracks on a different page |
| `ρ(H, F_ROH) = −0.70` lives in the cohort strip on samples page | …but no scatter shows the cohort actually doing that |
| The F_HOM-vs-F_ROH agreement check (diagnostic for ROH-calling quality) is described in tooltips | …but never visualised |

## 4. Concrete integration options (menu, none chosen)

### (A) Bidirectional row-click cross-link
Sample-row click on samples page → opens ROH page with that sample pre-selected in the searches. ROH-row click on roh page → opens samples page with the drill-down focused on that sample. Cheapest option; preserves the two-page split.

### (B) Embedded mini-ROH-class bar inside the samples drill-down
When you click a row on the samples page, the existing drill-down panel grows a small 5-bar horizontal chart showing this sample's ROH count in each length class (1-2 / 2-4 / 4-8 / 8-16 / >16 Mb) — sourced from `D.S8` (per-sample, per-class). Reader sees "this sample's F_ROH = 0.31" *and* "all driven by the 8-16 Mb class → recent inbreeding" in one view. Probably the highest information-per-pixel option.

### (C) F_HOM vs F_ROH cross-validation scatter (new card on samples page)
Add a scatter plot: x = F_ROH, y = F_HOM, colour = K=8, diagonal y = x reference line, points off the diagonal flagged with sample IDs. Makes the F_ROH-vs-F_HOM agreement check (currently only described in the interp tooltip) into a visual that builds confidence in the ROH set or surfaces specific outlier samples. Directly answers "which samples have discordant inbreeding estimates?".

### (D) H decomposed by ROH-class contribution (new card on roh page)
For each sample, show H computed three ways: (i) over the whole genome, (ii) over the regions inside ROH (≈ 0 by construction, sanity check), (iii) over the regions outside ROH (the *outbred-background* H, which is the right comparator across populations with different F_ROH). The atlas already has `th_in`, `th_out`, `th_ratio` in `D.S1`; surface them on the ROH page as a stacked panel with a cohort histogram of `th_out`. Directly answers "what's the heterozygosity once you remove the inbreeding signal?".

### (E) F_ROH-quartile stratification toggle promoted to both pages
The stratification pill component built for the burden pages (`shared/stratification.js`) already supports an `froh_q` mode. Promote it to the samples page so the H histograms (current six plots) can be split by F_ROH quartile. The F_ROH-quartile axis is exactly the right way to ask "is the sub-cohort with the most inbreeding losing H the way the theory predicts?" — and the page-1 panels for H/θ would just become four-coloured.

### (F) Page-merge (probably too much)
Combine samples + roh into one bigger page. Would mean lots of vertical scrolling and lose the topic boundary. Recorded for completeness only — not recommended.

### (G) Mode-B / API-client integration
The new `shared/api_client.js` + `mode_b_badge.js` machinery suggests an upcoming "live mode" where the atlas pulls from a backend dispatcher rather than the static JSON. When that lands, the integration could route through an action ("show me sample X's joint H / F_ROH / ROH-class breakdown") rather than client-side cross-page navigation. Worth keeping in mind so we don't build a client-side coupling that the action layer will then have to replace.

## 5. Open questions to resolve before this becomes a SPEC

1. **Which option(s) to ship.** (B) and (E) are probably the highest value at lowest cost; (C) and (D) add real new science; (A) is the cheapest but adds the least.
2. **Single-page or cross-page coupling.** Do we keep the samples / roh page split (cross-link them more tightly) or do we promote the linkage to a third page that overlays both? The page-rename refactor that just landed suggests pages are stabilising on a one-topic-per-page model, which argues for cross-link rather than merge.
3. **How to surface `ρ(H, F_ROH)` as a visual.** A real scatter? The existing six-plot bank on samples already includes an H × F_ROH scatter — but it doesn't carry the ρ value as a label or a fitted line. Trivial fix.
4. **F_ROH × F_HOM cross-check threshold for flagging.** When option (C) ships, what counts as "discordant"? `|F_HOM − F_ROH| > some_constant`? Or quantile-based (top-decile deviation from the diagonal)?
5. **Per-page-contract impact.** Both pages have `PAGE_CONTRACT.md` files now (`docs/generated/page_contracts/samples/`, `…/roh/`). Any cross-page coupling needs to be declared in both contracts.
6. **Cross-atlas implications.** Population Atlas owns ancestry (K=8) and family structure; an H/F_ROH cross-check on samples may surface Wahlund effects that hint at population-structure questions better answered there. Decide where each diagnostic lives.

## 6. Why this is parked (not built)

- User explicitly said *"I am not sure"* — the form of integration is open.
- The new `samples.{html,js}` / `roh.{html,js}` files have just been refactored on `origin/main` (page-rename); building integration on top of them right now risks colliding with whatever the contract-driven page-architecture round does next.
- The cohort `ρ(H, F_ROH) = −0.70` finding (round-3 interp tooltip) is the strongest existing evidence that the integration is worth doing, but the actual cross-pivot UX needs a design session.

When a future session picks this up:
1. Pick one of (A)–(E) (probably (B) + (E) together — cheap, highest information density).
2. Confirm the page-contract format can express cross-page coupling.
3. Upgrade this `IDEA_*.md` to a `SPEC_*.md` and proceed via the same `AskUserQuestion` resolution flow round-3 used.
