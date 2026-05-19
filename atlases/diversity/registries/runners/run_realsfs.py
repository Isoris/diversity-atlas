"""runner: run_realsfs — PLANNED server-side wrapper around realSFS -fold 1.

NOT YET IMPLEMENTED. Stub raises a clear error so the registry can advertise
the action without the dispatcher silently misbehaving.

Needs the per-sample SAF binaries (.saf.idx + .saf.gz + .saf.pos.gz) on the
server filesystem — see _handoff_docs/MISSING_DATA.md §1. Today only the
.arg log files are mirrored to E:. Once SAFs land:

    realSFS -fold 1 <sample>.saf.idx > raw_results/diversity/<action_id>/<sample>.est.ml

Then dispatcher hands the path to extractors.sfs_ml.extract.
"""
from __future__ import annotations
from typing import Any, Dict


def run_realsfs(manifest: Dict[str, Any], client: Any) -> Dict[str, str]:
    raise NotImplementedError(
        "run_realsfs not yet implemented (SAF binaries not on this filesystem). "
        "See _handoff_docs/MISSING_DATA.md §1. To recompute SFS, run the action on "
        "LANTA where the SAFs live, or stand up a remote endpoint."
    )
