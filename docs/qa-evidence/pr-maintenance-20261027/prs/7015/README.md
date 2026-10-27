# PR #7015

**Integrated native Grok/Cursor question dispatch and structured answer handling.**

- Source head: `aff3245c65ccf769ceae8cd1937d9c57ffd055e3`
- Source tree: `ca2722701f4fce10b1b7bb07d7663e7be5556e16`
- Frozen baseline: `9e4aab16cc74f945f9bb676fcab3d8a9a8b686ca`
- Current PR: OPEN, Ready for review, base `main`, merge state `BLOCKED`.
- Targeted result: 152 targeted tests are reported by the source owner.
- Remaining scope: Real Grok downstream label conflation remains unresolved; captured Cursor sessions did not emit the native question. #3490 owns the shared answer-contract decision.
- Evidence was collected by the source owner; tests were not rerun for publication.

## Exact-head CI snapshot

- CheckSuite `CS_kwDOQBkEf88AAAAZhzqeOw`: `action_required`; run [40453712383](https://github.com/getpaseo/paseo/actions/runs/40453712383); run head matches: yes; jobs 0; check-runs 0.

## Included raw outputs

- [commands.txt.txt](./raw/validation/commands.txt.txt)
- [build-server.log.txt](./raw/validation/build-server.log.txt)
- [server-acp.log.txt](./raw/validation/server-acp.log.txt)
- [typecheck.log.txt](./raw/validation/typecheck.log.txt)
- [lint.log.txt](./raw/validation/lint.log.txt)
- [format.log.txt](./raw/validation/format.log.txt)
- [whitespace.log.txt](./raw/validation/whitespace.log.txt)
- [commit.log.txt](./raw/validation/commit.log.txt)
- [push.log.txt](./raw/validation/push.log.txt)
- [merge.log.txt](./raw/validation/merge.log.txt)
- [integration-audit.txt.txt](./raw/validation/integration-audit.txt.txt)
- [feature.diff.txt](./raw/diffs/feature.diff.txt)
- [upstream-overlap.diff.txt](./raw/diffs/upstream-overlap.diff.txt)
- [unstaged-final.diff.txt](./raw/diffs/unstaged-final.diff.txt)

Raw output bytes are unchanged; the manifest records SHA-256. A missing artifact is not interpreted as a pass.
Maintainer contract options remain undecided; see [#7015 native Grok/Cursor answer-format options](../../DECISIONS.md).
