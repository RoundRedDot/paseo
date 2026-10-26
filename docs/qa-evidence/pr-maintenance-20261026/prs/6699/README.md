# PR #6699 — fix(app): preserve tool row arrival timestamps during lifecycle updates

- Delivered source SHA: `f072bdfb06c55d231bb72126761d16b9ec0f1b9c`
- Tree SHA: `8599ef9b0b77c4abb2efc9eff24d35c279020935`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `timeline/6699/result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npm run format`
- `npx vitest run --project unit src/types/stream.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run --project unit src/timeline/turn-time.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run --project unit src/timeline/session-stream-reducers.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run --project unit src/runtime/replica-cache/index.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run --project unit src/agent-stream/presentation.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run --project unit src/plugins/timeline/projection.test.ts --bail=1 --maxWorkers=1`
- `npm run typecheck`
- `npm run lint`

### Raw stdout

- [`commit.log.txt`](logs/commit.log.txt)
- [`format.log.txt`](logs/format.log.txt)
- [`lint.log.txt`](logs/lint.log.txt)
- [`merge.log.txt`](logs/merge.log.txt)
- [`test-src_agent-stream_presentation.test.ts.log.txt`](logs/test-src_agent-stream_presentation.test.ts.log.txt)
- [`test-src_plugins_timeline_projection.test.ts.log.txt`](logs/test-src_plugins_timeline_projection.test.ts.log.txt)
- [`test-src_runtime_replica-cache_index.test.ts.log.txt`](logs/test-src_runtime_replica-cache_index.test.ts.log.txt)
- [`test-src_timeline_session-stream-reducers.test.ts.log.txt`](logs/test-src_timeline_session-stream-reducers.test.ts.log.txt)
- [`test-src_timeline_turn-time.test.ts.log.txt`](logs/test-src_timeline_turn-time.test.ts.log.txt)
- [`test-src_types_stream.test.ts.log.txt`](logs/test-src_types_stream.test.ts.log.txt)
- [`typecheck.log.txt`](logs/typecheck.log.txt)

### Conflict/repair diffs

- [`auto-overlap.patch.txt`](diffs/auto-overlap.patch.txt)
- [`resolution.patch.txt`](diffs/resolution.patch.txt)

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- The public renderer timestamp decision remains open on #7196: first observed arrival versus latest lifecycle update. The merge does not decide that contract or broaden plugin props.

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
