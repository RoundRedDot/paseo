# Tablet sidebar width QA — 2026-10-24

Source commit: `65f04f15892e66470d62e6e9667482981abd1069`. Baseline: `686588c44be479ee3b5de04ed576ae0a97d3c915`.

Chromium browser, touch emulation enabled, 1366×1024 then 1000×1024. This is browser evidence; iPad/iOS native, Android native, and packaged Electron were not tested.

- Real CDP touchStart/touchMove/touchEnd input resizes the app sidebar. Idle grip opacity is 0.15, active is 0.3, release returns to 0.15.
- Open Settings through its app control: its sidebar uses the saved width. Reload and narrow/widen the viewport: the saved width remains the same. Back returns to the resizable app sidebar.
- Same regression against baseline production files fails at idle opacity: received 0, expected 0.15. Unit regression fails at settings content minimum: received 720, expected 640.
- Fixed source: two targeted unit files / 14 tests passed; one targeted browser test passed (3.9 s test, 13.2 s run).
- Full npm run typecheck, npm run lint, npm run format passed; pre-commit format/lint/typecheck hooks passed. No full test suite run.
- Browser run emitted existing development warnings and icon console errors; these are not claimed fixed by this change.

Commands:

```sh
npm run build:server
npm run build --workspace=@getpaseo/expo-two-way-audio
# from packages/app
npx vitest run src/components/desktop-sidebar-layout.test.ts src/components/sidebar-resize-handle-layout.test.ts --bail=1 --maxWorkers=1
# from repository root
npm run test:e2e --workspace=@getpaseo/app -- e2e/browser/settings-navigation.spec.ts --grep 'touch resizing stays discoverable' --workers=1 --trace=on
npm run typecheck
npm run lint
npm run format
```

Artifacts:

- baseline-idle-grip.png: baseline invisible grip (expected regression failure).
- tablet-before-drag.png: fixed idle grip before interaction.
- tablet-settings-wide.png: Settings after resizing.
- tablet-settings-narrow.png: Settings at 1000px after reload.
- video.webm: full passing browser test, 4.72 seconds; ffmpeg -xerror decode passed.
