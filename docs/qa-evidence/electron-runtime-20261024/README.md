# Packaged macOS Electron runtime evidence — 2026-10-24

Executed by Codex (`gpt-6.1-sol`, high). These are local macOS arm64 package checks, not a notarized release or iOS/Android/Windows/Linux acceptance.

| PR    | Product source SHA                         | Result                                                                                              |
| ----- | ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| #7318 | `03b7b80b00b7ad4990232e7d992c77cbf6274701` | Ten file-pane business cases passed in the real packaged app.                                       |
| #6732 | `b74cb0a5b34bdee5331fe01a8f264a26375d6301` | Catalog/hash/storage/footer execution cases passed. Provider timeline restoration remains unproven. |
| #7462 | `346acf34cf544ff207c4ebb1fa069de7cd3c2394` | Seven fork business cases passed.                                                                   |
| #6677 | `a166fa771671b78f8af3ee39b406d2980e6bf383` | Real Codex conversation rewind and concrete file-adapter cases passed; both remains unverified.     |

Both packages were built from separate clean worktrees with fresh Metro exports and isolated temporary caches. `package-receipt.json` records source SHA, executable/asar hashes, byte equality of compiled main/preload and exported JS against the package, and successful `codesign --verify --deep --strict`.

The successful packages use the existing Developer ID Application identity through electron-builder. They preserve the repository's hardened runtime, entitlements and Chromium sandbox. No `--no-sandbox`, disabled library validation, fake packaged flag or thin renderer was used. Notarization is disabled for local QA. Each app used new user data, a new daemon home and random ports. The real renderer started its desktop-managed daemon; the bundled CLI queried it. The production bridge reported sandbox enabled with reason `Chromium default`.

The UI preference in the final run is English. These two packages retain the default Chromium language resources. The subsequent fork/rewind QA configuration is separate.

## #7318

The installed trusted directory plugin uses the repository's direct provider example, a user-message transformer and real file-opening buttons. There is no host transport or file-pane mock.

Passed at the source SHA above:

1. Relative `src/target.txt`, selecting lines 4–6; the real source editor reports `Ln 6, Col 14`.
2. Absolute path to the same file, line 8.
3. The BRAVO agent opens BRAVO content at line 10 in BRAVO's workspace, rather than ALPHA's content.
4. A directory target opens the Files explorer with its children.
5. An empty path leaves the card usable.
6. An escaping path displays `Access outside of workspace is not allowed`.
7. Invalid line numbers normalize to a fresh file's initial cursor.
8. Opening from the source pane leaves a new split pane's launcher unchanged.
9. A 390×844 Electron viewport opens the file at line 10.
10. A missing file displays an error.

The API has no column target. Cursor column readback above is an observation of range selection, not a new column capability. Synthetic provider-subagent panes, iOS, Android, Windows and Linux are not verified by this run.

At the same source SHA, root typecheck/lint passed, SDK boundary tests passed 58/58, and the focused timeline-view file passed 5/5. No product source was changed.

## #6732

The same real plugin loader installs a client bundle with timeline and sidebar-footer contributions. The footer is an independent execution marker for the catalog bundle.

| Scenario                                                         | Bundle hash                                                        | Bundle bytes in the fixture entry |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------: |
| Cold install                                                     | `44eadf8a186d1c626636da5d2582647778d68752d28d2b2d1dd53211d677cb26` |                              2966 |
| Warm reload                                                      | same V1 hash                                                       |                           omitted |
| Explicit plugin reload after V2 source update                    | `5e462099ecfb11921536c56975913cc12a7d0a399bf8457cecd43d465d696cf5` |                              2966 |
| Reload after update                                              | same V2 hash                                                       |                           omitted |
| Same-length corruption of the real IndexedDB record, then reload | same V2 hash                                                       |                              2966 |
| Stop and restart only this isolated daemon                       | same V2 hash                                                       |                           omitted |

The wire capture correlates the renderer's actual catalog requests/responses. The real daemon PID changed from 21685 to 25479. The V2 footer rendered after reconnect. The source fixture and its source hashes are retained; the V1 source file is explicitly labeled as reconstructed by reversing the controller's single marker replacement in the captured V2 file. Both actual compiled bundle hashes are in the wire capture.

The timeline card rendered before the daemon restart and across renderer reloads. **Timeline restoration across the daemon restart is not passed:** the direct provider example's replay emits only `Restored from persistence`, so the original user-message card is absent. The first attempt's screenshot and failed timeline-marker assertion are retained. The independent footer probe does not establish restoration of timeline contributions or every plugin surface. The reconnect screenshot still shows the provider replay and an `Updating messages` state; no catch-up completion or performance claim is made.

Root typecheck/lint passed. The initial three-file focused command failed at the first dynamic-import case under the default 5-second timeout, after three passing cases. The log records 5.47 seconds of import time and 8.88 seconds of transformation. One isolated diagnostic with a 20-second budget completed all six storage cases in 2.37 seconds; it did not reach that budget. The remaining two files passed 46/46 at their default budget. The initial failure is retained, its cause is not conclusively established, and no timeout or test-source change was committed. Relay throughput, native hashing and iOS/Android acceptance remain open.

## Retained attempts and reproducibility

`accepted-scope/` contains the final raw results, actual wire summaries, screenshots, rendered text and app output. `first-business-attempt/` retains incorrect-oracle/fixture assumptions and their failures. The original file-pane oracle expected escaping paths to be ignored; it was corrected to require the daemon's visible denial. The original catalog reconnect oracle incorrectly depended on the direct example's replay preserving user rows.

`ad-hoc-environment-failure/` retains the earlier real launch failures. Ad-hoc signatures passed strict signature verification, but dyld rejected framework mapping because hardened runtime requires compatible Team IDs. No renderer or business case ran in those attempts. The standard Developer ID route resolved that environment blocker.

`commands/` contains the executed scripts and command outputs. Private daemon homes, local credentials and browser user data are excluded. Logs are redacted if a credential-shaped value is found; `manifest.json` records original/published hashes and whether redaction changed a copied file. Original private evidence remains in the named worktrees.

Executable source snapshots use a `.txt` suffix so repository formatting and linting do not rewrite the captured fixture/controller code. Remove that suffix when reproducing a run.

## #7462 — final source `346acf34cf544ff207c4ebb1fa069de7cd3c2394`

The isolated package uses a temporary QA configuration extending the product's normal electron-builder file, with `electronLanguages: ["en-US"]` and the normal Developer ID identity. All renderer/main/preload/daemon code, entitlements, hardened runtime and Chromium sandbox remain present. `7462/commands/qa-builder.json` and `package-receipt.json` record the exact configuration, source/config/package hashes and successful strict signature verification. This run covers English locale only.

The trusted production directory plugin uses the actual direct-provider example, emitting cumulative assistant text in a live turn; the maintained timeline transformer renders the real host `ForkMenu`. No dev-only provider or packaged-flag bypass is used.

Seven business cases passed:

1. No fork trigger during the streaming plugin reply.
2. Exactly one trigger after the reply completes.
3. A wide-layout fork into a new tab carries the full original reply in a Chat history attachment.
4. Returning to the source and reloading preserves the reply and one trigger.
5. A 390px fork into a new workspace reaches the real `/new?...draftId=...` flow with the full attachment.
6. Dropping exactly one real fork request produces the 15-second timeout toast and unlocks the trigger.
7. Retrying succeeds and the original source reply remains intact.

The timeout harness drops a request using the repository's existing WebSocket routing pattern; all other traffic reaches the real daemon. `fork-wire.json` records actual context responses and their complete attachment text. The first attempt's stale file-test selector is retained with its failure; only the external controller selector was corrected, and the same signed package was reused. No product source changed.

The source owner's 143 focused tests and build/static/hook evidence were not rerun. This package build independently rebuilt its required production stack. Cold application relaunch, daemon-restart restoration and non-macOS/native platforms remain outside this run.

## #6677 — final source `a166fa771671b78f8af3ee39b406d2980e6bf383`

Production app version: `0.13.0`. The English-only temporary builder configuration, full production source/package/config hashes, Developer ID signature verification and normal sandbox readback are under `6677/commands/` and `6677/accepted-scope/`. The app, preload, real renderer and renderer-managed isolated daemon all ran from this package.

The client fixture imports the actual host `RewindMenu` and replaces user-message rows while retaining their canonical message IDs and text. The menu's available modes come from the real selected provider. The product source was unchanged.

### Codex conversation rewind

This case used the existing configured default `gpt-6.1-sol`, medium reasoning, with the installed Codex CLI `0.164.0`. A new private Codex home contained a minimal profile and a copy of existing local authentication; it contained no existing user sessions, plugins or global configuration. Private directories were mode 0700 and the authentication file mode 0600. Authentication contents are excluded from all published artifacts. The private authentication copy was removed after the run.

Passed:

- A first sentinel prompt produced `QA_CODEX_FIRST_REPLY`.
- A second sentinel prompt produced `QA_CODEX_SECOND_REPLY`.
- An independent native app-server `thread/read` with `includeTurns: true` returned two completed turns before rewind.
- The real Codex-backed plugin menu offered conversation rewind and exposed neither files nor both.
- Selecting conversation rewind preserved the first reply, removed the second reply from the UI, and restored the full second prompt into the previously empty composer.
- The native adapter moved the Paseo session from `01a16dc0-2906-7443-a235-72accfcda0d3` to `01a16dc0-5143-72b1-a916-e7bafea1c270`. A fresh independent native app-server read returned exactly one retained turn. This is a new retained-prefix thread, not an assertion that the original thread was modified in place.
- The daemon's canonical timeline readback contained exactly one user row with the first prompt.

The native before/after responses and canonical readback are retained as `codex-native-before.json`, `codex-native-after.json` and `codex-canonical-after.json`; screenshots show the real composer and retained reply. Only this newly created QA session was read. No other user threads or project files were used.

### File rewind and failure recovery

The trusted directory QA provider declares only the file rewind scope it implements. It records a real filesystem checkpoint before a prompt, writes a new value, and restores that checkpoint before reporting completion. It does not declare conversation or both capabilities.

Passed:

- The menu offers files only.
- Rewinding the second prompt changes the actual temporary file from `TURN_2` to `TURN_1`; the transcript remains at two prompts and the composer remains empty.
- A deliberate real provider failure produces the visible `QA deliberate file restore failure` toast, leaves the actual file at `TURN_2`, and unlocks the menu.
- Retrying restores `TURN_1`. File contents and the provider's restoration audit are retained under `file-readback/`.

This verifies the host integration with that concrete file adapter. Claude/OpenCode vendor file restoration and the `both` mode remain unverified. No provider capability was fabricated to expose an unimplemented operation.

### Remaining scope

The production plugin-provider history stream currently has no replacement/reset event, so an append-only direct-provider example cannot prove conversation truncation by returning request completion. The real built-in Codex route above was used for conversation acceptance. That SDK limitation comes from the frozen main baseline; this report does not classify it as a new #6677 regression.

The controller snapshot includes additional absolute-deadline credential cleanup hardening applied after the successful business actions; that timeout path was not exercised. The installed fixture source and actual business workflow are retained separately. The source owner's 135 focused tests and static/hook results were trusted and were not rerun. Other providers, the `both` operation, non-English locale, native mobile and other desktop platforms remain unverified.
