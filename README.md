# Direct Settings sidebar resize QA

Source: `a20b70c16c2089bc89234e1d2ed417c0838b5178`. Previous PR head used for baseline: `65f04f15892e66470d62e6e9667482981abd1069`.

Browser evidence only. iPad/iOS native, Android native, and packaged Electron remain untested.

Passing run: 2 browser tests, 19.2s total.

- Chromium touch emulation: resize app navigation, then directly drag the Settings sidebar. Verify idle 0.15 / pressed 0.3 / release 0.15 opacity, saved width, reload, 1366x1024 -> 1000x1024 -> 1366x1024, then return to app navigation at the same width.
- Chromium mouse: directly drag Settings, verify live resizing before release and stored limits 200–600px. A 720px viewport temporarily clamps the 600px width to 320px without overwriting the saved value. Widen and reload restores 600px. At 390px compact navigation has no resize handle.
- Baseline: same touch test against previous PR settings implementation fails because settings-sidebar-resize-handle-grip does not exist. baseline-settings-no-handle.png is that expected failure.
- Existing targeted layout/handle unit suites: 14 passed. Gesture behavior is covered by browser input rather than mocked unit tests.
- Full npm run typecheck, npm run lint, npm run format passed. Commit hooks format/lint/typecheck passed. No full suite run.
- Both published WebM recordings passed full ffmpeg -xerror decode. Screenshots were visually reviewed.
- Existing development warnings and icon console errors are outside this change.

```sh
# packages/app
npx vitest run src/components/desktop-sidebar-layout.test.ts src/components/sidebar-resize-handle-layout.test.ts --bail=1 --maxWorkers=1
# repository root
npm run test:e2e --workspace=@getpaseo/app -- e2e/browser/settings-navigation.spec.ts --grep 'touch resizing stays discoverable|settings sidebar mouse resizing' --workers=1 --trace=on
npm run format
npm run lint
npm run typecheck
```
