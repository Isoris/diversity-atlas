"""Diversity-atlas IN-side runner — harvest one on-disk layer file.

`harvest_file` is the supersedes-`import_slot` adapter for layers whose
`source: file` in layers.registry.json. Flow:

  1. Look up the requested layer_key in layers.registry.json.
  2. Resolve its `root` to an absolute path via the atlas-core
     master_config (`roots.<root>.path`).
  3. Fill the layer's `path_under_root` template with `target.args`
     (sample_id / K / cohort / win_bp / step_bp / variant_id / …).
  4. Copy the resolved file under raw_results/diversity/<action_id>/
     for provenance.
  5. Return {file_path, source_rel, layer_key, args}.

The matching extractor (declared on extractors.registry.json by
layer_type) then parses raw_outputs["file_path"] into a typed payload.

This runner reads master_config.yaml via a YAML-less mini-parser to
avoid pulling in PyYAML. The shape we need (roots.<name>.path) is
trivial.
"""
from __future__ import annotations

import json
import os
import pathlib
import platform
import re
import shutil
import sys
from typing import Any, Dict, Optional


# --------------------------------------------------------------------------- #
# master_config lookup (no PyYAML dep)                                         #
# --------------------------------------------------------------------------- #

_ROOT_RE = re.compile(r"^\s{2,4}([A-Za-z_][A-Za-z0-9_]*)\s*:\s*$")
_PATH_RE = re.compile(r'^\s+path\s*:\s*["\']?([^"\']+)["\']?\s*$')


def _project_root() -> pathlib.Path:
    root = os.environ.get("ATLAS_PROJECT_ROOT")
    return pathlib.Path(root) if root else pathlib.Path.cwd()


def _find_master_config() -> Optional[pathlib.Path]:
    """master_config.yaml lives at the workspace root (atlas-core or
    parent). Walk up from the project root looking for it. Allow
    override via ATLAS_MASTER_CONFIG."""
    override = os.environ.get("ATLAS_MASTER_CONFIG")
    if override and pathlib.Path(override).exists():
        return pathlib.Path(override)
    here = _project_root().resolve()
    for cand in (here, *here.parents):
        for name in ("master_config.yaml", "master_config.example.yaml"):
            p = cand / name
            if p.exists():
                return p
    return None


def _read_root_path(root_name: str) -> str:
    """Pull `roots.<root_name>.path` out of master_config.yaml.

    Hand-rolled minimal YAML walk: track whether we are inside a `roots:`
    block, then inside a `<root_name>:` block, then return the first
    `path:` line. Sufficient for the master_config shape; refuses
    anything more complex."""
    cfg = _find_master_config()
    if cfg is None:
        raise FileNotFoundError(
            "master_config.yaml not found anywhere from ATLAS_PROJECT_ROOT upward; "
            "set ATLAS_MASTER_CONFIG to point at it."
        )
    in_roots = False
    in_target = False
    with cfg.open("r", encoding="utf-8") as fh:
        for line in fh:
            stripped = line.rstrip("\n")
            # Top-level section detection (column-0 key).
            if not stripped or stripped.startswith("#"):
                continue
            if not stripped.startswith(" "):
                in_roots = stripped.startswith("roots:")
                in_target = False
                continue
            if in_roots:
                m = _ROOT_RE.match(stripped)
                if m:
                    in_target = (m.group(1) == root_name)
                    continue
                if in_target:
                    m2 = _PATH_RE.match(stripped)
                    if m2:
                        return m2.group(1)
    raise KeyError(
        f"roots.{root_name}.path not found in {cfg}. "
        f"Check master_config.yaml or run with ATLAS_MASTER_CONFIG=<path>."
    )


# --------------------------------------------------------------------------- #
# WSL ↔ Windows path translation                                               #
# --------------------------------------------------------------------------- #
#
# master_config.yaml ships WSL-style absolute paths (e.g. /mnt/e/...) per the
# atlas-core deployment doc — they round-trip cleanly when the server runs
# under WSL, and the static-mount layer in atlas_server.py serves them via
# Starlette. When the dispatcher runs from a native-Windows Python (which is
# what happens during `pytest atlases/diversity/...` from a Windows shell),
# pathlib.Path('/mnt/e/...') silently becomes '\\mnt\\e\\...' — drive-letter-
# less, so the file lookup fails.
#
# This translator handles the two common forms (`/mnt/<letter>/...` and
# `/<letter>:/...`) and lets a per-machine override take precedence via
# ATLAS_ROOT_TRANSLATE="src1:dst1,src2:dst2". Idempotent on Linux/WSL where
# the path is already correct.

_WSL_MNT_RE = re.compile(r"^/mnt/([a-zA-Z])(/.*)?$")


def _translate_path(p: str) -> str:
    # Per-machine override first.
    rules = os.environ.get("ATLAS_ROOT_TRANSLATE") or ""
    for rule in rules.split(","):
        rule = rule.strip()
        if not rule or ":" not in rule:
            continue
        # Split on the LAST colon so Windows drive prefixes survive.
        src, _, dst = rule.rpartition(":")
        if src and p.startswith(src):
            return dst + p[len(src):]
    # Default WSL → Windows when running on Windows.
    if sys.platform.startswith("win") or platform.system() == "Windows":
        m = _WSL_MNT_RE.match(p)
        if m:
            drive = m.group(1).upper()
            tail = m.group(2) or ""
            return f"{drive}:{tail}"
    return p


# --------------------------------------------------------------------------- #
# layer lookup                                                                 #
# --------------------------------------------------------------------------- #

_HERE = pathlib.Path(__file__).parent
_LAYERS_REGISTRY = _HERE.parent / "data" / "layers.registry.json"


def _load_layers() -> Dict[str, Any]:
    return json.loads(_LAYERS_REGISTRY.read_text(encoding="utf-8"))


def _lookup_layer(layer_key: str) -> Dict[str, Any]:
    doc = _load_layers()
    layers = doc.get("layers") or {}
    layer = layers.get(layer_key)
    if not isinstance(layer, dict):
        raise KeyError(
            f"layer_key '{layer_key}' not found in {_LAYERS_REGISTRY.name}. "
            f"Check the spelling against the keys under `layers:`."
        )
    if layer.get("disabled"):
        reason = layer.get("_disabled_reason") or "no reason given"
        raise RuntimeError(
            f"layer_key '{layer_key}' is disabled: {reason}"
        )
    if layer.get("source") != "file":
        raise ValueError(
            f"layer_key '{layer_key}' has source='{layer.get('source')}', expected 'file'. "
            f"Use a different action (operation-sourced layers go via /api/operations)."
        )
    return layer


# --------------------------------------------------------------------------- #
# template fill                                                                #
# --------------------------------------------------------------------------- #

_TEMPLATE_RE = re.compile(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}")


def _required_placeholders(template: str) -> list:
    return list(dict.fromkeys(_TEMPLATE_RE.findall(template)))


def _fill_template(template: str, args: Dict[str, Any]) -> str:
    missing = [k for k in _required_placeholders(template) if k not in args]
    if missing:
        raise ValueError(
            f"target.args missing placeholders for layer template '{template}': {missing}"
        )
    return _TEMPLATE_RE.sub(lambda m: str(args[m.group(1)]), template)


# --------------------------------------------------------------------------- #
# main entry                                                                   #
# --------------------------------------------------------------------------- #

def _workdir(manifest: Dict[str, Any]) -> pathlib.Path:
    return _project_root() / "raw_results" / "diversity" / manifest["action_id"]


def harvest_file(manifest: Dict[str, Any], client: Any) -> Dict[str, str]:
    """Resolve target.layer_key + target.args to one on-disk file under a
    master_config root, copy under raw_results/, return the path."""
    target = manifest["target"]
    layer_key = target["layer_key"]
    args = target.get("args") or {}
    layer = _lookup_layer(layer_key)

    if "path_under_root" in layer:
        # master_config-rooted layer. Translate WSL paths on Windows so the
        # same master_config.yaml works for both deployment shapes.
        root_path = pathlib.Path(_translate_path(_read_root_path(layer["root"])))
        rel_under_root = _fill_template(layer["path_under_root"], args)
        src = root_path / rel_under_root
        source_rel = f"{layer['root']}::{rel_under_root}"
    elif "path" in layer:
        # atlas-relative layer (e.g. data/texture_metrics.json).
        rel = _fill_template(layer["path"], args)
        src = _project_root() / "atlases" / "diversity" / rel
        source_rel = f"atlases/diversity/{rel}"
    else:
        raise ValueError(
            f"layer_key '{layer_key}' has neither path_under_root nor path"
        )

    if not src.exists():
        raise FileNotFoundError(f"resolved file does not exist: {src}")
    if not src.is_file():
        raise IsADirectoryError(f"resolved path is not a file: {src}")

    out_dir = _workdir(manifest)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / src.name
    shutil.copyfile(src, out_path)

    return {
        "file_path":  str(out_path),
        "source_rel": source_rel,
        "layer_key":  layer_key,
        "args_json":  json.dumps(args, sort_keys=True),
    }
