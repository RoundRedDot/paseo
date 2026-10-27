# PR #7802

**The existing dependency patch was repaired and a Debug simulator build succeeded.**

- Source head: `976e3d9297928787393deb98789ca7a427ef65ad`
- Source tree: `aceb3cb2d150b93bc17fda27fef0921b163891ad`
- Frozen baseline: `9e4aab16cc74f945f9bb676fcab3d8a9a8b686ca`
- Current PR: OPEN, Ready for review, base `main`, merge state `BLOCKED`.
- Targeted result: Raw targeted command/output files are included; no aggregate count is asserted here.
- UIKit result: partial phone Debug evidence, overall acceptance NOT PASSED. First-list copy passed after handle adjustment; cross-block end-handle copy and adjusted start-handle copy, link, and scroll passed. Initial paragraph Copy menu and exact copy failed; nested-item initial Copy also failed.
- Remaining scope: iPad, Release, full-chat, and performance acceptance were not run.
- Evidence was collected by the source owner; tests were not rerun for publication.

## Exact-head CI snapshot

- CheckSuite `CS_kwDOQBkEf88AAAAZh7mt0w`: `action_required`; run [40456882760](https://github.com/getpaseo/paseo/actions/runs/40456882760); run head matches: yes; jobs 0; check-runs 0.

## Included raw outputs

- [prebuild.log.txt](./raw/validation/prebuild.log.txt)
- [pods.log.txt](./raw/validation/pods.log.txt)
- [pods-after-setup-fix.log.txt](./raw/validation/pods-after-setup-fix.log.txt)
- [codegen.log.txt](./raw/validation/codegen.log.txt)
- [owning-codegen.log.txt](./raw/validation/owning-codegen.log.txt)
- [owning-header-equality.log.txt](./raw/validation/owning-header-equality.log.txt)
- [owning-schema.log.txt](./raw/validation/owning-schema.log.txt)
- [schema-generation.log.txt](./raw/validation/schema-generation.log.txt)
- [generated-header-equality.log.txt](./raw/validation/generated-header-equality.log.txt)
- [clean-patch-apply.log.txt](./raw/validation/clean-patch-apply.log.txt)
- [setup-fix.log.txt](./raw/validation/setup-fix.log.txt)
- [setup-assets.log.txt](./raw/validation/setup-assets.log.txt)
- [native-build.log.txt](./raw/validation/native-build.log.txt)
- [native-build-codegen-retry.log.txt](./raw/validation/native-build-codegen-retry.log.txt)
- [final-patch-script.log.txt](./raw/validation/final-patch-script.log.txt)
- [final-typecheck.log.txt](./raw/validation/final-typecheck.log.txt)
- [final-lint.log.txt](./raw/validation/final-lint.log.txt)
- [final-format.log.txt](./raw/validation/final-format.log.txt)
- [final-commit.log.txt](./raw/validation/final-commit.log.txt)
- [push.log.txt](./raw/validation/push.log.txt)
- [compiler-failure-extract.txt.txt](./raw/validation/compiler-failure-extract.txt.txt)
- [prebuild.log.txt](./raw/failures/prebuild.log.txt)
- [pods.log.txt](./raw/failures/pods.log.txt)
- [native-build.log.txt](./raw/failures/native-build.log.txt)
- [native-build-codegen-retry.log.txt](./raw/failures/native-build-codegen-retry.log.txt)
- [compiler-failure-extract.txt.txt](./raw/failures/compiler-failure-extract.txt.txt)
- [build-fix-proposal.patch.txt](./raw/diffs/build-fix-proposal.patch.txt)
- [header-codegen.patch.txt](./raw/diffs/header-codegen.patch.txt)
- [proposed-dependency.patch.txt](./raw/diffs/proposed-dependency.patch.txt)
- [Props.regenerated.diff.txt](./raw/diffs/Props.regenerated.diff.txt)
- [final-staged.diff.txt](./raw/diffs/final-staged.diff.txt)

Raw output bytes are unchanged; the manifest records SHA-256. A missing artifact is not interpreted as a pass.

## Final UIKit acceptance and reviewed media

See the [bounded UIKit receipt](./uikit-final-receipt.json) and [explicit media allowlist receipt](./media/allowlist-receipt.json). The nine allowlisted files contain seven reviewed simulator screenshots, the reviewed contact sheet, and one silent 33.356667-second fixture video. Artifact, dylib, fixture and per-file SHA-256 identities are recorded in the [allowlist receipt](./media/allowlist-receipt.json) and [media manifest](./media/manifest.sha256.txt). No other media is included.

- [Initial paragraph selection (Copy menu absent)](./media/phone-corrected-alpha-initial.png)
- [First list item after handle adjustment](./media/phone-corrected-first-list-initial.png)
- [Nested item (initial Copy menu absent)](./media/phone-final-nested-initial.png)
- [Cross-block end-handle selection and Copy menu](./media/phone-final-end-handle.png)
- [Adjusted start-handle selection and Copy menu](./media/phone-final-start-handle.png)
- [Selected link scenario](./media/phone-final-link.png)
- [Scrolled fixture](./media/phone-final-scrolled.png)
- [Reviewed contact sheet](./media/phone-final-video-contact.png)
- [Silent native gesture recording](./media/phone-final-gestures.mp4)
