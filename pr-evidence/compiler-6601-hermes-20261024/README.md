# PR6601 Hermes VM evidence

Source head: `02177550c5e448b652cbde625e86ec8d1e9cc37f`.
Evidence-only branch: `qa/compiler-6601-hermes-20261024-b62b29e`.
Collected by the native-qa worker; reconciled and published by the compiler worker on 2026-10-24.

## Verified scope

**RN 0.81.5 Hermes VM probe PASS.** Both source wrappers executed in the real Hermes VM,
exited 0, printed their exact expected result, and produced empty stderr.
**RN 0.86.3 VM, device installation and plugin UI: NOT_RUN.**

The VM is the existing macOS universal executable from React Native 0.81.5:

- Binary: `/Users/luopeihuan/workspace/rrd/paseo/node_modules/react-native/sdks/hermesc/osx-bin/hermes`
- SHA256: `c5f2cf15564076966fbb4eb921f517bedcc08cf45be23fdc27996bfe8dc2bbe3`
- Reported release: `for RN 0.81.5`; HBC version: `96`.

The compiler checkout uses RN 0.86.3. Its `hermesc` does not establish VM execution for that version.
The publisher verified the existing outputs, binary identity and hashes without rerunning the VM
or previously green test suites.

## Inputs and expected behavior

`raw/fixtures/` retains the original source, bundle, executable wrapper and expected JSON.
The `.txt` suffix preserves the original bytes as evidence; it is not part of the original filename.
`manifest.json` contains byte counts and SHA256 for every retained raw artifact.
`receipt.json` records the publisher's reconciliation checks.

- Small: bundle 7703 bytes; wrapper 8391 bytes. Covers inherited/public/private/static fields,
  private methods/private-in, static blocks, accessors and Error subclassing. The wrapper changes
  both host exports after factory creation; the result must retain distinct original snapshots.
- Large: 400 classes; bundle 207203 bytes; wrapper 207745 bytes; result `400`.
  The large source exceeds 64 KiB. This is VM source execution, not a device UI or
  lazy-compilation performance measurement.

Expected VM stdout:

```text
{"probe":"small","ok":true,"actual":{"label":"child","doubled":4,"total":10,"isBase":true,"registry":1,"error":[true,"probe message","probe"],"imports":["first export","second export"]}}
{"probe":"large","ok":true,"actual":400}
```

`raw/native/` preserves the native worker's stdout, stderr, exit codes, version, binary identity,
input hashes, sizes and report excerpt. `raw/compiler/` retains source identity, bundle generation,
Node-only sanity, current focused tests/build/static logs and normal commit hooks.
The Node logs are separate from the VM outputs.

## Replay commands

These commands reconstruct the recorded invocation from the captured VM identity and inputs;
the publisher did not rerun them. Run from this evidence directory with the original VM available:

```sh
vm=/Users/luopeihuan/workspace/rrd/paseo/node_modules/react-native/sdks/hermesc/osx-bin/hermes
"$vm" -version
shasum -a 256 "$vm"
"$vm" raw/fixtures/small.vm-input.js.txt > small.stdout 2> small.stderr
printf '%s\n' "$?" > small.exit
"$vm" raw/fixtures/large.vm-input.js.txt > large.stdout 2> large.stderr
printf '%s\n' "$?" > large.exit
```

The compiler generation script is retained verbatim at
`raw/compiler/prepare-hermes-fixtures.mjs.txt`; its relative paths refer to the contributor's
original `.dev/compiler-evidence/` location. The generated wrappers here are the actual VM inputs.
These fixtures return values from their default export and are not installable app plugins.
