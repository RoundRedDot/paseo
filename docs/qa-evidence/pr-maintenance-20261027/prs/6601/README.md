# PR #6601

**Validated Babel worker-lowering integration and plugin build responsiveness against the frozen baseline.**

- Source head: `6514ab5ff2ebe9f73981086c980bd53a1eefc09b`
- Source tree: `922fdfc8af1c1b69908a7a903cda58157b858199`
- Frozen baseline: `9e4aab16cc74f945f9bb676fcab3d8a9a8b686ca`
- Current PR: OPEN, Ready for review, base `main`, merge state `BLOCKED`.
- Targeted result: 89 targeted tests are reported by the source owner.
- Remaining scope: Hermes VM comparison unavailable; full Hermes execution is not claimed.
- Evidence was collected by the source owner; tests were not rerun for publication.

## Exact-head CI snapshot

- CheckSuite `CS_kwDOQBkEf88AAAAZh3IIWw`: `action_required`; run [40455099360](https://github.com/getpaseo/paseo/actions/runs/40455099360); run head matches: yes; jobs 0; check-runs 0.

## Included raw outputs

- [build-server.log.txt](./raw/validation/build-server.log.txt)
- [build-audio.log.txt](./raw/validation/build-audio.log.txt)
- [commands.log.txt](./raw/validation/commands.log.txt)
- [red-class-lowering.log.txt](./raw/validation/red-class-lowering.log.txt)
- [red-lowering.log.txt](./raw/validation/red-lowering.log.txt)
- [server**plugins**compiler.log.txt](./raw/validation/server__plugins__compiler.log.txt)
- [server**plugins**preparation.log.txt](./raw/validation/server__plugins__preparation.log.txt)
- [server**plugins**responsiveness.log.txt](./raw/validation/server__plugins__responsiveness.log.txt)
- [server**plugins**runtime_posix.log.txt](./raw/validation/server__plugins__runtime_posix.log.txt)
- [plugin\_\_boundaries.log.txt](./raw/validation/plugin__boundaries.log.txt)
- [typecheck.log.txt](./raw/validation/typecheck.log.txt)
- [lint.log.txt](./raw/validation/lint.log.txt)
- [format.log.txt](./raw/validation/format.log.txt)
- [commit.log.txt](./raw/validation/commit.log.txt)
- [commit-receipt.log.txt](./raw/validation/commit-receipt.log.txt)
- [push.log.txt](./raw/validation/push.log.txt)
- [merge.log.txt](./raw/validation/merge.log.txt)
- [vm-execute.log.txt](./raw/failures/vm-execute.log.txt)
- [vm-generate.log.txt](./raw/failures/vm-generate.log.txt)
- [vm-large-lowered.stderr.log.txt](./raw/failures/vm-large-lowered.stderr.log.txt)
- [vm-large-lowered.stdout.log.txt](./raw/failures/vm-large-lowered.stdout.log.txt)
- [vm-large-unlowered.stderr.log.txt](./raw/failures/vm-large-unlowered.stderr.log.txt)
- [vm-large-unlowered.stdout.log.txt](./raw/failures/vm-large-unlowered.stdout.log.txt)
- [vm-small-lowered.stderr.log.txt](./raw/failures/vm-small-lowered.stderr.log.txt)
- [vm-small-lowered.stdout.log.txt](./raw/failures/vm-small-lowered.stdout.log.txt)
- [vm-small-unlowered.stderr.log.txt](./raw/failures/vm-small-unlowered.stderr.log.txt)
- [vm-small-unlowered.stdout.log.txt](./raw/failures/vm-small-unlowered.stdout.log.txt)
- [conflict.diff.txt](./raw/diffs/conflict.diff.txt)
- [feature.diff.txt](./raw/diffs/feature.diff.txt)
- [final-feature.diff.txt](./raw/diffs/final-feature.diff.txt)

Raw output bytes are unchanged; the manifest records SHA-256. A missing artifact is not interpreted as a pass.
