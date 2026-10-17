# PR #7186 application runtime smoke

Candidate `85f7d56ea79f8b7c22538a2b763875f4ce2d74ad`. Isolated host, actual Chromium app/WebSocket/IndexedDB, existing mock-load-test provider (not a real provider). 32 streaming samples, final row 20,877 code units / 50,877 UTF-8 bytes with CJK, emoji and QA7186-END, successful JSON decode and reload retention. No runtime errors.

This covers real application storage I/O/UI across an encoding chunk boundary. It does not establish eviction byte-budget edges, baseline application failure, native Hermes performance, Release/device symptoms or speedup. Earlier harness failures are retained locally; this is successful attempt 3. Native Release acceptance is tracked separately and the PR remains Draft.
