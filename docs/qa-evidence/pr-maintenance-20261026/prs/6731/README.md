# PR #6731 — fix(app): keep installed plugins across a host disconnect

- Delivered source SHA: `ac19eed979213b90670f401b636ae05cf05c7db7`
- Tree SHA: `28380f6e79b9e204fbaa2714617c285a80509ec9`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `compiler/6731/result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npm run build:server`
- `npm run build --workspace=@getpaseo/expo-two-way-audio`
- `npm exec --workspace=@getpaseo/app -- vitest run src/plugins/catalog-sync-model.test.ts --bail=1 --maxWorkers=1 --project=unit`
- `npm exec --workspace=@getpaseo/app -- vitest run src/plugins/registry-lifecycle.test.ts --bail=1 --maxWorkers=1 --project=unit`
- `npm exec --workspace=@getpaseo/app -- vitest run src/plugins/registry.test.ts --bail=1 --maxWorkers=1 --project=unit`
- `npm exec --workspace=@getpaseo/app -- vitest run src/plugins/registry-requirements.test.ts --bail=1 --maxWorkers=1 --project=unit`
- `npm exec --workspace=@getpaseo/plugin -- vitest run src/boundaries.test.ts --bail=1 --maxWorkers=1`
- `npm exec --workspace=@getpaseo/server -- vitest run src/server/plugins/runtime.posix.test.ts --bail=1 --maxWorkers=1`
- `npm run format`
- `npm run typecheck`
- `npm run lint`

### Raw stdout

- [`boundaries-tests.log.txt`](logs/boundaries-tests.log.txt)
- [`build-audio.log.txt`](logs/build-audio.log.txt)
- [`catalog-tests.log.txt`](logs/catalog-tests.log.txt)
- [`commit-receipt.log.txt`](logs/commit-receipt.log.txt)
- [`commit.log.txt`](logs/commit.log.txt)
- [`format.log.txt`](logs/format.log.txt)
- [`lifecycle-tests.log.txt`](logs/lifecycle-tests.log.txt)
- [`lint.log.txt`](logs/lint.log.txt)
- [`merge.log.txt`](logs/merge.log.txt)
- [`registry-tests.log.txt`](logs/registry-tests.log.txt)
- [`requirements-tests.log.txt`](logs/requirements-tests.log.txt)
- [`runtime-tests.log.txt`](logs/runtime-tests.log.txt)
- [`typecheck.log.txt`](logs/typecheck.log.txt)

### Conflict/repair diffs

- No qualifying conflict/repair diff was retained.

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- The plugin cleanup/lifetime decision remains open on #7088. The retained-installation contract still differs from disconnect-teardown wording in the existing docs; maintainer agreement is required. No new native, encrypted-relay, browser-interaction or packaged-desktop acceptance is claimed.

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
