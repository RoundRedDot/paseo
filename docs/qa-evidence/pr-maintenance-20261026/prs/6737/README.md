# PR #6737 — feat: sync workspace and tab ordering across clients

- Delivered source SHA: `2b2e1b3e2fc1d8666cf33443e834eb661ae8ea4d`
- Tree SHA: `7f00dcf3576a9f9d92f41cfa6c585627aa32726e`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `server/6737-result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npm run format`
- `npm run build:server`
- `npm run typecheck`
- `npm run lint`
- `npx vitest run src/server/ordering/index.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/ordering/index.e2e.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/server/session.test.ts -t ordering preferences isolate --bail=1 --maxWorkers=1`
- `npx vitest run src/ordering.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/messages.wire-compat.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/ordering/index.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/ordering/replica.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/ordering/layout.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/runtime/directory-sync/index.test.ts --bail=1 --maxWorkers=1`

Reported targeted test count: **109**. This is the source owner’s recorded count, not a rerun during evidence publication.

Recorded validation status: All targeted tests/static checks and normal hooks passed; pure automatic merge tree preserved

### Raw stdout

- [`6737-build.log.txt`](logs/6737-build.log.txt)
- [`6737-commit.log.txt`](logs/6737-commit.log.txt)
- [`6737-controller.log.txt`](logs/6737-controller.log.txt)
- [`6737-directory.log.txt`](logs/6737-directory.log.txt)
- [`6737-format.log.txt`](logs/6737-format.log.txt)
- [`6737-layout.log.txt`](logs/6737-layout.log.txt)
- [`6737-lint.log.txt`](logs/6737-lint.log.txt)
- [`6737-merge.log.txt`](logs/6737-merge.log.txt)
- [`6737-order-e2e.log.txt`](logs/6737-order-e2e.log.txt)
- [`6737-protocol.log.txt`](logs/6737-protocol.log.txt)
- [`6737-replica.log.txt`](logs/6737-replica.log.txt)
- [`6737-typecheck.log.txt`](logs/6737-typecheck.log.txt)
- [`6737-wire.log.txt`](logs/6737-wire.log.txt)

### Conflict/repair diffs

- [`6737-app-wiring.diff.txt`](diffs/6737-app-wiring.diff.txt)

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- No new browser gesture, native or packaged acceptance; historical source/platform limits retained
- External Hub authentication and maintainer acceptance remain outside this integration

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
