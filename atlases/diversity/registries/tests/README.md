# registries/tests

Python smoke tests for the diversity-atlas IN/OUT adapter pipeline.

## Files

- **`test_harvest_roundtrip.py`** — exercises the full server-side flow against
  real on-disk substrate: `harvest_file` runner resolves a layer key + args
  through `master_config.yaml`, copies the matched file into `raw_results/`,
  and the matching extractor parses it into a typed payload. Five cases:
  three real-disk round-trips (`samples_genomewide_het`,
  `samples_theta_pi_pestpg`, `ancestry_het_pruned81_samples`) plus two
  negative cases (unknown layer key → `KeyError`, disabled layer →
  `RuntimeError`).

## Running

From the diversity-atlas root:

```bash
ATLAS_MASTER_CONFIG=../atlas-core/master_config.yaml \
  python atlases/diversity/registries/tests/test_harvest_roundtrip.py -v
```

`ATLAS_MASTER_CONFIG` points the runner's hand-rolled YAML walker at a
master_config; without it, the test auto-skips with a message. The real-disk
cases also auto-skip when the substrate file isn't present on the current
machine (e.g. on a workstation that doesn't have `/mnt/e/` mounted).

## Related

- The runner being tested: [`../runners/harvest_file.py`](../runners/harvest_file.py)
- The extractors being tested: [`../extractors/`](../extractors/)
- The layer registry the runner consults: [`../data/layers.registry.json`](../data/layers.registry.json)
- Browser-side companion: [`../../pages/per_sample/test_samples_modeb.js`](../../pages/per_sample/test_samples_modeb.js)
  (Node smoke test for the Mode-B badge; same data files, parsed via
  `parseDelimited` mirror)
