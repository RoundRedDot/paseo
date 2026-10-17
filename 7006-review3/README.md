# PR #7006 opening-prefix sampling repair

Source `41888466dc8108541293c723db0565922a9baaee`, based on `a1953dcb5428b9658f382da90f8eeaff6b3cc302`. Only the existing browser spec changed. Production reveal and its51 unit tests are unchanged; those units were not rerun.

Every frame is still collected, and both exact pause/geometry checks remain. Partial fence detection reads rendered code blocks rather than the whole message, so intentional opening-prefix prose is excluded. Two deterministic fixtures use the real Markdown renderer: prose with visible single/double backticks must produce no code detections; a completed code block with those literal lines must produce both detections. These validate sampler scope without claiming legal code should be hidden.

Original scanner + new regression:1 failed/3 passed. Repaired scanner:4 passed, workers1/retries0. Format, full workspace typecheck, lint and complete serial hooks pass. Logs and synthetic frame attachments are preserved. Real providers/native devices/packaged Electron were not exercised; local success is not upstream CI approval.
