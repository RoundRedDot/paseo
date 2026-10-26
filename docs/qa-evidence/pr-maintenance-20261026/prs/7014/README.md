# PR #7014 — fix(providers): preserve structured question timeline data

- Delivered source SHA: `76217b8d95915940c5984b4cfb04d805d4522995`
- Tree SHA: `a31b69d324536cb31f677e50e1d6322be34df651`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `providers/7014/result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npm run build:app-deps`
- `npm run build:server`
- `npm run format`
- `npm run lint`
- `npx vitest run src/server/agent/providers/pi/agent.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/agent/providers/omp/agent.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/agent/providers/pi/history-mapper.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/agent/providers/omp/history-mapper.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/agent/providers/codex-async-questions.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/agent/providers/opencode/tool-call-mapper.test.ts --bail=1 --maxWorkers=1`
- `npm run typecheck`

Reported targeted test count: **267**. This is the source owner’s recorded count, not a rerun during evidence publication.

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
- [`server-3.log.txt`](logs/server-3.log.txt)
- [`server-4.log.txt`](logs/server-4.log.txt)
- [`server-5.log.txt`](logs/server-5.log.txt)
- [`typecheck.log.txt`](logs/typecheck.log.txt)

### Conflict/repair diffs

- [`resolution.diff.txt`](diffs/resolution.diff.txt)

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- No new real-provider or native/mobile question-card acceptance
- Packaged desktop lifecycle not exercised
- Upstream CI and current-head maintainer review remain separate gates

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
