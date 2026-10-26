# PR #7637 — fix(claude): fail a turn that Claude Code ends on an API error

- Delivered source SHA: `825476c6a50219848e3e2158ddc7412ba8cc13b6`
- Tree SHA: `2c7a66715ac89e8c7ef931347be301442fc9e7b5`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `providers/7637/result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npm run build:app-deps`
- `npm run build:server`
- `npm run format`
- `npm run lint`
- `npx vitest run src/server/agent/providers/claude/agent.history-load.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/agent/providers/claude/agent.error-result.test.ts --bail=1 --maxWorkers=1`
- `npm run typecheck`

Reported targeted test count: **13**. This is the source owner’s recorded count, not a rerun during evidence publication.

### Raw stdout

- [`build-app-deps.log.txt`](logs/build-app-deps.log.txt)
- [`build-server.log.txt`](logs/build-server.log.txt)
- [`commit.log.txt`](logs/commit.log.txt)
- [`format.log.txt`](logs/format.log.txt)
- [`lint.log.txt`](logs/lint.log.txt)
- [`merge.log.txt`](logs/merge.log.txt)
- [`server-0.log.txt`](logs/server-0.log.txt)
- [`server-1.log.txt`](logs/server-1.log.txt)
- [`typecheck.log.txt`](logs/typecheck.log.txt)

### Conflict/repair diffs

- No qualifying conflict/repair diff was retained.

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- Real Claude API-error/UI acceptance not rerun
- Native/mobile and packaged desktop lifecycle not exercised
- Upstream CI and current-head maintainer review remain separate gates

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
