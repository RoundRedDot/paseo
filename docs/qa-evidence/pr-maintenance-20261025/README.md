# PR baseline integration — 2026-10-25

All 42 original PR branches were updated by ordinary local merges of frozen main `4845e1da5851cc049809fb7cfb8e4ce9e3999c03`. No rebase, force push, replacement PR, target change or production daemon restart. The Git-managed isolated checkout was registered as workspace `wks_4df79ebdc808d70f` under project `prj_d83df0de666d0bad`.

## Scope and validation

The three-way preflight and every actual merge completed without textual conflicts. Five PRs touched files also changed upstream: #6809, #7000, #7637, #7714 (Claude history/provider) and #7802 (the Markdown package patch). Those integrated paths received focused regressions; #7802 also received clean patch application and Foundation selection-range checks. No manual production logic change was needed.

Each PR has command/exit-code/timing receipts, individual test outputs and normal commit-hook output. Tests ran one file at a time with one worker and bail enabled. Producer declarations were rebuilt when their input tree changed. Full lint, formatting and normal hooks including complete workspace typecheck passed per merge. Across the 42 trees, 74 selected test-file executions passed 2,525 case executions; these totals include suites repeated on different branches. The native patch script suite, 12 Foundation range cases and four accepted browser samples are additional checks. No full test suite ran. No auth checks were added.

The unified-diff patch contains upstream context lines consisting of one space. The original whitespace-check failure is retained in #6809; subsequent source whitespace checks exclude patches rather than changing their bytes. The first #6809 readback briefly lagged a confirmed push. The #6602 delivery also records a PR-metadata lag; the snapshot separately reports the branch target and PR head. These are not product-test failures.

The main checkout and its existing dirty changes were not used for the updates. Local original heads remain under `refs/pr-maintenance-backups/20261025/<PR>`, and integrated heads under `refs/pr-maintenance-results/20261025/<PR>`. Worktree setup used its own npm installation. The worktree is retained for review and reuse; no unrelated workspace was moved or removed.

## Acceptance boundaries

These merge/static/unit results do not revalidate historical native, packaged Electron, real-provider, physical foldable, font, or relay evidence. Earlier runtime evidence keeps its original revision, client binary and execution host. Public timestamp, plugin lifetime, question-answer format and stepped-animation decisions remain with the maintainer. #7186 and #7774 still lack a demonstrated application performance benefit; correctness/microbenchmarks are separate. #6736, #7186 and #7802 remain Draft.

## #7006 equal-input browser cost check

Serial order: baseline, candidate, candidate, baseline. All runs use the integrated #7006 tree except that the baseline substitutes only the two production reveal modules from frozen main. Candidate bytes were restored and a clean checkout verified afterward. The existing repository E2E fixture and fresh isolated daemon/Metro use dynamically allocated ports; the production daemon is not touched.

| Sample      | Exit | Frame p95 ms | Long tasks | Script seconds | Task seconds |
| ----------- | ---: | -----------: | ---------: | -------------: | -----------: |
| baseline-1  |    0 |         18.4 |          0 |          2.074 |        2.939 |
| candidate-1 |    0 |         18.2 |          0 |          2.132 |        2.997 |
| candidate-2 |    0 |         18.5 |          0 |          2.176 |        3.107 |
| baseline-2  |    0 |         18.5 |          0 |           2.38 |        3.252 |

The first attempt could not launch the missing Playwright Chromium 1208 executable. The matching Chromium was installed with the standard Playwright command; its failed launch output and source-restoration receipt are retained separately. The four accepted samples then passed. Development Metro logs retain pointerEvents/useNativeDriver diagnostics and stacks naming sidebar-menu-toggle.tsx and context-window-meter.tsx; these were not investigated here.

The full fixture, hashes, CDP counters and frame/long-task data are retained per sample. This is a bounded development-browser comparison on one macOS host, not a statistical bound, native/device performance acceptance, a field latency result, or a general performance improvement claim. Initial failed harness attempts, if any, remain separate from accepted samples.

## Delivery snapshot

Readback time: `2026-10-25T10:47:39.923546+00:00`. Upstream main at readback: `4845e1da5851cc049809fb7cfb8e4ce9e3999c03`. CI below is filtered to the delivered head; an older approval or workflow does not cover it. `action_required`, skipped jobs and absent runs are not test passes.

| PR                                                   | Delivered head | PR metadata agrees              | Mergeability | Latest head CI               |
| ---------------------------------------------------- | -------------- | ------------------------------- | ------------ | ---------------------------- |
| [#6601](https://github.com/getpaseo/paseo/pull/6601) | `fb42cf98c3`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#6602](https://github.com/getpaseo/paseo/pull/6602) | `7307613add`   | Pending; branch target verified | UNKNOWN      | No run observed              |
| [#6677](https://github.com/getpaseo/paseo/pull/6677) | `b4f84ecce4`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#6699](https://github.com/getpaseo/paseo/pull/6699) | `be2f5cf987`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#6731](https://github.com/getpaseo/paseo/pull/6731) | `d2f60109c0`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#6732](https://github.com/getpaseo/paseo/pull/6732) | `3437948d17`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#6736](https://github.com/getpaseo/paseo/pull/6736) | `bdaab1d57c`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#6737](https://github.com/getpaseo/paseo/pull/6737) | `589a0187b1`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#6762](https://github.com/getpaseo/paseo/pull/6762) | `e582505237`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#6773](https://github.com/getpaseo/paseo/pull/6773) | `9f23981205`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#6809](https://github.com/getpaseo/paseo/pull/6809) | `64e486f46e`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7000](https://github.com/getpaseo/paseo/pull/7000) | `46fb017d07`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7006](https://github.com/getpaseo/paseo/pull/7006) | `1ed1ec018d`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7014](https://github.com/getpaseo/paseo/pull/7014) | `3055dbd4b3`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7015](https://github.com/getpaseo/paseo/pull/7015) | `a32e316ccc`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7153](https://github.com/getpaseo/paseo/pull/7153) | `ca356293c5`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7186](https://github.com/getpaseo/paseo/pull/7186) | `cb288123ae`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7289](https://github.com/getpaseo/paseo/pull/7289) | `f4539358f3`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7318](https://github.com/getpaseo/paseo/pull/7318) | `a15a9d38cd`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7385](https://github.com/getpaseo/paseo/pull/7385) | `3155b4c86e`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7462](https://github.com/getpaseo/paseo/pull/7462) | `522048c100`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7467](https://github.com/getpaseo/paseo/pull/7467) | `036c9d6c9e`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7482](https://github.com/getpaseo/paseo/pull/7482) | `b16c8459c7`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7495](https://github.com/getpaseo/paseo/pull/7495) | `09745c32ba`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7539](https://github.com/getpaseo/paseo/pull/7539) | `73545abfc5`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7543](https://github.com/getpaseo/paseo/pull/7543) | `a4e5b61b07`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7556](https://github.com/getpaseo/paseo/pull/7556) | `4d5c769d80`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7572](https://github.com/getpaseo/paseo/pull/7572) | `06c9b67b7b`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7620](https://github.com/getpaseo/paseo/pull/7620) | `a8d863cba3`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7624](https://github.com/getpaseo/paseo/pull/7624) | `b13f9f1245`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7625](https://github.com/getpaseo/paseo/pull/7625) | `679130a7c3`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7628](https://github.com/getpaseo/paseo/pull/7628) | `129662c4e9`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7629](https://github.com/getpaseo/paseo/pull/7629) | `be6224df18`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7637](https://github.com/getpaseo/paseo/pull/7637) | `3e225cf8a9`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7647](https://github.com/getpaseo/paseo/pull/7647) | `f4ab584b20`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7654](https://github.com/getpaseo/paseo/pull/7654) | `5b2e9c00df`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7714](https://github.com/getpaseo/paseo/pull/7714) | `4e935653bc`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7774](https://github.com/getpaseo/paseo/pull/7774) | `800b75b1f6`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7776](https://github.com/getpaseo/paseo/pull/7776) | `1cba492d1d`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7802](https://github.com/getpaseo/paseo/pull/7802) | `23bf6de491`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7807](https://github.com/getpaseo/paseo/pull/7807) | `28e2f6801e`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
| [#7861](https://github.com/getpaseo/paseo/pull/7861) | `d0b01dded0`   | Yes                             | MERGEABLE    | CI: action_required (0 jobs) |
