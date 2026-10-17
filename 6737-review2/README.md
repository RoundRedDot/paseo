# PR #6737 review repair

Source `237a5d4c6bcdb5a30a9be3cf8d5e564a562222d8`, based on `cb5c6daa9af62ca6e718b29221d9c626e750743e`.

- Revision-zero scopes initialize only from the first explicit dragged pane/host sequence; CAS losers replay precise moves on the winning record.
- Reconnect waits for this connection's authoritative membership, cancels impossible moved/anchor items with feedback and retains valid moves. Cache hydration is not membership authority.
- Actual server-advertised workspace.manage gates inventory/gesture writes; readonly observation remains active without false failure notifications.

62 distinct targeted tests pass: replica14 + controller10 + directory31 + real daemon6 + selected Session1. Both existing browser cases passed with workers1/retries0; after extracting private request preparation, the affected replica/controller/daemon and cross-device browser case were rerun green. Browser logs represent 2 unique cases, not 3. Screenshots came from this repair's browser runs. Full format/typecheck/lint and complete serial hooks pass.

Real isolated daemon/WebSocket/CAS/disk and Chromium desktop+compact integration were exercised; app unit ports remain fixtures. No native iOS/Android, packaged Electron, Windows/Linux or live model provider acceptance. Offline operations are retained in the running client, not a durable outbox across process termination. Complete file/browser synchronization and principal/clientId preference lifecycle remain unchanged; clientId is not a credential.
