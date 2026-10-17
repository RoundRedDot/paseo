# #7196 Release transient-gap reproduction

Unmodified signed macOS0.11.4 Release + isolated0.11.4 host + historical plugin58672b7. **Synthetic SDK lifecycle replay**, not real vendor/model execution. Gap measured in CSS px across both-running/first-complete/both-complete/next-item:

- A→B: **4→16→4→4**. [Uncut compositor recording](7196-run-20261017-05/A-B-release-uncut.mp4).
- B→A: **4→4→16→4**. [Uncut compositor recording](7196-run-20261017-05/B-A-release-uncut.mp4).

[Full report including all prior failures, exact hashes, recording method and limits](report.md). [Measurements, canonical events, source hashes and public manifest](7196-run-20261017-05/README.md). Earlier sandbox/NetLog/harness failures remain in separate directories. A recording includes a normal synthetic-workspace tooltip with local machine name; it is retained uncut. No user conversations/credentials are included. This does not establish the exact client build of the original October12 screenshot or validate the repaired candidate on every platform.
