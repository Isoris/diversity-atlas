# MISSING_DATA — diversity atlas

**Snapshot date:** 2026-05-20
**Scope:** what's on disk under `E:/results_diversity/` vs. what the
diversity atlas's `data_loader.js` + `dt_*` aliases (per
`_handoff_docs/DATA_PROVENANCE.md` §2) expect.

Companion to the IN/OUT JSON adapters added today
(`atlases/diversity/registries/data/layers.registry.json`,
`extractors.registry.json`, `actions.registry.json`). Layers that point
at empty roots carry `disabled: true` so the registry skips them silently
instead of spamming 404s — flip the flag when the upstream pipeline
ships.

---

## 1. SAF binaries (`01_saf_per_sample/`) — partially mirrored

**On disk:** 226 `.arg` files (ANGSD command-line logs).
**Missing:** the actual SAF binaries — `<sample>.saf.idx`,
`<sample>.saf.gz`, `<sample>.saf.pos.gz` for each of the 226 samples.

These live on the LANTA cluster but were not copied to
`E:/results_diversity/01_saf_per_sample/`.

**Impact on adapters:**
- `samples_saf_arg` layer works (reads `.arg` only).
- `run_realsfs` action (planned) cannot be executed locally — its schema
  is committed but the runner module is stubbed pending the binaries.
- Browser-triggered SFS recompute (e.g. for an arbitrary sample subset)
  blocked.

**Unblock by:** copying the SAF triples from LANTA, or by running ANGSD
on LANTA and exposing the result via the diversity sidecar endpoint.

---

## 2. ROH pipeline output (`04_roh/`) — EMPTY

**On disk:** nothing.
**Expected per `DATA_PROVENANCE.md` §2.3:** the
`catfish-diversity-analysis / 04_roh_summary/` substrate that feeds:

| Atlas alias (`dt_*`) | What it carries |
|---|---|
| `D.S1` (F_ROH columns) | Per-sample ROH count + total F_ROH |
| `D.S4`                 | Per-chromosome F_ROH per sample |
| `D.S8`                 | ROH length-class bins (counts + bp per class) |
| `D.S8b`                | Per-chrom × per-sample F_ROH heatmap |
| `D.S8c_long`           | Individual ROH tracts ≥ 1 Mb |
| `D.S12`, `D.S12_summary` | Per-sample het in/out ROH ratios |

**Impact on adapters:**
- Three layers (`samples_roh_per_sample`, `cohort_froh_per_chrom`,
  `cohort_roh_length_bins`) and their files entries are declared with
  `disabled: true`.
- `samples_roh_per_sample_v1` extractor + schema are written in advance.
- Pages 5, 6 still render today only because `embedded_tables.json` was
  hand-carved from the manuscript. Once the pipeline ships, the carve
  for those columns can be retired.

**Unblock by:** running the ROH workflow (`bcftools roh` or
ngsF-HMM-derived ROH calls) and emitting either:
- `04_roh/per_sample/<sample>.roh.tsv` (preferred),
- `04_roh/per_chrom/froh_per_sample_per_chrom.tsv`,
- `04_roh/per_sample/length_class_bins.tsv`,
- or the catfish-diversity-analysis canonical layout per its README.

---

## 3. Aggregated cross-module rollups (`05_aggregated/`) — EMPTY

**On disk:** nothing.
**Expected per `DATA_PROVENANCE.md`:** the cross-module master joins —
`09_final_tables/` per SD6, repackaged into `05_aggregated/` per the
new on-disk layout.

| Target table | What it carries |
|---|---|
| `samples_master.tsv`       | Per-sample H + F_ROH + K=8 label + ngsF-HMM convergence (the canonical replacement for the entire `D.S1`) |
| `per_chromosome_master.tsv` | Per-sample × per-chrom F_ROH + θπ + Tajima's D (replacement for `D.S4` once written) |
| `cohort_theta_pi_<scale>.tsv` | Cross-sample θπ aggregates at the four pre-baked scales |

**Impact on adapters:**
- `cohort_master_samples` and `cohort_master_per_chrom` layers declared
  with `disabled: true`.
- `aggregate_pi` action (planned) — schema committed; runner pending.

**Unblock by:** writing a small joiner that pulls
`02_heterozygosity/04_summary/genomewide_heterozygosity.tsv` +
(once present) `04_roh/per_sample/<sample>.roh.tsv` +
ngsF-HMM convergence into one master TSV under `05_aggregated/`.

---

## 4. ngsF-HMM domain (`03_ngsF_HMM/`) — NOT PRESENT

**On disk:** the folder does not exist under `E:/results_diversity/`.
**Expected per `DATA_PROVENANCE.md` §2.3:** ngsF-HMM convergence per
sample, which feeds `D.SZ`.

**Impact on adapters:**
- No layer declared (the registry doesn't pre-declare layers for roots
  that don't exist; add when the substrate lands).
- `master_config.yaml` has no `diversity_ngsf_hmm` root — add one
  pointing at the pipeline's output dir before declaring layers.

**Unblock by:** running ngsF-HMM and mirroring its
convergence-per-sample TSV; then add a `diversity_ngsf_hmm` root +
matching layer entries.

---

## 5. Per-chromosome KW + K-sweep + Q×H residuals

**Per `DATA_PROVENANCE.md` §2.3, `08_stats/` is the canonical home for:**

| Atlas alias | Status |
|---|---|
| `D.S5_kw`    | ✅ Substrate present at `02_heterozygosity/05_ancestry_heterozygosity/tables/kruskal_K{K}_{cohort}.tsv`. Wired via `ancestry_het_kruskal` layer. |
| `D.S5_pair`  | ✅ Wired via `ancestry_het_pairwise_wilcox` / `ancestry_het_pairwise_ttest`. |
| `D.S6`       | ❌ NOT PRESENT — per-chromosome KW tests are not in the listing. Need to be written to `05_ancestry_heterozygosity/tables/kruskal_per_chrom_*.tsv` or similar. |
| `D.S7`       | ✅ Wired via `ancestry_het_kruskal_all` (K-sweep trajectory). |
| `D.S10`      | ✅ Closest substrate is `ancestry_het_q_correlations` (per-Q × H Spearman). |

**Impact on adapters:** S5_kw / S5_pair / S7 / S10 readers can swap to
the new layers; S6 still needs to be authored upstream before a layer
can be wired.

---

## 6. Manuscript-only tables (by design)

Per `DATA_PROVENANCE.md` §2.3, the following `dt_*` blobs are authored
in the manuscript / methods notebook, not emitted by any pipeline.
They live in the manuscript repo (or a methods-only repo) and are copied
into `embedded_tables.json` manually:

| Alias | What it carries |
|---|---|
| `D.S2` | Per-sample pairwise relatedness summary |
| `D.S3` | Spearman correlation matrix between QC metrics |
| `D.S9` | K=8 cluster colour palette + centroids |
| `D.S11` | NAToRA pruning table (retained 81 / removed 145) |
| `D.SD1` – `D.SD8` | Pipeline-step inventory, ANGSD parameters, window scales, ROH bin scheme, design decisions, output dirs, canonical outputs, software manifest |
| `D.globals` | Cohort headline numbers (N, genome-wide θπ mean, K=8, etc.) |
| `D.REF` / `D.REF_meta` | Bibliography / external references |

**Impact on adapters:** none — these are *not* candidates for the
extractor pattern. They remain inside `embedded_tables.json`. If they
ever migrate to TSVs in a manuscript-tables repo, declare them with the
existing `extract_tsv_passthrough_v1` extractor.

---

## 7. Optional payloads (round-2 / round-3) — STILL STUBS, NOW REGISTERED

Per `DATA_PROVENANCE.md` §3, four optional JSONs are loaded in parallel
with the bulk snapshot. All four currently ship empty:

| File | Page | Spec | Upstream owner | Layer key |
|---|---|---|---|---|
| `data/texture_metrics.json`     | `texture`   | `data_loader.js` header + `DATA_PROVENANCE.md` §3.1 | `catfish-diversity-analysis / phase_2_discovery / 04_window_H_and_DDI.sh` | `texture_metrics_payload` |
| `data/functional_burden.json`   | `burden`    | `SPEC_2026-05-12_functional_burden.md` §4 + §12 + §13 + §14 | proposed `11_functional_burden/` (csq + snpEff + VESM + splice) | `functional_burden_payload` |
| `data/roh_gene_overlap.json`    | `roh` (ext) | `SPEC_2026-05-12_roh_gene_burden.md` §3 + §4 | `catfish-diversity-analysis` ROH × gene-model intersection | `roh_gene_overlap_payload` |
| `data/divergence_network.json`  | `divergence`| `SPEC_2026-05-12_divergence_network.md` §4 | proposed `catfish-diversity-analysis / phase_3_pairwise/02_group_divergence.sh` | `divergence_network_payload` |

**Wiring change (2026-05-20):** all four now have layer entries in
`layers.registry.json` §8 plus typed `schema_out` files at
`registries/schemas/<key>_v1.schema.json`. They are still loaded today
by `shared/data_loader.js` directly (path `data/<file>.json`), but a
future page-side migration can swap `ctx.WIN_METRICS` →
`registry.resolve('texture_metrics_payload')` without changing the file
location. The schemas are marked `schema_status: draft` — flip to
`validated` when the upstream pipelines emit non-stub payloads.

Per-variant MSA SVGs at `data/msa/<variant_id>.svg`
(`SPEC_2026-05-12_functional_burden.md` §14) are also not yet produced.
The matching layer (`msa_svg`, format=binary, `path: data/msa/{variant_id}.svg`)
is registered so the page-side resolver can ask for the SVG by
variant_id; `functional_burden_payload.msa_links[variant_id]` provides
the cross-reference once payloads land.

---

## 7a. Cross-atlas pointer — pairwise_segclass

`_handoff_docs/SPEC_2026-05-12_pairwise_segclass.md` describes a
pairwise θπ-in-het-inversion-vs-collinear-segments view. Per Spec §6
(cohort-boundary table), this is **owned by population-atlas, not
diversity-atlas** — per-pair metrics are structurally a Population Atlas
concern. NOT registered here. When the upstream catfish-population-analysis
step lands (`phase_3_pairwise/05_pairwise_theta_segclass.sh`), the
population-atlas should declare:

- Layer: `pairwise_segclass_payload`, source: file,
  `path: data/pairwise_segclass.json`, schema:
  `pairwise_segclass_v1.schema.json` (derive shape from
  SPEC_2026-05-12_pairwise_segclass.md §3).
- Cross-link: diversity-atlas `texture` page's sample-detail panel
  may eventually deep-link into the population-atlas pairwise scatter
  filtered to that sample's pairs (Spec §6 footnote).

---

## 8. Summary table — what wires today

| Domain | Root on disk | Layer entries | Disabled? |
|---|---|---|---|
| Per-sample H + SFS | `02_heterozygosity/` | `samples_genomewide_het`, `samples_sfs`, `samples_single_boxplot_input` | no |
| Per-K stratified H (×2 cohorts × 11 K) | `02_heterozygosity/05_ancestry_heterozygosity/` | 16 layers (`ancestry_het_*`) | no |
| Per-sample θπ at 4 scales | `03_theta_pi/` | `samples_theta_pi_pestpg`, `samples_theta_pi_arg` | `_arg` disabled (no paired `.arg` files) |
| SAF logs | `01_saf_per_sample/` | `samples_saf_arg` | no |
| ROH | `04_roh/` | `samples_roh_per_sample`, `cohort_froh_per_chrom`, `cohort_roh_length_bins` | yes — root empty |
| Aggregated | `05_aggregated/` | `cohort_master_samples`, `cohort_master_per_chrom` | yes — root empty |
| ngsF-HMM | (no root) | (none — add `diversity_ngsf_hmm` root first) | n/a |
| Spec-driven payloads | `data/<file>.json` | `texture_metrics_payload`, `functional_burden_payload`, `roh_gene_overlap_payload`, `divergence_network_payload`, `msa_svg` | no — but all stubs; schema_status=draft |

---

## 9. What to do next

1. **Wire pages off Mode B** — convert the existing `data_loader.js`
   reads of `D.S1.het_genomewide` → `registry.resolve('samples_genomewide_het')`
   one page at a time, with the manuscript carve as the fallback. Page
   `samples` is the cleanest first target.
2. **Author the Python extractor parsers** under
   `atlases/diversity/registries/extractors/` (the JSON adapters
   reference them but the modules are not yet written):
   - `genomewide_het.py` (`extract`)
   - `sfs_ml.py` (`extract`)
   - `pestpg.py` (`extract`)
   - `tsv_table.py` (`extract`)
   - `roh_per_sample.py` (`extract`) — once §2 unblocks.
3. **Author the harvest runner** at
   `atlases/diversity/registries/runners/harvest_file.py` to glue
   layer_key → on-disk path → raw_results capture → extractor dispatch.
4. **Backfill the missing roots** per §2, §3, §4 above and flip the
   `disabled: true` flags on the matching layer entries.
5. **Add a `data_version` field** to `embedded_tables.json` as
   recommended in `DATA_PROVENANCE.md` §6.2 so the atlas can warn when
   a Mode B layer disagrees with a Mode A carve.
