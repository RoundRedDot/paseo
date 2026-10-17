# Pi image restore QA evidence

Candidate: 516f41b4fc4e7b1ffa49fac1229756b7d72c86c8. Runtime exercised the exact file hashes in manifest.json before commit; final audit confirmed those files are unchanged in the clean commit.

Real installed Pi 1.3.0, configured google-cloud/gemini-3.8-flash, Chromium 145.0.7632.6. Two new inference prompts, four total across old/new QA. Native legacy replay made no additional inference. 29/29 candidate checks passed.

Screenshots include live previews/lightboxes, browser reload, provider history reload and daemon disk restart. *-browser-replica.json and the runtime log prove current canonical epoch with Updating messages absent. The old failed transcript is included separately; it must not be described as candidate output.

Only synthetic own-session images and messages are included. See manifest.json for transformations and hashes. Original raw files remain outside this public subset. No private home, credentials, user sessions, extension source, device evidence or uploaded assets are included. OMP and native devices remain NOT_VERIFIED/NOTRUN. Reviewed for publication by the parent agent.

Final PR head: `bd3bbb45f612df5fcdd02f5355d545d13341ade0`. Its fixture-only follow-up replaces assertions with a compiler-checked fixture; production blobs are identical to candidate `516f41b`. Both affected Pi files pass 135 tests, with format/typecheck/lint and complete serial hooks. No runtime QA or inference was repeated for that follow-up. The original candidate passed 345 tests across all three affected files. Counts overlap and must not be added.
