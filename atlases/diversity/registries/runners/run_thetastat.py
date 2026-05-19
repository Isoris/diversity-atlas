"""runner: run_thetastat — PLANNED server-side wrapper around thetaStat do_stat.

NOT YET IMPLEMENTED. Stub raises a clear error.

Needs the per-sample .thetas.idx + .thetas.gz emitted upstream by
`angsd -doThetas`. Once present:

    thetaStat do_stat <prefix> -win <win_bp> -step <step_bp> -outnames raw_results/.../<sample>.win<N>.step<M>

Then dispatcher hands the path to extractors.pestpg.extract.

The four pre-baked scales (10kb/2kb, 5kb/1kb, 50kb/10kb, 500kb/500kb) ship
on disk today — this runner is for ad-hoc rescaling beyond those.
"""
from __future__ import annotations
from typing import Any, Dict


def run_thetastat(manifest: Dict[str, Any], client: Any) -> Dict[str, str]:
    raise NotImplementedError(
        "run_thetastat not yet implemented (per-sample .thetas.idx/.thetas.gz "
        "not on this filesystem). Use the four pre-baked scales via "
        "harvest_file(samples_theta_pi_pestpg, {sample_id, win_bp, step_bp}) for now."
    )
