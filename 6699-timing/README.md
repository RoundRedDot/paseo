# PR #6699 stopped tool duration repair

Source `2947e07d1209447d9b023302ed610efc81ae1aa8`, based on `13a3cd7279a3fa499f6bf9755b32826c0e981ea8`. Stable arrival timestamps remain. latestTimestamp records actual observed lifecycle boundaries; turn timing takes their maximum within each turn and resets at a new turn. Reconciliation, page/window seams, local cache, internal plugin projection and Overview grouping preserve it. No daemon wire/SDK contract change or dependency on PR7000.

Red regressions reproduce2s instead of62s after cancellation and30s instead of60s through Overview when an earlier parallel tool completes last. Final five affected existing suites pass278 tests. Owning app dependencies, full typecheck/lint/format and complete serial hooks pass. Earlier failed fixture/idempotency attempts remain in the local report; final logs here correspond to final source. Old cache lacks unobserved lifecycle information and is not retroactively reconstructed.

No new real-provider/browser/native run for this follow-up. The earlier real-Claude Read recording has its own source13a3cd7 and remains layout evidence at that source; it is not new-commit runtime acceptance.
