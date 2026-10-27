# Maintainer decisions and CI notes — 2026-10-27

These options are recorded for review. No product contract is selected here. CI fields were captured at `2026-10-27T05:53:02.855Z`; `ACTION_REQUIRED` is not a pass, and the API does not expose its specific gate.

## #7015 — shared question answer contract

- Current delivered head: `aff3245c65ccf769ceae8cd1937d9c57ffd055e3`. The shared form preserves selected option IDs separately from custom text; vendor bridges serialize their own accepted response shapes.
- Options: (1) keep IDs/text canonical internally and map only at vendor boundaries, retaining explicit update-required behavior for old label-only clients; (2) add an optional versioned structured field while retaining a defined legacy form during migration; or (3) define vendor-specific answer shapes for shared consumers. Label-only joined text is ambiguous when labels collide.
- Evidence: targeted ACP/protocol/browser receipts are in [PR #7015](./prs/7015/README.md). The previous real Grok downstream result conflated labels; captured Cursor sessions did not emit a native question. No provider test ran for publication. #3490 remains the recorded owner of the shared-contract choice.
- Exact-head CI: `action_required`; jobs 0; check-runs 0; [run 40453712383](https://github.com/getpaseo/paseo/actions/runs/40453712383).

## #6731 — plugin lifetime across disconnect

- Current head: `ac19eed979213b90670f401b636ae05cf05c7db7`; this round audited docs only and did not change source.
- Options: (1) retain installations across transient socket loss and clean up only on host removal/client replacement, requiring offline RPC tolerance and changing cleanup timing; (2) preserve teardown-on-disconnect and show an offline/loading surface while reconnect reevaluates; or (3) add a distinct offline lifecycle event, which changes the plugin API and migration burden.
- Evidence: focused lifecycle tests and prior web/Android comparisons remain source-specific; the reported native iOS direct-to-relay case remains unverified. See [PR #6731](./prs/6731/README.md) and [#7088](https://github.com/getpaseo/paseo/issues/7088).
- Exact-head CI: `action_required`; jobs 0; check-runs 0; [run 40311631639](https://github.com/getpaseo/paseo/actions/runs/40311631639).

## #6699 — renderer timestamp semantics (cross-round reference)

- Current head: `f072bdfb06c55d231bb72126761d16b9ec0f1b9c`; this PR was not a source delivery in this batch. The PR proposes keeping arrival `timestamp` stable while tracking lifecycle updates separately; the public contract remains undecided.
- Options: (1) preserve public `timestamp` as arrival and expose a distinct lifecycle time; (2) keep public `timestamp` as latest lifecycle update and expose a separate arrival field; or (3) document arrival semantics without exposing lifecycle time. Turn completion/duration must use the chosen lifecycle boundary.
- Compatibility: plugins that interpret `timestamp` as latest-update may change if it becomes arrival; the published renderer contract does not define the meaning. Historical renderer recordings use deterministic SDK replay and do not prove vendor inference or official distribution acceptance.
- Exact-head CI: `action_required`; jobs 0; check-runs 0; [run 40312356788](https://github.com/getpaseo/paseo/actions/runs/40312356788).
  See [PR #6699](https://github.com/getpaseo/paseo/pull/6699) and [#7196](https://github.com/getpaseo/paseo/issues/7196).

## Viewer permission and Actions limits

Authenticated viewer `luoph` has `pull` permission on `getpaseo/paseo` and `push` on `RoundRedDot/paseo`. The upstream collaborator-permission API returned HTTP 403 because it requires push access. No workflow was approved or rerun. Workflow `CI` (`.github/workflows/ci.yml`) has build/test/quality jobs and no deploy/release job; this does not reveal the cause of `ACTION_REQUIRED`.
