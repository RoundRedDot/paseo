# PR #6736 real OMP runtime blocker

Candidate `6513124ca16cf18db0df5eba3fda80c9fe2b37f0`. Official OMP `18.11.3` installed only in a temporary prefix, then started through the candidate OmpAgentClient/RPC path. Startup failed because no default model/authorization was configured. **0 inference requests**. No login, copied credentials or model guessing.

This is a blocked acceptance attempt, not evidence that image live/history/reload works or fails with a real provider. Existing typed-adapter/browser checks do not replace this missing evidence. Native cross-client image/lightbox acceptance also remains pending; keep Draft.
