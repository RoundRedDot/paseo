# Stable agent features QA

Source baseline: `getpaseo/paseo` main `48623801a1bba8f1c259212d37f56a504812e42d`.
Fix: `72886023ca99dd990337a8f70cdef2a6d304395e`.

Environment: macOS 27.0.1 (26A434), Node v24.18.0, worktree Expo web in headless Playwright Chromium, viewport 1280x900 at DPR 1. Private daemon: `PASEO_HOME=/tmp/stable-agent-features-qa/home`, `PASEO_SERVER_ID=stable-features-qa`, `PASEO_LISTEN=127.0.0.1:6943`, `PASEO_NODE_ENV=development`. Expo: `EXPO_PUBLIC_LOCAL_DAEMON=localhost:6943 npx expo start --web --port 8234 --clear`. The daily daemon was never used or restarted.

## Reproduction

1. Install with `npm ci --ignore-scripts`, apply patches with `PATH="$PWD/node_modules/.bin:$PATH" node scripts/postinstall-patches.mjs`, then run `npm run build:server` and `npm run build:app-deps`.
2. Start the private daemon from `packages/server/dist/scripts/supervisor-entrypoint.js` with the environment above. Set `PASEO_CORS_ORIGINS=http://localhost:8234`, `PASEO_RELAY_ENABLED=0`, `PASEO_DICTATION_ENABLED=0`, `PASEO_VOICE_MODE_ENABLED=0`, and `PASEO_{DICTATION_STT,VOICE_TURN_DETECTION,VOICE_STT,VOICE_TTS}_PROVIDER=openai` to avoid unrelated local speech model downloads.
3. Start Expo from `packages/app` with the command above. Run `node /path/to/run.mjs <sample-name>` from the repository root. The script verifies the private server ID, resets only that synthetic daemon's projects, creates a mock agent with a fixed streaming response and 200 ms token interval, enables the built-in render profiler, and sends 50 sequential label updates at 80 ms intervals during the response.
4. For before, use the production file from `git show 48623801a:packages/app/src/runtime/directory-sync/internal/agent-store.ts`. For after, restore the fixed file. Expo was cold-started with `--clear` for the primary pair. Each sample uses a fresh browser context and fresh synthetic agent.

## Primary pair (existing profiler, no fiber hook)

| Observation | Before | After |
| --- | ---: | ---: |
| Browser agent upserts | 52 | 52 |
| Distinct serialized features values | 1 (`[]`) | 1 (`[]`) |
| `agent.features` memo reason count | 52 | 0 |
| `agent.status` memo reason count | 2 | 2 |
| `streamItems` memo reason count | 2 | 2 |
| `turnPresentation` memo reason count | 2 | 2 |
| Final agent status | idle | idle |

Raw observations: `before-controlled.json`, `after-controlled.json`; concise logs have the same stems. These are counts from the comparator's reason recorder, not a count of all React renders. The fixed streaming text still updates through its existing stream subscriptions. Neither CPU savings nor end-to-end smoothness was measured.

Visuals: `before-controlled.png` and `after-controlled.png` show only synthetic work. The transcript region `(320,80)-(1280,330)` is identical: `magick compare -metric AE before-timeline.png after-timeline.png null:` returned `0 (0)`. The assertion covers that crop, not dynamic timestamps elsewhere.

## Separate diagnostic pair (read-only React DevTools fiber hook)

| Observation | Before | After |
| --- | ---: | ---: |
| Browser agent upserts | 52 | 52 |
| `agent.features` memo reason count | 52 | 0 |
| Distinct `features` references in committed view props | 53 | 1 |
| Distinct `capabilities` references in committed view props | 53 | 53 |
| Distinct serialized capabilities values | 1 | 1 |
| Distinct history-row `renderStreamItem` callbacks | 51 | 3 |

Raw observations: `before-diagnostic.json`, `after-diagnostic.json`. `run.mjs` includes the read-only hook used in this second pair. The primary pair used the same script before the hook was added. Fiber observations include reused props on parent commits; `viewObservations` is not a component-render count. The hook changes scheduling, so do not compare durations between these samples or infer plugin CPU/commit savings from them. No third-party plugin was installed. The plugin-specific theme wrapper was not measured here.

The independently observed current-main value is `[]`, not the `{}` noted in the earlier plugin-side investigation. This fix intentionally leaves `capabilities` reference churn unchanged.

## Automated checks

- `red-swapped.log`: replace only the production file with `git show origin/main:<path>` and run `npx vitest run src/runtime/directory-sync/agent-replica.test.ts --project unit --bail=1` from `packages/app`. Fails at `expect(empty.features).toBe(initial.features)` with two distinct empty arrays. The fixed file was restored byte for byte afterward.
- `green.log`: same existing suite on the fix, 14/14 passed. Added cases cover delta, directory snapshot, and timeline snapshot paths, timestamp/title updates, empty and nonempty equality, nested option changes, addition and removal.
- `typecheck.log`: `npm run typecheck`, exit 0.
- `lint.log`: `npm run lint`, 0 warnings and 0 errors.
- `format.log`: `npm run format`, exit 0, only the two intended source/test files changed.
- `commit.log`: hooks passed format check, targeted lint and full typecheck. No hooks were skipped.

All four browser samples recorded the same existing DOM unknown-prop warnings for `uniProps`, `accessibilityElementsHidden`, and `importantForAccessibility`. They are included in the raw JSON. There were no captured `pageerror` exceptions. Developer error-toast chrome was hidden using the repository E2E pattern.

Not tested: packaged Electron, iOS, Android, real provider integration, third-party plugin rendering, CPU/battery/latency gains. No protocol or daemon behavior changes are included.
