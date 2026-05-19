"""Shared TSV parsing helpers for diversity-atlas extractors.

Stdlib only. Coerces 'NA' / 'nan' / '-nan' / '-inf' / '' to None when
infer_types=True; otherwise leaves cells as strings. The first line
starting with `comment_prefix` is skipped (used by ANGSD pestPG, which
prepends a `#(indexStart...)` annotation line).
"""
from __future__ import annotations

import csv
import math
import pathlib
import time
from typing import Any, Dict, Iterable, List, Optional, Tuple


_NULL_TOKENS = {"", "NA", "na", "NaN", "nan", "-nan", "Inf", "-Inf", "inf", "-inf"}


def now_iso_z() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _coerce(cell: str, infer: bool) -> Any:
    if cell in _NULL_TOKENS:
        return None
    if not infer:
        return cell
    # try int then float
    try:
        i = int(cell)
        # avoid mis-coercing "1e5" → ValueError → next branch, "001" → 1 ok
        return i
    except ValueError:
        pass
    try:
        f = float(cell)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except ValueError:
        return cell


def read_tsv(
    path: pathlib.Path,
    has_header: bool = True,
    delimiter: str = "\t",
    comment_prefix: Optional[str] = None,
    rename_columns: Optional[Dict[str, str]] = None,
    infer_types: bool = True,
    max_rows: int = 0,
) -> Tuple[List[str], List[Dict[str, Any]]]:
    """Return (columns, rows). Rows are dict objects keyed by column name."""
    rename = rename_columns or {}
    with path.open("r", encoding="utf-8", newline="") as fh:
        lines: List[str] = []
        for raw in fh:
            raw = raw.rstrip("\n\r")
            if comment_prefix and raw.startswith(comment_prefix):
                continue
            if not raw and not lines:
                # ignore leading blank lines
                continue
            lines.append(raw)

    if not lines:
        return [], []

    reader = csv.reader(lines, delimiter=delimiter)
    rows_iter = iter(reader)
    if has_header:
        try:
            header = next(rows_iter)
        except StopIteration:
            return [], []
        columns = [rename.get(c, c) for c in header]
    else:
        first = next(rows_iter, [])
        columns = [f"col{i+1}" for i in range(len(first))]
        rows_iter = iter([first] + list(rows_iter))

    out: List[Dict[str, Any]] = []
    for i, row in enumerate(rows_iter):
        if max_rows and i >= max_rows:
            break
        obj: Dict[str, Any] = {}
        for j, cell in enumerate(row):
            key = columns[j] if j < len(columns) else f"col{j+1}"
            obj[key] = _coerce(cell, infer_types)
        out.append(obj)
    return columns, out


def median(values: Iterable[float]) -> Optional[float]:
    xs = sorted(x for x in values if isinstance(x, (int, float)) and not (isinstance(x, float) and math.isnan(x)))
    n = len(xs)
    if not n:
        return None
    mid = n // 2
    return xs[mid] if n % 2 else 0.5 * (xs[mid - 1] + xs[mid])


def mean(values: Iterable[float]) -> Optional[float]:
    xs = [x for x in values if isinstance(x, (int, float)) and not (isinstance(x, float) and math.isnan(x))]
    return (sum(xs) / len(xs)) if xs else None
