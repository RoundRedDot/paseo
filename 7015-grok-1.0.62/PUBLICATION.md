# Installed Grok1.0.62 real-provider recheck

Fixed PR head `b8a48e4825cf49d09f352a4b3d7793847657908c`; one real user prompt/native question, no retry. Native structured delivery passes, vendor tool result still joins labels, and this model-confirmation case **fails**. `summary.json.identityCorrect` describes the native response payload; `modelConfirmation=false` records the failed final model interpretation.

[Raw field-selected summary](summary.json), [actual native request/response and vendor tool result excerpts](wire-excerpts.jsonl), [worker evidence scope](README.md). This is real Grok runtime with synthetic test text, not a fabricated SDK question. Old1.0.60 failures remain separate. No DOM/mobile/packaged desktop acceptance or claim that the installed binary is built from current public main. Owned resources were cleaned up; no product changes.
