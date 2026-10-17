# PR 7015 cursor isolated native-provider acceptance

Source: b8a48e4825cf49d09f352a4b3d7793847657908c. Worker 1, retry 0, user prompts sent: 1.

Cursor 2026.10.01-e373342 acknowledged native session/set_model for composer-2.5 and session/set_mode for plan. The one prompted session reports AskQuestion unavailable and emits no cursor/ask_question: NOT_AVAILABLE for this case. Native answer-ID delivery is NOT_RUN, not a failed submission. The earlier plan/grok-4.7 case remains separate.

The summary separates native-question emission, production form-core submission, native vendor response, tool completion and model confirmation. A process exit of zero is not an acceptance verdict. Wire excerpts are observed real CLI traffic, with source line references; no native question was injected. Synthetic session/tool identifiers are replaced by placeholders.

This artifact supplements earlier evidence; it does not establish every model, mode, platform, or vendor version. No claim is made that current public source is the source of the installed binary.
