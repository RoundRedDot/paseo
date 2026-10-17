# #7186 isolated native offline-reload acceptance

**Result: scoped native cache/offline-content acceptance complete.** Candidate is fixed at **85f7d56ea79f8b7c22538a2b763875f4ce2d74ad**. The product direct-link demand gap remains unfixed; no performance improvement is claimed.

One parent-authorized harness-correction runtime used the same already-built instrumented iOS Simulator Release app. It opened the normal sidebar to obtain demand, streamed through the normal mock control interface, tapped the actual `scroll-to-bottom-button`, and verified visible END. It then stopped only its synthetic host, independently proved proxy/upstream ports closed, terminated/relaunched the app, navigated the same known workspace, and verified offline body/END plus two stable actual SQLite readbacks.

**Navigation boundary:** the screenshot 12 seconds after cold process launch, before explicit workspace navigation, is blank. This acceptance covers cached content after cold launch plus a normal known workspace deep link. It does not claim automatic initial-route restoration without navigation. No route/gate/store changes were made.

App executable SHA256: `7a07b73393b1baeca7a1bd892b4435701fe9d5ed0a61fcd6fccd60e3db4d5115`. Hermes bundle SHA256: `3149fb3b60d8190ca1d0daeb227a812c7b17cb7f87ab3ffcafd102c8046893b3`. No new build, dependency change, real-model inference, source/Git/remote write, or access to 6767/6768 or existing devices.

Measured persistence, not fixture-only values:

- Four actual SQLite stages: after-stream, steady, after-reload, offline-steady.
- Assistant: **50,014 UTF8 bytes**, SHA256 `42f194a3fd10cb26886dd17d5847b1344e715a93fe9c96f6d17ff4470d838a9c`.
- Timeline JSON: **50,869 bytes**, SHA256 `a394dbf0e6cfcc2df4f12b08f3aebe32e4afbea5be579316bd0175d70d9da7bc`.
- All four assistant hashes and all four timeline hashes are identical; SQLite BLOB length/hex equal actual UTF8 bytes. Actual native-delivered assistant chunks join to the same text.
- `runtime/offline-proof.json` is from an independent process at 06:46:39.294Z: ports54883/60992, IPv4/IPv6, all ECONNREFUSED. App termination followed at06:46:39.836Z. Final cleanup rechecked closure.

Evidence allowlist:

- `runtime/`: 16 actual screenshots, one continuous unedited h264 recording (133.835s, 1206×2622), strict-field WS ledger, UI markers, synthetic IDs/results, four actual SQLite-derived timeline/text files and byte/hash summaries, normal-flow logs and the independent offline proof.
- `native-observer-events.json`, `ui-command-events.json`: source-observation events and normal UI actions/timestamps; no state injection.
- `offline-persistence-comparison.json`, `utf8-readback-audit.json`: exact actual-content comparison and explicitly scoped source-equivalent boundary audit, not native counter timing.
- Four `*.diff` files: only temporary harness changes. Normal shutdown preserves the fixture instead of calling removeProject while app clients remain connected. Protocol forwarding is unchanged.
- `cleanup.json`, `previous-public-integrity.json`: only owned IDs/ports/PID and aggregate preservation; previous round1/2 and causal public files remain byte-identical.
- `performance-pair-plan.md`: concrete future same-tree bytecount-only A/B plan. **Not executed.**
- `manifest.json`: recursive file byte lengths and SHA256. Complete Chinese report: `../../report.md`.

Media wall-clock alignment uses UTC ledger/console/Maestro events, not video duration or frame-rate inference. Online and offline stable END screenshots were visually reviewed. All state is synthetic on a fresh owned simulator. No SQLite database, home, app binary, complete OS/app/Xcode logs, user conversations, credentials, or existing-device inventory is included. Parent reviews/publishes; nothing was uploaded.
