# PR #6601 — fix(server): lower classes in plugin client bundles for Hermes

- Delivered source SHA: `53a592e4040f7b3e1d22ffa79ea883101d144581`
- Tree SHA: `124494fab68c11bbd4dcd5b67389c31a279cc438`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `compiler/6601/result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npm run build:server`
- `npm run build --workspace=@getpaseo/expo-two-way-audio`
- `npm exec --workspace=@getpaseo/server -- vitest run src/server/plugins/compiler.test.ts --bail=1 --maxWorkers=1`
- `npm run format`
- `npm run typecheck`
- `npm run lint`

### Raw stdout

- [`build-audio.log.txt`](logs/build-audio.log.txt)
- [`commit-receipt.log.txt`](logs/commit-receipt.log.txt)
- [`commit.log.txt`](logs/commit.log.txt)
- [`compiler-tests.log.txt`](logs/compiler-tests.log.txt)
- [`format.log.txt`](logs/format.log.txt)
- [`lint.log.txt`](logs/lint.log.txt)
- [`merge.log.txt`](logs/merge.log.txt)
- [`typecheck.log.txt`](logs/typecheck.log.txt)

### Conflict/repair diffs

- No qualifying conflict/repair diff was retained.

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- Existing RN 0.81.5 Hermes VM evidence below remains historical and source-scoped. This maintenance run does not add RN 0.86.3 VM/device installation, plugin UI, packaged desktop or Windows/Linux acceptance.

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.

## Later source refresh — baseline 678fe308

The later validated refresh is a separate snapshot from this original delivery at baseline `902b0c7a1637cc7a6c2ee268dca8161965a35def`. It records source `7af4968ea43c76fd26c0e98790ac079700735bdd`, tree `79f542f46f1cd830c878c0558a4e9390cd11a5bc`, and parent baseline `678fe308db3acfa3b58866cb7ae603a9a331a07b`. The compiler test and documentation bytes are unchanged from the previous source head; dependency conflict resolution and the later validation/CI readback are recorded separately.

[Later source and CI follow-up evidence](../../followups/6601-main-678fe308/README.md). The earlier 902 baseline receipt above remains historical and unchanged.
