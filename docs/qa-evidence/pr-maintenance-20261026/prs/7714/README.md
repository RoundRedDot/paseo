# PR #7714 — fix(claude): keep a resumed subagent on its row after the session reopens

- Delivered source SHA: `d90ef6503cf3e3e40ee7b964f8f82f8c6f839b0d`
- Tree SHA: `7b2c835501db54fdbf289db4280b696bf14d4ce0`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `providers/7714/result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npm run build:app-deps`
- `npm run build:server`
- `npm run format`
- `npm run lint`
- `npx vitest run src/server/agent/providers/claude/agent.history-load.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/agent/providers/claude/agent.sub-agent-replay.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/agent/providers/claude/subagents/live-source.test.ts --bail=1 --maxWorkers=1`
- `npm run typecheck`

Reported targeted test count: **96**. This is the source owner’s recorded count, not a rerun during evidence publication.

### Raw stdout

- [`build-app-deps.log.txt`](logs/build-app-deps.log.txt)
- [`build-server.log.txt`](logs/build-server.log.txt)
- [`commit.log.txt`](logs/commit.log.txt)
- [`format.log.txt`](logs/format.log.txt)
- [`lint.log.txt`](logs/lint.log.txt)
- [`merge.log.txt`](logs/merge.log.txt)
- [`server-0.log.txt`](logs/server-0.log.txt)
- [`server-1.log.txt`](logs/server-1.log.txt)
- [`server-2.log.txt`](logs/server-2.log.txt)
- [`typecheck.log.txt`](logs/typecheck.log.txt)

### Conflict/repair diffs

- No qualifying conflict/repair diff was retained.

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- Real Claude reopen/resume and device UI not rerun
- Packaged desktop lifecycle not exercised
- Upstream CI and current-head maintainer review remain separate gates

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
