"""extractor: samples_roh_per_sample_v1 — per-sample ROH segment list.

The diversity_roh root is EMPTY ON DISK as of 2026-05-20 (see
_handoff_docs/MISSING_DATA.md §2). This extractor is written defensively
so the wiring is ready when the pipeline ships.

Expected source columns (TSV with header):
  sample_id, chrom, start_bp, end_bp, length_bp, n_sites, quality

Emit:

    { sample_id, segments: [{ chrom, start_bp, end_bp, length_bp, n_sites, quality }],
      summary: { n_segments, total_bp, longest_bp, n_segments_gt_1mb },
      _provenance: { source_path, parsed_at, row_count } }
"""
from __future__ import annotations
import json
import pathlib
from typing import Any, Dict, List
from . import _tsv as T


_LONG_ROH_BP = 1_000_000


def _sample_id_from(raw_outputs: Dict[str, str], rows: List[Dict[str, Any]]) -> str:
    args_json = raw_outputs.get("args_json")
    if args_json:
        try:
            args = json.loads(args_json)
            if args.get("sample_id"):
                return args["sample_id"]
        except (json.JSONDecodeError, TypeError):
            pass
    if rows and isinstance(rows[0].get("sample_id"), str):
        return rows[0]["sample_id"]
    return ""


def extract(raw_outputs: Dict[str, str], params: Dict[str, Any]) -> Dict[str, Any]:
    path = pathlib.Path(raw_outputs["file_path"])
    _, rows = T.read_tsv(path, has_header=True, infer_types=True)

    segments: List[Dict[str, Any]] = []
    for r in rows:
        chrom = r.get("chrom")
        start = r.get("start_bp")
        end   = r.get("end_bp")
        if chrom is None or start is None or end is None:
            continue
        length = r.get("length_bp")
        if not isinstance(length, (int, float)):
            try:
                length = int(end) - int(start)
            except (TypeError, ValueError):
                length = None
        seg: Dict[str, Any] = {
            "chrom":     str(chrom),
            "start_bp":  int(start),
            "end_bp":    int(end),
            "length_bp": int(length) if isinstance(length, (int, float)) else 0,
        }
        if "n_sites" in r: seg["n_sites"] = r["n_sites"]
        if "quality" in r: seg["quality"] = r["quality"]
        segments.append(seg)

    total_bp = sum(s["length_bp"] for s in segments)
    longest_bp = max((s["length_bp"] for s in segments), default=0)
    n_long = sum(1 for s in segments if s["length_bp"] >= _LONG_ROH_BP)

    return {
        "sample_id": _sample_id_from(raw_outputs, rows),
        "segments":  segments,
        "summary": {
            "n_segments":        len(segments),
            "total_bp":          total_bp,
            "longest_bp":        longest_bp,
            "n_segments_gt_1mb": n_long,
        },
        "_provenance": {
            "source_path": raw_outputs.get("source_rel", str(path)),
            "parsed_at":   T.now_iso_z(),
            "row_count":   len(segments),
        },
    }
