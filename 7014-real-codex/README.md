# PR7014 real Codex async question evidence

Real Codex runtime validation on `8ddacf76a5ea854c8c0ec5e8084bc9d1e8c276db` (macOS arm64, codex-cli 0.163.0, native-confirmed `gpt-6.1-sol` / `medium`): an actual `request_user_input_async` produced the native question and choices. The production question form core generated the structured Paseo answer, the adapter delivered it through native `turn/steer`, and the provider completed with `QA_ANSWER=Cobalt`.

The original questions, ID-keyed selected answer, and `answered` status were identical after provider refresh, a disk restart of the isolated daemon with a fresh client, and another native-history reload. A second production DaemonClient received the same metadata, and no pending permission reopened. The successful run used one native turn plus one steer; question arrival took 5.723 s and answer-to-completion took 3.404 s.

Two synthetic initial prompt attempts were used in total: the first was interrupted after 27 ms by an overly broad QA error filter before any question or assistant output; the second completed the chain. Other startup-only harness failures and their raw output are retained in the evidence. No account/model switch, production deployment, or source edit was performed. All owned processes and ports were closed.

This is real provider and shared-form/DaemonClient evidence. Browser DOM, native/mobile UI, dismissed-question behavior, and other providers were not exercised in this run.


The public result lists23 runtime assertions. Existing59 automated fixture tests were not rerun or counted here. SHA256SUMS covers the worker-provided artifact set; this README is the parent publication entry. Private homes, authentication references and harness scripts referencing them are excluded. No source changes.
