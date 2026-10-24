# Android Pad native validation — PR #7776

Source: `0eb6c2dfec82d48a7919e578452f9303e236f098`. Built and exercised on Mac Studio, in an isolated Pixel Tablet AVD (Android 17 / API 37 / arm64-v8a). This is a real React Native debug APK with the PR's Metro bundle, not browser touch emulation.

Build: `APP_VARIANT=development npx expo prebuild --platform android --no-install`, then `./gradlew :app:assembleDebug --no-daemon --max-workers=1 -PreactNativeArchitectures=arm64-v8a`. Build succeeded in 8m48s, 777 tasks executed. APK and bundle hashes are in receipt.json. The source checkout stayed clean.

## Observed workflow

1. Native hierarchy and screenshots show a permanent 20x64dp capsule with six grab dots and a 44x88dp touch target (40x128px and 88x176px at density 2).
2. A real Android `input swipe` on the main handle increased its width from 320dp to 460.375dp. Settings opened at the same saved width (921px after rounding).
3. Dragging the Settings handle reduced it to 388.5751953125dp (777px). Returning to app navigation produced the same width.
4. Force-stopping and reopening the app preserved the value. The first restart notification dialog was dismissed before UI assertions; dialog-covered snapshots were excluded from acceptance.
5. At 550dp window width, the app's compact-shell was present and resize handles were absent. The saved width remained unchanged. Restoring the 1280dp window restored the saved width.
6. At 600dp window width, Settings rendered a 200dp sidebar and 400dp detail pane, retaining its saved 388.5751953125dp value. Widening restored it.
7. Native dark mode preserved the slider and shared width. Dragging in dark mode changed the saved width again to 421.4794921875dp.

Assertions compare native UIAutomator bounds with read-only AsyncStorage SQLite readback. The Android crash buffer was empty at the end. Development startup emitted React/Reanimated soft mounting warnings; these are not claimed fixed by this PR.

## Artifacts and limits

- `native-shared-width-demo.mp4`: 36-second excerpt showing direct Settings resizing and return to app navigation. Encoded to constant frame rate from Android screenrecord; full decode passed.
- Screenshots show the main/sidebar transition, restart, compact/expanded layouts, medium-width clamp and dark theme.
- `receipt.json` contains exact widths, native bounds, hashes and acceptance scope.
- Native emulator validation does not establish physical foldable hinge behavior, release-package acceptance, native iPad/iOS, or packaged Electron acceptance.

Owned test Metro, daemon, recording and emulator were stopped. Existing remote simulators and physical devices were left intact. The dedicated AVD, source worktree and artifacts remain for reproduction.
