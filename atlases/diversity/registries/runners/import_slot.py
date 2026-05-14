"""Diversity-atlas runners — file/HTTP capture of the 5 read-only slots.

`import_slot` calls atlas-core's /api/diversity/{slot} endpoint (provided
by server/diversity_endpoint.py), captures the JSON response to
raw_results/diversity/<action_id>/<slot>.json, and returns the path to
the dispatcher so the matching extractor can read it.
"""
from __future__ import annotations

import os
import pathlib
from typing import Any, Dict


def _workdir(manifest: Dict[str, Any]) -> pathlib.Path:
    root = pathlib.Path(os.environ.get("ATLAS_PROJECT_ROOT") or pathlib.Path.cwd())
    return root / "raw_results" / "diversity" / manifest["action_id"]


def import_slot(manifest: Dict[str, Any], client: Any) -> Dict[str, str]:
    """GET /api/diversity/{slot} and persist the bytes verbatim.

    Returns:
        { "slot_json": "<absolute path>", "slot": "<slot name>" }
    """
    slot = manifest["target"]["slot"]
    raw = client.get(f"/api/diversity/{slot}")
    out_dir = _workdir(manifest)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{slot}.json"
    out_path.write_bytes(raw)
    return {"slot_json": str(out_path), "slot": slot}
