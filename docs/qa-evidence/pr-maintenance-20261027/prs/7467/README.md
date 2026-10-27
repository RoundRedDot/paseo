# PR #7467

**Preserved the send-shortcut setting alongside font settings; 112 storage cases and two Chromium cases passed.**

- Source head: `70df9add8941096e5437b88efad97cf91d95f43b`
- Source tree: `f0ce8d4c0838fdd3c0c17e0a85c49536bb54aff9`
- Frozen baseline: `9e4aab16cc74f945f9bb676fcab3d8a9a8b686ca`
- Current PR: OPEN, Ready for review, base `main`, merge state `BLOCKED`.
- Targeted result: 112 targeted tests are reported by the source owner.
- Remaining scope: Browser CSS/keyboard paths passed; no new dedicated Android rendering, native iPad, release APK, or packaged Electron acceptance.
- Evidence was collected by the source owner; tests were not rerun for publication.

## Exact-head CI snapshot

- CheckSuite `CS_kwDOQBkEf88AAAAZh8URLg`: `action_required`; run [40457162699](https://github.com/getpaseo/paseo/actions/runs/40457162699); run head matches: yes; jobs 0; check-runs 0.

## Included raw outputs

- [appearance-theme-picker.spec.ts.log.txt](./raw/validation/appearance-theme-picker.spec.ts.log.txt)
- [settings-toggle-tab-regression.spec.ts.log.txt](./raw/validation/settings-toggle-tab-regression.spec.ts.log.txt)
- [src**hooks**use-settings\_\_storage.test.ts.log.txt](./raw/validation/src__hooks__use-settings__storage.test.ts.log.txt)
- [typecheck.log.txt](./raw/validation/typecheck.log.txt)
- [lint.log.txt](./raw/validation/lint.log.txt)
- [format.log.txt](./raw/validation/format.log.txt)
- [commit.log.txt](./raw/validation/commit.log.txt)
- [push.log.txt](./raw/validation/push.log.txt)
- [merge.log.txt](./raw/validation/merge.log.txt)
- [pre-integration**src**hooks**use-settings**storage.test.ts.log.txt](./raw/failures/pre-integration__src__hooks__use-settings__storage.test.ts.log.txt)
- [pre-integration**src**hooks**use-settings**storage.test.ts.corrected-filter.log.txt](./raw/failures/pre-integration__src__hooks__use-settings__storage.test.ts.corrected-filter.log.txt)
- [feature-overlap.diff.txt](./raw/diffs/feature-overlap.diff.txt)
- [incoming.diff.txt](./raw/diffs/incoming.diff.txt)
- [semantic-merge.diff.txt](./raw/diffs/semantic-merge.diff.txt)
- [unstaged-after-format.diff.txt](./raw/diffs/unstaged-after-format.diff.txt)

Raw output bytes are unchanged; the manifest records SHA-256. A missing artifact is not interpreted as a pass.
