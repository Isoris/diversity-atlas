"""Diversity-atlas extractors — parse captured slot bytes into a staging
payload.

The slot files are read-only JSON snapshots (see diversity_endpoint.py).
The staging payload simply echoes them under `body` so downstream pages
can read them via the layer registry instead of by file path. Normalize
later once the per-slot shapes stabilise.
"""
from __future__ import annotations

import json
import pathlib
from typing import Any, Dict


def extract(raw_outputs: Dict[str, str], params: Dict[str, Any]) -> Dict[str, Any]:
    path = pathlib.Path(raw_outputs["slot_json"])
    bytes_ = path.stat().st_size
    text = path.read_text(encoding="utf-8")
    try:
        body = json.loads(text)
    except Exception:
        # Defensive: keep the raw text so the staging layer is still useful
        # for debugging even if the slot file isn't valid JSON.
        body = {"_invalid_json": True, "_raw_text": text}
    return {
        "slot":  raw_outputs.get("slot"),
        "body":  body,
        "bytes": bytes_,
    }
