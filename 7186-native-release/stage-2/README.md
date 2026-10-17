# PR #7186 — isolated iOS Simulator Release evidence

Candidate: `85f7d56ea79f8b7c22538a2b763875f4ce2d74ad`.

**Partial.** An unsigned arm64 iOS Simulator Release app was built and launched on a newly created iPhone 16 Pro / iOS 18.6 simulator. The app reached first-launch UI. Opening the synthetic workspace then hit `Couldn't find a navigation object` in `HostWorkspaceRouteContent → useNavigation`.

The mock stream was **not triggered**. The configured fixture's 50,014-byte expected response is not a native cache measurement. Native streaming, SQLite content/read-back, offline reload, and performance remain unverified. No paired baseline, physical device claim, frame-rate attribution, or cache regression attribution is made.

The temporary archive snapshot uses symlinked checkout-local dependencies. Its generated JS contains two NavigationContext definitions; that is a diagnostic observation, not a proven cause. Two permitted build corrections fixed canonical `/tmp` entry resolution and copied missing already-built workspace outputs. No product source instrumentation or production source edits were made. See `metro-snapshot.diff`, `source-info.json`, build scripts and `navigation-diagnostic.json`.

`release-startup-and-error.mp4` is an export of the second runtime attempt's continuous native simulator recording (ffprobe container duration: 65.646667 s). It includes system prompt handling and the observed error. `workspace-error.png` is Maestro's actual failed assertion capture. `first-launch.png` precedes handling the prompts. These are synthetic data only.

`result.json` records the evidence boundary; `cleanup.json` proves both worker-created simulator IDs and processes are gone. `manifest.json` gives artifact hashes. Private raw build/runtime logs are retained separately for parent review. This subset excludes session homes, databases, binaries and credentials. Nothing has been uploaded by this worker.

Read-only follow-up: `import-chain.json` maps app route 6193 → native 6194 → core 6196 → hook 6254/context 6249; ExpoRoot 1163 and NavigationContainer 1167 → native 806 → core 808 → hook 867/context 862. Both contexts match the same ESM source SHA1 and physical inode. The saved TreeFS contains separate lexical alias identities. Export conditions select `default` lib/module for both import and require. This excludes a CJS/ESM entry split; a complete Expo CLI resolver trace was not captured, so the exact historical alias-selection layer remains unproven. No third build/runtime was started.
