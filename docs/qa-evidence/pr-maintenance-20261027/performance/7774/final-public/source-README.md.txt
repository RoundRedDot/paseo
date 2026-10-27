# PR #7774 final bounded actual-app evidence — 2026-10-27

Exact source800b75b1f6ceef7391e5300137f980882b78f84f; tree0b4ad32391e554f75777ec4ad76016dc13f3672b. The authorized real-DOM correction produced one complete2-A calibration. Keydown-to-next-rAF p95 differed31.82% (7.4/10.2ms), above the unchanged15% gate: STOP. No B or returning A ran; no calibration retry, sample replacement, workload enlargement or benchmark search followed. No repeatable responsiveness improvement is established.

Read result.json, analysis.json and protocol.corrected.json. Both valid A samples retained59 keys,12 label values,894px actual scroll, exact replies/draft and zero pageerrors. Page long tasks and complete traces/wire/recordings are retained. Baseline descriptive medians/ranges are not an A/B benefit.

The original English-locator launch failure and unavailable-profile-attribute observation attempt remain under raw/ and raw/actual-calibration. They are distinct from the genuine corrected A/A noise failure under raw/corrected-calibration, are not pooled, and were not silently replaced. The executed correction is capture-corrected.spec.ts.txt through the existing test:e2e runner (1worker/0retries). Its process exit0 denotes execution completion, not performance acceptance.

All unique new gzip JSON and videos were parsed/fully decoded; see artifact-validation.json. Source modules were restored exactly. See cleanup.json for initial-head restoration and closed owned ports. Browser binaries, node_modules, runtime homes, credentials, databases and private device inventory are excluded.
