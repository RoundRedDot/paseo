# PR #7000 — feat(server): expose persisted timing for completed agent turns

- Delivered source SHA: `85b5d1dd65ba80fc669951c209d4d39fbf81c0c1`
- Tree SHA: `a701ace5c3f0410b3f4872bc4a014dd51c62cfe5`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `providers/7000/result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npm run build:app-deps`
- `npm run build:server`
- `npm run format`
- `npm run lint`
- `npx vitest run src/messages.wire-compat.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/agent/agent-manager.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/agent/agent-storage.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/agent/providers/claude/agent.history-load.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/agent/providers/claude/agent.history.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/daemon-e2e/timeline-window.e2e.test.ts --bail=1 --maxWorkers=1`
- `npm run typecheck`

Reported targeted test count: **294**. This is the source owner’s recorded count, not a rerun during evidence publication.

### Raw stdout

- [`build-app-deps.log.txt`](logs/build-app-deps.log.txt)
- [`build-server.log.txt`](logs/build-server.log.txt)
- [`commit.log.txt`](logs/commit.log.txt)
- [`format.log.txt`](logs/format.log.txt)
- [`lint.log.txt`](logs/lint.log.txt)
- [`merge.log.txt`](logs/merge.log.txt)
- [`protocol-0.log.txt`](logs/protocol-0.log.txt)
- [`server-0.log.txt`](logs/server-0.log.txt)
- [`server-1.log.txt`](logs/server-1.log.txt)
- [`server-2.log.txt`](logs/server-2.log.txt)
- [`server-3.log.txt`](logs/server-3.log.txt)
- [`server-4.log.txt`](logs/server-4.log.txt)
- [`typecheck.log.txt`](logs/typecheck.log.txt)

### Conflict/repair diffs

- No qualifying conflict/repair diff was retained.

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- Real Claude timing/native-device display not exercised
- Pre-upgrade missing timing is not backfilled
- Upstream CI and current-head maintainer review remain separate gates

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
