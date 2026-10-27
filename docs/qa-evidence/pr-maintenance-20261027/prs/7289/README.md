# PR #7289 affected-device acceptance boundary

Source head `f4539358f3168dc1b38739fa3eb9af7fe2452419` is unchanged. Initial host inventory had no connected ADB devices. Final inventory showed PHN110 connected, but the user declined allocation. No Android build, install, launch, device control, or affected-device validation was performed. The OPPO PLA110 / Android 16 and OnePlus Open / OxygenOS 16.0.5 acceptance gap remains open.

The exact-head CheckSuite completed `ACTION_REQUIRED` with zero check-runs. See [device allocation receipt](./device-allocation.json.txt).
