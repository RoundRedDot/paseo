# PR #7629 — perf(relay): compress relay payloads before encryption

- Delivered source SHA: `8239861ddce82a64ffba8284d16416581b0e35ec`
- Tree SHA: `2cf696d61688c9ab7747cc1df219b9ffa6f396cf`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `compiler/7629/result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npm run build:server`
- `npm run build --workspace=@getpaseo/expo-two-way-audio`
- `npm exec --workspace=@getpaseo/relay -- vitest run src/encrypted-channel.test.ts --bail=1 --maxWorkers=1`
- `npm exec --workspace=@getpaseo/relay -- vitest run src/secure-channel.test.ts --bail=1 --maxWorkers=1`
- `npm exec --workspace=@getpaseo/client -- vitest run src/daemon-client-transport.test.ts --bail=1 --maxWorkers=1`
- `npm exec --workspace=@getpaseo/server -- vitest run src/server/daemon-e2e/relay-transport.e2e.test.ts --bail=1 --maxWorkers=1`
- `npm run format`
- `npm run typecheck`
- `npm run lint`

### Raw stdout

- [`build-audio.log.txt`](logs/build-audio.log.txt)
- [`commit-receipt.log.txt`](logs/commit-receipt.log.txt)
- [`commit.log.txt`](logs/commit.log.txt)
- [`encrypted-tests.log.txt`](logs/encrypted-tests.log.txt)
- [`format.log.txt`](logs/format.log.txt)
- [`lint.log.txt`](logs/lint.log.txt)
- [`merge.log.txt`](logs/merge.log.txt)
- [`secure-tests.log.txt`](logs/secure-tests.log.txt)
- [`transport-tests.log.txt`](logs/transport-tests.log.txt)
- [`typecheck.log.txt`](logs/typecheck.log.txt)

### Conflict/repair diffs

- No qualifying conflict/repair diff was retained.

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- The relay E2E uses an isolated local relay and daemon. It does not establish deployed production relay, phone foreground/background/reconnect, device CPU/battery, or app UI acceptance. Historical measurements below retain their original revisions.

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
