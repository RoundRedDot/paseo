# PR #7927

**Standalone validation blocked before rewind.** Two independent-peer cases failed at initial attachment/history projection: the sender had attachment metadata, while the fresh peer did not. Rewind/resend was not reached and is not accepted. The exact source head is `5e42683e889e96740413a07518c729aafdb0dd19`; source was unchanged. The test did not combine #6736.

The selected peer-before-cleanup screenshots contain synthetic fixture messages and no personal/provider conversation. Raw Playwright ZIP traces, videos, browser-console dumps, and event JSON carrying URL/response fields are excluded.

## Exact-head CI snapshot

- CheckSuite `CS_kwDOQBkEf88AAAAZbsugjg`: `action_required`; run [40304398510](https://github.com/getpaseo/paseo/actions/runs/40304398510); jobs 0; check-runs 0.

## Selected synthetic screenshots

- [File-only peer before cleanup](./screenshots/file-only-peer-before-cleanup.png)
- [Image-and-file peer before cleanup](./screenshots/image-file-peer-before-cleanup.png)

This is a precondition failure, not accepted rewind/resend evidence.
