# DATA PROVENANCE — Diversity Atlas

**Doc type:** living reference (not dated; not a handoff for a single round).
**Question this doc answers:** *for any number, plot, or table you see on a
diversity-atlas page, where does that value come from?*

> ## Note on the current state (2026-05-12)
>
> Right now **every value the atlas displays is carved from inlined JSON
> blocks in the legacy `Diversity_atlas.html` v2.4 single-file**, which
> were themselves prepared from **Table 3 of the manuscript plus its
> supplementary tables**. This is acknowledged to be the wrong long-term
> design — the atlas should eventually read from canonical pipeline
> outputs in `catfish-diversity-analysis` / `genome-atlas` directly — but
> it is the round-1 reality. This doc maps the current carve and flags
> the upstream owners so a future session can wire the pipelines
> directly when time allows.

---

## 1. The two-layer data model

Every page reads through `atlases/diversity/shared/data_loader.js → ensureData()`,
which fetches up to five JSON files in parallel and exposes them on a
single `ctx` object:

| Layer | File | Required? | Failure mode |
|---|---|---|---|
| 1. **Bulk snapshot** | `data/embedded_tables.json` | ✅ required | `ensureData()` throws → page mount fails |
| 2. **Optional payloads** | `data/texture_metrics.json` | optional | `ctx.WIN_METRICS = null` |
| | `data/functional_burden.json` | optional | `ctx.FUNCTIONAL_BURDEN = null` |
| | `data/roh_gene_overlap.json` | optional | `ctx.ROH_GENE_OVERLAP = null` |
| | `data/divergence_network.json` | optional | `ctx.DIVERGENCE_NETWORK = null` |
| 3. **Per-variant assets** | `data/msa/<variant_id>.svg` | optional | page-10 MSA panel renders "no MSA available" |

Optional payloads with a `null` resolution → the consuming page detects
the absence (via `hasTexture()`, `hasBurden()`, `hasNetwork()`, etc.) and
renders a "data pending" fallback card. Pages 1–8 do not depend on any
optional payload and are immune.

---

## 2. The bulk snapshot — `embedded_tables.json`

### 2.1 Lineage

```
Manuscript Table 3 + supplementary tables (ST1-ST5, SD1-SD8, S1-S12, SZ, REF)
   │
   │   (manual extraction during legacy v2.4 build, late April 2026)
   ▼
Diversity_atlas.html v2.4   ← 2.5 MB single-file, 37 inlined <script type="application/json"> blocks
   │
   │   (programmatic carve during round-1 migration)
   ▼
data/embedded_tables.json
   │
   │   (data_loader.js renames each dt_* key to a short alias)
   ▼
ctx.D.{globals, S1, S2, ..., ST5, SD1, ..., REF}
```

The original `Diversity_atlas.html` is still in the repo root, kept as
the carve source-of-truth. If you ever need to know what value *should*
appear in a particular cell, that monolith is the ground-truth reference.

### 2.2 The 37 `dt_*` blobs and their aliases

(Aliases live in `data_loader.js:25-63`.)

| `dt_*` key in JSON | Alias in `ctx.D` | What it is |
|---|---|---|
| `dt_globals` | `D.globals` | Cohort headline numbers (N samples, genome-wide θπ mean, K=8, etc.) |
| `dt_S1` | `D.S1` | **Per-sample master table** (one row per 226 samples: H, F_ROH, K=8 label, ROH counts) |
| `dt_S2` | `D.S2` | Per-sample pairwise relatedness summary |
| `dt_S3` | `D.S3` | Spearman correlation matrix between QC metrics |
| `dt_S4` | `D.S4` | Per-chromosome F_ROH per sample |
| `dt_S5_kw` | `D.S5_kw` | Kruskal–Wallis tests of F_ROH/H by K=8 |
| `dt_S5_pairwise` | `D.S5_pair` | Pairwise post-hoc tests between K=8 groups |
| `dt_S6` | `D.S6` | Per-chromosome KW tests |
| `dt_S7` | `D.S7` | K-sweep KW trajectory (K=2 to K=12) |
| `dt_S8` | `D.S8` | ROH length-class bins (counts + bp per class) |
| `dt_S8b` | `D.S8b` | Per-chrom × per-sample F_ROH heatmap data |
| `dt_S8c_long` | `D.S8c_long` | Individual ROH tracts ≥ 1 Mb (subset of full 681k-row set) |
| `dt_S9` | `D.S9` | K=8 cluster colour palette + centroids |
| `dt_S10` | `D.S10` | Q-vector × heterozygosity Spearman ρ |
| `dt_S11` | `D.S11` | NAToRA pruning table (retained 81 / removed 145) |
| `dt_S12` | `D.S12` | Per-sample het in/out ROH ratios |
| `dt_S12_summary` | `D.S12_summary` | Cohort median ratio + Q05 from S12 |
| `dt_SZ` | `D.SZ` | ngsF-HMM convergence per sample |
| `dt_ST1` | `D.ST1` | Per-chromosome θπ at 500 kb window |
| `dt_ST2` | `D.ST2` | Per-sample θπ summary stats |
| `dt_ST3` | `D.ST3` | 19 θπ outlier windows (top 1 %) |
| `dt_ST3b` | `D.ST3b` | Per-sample × per-window θπ heatmap data |
| `dt_M3_SD1_pipeline_steps` | `D.SD1` | Pipeline-step inventory |
| `dt_M3_SD2_angsd_parameters` | `D.SD2` | ANGSD command-line parameter table |
| `dt_M3_SD3_window_scales` | `D.SD3` | The four window scales used (50 kb, 500 kb, 1 Mb, chrom) |
| `dt_M3_SD4_roh_bin_scheme` | `D.SD4` | ROH length-class definitions (1-2Mb, 2-4Mb, …, >16Mb) |
| `dt_M3_SD5_design_decisions` | `D.SD5` | Design-decision rationale table |
| `dt_M3_SD6_output_directories` | `D.SD6` | **Pipeline output-directory layout** (the `01_inputs_check/` through `10_report/` tree) |
| `dt_M3_SD7_canonical_outputs` | `D.SD7` | Canonical output-file naming scheme |
| `dt_M3_SD8_software` | `D.SD8` | Software / version manifest |
| `dt_S4b` / `dt_S4b_meta` | `D.S4b` / `D.S4b_meta` | Optional per-chrom × per-K F_ROH heatmap |
| `dt_ST4_meta` | `D.ST4_meta` | Metadata for a not-yet-shipped ST4 table |
| `dt_ST5` / `dt_ST5_meta` | `D.ST5` / `D.ST5_meta` | Cross-atlas reference table |
| `dt_REF` / `dt_REF_meta` | `D.REF` / `D.REF_meta` | Bibliography / external references |

### 2.3 Upstream owner of each `dt_*` (where the values *should* come from)

Per `D.SD6` (the output-directory map), the canonical pipeline outputs
in `catfish-diversity-analysis` should feed each `dt_*` as follows:

```
catfish-diversity-analysis output tree:
  01_inputs_check/    ─→ feeds (nothing in atlas — pre-flight)
  02_heterozygosity/  ─→ ST1, ST2, S1 (the H / θπ columns)
  03_ngsF_HMM/        ─→ SZ
  04_roh_summary/     ─→ S1 (the F_ROH / ROH-count columns), S4, S8, S8b, S8c_long, S12, S12_summary
  05_inversion_support/  ─→ (consumed by Inversion Atlas; nothing here)
  06_plots_core/      ─→ (figure outputs; not used by atlas — atlas re-renders)
  07_plots_metadata/  ─→ (figure outputs; not used by atlas)
  08_stats/           ─→ S5_kw, S5_pair, S6, S7, S10
  09_final_tables/    ─→ S1 (master join), S4 (per-chrom master join)
  10_report/          ─→ (markdown; not used by atlas)

Methods-side tables (SD1-SD8, S2, S3, S9, S11, globals) are authored
in the manuscript / methods notebook rather than emitted by a pipeline
step. They live in the manuscript repo (or a methods-only repo) and are
copied into the carve manually.
```

### 2.4 How `embedded_tables.json` gets refreshed today

**There is no automated refresh.** A manual export step is performed
when the pipeline produces new numbers:

1. Run the pipeline (`catfish-diversity-analysis` MODULE_3, steps
   A01 → A04 → B01).
2. Open `09_final_tables/` and the manuscript notebook.
3. Either (a) regenerate `Diversity_atlas.html` v2.5+ with new inlined
   JSON blocks, then re-carve, or (b) hand-edit
   `embedded_tables.json` and re-validate against the schema implicit
   in `data_loader.js`'s ALIAS map.

**This is the wrong long-term design.** The right design is:
- pipeline writes `09_final_tables/*.csv` (or `.json`) at canonical paths;
- the atlas's `data_loader.js` fetches each `dt_*`-equivalent file
  individually (with versioning and integrity checks via the
  `files.registry.json`);
- the legacy single-file is retired or kept only as a print-ready archive.

That migration is **not in scope** for any current round and is flagged
here so a future session can pick it up.

---

## 3. Optional payloads — one per pending pipeline product

Each of these is fetched in parallel with the bulk snapshot. They were
introduced to keep new round work decoupled from the manual carve.

### 3.1 `texture_metrics.json` — page 9 (DDI / χ_min)

| | |
|---|---|
| Spec | n/a — schema documented in `shared/data_loader.js` comments + `pages/per_sample/page9.html` |
| Status | round-2 stub (empty) |
| Schema (top level) | `params{}`, `cohort_summary{}`, `per_sample[]`, `windows{ chroms[], cohort_median_H_w[], cohort_q25_H_w[], cohort_q75_H_w[] }`, `per_sample_H_w{ sample_id: [H_w per window] }` |
| Upstream owner | `catfish-diversity-analysis / phase_2_discovery / 04_window_H_and_DDI.sh` (to be written) |
| Upstream substrate | per-sample ANGSD `${SAMPLE}.win50000.step50000.pestPG` |
| Consumes | page 9 (in full); future cross-integration into page 1's master table column (DDI, χ_min) and page 4 (DDI per-K rollup) |
| Estimated size | ~25 MB at 50 kb windows × 226 samples |

### 3.2 `functional_burden.json` — page 10 (functional burden)

| | |
|---|---|
| Spec | `_handoff_docs/SPEC_2026-05-12_functional_burden.md` §4 |
| Status | round-3 stub (empty) |
| Schema (top level) | `cohort_summary{}`, `variant_inventory[]`, `snpeff_totals[]`, `gerp_inventory[]` (off by default), `per_sample[]`, `per_group['K=8'][]`, `pairwise_ks{}`, `alternative_stratifications{}`, `top_burden_genes_by_group{}`, `transcripts{}`, `splice_events[]`, `msa_links{}` |
| Upstream stack | bcftools csq + snpEff + VESM + custom splice module (`SPEC_2026-05-12_functional_burden.md` §6.5) |
| Upstream owner | `catfish-diversity-analysis` — new step (proposed `A05 / 11_functional_burden/`) |
| Dependencies | annotated VCF, 0/4-fold partition (CDS-aware), VESM scores per site, splice-effect calls |
| Cross-atlas deps | gene model + CDS FASTA from `genome-atlas`; ortholog table for the §14 MSA panel |
| Consumes | page 10 (in full); inversion-atlas per-candidate overlay reads the same payload's `alternative_stratifications.karyotype` slice |

### 3.3 `roh_gene_overlap.json` — page 5 extension

| | |
|---|---|
| Spec | `_handoff_docs/SPEC_2026-05-12_roh_gene_burden.md` §4 |
| Status | round-3 stub (empty) |
| Schema (top level) | `blocks[]` (per-block `{ gene_ids[], biotype, constraint_score }`), `peaks[]` (named ROH peaks with `biotype_counts`), `per_group_cumulative['K=8'][]`, `per_family_cumulative[]`, `per_quartile_cumulative[]` |
| Upstream owner | `catfish-diversity-analysis` (ROH × gene-model intersection) + `genome-atlas` (gene model BED + biotype + constraint score) |
| Open dependency | **constraint proxy** (pLI analog) — `SPEC_2026-05-12_roh_gene_burden.md` §6.2 is still data-blocked: BUSCO / OrthoFinder / dN/dS / ohnolog / GERP ≥ 4 — pick one once the genome-atlas track lands |
| Consumes | page 5 (Plot A cumulative gene-burden card + Plot B biotype × peak heatmap-table) |

### 3.4 `divergence_network.json` — page 11 (group divergence)

| | |
|---|---|
| Spec | `_handoff_docs/SPEC_2026-05-12_divergence_network.md` §4 |
| Status | round-3 stub (empty) |
| Schema (top level) | `nodes[]` (`group, n_samples, pi, pi_ci`), `edges[]` (`group_i, group_j, fst, fst_ci, dxy, dxy_ci, dA, n_i, n_j`), `alternative_groupings{ farm, sex, "karyotype:<inv_id>" }` |
| Upstream owner | `catfish-diversity-analysis` (realSFS + bootstrap; proposed under `08_stats/` per SD6) |
| Open dependency | F<sub>ST</sub> estimator choice (Weir & Cockerham / Hudson / Reynolds) — pipeline-side, atlas reads whatever number is shipped (`SPEC_2026-05-12_divergence_network.md` §8.1) |
| Consumes | page 11 (in full) |

### 3.5 Per-variant MSA SVGs — `data/msa/<variant_id>.svg`

| | |
|---|---|
| Spec | `_handoff_docs/SPEC_2026-05-12_functional_burden.md` §14 |
| Status | not yet produced |
| Tool | [pyMSAviz](https://github.com/moshi4/pyMSAviz) (Python 3.9+, BSD) |
| Upstream owner | `catfish-diversity-analysis` (per-variant MSA pre-render) + ortholog table from `genome-atlas` |
| Window | ±30 aa around variant; catfish + 6–10 teleost orthologs (*Ictalurus, Danio, Oryzias, Oreochromis, Salmo, Gasterosteus*) |
| Estimated total size | ~0.3–0.6 MB for ~60 top-burden variants |
| Consumes | page 10 §14 MSA panel — `<img src="data/msa/<variant>.svg">` |

---

## 4. Per-page consumption map — *which page reads what*

| Page | File | Stage | Reads from `ctx.D` / `ctx.*` | Source repo when wired |
|---|---|---|---|---|
| 1 | `per_sample/page1` | per_sample | `D.globals, D.S1, D.S9, D.ST2` | catfish-diversity-analysis `04_roh_summary/` + `02_heterozygosity/` |
| 2 | `per_chromosome/page2` | per_chromosome | `D.ST1, D.S4, D.S6, D.SZ, D.globals` | `02_heterozygosity/` + `04_roh_summary/` + `08_stats/` + `03_ngsF_HMM/` |
| 3 | `per_chromosome/page3` | per_chromosome | `D.ST1, D.ST3, D.ST3b` | `02_heterozygosity/` |
| 4 | `stratified/page4` | stratified | `D.S5_kw, D.S5_pair, D.S9, D.S7, D.S10, D.S1, D.globals` | `08_stats/` + `04_roh_summary/` |
| 5 | `per_sample/page5` | per_sample | `D.S8, D.S8b, D.S1, D.S4, D.SD4, D.S12, D.S12_summary, D.S8c_long` + **`ctx.ROH_GENE_OVERLAP`** | `04_roh_summary/` + (extension) ROH × gene-model intersection |
| 6 | `qc/page6` | qc | `D.S11, D.SZ, D.S3, D.S1, D.S9, D.globals` | `04_roh_summary/` + `03_ngsF_HMM/` + methods tables |
| 7 | `meta/page7` | meta | `D.globals, D.SD1..D.SD8, D.S4b, D.S4b_meta, D.ST4_meta, D.ST5, D.ST5_meta, D.REF, D.REF_meta` | methods notebook (not pipeline) |
| 8 | `meta/page8` | meta | (static — no data reads) | — |
| 9 | `per_sample/page9` | per_sample | `D.S1, D.S9` + **`ctx.WIN_METRICS`** | `02_heterozygosity/` + new step `04_window_H_and_DDI.sh` |
| 10 | `functional/page10` | functional | `D.S1, D.S9` + **`ctx.FUNCTIONAL_BURDEN`** + `data/msa/*.svg` | new step proposed `11_functional_burden/` (csq + snpEff + VESM + splice) |
| 11 | `stratified/page11` | stratified | `D.S1, D.S9` + **`ctx.DIVERGENCE_NETWORK`** | proposed under `08_stats/` (realSFS + bootstrap) |

Optional-payload reads are **bold**. Every other read goes through the
required `embedded_tables.json`.

---

## 5. Proposed upstream subdirectory layout for the new round-3 payloads

This is a **proposal, not a decision**. SD6 currently goes 01-10; rounds
2-3 added payloads that don't have homes in the tree yet:

```
catfish-diversity-analysis output tree (proposed extensions):
  11_window_H_and_DDI/   (round 2) ─→ texture_metrics.json
  12_functional_burden/  (round 3) ─→ functional_burden.json
                                  ─→ msa/<variant_id>.svg
  13_roh_gene_overlap/   (round 3) ─→ roh_gene_overlap.json
                                      depends on:
                                      genome-atlas / gene_model.bed
                                      genome-atlas / constraint_proxy.tsv
                                      04_roh_summary/ ROH BEDs
  14_divergence_network/ (round 3) ─→ divergence_network.json
                                      (could alternatively land under 08_stats/)
```

Or — equally valid — fold them into the existing 08/04 directories. The
atlas only cares about the **final JSON sitting in `data/`**;
which step produces it is a pipeline-architecture decision.

---

## 6. What's still wrong with the current setup

Flagged here so a future session has a one-page summary of the
known-bad parts:

1. **Manual carve.** `embedded_tables.json` is hand-refreshed today.
   No CI, no integrity check, no schema validation against
   `data_loader.js`'s ALIAS map. A pipeline-side renumber or column
   rename will silently break the atlas.
2. **No version stamp inside the JSON.** Currently the only version
   marker is `manifest.json:atlas_version`. The bulk snapshot itself
   doesn't carry a `data_version` field — adding one (with the
   pipeline-run timestamp + git SHA of catfish-diversity-analysis at
   export time) would let a page warn if it's reading stale data.
3. **Mixed pipeline + manuscript provenance.** S2, S3, S9, S11, SD1-8,
   globals, REF all come from the manuscript notebook, not the
   pipeline. Combining them into one JSON makes it hard to refresh
   just the pipeline-side tables.
4. **No file-level checksums.** `files.registry.json` has the file
   list but no hash field. If a payload arrives truncated, every
   downstream page errors with a generic shape mismatch.
5. **MSA SVG paths are unversioned.** `msa_links[id] → "data/msa/X.svg"`
   has no schema for handling updated SVGs (same id, new pyMSAviz
   render). A `?v=<hash>` cache-buster would suffice.

None of (1)–(5) block any current round. They are the right
infrastructure work to do *once* the upstream pipelines actually emit
real payloads — premature now.

---

## 7. Quick checklist for a future session asking "where does this come from?"

```
1. Open the page in the running atlas, identify the visible value.
2. Open that page's pageN.js, find the line that displays the value.
3. Trace it back to ctx.D.<alias> or ctx.<OPTIONAL_PAYLOAD>.<field>.
4. Look up <alias> in data_loader.js's ALIAS map → dt_<key>.
5. For ctx.D.* values: open Diversity_atlas.html v2.4 and grep for
   "dt_<key>" — you'll find the inlined JSON block. Trace that block
   to its row in §2.3 of this doc to find the upstream pipeline owner.
6. For ctx.<OPTIONAL_PAYLOAD>.* values: open the relevant
   _handoff_docs/SPEC_*.md and look up the field in §4 (data schema).
   §3 of this doc has the upstream owner.
```
