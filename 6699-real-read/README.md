# PR #6699 real native Read acceptance

Candidate: `13a3cd7279a3fa499f6bf9755b32826c0e981ea8`. Isolated macOS host + Chromium app + real Claude provider (`claude-opus-5-5`) + copied Better Paseo plugin source `2fc6476acbdf75e8802668b0260cfd128513c990`.

Two native `Read` calls start in the same batch in each run. Self-owned PreToolUse gates control A→B / B→A completion; hooks do not alter inputs, outputs or provider events. Host details confirm `name=Read`, `detail.type=read`. At the first result, row identity/timestamp/top/height/spacing remain stable; result/status updates arrive. Both runs retain a 4px measured gap and -12px/0px margins at that intermediate stage. After a later assistant row appears, the former last row's margin may legitimately change.

The six screenshots, recording and synthetic result/event snapshots show both orders. `plugin-observation.patch` adds only DOM observation fields to a temporary copy; source plugin was not modified or deployed. No temporary home/config/keypair/credentials are included.

This plugin already caches first-arrival timestamps and may mask the baseline bug. The recording proves candidate integration stability, not baseline failure or a causal speedup; the PR's earlier reducer red test supplies separate regression evidence. No native iOS/Android or packaged Electron acceptance. An earlier MCP Read attempt is excluded because it used unknown tool mapping and is not native Read acceptance.
