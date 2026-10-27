# PR #6736 initial image QA — NOT PASSED

Historical source head `ea84f0179dae93829a4c8607a6fd73e5621e3b41`. This page records the first image-QA round only; the source-owner restore follow-up is still pending.

Two independent gaps remain: the original client ID/PNG was not restored after daemon restart/history refresh (439-byte PNG/user ID changed to 382-byte provider WebP/native ID), and the selected OMP route had `compat.stripImageInput=true`, so no image reached the model. No additional inference ran. The model response does not count as visual-semantic validation.

WebP 200x200, reload, cache, and lightbox checks passed. The earlier 128 ms expectation timeout was a diagnostic expectation issue, not evidence of a UI stall. The source owner is fixing original-image persistence; this historical receipt is not a restore pass.

The selected files match the parent-reviewed allowlist SHA-256 and byte counts. The allowlist contains 42 included files out of 45; the scan withheld any file matching environment-value patterns. Included text, JSON, scripts, and logs retain source bytes with `.txt` suffixes. No private directories, raw JSONL conversations, auth/config, or network captures are included.

## Allowlisted files

- [commands.txt](./commands.txt.txt)
- [artifact-provenance.json](./artifact-provenance.json.txt)
- [fixture-provenance.json](./fixture-provenance.json.txt)
- [public-fixture.png](./public-fixture.png)
- [native-normalized-image.webp](./native-normalized-image.webp)
- [native-user-message-fixture.json](./native-user-message-fixture.json.txt)
- [public-restoration-fixture-mapping.json](./public-restoration-fixture-mapping.json.txt)
- [selected-route-public-receipt.json](./selected-route-public-receipt.json.txt)
- [visual-semantics-not-passed.json](./visual-semantics-not-passed.json.txt)
- [browser-diagnostic-correction.json](./browser-diagnostic-correction.json.txt)
- [public-transformations.json](./public-transformations.json.txt)
- [attempt-1-runtime-result.json](./attempt-1-runtime-result.json.txt)
- [attempt-1-runtime-safe.log](./attempt-1-runtime-safe.log.txt)
- [runtime-result.json](./runtime-result.json.txt)
- [runtime-safe.log](./runtime-safe.log.txt)
- [provider-finish.json](./provider-finish.json.txt)
- [live-events.json](./live-events.json.txt)
- [after-prompt-sender.json](./after-prompt-sender.json.txt)
- [after-prompt-receiver.json](./after-prompt-receiver.json.txt)
- [continuation-result.json](./continuation-result.json.txt)
- [continuation-safe.log](./continuation-safe.log.txt)
- [existing-session-restore-sender.json](./existing-session-restore-sender.json.txt)
- [existing-session-restore-receiver.json](./existing-session-restore-receiver.json.txt)
- [provider-refresh-sender.json](./provider-refresh-sender.json.txt)
- [provider-refresh-receiver.json](./provider-refresh-receiver.json.txt)
- [clients-reload-sender.json](./clients-reload-sender.json.txt)
- [clients-reload-receiver.json](./clients-reload-receiver.json.txt)
- [daemon-disk-restart-sender.json](./daemon-disk-restart-sender.json.txt)
- [daemon-disk-restart-receiver.json](./daemon-disk-restart-receiver.json.txt)
- [native-history-normalized.json](./native-history-normalized.json.txt)
- [browser-diagnostic-result.json](./browser-diagnostic-result.json.txt)
- [browser-diagnostic-safe.log](./browser-diagnostic-safe.log.txt)
- [restored-browser-diagnostic.json](./restored-browser-diagnostic.json.txt)
- [restored-browser-reload-diagnostic.json](./restored-browser-reload-diagnostic.json.txt)
- [browser-live.png](./browser-live.png)
- [browser-live-lightbox.png](./browser-live-lightbox.png)
- [restored-browser-diagnostic.png](./restored-browser-diagnostic.png)
- [restored-browser-diagnostic-lightbox.png](./restored-browser-diagnostic-lightbox.png)
- [restored-browser-reload-diagnostic.png](./restored-browser-reload-diagnostic.png)
- [cleanup-receipt.json](./cleanup-receipt.json.txt)
- [exact-head-check-suites.json](./exact-head-check-suites.json.txt)
- [exact-head-actions-runs.json](./exact-head-actions-runs.json.txt)

See [allowlist receipt](./allowlist-receipt.json).
