# PR #6732 — perf(plugins): skip client bundles the app already holds in catalog fetches

- Delivered source SHA: `0b2e04a1a54b2ce6ce0163921a94f4804ff33ff3`
- Tree SHA: `4bd8f668214e579fa6e165bebc0b8043a50f8c7b`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `compiler/6732/result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npm run build:server`
- `npm run build --workspace=@getpaseo/expo-two-way-audio`
- `npm exec --workspace=@getpaseo/protocol -- vitest run src/messages.plugins.test.ts --bail=1 --maxWorkers=1`
- `npm exec --workspace=@getpaseo/client -- vitest run src/daemon-client.test.ts --bail=1 --maxWorkers=1`
- `npm exec --workspace=@getpaseo/server -- vitest run src/server/session.test.ts --bail=1 --maxWorkers=1 -t catalog\|bundles\ a\ catalog`
- `npm exec --workspace=@getpaseo/server -- vitest run src/server/plugins/builtin/index.test.ts --bail=1 --maxWorkers=1`
- `npm exec --workspace=@getpaseo/server -- vitest run src/server/plugins/runtime.posix.test.ts --bail=1 --maxWorkers=1`
- `npm exec --workspace=@getpaseo/app -- vitest run src/plugins/client-bundle-store.test.ts --bail=1 --maxWorkers=1 --project=unit`
- `npm exec --workspace=@getpaseo/app -- vitest run src/plugins/catalog-refresh.test.ts --bail=1 --maxWorkers=1 --project=unit`
- `npm exec --workspace=@getpaseo/app -- vitest run src/timeline/viewed-timeline-sync.test.ts --bail=1 --maxWorkers=1 --project=unit`
- `npm exec --workspace=@getpaseo/app -- vitest run src/plugins/client-bundle-storage.browser.test.ts --bail=1 --maxWorkers=1 --project=browser`
- `npm exec --workspace=@getpaseo/plugin -- vitest run src/boundaries.test.ts --bail=1 --maxWorkers=1`
- `npm run format`
- `npm run typecheck`
- `npm run lint`

### Raw stdout

- [`boundaries-tests.log.txt`](logs/boundaries-tests.log.txt)
- [`build-audio.log.txt`](logs/build-audio.log.txt)
- [`builtin-tests.log.txt`](logs/builtin-tests.log.txt)
- [`client-tests.log.txt`](logs/client-tests.log.txt)
- [`commit-receipt.log.txt`](logs/commit-receipt.log.txt)
- [`commit.log.txt`](logs/commit.log.txt)
- [`format.log.txt`](logs/format.log.txt)
- [`lint.log.txt`](logs/lint.log.txt)
- [`merge.log.txt`](logs/merge.log.txt)
- [`protocol-tests.log.txt`](logs/protocol-tests.log.txt)
- [`refresh-tests.log.txt`](logs/refresh-tests.log.txt)
- [`runtime-tests.log.txt`](logs/runtime-tests.log.txt)
- [`session-tests.log.txt`](logs/session-tests.log.txt)
- [`store-tests.log.txt`](logs/store-tests.log.txt)
- [`typecheck.log.txt`](logs/typecheck.log.txt)
- [`viewed-tests.log.txt`](logs/viewed-tests.log.txt)

### Conflict/repair diffs

- No qualifying conflict/repair diff was retained.

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- Browser IndexedDB and local real-daemon wire/cache evidence do not establish all plugin surfaces or timeline restoration. The earlier failed timeline-marker oracle and Mac Studio signing-blocked packaged run remain failures/limits. No new native/production-relay/packaged-desktop acceptance is claimed.

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
