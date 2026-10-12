# Android inverted selection QA

The instrumentation suite compiles the real `PaseoScrollPackage.kt` and `ScrollSelectionTest.kt` from the PR with React Native 0.81.5. The independent harness does not replace the production Paseo application.

Android 16 ARM64 emulator, Pixel_10_Pro AVD. On the old implementation, 3 of 6 tests fail: focus moves offset 400 to 1200, selection visibility moves it to 1140, and horizontal-only inversion incorrectly suppresses vertical reveal. The fixed implementation passes all 6 tests.

For interactive QA, long press paragraph 5 in the fixed harness. Android's selection handles appear and the offset remains 400. Drag the right handle: selection expands from `reading` to `reading text.` while the offset remains 400. See before.png, handles.png, drag.png.

The initial defect was also reproduced in the installed Paseo 0.11.2 on an OPPO PLA110, Android 16, font_scale=1.0: independent text templates in the timeline moved down 282 physical pixels during selection. No private conversation screenshots are published here.

Full Paseo app verification after rebuilding on the OPPO is pending. The shipped app and installed beautiful-chat plugin were not replaced by this PR.

## Reproduce instrumentation

Copy the harness directory to `.dev/selection-harness` in a checkout of the PR, then run with Java 21 and Android SDK 36:

```sh
gradle -p .dev/selection-harness assembleDebug assembleDebugAndroidTest --no-daemon --max-workers=1
adb -s <emulator> install -r .dev/selection-harness/build/outputs/apk/debug/selection-harness-debug.apk
adb -s <emulator> install -r .dev/selection-harness/build/outputs/apk/androidTest/debug/selection-harness-debug-androidTest.apk
adb -s <emulator> shell am instrument -w -e class sh.paseo.scroll.ScrollSelectionTest sh.paseo.scroll.qa.test/androidx.test.runner.AndroidJUnitRunner
```

To obtain the red result, keep the PR tests and restore only the production `PaseoScrollPackage.kt` from base commit 6f62125ee018c5c44e6897c160094594b151036f. To run interactive QA, launch `sh.paseo.scroll.qa/.SelectionActivity`.
