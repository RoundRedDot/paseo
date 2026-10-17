# PR #6736 real Pi/Gemini pre-repair acceptance: FAIL

Source `6513124ca16cf18db0df5eba3fda80c9fe2b37f0`. Installed Pi1.3.0, configured provider/model google-cloud/gemini-3.8-flash via the existing local extension. Actual native assistant events confirm this configured model identity; the upstream proxy route was not independently audited. Exactly2 real image prompts, automatic retries disabled. Requested thinking off is clamped to low by the provider.

Both real images are identified correctly (red square / green triangle). Independent clients preserve live canonical bytes and identity; actual Chromium previews/lightbox decode128×128. Ordinary reload initially shows cached images, still with Updating messages; that first frame is not accepted authoritative-history recovery.

Explicit provider refresh drops the image-only row and removes image bytes from the text+image row, replacing its canonical identity with native Pi ID. Reload and subsequent daemon restart retain this failure. Native Pi JSONL still contains exact input images.17 checks PASS /4 FAIL are QA assertions, not source unit tests. Full history/persistence acceptance FAIL. Disk restart follows refresh, so it cannot independently distinguish both operations' causality. Pi mapper is unchanged from pinned main; no baseline runtime comparison.

The user subsequently authorized a Pi history repair, tracked separately. These immutable artifacts preserve the pre-repair failure. No private home/config/auth/session files are published. OMP mapping and native iOS/Android/Electron remain unverified; Pi cannot stand in for OMP.
