# PR #7543 — fix(app): stop a late update from an earlier turn relabelling the newest row

- Delivered source SHA: `92026c3d6ee7987462b080e990e30f515a82aced`
- Tree SHA: `329bea6c0b6462fe9a8de9e75872e5815d4a4503`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `timeline/7543/result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npm run build:server`
- `npm run build:app-deps`
- `npm run format`
- `npx vitest run --project unit src/types/stream.test.ts --bail=1 --maxWorkers=1`
- `npm run typecheck`
- `npm run lint`

### Raw stdout

- [`build-app-deps.log.txt`](logs/build-app-deps.log.txt)
- [`commit.log.txt`](logs/commit.log.txt)
- [`format.log.txt`](logs/format.log.txt)
- [`lint.log.txt`](logs/lint.log.txt)
- [`merge.log.txt`](logs/merge.log.txt)
- [`test-src_types_stream.test.ts.log.txt`](logs/test-src_types_stream.test.ts.log.txt)
- [`typecheck.log.txt`](logs/typecheck.log.txt)

### Conflict/repair diffs

- [`auto-overlap.patch.txt`](diffs/auto-overlap.patch.txt)
- [`resolution.patch.txt`](diffs/resolution.patch.txt)

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- Stream reducer tests cover a late update from a previous turn; this run adds no live-provider or native runtime claim.

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
