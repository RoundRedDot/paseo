# Final #6699 head: packaged UI integration

Fixed source **2947e07d1209447d9b023302ed610efc81ae1aa8**. Both completion orders: **4→4→4→4 CSS px**,96 samples pass. Arrival/identity/order/latest survive actual renderer-cache reload; completed host footer shows9s for9440/9450ms lifecycle boundaries. [Full report and retained failures](full-report.md), [scope](README.md), [A→B uncut compositor recording](case-A-B/release-uncut.mp4), [B→A recording](case-B-A/release-uncut.mp4).

Local macOSarm64 production package0.12.0-beta.1/Electron44.2.0, ad-hoc and hardenedRuntime=false, Chromium sandbox enabled. Synthetic SDK replay/zero real vendor-model requests. Earlier official0.11.4 baseline differs in version/distribution form; this establishes final-head integration in the same scenario, not sole attribution of every visual difference or official signed/notarized distribution acceptance. Historical plugin source unchanged; temporary normal settings expose the host footer, then restore default settings.

Original SHA256SUMS covers unchanged worker allowlist; publication-manifest.json additionally covers this index and the reviewed full report. No homes,credentials,package binaries or complete user logs. No product edits/ready change.
