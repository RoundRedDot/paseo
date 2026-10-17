# Original tool-row spacing report

This is the original screenshot supplied by the reporter on **2026-10-12 08:45:38 UTC** (16:45 UTC+8). The red outline is already present in the source image; this export adds no annotation or image transformation. It shows the gap between `/tmp/pd-current-drawer.png` and `/tmp/pd-golden-drawer.png` tool rows. At **09:00:32 UTC** the reporter explicitly confirmed that the gap appeared only during output, rather than remaining after the turn completed.

The archived investigation identified both rows as native `Read` output. It was performed in a macOS Paseo desktop context; the crop alone does not prove which client captured it. The original report does not establish the exact installed app/plugin revision or Release/Dev build mode. No Release screen recording was recovered. This is original symptom evidence, not a newly reproduced or Release-qualified test.

Plugin source boundary: Better Paseo commit `4566335df495589682b1845a13de06b3ab91e531` adds a first-arrival cache; its parent is `2b0e12e4d06441d69e10b2aaf82f91994b69dc92`. That parent is a reproducible source boundary, not proof of the installed revision at report time. The later passing native-Read QA uses `2fc6476`, already containing that cache, and therefore cannot substitute for a failing baseline recording.

See manifest.json for the recovered PNG hash and provenance. The requested Release recording in getpaseo/paseo#7196 remains missing.
