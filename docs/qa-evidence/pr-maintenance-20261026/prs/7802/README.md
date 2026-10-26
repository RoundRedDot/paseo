# PR #7802 — feat(ios): select paragraphs and list items on double tap

- Delivered source SHA: `a5b0248ec7d917dd809c090ccac0dee2fb3f4bbc`
- Tree SHA: `da5bcbf0bbf13b4b216b2b2c24c7deec7af7448f`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `ios/result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `bash setup.sh`
- `bash validate.sh`
- `bash native-syntax.sh`
- `bash commit.sh`
- `npm run postinstall`
- `npm exec --workspace=@getpaseo/app -- vitest run src/components/markdown/renderer.test.ts --bail=1 --maxWorkers=1`
- `npm run format`
- `npm run typecheck`
- `npm run lint`

Recorded validation status: build-app-deps exit 0; build-server exit 0; format exit 0; foundation-build exit 0; foundation exit 0; lint exit 0; native-syntax exit 0; patch-script exit 0; postinstall exit 0; renderer exit 0; typecheck exit 0

### Raw stdout

- [`build-app-deps.log.txt`](logs/build-app-deps.log.txt)
- [`build-server.log.txt`](logs/build-server.log.txt)
- [`format.log.txt`](logs/format.log.txt)
- [`foundation-build.log.txt`](logs/foundation-build.log.txt)
- [`foundation.log.txt`](logs/foundation.log.txt)
- [`lint.log.txt`](logs/lint.log.txt)
- [`native-syntax.log.txt`](logs/native-syntax.log.txt)
- [`patch-script.log.txt`](logs/patch-script.log.txt)
- [`renderer.log.txt`](logs/renderer.log.txt)
- [`typecheck.log.txt`](logs/typecheck.log.txt)

### Conflict/repair diffs

- No qualifying conflict/repair diff was retained.

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- Current-head GitHub Actions completed/action_required, no passing CI result.
- No recorded review for delivered head.
- Rebuilt iPhone/iPad UIKit acceptance: double tap, both selection handles, Copy, cross-block adjustments, links/images/task taps and scrolling. No full native client build or performance claim.

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
