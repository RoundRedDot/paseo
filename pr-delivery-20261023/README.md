# Paseo PR delivery evidence — 2026-10-23

This records local checks and actual browser/relay runs. It does not establish upstream CI, native-device acceptance, or maintainer approval. All browser conversations and relay payloads here are synthetic fixtures. Tests use private daemon homes and ports; the installed daemon on 6767 was not restarted.

## Conflict integrations

All six branches merge `582beeb10bf7a0dc2297f35529f78df89dee9358` without rewriting their existing history. Exact heads are in `source-receipt.json`.

| PR    | Targeted checks                                                                                                                                                   | Boundary                                                                                                          |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| #7153 | 80 layout/navigation/route tests; build, root typecheck/lint/format and normal hooks                                                                              | No new native fold-cycle run                                                                                      |
| #6732 | 184 client tests; build, root typecheck/lint/format and normal hooks                                                                                              | Not a new encrypted-relay/native cache run                                                                        |
| #6736 | 233 manager/timeline integration tests plus 149 session tests; build, root typecheck/lint/format and normal hooks                                                 | Draft retained; OMP/native acceptance remains open                                                                |
| #6737 | 65 app controller/store/model tests plus 150 session tests; build, root typecheck/lint/format and normal hooks                                                    | Ordinary workspace order follows upstream Created/Last prompt; only pinned workspace and tab gestures synchronize |
| #6699 | 126 stream/projection/cache tests; build, root typecheck/lint/format and normal hooks                                                                             | Public timestamp semantics remain a maintainer decision                                                           |
| #7629 | 55 relay tests; final secure-channel rerun 27 tests; 11 client transport tests; 10 real local-relay E2E tests; build, root typecheck/lint/format and normal hooks | Noise protection retained; no phone performance claim                                                             |

#6737 also passed one real Chromium/Chromium test for pinned workspace and tab ordering, reload and offline replay. Screenshots, video and result are under `6737-candidate/`. This tests browser clients, not native or packaged Electron.

#7629 additionally exchanges identical text and binary with the actual modules built from the pre-compression upstream revision in both protected and legacy directions. `7629-actual-version-compat.json` records five successful combinations. A 100,103-byte JSON payload uses a 1,098-byte binary application frame between two updated protected peers; mixed protected peers retain the original 133,536-byte text frame. These are one synthetic payload's wire sizes, not a phone or production benchmark. Rebuilding relay from final committed source produced identical dist bytes.

## #7620: delayed catalog first paint

Production source: `83cc7b7c82e2ac9442d47c0993e0962e4bc6b3ae`. The regression was committed as `f4aef636e`; it changes no production files. Baseline: `12e7a448f0f1a40cb78857cf1e29b385f71670ba` production versions of the three existing files touched by the PR, in the same checkout/dependencies and with the same test/fixture. The new unreferenced timeline-paint module stays present in the control checkout.

The real app loads an installed directory plugin and completes a synthetic streamed reply. On reload the test holds actual `plugin.catalog.get.response` frames for one second while sampling native assistant rows through a MutationObserver. The baseline fails because source rows appear. The candidate keeps zero native assistant rows while waiting, then renders the plugin card when the held catalog is released.

`7620-baseline/` and `7620-candidate/` hold result, screenshots, DOM samples and video. An earlier candidate attempt reached the plugin-rendered content but failed a helper's unrelated `Assistant complete` label expectation: reload showed `Assistant streaming`. The revised assertion checks the transformation/card, not cached phase labeling. That failed attempt remains in local retained artifacts; no claim is made that cached phase labeling is correct. The final regression removes a redundant IndexedDB-schema probe after the successful runtime run; that removal changes no product bytes and the remaining assertions are identical. Root typecheck/lint/format and normal hooks pass.

## #7624: web cache repair

Before: `949132ce0b83ad4fab07e578d18055a4286b9355`. Its production Web path calls expo-file-system, which logs `expo-file-system is not supported on web` and `this.validatePath is not a function`; the cached-catalog reload assertion fails while network catalog responses are held. See `7624-browser-before.log`.

After: `2b201cea58c13d95954584c2fefa5f8f64d6d0c7`. Web/Electron-web use IndexedDB through Metro's `.web.ts` resolution; native keeps its file store. The format/parser is shared. Ten unit/catalog-sync tests pass, including persistence across module reloads, exact host keys, replacement and placeholder exclusion. The actual browser reload renders the transformed card while the network response is still held. The final committed head passed the same real browser test. Screenshots/video/result are under `7624-candidate/`.

This is warm reload/cache-hit proof. Native file persistence, native performance, multi-version network replacement and real-device direct-to-relay handover are not accepted by this run. Root typecheck/lint/format and normal hooks pass. The first unit attempt resolved the new `.web.ts` file for the older native-storage test; explicitly importing the native source in that test fixed the harness. The first browser helper also used the unrelated cached phase label; the final helper verifies the transformed card.

## #7006: manual reasoning remains partial

Production source: `aee154169eee87194dd6360602139c295a38657a`; no production changes or new approval were made here. Both attempts run a new local test in the existing closing-fence suite, against a private daemon and the real Chromium app. `7006-manual-attempt.patch` preserves that diagnostic test without committing a failing check into the PR.

The first run stopped because the located button had no `aria-expanded` attribute. The second uses actual visibility: it clicks the thinking badge, but the expected canonical text still does not become visible. See the canonical JSON, before-cleanup screenshot, video and result under `7006-manual-first/` and `7006-manual-second/`. Manual expansion/collapse/reload is **not passed**; these observations alone do not establish a regression introduced by this PR. Earlier automatic-expansion proof retains its original source/platform scope.

The historical six-run equal-input performance reports are included with a `historical-` prefix. Their candidate/control medians were task time +5.3% and scripting +5.0%, with no long tasks observed and frame p95 about 9.2 ms. They are unthrottled development-build observations; no performance budget or production/native acceptance is assumed.

## Remaining gates

No Android device was connected for this run. No new native client was built or executed. #7289 still needs the affected OPPO firmware in Paseo's actual command/output UI. #7654 and #6601 still need current native acceptance. Older #7006/#6601 approvals refer to their recorded reviewed commits, not these latest heads. CI `action_required` with zero jobs is not a test pass.

The JSON manifest records file hashes. Original traces and all setup/failed attempts remain in the local delivery directory; only relevant synthetic screenshots/video, canonical samples and check logs are published here. No full test suite was run locally.
