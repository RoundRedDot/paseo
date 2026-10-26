# PR #7467 — fix(android): default interface, content, and code text to 13px

- Delivered source SHA: `8dbc6a9961b0b29ecd234a2b8aac182ea13da05a`
- Tree SHA: `93d22097e28b58d0feeb5bfcf71918bf6d8d8e34`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `app/7467-result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npm run build:server`
- `npm run build:app-deps`
- `npm run format`
- `npm run typecheck`
- `npm run lint`
- `cd packages/app && npx vitest run src/hooks/use-settings/storage.test.ts --bail=1 --maxWorkers=1`

Reported targeted test count: **109**. This is the source owner’s recorded count, not a rerun during evidence publication.

Recorded validation status: build-server 0
build-app-deps 0
test-hooks-use-settings-storage 0
format 0
typecheck 0
lint 0

### Raw stdout

- [`7467-build-app-deps.log.txt`](logs/7467-build-app-deps.log.txt)
- [`7467-commit.log.txt`](logs/7467-commit.log.txt)
- [`7467-format.log.txt`](logs/7467-format.log.txt)
- [`7467-lint.log.txt`](logs/7467-lint.log.txt)
- [`7467-merge.log.txt`](logs/7467-merge.log.txt)
- [`7467-typecheck.log.txt`](logs/7467-typecheck.log.txt)

### Conflict/repair diffs

- [`7467-incoming-overlap.diff.txt`](diffs/7467-incoming-overlap.diff.txt)

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- Historical development-emulator Appearance/default/storage/relaunch proof remains scoped to its named JS/native inputs. Current-head chat/code/plugin visual acceptance and physical-device coverage remain unverified.

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
