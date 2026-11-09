# Tablet interaction performance

Wide-layout Android tablets do three things often: resize the navigation sidebar, switch workspace tabs, and open a plugin screen such as the task board. All three run on the JS thread the app shares with the plugin bundles, and all three were measured as visibly laggy on the Oppo tablet. This doc holds the measured budget, the causes each measurement points at, what was fixed against it, and the commands that reproduce a capture so the next change is compared against the baseline instead of against memory.

Read [mobile-panels.md](mobile-panels.md) for the retained-panel contract and [agent-stream-performance.md](agent-stream-performance.md) for why background chats keep rendering. Neither doc owns this budget.

## The device

Baseline captured 2026-11-08 on the tablet that reports the lag:

| Property     | Value                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Model        | OPPO OPD2501, Android 16 (SDK 36), Mali GPU                                                                                         |
| Screen       | 2800×1980 px at density 360 → 1244×880 dp landscape                                                                                 |
| Refresh      | Panel supports 120 Hz and `peak_refresh_rate=120`. Until `paseo-frame-rate`, ColorOS capped Paseo's render rate at 60 Hz; see below |
| Build        | `sh.paseo.fold`, versionName 0.15.3, `flags=0x0` — a release build, not a dev bundle                                                |
| Frame budget | 16.7 ms at 60 Hz for the baseline and fix captures; 8.3 ms during interaction since `paseo-frame-rate`                              |

Every baseline number below was captured under the 60 Hz cap. A frame that costs 17 ms already misses, and at 17 ms median the app has no headroom for an interaction on top of whatever is already painting.

### The panel's refresh rate

ColorOS picks each window's refresh rate in its own service, `oplusscreenmode`, from a per-package
table (`Current Version:20251211` on this pad). A package missing from the table gets
`RateData{}` and a 60 Hz `PRIORITY_WINDOW_REQUEST`, which reaches DisplayModeDirector as an
app-request render range of `[0, 60]`. SurfaceFlinger cannot exceed that range, so touch boost stops
at 60 Hz as well. System Settings is in the table (`PreferredRefreshRateData{[3, 2, 2, 3]}`) and
gets 120. A handful of CTS packages are listed under `mOriginalPolicyPackages` and get the AOSP
policy instead. `dumpsys oplusscreenmode` prints the decision and the window it was made for; the raw dumps
are `qa-evidence/tablet-perf/refr-policy-before.txt` and `refr-policy-after.txt`.

Paseo is not in the table, so it ran at 60 Hz. The phone (`PHN110`) gave it 90 Hz before this
change; its table has not been read.

What the policy reads, measured during a 2 s scroll of the sidebar list:

| Request                                                               | SurfaceFlinger render rate | Frame gap p50 | 8.3 ms gaps          |
| --------------------------------------------------------------------- | -------------------------- | ------------- | -------------------- |
| None                                                                  | 60 Hz                      | 16.7 ms       | 0 of 119, 0 of 119   |
| `View.setRequestedFrameRate(120)` on the decor view                   | 60 Hz                      | —             | —                    |
| `SurfaceControl.Transaction.setFrameRate(120)` on a 1×1 `SurfaceView` | 60 Hz                      | —             | —                    |
| Same, applied with `rootSurfaceControl.applyTransactionOnDraw`        | 60 Hz                      | —             | —                    |
| Same, on a child `SurfaceControl` reparented under the window root    | 60 Hz                      | —             | —                    |
| `WindowManager.LayoutParams.preferredDisplayModeId` = the 120 Hz mode | 120 Hz                     | 8.3 ms        | 86 of 118, 84 of 117 |
| `WindowManager.LayoutParams.preferredRefreshRate = 120`               | 120 Hz                     | 8.3 ms        | 90 of 119, 82 of 117 |

Those counts are whole files and every touch file still has a 16.7 ms p90: roughly a quarter of the
frames during a scroll keep the idle cadence while the panel is changing rate. "120 Hz" in that
column means the panel is at its peak for most of the gesture, not for all of it. The rows without a
gap were not scrolled: the render range already read `[0, 60]`, which is the ceiling touch boost
works under. The layer votes do reach SurfaceFlinger — the layer reports
`requestedFrameRate: {120.00 Hz ...}` — and are clipped by the 60 Hz range above. The two window attributes are what the policy reads: its
log records `revised to win request:3` for the Paseo window and the range opens to `[0, 120]`.
`preferredMinDisplayRefreshRate`/`preferredMaxDisplayRefreshRate` are not reachable from an app on
SDK 36.

`modules/paseo-frame-rate` sets `preferredRefreshRate` to the display's highest mode when the
activity enters the foreground. It uses `preferredRefreshRate` rather than `preferredDisplayModeId`
because a mode id is an `Exact` vote on the window's layer, which stock Android treats as a pinned
mode, while a refresh rate is a `Default` vote that lets the rate fall when nothing draws. Either way it is a ceiling, not a floor: on a static screen SurfaceFlinger still
drops to 60 Hz, the same as it does for System Settings, and the 120 Hz mode comes back on touch.

Two readings that look wrong and are not:

- `dumpsys display` `mActiveSfDisplayMode` can say 120 Hz while SurfaceFlinger renders at 60. Read
  `renderRate` under `Pacesetter Display` in `dumpsys SurfaceFlinger`.
- An idle capture reports a 16.7 ms gap with or without the request, because nothing touched the
  screen. Compare refresh rates on frames captured during a gesture (see "Reproducing a capture").

## Baseline

Each capture is a scenario: a fixed list of `input` actions plus a settle window over a freshly reset `gfxinfo`. `docs/qa-evidence/tablet-perf/` holds the raw JSON for each label.

| Scenario                        | Runs | Latency p50 / p90 / p99 / max, ms               | >32 ms | UI queue max  | Cores     | `mqt_v_js` | UI thread  |
| ------------------------------- | ---- | ----------------------------------------------- | ------ | ------------- | --------- | ---------- | ---------- |
| Untouched chat                  | 1    | 17.9 / 18.8 / 19.5 / 19.7                       | 0      | 0             | 0.69      | 2.4%       | 1.8%       |
| Untouched task board            | 1    | 17.1 / 18.4 / 26.9 / 27.6                       | 0      | 3.8 ms        | 0.78      | 5.6%       | 2.5%       |
| Open the board from the sidebar | 1    | 25.3 / 33.2 / 162.3 / 190.6                     | 12     | 160.7 ms      | 1.06      | 34.7%      | 14.8%      |
| Three tab switches              | 3    | 19.1–19.8 / 22.3–38.3 / 23.6–284.1 / 73.4–383.5 | 1–22   | 53.3–315.9 ms | 0.91–1.46 | 18.3–51.7% | 3.8–16.9%  |
| One 1.4 s, 160 px sidebar drag  | 5    | 18.1–23.2 / 24.6–31.3 / 35.4–524.2 / 38.8–524.7 | 2–9    | 14.5–496.8 ms | 1.33–1.62 | 18.9–54.7% | 28.3–39.6% |

Untouched content holds a clean 16.7 ms cadence. Every interaction breaks it, and every interaction
has a long tail: half the drag frames land between 18 and 23 ms against a 16.7 ms slot, and the
worst frame in a 1.4 s drag ran to 38–525 ms across runs. Opening the board produced the single
worst frame in the set (190.6 ms) with the plugin chunk already compiled.

The spread between runs is real, not measurement noise: the same drag costs 19% JS on one run and
55% on the next, because the reflow's cost depends on what is mounted (chat rows, terminal grid,
board lanes) when the gesture starts. Compare medians of several runs, never one.

Three columns carry the diagnosis:

- **UI queue** is `performTraversalsStart - intendedVsync`: how long the UI thread was unavailable before it could even start the frame. A large value means the frame was blocked, not expensive to draw.
- **Record** (`drawStart - performTraversalsStart`) stayed at 0.0–0.1 ms in every scenario, so the
  frame time goes into committing and measuring before any drawing starts.
- **Cores** is the sum of per-thread CPU over the capture window. The idle row shows what the app costs while the user is doing nothing, which is the budget an interaction has to share.

## What each capture says

### Sidebar drag reflows the whole surface

`DesktopSidebar` in `components/left-sidebar.tsx` animated `width` — a layout property — on the sidebar's `Animated.View`. The sidebar is a flex-row sibling of the workspace (`app/_layout.tsx`, `rowStyle`), so every frame re-lays out the sidebar _and_ the content column: the workspace list, the chat, the terminal grid, the plugin surface. The workspace list is not virtualized in any useful sense — `components/sidebar-workspace-list.tsx:2553` nests three `scrollEnabled={false}` lists inside one `ScrollView`, so a width change re-measures every rendered row.

That reflow is what the JS thread paid for: three measurement handlers inside the resized tree wrote state on every layout pass.

- The footer measured its icon line with `onLayout` → `setState`, then re-resolved which slots were visible.
- `components/message.tsx` (`AssistantMessage`): every rendered assistant message wrote its measured height on `onLayout`.
- `agent-stream/strategy-native.tsx:594`: the chat list settles its viewport on `onLayout`.

[INFERENCE] The per-frame JS in the drag capture is these handlers, not the gesture itself: the gesture runs on the UI thread and commits the new width only on release.

`explorer-sidebar/geometry.tsx:64` already contains the escape hatch for the same problem: in overlay mode it animates the panel against `containerWidth` instead of animating the panel's own width, so nothing below it reflows.

### A tab switch blocks the UI thread

Switching tabs rewrites the workspace layout (`focusTabInLayout` in `stores/workspace-layout-actions.ts`), which re-derives every tab descriptor (`workspace-screen.tsx:1313`, `:1393`) and re-renders the whole workspace screen and tab rail. The rail itself changes shape on every switch: the active tab is forced to 240 dp while the rest sit at the 64 dp minimum (`workspace-tab-layout.ts`), so every chip's width changes and each newly visible label re-measures (`workspace-desktop-tabs-row.tsx:1198`). The tablet patch also called `scrollTo` from `onContentSizeChange`, which fires during any content resize, including a sidebar drag.

Only the active tab plus two recent tabs stay mounted (`workspace-panel-host.tsx:114`, `workspace-screen.tsx:3018`), and hiding is a `display: none` flip on a live subtree (`retained-panel.tsx:37-60`). Native chat content is deliberately never suspended (`retained-chat-content.native.tsx:1-10`), so a switch re-lays out the newly visible chat while the hidden one keeps receiving stream updates.

### The task board is the app's JS thread

Plugin surfaces are not WebViews: the bundle is executed with `eval` (`plugins/evaluate.ts:534`) and the board's own chunk is compiled with `new Function` (better-paseo `client/tasks/chunk/remote-chunk.ts:63`). Opening the board in the baseline capture blocked the UI thread for 160 ms.

The board also does its own per-layout state writes — every card label and stat measures itself on `onLayout` (better-paseo `client/tasks/board/board-parts.tsx:46`, `details-sidebar.tsx:135-152`, `:260`, `:371`) — so a sidebar drag re-renders the board on every frame it is visible. Opening it cold re-reads everything over about a dozen subscribed RPCs, and the board's 1 s clock keeps ticking while the screen is open. A covered plugin screen is not frozen: nothing in `packages/app/src` sets `freezeOnBlur`, so the board keeps running behind another route.

## Fixes

Landed against the baseline above. Measured effect is in "After the first three fixes" below: these
remove work that scales with content, and they do not change the drag's headline cost.

1. **Footer capacity instead of per-frame width.** `sidebar-footer-overflow.ts` resolves how many
   finger-sized places fit and the footer keeps that capacity in state, so a resize that moves the
   line inside one bucket no longer re-renders the footer or re-resolves the slot list. Compare
   `baseline-drag-*` `mqt_v_js` (18.9–54.7%).
2. **Assistant messages no longer hash on native.** `components/message.tsx` wrote every rendered
   message's measured height into a cache keyed by a hash of the whole markdown on each layout pass.
   Only the web virtualization strategy reads that cache, so native skips the write.
3. **A failed plugin surface retries once.** See "Plugin surfaces" below.

## After the first three fixes

Captured on the same device, same scenarios, same build variant, after rebuilding the same tree.

| Scenario                        | Runs | Latency p50 / p90 / p99 / max, ms               | >32 ms | UI queue max  | Cores     | `mqt_v_js` | UI thread  |
| ------------------------------- | ---- | ----------------------------------------------- | ------ | ------------- | --------- | ---------- | ---------- |
| Untouched chat                  | 1    | 19.9 / 22.3 / 23.4 / 23.9                       | 0      | 3.4 ms        | 0.85      | 11.6%      | 5.2%       |
| Untouched task board            | 1    | 23.2 / 24.3 / 25.9 / 26.7                       | 0      | 3.2 ms        | 0.88      | 7.8%       | 2.6%       |
| Open the board from the sidebar | 1    | 23.3 / 27.8 / 184.0 / 184.5                     | 8      | 147.4 ms      | 1.36      | 58.1%      | 12.7%      |
| One 1.4 s, 160 px sidebar drag  | 5    | 21.7–22.5 / 23.8–24.5 / 30.2–263.2 / 55.6–275.3 | 1–4    | 26.8–234.9 ms | 1.59–1.84 | 41.9–57.7% | 33.3–37.0% |

Read against the baseline, the three fixes did not move the drag: `mqt_v_js` still runs 42–58% and
the UI thread still runs 33–37% of a core, because both are dominated by the per-frame relayout of
the live content column rather than by the handlers those fixes removed. The board-open capture is
likewise unchanged, since its cost is the plugin's own mount, not the rail. What the three fixes
removed is work that scales with content (a full markdown hash per message per frame, a re-render of
the footer per frame, a scroll command per frame), so the numbers hold instead of growing with the
chat length; see `after-*.json` next to the baseline files.

Two caveats on this comparison:

- The tab-switch captures are not comparable: the tab set changed between the two runs (seven agent
  tabs became five as agents were reconciled away), and the rail hands spare width to the remaining
  tabs, so the same tap coordinates no longer describe the same rail.
- Idle captures move with stream activity. The after-run happened to have a chat receiving output,
  which is why its `mqt_v_js` is higher than the baseline idle row and not a regression.

## Dragging a divider

A divider drag is where the divider either keeps up with the finger or does not, and two attempts
were needed.

First the content column was frozen at the gesture's starting width while the sidebar over it kept
animating its own width. That removed the chat, terminal and plugin reflow and the medians moved
(p50 23.0 → 17.8 ms, one tenth of a core), but the sidebar's own subtree was still laid out every
frame, so the edge still trailed the finger and the UI thread still ran at 27–36% of a core during
the gesture.

The drag now moves a 2 px preview line and commits the width on release (`sidebar-resize-preview.ts`,
`components/sidebar-resize-preview.tsx`). Nothing is laid out while the finger is down: the line is a
transform on the UI thread, the sidebar keeps its committed width, and the single reflow happens when
the gesture ends. The commit takes the width at the lift position rather than the last published
frame, so the panel lands where the line was, not a frame behind it. A cancelled gesture commits
nothing, and pointer layouts keep the live width animation: their reflow is CSS, and none of the
measurements here come from them.

Five runs per cohort (`overlay-drag-*` for the frozen content column), values in run order. The cohorts are not strictly comparable: these captures
predate the harness recording the sidebar width a run started from, so one cohort may have begun
wider than the next, and the JS share moves with whatever chat or board is streaming while it runs.
New captures carry `scenario.sidebarWidthBefore` and `sidebarWidthAfter`; compare runs only when
both match.

| Drag cohort                   | p50 ms, by run                     | >32 ms, by run    | UI thread  | `mqt_v_js` |
| ----------------------------- | ---------------------------------- | ----------------- | ---------- | ---------- |
| Live reflow (baseline)        | 23.1 / 23.2 / 23.0 / 18.1 / 18.1   | 5 / 2 / 2 / 8 / 9 | 28.3–39.6% | 18.9–54.7% |
| Content frozen, sidebar live  | 17.8 / 17.8 / 17.6 / 16.9 / 18.2   | 1 / 2 / 1 / 4 / 2 | 27.1–36.3% | 11.4–39.1% |
| Preview line, nothing reflows | 14.4 / 14.1 / 13.9 / 14.2 (4 runs) | 0 / 1 / 0 / 1     | 7.6–12.0%  | 5.5–13.5%  |

The preview-line cohort holds a 14 ms median and one frame past 32 ms in its worse runs, with a
single 216 ms frame in one of them. The claim is the median, not a clean sheet.

The tradeoff is visible: the corner of the divider follows the finger instead of the panel edge. A
drag that has nothing to lay out is the only kind that kept up at 60 Hz. With the refresh-rate
request above, the same drag runs at an 8.3 ms gap (p99 8.4 ms, latency max 12.1 ms) in
`refr-drag-after-1.json` and `refr-drag-after-2.json`.

The plugin's own divider is not covered by this yet. `client/tasks/board/desktop-board.tsx` renders
the details sidebar with a live width and, for the inline column, re-derives the board layout on
every move, so dragging it re-lays out five lanes of cards each frame. A patch with the same shape —
preview line on touch, live width on pointer platforms — is committed on
`fix/tablet-divider-preview` in the plugin repository and has not been measured or released.

## Switching workspaces

A workspace switch is a different path from a tab switch and used to be worse: the deck kept exactly
one workspace mounted on native, so every switch unmounted the workspace being left — its panels,
terminal, chat scroll — and cold-mounted the next one. Four switches between two workspaces cost an
89.6 ms UI-thread block each and dropped four frames.

The deck now keeps three workspaces warm on a _tablet-sized_ window (shortest side ≥ 800 points)
and one on anything smaller. The breakpoint alone is the wrong gate: a phone in landscape clears
600 dp without a tablet's memory headroom, and upstream had lowered the native limit to one for that
reason (`2a0a0ff65`). Same four-switch scenario, same device:

| Workspace switching       | p99 ms | Max ms | >32 ms | UI queue max | `mqt_v_js` |
| ------------------------- | ------ | ------ | ------ | ------------ | ---------- |
| One retained workspace    | 86.6   | 187.6  | 4      | 89.6 ms      | 60.2%      |
| Three retained workspaces | 15.9   | 17.1   | 0      | 0 ms         | 32.9%      |
| First visit in a session  | 71.3   | 86.3   | 3      | 69.0 ms      | 50.3%      |

What three workspaces cost, measured on one build by comparing a fresh launch (one mounted) against
the same session after visiting two more (three mounted), 15 s of settle each:

| State                    | Total PSS     | Java heap | Native heap |
| ------------------------ | ------------- | --------- | ----------- |
| One workspace mounted    | 669.8 MB      | 44.2 MB   | 346.8 MB    |
| Three workspaces mounted | 834.8 MB      | 49.7 MB   | 464.6 MB    |
| Difference               | **+165.0 MB** | +5.5 MB   | +117.8 MB   |

Both `dumpsys meminfo sh.paseo.fold` outputs are checked in as `mem-pss-a.txt` and `mem-pss-b.txt`;
the CPU windows are `mem-a.json` and `mem-b.json`.

CPU did not separate the two states: the 10 s windows read 0.83 cores / 7.5% JS with one workspace
and 0.81 cores / 4.3% JS with three, because whichever chat is streaming dominates that number and
the streaming chat moved off screen in the second window. RenderThread held 52–54% in both, which is
the app's own continuous repaint rather than retention.

So two extra warm workspaces cost about 165 MB and no measurable idle CPU on this pad. That buys the
switch table above; a phone-sized screen still keeps one.

## Plugin surfaces

A plugin _screen_ that throws is re-rendered once after 120 ms and stays failed if it throws again;
returning to the screen retries once more. Only `PluginSurfaceScreen` passes the delay
(`plugins/surface-screen.tsx`); the boundaries around plugin panels and buttons keep the default of
no retry. The retry must not
re-arm on success: a failure that lands in an effect after the retried commit would otherwise retry
on a timer forever and re-run every plugin subscription each time.

`Plugin failed: Cannot read property 'layout' of null` came from plugin measurement code reading
`event.nativeEvent.layout` outside the handler. React pools Fabric synthetic events and nulls
`nativeEvent` when the dispatch ends, so a read from a `setTimeout`, a `requestAnimationFrame` or a
state updater can see `null`. A boundary cannot catch throws from handlers, so the path that killed
the surface was a deferred read. The fix belongs in the plugin (destructure inside the handler); the
retry is the host's backstop. See [plugins.md](plugins.md).

## Remaining

Ordered by measured cost, not yet implemented.

1. **Keep chip widths stable across a tab switch.** Cache each tab's resolved width, change only the
   outgoing and incoming chips, and measure a label once instead of after every width change.
2. **Measure the retained deck.** Idle CPU and `dumpsys meminfo` with three workspaces mounted, and
   decide whether three is the right number for a tablet.
3. **Gate the plugin screen on panel activity.** The board's 1 s clock, 30 s poll and per-layout
   measurements should stop when the screen is covered, and opening it should paint from a cached
   snapshot instead of waiting for a dozen RPCs. Plugin-side change, in the better-paseo repository.
4. **Confirm the refresh-rate request on the phone.** `paseo-frame-rate` was measured on the pad
   only. The phone gave Paseo 90 Hz before it; check that it now gets the panel's peak during a
   gesture and still drops when the screen is static.
5. **The settings sidebar still animates its width.** `screens/settings-screen.tsx` reuses the same
   live-resize path and was not moved to the preview line.

## Reproducing a capture

`scripts/tablet-perf.mjs` drives the device and writes one JSON per label. Run the same scenario before and after a change; compare the JSON, not the prose.

```bash
# Idle reference
node scripts/tablet-perf.mjs --label idle-chat --settle 2000

# Sidebar drag: one 1.4 s drag of 160 px, starting from a normalized width
node scripts/tablet-perf.mjs --label drag --settle 400 --normalize-handle 539 \
  --drag-handle 160:1400

# Same drag from an explicit start x, when the sidebar edge cannot be read
node scripts/tablet-perf.mjs --label drag --settle 400 --drag-start 505 --drag-handle 160:1400

# Tab switch: tab1 <-> tab6 (coordinates assume 240dp active / 64dp minimum chips)
node scripts/tablet-perf.mjs --label tabswitch --settle 500 \
  --normalize-handle 539 \
  --tap 615,197 --wait 700 --tap 1776,197 --wait 700 --tap 615,197 --wait 700 --tap 1776,197

# Opening the task board from the sidebar
node scripts/tablet-perf.mjs --label open-board --settle 1500 --tap 204,396
```

Limits worth knowing before comparing numbers:

- FrameTimeline keeps the last ~120 frames, so a capture only reports its tail. Repeat short captures instead of lengthening one.
- Per-thread CPU comes from `/proc` jiffies at 1/100 s, so ±1% per row.
- Idle captures are only comparable while the same agents are streaming. A hidden chat keeps rendering by design, so "idle" with four running agents is not the same budget as an empty inbox.
- Tap coordinates encode the current tab widths. If the chip rules change, recalibrate from a UI dump.
- `input swipe` and `input draganddrop` do not drive the sidebar divider the way a finger does: the
  same 100 px gesture can commit 0, 240, or 660 px. `scripts/tablet-perf.mjs` still uses a swipe for
  the drag scenario because the frame cost is what is being compared, but do not trust a
  synthetic drag to set a width, and re-read the committed width before starting another one.
- The script reads `framestats` after the actions and the settle window, so its tail is the frames
  after the finger lifted. To compare refresh rates, read `framestats` while a gesture is still
  running: `dumpsys gfxinfo sh.paseo.fold reset`, start `input swipe 420 1650 420 700 2000` in the
  background, read `dumpsys gfxinfo sh.paseo.fold framestats` 2.3 s later, and alternate the swipe
  direction so the list never sits at its end. The `refr-touch-*.framestats.txt` captures were taken
  this way.
- Sidebar geometry is read from `screencap` pixels, not a UI dump: a dump waits for idle and a live board never reports idle. `--normalize-handle` still converges only to about 12 px, because a pan shorter than the handle's activation offset never starts.
