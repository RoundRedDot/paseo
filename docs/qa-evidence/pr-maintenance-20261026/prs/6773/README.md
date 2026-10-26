# PR #6773 — feat(app): scrub the chat outline from the left edge on touch devices

- Delivered source SHA: `2bacd637da86474faf0f41aa4d66a322f47a3c38`
- Tree SHA: `524ecac74087d7d89742f852bcc53a3c2f3e995b`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `timeline/6773/result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npm run format`
- `npx vitest run --project unit src/agent-stream/chat-outline/model.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run --project unit src/agent-stream/chat-outline/navigation.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run --project unit src/agent-stream/prompt-jump-native.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run --project unit src/agent-stream/reading-anchor.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run --project unit src/agent-stream/turn-collapse/model.test.ts --bail=1 --maxWorkers=1`
- `npm run typecheck`
- `npm run lint`

### Raw stdout

- [`commit.log.txt`](logs/commit.log.txt)
- [`format.log.txt`](logs/format.log.txt)
- [`lint.log.txt`](logs/lint.log.txt)
- [`merge.log.txt`](logs/merge.log.txt)
- [`test-model.test.ts.log.txt`](logs/test-model.test.ts.log.txt)
- [`test-navigation.test.ts.log.txt`](logs/test-navigation.test.ts.log.txt)
- [`test-prompt-jump-native.test.ts.log.txt`](logs/test-prompt-jump-native.test.ts.log.txt)
- [`test-reading-anchor.test.ts.log.txt`](logs/test-reading-anchor.test.ts.log.txt)
- [`typecheck-initial-failed.log.txt`](logs/typecheck-initial-failed.log.txt)
- [`typecheck.log.txt`](logs/typecheck.log.txt)

### Conflict/repair diffs

- [`resolution.patch.txt`](diffs/resolution.patch.txt)

### Log-collision limitation

The first outline-model test command exited 0, but its raw stdout was overwritten by a later test with the same basename. The exact command and exit status are retained in source notes; the lost output is not recreated or represented as captured. The later turn-collapse model output is retained.

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- Touch-outline model/navigation coverage does not establish native gestures, system text selection, or packaged-device acceptance on this merged head.

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
