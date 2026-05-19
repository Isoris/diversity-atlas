"""runner: aggregate_pi — PLANNED cross-sample θπ aggregator.

NOT YET IMPLEMENTED. Stub raises a clear error.

Pure-Python compute: combine N per-sample pestPG envelopes
(samples_theta_pi_pestpg) into a cohort θπ track at a requested scale.
Persist: true so the result is cached at
`_cache/server_results/aggregate_pi/<hash>.json`.

Targets the 05_aggregated/ output directory on disk — see
_handoff_docs/MISSING_DATA.md §3.
"""
from __future__ import annotations
from typing import Any, Dict


def aggregate_pi(manifest: Dict[str, Any], client: Any) -> Dict[str, str]:
    raise NotImplementedError(
        "aggregate_pi not yet implemented. Targets the 05_aggregated/ directory "
        "which is empty on disk today (MISSING_DATA.md §3). When the pipeline "
        "writes per_chromosome_master.tsv or per-window cohort θπ aggregates, "
        "this runner will read them via harvest_file instead."
    )
