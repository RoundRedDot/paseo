# PR #7714

**Final refreshed delivery preserves Claude async history restore and existing row identity/aliases.**

- Historical initial delivery: `3a07cdebd16cd431264c661c7b231757c6505fa8`, tree `b1ab6e2dd1ecd5ac244ba0abe83b44cfe53e1b18`, against frozen baseline `9e4aab16cc74f945f9bb676fcab3d8a9a8b686ca`.
- Final refreshed delivery: `79d6a4f77b473112b6c568d6a4440c299fcdc6c6`, tree `96a3c4471da56962c76aaa3dd943c3988bdc8574`, based on main `2ce6681d6e4de6d6400ba095741014f1bbfa4221`.
- Six targeted test files reported 151 passing tests; build, typecheck, lint, format and normal hooks passed. Final fork and PR readbacks matched the delivered head.
- GitHub reports `mergeable=true`, merge state `BLOCKED`. Exact-head CheckSuite `109670274049` and run [40463995028](https://github.com/getpaseo/paseo/actions/runs/40463995028) are `ACTION_REQUIRED` with zero jobs.
- Real Claude reopen/resume, native UI and packaged desktop lifecycle were not rerun. Tests were not rerun for publication.

## Initial-delivery CI snapshot (historical)

- CheckSuite `CS_kwDOQBkEf88AAAAZhznxIw`: `action_required`; run [40453696225](https://github.com/getpaseo/paseo/actions/runs/40453696225); head matched the initial delivery; jobs 0; check-runs 0.

## Final refreshed source receipt

See the [exact delivered receipt](./final-refresh/source-receipt.json), [final-refresh test/build stdout](./final-refresh/README.md), and [current exact-head CI snapshot](./current-ci.json).

## Initial-delivery raw outputs (historical)

- [build-server.command.txt](./raw/validation/build-server.command.txt)
- [build-server.log.txt](./raw/validation/build-server.log.txt)
- [build-audio.command.txt](./raw/validation/build-audio.command.txt)
- [build-audio.log.txt](./raw/validation/build-audio.log.txt)
- [packages**server**src**server**agent**providers**claude\_\_agent.history-load.test.command.txt](./raw/validation/packages__server__src__server__agent__providers__claude__agent.history-load.test.command.txt)
- [packages**server**src**server**agent**providers**claude\_\_agent.history-load.test.log.txt](./raw/validation/packages__server__src__server__agent__providers__claude__agent.history-load.test.log.txt)
- [packages**server**src**server**agent**providers**claude\_\_agent.sub-agent-replay.test.command.txt](./raw/validation/packages__server__src__server__agent__providers__claude__agent.sub-agent-replay.test.command.txt)
- [packages**server**src**server**agent**providers**claude\_\_agent.sub-agent-replay.test.log.txt](./raw/validation/packages__server__src__server__agent__providers__claude__agent.sub-agent-replay.test.log.txt)
- [packages**server**src**server**agent**providers**claude**subagents**live-source.test.command.txt](./raw/validation/packages__server__src__server__agent__providers__claude__subagents__live-source.test.command.txt)
- [packages**server**src**server**agent**providers**claude**subagents**live-source.test.log.txt](./raw/validation/packages__server__src__server__agent__providers__claude__subagents__live-source.test.log.txt)
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
- [red-regression.command.txt](./raw/failures/red-regression.command.txt)
- [red-regression.log.txt](./raw/failures/red-regression.log.txt)
- [red-async-restored.log.txt](./raw/failures/red-async-restored.log.txt)
- [conflicts-before.diff.txt](./raw/diffs/conflicts-before.diff.txt)
- [feature.diff.txt](./raw/diffs/feature.diff.txt)
- [resolution.diff.txt](./raw/diffs/resolution.diff.txt)

Raw output bytes are unchanged; the manifest records SHA-256. A missing artifact is not interpreted as a pass.
