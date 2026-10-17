# PR #7186 isolated native Release follow-up

Result: partial. Exact candidate: 85f7d56ea79f8b7c22538a2b763875f4ce2d74ad.

Round 1 preserved the previous Release binary and exposed a new QA proxy Host/Origin failure. Round 2 preserved the original Host, completed a real native mobile hello/server_info/heartbeat and workspace script RPC exchange, but sent no directory fetch and remained on Loading workspace. SQLite readback contained only a 26-byte checkpoint row. No stream, assistant byte readback, offline reload, baseline, physical-device reproduction, or performance improvement is claimed.

- `round-1/`, `round-2/`: actual simulator screenshots/video, sanitized WS message ledgers, synthetic IDs/results. Control CLI frames are explicitly separate from native frames.
- `network-control/result.json`: Node direct-upgrade controls separating IPv4-only listeners from the proxy Host/Origin problem. These controls are not native runtime acceptance.
- `original-ipv6-ipv4-excerpt.log`: earlier native log excerpt showing IPv6 refusal followed by IPv4 readiness within 11 ms.
- `build/`: exact provenance and temporary observation/resolver/proxy diffs. Eight console probes are compiled but their output was not captured; memory gate/generation values are not claimed as measured.
- `native-host.mjs`, `runtime.zsh`, `network-contrast.mjs`, `permissions.yaml`: reproducible synthetic QA harness. No application protocol payload rewriting.
- `cleanup.json`: only owned resource IDs plus aggregate preservation of existing simulator states. Full inventory is private.
- `manifest.json`: recursive byte lengths and SHA256, excluding itself.

The complete Chinese report is one directory above this public subset. Full app/build/unified logs, app binaries, SQLite databases, session homes, credentials, and existing user device inventories are excluded. All media came from fresh owned simulators with synthetic state. The displayed host label is the local test host's machine name; no user conversations or projects were loaded. Parent reviews and publishes; no upload was performed.
