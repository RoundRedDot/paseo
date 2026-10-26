# PR #6601 follow-up — main baseline 678fe308

This is the later source refresh for PR #6601. The original delivery remains documented at [`prs/6601/README.md`](../../prs/6601/README.md) against frozen baseline `902b0c7a1637cc7a6c2ee268dca8161965a35def`; this follow-up records the later merge with `678fe308db3acfa3b58866cb7ae603a9a331a07b` after release 0.13.2 and main #7928.

- Delivered source SHA: `7af4968ea43c76fd26c0e98790ac079700735bdd`
- Tree SHA: `79f542f46f1cd830c878c0558a4e9390cd11a5bc`
- Parents: `53a592e4040f7b3e1d22ffa79ea883101d144581` and `678fe308db3acfa3b58866cb7ae603a9a331a07b`
- Target: `main`
- Source state at readback: Open, Ready for review
- Execution host: self server `srv_IZjHxwClUB6G` (label `luoph-mbp`), shared local filesystem; parent reported `Darwin arm64`

## Dependency resolution and scope

The only merge conflict was in the server dependency declarations and lockfile. The resolved tree uses workspace version `0.13.2`, retains the six Babel transform packages and `@types` dependency, and uses the Nix dependency hash from baseline `678fe308db3acfa3b58866cb7ae603a9a331a07b`. The source-owner audit reports no unmatched dependency records, preserves 6,328 upstream integrity signature fields, and confirms compiler test and documentation bytes are unchanged from the previous source head.

## Commands and results

Commands below and linked stdout were recorded by the source owner. The evidence publication did not rerun them.

- `npm ci --no-audit --no-fund`
- `npm run build:server`
- `npm run build --workspace=@getpaseo/expo-two-way-audio`
- `npm exec --workspace=@getpaseo/server -- vitest run src/server/plugins/compiler.test.ts --bail=1 --maxWorkers=1`
- `npm run format`
- `npm run typecheck`
- `npm run lint`

- Compiler test: **86 passed** in the targeted `src/server/plugins/compiler.test.ts` file.
- Build server and `@getpaseo/expo-two-way-audio`: passed.
- Format, workspace typecheck, lint, normal commit hooks, push, and exact-head readback: passed.

### Raw stdout

- [`build-audio.log.txt`](logs/build-audio.log.txt)
- [`build-server.log.txt`](logs/build-server.log.txt)
- [`compiler-tests.log.txt`](logs/compiler-tests.log.txt)
- [`format.log.txt`](logs/format.log.txt)
- [`typecheck.log.txt`](logs/typecheck.log.txt)
- [`lint.log.txt`](logs/lint.log.txt)
- [`commit.log.txt`](logs/commit.log.txt)
- [`commit-receipt.log.txt`](logs/commit-receipt.log.txt)
- [`merge.log.txt`](logs/merge.log.txt)

### Conflict diff

- [`conflict.diff.txt`](diffs/conflict.diff.txt) — dependency-version conflict at the pre-resolution merge.

### Reduced receipts

- [`receipt.txt`](receipt.txt) — source/tree/parent identities, dependency audit summary, validation counts, host, and remaining gaps.
- [`dependency-audit.txt`](dependency-audit.txt) — reduced source-owner dependency audit.
- [`ci-receipt.txt`](ci-receipt.txt) — exact-head CI, review, PR state, and mergeability fields.
- [`ci-jobs.txt`](ci-jobs.txt) — raw workflow job response; zero jobs.

## Exact-head CI and review readback

At `{RESULT['ciReadbackAt']}`, workflow run `40317224032` completed with conclusion `ACTION_REQUIRED` and **0 jobs**; GraphQL returned **0 individual check suites**. `ACTION_REQUIRED` is not a pass, and this evidence does not infer the underlying gate. The same readback reported review decision `APPROVED` with 2 resolved, outdated review threads. The PR was Open/Ready for review, targeted `main`, and reported API `mergeable=true` plus GraphQL `MERGEABLE`; `mergeStateStatus=BLOCKED` is recorded as observed without inferring a gate reason.

## Remaining acceptance gaps

- Older RN 0.81.5 Hermes VM evidence remains historical and source-scoped.
- No new RN 0.86.3 VM/device installation, plugin UI, packaged desktop, Windows, or Linux acceptance was performed.
- No full test suite or device test is claimed by this evidence publication.
