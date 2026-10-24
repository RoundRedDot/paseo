# Visible Pad resize slider and shared width

Source: `0eb6c2dfec82d48a7919e578452f9303e236f098`. Previous source: `a20b70c16c2089bc89234e1d2ed417c0838b5178`.

- Touch handle is a permanent 20x64px bordered capsule with six grab dots and a 44x88px touch target. Pressing changes its border and fill; no opacity fade hides the slider.
- Shared component applies to app navigation, Settings, Explorer, and tree rails. Pointer hover behavior is unchanged.
- App navigation and Settings read/write the same sidebarWidth. The browser workflow drags app navigation, opens Settings at that width, directly resizes Settings, reloads, narrows/widens, and returns to app navigation at the updated width.
- Chromium: 3 targeted browser tests passed in 22.2s. Touch light/dark themes and mouse resize/limits/compact navigation covered. Screenshots visually reviewed; all three recordings passed full ffmpeg -xerror decode.
- Changed geometry unit suite: 2 passed. Against previous geometry the updated test fails because a 24px target does not meet the 44px minimum.
- npm run format, npm run lint, npm run typecheck and commit hooks passed. Full suite not run.
- Browser touch emulation only; native iPad/iOS, Android, packaged Electron, Explorer/tree-rail runtime interactions remain unverified. Existing development/icon console diagnostics remain outside this change.

```sh
# packages/app
npx vitest run src/components/sidebar-resize-handle-layout.test.ts --bail=1 --maxWorkers=1
# repository root
npm run test:e2e --workspace=@getpaseo/app -- e2e/browser/settings-navigation.spec.ts --grep 'touch resizing stays discoverable|touch resize slider is visible|settings sidebar mouse resizing' --workers=1 --trace=on
npm run format
npm run lint
npm run typecheck
```
