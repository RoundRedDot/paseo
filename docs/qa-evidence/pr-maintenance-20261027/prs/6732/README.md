# PR #6732

**388 focused tests passed and 173 were skipped across server/client/plugin suites; the browser retry passed after the initial missing-browser prerequisite. Retained both plugin catalog instance identity and cached bundle hash across #7938 integration.**

- Source head: `1c4c09712f2ec8699c2e13f083eaa15a8af39e9f`
- Source tree: `003a7d298776ac7731842eb257efef0ce8d3f3d2`
- Frozen baseline: `9e4aab16cc74f945f9bb676fcab3d8a9a8b686ca`
- Current PR: OPEN, Ready for review, base `main`, merge state `BLOCKED`.
- Targeted result: 388 targeted tests are reported by the source owner.
- Remaining scope: No new native/plugin-surface, timeline restore, device, packaged UI, or production relay performance acceptance.
- Browser prerequisite: The first Chromium invocation executed 0 tests because the matching headless shell was missing. After installing the provider-matched Playwright 1.58.2 browser into the owned cache, the same focused browser file passed 1 test. This is a prerequisite recovery, not a source change or a broad browser claim.
- Evidence was collected by the source owner; tests were not rerun for publication.

## Exact-head CI snapshot

- CheckSuite `CS_kwDOQBkEf88AAAAZiAVA-g`: `action_required`; run [40458744593](https://github.com/getpaseo/paseo/actions/runs/40458744593); run head matches: yes; jobs 0; check-runs 0.

## Included raw outputs

- [commands.log.txt](./raw/validation/commands.log.txt)
- [build-server.log.txt](./raw/validation/build-server.log.txt)
- [protocol\_\_messages_plugins.log.txt](./raw/validation/protocol__messages_plugins.log.txt)
- [client\_\_daemon_client.log.txt](./raw/validation/client__daemon_client.log.txt)
- [server\_\_session_catalog.log.txt](./raw/validation/server__session_catalog.log.txt)
- [server**plugins**builtin.log.txt](./raw/validation/server__plugins__builtin.log.txt)
- [server**plugins**runtime_posix.log.txt](./raw/validation/server__plugins__runtime_posix.log.txt)
- [server**plugins**agent_tools.log.txt](./raw/validation/server__plugins__agent_tools.log.txt)
- [plugin\_\_boundaries.log.txt](./raw/validation/plugin__boundaries.log.txt)
- [app\_\_client_bundle_store.log.txt](./raw/validation/app__client_bundle_store.log.txt)
- [app\_\_catalog_refresh.log.txt](./raw/validation/app__catalog_refresh.log.txt)
- [app\_\_viewed_timeline_sync.log.txt](./raw/validation/app__viewed_timeline_sync.log.txt)
- [app\_\_client_bundle_storage_browser_final.log.txt](./raw/validation/app__client_bundle_storage_browser_final.log.txt)
- [browser-install.log.txt](./raw/validation/browser-install.log.txt)
- [typecheck.log.txt](./raw/validation/typecheck.log.txt)
- [lint.log.txt](./raw/validation/lint.log.txt)
- [format.log.txt](./raw/validation/format.log.txt)
- [commit.log.txt](./raw/validation/commit.log.txt)
- [push.log.txt](./raw/validation/push.log.txt)
- [merge.log.txt](./raw/validation/merge.log.txt)
- [red-catalog-hash.log.txt](./raw/failures/red-catalog-hash.log.txt)
- [app\_\_client_bundle_storage_browser.log.txt](./raw/failures/app__client_bundle_storage_browser.log.txt)
- [conflict.diff.txt](./raw/diffs/conflict.diff.txt)
- [merged-feature.diff.txt](./raw/diffs/merged-feature.diff.txt)
- [final-feature.diff.txt](./raw/diffs/final-feature.diff.txt)

Raw output bytes are unchanged; the manifest records SHA-256. A missing artifact is not interpreted as a pass.
