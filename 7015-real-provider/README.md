# PR #7015 real provider acceptance: partial

Source `b8a48e4825cf49d09f352a4b3d7793847657908c`. Real isolated daemon, installed Grok1.0.60 and Cursor2026.10.01-e373342, existing authorized sessions. Transparent ACP proxy, actual shared form core and DaemonClient submission; no DOM/device acceptance or synthesized native questions.

Grok `grok-4.7` / high / default produces a real multi-select question: Red / Blue / Red, Blue. Paseo submits option IDs0/1 and independent notes Red, Blue. Native accepted response retains answers [Red,Blue] and annotations.notes separately: transport PASS. The subsequent vendor tool result combines the labels into one string; model output selects [Red, Blue] as a single third label with combined_selected=true: end-to-end identity confirmation FAIL. Notes remain intact. ACP evidence shows that boundary; it does not expose the CLI's full internal model input or locate its internal function.

Cursor `plan` / `grok-4.7` reports AskQuestion unavailable; no native question or Paseo permission occurs. NOT_AVAILABLE is limited to this actual version/session/model, not all Cursor configurations. Mode setting succeeds. No auth/quota failure occurred.

First Grok attempt failed in the QA harness (permission mistaken for terminal state, no answer submitted), retained locally; one corrected request yields the result above. No further attempts. Native offline-client cancellation, single-select, duplicate labels, mobile and packaged Electron remain unverified. No product changes/deployment.

Wire excerpts retain original records with source line numbers; full synthetic result records include request/submission/vendor response/model result. Shell exit0 is not a pass for failed assertions.
