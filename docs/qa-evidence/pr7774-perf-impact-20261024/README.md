# PR7774: bounded browser actual-impact investigation

The capture did **not demonstrate a user-visible benefit** from PR7774. The maintainer's [actual-impact request](https://github.com/getpaseo/paseo/issues/7773#issuecomment-6378615678) remains unmet. No application fix was added in this investigation.

## Identity and workload

- Candidate: exact application commit `72886023ca99dd990337a8f70cdef2a6d304395e`. Baseline: its parent `48623801a1bba8f1c259212d37f56a504812e42d`. Only the production agent-store file was swapped for baseline; candidate bytes were restored after each group. This is not evidence for integration with the later frozen main `b8bb335c563279be45544b1b20a1fa5b3e56d422`.
- macOS 27.0.1, Apple M5 Pro, 15 CPUs, 48 GiB; Chromium 145.0.7632.6, 1280x900, headless browser with video recording. Normal development Metro app and a real isolated development daemon, using the repository mock provider for deterministic token output. No real-model or production-browser/native claim.
- One visible agent; fixed 1,981-character Markdown reply at 40 ms provider token cadence, 12 sequential non-visible label updates at 1 Hz. Type 59 characters at 100 ms cadence; send 20 wheels of -160 px at 100 ms cadence. No CPU throttling, artificial history flood, render profiler, or expensive React-fiber instrumentation.
- Main sequence: baseline (2), candidate (2), baseline-control (2), fresh browser contexts/agents. The first reply was not yet tall enough at the 8-10 s wheel phase. Those six samples did **not** exercise effective reader scrolling and cannot prove scroll behavior.
- Separate coverage correction: exactly one baseline/candidate pair with one existing completed reply before the measured second turn. Both moved the transcript across 894 px during the wheel phase. Do not pool these two samples with the original six as equivalent repeats.
- Both batch heavy slots were held during capture; machine-external work was not controlled. One-minute load at sample starts ranged 10.33–65.48. Two slots do not establish an idle machine.

[Raw identity/analysis](raw/analysis.json), [fixed workload and hashes](raw/workload.json), [provider/model provenance](provenance.json). All 8 samples retained; all replies matched the fixed response byte for byte, drafts matched, final agent state was idle with label 11, browser observed all 12 labels, and no pageerror was captured. The browser received 14 agent upserts in first-reply samples and 15 in history samples, with one serialized feature value, `[]`. These counts validate inputs; they are not UX-benefit evidence.

## Results

All times below are milliseconds.

| Sample              | Key EventTiming p95 | Keydown-to-rAF p95 | RAF-gap p95 | RAF gaps>50ms | Long tasks | Effective wheel scroll |
| ------------------- | ------------------: | -----------------: | ----------: | ------------: | ---------: | ---------------------- |
| baseline-1          |                  32 |               12.9 |        17.5 |             3 |          2 | no                     |
| baseline-2          |                  40 |               15.9 |        17.6 |             6 |          2 | no                     |
| candidate-1         |                  40 |               16.2 |        17.5 |             2 |          2 | no                     |
| candidate-2         |                  24 |               16.7 |        17.5 |             2 |          1 | no                     |
| baseline-control-1  |                  16 |                9.4 |        17.5 |             1 |          1 | no                     |
| baseline-control-2  |                  32 |               12.2 |        17.4 |             1 |          1 | no                     |
| baseline-history-1  |                  40 |               16.3 |        17.5 |             0 |          0 | yes                    |
| candidate-history-1 |                  16 |               14.5 |        17.5 |             1 |          0 | yes                    |

Chromium EventTiming durations are quantized. The observer used durationThreshold 16; shorter entries are censored. Every sample's p95 rank falls within the observed entries; see raw observed/missing counts in analysis.json. This is a laboratory event-duration observation, not a field INP. Keydown-to-rAF measures a rendering opportunity, not actual presentation latency. RAF gaps and long tasks cover the whole stream; they do not prove which component caused a stall. Raw CDP trace is the primary timing record.

Candidate does not consistently improve event duration, input responsiveness, or frame cadence. The first baseline p95 key-to-rAF ranged 12.9–15.9 ms; candidate 16.2–16.7 ms; returning to baseline yielded 9.4–12.2 ms. This A/A variation and uncontrolled external load prevent attributing differences to the patch. The single history pair has no repeated-pair noise bound; lower candidate EventTiming alone is not proof of benefit. No label-correlated visible typing/scrolling/streaming harm was established. No CPU, energy, native, packaged Electron, production bundle, real-provider, or third-party-plugin acceptance is claimed.

## Raw artifacts

Gunzip a trace and open the resulting JSON in Chrome DevTools Performance. The tracing categories include devtools.timeline, blink.user_timing, latencyInfo and frame events. Video overhead is present equally in both variants.

- baseline-1: [trace](raw/baseline-1-trace.json.gz), [recording](raw/videos/74fbe51668b332eec461ef5f2b4de2f2.webm), [raw timings and transcript](raw/baseline-1.json), [wire frames](raw/baseline-1-wire.json.gz), [screenshot](raw/baseline-1.png).
- baseline-2: [trace](raw/baseline-2-trace.json.gz), [recording](raw/videos/a7a8381db1aa2076b2f2e93098d8916e.webm), [raw timings and transcript](raw/baseline-2.json), [wire frames](raw/baseline-2-wire.json.gz), [screenshot](raw/baseline-2.png).
- candidate-1: [trace](raw/candidate-1-trace.json.gz), [recording](raw/videos/fe5b1a74f9769039e164c7ca18d7c346.webm), [raw timings and transcript](raw/candidate-1.json), [wire frames](raw/candidate-1-wire.json.gz), [screenshot](raw/candidate-1.png).
- candidate-2: [trace](raw/candidate-2-trace.json.gz), [recording](raw/videos/4964444d72146b2b1a7d63c03d56a3d7.webm), [raw timings and transcript](raw/candidate-2.json), [wire frames](raw/candidate-2-wire.json.gz), [screenshot](raw/candidate-2.png).
- baseline-control-1: [trace](raw/baseline-control-1-trace.json.gz), [recording](raw/videos/0c3fd3afcee147769f8151d67ea2e4ec.webm), [raw timings and transcript](raw/baseline-control-1.json), [wire frames](raw/baseline-control-1-wire.json.gz), [screenshot](raw/baseline-control-1.png).
- baseline-control-2: [trace](raw/baseline-control-2-trace.json.gz), [recording](raw/videos/230abce0d977844ed0cabbc3775dac6c.webm), [raw timings and transcript](raw/baseline-control-2.json), [wire frames](raw/baseline-control-2-wire.json.gz), [screenshot](raw/baseline-control-2.png).
- baseline-history-1: [trace](raw/history/baseline-history-1-trace.json.gz), [recording](raw/history/videos/15d81406641988247822db4c8025782a.webm), [raw timings and transcript](raw/history/baseline-history-1.json), [wire frames](raw/history/baseline-history-1-wire.json.gz), [screenshot](raw/history/baseline-history-1.png).
- candidate-history-1: [trace](raw/history/candidate-history-1-trace.json.gz), [recording](raw/history/videos/96aed2deb26291dbb38e769e278d48e8.webm), [raw timings and transcript](raw/history/candidate-history-1.json), [wire frames](raw/history/candidate-history-1-wire.json.gz), [screenshot](raw/history/candidate-history-1.png).

Existing development DOM-prop warnings are retained in capture.log. They were not treated as pageerror. Setup failures before the first completed sample are retained in the named failure logs: ESM/CJS import, relative tsconfig inherited by daemon, and tsx function-name helper in page.evaluate. The latter was resolved by passing the probe as an untranspiled browser script. No completed timing sample was discarded.

## Reproduction and evidence limits

The actual executed capture and analysis scripts are archived as raw text attachments, not added as maintained repository source. Their initial source-lint attempt reported explicit-any, nesting, shadowing and two analysis-style errors; [the full failure log](artifact-source-lint-initial.log) is retained. No lint suppressions or product changes were added to make the archive pass. Copy these text attachments into the original .dev layout to reproduce.

The scripts use repository E2E helpers, isolated ephemeral ports and private PASEO_HOME, block connections to 6767, and tear down their own browser/daemon/Metro. They temporarily replace only the agent-store source file and restore its exact original bytes in finally. Run in an isolated clean checkout of the candidate; stop other heavy work first. Install dependencies and run the normal owning package builds. Copy this evidence directory into that checkout if necessary.

```sh
# Run from repository root. Copy the exact archived scripts into their original layout.
mkdir -p .dev/perf-impact
cp docs/qa-evidence/pr7774-perf-impact-20261024/capture-script.cts.txt .dev/perf-impact/measure.cts
cp docs/qa-evidence/pr7774-perf-impact-20261024/capture-history-script.cts.txt .dev/perf-impact/measure-history.cts
cp docs/qa-evidence/pr7774-perf-impact-20261024/analysis-script.cjs.txt .dev/perf-impact/analyze.cjs
# Global TSX config must be absolute for daemon child cwd.
TSX_TSCONFIG_PATH="$PWD/packages/app/tsconfig.json" node --import tsx .dev/perf-impact/measure.cts
PERF_GROUPS=baseline-history,candidate-history PERF_REPEATS=1 TSX_TSCONFIG_PATH="$PWD/packages/app/tsconfig.json" node --import tsx .dev/perf-impact/measure-history.cts
```

Output goes to .dev/perf-impact/evidence. Run node .dev/perf-impact/analyze.cjs after capture. Capture logs and raw environment snapshots retain actual commands, timestamps, source hashes and server/browser identities. No main merge, feature-branch push, production daemon restart, remote-device use, or new application dependency was performed.

[Artifact SHA-256 manifest](SHA256SUMS) covers the published raw files.
