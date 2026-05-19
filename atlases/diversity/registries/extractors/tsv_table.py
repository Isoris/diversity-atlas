"""extractor: tsv_table_v1 — generic TSV passthrough.

Used by:
- `extract_tsv_passthrough_v1` (layer_type=tsv_table) — the ancestry_het_*
  per-K layers and any tabular layer without a dedicated extractor.
- `extract_ancestry_het_kruskal_v1` (layer_type=ancestry_het_kruskal) —
  same logic with `rename_columns` mapping `p.value → p_value`.

Emit:

    { columns: [...], rows: [{...}, ...], row_count,
      [K, cohort],  // parsed from filename when present
      _provenance: { source_path, parsed_at } }
"""
from __future__ import annotations
import pathlib
import re
from typing import Any, Dict
from . import _tsv as T


_KCOHORT_RE = re.compile(r"K(?P<K>\d+)_(?P<cohort>all\d+|pruned\d+)")


def _parse_k_cohort(filename: str) -> Dict[str, Any]:
    m = _KCOHORT_RE.search(filename)
    if not m:
        return {}
    try:
        return {"K": int(m.group("K")), "cohort": m.group("cohort")}
    except ValueError:
        return {"cohort": m.group("cohort")}


def extract(raw_outputs: Dict[str, str], params: Dict[str, Any]) -> Dict[str, Any]:
    path = pathlib.Path(raw_outputs["file_path"])
    columns, rows = T.read_tsv(
        path,
        has_header=True,
        rename_columns=params.get("rename_columns"),
        infer_types=bool(params.get("infer_types", True)),
        max_rows=int(params.get("max_rows") or 0),
    )
    out: Dict[str, Any] = {
        "columns":   columns,
        "rows":      rows,
        "row_count": len(rows),
        "_provenance": {
            "source_path": raw_outputs.get("source_rel", str(path)),
            "parsed_at":   T.now_iso_z(),
        },
    }
    out.update(_parse_k_cohort(path.name))
    return out
