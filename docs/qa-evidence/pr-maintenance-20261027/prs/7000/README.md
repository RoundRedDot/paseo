# PR #7000

**Delivered persisted turn timing for completed sessions; 297 targeted tests passed across timing, history, protocol and timeline coverage.**

- Source head: `9b74ce6f283719006986ed435b3f7c0c3c43cae9`
- Source tree: `b13f52b05ce20d950d8e90d032e661a7b7c2f3fe`
- Frozen baseline: `9e4aab16cc74f945f9bb676fcab3d8a9a8b686ca`
- Current PR: OPEN, Ready for review, base `main`, merge state `BLOCKED`.
- Targeted result: 297 targeted tests are reported by the source owner.
- Remaining scope: Real Claude timing and native-device display were not exercised. Missing pre-upgrade timing is not backfilled.
- Evidence was collected by the source owner; tests were not rerun for publication.

## Exact-head CI snapshot

- CheckSuite `CS_kwDOQBkEf88AAAAZiA9UoQ`: `action_required`; run [40458984891](https://github.com/getpaseo/paseo/actions/runs/40458984891); run head matches: yes; jobs 0; check-runs 0.

## Included raw outputs

- [build-server.log.txt](./raw/validation/build-server.log.txt)
- [packages**protocol**src\_\_messages.wire-compat.test.log.txt](./raw/validation/packages__protocol__src__messages.wire-compat.test.log.txt)
- [packages**server**src**server**agent\_\_agent-manager.test.log.txt](./raw/validation/packages__server__src__server__agent__agent-manager.test.log.txt)
- [packages**server**src**server**agent\_\_agent-storage.test.log.txt](./raw/validation/packages__server__src__server__agent__agent-storage.test.log.txt)
- [packages**server**src**server**agent**providers**claude\_\_agent.history-load.test.log.txt](./raw/validation/packages__server__src__server__agent__providers__claude__agent.history-load.test.log.txt)
- [packages**server**src**server**agent**providers**claude\_\_agent.history.test.log.txt](./raw/validation/packages__server__src__server__agent__providers__claude__agent.history.test.log.txt)
- [packages**server**src**server**daemon-e2e\_\_timeline-window.e2e.test.log.txt](./raw/validation/packages__server__src__server__daemon-e2e__timeline-window.e2e.test.log.txt)
- [typecheck.log.txt](./raw/validation/typecheck.log.txt)
- [lint.log.txt](./raw/validation/lint.log.txt)
- [format.log.txt](./raw/validation/format.log.txt)
- [commit.log.txt](./raw/validation/commit.log.txt)
- [push.log.txt](./raw/validation/push.log.txt)
- [merge.log.txt](./raw/validation/merge.log.txt)
- [feature.diff.txt](./raw/diffs/feature.diff.txt)
- [semantic-overlaps.diff.txt](./raw/diffs/semantic-overlaps.diff.txt)

Raw output bytes are unchanged; the manifest records SHA-256. A missing artifact is not interpreted as a pass.
