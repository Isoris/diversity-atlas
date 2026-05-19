"""Smoke test — harvest_file → extractor round-trip against real disk.

Verifies that:
  1. harvest_file resolves a master_config root + path_under_root template
     to an absolute path under E:/results_diversity/.
  2. It copies the file into raw_results/diversity/<action_id>/.
  3. The matching extractor parses the copied file into a typed payload.

Skipped unless E:/results_diversity/02_heterozygosity/04_summary/
genomewide_heterozygosity.tsv is present (the on-disk substrate for the
`samples_genomewide_het` layer). No HTTP, no atlas_server — exercises the
runner + parser modules directly.

Run from the diversity-atlas root:
    cd diversity-atlas
    ATLAS_MASTER_CONFIG=../atlas-core/master_config.yaml \
        python -m pytest atlases/diversity/registries/tests/test_harvest_roundtrip.py -v

Or as a script:
    ATLAS_MASTER_CONFIG=../atlas-core/master_config.yaml \
        python atlases/diversity/registries/tests/test_harvest_roundtrip.py
"""
from __future__ import annotations

import os
import pathlib
import shutil
import sys
import tempfile
import unittest


HERE = pathlib.Path(__file__).resolve().parent
REGISTRIES = HERE.parent
ATLAS_ROOT = REGISTRIES.parent              # atlases/diversity
PKG_ROOT   = ATLAS_ROOT.parent.parent       # diversity-atlas root

# Make the per-atlas package importable without installing it.
sys.path.insert(0, str(REGISTRIES.parent.parent.parent))   # diversity-atlas


def _disk_substrate_present() -> bool:
    """The harvest test only runs when the on-disk file actually exists."""
    target = pathlib.Path(
        "/mnt/e/results_diversity/02_heterozygosity/04_summary/genomewide_heterozygosity.tsv"
    )
    # Windows-mounted equivalent (CLI may resolve E:/ instead of /mnt/e).
    win_target = pathlib.Path("E:/results_diversity/02_heterozygosity/04_summary/genomewide_heterozygosity.tsv")
    return target.exists() or win_target.exists()


def _ensure_atlas_project_root(tmp: pathlib.Path) -> None:
    """harvest_file reads ATLAS_PROJECT_ROOT to locate raw_results/. Point
    it at a tmpdir so the test doesn't pollute the repo."""
    os.environ["ATLAS_PROJECT_ROOT"] = str(tmp)


def _ensure_master_config() -> None:
    """harvest_file walks ATLAS_PROJECT_ROOT upward looking for
    master_config.yaml. The diversity-atlas repo doesn't carry one — it
    lives in atlas-core. Pass an explicit override via ATLAS_MASTER_CONFIG
    so the test is location-independent."""
    if os.environ.get("ATLAS_MASTER_CONFIG"):
        return
    # Common dev layout: ../atlas-core/master_config.yaml next to diversity-atlas/.
    guess = PKG_ROOT.parent / "atlas-core" / "master_config.yaml"
    if guess.exists():
        os.environ["ATLAS_MASTER_CONFIG"] = str(guess)


class HarvestRoundTrip(unittest.TestCase):

    @unittest.skipUnless(_disk_substrate_present(),
                         "E:/results_diversity/02_heterozygosity/04_summary/"
                         "genomewide_heterozygosity.tsv not present")
    def test_samples_genomewide_het(self) -> None:
        _ensure_master_config()
        if not os.environ.get("ATLAS_MASTER_CONFIG"):
            self.skipTest("ATLAS_MASTER_CONFIG not set and atlas-core/master_config.yaml not found")

        tmp = pathlib.Path(tempfile.mkdtemp(prefix="harvest_smoke_"))
        try:
            _ensure_atlas_project_root(tmp)

            # Lazy import — env vars need to be set first.
            from atlases.diversity.registries.runners.harvest_file import harvest_file
            from atlases.diversity.registries.extractors.genomewide_het import extract

            manifest = {
                "action_id":  "smoke_a001",
                "dataset_id": "diversity_cohort_v1",
                "type":       "harvest_file",
                "target":     {"layer_key": "samples_genomewide_het", "args": {}},
            }

            raw = harvest_file(manifest, client=None)

            self.assertIn("file_path", raw)
            self.assertIn("source_rel", raw)
            self.assertIn("args_json", raw)
            self.assertTrue(pathlib.Path(raw["file_path"]).exists())
            self.assertTrue(raw["source_rel"].startswith("diversity_heterozygosity::"))

            payload = extract(raw, params={})
            self.assertIn("samples", payload)
            self.assertGreater(len(payload["samples"]), 0)
            first = payload["samples"][0]
            self.assertIn("sample_id", first)
            self.assertIn("het_genomewide", first)
            self.assertRegex(first["sample_id"], r"^CGA[0-9]+$")
            # 226 samples expected; allow slack in case the file is regenerated mid-test.
            self.assertGreater(payload["summary"]["n_samples"], 200)
            self.assertIsNotNone(payload["summary"]["median_het"])

        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    @unittest.skipUnless(
        pathlib.Path("E:/results_diversity/03_theta_pi/CGA009.win50000.step10000.pestPG").exists()
        or pathlib.Path("/mnt/e/results_diversity/03_theta_pi/CGA009.win50000.step10000.pestPG").exists(),
        "CGA009 pestPG file not present"
    )
    def test_samples_theta_pi_pestpg(self) -> None:
        _ensure_master_config()
        if not os.environ.get("ATLAS_MASTER_CONFIG"):
            self.skipTest("ATLAS_MASTER_CONFIG not set")
        tmp = pathlib.Path(tempfile.mkdtemp(prefix="harvest_smoke_"))
        try:
            _ensure_atlas_project_root(tmp)
            from atlases.diversity.registries.runners.harvest_file import harvest_file
            from atlases.diversity.registries.extractors.pestpg import extract
            manifest = {
                "action_id":  "smoke_a004",
                "dataset_id": "diversity_cohort_v1",
                "type":       "harvest_file",
                "target": {
                    "layer_key": "samples_theta_pi_pestpg",
                    "args": {"sample_id": "CGA009", "win_bp": 50000, "step_bp": 10000},
                },
            }
            raw = harvest_file(manifest, client=None)
            self.assertTrue(pathlib.Path(raw["file_path"]).exists())
            self.assertEqual(raw["source_rel"],
                             "diversity_theta_pi::CGA009.win50000.step10000.pestPG")

            payload = extract(raw, params={})
            self.assertEqual(payload["sample_id"], "CGA009")
            self.assertEqual(payload["win_bp"], 50000)
            self.assertEqual(payload["step_bp"], 10000)
            self.assertGreater(len(payload["windows"]), 100)
            w0 = payload["windows"][0]
            self.assertIn("chrom", w0)
            self.assertIn("win_center", w0)
            self.assertIn("tP", w0)
            self.assertTrue(str(w0["chrom"]).startswith("C_gar_"))
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_harvest_missing_layer_raises(self) -> None:
        _ensure_master_config()
        if not os.environ.get("ATLAS_MASTER_CONFIG"):
            self.skipTest("ATLAS_MASTER_CONFIG not set")
        tmp = pathlib.Path(tempfile.mkdtemp(prefix="harvest_smoke_"))
        try:
            _ensure_atlas_project_root(tmp)
            from atlases.diversity.registries.runners.harvest_file import harvest_file
            manifest = {
                "action_id":  "smoke_a002",
                "dataset_id": "diversity_cohort_v1",
                "type":       "harvest_file",
                "target":     {"layer_key": "this_layer_does_not_exist", "args": {}},
            }
            with self.assertRaises(KeyError):
                harvest_file(manifest, client=None)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_harvest_disabled_layer_raises(self) -> None:
        _ensure_master_config()
        if not os.environ.get("ATLAS_MASTER_CONFIG"):
            self.skipTest("ATLAS_MASTER_CONFIG not set")
        tmp = pathlib.Path(tempfile.mkdtemp(prefix="harvest_smoke_"))
        try:
            _ensure_atlas_project_root(tmp)
            from atlases.diversity.registries.runners.harvest_file import harvest_file
            manifest = {
                "action_id":  "smoke_a003",
                "dataset_id": "diversity_cohort_v1",
                "type":       "harvest_file",
                "target":     {"layer_key": "samples_roh_per_sample",
                               "args": {"sample_id": "CGA009"}},
            }
            with self.assertRaises(RuntimeError):
                harvest_file(manifest, client=None)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
