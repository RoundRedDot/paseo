# PR #7556 — perf(app): cut idle repaints and streaming parse cost on Android

- Delivered source SHA: `890497e3f9b1baf61c42eb287910c17ad5dc2f08`
- Tree SHA: `1fe0cf087969b8b3ffa49735c4130a46ba15469b`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `app/7556-result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npm run build:server`
- `npm run build:app-deps`
- `npm run format`
- `npm run typecheck`
- `npm run lint`
- `cd packages/app && npx vitest run src/components/status-ring/geometry.test.ts --bail=1 --maxWorkers=1`
- `cd packages/app && npx vitest run src/components/markdown/streaming.test.ts --bail=1 --maxWorkers=1`
- `cd packages/app && npx vitest run src/components/markdown/renderer.test.ts --bail=1 --maxWorkers=1`
- `cd packages/app && npx vitest run src/voice/voice-runtime.test.ts --bail=1 --maxWorkers=1`
- `cd packages/app && npx vitest run src/runtime/replica-cache/index.test.ts --bail=1 --maxWorkers=1`

Reported targeted test count: **237**. This is the source owner’s recorded count, not a rerun during evidence publication.

Recorded validation status: build-server 0
build-app-deps 0
test-components-status-ring-geometry 0
test-components-markdown-streaming 0
test-components-markdown-renderer 0
test-voice-voice-runtime 0
test-runtime-replica-cache-index 0
format 0
typecheck 0
lint 0

### Raw stdout

- [`7556-build-app-deps.log.txt`](logs/7556-build-app-deps.log.txt)
- [`7556-commit.log.txt`](logs/7556-commit.log.txt)
- [`7556-format.log.txt`](logs/7556-format.log.txt)
- [`7556-lint.log.txt`](logs/7556-lint.log.txt)
- [`7556-merge.log.txt`](logs/7556-merge.log.txt)
- [`7556-test-components-markdown-renderer.log.txt`](logs/7556-test-components-markdown-renderer.log.txt)
- [`7556-test-components-markdown-streaming.log.txt`](logs/7556-test-components-markdown-streaming.log.txt)
- [`7556-test-components-status-ring-geometry.log.txt`](logs/7556-test-components-status-ring-geometry.log.txt)
- [`7556-test-runtime-replica-cache-index.log.txt`](logs/7556-test-runtime-replica-cache-index.log.txt)
- [`7556-test-voice-voice-runtime.log.txt`](logs/7556-test-voice-voice-runtime.log.txt)
- [`7556-typecheck.log.txt`](logs/7556-typecheck.log.txt)

### Conflict/repair diffs

- [`7556-incoming-overlap.diff.txt`](diffs/7556-incoming-overlap.diff.txt)
- [`7556-overlap.diff.txt`](diffs/7556-overlap.diff.txt)

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- Native patched-app performance and iOS acceptance remain unverified. Twelve-step native ring cadence still needs maintainer animation-design acceptance. Historical benchmarks below retain their original revision/device scope; this integration adds no performance claim.

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
