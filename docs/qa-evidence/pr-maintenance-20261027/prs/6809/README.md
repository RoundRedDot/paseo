# PR #6809

**Retained background-subagent history and sidechain behavior across asynchronous replay.**

- Source head: `2a8af80c3569bf464b4f5e16afca356317246870`
- Source tree: `5d16bf5791ebb2cb72e71ab3fd8b81cf3adba4cf`
- Frozen baseline: `9e4aab16cc74f945f9bb676fcab3d8a9a8b686ca`
- Current PR: OPEN, Ready for review, base `main`, merge state `BLOCKED`.
- Targeted result: 108 targeted tests are reported by the source owner.
- Remaining scope: Real Claude expanded-card/native UI and prompt selection were not rerun.
- Evidence was collected by the source owner; tests were not rerun for publication.

## Exact-head CI snapshot

- CheckSuite `CS_kwDOQBkEf88AAAAZh2c2vw`: `action_required`; run [40454826879](https://github.com/getpaseo/paseo/actions/runs/40454826879); run head matches: yes; jobs 0; check-runs 0.

## Included raw outputs

- [build-server.command.txt](./raw/validation/build-server.command.txt)
- [build-server.log.txt](./raw/validation/build-server.log.txt)
- [packages**plugin**src**server**provider.test.command.txt](./raw/validation/packages__plugin__src__server__provider.test.command.txt)
- [packages**plugin**src**server**provider.test.log.txt](./raw/validation/packages__plugin__src__server__provider.test.log.txt)
- [packages**protocol**src\_\_messages.tool-call-schema.test.command.txt](./raw/validation/packages__protocol__src__messages.tool-call-schema.test.command.txt)
- [packages**protocol**src\_\_messages.tool-call-schema.test.log.txt](./raw/validation/packages__protocol__src__messages.tool-call-schema.test.log.txt)
- [packages**server**src**server**agent**providers**claude\_\_agent.background-subagent.test.command.txt](./raw/validation/packages__server__src__server__agent__providers__claude__agent.background-subagent.test.command.txt)
- [packages**server**src**server**agent**providers**claude\_\_agent.background-subagent.test.log.txt](./raw/validation/packages__server__src__server__agent__providers__claude__agent.background-subagent.test.log.txt)
- [packages**server**src**server**agent**providers**claude\_\_agent.history-load.test.command.txt](./raw/validation/packages__server__src__server__agent__providers__claude__agent.history-load.test.command.txt)
- [packages**server**src**server**agent**providers**claude\_\_agent.history-load.test.log.txt](./raw/validation/packages__server__src__server__agent__providers__claude__agent.history-load.test.log.txt)
- [packages**server**src**server**agent**providers**claude\_\_agent.sub-agent-replay.test.command.txt](./raw/validation/packages__server__src__server__agent__providers__claude__agent.sub-agent-replay.test.command.txt)
- [packages**server**src**server**agent**providers**claude\_\_agent.sub-agent-replay.test.log.txt](./raw/validation/packages__server__src__server__agent__providers__claude__agent.sub-agent-replay.test.log.txt)
- [packages**server**src**server**agent**providers**claude\_\_agent.sub-agent-sidechain.test.command.txt](./raw/validation/packages__server__src__server__agent__providers__claude__agent.sub-agent-sidechain.test.command.txt)
- [packages**server**src**server**agent**providers**claude\_\_agent.sub-agent-sidechain.test.log.txt](./raw/validation/packages__server__src__server__agent__providers__claude__agent.sub-agent-sidechain.test.log.txt)
- [packages**server**src**server**agent**providers**claude**subagents**replay-source.test.command.txt](./raw/validation/packages__server__src__server__agent__providers__claude__subagents__replay-source.test.command.txt)
- [packages**server**src**server**agent**providers**claude**subagents**replay-source.test.log.txt](./raw/validation/packages__server__src__server__agent__providers__claude__subagents__replay-source.test.log.txt)
- [typecheck.command.txt](./raw/validation/typecheck.command.txt)
- [typecheck.log.txt](./raw/validation/typecheck.log.txt)
- [lint.command.txt](./raw/validation/lint.command.txt)
- [lint.log.txt](./raw/validation/lint.log.txt)
- [format.command.txt](./raw/validation/format.command.txt)
- [format.log.txt](./raw/validation/format.log.txt)
- [merge.log.txt](./raw/validation/merge.log.txt)
- [commit.log.txt](./raw/validation/commit.log.txt)
- [push.log.txt](./raw/validation/push.log.txt)
- [conflicts-before.diff.txt](./raw/diffs/conflicts-before.diff.txt)
- [merge-tree.txt.txt](./raw/diffs/merge-tree.txt.txt)
- [feature.diff.txt](./raw/diffs/feature.diff.txt)
- [resolution.diff.txt](./raw/diffs/resolution.diff.txt)

Raw output bytes are unchanged; the manifest records SHA-256. A missing artifact is not interpreted as a pass.
