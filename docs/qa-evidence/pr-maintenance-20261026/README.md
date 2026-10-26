# PR maintenance evidence — 2026-10-26

Frozen source baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`. This bundle contains selected technical reports for 27 delivered PR heads. Each PR page records its exact delivered SHA/tree, original commands, byte-preserved raw stdout, conflict/repair diffs, reduced CI/review evidence, and remaining gaps. Raw files use `.txt` suffixes and are hashed in `manifest.json`. [`manifest.sha256.txt`](manifest.sha256.txt) records the manifest SHA-256.

No full test suite was run for this publication. No new device or provider acceptance is claimed. CI, review, tests, and device evidence remain independent. Private conversations, environment/configuration data, credentials, databases, browser storage, large traces, screenshots, and videos are excluded.

## PRs

- [PR #6601 — fix(server): lower classes in plugin client bundles for Hermes](prs/6601/README.md) — `53a592e4040f7b3e1d22ffa79ea883101d144581`; 8 stdout files, 0 conflict/repair diffs.
- [PR #6602 — fix(app): stack plugin-projected tool rows like native tool rows](prs/6602/README.md) — `7718e0dc555b669f51bee46812559186ecf05bbf`; 11 stdout files, 1 conflict/repair diffs.
- [PR #6699 — fix(app): preserve tool row arrival timestamps during lifecycle updates](prs/6699/README.md) — `f072bdfb06c55d231bb72126761d16b9ec0f1b9c`; 11 stdout files, 2 conflict/repair diffs.
- [PR #6731 — fix(app): keep installed plugins across a host disconnect](prs/6731/README.md) — `ac19eed979213b90670f401b636ae05cf05c7db7`; 13 stdout files, 0 conflict/repair diffs.
- [PR #6732 — perf(plugins): skip client bundles the app already holds in catalog fetches](prs/6732/README.md) — `0b2e04a1a54b2ce6ce0163921a94f4804ff33ff3`; 16 stdout files, 0 conflict/repair diffs.
- [PR #6736 — fix: preserve image messages across clients and reloads](prs/6736/README.md) — `bc3c3d3dbdb067f437c3125812388d6d925c713a`; 18 stdout files, 1 conflict/repair diffs.
- [PR #6737 — feat: sync workspace and tab ordering across clients](prs/6737/README.md) — `2b2e1b3e2fc1d8666cf33443e834eb661ae8ea4d`; 13 stdout files, 1 conflict/repair diffs.
- [PR #6773 — feat(app): scrub the chat outline from the left edge on touch devices](prs/6773/README.md) — `2bacd637da86474faf0f41aa4d66a322f47a3c38`; 10 stdout files, 1 conflict/repair diffs.
- [PR #6809 — feat(claude): show the Task prompt on expanded subagent cards](prs/6809/README.md) — `3789dc8dccd626f3e496e0afc6f43e627e873428`; 14 stdout files, 0 conflict/repair diffs.
- [PR #7000 — feat(server): expose persisted timing for completed agent turns](prs/7000/README.md) — `85b5d1dd65ba80fc669951c209d4d39fbf81c0c1`; 13 stdout files, 0 conflict/repair diffs.
- [PR #7006 — fix(app): hold back a closing code fence while it is still being typed](prs/7006/README.md) — `708e303fd8cf2951bbf06b3757c756d417cf7b4c`; 18 stdout files, 2 conflict/repair diffs.
- [PR #7014 — fix(providers): preserve structured question timeline data](prs/7014/README.md) — `76217b8d95915940c5984b4cfb04d805d4522995`; 13 stdout files, 1 conflict/repair diffs.
- [PR #7015 — fix(acp): bridge native Grok and Cursor question requests](prs/7015/README.md) — `9e4023926c7dabff69acc07360e2b1c3dd4387cb`; 10 stdout files, 0 conflict/repair diffs.
- [PR #7153 — fix(app): use tablet layout on Android foldables](prs/7153/README.md) — `2d6ad36f42764f6de0cd6f909c91e13cfa850a11`; 15 stdout files, 3 conflict/repair diffs.
- [PR #7318 — feat(plugin): let timeline renderers open files in the native file pane](prs/7318/README.md) — `b2fd0d1311425cc3ba8f626af8b6425acf6ab994`; 10 stdout files, 2 conflict/repair diffs.
- [PR #7462 — feat(plugin): expose host fork menu for transformed replies](prs/7462/README.md) — `86006dd5fc4fda3562f85a3889b02ada5b353011`; 11 stdout files, 2 conflict/repair diffs.
- [PR #7467 — fix(android): default interface, content, and code text to 13px](prs/7467/README.md) — `8dbc6a9961b0b29ecd234a2b8aac182ea13da05a`; 6 stdout files, 1 conflict/repair diffs.
- [PR #7543 — fix(app): stop a late update from an earlier turn relabelling the newest row](prs/7543/README.md) — `92026c3d6ee7987462b080e990e30f515a82aced`; 7 stdout files, 2 conflict/repair diffs.
- [PR #7556 — perf(app): cut idle repaints and streaming parse cost on Android](prs/7556/README.md) — `890497e3f9b1baf61c42eb287910c17ad5dc2f08`; 11 stdout files, 2 conflict/repair diffs.
- [PR #7620 — fix(app): hold timeline rows until plugin transformers exist](prs/7620/README.md) — `71a3b922e15c9a004605417c57e6e8fb7d72f371`; 6 stdout files, 1 conflict/repair diffs.
- [PR #7624 — perf(app): open plugin timelines from the last catalog](prs/7624/README.md) — `e170ecf33430246031d34938e6a7fe5c7539b034`; 10 stdout files, 1 conflict/repair diffs.
- [PR #7629 — perf(relay): compress relay payloads before encryption](prs/7629/README.md) — `8239861ddce82a64ffba8284d16416581b0e35ec`; 10 stdout files, 0 conflict/repair diffs.
- [PR #7637 — fix(claude): fail a turn that Claude Code ends on an API error](prs/7637/README.md) — `825476c6a50219848e3e2158ddc7412ba8cc13b6`; 9 stdout files, 0 conflict/repair diffs.
- [PR #7714 — fix(claude): keep a resumed subagent on its row after the session reopens](prs/7714/README.md) — `d90ef6503cf3e3e40ee7b964f8f82f8c6f839b0d`; 10 stdout files, 0 conflict/repair diffs.
- [PR #7776 — fix(app): add visible tablet resize sliders and shared settings width](prs/7776/README.md) — `071af538237ed298a3ac4472c507137564c42d1a`; 9 stdout files, 1 conflict/repair diffs.
- [PR #7802 — feat(ios): select paragraphs and list items on double tap](prs/7802/README.md) — `a5b0248ec7d917dd809c090ccac0dee2fb3f4bbc`; 10 stdout files, 0 conflict/repair diffs.
- [PR #7807 — feat(app): enrich and reorder mobile workspace tabs](prs/7807/README.md) — `15f49892f0189a2c5d9ec45449ba827f9a906ed3`; 10 stdout files, 1 conflict/repair diffs.

See `manifest.json` for per-file SHA-256 values.
