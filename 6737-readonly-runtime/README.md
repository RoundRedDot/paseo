# PR #6737 readonly reconnect runtime evidence (safe public subset)

Source: `f0f445e354298adc6385e11dfe6c2b1f85da9ca7` (unchanged, clean).

Real in-process daemon test bootstrap + real WebSocket Session + production DaemonClient + production SharedOrderingController/store/replica. Permission source: locally granted Hub relationship permissions, changed through the real owner management RPC. The local Hub HTTP/WebSocket counterpart validates the generated ephemeral credential and forwards Session bytes; it does not emulate ordering responses or server_info.

Command (run 2, exit 0; one temporary runtime case, not the existing unit suite):
```sh
/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/sh -c 'PASEO_SUPERVISED=0 npm_config_cache=/tmp/paseo-pr-gap-20261017/6737-readonly-runtime/npm-cache npx vitest run --config /tmp/paseo-pr-gap-20261017/6737-readonly-runtime/vitest.runtime.config.ts /tmp/paseo-pr-gap-20261017/6737-readonly-runtime/readonly-runtime.test.ts --bail=1 --maxWorkers=1 --no-file-parallelism > /tmp/paseo-pr-gap-20261017/6737-readonly-runtime/run-2.log 2>&1; qa_result=$?; echo "$qa_result" > /tmp/paseo-pr-gap-20261017/6737-readonly-runtime/run-2.exit; exit "$qa_result"'
```
```text
Test Files  1 passed (1)
Tests  1 passed (1)
Start at  12:55:03
Duration  7.21s (transform 4.56s, setup 21ms, import 5.73s, tests 1.40s, environment 0ms)
```

The offline gesture emits the real controller's existing expected `failed` event. Both runs strictly assert that event and then reset only the harness error array for subsequent-phase assertions. After that reset, the readonly reconnect applies its snapshot, emits only `permissionLost` for the cancelled queue, and sends zero target/order/forget writes. This is not a claim of no generic feedback throughout the full scenario. Two subsequent real owner unpins produce revision 2 and 3 prune broadcasts. Programmatic cache permutation probes exercise actual controller projection using those newer records. After regaining write permission, no old move is submitted and one new gesture writes at expected revision 3.

Raw selected rows (generated local workspace/request/subscription IDs are ephemeral and non-secret; these are original wire/event values, not placeholders):
```jsonl
{"time":"2026-10-17T04:55:09.335Z","phase":"offline","event":"controller.error","payload":{"kind":"failed"}}
{"time":"2026-10-17T04:55:09.335Z","phase":"offline","event":"offline.gesture","payload":{"moved":"wks_14878676f5c316ab","order":["wks_14878676f5c316ab","wks_d7a13a183e3131eb","wks_974b8e41f0808393","wks_5f30b2da8baa508a"]}}
{"time":"2026-10-17T04:55:09.804Z","phase":"readonly","event":"client.permissions","payload":{"readonlyPermissions":["workspace.read"],"source":"real Session server_info after local Hub management revoke"}}
{"time":"2026-10-17T04:55:09.805Z","phase":"readonly","event":"controller.error","payload":{"kind":"permissionLost"}}
{"time":"2026-10-17T04:55:09.806Z","phase":"readonly","event":"snapshot.projected","payload":{"order":["wks_d7a13a183e3131eb","wks_974b8e41f0808393","wks_5f30b2da8baa508a","wks_14878676f5c316ab"],"errors":[{"kind":"permissionLost"}]}}
{"time":"2026-10-17T04:55:09.810Z","phase":"readonly","event":"daemon.to.app","payload":{"type":"ui.order.update","payload":{"scope":{"kind":"pinned"},"record":{"scope":{"kind":"pinned"},"revision":2,"order":["wks_d7a13a183e3131eb","wks_5f30b2da8baa508a","wks_14878676f5c316ab"]},"subscriptionId":"07846499-0a4e-41d6-a1b1-e55262da6078"}}}
{"time":"2026-10-17T04:55:09.813Z","phase":"readonly","event":"update.1.projected","payload":{"order":["wks_d7a13a183e3131eb","wks_5f30b2da8baa508a","wks_974b8e41f0808393","wks_14878676f5c316ab"],"probe":"programmatic cache reorder proves controller holds pruned record, not the original snapshot"}}
{"time":"2026-10-17T04:55:09.815Z","phase":"readonly","event":"daemon.to.app","payload":{"type":"ui.order.update","payload":{"scope":{"kind":"pinned"},"record":{"scope":{"kind":"pinned"},"revision":3,"order":["wks_d7a13a183e3131eb","wks_14878676f5c316ab"]},"subscriptionId":"07846499-0a4e-41d6-a1b1-e55262da6078"}}}
{"time":"2026-10-17T04:55:09.816Z","phase":"readonly","event":"update.2.projected","payload":{"order":["wks_d7a13a183e3131eb","wks_14878676f5c316ab","wks_5f30b2da8baa508a","wks_974b8e41f0808393"]}}
{"time":"2026-10-17T04:55:09.817Z","phase":"readonly","event":"readonly.no.write","payload":{"requests":["ui.order.list.request","ui.order.list.request","ui.order.list.request","ui.order.list.request"],"illegalWriteCount":0}}
{"time":"2026-10-17T04:55:10.394Z","phase":"new-gesture","event":"app.to.daemon","payload":{"type":"ui.order.set.request","requestId":"70c74e77-12ea-483a-9d9f-4df3763f0d5e","scope":{"kind":"pinned"},"expectedRevision":3,"order":["wks_14878676f5c316ab","wks_d7a13a183e3131eb"]}}
{"time":"2026-10-17T04:55:10.448Z","phase":"new-gesture","event":"PASS","payload":{"started":"2026-10-17T04:55:09.069Z","ended":"2026-10-17T04:55:10.448Z","snapshot":true,"laterPruneUpdates":2,"readonlyIllegalWrites":0,"cancelFeedback":"permissionLost","regainOldMovesReplayed":0,"newGestureWrites":1}}
{"time":"2026-10-17T04:55:10.466Z","phase":"cleanup","event":"cleanup","payload":{"clientsClosed":true,"daemonStopped":true,"hubStopped":true,"privateStateRemoved":true}}
```

Not verified: external deployed Hub authentication/pairing, a concurrent same-principal peer reorder (later updates above are real pruning updates), another host queue in this runtime harness, browser/device/toast rendering, provider/model calls (not requested; builtin providers disabled). Run 1 closed the writer while its initial inventory remained unsettled. It had already asserted and cleared the expected offline `failed`, but then received an additional inventory-close `failed` after that reset; its subsequent `[permissionLost]` assertion therefore failed. Run 2 added only a pre-offline wait for actual device revision 1 and a setup-error assertion. It did not add the offline `failed` expectation or reset, and it did not eliminate the normal offline feedback. These are different harness preconditions on unchanged product code, not a product fix. No product change, commit, push, or GitHub write was made. Cleanup closes clients/daemon/local Hub and removes private state.

## Exact harness delta and preserved failure evidence

The following pre-offline change is from the recorded editing command; run 1's original harness was not separately frozen. The offline assertion/reset was already present in run 1 and remains unchanged at final harness line 162:
```diff
-    await mobile.listOrders();
+    await expect.poll(async()=>(await mobile.listOrders()).deviceRevision).toBe(1);
+    expect(errors).toEqual([]);
     sharedOrdering.disconnect(host);await mobile.close();
```
```ts
expect(errors).toEqual([{kind:'failed'}]);errors.length=0;
```
The reset follows a strict assertion, does not remove raw records or unsubscribe from errors, and does not alter the production queue. A new error after the reset still fails the later assertion, as run 1 demonstrates. Run 1's offline phase had two `failed` events; run 2's offline phase had one. Both readonly phases recorded one `permissionLost`. Only run 2 completed all later updates/recovery assertions.

Selected original run-1 rows (not regenerated events):
```jsonl
{"time":"2026-10-17T04:54:10.586Z","phase":"offline","event":"controller.error","payload":{"kind":"failed"}}
{"time":"2026-10-17T04:54:10.590Z","phase":"offline","event":"controller.error","payload":{"kind":"failed"}}
{"time":"2026-10-17T04:54:10.591Z","phase":"offline","event":"daemon.to.app","payload":{"type":"ui.order.targets.set.response","payload":{"requestId":"9028bdfe-4bb0-4c97-8afe-2decc2921f14","accepted":true,"revision":1}}}
{"time":"2026-10-17T04:54:11.054Z","phase":"readonly","event":"controller.error","payload":{"kind":"permissionLost"}}
```
Original failed assertion, retained in `run-1.log`:
```text
AssertionError: expected [ { kind: 'failed' }, …(1) ] to deeply equal [ { kind: 'permissionLost' } ]
Tests  1 failed (1)
```

Public-file/credential classification: see `PUBLIC-MANIFEST.md`. The hardcoded enrollment string in the harness is **SYNTHETIC**, not a generated daemon credential; generated private credential secrets/verifiers are excluded. This report correction reruns no case and changes no harness logic, product source, or Git state.
