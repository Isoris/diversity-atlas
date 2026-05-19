"""extractor: sample_sfs_v1 — per-sample folded 1-D SFS.

Reads `{sample}.est.ml` — `realSFS -fold 1` writes two whitespace-
separated values (bin0, bin1) on a single line (sometimes with a
trailing newline). Emits:

    { sample_id, bins: [bin0, bin1], folded: true,
      h: bin1 / (bin0 + bin1),
      n_sites: bin0 + bin1,
      _provenance: { source_path, parsed_at } }
"""
from __future__ import annotations
import json
import pathlib
import re
from typing import Any, Dict, List
from . import _tsv as T


_SAMPLE_FROM_FILENAME_RE = re.compile(r"^([A-Za-z]+[0-9]+)\.")


def _sample_id_from(raw_outputs: Dict[str, str], filename: str) -> str:
    # Prefer the args_json passed by harvest_file.
    args_json = raw_outputs.get("args_json")
    if args_json:
        try:
            args = json.loads(args_json)
            if args.get("sample_id"):
                return args["sample_id"]
        except (json.JSONDecodeError, TypeError):
            pass
    # Fall back to filename parsing (CGA009.est.ml → CGA009).
    m = _SAMPLE_FROM_FILENAME_RE.match(filename)
    return m.group(1) if m else ""


def extract(raw_outputs: Dict[str, str], params: Dict[str, Any]) -> Dict[str, Any]:
    path = pathlib.Path(raw_outputs["file_path"])
    text = path.read_text(encoding="utf-8").strip()
    if not text:
        raise ValueError(f"{path}: empty SFS file")

    # First non-blank, non-comment line.
    first_line = next((ln for ln in text.splitlines() if ln.strip() and not ln.startswith("#")), "")
    tokens = first_line.split()
    if len(tokens) < 2:
        raise ValueError(
            f"{path}: expected at least 2 whitespace-separated values, got {len(tokens)}"
        )

    bins: List[float] = [float(tokens[0]), float(tokens[1])]
    total = bins[0] + bins[1]
    h = (bins[1] / total) if total > 0 else None

    return {
        "sample_id": _sample_id_from(raw_outputs, path.name),
        "bins":      bins,
        "folded":    True,
        "h":         h,
        "n_sites":   int(total) if total > 0 else 0,
        "_provenance": {
            "source_path": raw_outputs.get("source_rel", str(path)),
            "parsed_at":   T.now_iso_z(),
        },
    }
