# PR #7556 bounded performance evidence — 2026-10-27

Source head `053f916fc5a6d92b105d0bfc927f42458fcb5704`; source tree `dcb97cbef9a7fda4b550406b6342a5f702e4f8c7`. Final result: **STOP before timed comparison**.

The normal-UI real-DOM observer preflight passed (246 growth frames / 396 characters in 5 seconds). The fixed 205-history exercise did not satisfy the declared oldest-history, overflow, and write acceptance preconditions after bounded normal summary expansion. No A, B, or returning-A timed samples exist. This is not a measured noise failure, product regression, or performance benefit.

The browser runner used the existing `npm test:e2e` script with one worker and zero retries. Initial loader/serialization and history-preparation failures are retained below. No substitute fixture, workload enlargement, or benchmark search was used. Native ring cadence and Markdown boundaries were unchanged. Android CPU, battery, frame, OOM, and maintainer cadence acceptance remain open.

This selected bundle contains a reduced result summary and compact safe text/JSON from the source owner's `performance/7556/public` allowlist. Model/provider configuration, private body and device inventory are omitted. Screenshots, videos, browser storage, and large traces are excluded. The local manifest is generated after Markdown formatting and excludes itself.

## Selected source files

- [Reduced result summary](./result.json)

- [capture-import-failure.log](./capture-import-failure.log.txt)
- [loader-check.log](./loader-check.log.txt)
- [capture-valid.log](./capture-valid.log.txt)
- [history-setup-failure/capture.log](./history-setup-failure/capture.log.txt)
- [history-setup-failure/raw/calibration-1-failure.txt](./history-setup-failure/raw/calibration-1-failure.txt.txt)
- [collapsed-history-precondition/capture-valid.log](./collapsed-history-precondition/capture-valid.log.txt)
- [collapsed-history-precondition/raw/calibration-1-failure.txt](./collapsed-history-precondition/raw/calibration-1-failure.txt.txt)
- [raw/valid-calibration/calibration-1-failure.txt](./raw/valid-calibration/calibration-1-failure.txt.txt)
- [raw/expanded-history/calibration-1-failure.txt](./raw/expanded-history/calibration-1-failure.txt.txt)
- [raw/observer-preflight.json](./raw/observer-preflight.json.txt)
