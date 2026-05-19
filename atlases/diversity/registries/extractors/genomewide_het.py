"""extractor: samples_genomewide_het_v1 — per-sample genome-wide H.

Reads `genomewide_heterozygosity.tsv` (one row per sample) and emits:

    { samples: [{ sample_id, het_genomewide, n_sites_sfs, sfs_bin0, sfs_bin1 }],
      summary: { n_samples, mean_het, median_het, min_het, max_het },
      _provenance: { source_path, parsed_at, row_count } }

Column tolerances:
- `sample` or `sample_id` → sample_id
- `het_genomewide` | `H` | `het` → het_genomewide
- `n_sites_sfs` | `n_sites` → n_sites_sfs
- `sfs_bin0` | `bin0` → sfs_bin0
- `sfs_bin1` | `bin1` → sfs_bin1
"""
from __future__ import annotations
import pathlib
from typing import Any, Dict
from . import _tsv as T


_SYNS = {
    "sample":           "sample_id",
    "sample_id":        "sample_id",
    "het_genomewide":   "het_genomewide",
    "H":                "het_genomewide",
    "het":              "het_genomewide",
    "n_sites_sfs":      "n_sites_sfs",
    "n_sites":          "n_sites_sfs",
    "sfs_bin0":         "sfs_bin0",
    "bin0":             "sfs_bin0",
    "sfs_bin1":         "sfs_bin1",
    "bin1":             "sfs_bin1",
}


def extract(raw_outputs: Dict[str, str], params: Dict[str, Any]) -> Dict[str, Any]:
    path = pathlib.Path(raw_outputs["file_path"])
    _, rows = T.read_tsv(path, has_header=True, infer_types=True)

    samples = []
    for r in rows:
        norm: Dict[str, Any] = {}
        for raw_k, v in r.items():
            k = _SYNS.get(raw_k, raw_k)
            if k in ("sample_id", "het_genomewide", "n_sites_sfs", "sfs_bin0", "sfs_bin1"):
                norm[k] = v
        if "sample_id" in norm:
            samples.append(norm)

    het_vals = [s["het_genomewide"] for s in samples if isinstance(s.get("het_genomewide"), (int, float))]
    summary = {
        "n_samples":  len(samples),
        "mean_het":   T.mean(het_vals),
        "median_het": T.median(het_vals),
        "min_het":    min(het_vals) if het_vals else None,
        "max_het":    max(het_vals) if het_vals else None,
    }
    return {
        "samples": samples,
        "summary": summary,
        "_provenance": {
            "source_path": raw_outputs.get("source_rel", str(path)),
            "parsed_at":   T.now_iso_z(),
            "row_count":   len(samples),
        },
    }
