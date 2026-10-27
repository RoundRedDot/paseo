# PR #7014

**Integrated async question handling and provider history behavior while preserving existing provider contracts.**

- Source head: `c92cc88e3ac971c032ca295848c5ec3e06bb3c97`
- Source tree: `1a8fe35f5c4520728043b393b6279cc599087b31`
- Frozen baseline: `9e4aab16cc74f945f9bb676fcab3d8a9a8b686ca`
- Current PR: OPEN, Ready for review, base `main`, merge state `BLOCKED`.
- Targeted result: Raw targeted command/output files are included; no aggregate count is asserted here.
- Remaining scope: No new real-provider question-card, native/mobile, or packaged acceptance in this integration slice.
- Evidence was collected by the source owner; tests were not rerun for publication.

## Exact-head CI snapshot

- CheckSuite `CS_kwDOQBkEf88AAAAZh5-tSA`: `action_required`; run [40456233363](https://github.com/getpaseo/paseo/actions/runs/40456233363); run head matches: yes; jobs 0; check-runs 0.

## Included raw outputs

- [build-server.command.txt](./raw/validation/build-server.command.txt)
- [build-server.log.txt](./raw/validation/build-server.log.txt)
- [packages**server**src**server**agent**providers**codex-async-questions.test.command.txt](./raw/validation/packages__server__src__server__agent__providers__codex-async-questions.test.command.txt)
- [packages**server**src**server**agent**providers**codex-async-questions.test.log.txt](./raw/validation/packages__server__src__server__agent__providers__codex-async-questions.test.log.txt)
- [packages**server**src**server**agent**providers**omp\_\_agent.test.command.txt](./raw/validation/packages__server__src__server__agent__providers__omp__agent.test.command.txt)
- [packages**server**src**server**agent**providers**omp\_\_agent.test.log.txt](./raw/validation/packages__server__src__server__agent__providers__omp__agent.test.log.txt)
- [packages**server**src**server**agent**providers**omp\_\_history-mapper.test.command.txt](./raw/validation/packages__server__src__server__agent__providers__omp__history-mapper.test.command.txt)
- [packages**server**src**server**agent**providers**omp\_\_history-mapper.test.log.txt](./raw/validation/packages__server__src__server__agent__providers__omp__history-mapper.test.log.txt)
- [packages**server**src**server**agent**providers**opencode\_\_tool-call-mapper.test.command.txt](./raw/validation/packages__server__src__server__agent__providers__opencode__tool-call-mapper.test.command.txt)
- [packages**server**src**server**agent**providers**opencode\_\_tool-call-mapper.test.log.txt](./raw/validation/packages__server__src__server__agent__providers__opencode__tool-call-mapper.test.log.txt)
- [packages**server**src**server**agent**providers**pi\_\_agent.test.command.txt](./raw/validation/packages__server__src__server__agent__providers__pi__agent.test.command.txt)
- [packages**server**src**server**agent**providers**pi\_\_agent.test.log.txt](./raw/validation/packages__server__src__server__agent__providers__pi__agent.test.log.txt)
- [packages**server**src**server**agent**providers**pi\_\_history-mapper.test.command.txt](./raw/validation/packages__server__src__server__agent__providers__pi__history-mapper.test.command.txt)
- [packages**server**src**server**agent**providers**pi\_\_history-mapper.test.log.txt](./raw/validation/packages__server__src__server__agent__providers__pi__history-mapper.test.log.txt)
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
