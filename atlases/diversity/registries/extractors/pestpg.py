"""extractor: theta_pi_pestpg_v1 — per-window θπ + Tajima's D.

Reads an ANGSD doThetaStat `{sample}.win{N}.step{M}.pestPG` TSV. The
first line is an annotation row (`#(indexStart...)`) which the extractor
skips. Column shape (canonical):

    Chr  WinCenter  tW  tP  tF  tH  tL  Tajima  fuf  fud  fayh  zeng  nSites

Emit:

    { sample_id, win_bp, step_bp,
      windows: [{ chrom, win_center, tW, tP, tajima, n_sites }],
      summary: { n_windows, mean_pi, median_pi, max_tajima, min_tajima },
      _provenance: { source_path, parsed_at, row_count } }
"""
from __future__ import annotations
import json
import math
import pathlib
import re
from typing import Any, Dict, List
from . import _tsv as T


_FILENAME_RE = re.compile(
    r"^(?P<sample_id>[A-Za-z]+[0-9]+)\."
    r"win(?P<win_bp>\d+)\.step(?P<step_bp>\d+)\.pestPG$"
)


def _args_from(raw_outputs: Dict[str, str], filename: str) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    args_json = raw_outputs.get("args_json")
    if args_json:
        try:
            out.update(json.loads(args_json))
        except (json.JSONDecodeError, TypeError):
            pass
    m = _FILENAME_RE.match(filename)
    if m:
        out.setdefault("sample_id", m.group("sample_id"))
        out.setdefault("win_bp",    int(m.group("win_bp")))
        out.setdefault("step_bp",   int(m.group("step_bp")))
    return out


def extract(raw_outputs: Dict[str, str], params: Dict[str, Any]) -> Dict[str, Any]:
    path = pathlib.Path(raw_outputs["file_path"])
    # NB: the pestPG file's first line starts with '#(indexStart...' but it
    # IS the header row — its first cell is a junk label, the remaining
    # tab-separated cells are the real column names (Chr, WinCenter, tW,
    # tP, ...). Do NOT skip it as a comment, or every downstream row loses
    # its column keys. The caller can still pass comment_prefix to skip
    # lines that match (defaults to None — no skipping).
    comment_prefix = params.get("comment_prefix")

    _, rows = T.read_tsv(
        path,
        has_header=True,
        comment_prefix=comment_prefix,
        infer_types=True,
    )

    windows: List[Dict[str, Any]] = []
    pi_values: List[float] = []
    tajimas: List[float] = []
    for r in rows:
        chrom = r.get("Chr")
        if chrom is None:
            continue
        win_center = r.get("WinCenter")
        tP = r.get("tP")
        tW = r.get("tW")
        tajima = r.get("Tajima")
        n_sites = r.get("nSites")
        windows.append({
            "chrom":      str(chrom) if chrom is not None else None,
            "win_center": int(win_center) if isinstance(win_center, (int, float)) else None,
            "tW":         tW if isinstance(tW, (int, float)) else None,
            "tP":         tP if isinstance(tP, (int, float)) else None,
            "tajima":     tajima if isinstance(tajima, (int, float)) else None,
            "n_sites":    int(n_sites) if isinstance(n_sites, (int, float)) else None,
        })
        if isinstance(tP, (int, float)) and isinstance(n_sites, (int, float)) and n_sites:
            pi_values.append(tP / n_sites)
        if isinstance(tajima, (int, float)) and not math.isnan(tajima):
            tajimas.append(tajima)

    fa = _args_from(raw_outputs, path.name)

    return {
        "sample_id": fa.get("sample_id", ""),
        "win_bp":    int(fa.get("win_bp") or params.get("win_bp") or 0),
        "step_bp":   int(fa.get("step_bp") or params.get("step_bp") or 0),
        "windows":   windows,
        "summary": {
            "n_windows":  len(windows),
            "mean_pi":    T.mean(pi_values),
            "median_pi":  T.median(pi_values),
            "max_tajima": max(tajimas) if tajimas else None,
            "min_tajima": min(tajimas) if tajimas else None,
        },
        "_provenance": {
            "source_path": raw_outputs.get("source_rel", str(path)),
            "parsed_at":   T.now_iso_z(),
            "row_count":   len(windows),
        },
    }
