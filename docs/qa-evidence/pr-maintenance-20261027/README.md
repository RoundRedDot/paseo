# PR maintenance evidence — 2026-10-27

**Immutable evidence snapshot for the 2026-10-27 PR maintenance round.**

Integrity hashes are listed in [`manifest.sha256.txt`](./manifest.sha256.txt); selected evidence folders also carry nested manifests.

Frozen source-integration baseline: `9e4aab16cc74f945f9bb676fcab3d8a9a8b686ca`. Selected raw text outputs are byte-for-byte copies with `.txt` suffixes; screenshots and images retain their original binary bytes. Each PR page names its exact source SHA/tree and current CI snapshot.

## Delivered source receipts

- [#7714](./prs/7714/README.md) — Final refreshed delivery `79d6a4f7` against main `2ce6681`; 151 targeted tests passed.
- [#6809](./prs/6809/README.md) — Retained background-subagent history and sidechain behavior across asynchronous replay.
- [#7014](./prs/7014/README.md) — Integrated async question handling and provider history behavior while preserving existing provider contracts.
- [#6601](./prs/6601/README.md) — Validated Babel worker-lowering integration and plugin build responsiveness against the frozen baseline.
- [#7625](./prs/7625/README.md) — Integrated compiler minification while preserving the upstream nonblocking worker boundary.
- [#6732](./prs/6732/README.md) — 388 focused tests passed and 173 were skipped across server/client/plugin suites; the browser retry passed after the initial missing-browser prerequisite. Retained both plugin catalog instance identity and cached bundle hash across #7938 integration.
- [#6736 refreshed source and seeded-clone QA](./pending/6736-source-only.md) — Final head `59bfc43e` reports 265 focused passes; a separate zero-inference seeded-clone diagnostic passed with explicit provider/native/CI limits.
- [#7318 final source refresh](./prs/7318/README.md) — Delivered `d5032deb` against main `b12eefb`; 43 new focused tests passed. Its earlier no-op audit remains historical.
- [#7000](./prs/7000/README.md) — Delivered persisted turn timing for completed sessions; 297 targeted tests passed across timing, history, protocol and timeline coverage.
- [#7637](./prs/7637/README.md) — Preserved automatic Claude history-query ownership while surfacing API-error turn failures; 16 focused tests passed.
- [#7015](./prs/7015/README.md) — Integrated native Grok/Cursor question dispatch and structured answer handling.
- [#6737](./prs/6737/README.md) — Integrated cross-client ordering state across session, authorization, and retained timeline projections.
- [#7482](./prs/7482/README.md) — Validated client package API exports and retained the existing public import boundaries.
- [#7807](./prs/7807/README.md) — Integrated persisted workspace settings and tab behavior; 166 unit cases and 7 Chromium cases passed.
- [#7467](./prs/7467/README.md) — Preserved the send-shortcut setting alongside font settings; 112 storage cases and two Chromium cases passed.
- [#7556](./prs/7556/README.md) — Integrated streamed timeline/server session updates and retained pagination behavior.
- [#7006](./prs/7006/README.md) — Real-wheel browser interaction completed the Thinking expansion/reopen/reload scenario; production files were unchanged.
- [#7802](./prs/7802/README.md) — The existing dependency patch was repaired and a Debug simulator build succeeded.

## Historical no-op audits against the frozen baseline

- [#6677](./prs/6677/README.md) — Public reference-doc overlap only; per-agent-tools/API contracts were unaffected.
- [#6731](./prs/6731/README.md) — Docs-only lifetime overlap; the transient-disconnect plugin lifetime remains a maintainer decision.
- [#6773](./prs/6773/README.md) — Translation keys were disjoint; no semantic overlap was found.
- [#7318](./prs/7318/README.md) — The initial frozen-baseline no-op audit is historical; final refreshed head `d5032deb` integrates main `b12eefb`, with 43 new focused passes. The older audit count is not included as new tests.
- [#7462](./prs/7462/README.md) — Public reference-doc overlap only; per-agent-tools/API contracts were unaffected.
- [#7629](./prs/7629/README.md) — Internal release versions only; no compression or framing dependency change.
- [#7654](./prs/7654/README.md) — Public reference-doc overlap only; per-agent-tools/API contracts were unaffected.

## Partial and blocked evidence

- [#6736 source/QA follow-up](./pending/6736-source-only.md): refreshed source `59bfc43e` reports 265 targeted tests. The separate seeded-clone diagnostic passed ID/PNG restoration, daemon restart, cache/reload and lightbox checks with zero new prompt submissions; vendor image-input stripping remains NOT PASSED. Native image acceptance is NOT VERIFIED: PHN110 was connected but not allocated, so no native image run occurred; iOS fixture-selection QA is separate. Packaged Electron acceptance is unverified.
- [#7802](./prs/7802/README.md): Debug simulator build passed; UIKit phone evidence is partial, with initial paragraph/nested-item Copy failures. iPad/Release/full-chat/performance remain untested.
- [#7289](./prs/7289/README.md): PHN110 was connected, but allocation was declined; affected-device acceptance remains open.
- [#7927](./prs/7927/README.md): independent peer attachment metadata was absent before rewind; two cases failed at that prerequisite, rewind/resend was not reached, source was unchanged.
- [#7186 performance evidence](./performance/7186/final-public/README.md): no new native performance sample; PHN110 was connected but not allocated, so Android acceptance remains open.
- [#7774 corrected A/A STOP](./performance/7774/final-public/README.md): valid 2A completed; key RAF p95 noise was 31.818% against the 15% limit, so testing stopped with 0 B and 0 returning-A samples. No benefit is established.
- [#7556 bounded performance STOP](./performance/7556/final-public/README.md): the 205-history precondition failed and there are zero timed samples; no noise, regression, or benefit claim. Prior selected evidence remains at [the initial capture set](./performance/7556/public/README.md).

## Current-head CI and maintainer choices

The [05:53Z exact-head snapshot](./metadata/current-state-ci.json) is retained as historical context; later source pages include exact-head CheckSuite receipts for refreshed deliveries. These workflows are `ACTION_REQUIRED` with zero jobs and check-runs, not passing CI. Viewer `luoph` had upstream `pull` permission, and the specific gate was not exposed, so no workflow was run or approved. The [publication state snapshot](./metadata/publication-snapshot.json) records the 07:15Z parent acceptance and subsequent main drift. At that acceptance, all 24 accepted source/no-op heads matched; the coordinator later reported main `26ee20b3` and six conflicting PRs. Four of those are in this bundle’s body-target set (#6736, #7000, #6737, #7556). The evidence preserves accepted SHAs and does not claim all PRs remain mergeable. See [decision notes](./DECISIONS.md) for the undecided #7015 answer format, #6731 disconnect lifetime, and #6699 timestamp semantics.

## Platform and scope limits

Source-owned targeted checks are not full-suite, device, provider, packaged-release, or performance acceptance. Each PR page states the owner-reported remaining scope. Local source checks were recorded on the shared `luoph-mbp` macOS arm64 host; individual Node/toolchain versions remain in the source receipts where supplied. Final ADB inventory showed PHN110 connected, but its allocation was declined; no native Android acceptance is claimed. No product tests were rerun for evidence publication.

The app selection is limited to visually checked synthetic screenshots and scanned compact summaries. Browser trace ZIPs/videos, console dumps, event traces carrying URL/response fields, caches, storage, teardown, and private/provider conversation data are excluded. The worker's 84-file app allowlist is hash/size-checked and summarized in [app-selection-receipt.json](./app-selection-receipt.json); it is not copied wholesale.
