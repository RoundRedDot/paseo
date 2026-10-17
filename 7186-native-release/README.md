# PR #7186 — isolated iOS Simulator Release evidence

Candidate: `85f7d56ea79f8b7c22538a2b763875f4ce2d74ad`. **Partial.** No baseline/performance claim.

`result.json` is the latest result. `stage-2/` preserves the prior build/runtime failure and read-only diagnosis. `stage-3/` contains the subsequently authorized narrow temporary QA normalization and its real build/runtime artifacts.

The candidate arm64 iOS Simulator Release/Hermes build succeeded. The temporary resolver calls the original resolver once, then canonicalizes sourceFile paths only inside @react-navigation/native/core. It changes no package versions, export conditions, app source or routes. There were 121 logged resolutions; all source bytes matched. NavigationContext converged from IDs862/6249 to ID862. All three context module bodies are identical (939 bytes; SHA256 dbdc6470498a4bb2155c63c3fb15df2cf16eccd081ec4f1d65bb3e7a8a43e51c).

The new native runtime passed first launch and system prompt handling. The navigation-context error disappeared, but the synthetic workspace stayed at Loading workspace until Maestro's 30-second composer deadline. The mock stream was not triggered. Native SQLite read-back and offline reload were not reached. The fixture's expected 50,014 bytes are not a cache measurement. The actual deeplink matches the product route helper exactly. No ungrounded harness retry or route change followed.

`stage-3/release-loading-timeout.mp4` is a continuous native simulator capture export (65.223911 s). `workspace-loading-timeout.png` is the actual failed assertion screenshot. The host label shown is the synthetic daemon's nonsecret local machine hostname; no user projects or sessions were opened. Three worker-created simulators and all own runtime processes were removed; existing simulator states are unchanged.

`manifest.json` recursively lists artifact hashes and the credential-pattern scan. No credentials, session homes, databases, app binaries or full build environment logs are included. Nothing was uploaded by this worker.
