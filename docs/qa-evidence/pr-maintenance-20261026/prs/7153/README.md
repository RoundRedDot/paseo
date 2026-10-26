# PR #7153 — fix(app): use tablet layout on Android foldables

- Delivered source SHA: `2d6ad36f42764f6de0cd6f909c91e13cfa850a11`
- Tree SHA: `d945033fe74a9cf4722f9173c2aea52617297f37`
- Frozen baseline: `902b0c7a1637cc7a6c2ee268dca8161965a35def`
- Source report: `tablet/7153-result.json`
- Host/platform: Source workers: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent independently reported `Darwin arm64`. Per-report runtime: platform: macOS-27.0.1-arm64-arm-64bit, architecture: arm64, node: v24.18.0, npm: 11.16.0, runtimeBoundary: Local macOS Chromium, isolated E2E daemon and Metro; not a packaged desktop or native build.

## Commands and stdout

Commands below were recorded by the source owner; original stdout is linked in `logs/` and preserved byte-for-byte with a `.txt` suffix. `receipt.txt` carries the reduced validation and CI metadata.

- `npx vitest run <file> --bail=1 --maxWorkers=1`
- `npx playwright test e2e/browser/explorer-sidebar.spec.ts --project=browser --workers=1 --grep "yields navigation|restores Explorer on a narrow workspace reload|tablet prototype|retains the Explorer host"`
- `npx playwright test e2e/browser/settings-navigation.spec.ts --project=browser --workers=1 --grep "Settings sidebar scroll position|host choice survives|switching the host picker"`
- `npx vitest run src/components/desktop-sidebar-layout.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/components/explorer-sidebar-layout.test.ts --bail=1 --maxWorkers=1`
- `npx vitest run src/styles/breakpoints.test.ts --bail=1 --maxWorkers=1`

Recorded validation status: Clean install and declaration builds, format, full typecheck/lint and normal hooks passed. Layout units: 29 desktop + 6 Explorer + 6 breakpoint cases passed. Chromium: 4 resize/restore/fold cases passed; the extra theme-retention case initially failed on the baseline macOS shortcut mismatch, then passed after the one-line test-helper correction (17.3s). All 7 Settings scroll/host-selection cases passed (41.9s). Product source was unchanged by the helper correction; already-green suites were not repeated.

### Raw stdout

- [`7153-breakpoints.test.ts.log.txt`](logs/7153-breakpoints.test.ts.log.txt)
- [`7153-build-app-deps.log.txt`](logs/7153-build-app-deps.log.txt)
- [`7153-commit.log.txt`](logs/7153-commit.log.txt)
- [`7153-desktop-sidebar-layout.test.ts.log.txt`](logs/7153-desktop-sidebar-layout.test.ts.log.txt)
- [`7153-explorer-browser.log.txt`](logs/7153-explorer-browser.log.txt)
- [`7153-explorer-followup-browser.log.txt`](logs/7153-explorer-followup-browser.log.txt)
- [`7153-explorer-sidebar-layout.test.ts.log.txt`](logs/7153-explorer-sidebar-layout.test.ts.log.txt)
- [`7153-followup-format.log.txt`](logs/7153-followup-format.log.txt)
- [`7153-followup-lint.log.txt`](logs/7153-followup-lint.log.txt)
- [`7153-followup-typecheck.log.txt`](logs/7153-followup-typecheck.log.txt)
- [`7153-format.log.txt`](logs/7153-format.log.txt)
- [`7153-lint.log.txt`](logs/7153-lint.log.txt)
- [`7153-merge.log.txt`](logs/7153-merge.log.txt)
- [`7153-settings-browser.log.txt`](logs/7153-settings-browser.log.txt)
- [`7153-typecheck.log.txt`](logs/7153-typecheck.log.txt)

### Conflict/repair diffs

- [`7153-auto-overlaps.diff.txt`](diffs/7153-auto-overlaps.diff.txt)
- [`7153-conflict-resolution.diff.txt`](diffs/7153-conflict-resolution.diff.txt)
- [`7153-test-shortcut-adjustment.diff.txt`](diffs/7153-test-shortcut-adjustment.diff.txt)

## CI, review, and remaining gaps

CI observations apply only to the SHA recorded in `receipt.txt`. An `ACTION_REQUIRED` conclusion is not a passing result, and this bundle does not infer the underlying gate. Test/build output, device acceptance, CI, and maintainer review remain separate.

- No new native Android build or physical hinge test, native iPad acceptance, release APK or packaged Electron run. Browser viewport changes prove browser layout only. Existing Android emulator/device evidence retains its recorded source/build identity.

This publication contains selected allowlisted source-owner logs and receipts; source tests were not rerun for publication. No full-suite, new device, or new provider acceptance is claimed.
