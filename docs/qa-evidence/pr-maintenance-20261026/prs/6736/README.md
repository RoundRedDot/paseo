# PR #6736 — fix: preserve image messages across clients and reloads

- Delivered source SHA: `bc3c3d3dbdb067f437c3125812388d6d925c713a`
- Tree SHA: `f321f43018ae55f1d00265550dd7df9c6b0be6e7`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `providers/6736/result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npm run build:app-deps`
- `npm run build:server`
- `npm run format`
- `npm run lint`
- `npx vitest run src/server/agent/agent-manager.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/agent/providers/omp/agent.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/agent/providers/omp/history-mapper.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/agent/providers/pi/agent.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/agent/providers/pi/history-mapper.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/plugins/timeline/projection.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/runtime/replica-cache/index.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/types/stream.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/daemon-e2e/timeline-window.e2e.test.ts --bail=1 --maxWorkers=1`
- `npm run typecheck`
- `npx vitest run src/agent-stream/web-virtualization.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/messages.wire-compat.test.ts --bail=1 --maxWorkers=1`

Reported targeted test count: **631**. This is the source owner’s recorded count, not a rerun during evidence publication.

### Raw stdout

- [`build-app-deps.log.txt`](logs/build-app-deps.log.txt)
- [`build-server.log.txt`](logs/build-server.log.txt)
- [`commit.log.txt`](logs/commit.log.txt)
- [`format.log.txt`](logs/format.log.txt)
- [`lint.log.txt`](logs/lint.log.txt)
- [`manager.log.txt`](logs/manager.log.txt)
- [`merge.log.txt`](logs/merge.log.txt)
- [`omp-agent.log.txt`](logs/omp-agent.log.txt)
- [`omp-history.log.txt`](logs/omp-history.log.txt)
- [`pi-agent.log.txt`](logs/pi-agent.log.txt)
- [`pi-history.log.txt`](logs/pi-history.log.txt)
- [`plugin-projection.log.txt`](logs/plugin-projection.log.txt)
- [`replica-cache.log.txt`](logs/replica-cache.log.txt)
- [`stream.log.txt`](logs/stream.log.txt)
- [`timeline-window.log.txt`](logs/timeline-window.log.txt)
- [`typecheck.log.txt`](logs/typecheck.log.txt)
- [`virtualization.log.txt`](logs/virtualization.log.txt)
- [`wire-compat.log.txt`](logs/wire-compat.log.txt)

### Conflict/repair diffs

- [`resolution.diff.txt`](diffs/resolution.diff.txt)

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- Real OMP/native image/lightbox/reload not exercised
- Packaged desktop not exercised
- Upstream Actions action_required; no current-head approval

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
