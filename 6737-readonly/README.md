# PR #6737 read-only reconnect repair

Source `f0f445e354298adc6385e11dfe6c2b1f85da9ca7`, based on `237a5d4c6bcdb5a30a9be3cf8d5e564a562222d8`. Explicit permissions without workspace.manage cancel only that host's unpublished moves with dedicated feedback, releasing shared snapshot/update projection. Unknown permissions/directory/cache readiness do not cancel. Other hosts' queues survive; recovered write access publishes new gestures without replaying canceled ones. Old in-flight acknowledgements are fenced.

Previous production fails the new snapshot regression. Final controller12 + replica15 =27 tests pass, plus owning client build, repository format/typecheck/lint and complete serial hooks. These are existing typed-adapter/controller/store/replica tests; real Session/browser/provider/native/toast rendering were not rerun for this patch. Protocol/daemon authorization and full file/browser scope are unchanged.
