# #7186 native Release follow-up

**最新 Result：partial（因果对照、native stream与SQLite精确读回通过；offline cold reload未到达）。** Parent追加批准的一次正常菜单runtime已完成；同一Release app冷deep link为Loading，点击真实菜单后首次fetch并提交目标workspace，关闭菜单后聊天可见。实际assistant为50,014 UTF8 bytes，timeline JSON为50,869 bytes，与native收到的458段assistant文本拼接hash一致。后续harness要求末尾标记在当前视口可见而失败；没有点击画面中的正常“跳到底部”按钮，流程提前退出并清理，不能据此认定内容丢失或产品已修。详见文末“新增菜单因果阶段”。

**Baseline drift（parent只读compare提供，未在本worker另行测量）：** upstream main已从`cd77ecd837df40d042599d8847403eb416b35b04`前进6commit到`30799fda19f50febc62349c64460368adc85ff07`，变更为Claude settings/audio/open-project等，相关workspace route/directory demand源码未被这6commit改变。本次验收始终固定`85f7d56ea79f8b7c22538a2b763875f4ce2d74ad`；无merge/rebase，新main不属于已测版本。无baseline性能测量。

以下先保留round1/2的历史结论与失败记录；最新新增阶段独立列在文末，不覆盖原始证据。

**前阶段 Result：partial。** 已把真实 native WS 路径与控制 CLI 分开，复现“在线但 workspace 持续 Loading”。前阶段新增代理的 Host/Origin 故障已独立识别并修正；IPv6-only 失败不能解释原始永久 Loading。第二轮 native 握手、server_info、心跳和 workspace script RPC 均成功，但没有发出任何目录 fetch。此前停止于 parent briefing 的两轮 runtime 边界；该边界不是用户原始限制，parent现已明确扩展一次正常菜单因果 runtime。没有产品修改。

## 来源、权限和时间

- 唯一产品 checkout：`/Users/luopeihuan/workspace/rrd/paseo/.worktrees/native-render-stream-cost`。开始/结束 HEAD **`85f7d56ea79f8b7c22538a2b763875f4ce2d74ad`**，最终 `git status --porcelain` 为空。
- 执行工具 Codex；任务配置 `codex/gpt-6.1-sol` / High / full-access。宿主未暴露可独立核验的实际 model metadata，不能把任务标签当 runtime 模型版本证明。provider 只有 `MockLoadTestAgentClient`，model `e2e-fast-stream`，且没有发送模型消息。
- 备份/资源记录开始 **2026-10-17T06:23:25Z**；最终资源核对 **06:30:11.191Z**。只读源码诊断在此记录前已开始；各次 host/build 起止时间另列。
- 使用 `ios-simulator` skill；读过 checkout CLAUDE、docs/qa.md、expo-router.md、development.md、ad-hoc-daemon-testing.md、mobile-testing.md 及相关流/缓存文档。重点读 HostRuntime、connection probe/endpoint、DirectorySync/replicas、workspace route/gate、sidebar demand、session selectors 和 WS transport；没有泛读所有 Metro/Expo。
- Xcode27.1/27A9275，iOS Simulator18.6，iPhone16Pro，arm64，RN0.81.5、Expo54.0.33、app0.12.0-beta.1、Node24.18.0；真正 Release / Hermes bytecode96。复用已安装依赖、Pods、DerivedData；无安装或版本变更。开始磁盘可用139GiB，48GiB RAM。
- 无 commit/push/GitHub/部署/真实 provider/登录/凭据复制；未访问6767/6768，未操作任何既有设备、simulator 或主 dirty checkout。

## 备份与临时写集

所有新文件在本报告目录。先备份 stage3 app、原始 JS bundle、Metro配置、旧报告和 host/runtime scripts 至 `backup/`；旧公开49项逐项 bytes/SHA256 复核不变，见 `prior-evidence-integrity.json`。没有改写旧公开证据。

复用的旧 snapshot 是 `/tmp/paseo-review-repair-20261017/qa/native-7186`，不是产品 worktree。候选的5,680个 tracked 文件逐项比对，仅以下4个临时文件不同，见 `build/source-provenance.json` 和完整 `build/candidate-to-observed-snapshot.diff`：

| Snapshot 文件 | 临时差异 |
| --- | --- |
| `packages/app/metro.config.cjs` | 保留已获批的 watchFolders + 仅 navigation native/core 的 realpath normalizer；本轮只把日志目标移到新目录 |
| `packages/app/src/runtime/directory-sync/index.ts` | 6个 console 观测点：连接、demand、workspace 开始/提交/失败、session wait；没有更改判断/等待/提交 |
| `packages/app/src/screens/workspace/workspace-route-state.ts` | 仅记录 gate 输入 |
| `packages/app/src/app/h/[serverId]/workspace/[workspaceId]/index.tsx` | 仅记录实际 route IDs、hydration 和 open intent |

没有改变 route、gate、状态、协议、依赖版本或 export 条件。新增观测 build **06:25:43Z→06:26:34Z，exit0**；`build/xcode.log` 是完整原始输出。121次 normalizer 调用全部 `bytesEqual=true`，NavigationContext 仍唯一 ID862；host runtime ID4248、session store ID4118 各一份，见 `build/module-audit.json`。

**前阶段观测局限：** 新 bundle 包含全部8个 `QA7186` console marker，但 `simctl log show` 结果没有采到这些 console 行。不能把这些点的设计当实际内存状态证明，也不能声称直接观测过 clientGeneration/session generation 匹配。前阶段达到parent briefing的两次 runtime边界后停止；后续新增因果阶段由parent明确批准，仍不为日志采集另加runtime。网络 ledger、UI 和 SQLite 行索引是实际读回。

Stage3 与新 build 的 native executable SHA256均 `7a07b73393b1baeca7a1bd892b4435701fe9d5ed0a61fcd6fccd60e3db4d5115`。旧 Hermes bundle `e4231ed3d2b936577adfd568ab2e7b0055ad16e2a3b921043d718214432e9fb1`，观测版 `3149fb3b60d8190ca1d0daeb227a812c7b17cb7f87ab3ffcafd102c8046893b3`；新 bundle 有观测开销，不能用于性能改善归因。

## 网络分支的直接对照

原 stage3 test daemon 仅监听 `127.0.0.1:54883`；app 的 `connectionFromListen` 把 loopback 规范化成 `localhost`，实际目标为 `ws://localhost:54883/ws`。旧 native 日志明确显示 `::1` 在7ms失败，随后 `127.0.0.1` 在11ms进入 ready。摘录 `original-ipv6-ipv4-excerpt.log`，源日志仍是旧 `.../7186-release/runtime-3/app-unified.log`。因此原记录里的 IPv6拒绝是存在的现象，**不是已证实的永久 Loading 原因**。

本轮 `network-contrast.mjs` 在新 synthetic home 创建同一 test daemon，真实 listener `127.0.0.1:55084`，最小 Node WS upgrade 对照：

| Target / headers | 结果 |
| --- | --- |
| `ws://127.0.0.1:55084/ws` | HTTP101，remote127.0.0.1 |
| `ws://[::1]:55084/ws` | ECONNREFUSED |
| `ws://localhost:55084/ws` | HTTP101，此次 Node 选 IPv4；不能冒充 native 行为 |
| upstream target + `Origin: http://localhost:54883`，Host 被替换为 upstream | HTTP403 |
| 同一 target/Origin + 保留 `Host: localhost:54883` | HTTP101 |

原始 `network-control/result.json`、`network-contrast.log`。前后仅 Host 不同，未加 wildcard CORS 或删 Origin。

## 两轮 native runtime

`native-host.mjs` 使用 own test daemon 的 OS ephemeral upstream port，透明 HTTP/WS proxy 监听54883双栈。控制 CLI **直接连接 upstream**；只有 simulator 的连接经过54883。每条 frame 记录 connection、方向、类型、requestId、synthetic IDs、原始 bytes/hash；转发同一 Buffer 和 binary 标志，不重写应用消息。只保留必要 Host/loopback Origin、目标path、协议数量、HTTP upgrade状态，不记录 auth/header凭据、文本、cwd 或任意完整 payload。

| Round | 实际结果 | Raw / 媒体 |
| --- | --- | --- |
| round-1：06:23:53.636Z→06:25:20.206Z | 复用未经本轮 instrumentation 的 stage3 app；mobile从`::1`连54883，55次hello后backend失败；未收到server_info；exit1 | `round-1/ws-ledger.jsonl`、`maestro.log`、`app-unified.log`、`release-smoke.mov`、3张截图 |
| round-2：06:26:49.345Z→06:28:17.250Z | 保留Host后backend101，native server_info/心跳/RPC成功；目录请求为零，输入框30秒等待失败；exit1 | `round-2/`同名原始日志/媒体，以及`cache-row-index.json` |

Round1代理删除 Host 而保留 native Origin，新增了backend同源校验失败；该失败只属于新 QA proxy，不能用它解释原 stage3 app。修正前后 `build/proxy-fix.diff` 保留。Round1未采backendHTTP状态，403结论来自独立直接握手对照；Round2进一步采到原生实值，排除subprotocol猜测：

```text
proxy listener: [::]:54883, ipv6Only=false
native source: ::1
native Host: localhost:54883
native Origin: http://localhost:54883
native subprotocol count: 0
backend targetURL: ws://127.0.0.1:55168/ws
backend HTTP status: 101; remoteAddress: 127.0.0.1; protocolNegotiated: false
native clientType: mobile; appVersion: 0.12.0-beta.1
server_info.serverId: srv_4m_LVpcSHgN-
workspaceId: wks_024816e95abef1a9
agentId: ce5f582d-3f93-45df-9f68-ffa84dc4b7f4
```

`server_info` 的2,708 bytes/SHA256与控制CLI收到的相同；route serverId和native收到的serverId相同。没有不匹配serverId/rekey的正证据；不能据此声称观测过内部rekey执行。native随后向**同一个预期workspaceId**发出 setup和script RPC且收到响应：

- `workspace_setup_status_request` requestId `f10974a1-2660-4fcd-bb00-d21cb26b782e`，同requestId的response已到达。
- `workspace.script.list.request` requestId `d2accc74-4ea4-4fe3-8289-981178a15508`，同requestId的response已到达；ledger未保留任意error文本，不据此断言业务payload无错误。
- 7次native heartbeat，7次native ping / 7次host pong，5组session event订阅请求/响应。
- **native `fetch_agents_request`、`fetch_workspaces_request`、`project.list.request`为0，也没有目录响应被proxy漏发的记录。** 控制CLI确有自己独立的fetch_agents，ledger明确标记`control-cli`，没有混作原生证据。

前两次正确处理原生 Open 弹窗；round2也处理通知“不允许”。前阶段最终真实截图仍是“正在加载 workspace”，左上菜单关闭；没有 navigation object异常。此前未追加runtime或真实Claude调用；后续新增菜单因果阶段单独保留provenance。

## Loading 诊断与需 parent 决定的最小产品计划

**实测定位：已连通并握手的 native 没有发起目录加载，而非网络尚未连通或目录响应中的workspaceId错配。** 结合源码，最高置信度候选原因是 fresh compact workspace深链缺少目录 demand：

1. `_layout.tsx: SidebarChrome` 的 `active` 要求mobile agent-list处于激活；关闭菜单的compact页面不激活它。`SidebarModelProvider → useSidebarWorkspacesList` 只有active时acquireDirectoryDemand。
2. `workspace-screen.tsx: WorkspaceScreenContent` 在workspace缺失时仅 `prepareWorkspaceRoute`；后者只读 `loadCachedWorkspace`，fresh cache无数据时不发网络请求。其script demand只订阅/读取脚本，不属于DirectorySync.hasDemand。
3. workspace route 的agent open intent要等待 `hasHydratedWorkspaces && workspaceExists` 才prepareWorkspaceTab；未到该步骤时没有viewed agent owner提供route demand。
4. `DirectorySync.connectionChanged` 只有hasDemand才requestDemandRefresh；`hasDemand`仅fullDemandSources或routeDemandIds。于是没有fetchWorkspaces/commitSnapshot，workspace gate持续Loading。

这是 **源码与原始消息链共同支持的产品候选缺口**，不是本次 console 内存探针直接读回。未做baseline，不能说由#7186新增；没有自行修改产品或把改gate当QA修正。

最小修复建议（待parent定实现范围）：让**focused workspace route自己持有现有目录demand**，与sidebar可见性解耦，在隐藏/卸载时release；复用HostRuntime/DirectorySync现有所有权路径，不加daemon/SDK契约、不做fallback或改加载gate。优先写集 `packages/app/src/screens/workspace/workspace-screen.tsx` + 现有route/lifecycle测试；若需提取route effect，再增加一个小的app层hook及其现有suite覆盖，不改server/protocol。需验证fresh cache+compact sidebar closed的deep link能触发fetch/commit，切换/隐藏会release，旧serverId不会继续订阅。若parent希望只请求单workspace而不是现有full directory demand，应先明确该所有权接口，避免临时在gate里手动塞数据。

最快后续验证是经过授权后，在同一真实app流程中只用正常菜单按钮观察首次demand/fetch是否出现；它可检验上述因果链，但本轮没有执行，不计通过。若继续采内存状态，应使用可收集的观测通道（本轮console未入日志），仍不改变gate。

## SQLite、stream和性能边界

Round2 cleanup前通过 `sqlite3 -readonly -json` 对真实app container执行：

```sql
SELECT kind,id,length(CAST(payload AS BLOB)) AS bytes FROM rows ORDER BY kind,id;
```

实际只有 `checkpoint / singleton / 26 bytes`。没有workspace、agent或timeline行。Round1未找到该DB；没有伪造空行读回。

50,014 UTF8 bytes /20,014 UTF16 code units、SHA256 `42f194a3fd10cb26886dd17d5847b1344e715a93fe9c96f6d17ff4470d838a9c` 仍只是未触发的预设fixture。`stream` marker两轮均不存在；实际assistant字节为null。`verify-cache.mjs`未被执行，offline cold reload未到达。最终端口offline证明仅证明清理成功，**不是离线内容验收**。

本轮没有baseline build、A/B、physical OPPO、帧率或cache性能归因；功能尚未成功，因此不启动性能配对，也不把single candidate Release smoke写成性能改善。

## 命令、退出码与原始记录

所有复制build产物、Node QA、构建、runtime、Maestro及最终诊断/清理均使用正常阻塞锁；每个阶段结束后释放：

```sh
/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh <script> > <unique-log> 2>&1
```

| Script / args（本报告目录） | Exit | Raw log |
| --- | ---: | --- |
| `prepare.zsh` | 0 | `prepare.log`、`backup/sha256.txt` |
| `runtime.zsh round-1` | 1 | `round-1.log`、round-1子目录 |
| `build.zsh` | 0 | `build.log`、`build/xcode.log` |
| `network-contrast.zsh` | 0 | `network-contrast.log`、`network-control/result.json` |
| `refine-proxy.zsh` | 0 | `refine-proxy.log` |
| `QA_7186_APP=<new Release app> ... runtime.zsh round-2` | 1 | `round-2.log`、round-2子目录 |
| `finalize.zsh` | 0 | `finalize.log`、cleanup/provenance/result JSON |
| `public-manifest.zsh` | 0 | `public-manifest.log`、`public-audit.json` |

完整xcodebuild参数在`build.zsh`；runtime/host/对照脚本均保留。没有新增安装、无产品变更，因此未重跑全仓typecheck/lint/format、旧绿单测/web或full suites；本轮规范suite测试数0，两次Maestro输入框断言均失败。未覆盖Android、物理iOS/Android和desktop。

## 清理与可公开 allowlist

`cleanup.json`实测06:30:11.191Z：两个自建UUID `D5CBEC15-966B-4DA9-92ED-E66C3C76B43B` / `81942C33-EDED-4026-BFF4-2CA5B6B7A99D` 均已删除；两个own host PID均不存在。54883、53958、55168、55084在IPv4/IPv6均ECONNREFUSED。22个既有simulator状态不变，包括RRD10625-Fav-Tag仍Booted。没有shutdown-all、没有touch用户物理机或daemon。

公开入口 `public/README.md`，递归 `public/manifest.json`记录34项bytes/SHA256，独立`public-audit.json`记录凭据模式扫描无命中。包含6张synthetic截图、两段h264录屏（45.485秒/62.326667秒）、严格字段allowlist的WS ledger、synthetic IDs/results、最小直接握手对照、完整临时instrument/proxy diff、源码及build provenance、脱敏cleanup摘要；已目视确认最终Loading截图，其余媒体保留fresh synthetic设备来源，由parent负责最终审核/发布。

**不公开** `backup/stage3-app`、bundle/app binary、home、完整SQLite DB、原始app统一日志、完整Xcode环境输出、Maestro完整调试目录、既有device inventory及任何session home。旧公开证据保留原路径且49项校验不变；无上传、无Draft状态变更。worktree和临时失败/成功artifact保留供parent验收。

## 新增菜单因果阶段（parent明确扩展，一次runtime，无新build）

新增产物单独位于 `causal-stage/`，前阶段root public的34项bytes/SHA256全部保持不变；原round1/2和更旧公开49项未覆盖。阶段开始 **06:35:37Z**，host **06:35:39.387Z→06:37:58.105Z**，最终资源核验 **06:38:40.257Z**。精确host时间见 `causal-stage/runtime/host-result.json`。新自建simulator `50EE316A-A6DB-4B78-87FE-1D92E86C1696`、独立synthetic repo/home；proxy54883、upstream58110。执行者model配置与前文相同，mock model仍`e2e-fast-stream`；没有外部模型请求。

复用完全相同的观测版Release：native binary SHA256 `7a07b73393b1baeca7a1bd892b4435701fe9d5ed0a61fcd6fccd60e3db4d5115`，Hermes bundle `3149fb3b60d8190ca1d0daeb227a812c7b17cb7f87ab3ffcafd102c8046893b3`。没有新build、版本/产品代码/路由/gate修改。proxy转发代码保持相同；唯一harness增量是在接收实际agent_stream时旁路记录其text字段，完整 `causal-stage/host-observation.diff`。此记录不修改或重新编码转发Buffer。

### 因果对照：通过

本轮改为从启动前持续采集info/debug级日志；同一binary此前已经存在的console观测本次真正采到 **28条**。原round1/2的“console未采到”历史结论不变。新增 `native-observer-events.json` 保留raw local timestamp并以环境Asia/Singapore(+08:00)换算UTC；不是据缺少日志推内存值。

Synthetic IDs：server `srv_9VvB5IUP7itU`；workspace `wks_65600194d01e9577`；agent `6a511986-f89e-48ea-9116-4cf6c9f3b25d`。

| UTC事件 | 实测证据 |
| --- | --- |
| 06:36:10.863 冷deep link | `ui-markers.jsonl`；同一WS mobile客户端已完成hello/server_info |
| 06:36:26.758 Loading | console gate：`status=online, workspaceId=null, hydrated=false, recovery=idle`；route目标ID正确、`exists=false, layoutHydrated=true` |
| 06:36:31.075 点击前检查点 | `before-menu.json`，native目录请求/响应为0；Maestro确认Loading可见、输入框不可见 |
| 06:36:34.627 正常点击menu-button开始，872ms完成 | `ui-command-events.json`来自Maestro原始command metadata；没有store注入 |
| 06:36:35.341 demand | console：`demanded=true, fullCount=0, routeCount=0`（计数是在add前观测） |
| 06:36:35.363 同一session开始workspace刷新 | `clientGeneration=1, connectionEpoch=1, clientEqual=true, sessionGeneration=1, hasServerInfo=true, matches=true` |
| 06:36:35.367 fetch_agents_request / .372 response | requestId `ec59c917-1bcb-45b7-9925-0294631fd8d6`，实际mobile连接 |
| 06:36:35.371 project.list.request / .374 response | requestId `38e8beec-09cc-4444-8dab-f57bfd6c798c` |
| 06:36:35.390 fetch_workspaces_request / .394 response | requestId `1d6967c8-8094-46f2-b472-0ed366c00f08`，response entries包含目标workspace |
| 06:36:35.395 commit / .396 route / .397 gate | console实际读到目标workspace提交，`hydrated=true, exists=true`，gate在线且workspace非null |
| 关闭正常sidebar-close后 | console释放full demand；Maestro确认message-input-root可见，截图`chat-after-menu-close.png` |

连续单个 `simctl recordVideo` 进程保留 `runtime/continuous-release.mov`（h264，1206×2622，媒体时长80.156667秒）；没有剪接。文件时间轴不当作wall-clock/帧率证据，事件时间以ledger/console/Maestro为准。截图与原始完整Maestro command JSON留在本阶段，公开版只提取操作及时间字段。

结论：在这个fresh compact direct-link场景，**打开真实sidebar首次取得directory demand并立即使同一workspace hydrated/聊天可见**，支持前述route/sidebar demand缺口的因果关系。它没有修复产品；不代表默认deep link本身通过，也不证明#7186引入问题。没有改parent尚未授权的产品源码。

### Native stream与实际SQLite：通过的部分

06:36:38.568由独立control client通过正常 `sendAgentMessage` 触发mock streaming；06:37:07.520 host报告idle完成；06:37:16.767对真实app SQLite执行只读SELECT。UI确实显示“缓存😀”正文，截图`during-stream.png`、`after-stream.png`及连续视频。全程没有真实provider推理。

查询除payload外直接读取 `length(CAST(payload AS BLOB))` 和 `hex(CAST(payload AS BLOB))`，从实际JSON解析assistant，原始 `actual-timeline-after-stream.json`、`actual-assistant-after-stream.txt` 都来自DB读回：

| 实际读回 | 测量 |
| --- | --- |
| timeline row | server/agent IDs精确匹配；20,869 UTF16 code units / **50,869 UTF8 bytes**；SQLite BLOB length、hex bytes和Node UTF8 Buffer逐字一致 |
| timeline payload SHA256 | `4888a703c2ad88fe38e49554a80e8c10e872bdd1aa99a28c45e4e1410e188555` |
| assistant JSON text | **20,014 UTF16 code units /50,014 UTF8 bytes**；15,000 non-ASCII code points；replacement characters=0；UTF8 round-trip=true |
| assistant SHA256 | `42f194a3fd10cb26886dd17d5847b1344e715a93fe9c96f6d17ff4470d838a9c` |
| 实际native网络文本 | 从461个实际agent_stream frame中按ledger里的assistant_message类型筛选458段text；拼接后chars/bytes/hash与SQLite assistant逐字相同，排除user-message文本 |
| 实际其他row | agent1,394 / checkpoint281 / project379 / workspace816 bytes；各自SQL hex与实际UTF8字节一致 |

这些数值本轮已是**实际readback**，不是用fixture期望值代替测量；期望字符串只用于之后的相等断言。详情 `runtime/cache-after-stream.json`、`utf8-readback-audit.json`。

对实际20,869-code-unit timeline JSON按candidate的16,384窗口做独立边界审计：分成39,834和11,035 bytes，总和50,869等于SQLite实际BLOB。该实际样本窗口未切到高surrogate，因此没有触发surrogate-boundary调整；458段实际文本均UTF8 round-trip正确、无unpaired surrogate。**这是实际数据的边界审计，不是native utf8ByteLength内部返回值/性能的直接instrument，也不冒充本次覆盖过surrogate恰好跨窗口的情况。** 未重跑此前已绿unit tests。

### 停止点：末尾标记当前视口断言失败，offline reload未执行

`assert-content.yaml` 的输入框断言通过，但等待 `(?s).*QA7186-END.*` 在当前视口可见30秒失败，runtime exit1后trap正常清理。实际截图显示大量已渲染正文与正常“跳到底部”按钮，END不在当前视口；SQLite已含完整END并与native网络文本一致。harness没有先点击正常跳底部按钮，**该断言选择过严导致流程提前退出**，不能据此认定renderer丢字或新的产品bug。

本轮没有追加第二次因果runtime，也没有在删除设备后重建/恢复设备。native正文显示、菜单因果、SQLite正确内容已验收；完整末尾可见及两个稳态截图、停daemon后的cold app reload未到达。`offline-proof.json`、after-reload cache文件均不存在。最终端口关闭仅是清理证据，不当作offline内容验收。

因此最终仍partial。功能验收尚有offline reload缺口，不执行或启动性能A/B；完成条件未满足，性能配对计划留待parent决定下一步，当前不把native cache正确性当作性能改善。

### 本新增阶段命令、资源清理和公开子集

全部heavy/runtime/Node/media命令继续正常阻塞共享锁，prepare、runtime、finalize各阶段结束释放；无新build，无安装、旧绿suite、全套或性能测试。

| Script（`causal-stage/`） | Exit | 原始日志 |
| --- | ---: | --- |
| `prepare.zsh` | 0 | `prepare.log`、`app-sha256.txt` |
| `runtime.zsh` | 1 | `runtime.log`、`runtime/maestro-loading.log`、`maestro-menu.log`、`maestro-content.log`；前两flow通过，第三flow输入框通过/END失败 |
| `finalize.zsh` | 0 | `finalize.log`、result/cleanup/readback audit JSON |
| `manifest.zsh` | 0 | `manifest.log`、独立public manifest与凭据模式扫描结果 |

实际SQLite校验命令退出0；本阶段规范suite测试数0。最终checkout仍`85f7d56...` clean。自建simulator已删除、own host PID40347不存活、54883与58110在IPv4/IPv6均ECONNREFUSED，22个既有simulator状态全部保持；见`causal-stage/cleanup.json`。observer log/video子进程由同一trap停止并wait，未操作已有用户设备或6767/6768。

新公开入口 **`causal-stage/public/README.md`**；其独立manifest记录新增allowlist，不覆盖原 `public/`。包含因果检查点、必要字段WS ledger、已脱敏observer事件、正常UI操作时间、实际synthetic assistant/timeline JSON和字节审计、6张截图、连续视频及harness观测diff。无SQLite DB、home、app binary、完整用户/OS日志、既有device inventory或凭据。parent负责审核发布，没有上传或修改PR状态。
