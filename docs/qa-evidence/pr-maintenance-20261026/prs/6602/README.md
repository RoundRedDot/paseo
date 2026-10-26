# PR #6602 — fix(app): stack plugin-projected tool rows like native tool rows

- Delivered source SHA: `7718e0dc555b669f51bee46812559186ecf05bbf`
- Tree SHA: `4904876e7597d9e573ade73ca7ec3368876d58d6`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `app/6602-result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npm run build:server`
- `npm run build:app-deps`
- `npm run format`
- `npm run typecheck`
- `npm run lint`
- `cd packages/app && npx vitest run src/agent-stream/spacing.test.ts --bail=1 --maxWorkers=1`
- `cd packages/app && npx vitest run src/agent-stream/layout.test.ts --bail=1 --maxWorkers=1`
- `cd packages/app && npx vitest run src/plugins/timeline/projection.test.ts --bail=1 --maxWorkers=1`
- `cd packages/app && npx vitest run src/types/stream.test.ts --bail=1 --maxWorkers=1`

Reported targeted test count: **117**. This is the source owner’s recorded count, not a rerun during evidence publication.

Recorded validation status: build-server 0
build-app-deps 0
test-agent-stream-spacing 0
test-agent-stream-layout 0
test-plugins-timeline-projection 0
test-types-stream 0
format 0
typecheck 0
lint 0

### Raw stdout

- [`6602-build-app-deps.log.txt`](logs/6602-build-app-deps.log.txt)
- [`6602-commit.log.txt`](logs/6602-commit.log.txt)
- [`6602-format.log.txt`](logs/6602-format.log.txt)
- [`6602-lint.log.txt`](logs/6602-lint.log.txt)
- [`6602-merge.log.txt`](logs/6602-merge.log.txt)
- [`6602-precommit-check.log.txt`](logs/6602-precommit-check.log.txt)
- [`6602-test-agent-stream-layout.log.txt`](logs/6602-test-agent-stream-layout.log.txt)
- [`6602-test-agent-stream-spacing.log.txt`](logs/6602-test-agent-stream-spacing.log.txt)
- [`6602-test-plugins-timeline-projection.log.txt`](logs/6602-test-plugins-timeline-projection.log.txt)
- [`6602-test-types-stream.log.txt`](logs/6602-test-types-stream.log.txt)
- [`6602-typecheck.log.txt`](logs/6602-typecheck.log.txt)

### Conflict/repair diffs

- [`6602-incoming-overlap.diff.txt`](diffs/6602-incoming-overlap.diff.txt)

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- Transformer-projected rows remain the scope. timeline.append opt-in is a separate API/design decision; current-head native/Electron acceptance remains unverified.

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
