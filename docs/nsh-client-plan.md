# Paseo NSH 客户端实现方案

日期：2026-11-07。状态：独立评审修订稿，未进入实现。

采用新增 NSH 客户端、复用现有 daemon 与协议、先交付 macOS 的路线。先按 P0a／P0b／P0c 分段验证 SDK、流式聊天和终端，各阶段设时间盒与停止条件，再决定是否开发日常可用版本。移动端和 Web 在桌面收益成立后分别评估，不同时启动全平台重写。

## 目标与投入边界

优先验证桌面客户端的资源占用、启动和复杂交互是否值得迁移。现有 Expo 客户端已经共享多端代码，因此统一技术栈本身不足以支持重写决定。

- daemon、provider 执行、PTY worker 和 wire protocol 保持现状。
- 保留现有客户端和插件运行方式，新客户端可独立安装、退出和卸载。
- 保留客户端侧 relay 加密与认证契约，不通过修改 server 绕过运行时限制。
- P0 允许做最小适配，不允许以大规模共享层重构作为启动条件。
- NSH 的 TSX 使用自己的响应式模型，React／React Native 组件及 hooks 不能直接迁移。

本方案中的工期和收益门槛是决策预算，不是已验证结果。尚无 Paseo 在 NSH 上的 release 构建或实机对比。

长期建议是**有条件替代 Electron 桌面客户端**，而非默认永久维护两套桌面产品；现阶段只验证可行性并保留旧客户端，移动／Web 不在替代承诺内。P0 通过不批准替代，也不扩大首版裁剪范围。P1 投资前须比较“补齐后替代、受限长期并存、停止”的总成本并取得用户明确选择；未选择不能进入产品化承诺。

## 兼容范围

协议兼容、功能覆盖和插件 UI 兼容分开验收。遵循 [Protocol Compatibility](protocol-compatibility.md)，能力检测集中在功能入口，不增加旧协议模拟路径。

| 层次        | 承诺                                                                                        | 验证方式                                     |
| ----------- | ------------------------------------------------------------------------------------------- | -------------------------------------------- |
| daemon 协议 | 对支持范围内的现有 daemon 使用原有消息与认证，不要求 server 改造                            | 固定 daemon 版本及 SHA，跑真实连接与功能矩阵 |
| 首版功能    | 覆盖下节列出的客户端工作流                                                                  | 逐项端到端验收                               |
| 历史版本    | 本轮支持下限为 v0.15.0，实际承诺限于 P0 测试矩阵；不覆盖更早的无分块和 header-only 认证路径 | 当前版本和至少一个明确指定的旧版 daemon      |
| daemon 插件 | 安装、RPC、provider、hooks 和后台执行保持现状                                               | 通过新客户端触发并核对结果                   |
| 客户端插件  | 现有客户端贡献全部暂不可用，直到提供 NSH 入口；包括命令、主题、转换器、附件源及 UI          | P1 单独验证入口与迁移样例                    |

P0 先固定本地 Paseo 基线 SHA 和一个 v0.15.0 daemon revision，分别形成测试矩阵；测试通过只代表这两个明确版本，不推导所有更早或未来版本兼容。未实现的浏览器自动化等能力不宣告支持；需要尚未支持的插件 UI 时明确提示。

## macOS 首版范围

| 领域 | 首版交付                                                                              |
| ---- | ------------------------------------------------------------------------------------- |
| 主机 | 添加和切换主机；本地 Unix socket、远程直连、relay；保存连接信息；连接与认证错误可操作 |
| 目录 | project／workspace／agent 列表及更新；工作区切换；创建 agent；provider／模型选择      |
| 会话 | 发消息、流式回复、工具调用、权限审批、停止运行；历史分页；断线补载                    |
| 内容 | Markdown、代码复制、文件链接；本地文件与图片附件；基础主题                            |
| 终端 | 创建、附着、输入、输出、resize、选择复制、重连恢复                                    |
| 文件 | 按所选主机访问工作区文件；文本预览；只读 Diff                                         |
| 桌面 | 单窗口、基本快捷键、配置持久化；连接已有 daemon                                       |

后续再做 daemon 自动管理、签名分发和应用升级。完整编辑器、内置浏览器及自动化、语音、多窗口、调度管理 UI 和完整插件支持不进入首版。routed connected hosts、remote SSH 不进入首版，选择这类目标时明确提示未支持，不静默改用其他连接。附件中的本地文件获取由平台负责，上传和远端路径语义继续使用 daemon 现有契约。

## 包与依赖边界

实验应用放在隔离 worktree 的 `packages/nsh-client/`，P0 不加入根 workspaces，不改根 lockfile、Nix hash 或默认 CI／build／typecheck 路由；NSH 工具链只在实验目录显式运行。P0 结果通过后，再单独评审 workspace 与 CI 接线，避免所有贡献者被迫安装 NSH／Rust。

```text
packages/nsh-client/
├── package.json
├── nsh.json
├── tsconfig.json
├── App.tsx
├── src/
│   ├── connection/
│   ├── directory/
│   ├── timeline/
│   ├── composer/
│   ├── terminal/
│   ├── files/
│   ├── platform/
│   └── ui/
└── native/
    ├── Cargo.toml
    └── src/
```

| 依赖                | 使用原则                                                              |
| ------------------- | --------------------------------------------------------------------- |
| `packages/protocol` | 直接复用类型、schema、二进制编解码；不复制协议                        |
| `packages/client`   | 复用请求、认证、连接、订阅和 API facade；通过现有 transport seam 接入 |
| `packages/relay`    | 复用客户端加密实现；验证随机源、字节序列和依赖的运行时兼容性          |
| `packages/app`      | 选择性提取确需复用的纯逻辑；不把 Expo、React 或 app store 带入新应用  |
| `packages/desktop`  | 作为平台行为与生命周期的参考；Electron IPC 和宿主实现不直接复用       |
| NSH                 | 固定版本及可追溯源码 revision；新版本升级独立验证                     |

先复用 `DaemonClient` 的 `transportFactory` 与 `createPaseoApi()`。连接 owner 显式设置 `clientType: "mobile"`，`appVersion` 沿用所依赖 Paseo 基线的 package version，不使用实验应用自己的 `0.1.0` 版本；应用分发版本独立记录。当前公共 `createPaseoClient()` 不直接公开完整 transport 配置；应用连接 owner 使用现有底层入口，不在首轮扩大公共接口。

握手 capabilities 区分 SDK 已实现的协议能力与宿主提供的产品能力：保留所用 SDK 正确处理的分块、订阅、schema 等协议声明，未实现的 `browserHost` 不宣告支持。`DaemonClient` 会合并默认 capabilities，不能靠省略配置字段禁用默认项。对最终发出的 hello 建快照与语义测试，SDK 默认声明变化时人工核对实际支持，不能因为缺少 UI 就关闭必需协议能力，也不能把 SDK 默认值当作新宿主已完成所有行为。测试包括 `appVersion`、`clientType`、最终 capabilities 和插件消息处理。对 `backgroundAgents` 验证不为后台 agent 自动创建标签页；对 `timelineNotifications` 验证通知事件可被接收并按当前阶段的 presence／通知边界处理；对 `providerSubagents`／`projectedSubagentTimeline` 验证父子身份和投影；`customModeIcons` 遇到未识别图标时显示明确的通用图标占位且不阻断操作。

文件、Git 等尚未由 facade 覆盖的调用集中在所属领域内使用现有低层客户端；UI 不直接拼装 wire 消息。P0 列出实际缺失的 API，再决定最小 SDK 调整。

### 状态与生命周期

连接 owner 按主机身份持有客户端、认证状态与订阅。目录 owner 管理目录快照；时间线 owner 管理历史、游标与实时事件；NSH 页面只消费这些领域状态。

沿用 [Timeline sync](timeline-sync.md) 的权威数据与恢复规则，不在新文档复制完整算法。尤其要验证 live stream 与 history 的合流、epoch 重置、分页追赶和取消后的迟到响应。SDK 恢复订阅不等于恢复遗漏历史。

P0 直接复用 `packages/app/src/types/stream.ts` 与 `timeline/timeline-sync-plan.ts` 的纯逻辑及依赖；NSH 打包器显式解析 app 源码 `@/` alias，并验证运行时闭包。已知 `processTimelineResponse` 位于导入 Zustand store 的 `session-stream-reducers.ts`，`viewed-timeline-sync.ts` 也耦合 app store，不能原样导入后期待 tree shaking 解决。按下节预定边界抽取，不把“能否直接 import”重新当成未知实验；`host-runtime.ts` 不整体搬入，不伪造 React 模块。Go 后再决定共享包位置，UI 响应式绑定不拥有网络订阅生命周期。

沿用现存 directory agent 记录中的唯一 `agent.turn`：snapshot.activeTurn 经 directory 投影进入，唯一 writer 为 `AgentStoreProjection`／对应的纯投影边界；timeline 和 composer 仅将 stream／cancel 的既有 `TurnLivenessTransition` 汇入该 writer，不再保存第二份 turn Map。所有可见表面读取同一 agent 记录；submission 是独立的 pre-turn registry。canonical 确认与 RPC 结算是两项事实，canonical 先到即退休乐观活动且不因随后 transport 错误回滚已确认行，两事实齐备才移除事务；并发 send 各自按 clientMessageId 结算。`canonicalSubmittedPrompts` 在 writer 边界判定一次，保留现有无该能力的行为，不新增状态机。目录状态不结算提交，绘制批处理不延迟 turn 生命周期更新。

仅对本会话实际打开／需求集合中的 agent 订阅和 fetch；fetch 会恢复 daemon agent，不能为了填满目录或恢复旧布局预取 200 个 agent 的时间线。需求与可见集合的关系继续由现有 sync 编排决定。

P0 使用内存中的目录和时间线状态；重启后走权威网络路径。首版持久化连接、偏好和草稿。完整离线历史缓存不进入首版，不共享旧客户端缓存文件。

### 模块交接契约

下表是**拟定的 NSH 应用内 owner 分工**，不是 NSH 已提供的 API；现存接口以紧随其后的源码表为准。每个 owner 由实施者认领，领域状态以主机 ID 和实体 ID 为键，不用页面挂载状态推导网络生命周期。

| Owner             | 输入 → 输出                                                                               | 生命周期、取消与错误                                                                                                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connection`      | 目标地址、凭据获取回调、SDK 配置 → `DaemonClient`、`createPaseoApi()`、连接状态及能力快照 | 主机注册至移除；SDK 拥有重连，Rust 不另设重连循环。退出时释放领域观察后关闭客户端；认证／TLS 错误保留原因并由连接 UI 展示                                                                            |
| `directory`       | 主机 API、查询条件、snapshot.activeTurn 与 typed turn transitions → 目录及唯一 agent.turn | 拥有 directory agent 投影的写入边界；snapshot、timeline stream、composer cancel 汇入同一记录。持有 observation handle，重连快照先替换再消费增量，切换释放旧 handle                                   |
| `timeline`        | 实时事件、权威页、需求集合 → items、cursor、freshness、分页与重试                         | 使用共享单 agent 副本提交转换；turn transitions 交 directory writer，不另存 turn 副本。复用 generation 丢弃迟到结果，本地取消不等于 daemon 已停止                                                    |
| `composer`        | 草稿、发送／审批／停止意图 → submission 双事实状态与动作结果                              | 复用 model／writer 契约，按 clientMessageId 独立结算；canonical 与 RPC 先后均正确，已确认行不被失败回滚。取消经 directory writer 更新唯一 agent.turn，旧请求不能清除新 turn／新取消；P0 仅文本与对账 |
| `terminal`        | SDK replay/live bytes、测量尺寸、键盘输入 → xterm、绘制帧与选择文本                       | 在连接边界一次选择字符宽度表，先测 grid 再 attach/replay；每次附着拥有解析器与观察，detach 释放资源但不终止远端 PTY                                                                                  |
| `files`（P1）     | 主机、workspace、路径 → 文件／Diff 加载状态                                               | 请求属于该目标的查看周期；切换目标不接纳旧结果，错误返回所属面板，不访问本机同名路径替代远端                                                                                                         |
| `platform` / `ui` | 平台调用／领域快照 → 字节、凭据或原生事件／可见交互                                       | Rust 拥有 socket、原生内存和系统资源，TSX 拥有业务状态；视图仅释放自己的监听与绘制资源，错误回所属 owner，不吞掉后显示成功                                                                           |

### 复用源码与依赖核对表

以下路径按 Paseo `9667ec557` 的源码及当前方案工作区读取核对；实验开始时重新记录实际 SHA 和 dirty diff。路径是候选复用入口，**尚未在 QuickJS 验证**。

| 现存源码（仓库相对路径）                                                                                                                | 可复用内容与必须检查的依赖                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/client/src/daemon-client.ts`、`index.ts`、`daemon-client-transport-types.ts`                                                  | `DaemonClient`、`createPaseoApi()` 与 transport 契约；包 exports 已提供 `@getpaseo/client/internal/daemon-client` 和 `internal/daemon-client-transport-types`。默认 transport、generated protocol validation 和 relay 模块都需实际求值，不能只验证一个空 import |
| `packages/client/src/daemon-client-relay-e2ee-transport.ts`、`packages/protocol/src/chunked-transport.ts`、`websocket-message-limit.ts` | 加密 transport 的明文预算与 SDK 分块；`packages/relay/src/protected-records.ts` 负责 record 编码。运行时检查随机源、TextEncoder/TextDecoder、Uint8Array、Promise／定时器；不复制加密或分块实现                                                                  |
| `packages/app/src/types/stream.ts`、`utils/tool-call-parsers.ts`                                                                        | 流式 reducer、权威替换及身份对账；后者实际依赖 `zod`，highlight 为 type import。`attachments/types` 等类型依赖须由构建器擦除；不能以文件位于 app 内就判为 React 依赖                                                                                            |
| `packages/app/src/timeline/timeline-sync-plan.ts`、`timeline-fetch-policy.ts`                                                           | 纯 fetch plan；存在 `@/timeline/...` 运行时 alias。先实际加载和执行，再确认可直接复用                                                                                                                                                                           |
| `packages/app/src/timeline/session-stream-reducers.ts`、`viewed-timeline-sync.ts`                                                       | 已知导入 `useSessionStore` 等 app 接线；按下节移出 `processTimelineResponse` 等纯函数及 `createViewedTimelineSync` 的 ports 核心，旧模块重导出／调用共享实现，不整体搬 store                                                                                    |
| `packages/app/src/terminal/native-renderer/headless-terminal-state.ts`、`terminal-frame.ts`、`terminal-selection.ts`                    | xterm 解析、网格投影、坐标 epoch 与复制；前者依赖 `@xterm/headless` 和 `@xterm/addon-unicode-graphemes`，frame 依赖现有 terminal contract 类型和颜色 resolver。选择逻辑无须搬 RN 手势控制器                                                                     |
| `packages/app/src/types/stream.harness.test.ts`、`timeline/viewed-timeline-sync.test.ts`                                                | 现有流式工具生命周期数据和 `TimelineWorld`／deferred 响应模式；fixture 当前在测试文件内，不是假定存在可公开 import 的 fixture 包。按需最小提取测试数据，不导入 Vitest 到应用                                                                                    |
| `packages/app/src/terminal/native-renderer/headless-terminal-state.test.ts`、`terminal-frame.test.ts`、`terminal-selection.test.ts`     | 解析、网格、选择 oracle；`native-terminal-benchmark-payload.ts` 生成带 ANSI 色彩的确定性行；`packages/app/modules/paseo-terminal/android/src/androidTest/assets/grapheme-rows.json` 可跨平台复用数据，不能复用其 Android 执行环境                               |
| `packages/server/src/server/test-utils/paseo-daemon.ts`                                                                                 | 现有 `createTestPaseoDaemon`、随机端口和清理能力，运行于 Node 测试侧；NSH 通过真实网络连接，不把 daemon harness 打包进客户端。以当前 helper 类型为准核对选项，旧文档示例不代替源码                                                                              |

`packages/app/src/timeline/turn-liveness.ts` 提供 `reduceTurnLiveness`、`applyTurnLivenessTransition`、`resolveTurnPresentation`；`packages/app/src/composer/submission/model.ts` 提供 begin／accept／canonical／reject 纯模型，直接复用。`composer/submission/writer.ts` 实际导入 `useSessionStore`，只复用其一次 capability gate 和 `MessageSubmissionWriter` 契约，在 NSH 内存状态接线，不能整个打包。发送沿用 `composer/actions.ts` 的 `dispatchComposerAgentMessage` 单一路径；已核对 `actions.ts → i18n/i18next.ts → react-i18next` 是已知运行时阻挡，B2 预定移动该函数及必要类型到纯模块，旧入口重导出并保留调用；不等待 import 失败才决定，也不另写发送状态机。

`packages/app/src/runtime/directory-sync/internal/agent-store.ts` 的 `mergeSnapshotTurn` 与 `AgentStoreProjection.applyTurn` 定义 snapshot／typed transitions 到 `agent.turn` 的唯一投影，依赖现有 `reduceTurnLiveness`；类本身导入 store、draft、query 等，不直接搬入 NSH。NSH 的 directory writer 按同一纯 turn reducer 接线，timeline／composer 不拥有活动状态。用既有 `runtime/directory-sync/agent-replica.test.ts` 和 `timeline/turn-liveness.test.ts` 验证 snapshot 与迟到 stream／cancel 的交错。

#### A4 已知最小抽取边界

下列均为**拟定改动**，本方案不执行；只在 P0 实验分支，不提前合入 main。移动现有逻辑与依赖闭包，保持旧签名和行为，不为 NSH 复制算法。

| 现存入口 → 拟定纯模块                                                          | 迁移内容与保留边界                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 允许 write-set / 定向回归                                                                                                                                           |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `timeline/session-stream-reducers.ts` → 同目录拟建 `timeline-reducers.ts`      | `processTimelineResponse`、`processAgentStreamEvent`、`processAgentStreamEvents`、`createAgentStreamReducerQueue`、`deriveAgentStreamTurnLiveness` 及其内部 helper；随迁移 `TimelineCursor`／`TimelineLoadedRange`、`ProcessTimelineResponseInput/Output`、`ProcessAgentStreamEventInput/Output`、`ProcessAgentStreamEventsInput`、`AgentStreamReducerEvent/Snapshot/Queue`、`CreateAgentStreamReducerQueueInput` 和 side-effect 类型。store 接线 `createSessionAgentStreamReducerQueue`、flush 定时调度保留原模块 | 仅这两个实现文件及既有 `session-stream-reducers.test.ts`；旧入口 import 并重导出共享实现，旧端定向跑此测试与 `types/stream.test.ts`、`types/stream.harness.test.ts` |
| `timeline/viewed-timeline-sync.ts` → 同目录拟建 `viewed-timeline-sync-core.ts` | `createViewedTimelineSync`、`isSameCatchUpRequest`、`decideCatchUp`、`normalizeAgentIds`、`sameAgentIds`，局部状态类型及 `ViewedTimelineSyncPorts`、`ViewedTimelineUiBridge`、`ViewedTimelineSync`、`ViewedTimelineStatus` 与 `TimelinePageResult`；依赖纯 sync-plan。owner、replica/cache 与副作用执行接线留原模块；store commit／initialization 的决策语义按下一行共享，不留两套规则                                                                                                                             | 仅这两个实现文件及既有 `viewed-timeline-sync.test.ts`；旧入口重导出并调用核心，旧端跑此测试和 `timeline-sync-plan.test.ts`                                          |

纯 reducer 输出还不是完整副本提交；A4 同时预声明以下必要边界，不将规则藏在两个 adapter 中：

| 现存规则来源 → 拟定模块                                                                                                                                                                                                                                          | 共享的单 agent 转换／决策                                                                                                                                                                                                                                                                                                                                             | write-set 与旧调用方                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stores/session-store.ts` 的 `selectAgentTimelineState`、`applyAgentTimelineResponseState`、`markAgentHistorySynchronized`、`setAgentStreamState`；`timeline/session-stream-reducers.ts` 的 queue commit/cursor 分支 → 拟建 `timeline/agent-timeline-replica.ts` | 输入只含该 agent 的 tail/head、cursor、older/newer、authoritative 标志、当前 host／agent sync generation、submissions、tasks，以及 page／stream 提交结果。共享 cold/painted/synced 推导、canonical 退休、`latestTasksFromStream`／taskSnapshot、cursor 去重与已覆盖 last-event 判定、generation 更新和无变化引用保留。输出下一状态或局部 patch，不传整个 SessionState | 新模块、`stores/session-store.ts`、上述 reducers 原模块及既有 `stores/session-store.test.ts`／`timeline/session-stream-reducers.test.ts`。旧 store 只读取该 agent 切片、调用共享转换并写回 maps；NSH adapter 调用同一转换，不能复制分支 |
| `timeline/viewed-timeline-sync.ts` 的 `commitProcessedTimeline`、`finalizeProcessedTimeline`、`applyAuthoritativeTimelineResponse` → 同一拟建 `timeline/agent-timeline-replica.ts` 的纯决策函数                                                                  | 保留 discard 时 canonical ack／非 before 的 newer／sync generation 处理，before 页保持现有 newer；输入 init 状态、requestDirection、cachedCursor 及 directory agent.turn 的只读 phase，决定 apply/discard、clearInitializing、init resolve/reject、catch-up，以及 synchronized 且 idle 时触发 queued-send。错误路径不提交成功状态；执行顺序与旧实现一致               | `viewed-timeline-sync.ts` 改为调用共享决策，fetch、deferred resolve/reject、queued-send 和 store 写入仍由既有 ports／接线执行；扩充既有 `timeline/viewed-timeline-sync.test.ts`，不引入通用事件框架                                     |

新模块的依赖限既有纯 stream／submission model、纯 timeline reducers／sync-plan、必要类型与现存相等比较语义；不 import Zustand、React、directory store 或 init registry。`AgentTimelineState`／cursor 类型移到纯边界并由旧 store 重导出，旧 selector 保留原签名，仅切片后调用纯推导。taskSnapshot 相等去重和无变化返回遵循现有实现，不顺手改通知策略。副作用决策是数据，执行仍在 owner ports；未实现的 P0 queued-send 只记录／断言决策，旧端真实调用行为必须保持。

路径以 `packages/app/src/` 为前缀。NSH 只新增内存 adapter 对接已有 snapshot／commit／side-effects／fetch ports，不搬持久化、create-flow store 或 host runtime。包含单 agent 副本提交语义后，A4 抽取与回归重估为 1.5–2 人日，设 2 人日子上限（规划假设，不是完成承诺），仍计入 P0a 5 日；需扩大范围或到上限未完成就停止交证据。其他 client 适配先列实际阻挡再审查。

B2 writer 接线仅在新包；dispatcher 移动为预定任务，write-set 限 `composer/actions.ts`、拟建 `composer/dispatch-agent-message.ts` 和既有 `composer/actions.test.ts`，共享依赖仍不可运行则停止重估。定向回归复用 `composer/submission/model.test.ts`、`composer/submission/writer.test.ts`、`timeline/turn-liveness.test.ts` 和 `composer/actions.test.ts`；B2 不改原 writer；store 仅按 A4 已列提交转换接线修改。

P0a 的依赖报告列出每个入口的“源码 import → 打包后实际模块 → 首次求值结果 → 首个真实操作”。分别记录 alias 缺失、Node／React 模块泄漏和运行时 API 缺失；类型检查通过、bundle 生成和运行成功是三份不同证据。A4 已知改动按上表执行；其他阻挡先列具体 write-set，不批量建共享包。

### 平台宿主与安全

macOS 由 Rust 宿主提供 TCP WebSocket 传输，Unix socket 放入 P1，并实现现有 `DaemonTransport` 契约。保留文本与二进制帧类型、关闭原因及发送背压语义，避免把终端帧转成大量 JSON 数字数组。

Rust WebSocket 的 frame／message 入站上限覆盖现有 protocol 的 100 MiB message ceiling；当前 daemon 常用 32 MiB 帧，relay 的加密 wire message 上限为 32 MiB，具体值以固定 revision 的 protocol 常量为准。不得直接使用 NSH v0.4.0 内建 WebSocket 的 8 MiB 上限。SDK 继续拥有消息分块与重组；Rust 传输不重复实现它。P0a 在直连和 relay 分别传输大于 8 MiB 的合法消息，核对内容一致且不断线；边界测试检查大小上限，不能只测小包。relay fixture 为加密开销留出空间，不能把 32 MiB 明文当作合法的 32 MiB wire frame。

当前 P0 的认证协商和 relay 加密保持在既有客户端代码中。验证 NSH 已有 `crypto.getRandomValues` 等 API 与 noble／tweetnacl 的兼容性，不自行实现随机源。Keychain 保存用户显式输入并选择保存的密码；daemon 的 `local-credential` 随启动轮换，不持久化到 Keychain。仅在应用自管或隔离测试实例中使用 `localCredential` 回调，每次连接从确认的 PASEO_HOME 读取，先核对 pid 文件的 listen 与目标一致；不读取任意远端或外部实例的本地凭据。P0 连接用户既有带密码 daemon 时走用户输入的密码。

P2 自管 daemon 的凭据轮换用例单独走现有 daemon-instance／CLI 启动链：参考 `packages/cli/src/commands/daemon/lifecycle.e2e.test.ts`，创建专属临时 PASEO_HOME，在该 home 的现有配置中设置 `daemon.listen` 为 loopback 可用端口（排除 6767／6768），以 `hashDaemonPassword` 设置 `daemon.auth.password`，再由现有 CLI 启动独立 daemon 子进程。端口被占用即失败或重新选端口，不停止占用者。记录实际 PID、startedAt、listen 与 home，确认本任务确实创建实例；轮换时只停止并重新启动该实例，测试旧 credential 拒绝、回调按目标重读的新 credential 成功。不能直接调用产品 bootstrap 代替启动链。

`createTestPaseoDaemon` 的进程内 harness 不写 `paseo.pid`；`readLocalCredentialForTarget` 会先核对该文件的 listen，缺失时返回 null。此用例必须使用启动链生成的真实 pid 文件，不照搬 `bootstrap-auth.test.ts` 中手写 pid 文件的单元测试接线。P0a 仅验证既有 daemon 密码认证及受控进程内 harness 正常认证，不做自管凭据读取／轮换；同步和数据测试仍使用进程内 harness。P2 才运行该子进程用例验证完整启动路径。

P2 凭据文件由 Rust 模块读取，不要求 TSX 获取整个用户目录访问权限。P2 再实现自管 daemon 的路径和所有权识别。TLS 传输需明确选择系统信任根，并验证系统已信任的企业私有 CA；不因 NSH 默认 WebPKI 根不同而默认兼容 macOS 信任链。自签且未信任的证书应明确失败，禁止跳过校验；如无法实现系统根，记录为兼容缺口并在 P0a 停止该连接路线。

这条边界是平台传输实现，不是新的一套 RPC 协议。NSH 自带网络 API 的能力差异不传递给业务层。Rust／TSX 桥接的可用字节类型、复制次数、错误传播和释放时机列为 P0a 实测项。A3 必须通过真实 drain 验证：E2EE 会透传 `supportsDrain`，而 `ChunkedTransport` 仅在 `supportsDrain !== false` 时启用出站分块，因此 `supportsDrain=false` 不是本方案合格的 Rust 传输实现。无法报告真实发送背压就判 No-go／重新评估，不得静默降级后声称 relay 大消息通过；恒为零的 `bufferedAmount` 不能作为证据。这是本方案桌面 relay 大逻辑消息的准入标准，比已发布移动端 `supportsDrain=false` 的限制更严；移动端行为不能证明可降级通过。send 等待表示现有 transport 契约下的本地发送队列背压解除（不要求队列严格清零），不承诺远端接收或业务 ACK。

#### TSX—Rust 传输探针

现存 `DaemonTransportFactory` 同步接收 `{ url, headers?, protocols? }` 并返回 transport；transport 暴露 `send(string | Uint8Array | ArrayBuffer): void | Promise<void>`、`close(code?, reason?)`、四类事件注册及各自取消函数，以及 `supportsDrain?`、`maxFrameBytes?`。其中没有 `AbortSignal`、RPC ID 或 terminal 专用方法。NSH 侧拟实现满足此契约的薄适配；具体 Rust 导出名和句柄待固定 revision 后确定。父级转交的 Opus v0.4.0 源码核对确认：组件 props/events/commands 走 JSON，Rust classes／模块另有字节通道，`Vec<u8>` 与 `Uint8Array` 每次跨边界各复制一次；bytes 入参只接受 `Uint8Array`，直接 `ArrayBuffer` 被拒绝。因此适配器将 `send(ArrayBuffer)` 显式包装成 `Uint8Array` 视图，保留已有 Uint8Array 的 offset/length。这些源码事实仍需本应用运行探针验证，不代表端到端已实现。

探针依次验证：创建 socket 并在异步 open 前完成监听注册；文本、ArrayBuffer 视图包装、非零 byteOffset／受限 byteLength 的 subarray 双向往返及 Rust→JS 异步 callback；send 等待真实队列背压解除；握手中 close；等待 drain 时断线；取消监听后不再回调。Rust 错误经 `onError` 和 close 原因返回 SDK，异步 send 失败 reject 原 Promise；记录事件顺序和次数，不自行翻译成成功结果。SDK 负责请求超时与重连，领域 owner 负责结果是否仍属于当前会话。

按上述源码路径初版采用有界复制，不承诺零拷贝：发送时 Rust 持有独立缓冲直到写入结束；入站 JS 持有的字节在回调返回后仍须有效，不能借用马上释放的 Rust slice。记录每次边界的 byteLength、复制次数、队列峰值及释放点。不能跨语言回收器借用无生命周期约束的指针。实测若没有可用的有界字节通道，P0a 停止，不切换 base64 或 JSON 数字数组规避失败。

终端另有应用内数据边界：daemon bytes → SDK replay/live → TSX xterm → 现有 frame 语义 → 拟定的二进制桥接编码 → Rust 持有的绘制快照 → NSView。这个编码只服务本机绘制，不是新 daemon wire；本轮不预定格式。Rust 不重新解析 ANSI，NSView 不回写业务状态。输入和 resize 反向回 terminal owner 后走 SDK；断开／重附着必须区分旧视图实例，旧帧不能覆盖新尺寸。P0c 证明快照替换时旧内存在绘制完成后释放，关闭窗口后 parser、订阅和原生缓冲均回落。

### 聊天与终端

聊天先使用 NSH `List` 和 `TextView`。验证流式 Markdown、历史插入、折叠展开、宽度变化、跨段选择、文件链接和 Mermaid。NSH 的内建组件能力不等于 Paseo 当前交互已经得到保留。

终端优先保留 `@xterm/headless` 和当前字符宽度语义，由 AppKit 原生组件绘制网格并处理输入和选择。复用现有网格契约与测试数据，遵循 [Terminal rendering](terminal-rendering.md)。iOS 的 UIKit 终端视图不能直接当作 macOS 实现。

父级转交的 v0.4.0 源码核对确认 `quickjs-jit=0.14.1`，LLRT Buffer 为全局且可通过 `buffer` import，unicode-graphemes addon 走 Buffer 路径；不能以“缺 Buffer／无 JIT”为阻塞。JIT 在签名 release／hardened runtime 下的运行条件仍须 C1 实验。NSH 本身提供基于 Rust vte 的 `Terminal`，但不能未经差分验证就替换 xterm 的字符宽度和回放语义。P0a 先用现有 `native-terminal-benchmark-payload.ts` 测 xterm headless 的吞吐、p95 更新耗时与堆占用，并验证 LLRT Buffer 的 byteOffset／byteLength 下 unicode-graphemes 宽度表正确加载。

P0c 先证明 AppKit 组件能被 release 包构建和签名加载，再做完整网格。优先复用 `terminal-frame.ts`、`headless-terminal-state.ts`、`terminal-selection.ts` 中的纯逻辑。C1 默认 Rust objc2 承载 NSView，前两天验证 release／签名加载；Swift 联编不作为 P0 必解路线。`packages/app/modules/paseo-terminal/ios/TerminalRowLayout.swift` 的 CoreText 整行 shaping、UTF-16 到 cell 映射、分组裁剪与溢出重绘，以及 `TerminalCustomGlyphs.swift` 的框线／块几何绘制作为移植参考；需要适配 AppKit，不能直接复用 UIKit 类。移植和原生绘制验证计入 P0c 的 10 日，不另开预算。终端网格不逐帧通过 JSON props／command 传递；拟使用 Rust 类型化模块接收二进制缓冲并更新宿主共享状态，NSView 直接读取。桥接类型、编码成本、所有权和复制次数须实测，不承诺零拷贝；若类型化通道不可用，停止重估，不以 JSON 全网格兜底。

终端 owner 在主机能力入口一次读取 `server_info.features["terminal-grapheme-widths"]`，按现有 `character-widths.ts` 语义向 xterm 传入 `graphemes` 或 `legacy`，不在每帧猜测。复用 `resolveMeasuredNativeTerminalSize`：字体 cell metrics 与非零 viewport 布局就绪后，才以测得 rows/cols attach 并接受 replay；重附着同样先测尺寸，不能先默认 80×24 回放再修正。此规则与 `terminal-restore-modes` 能力门槛分别验收。

用 `grapheme-rows.json` 和 `paseo terminal capture` 对照网格、光标、选择和宽度；未来若评估 NSH 内建模拟器，也先通过相同差分测试。P0c 测量完整解析、编码、桥接、绘制流水线成本。若失败或成本无法接受，暂停终端路线并重新评估；不自动改用另一套 ANSI parser 或嵌入旧 React 应用。

### 插件边界

沿用 [Plugins](plugins.md) 中 daemon 与 client 的职责划分。保留 daemon 插件，无需修改现有 manifest 来完成第一个客户端实验。P0 不实现客户端插件样例。现有 `index.client.tsx` 中的所有贡献在新客户端暂不可用，包括不画 UI 的命令、时间线转换器、附件源、主题和设置页；不能只把可见组件列为迁移项。

SDK 可以解析的 `type: "plugin"` 时间线行保留消息身份，显示明确的“不支持此插件内容”占位，不执行 React bundle、不静默丢弃；这不等于已支持插件 UI。P1 再做本地打包的面板和时间线组件样例，验证上下文、RPC、主题、释放。样例不等于动态分发兼容。NSH 客户端插件的产物类型、目标选择、版本声明与分发方式需在样例验证后单独定案；不得执行 daemon 下发的 React bundle，也不在同名字段中混装不兼容的 NSH 产物。涉及插件 manifest／产物分发的变化不进入 P0。

## 实施顺序与阶段出口

| 阶段                      | 实现顺序与交付                                                                                                                                                                                  | 出口条件                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| P0a，最多 5 个工作日      | 固定版本与最小 fixture → SDK 求值／Rust 字节通道／密码认证、大消息、TLS；A2 后可独立交错做同步／副本提交抽取；功能探针成立后完成 Electron 基线／指标冻结，再做完整入站、xterm、relay 正式微基准 | 正确性、CPU／滞后／队列预算通过且证据完整；5 日硬停止，未完成不进入 P0b |
| P0b，最多 5 个工作日      | 最小目录和会话页 → List／TextView 流式更新 → 历史分页和锚点 → 中文输入与选择                                                                                                                    | 核心交互通过冻结指标；内存与启动呈现可重复收益                          |
| P0c，另设最多 10 个工作日 | Rust objc2 release 探针 → AppKit 终端 → 完整 release 对比 → 代表变更移植、相邻 NSH tag 升级演练与长期选项成本                                                                                   | 终端、收益、维护门槛通过，提交 P1 投资选择；不自动批准替代              |
| P1，日常核心              | 目录创建 → 会话／草稿 → 附件 → 文件／Diff → Unix socket → 插件迁移样例 → presence／通知／快捷键                                                                                                 | 首版范围逐项通过；可连续完成日常工作流                                  |
| P2，桌面产品化            | 签名分发 → 自管 daemon 生命周期／独立子进程凭据轮换 → 打包、更新与诊断                                                                                                                          | 产品方向已获用户批准；安装、退出和升级有验收，不停止外部 daemon         |
| P3，平台扩展              | Android 关键路径实验，再分别评估其他平台                                                                                                                                                        | 每个平台单独立项，不从 macOS 性能外推移动端结果                         |

每个实验阶段独立给出 Go／No-go 建议；到时间盒即停止扩展并交付证据，未通过不能自动进入下一阶段。P0a 到期仍未打通认证连接或大消息时，判为 No-go 或提交新预算估算，不就地延长时间盒。P0a 可以否定整个路线；P0b 通过也不代表终端可行。2–4 周仅为三个时间盒合计的上限预算，不保证全部成功完成。Unix socket 和插件样例不阻塞早期判断。

P0 保留在实验分支／worktree，提交可以本地分片，不将运行时依赖或实验代码合入 main。通过 Go 且 P1 投资选择获用户批准后，再提交独立的工具链接入 PR，明确安装步骤、类型生成和 CI 成本；不增加功能专属测试任务，使用现有测试路由及脚本。

撤回此前没有 WBS 支撑的 P1／P2 3–5 人月和全平台 20–35 人月承诺。P0c 结束后，按连接／同步、composer／附件、终端、文件／Diff、通知／presence、插件、桌面打包／升级、QA 分解剩余工作：每项给出已完成证据、依赖、乐观／常规／悲观人日和负责人能力要求。将一次性开发、双客户端维护、NSH 升级单独计入，不用源码行数直接换算工期。

### P0 可执行任务序列

以下是实施任务，当前只写方案；所有 write-set 都位于未来隔离 worktree。表中的 `N` 指 `packages/nsh-client/`，`E` 指该目录下拟建的 `evidence/<run-id>/`。E 保存实验材料，不接入根 workspace。任务编号为引用 ID，执行依赖以下表为准；A2／A3 不等待 A1 完整基线，功能探针先于正式性能测量。前序硬阻塞时交付已有证据并停止，时间盒不因后续清单未完成而自动延长。

| 顺序 / 依赖                                                                     | 允许 write-set                                                            | 产物与证据                                                                                                      | 停止条件                                                                        |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| A1 / 版本固定后；可在 A2／A3 后完成                                             | E                                                                         | Electron release 基线、数据集扩量、内存分布、定向优化成本；冻结 manifest、CPU／收益阈值                         | 基线未冻结只阻止正式 NSH 性能测量，不阻止功能探针；5 日到期仍不完整则阶段不通过 |
| A2 / 先固定 Paseo／NSH／两 daemon revision 与最小 fixture，不依赖 A1 完成       | N 的局部配置、最小入口、探针及 E                                          | SDK eval、纯 stream/sync-plan、Buffer/addon 的功能结果与依赖闭包；初始耗时仅诊断，不用于收益结论                | 需大规模 SDK 重写、React shim 或 NSH fork                                       |
| A3 / A2；不依赖完整 Electron 基线                                               | N 的 connection、platform、native、局部测试及 E                           | Rust 字节／异步 callback／drain；两 daemon hello、密码认证、TLS、大消息直连／relay；不做自管凭据轮换            | 真实 drain、安全或字节正确性失败即 No-go／重估；不能用小包成功替代              |
| A4 / 纯抽取依赖 A2，可与 A3 独立推进；集成正确性依赖 A3，正式性能另依赖 A1 冻结 | N 的 timeline、测试及 E；已列三个纯模块、原入口、session-store 及既有测试 | reducer／副本提交／副作用决策差分、turn／submission 与旧端回归；完整入站、xterm、relay 预算及 P0a 决策          | 抽取超 2 人日子上限、语义不一致、预算未过或 P0a 合计 5 日到期；不自动扩量／延时 |
| B1 / A Go                                                                       | N 的 directory、timeline、ui 及 E                                         | 单主机最小目录／会话页；切换主机和会话后的订阅释放与状态隔离                                                    | 目录更新串主机或关闭后持续增长                                                  |
| B2 / B1                                                                         | N 的 timeline、composer、ui 及 E；dispatcher 按预定 write-set 移动        | Markdown／分页／锚点；RPC 先后 canonical、失败／并发 send、旧 cancel 与新 turn 的原模型用例；冻结 workload 重放 | 内容或 turn／submission 事实错误、历史跳动、需重写状态机                        |
| B3 / B2                                                                         | N 的 ui、平台输入适配及 E                                                 | 中文 IME、跨段选择、复制、resize 的原生录屏和逐轮性能；P0b 决策                                                 | 核心文本交互退步、收益门槛未过或 5 日到期                                       |
| C1 / B Go                                                                       | N 的 native、局部 release 配置及 E                                        | 前两日 Rust objc2 NSView 的 release／签名加载、JIT 条件及二进制帧往返；不要求 Swift 联编                        | release 无法加载／JIT 签名条件不成立或字节通道只能走 JSON                       |
| C2 / C1                                                                         | N 的 terminal、native 及 E                                                | xterm→原生网格全链、TUI／grapheme／选择／resize／重连差分                                                       | 解析语义分叉、选择复制不一致或释放失败                                          |
| C3 / C2                                                                         | N 的实验材料、相邻 tag 局部升级探针及 E                                   | release 对比、两个代表变更移植计时、最小 NSH 升级演练、三种长期选项成本、P1 WBS 与 P0c 决策                     | 10 日到期、升级／成本数据不足或任一门槛未过                                     |

Unix socket、真实插件入口、系统通知、完整附件链和 daemon 自管不在这些任务中。A4 使用已列抽取边界与 2 人日子上限；纯抽取与 A3 无依赖，可由单人交错推进，不要求多 agent 并行；先最小两轮 fixture，再按剩余预算扩量。合计受 P0a 5 日硬停止约束，缺测就 No-go／另报预算，不隐含扩大 write-set，不承诺 5 日必能完成全部数据集。

### Commit、PR 与 P1 估算交接

实验分支建议依次保留六个可回退 commit：固定版本与最小 fixture → SDK/transport 探针及基线冻结 → 最小同步适配 → 聊天交互 → 原生终端 → 决策证据。每步保留对应运行记录；这些 commit 不是向 main 合入的许可。P0 Go 且 P1 投资选择获用户批准后，最小 PR 顺序为：工具链与 CI 接入 → 有证据支持的纯逻辑抽取及旧端回归 → connection/directory/timeline 纵向切片 → composer/附件与 files/Diff → terminal → Unix socket/插件样例/通知等各自集成验收 → P2 分发。每个 PR 依赖前序已验证边界，不按语言把 TSX 与 Rust 拆成无法独立验收的半成品。

P1 WBS 每行填写 `功能与验收场景 | owner/能力要求 | 前置依赖 | P0 已有证据 | 剩余实现 | O/M/P 人日 | QA 人日 | 外部等待 | 风险/未证明项`。按现有八类领域分别拆到可验收切片，不能用总数反推各项。分别汇总 O/M/P 的工作量，再按真实人员和依赖画排期；并行不减少总人日。P2 打包／升级与 P3 平台探索单列，缺证据的格子写“未估”，不能填零。

方案与阶段决策继续归属本文；Go 后建议把脱敏证据索引放入 `docs/qa-evidence/nsh/<run-id>/`（拟建路径），大型 trace、视频及构建产物归档到项目认可的 artifact 存储并记录校验值。P0 的 E 在未合并 worktree 中保留；清理前先完成证据归档，不把唯一原始数据放在待删除的 `/tmp`。

### 通知、presence 与语言

P0 不发送可压制其他客户端推送的活跃 presence，不声称自己能够可靠接收系统通知。P1 将 presence 和权限请求／完成通知作为一项集成验收：只有前台正在查看相应会话时才发布对应活跃状态，失焦、后台或断线立即按现有契约释放；系统通知点击打开正确主机与会话，并测试与手机推送共存。不新增一套 server 推送策略。

P0 使用最小中文测试文案；P1 显式支持现有产品的英文和简体中文基础工作流，复用可脱离 React 的翻译资源，不把 react-i18next hooks 带入 NSH。其他语言在同等覆盖前标为未支持。C1 先验证最小 release 的 JIT／签名条件，P2 再完成 Developer ID／hardened runtime 的完整分发验收，不假定开发构建代表可分发构建。

## 验收与继续投入的门槛

### 功能正确性

| 路径        | 必测行为                                                                                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 连接        | hello 身份与能力快照、密码认证、TLS 系统／私有 CA、超过 8 MiB 消息、relay、断线恢复；不静默降低安全模式                                                                             |
| 目录        | 主机切换、目录实时更新、工作区切换、订阅释放，确保数据不串主机                                                                                                                      |
| 时间线      | 权威历史、整轮分页及一次 capability 检测、重复／乱序、缺口追赶、epoch 重置、子 agent 时间线、计划审批工具身份、乐观消息对账、1–30s 重试、回前台探测、重连与更新状态、切换后迟到结果 |
| 交互        | 阅读历史时仍有新回复、折叠与展开、窗口 resize、中文输入、选择复制、审批提交                                                                                                         |
| 终端        | 持续输出、TUI、中文、emoji、组合字符、resize、恢复、选择和键盘输入                                                                                                                  |
| 插件        | P0 验证未知插件行占位；P1 样例验证 RPC、主机／工作区上下文、主题、卸载时订阅与资源释放                                                                                              |
| 旧版 daemon | 固定实际测试版本；已有功能继续可用，新能力仅按一次 capability gate 开放                                                                                                             |

#### 输入制造与判定矩阵

每例绑定 case ID、fixture hash、daemon SHA、传输路线及预期结果。分两层：纯 reducer／编排通过现有 ports 注入确定性事件和 deferred 响应；连接与恢复用隔离真实 daemon、实际 Rust socket 和 relay。前者证明模型，不能冒充网络或原生验收。真实 provider smoke 单列实际 provider 和认证，不改 provider auth。

| 场景                   | 最小可重复输入                                                                                                                                       | 成功证据 / 失败判定                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| hello / capability     | 对当前 SHA、v0.15.0 各记录脱敏 hello 与 server_info；比较显式配置与 SDK 最终默认值                                                                   | 身份／版本符合方案；有能力只进对应路径，无能力只在入口提示；browserHost 未误报；后台 agent 不新增标签。schema parse 成功不足以通过         |
| 密码认证（P0a）        | 既有 daemon 输入正确／错误密码；受控进程内 harness 用正常 auth 配置验证                                                                              | 正确密码成功、错误拒绝且原因可见，无泄密；不启动自管 daemon 轮换用例                                                                       |
| local credential（P2） | 按上述 daemon-instance／CLI 路径重启专属临时 home 的独立子进程；保留旧值并按真实 pid listen 重读新值                                                 | 旧值拒绝、新值成功；只管理自己创建且核对 PID／startedAt／listen 的实例，绝不伪造 pid 文件                                                  |
| TLS                    | 系统信任证书、已受信任私有 CA、未受信任自签、主机名不符各连接                                                                                        | 前两项成功，后两项失败并保留原因；私有 CA 若需安装，只在获授权的测试环境准备，缺环境记未验证，禁止关闭验证                                 |
| 字节边界               | 直连和 relay 各跑 UTF-8 文本及二进制：8 MiB−1、8 MiB+1、实际 frame budget 附近、32 MiB±1 的逻辑消息、100 MiB−1／等于／+1                             | 按**序列化后字节数**计算，成功内容逐字节一致。逻辑消息可跨帧，不能要求 32 MiB 逻辑消息失败；100 MiB+1 在 SDK／协议边界拒绝，记录层次与原因 |
| relay 预算 / 背压      | 以现存 `maxSecuredPlaintextByteLength(MAX_RELAY_WEBSOCKET_MESSAGE_BYTES)` 为明文边界，分别测边界内外、慢接收及传输中断                               | 记录明文、record、wire 长度；加密余量来自实现而非固定猜值。合法逻辑消息经 SDK 分块；超限单帧在相应层拒绝；断开后半消息和队列释放           |
| gap / 页合流           | 固定 epoch E，先送 seq 1…10，再送 21；after 页覆盖 11…20 且 hasNewer=true，下一页结束；插入重复、迟到和工具更新                                      | 最终 rows／身份／source coverage 与完整权威投影相同；追赶至 hasNewer=false 才 ready；同工具只保留一个位置                                  |
| epoch / optimistic     | E 的 before 请求悬挂时切到 E2 tail，再放行旧页；本地 clientMessageId 在 live 前、后各接受一次历史页；保留一个未确认提交                              | 旧页不污染 E2；已确认消息唯一，未确认提交保留；同 epoch/maxSeq 的恢复不替换显示数组。失败需保存输入顺序与首次分歧                          |
| subagent / approval    | 父子使用各自身份与 cursor，交错投影和分页；原 proposal tool-call 经批准／拒绝及 history replay                                                       | 子页不写父副本，能力缺失只影响子历史；approval 保持原 tool 身份。插件行保留 ID 并显示占位                                                  |
| 取消 / 重试            | 悬挂 fetch 后关闭／切换会话，再完成旧 Promise；连续失败后成功；模拟前后台与掉线                                                                      | 迟到结果不改新目标；按既有 1–30s 退避且成功复位；真实断线后 authoritative catch-up 完成才宣告更新完成                                      |
| terminal               | 固定 grapheme corpus 和 ANSI 流，按 1/7/4096 字节切片含 UTF-8 中间边界；alternate screen TUI、bracketed paste；120×40→80×24→120×40，输出中断网重附着 | 与同 revision xterm/capture 比较字符、宽度、颜色、光标、选择文本和恢复尺寸；NSView 截图检查真实 glyph 与裁剪，网格正确不能替代绘制正确     |

A4 的同 fixture 双调用方差分必须覆盖：cold→painted→synced、空权威页、discard 仍退休 canonical submission、before 不覆盖 newer、init 成功／失败／迟到、generation 无变化不通知、tasks 从权威页恢复及 stream taskSnapshot 去重、cursor 已覆盖／相同边界不回退。分别断言纯转换输出与旧 store 实际状态一致，并记录副作用调用顺序：只有 synchronized 且 directory agent.turn idle 才排 queued-send，错误先 reject 而非 resolve；NSH adapter 不能自行补写这些规则。复用 `stores/session-store.test.ts`、`timeline/session-stream-reducers.test.ts`、`timeline/viewed-timeline-sync.test.ts`，不新建通用状态测试框架。

B2 另用现有 submission／turn 测试数据验证：RPC 成功先到而 canonical 未到时活动不提前结束；canonical 先到、RPC 后成功或失败时行不回滚；未确认 send 失败按现有 writer 结果恢复可重试状态；两个并发 send 交错确认／拒绝各自结算。分别以 `canonicalSubmittedPrompts` true／缺失进入现有 writer 分支。snapshot 开启 turn-2 后迟到的 turn-1 close 不结束它，取消 request-1 结算不清除 request-2，旧 turn 的 cancel 返回不清掉新 turn；活动与取消状态不存进局部组件 boolean。

C2 增加宽度能力 true／缺失两组，同一 corpus 使用相应表对照 daemon capture；布局未测得时断言无 attach/replay，首次 attach 与重连记录实际 rows/cols，resize 后回放按新尺寸一致。沿用 `terminal-size-measurement.test.ts` 与 `terminal-frame.test.ts` 的布局输入，原生加载与绘制另验。

32／100 MiB 接近上限的样本逐个执行，避免并发样本触发输出队列保护而混淆单消息上限。大包先在 transport／chunking seam 证明，再选真实 RPC 合法载荷证明业务路径；不能借 timeline 大页测试所有边界，因为服务端会裁剪单条内容。每种负例的预期拒绝层由固定 revision 的现有测试／常量确定，不擅自统一为某个 close code。

### 性能测量

使用同一台 macOS 设备、同一批会话和相同终端输出，比较旧客户端与 NSH 的 release 构建。固定 NSH、客户端、daemon 和 OS revision，记录硬件、数据量、预热方式、采样窗口及原始结果。

覆盖冷启动、空闲、长历史浏览、流式回复、终端持续输出。每种场景重复至少五轮；启动报告逐轮数据、中位数和范围，不能用五次启动估算可靠 p95。交互场景每轮收集至少 200 个输入／更新样本，并报告 p95；内存统一使用相同系统口径。分别记录客户端进程树和 daemon，不把保留的 Node daemon 算作客户端节省量。

SDK 求值、字节通道及认证功能探针可先于完整 Electron 基线，其耗时只作诊断。正式 NSH 微基准／收益测量前必须完成 A1 基线并冻结输入、指标和阈值；冻结后才据结果判断投入。建议门槛：同功能负载下客户端总内存中位数至少降低 30%；输入到可见更新 p95 不超过基线的 110%，且增加不超过 8 ms；超过目标刷新周期的帧比例不高于基线加 1 个百分点；冷启动或长历史首屏可交互时间中位数至少降低 20%。这是投资标准而非性能预测，不得在看到 NSH 结果后放宽。纯解析／加密微基准另报 MB/s、每批耗时及峰值堆占用，不与 UI 输入延迟混用。

资源统计包含所有客户端子进程。双方关闭不参与比较的浏览器和插件；同时单独列出首版裁剪项及原版完整工作负载，不能把删去功能产生的节省当成框架收益。

#### 入站 CPU、处理滞后与队列门槛

A4 正式微基准覆盖完整 SDK 入站路径：固定 UTF-8 wire fixture 经真实 `DaemonClient` transport 消息入口进入 `handleJsonPayload` 的 `JSON.parse`、`validateWSOutboundMessage` 生成 validator、SDK 分发，再到共享 stream／timeline reducer。Node 与 QuickJS 使用同一 revision、同一 wire 字节和初态，不能跳过 parse／validator 或只计 reducer。使用现有 `paseo.ws.json.parse`／`paseo.ws.validate` trace 边界并记录 reducer commit；测量接线只在实验探针，不改消息语义。

先最小 fixture 核对输出，再测 D2 的 60s 持续输入和 D1 的真实权威分页 burst。D1 固定 10 个连续页面（包含最大完整 turn 页，40 items 不是硬上限），一次 burst 在源端就绪，按下述双页消费窗口输入并保存每页字节数，最后核对状态 hash。xterm、relay 分开测，再按相同接收速率测组合路径，避免单项通过掩盖 JS 线程饱和。typed transport 注入证明 CPU 路径，真实网络另由 A3 证明。建议持续输入预算同时固定为 D2 20 updates/s、D3 终端 1 MiB/s（4 KiB 分批）、D4 relay 有效明文 1 MiB/s（固定 64 KiB 分批），先分别跑再组合；组合若让 D3 经 relay，relay 必须跟随 D3 的 4 KiB 分批，不能改套 D4 的 64 KiB，也不重复计算同一终端字节流；D4 64 KiB 仅用于独立 relay 微基准。均为可在 A1 修订并冻结的负载假设。大消息边界样本单独测正确性和单次成本，不混进该持续速率门槛；不能通过降低输入速率掩盖正式结果。

以下是 A1 **待冻结的预算假设**，不是预测：按每批输入间隔 Δ、处理 wall time T、CPU time C、实际字节 B 记录 `T/Δ`、`C/Δ`、`B/Δ`；持续场景组合 JS 路径平均 CPU 不超过一个逻辑核的 50%，每批 p95 wall time 不超过 Δ 的 50%（D2 20/s 时为 25ms）。CPU 按实际线程 CPU 秒／采样秒计算；不可取得则标缺测，不能以 wall time 冒充 CPU。

记录预定到达、实际进入回调和 reducer commit 时刻；离线 probe 保留计划时刻以暴露事件循环阻塞。持续场景 input-to-commit p95 ≤100ms，包含现有 reducer 的合批等待（兜底调度配置为 48ms，实际等待须实测，不视为严格时延上限）；manifest 单列实际调度方式、配置上限与实测等待，CPU／同步处理耗时不计该等待，端到端延迟只计一次，禁止漏算或双算。待处理数据峰值 ≤`max(冻结持续 fixture 中最大实际输入帧字节数, 持续速率字节/s × 0.2s)`，停止输入后 1s 内队列回空，60s 窗口无持续积压。D1 的 10 页 burst 单独要求 2s 内 commit 完成、CPU 总量 ≤1 个核秒、最大单批同步处理 ≤100ms、消费侧峰值待处理字节（含正在解析／等待 commit 的页，排除外部只读 fixture 源）≤冻结 burst 中最大单页字节数的 2 倍。burst 在源端同时就绪，但按消费完成释放下一页，只允许一页处理、一页等待；源端等待计入 2s 完成时间，合法页不丢弃／截断。CPU probe 的该调度不能冒充 Rust 网络背压已验证，真实 transport 队列由 A3 另测；不得拆小非法页面绕过整轮语义。记录 Node 绝对值与 QuickJS 比值；输出不一致、冻结预算未过或不可测均不能写“吞吐无硬阻塞”。这些预算不替代 P0b 原生 input-to-paint 门槛。

P0 首先复用 JS crypto。若 CPU／滞后预算失败，当前阶段 No-go；允许另报 Rust crypto 优化提案和预算，但须独立兼容审查：既有测试向量、逐字节 wire 互通、相同握手／record／密钥生命周期和错误行为、安全审查及重新测量。未批准不实现、不自动切换、不做 fallback、不修改 server；不能以未来可能优化视为当前通过。

#### 冻结数据集与测量边界

以下规模是**建议的实验假设**，不是用户负载统计；A1 可按已有真实脱敏样本修订，在正式 NSH 性能测量前冻结；前置功能探针只用最小 fixture。合成数据和真实会话分别报告，不混为生产代表性结论。

| 数据集        | 固定形状与操作                                                                                                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D0 启动／空闲 | 相同一个主机、20 projects、100 workspaces、200 agents 的目录负载；仅打开一个空会话，禁止为其他 agent 预取 timeline／恢复 provider；连接后空闲 60s                                                     |
| D1 长历史     | 1,000 turns、约 10,000 projected items；每轮固定 user、assistant、reasoning、tool 的组成；文本含中文／emoji，正文 1–4 KiB、工具输出 4–16 KiB；manifest 保存精确分布。打开尾部后逐页回看并折叠、resize |
| D2 流式与合流 | 固定 60s 事件脚本，20 updates/s、每次 256 UTF-8 bytes，夹入工具生命周期；同时阅读历史、接收新输出，再断线 3s 恢复。速率是输入脚本，不是预期性能                                                       |
| D3 终端       | `createNativeTerminalBenchmarkPayload` 固定 startLine/lineCount/cols，建议 10,000 行、120×40、相同 scrollback；固定 4 KiB 分批输入。另跑 grapheme 和 TUI corpus，不用 ASCII 吞吐代替字符正确性        |
| D4 relay      | 同一批固定 hash 的 1 KiB、1 MiB、8 MiB+1 载荷与边界样本；相同 security mode、线路和发送节奏。单独比较 crypto、SDK+transport、完整 UI 三层                                                             |

D0／D1 的数据准备使用隔离真实 daemon 的测试 provider，不调用真实模型生成负载。现有入口为 `packages/server/src/server/test-utils/paseo-daemon.ts` 的 `createTestPaseoDaemon({ agentClients })`，以及 `test-utils/fake-agent-client.ts` 的 `createTestAgentClients({ historyEvents: [] })`；空 history 防止 provider 历史另带未冻结内容。这是现存注入接口，仓库尚无一键生成上述规模的数据集脚本。

拟定准备步骤：在专属临时目录建 20 个 project 目录，经现有 `DaemonClient.addProject`、`createWorkspace`、`createAgent` 创建 100 workspaces／200 agents，显式保存返回的 workspaceId 与 agentId 映射；每个 workspace 两个 agent，保留一个空会话给 D0。D1 在其中一个 agent 中按固定顺序加入 1,000 轮输入。沿用 `packages/server/src/server/cli-agent-logs.test.ts` 已有路径：通过该测试中 `ctx.daemon.daemon.agentManager.appendTimelineItem`（直接持有 `createTestPaseoDaemon` 返回值 `daemonHandle` 时为 `daemonHandle.daemon.agentManager`）注入 user／assistant／reasoning／tool 项，再经客户端 `fetchAgentTimeline` 读取实际投影。此 API 是 Node 测试侧入口，不增加产品 RPC，也不从 NSH 直接调用。

D1 的约 10,000 items 是投影后的目标，不能把 10,000 次 append 当成 10,000 行；为各轮及工具固定身份，按现有 `stream.harness.test.ts` 最小提取合法 fixture 形状，准备脚本与数据仍待实现。先用两轮检查合并、轮次与分页语义，再扩到目标规模，遍历实际权威分页核验轮数、item 数与文本字节分布，并把服务端生成的 ID／时间戳及最终投影 hash 一并冻结。若现有注入无法表达要求的历史语义，停止扩量，改为录制固定脱敏会话并经现有 `historyEvents`／`streamHistory()` 路径验证加载；具体录制文件及 hash 必须在 A1 提供，不能声称已有 generator。无法获得满足条件的数据则该场景未验证。

Electron 与 NSH 使用同一 Paseo revision 的 SDK／业务基线，连接同一固定 revision、同一实例、同一批实体。数据准备完成后停止注入，先保存权威快照，再串行测两个客户端；一方采样时另一方退出，禁止后台 provider 写入或第三方观察者改变负载。每轮前后核对投影 hash；D0／D1 不发送新消息。需要写入的 D2 使用单独固定回放目标，逐轮重置到同一逻辑初态并核验，串行重放，不与 D0／D1 混测；准备、重置和预热时间不计入 UI 采样。P0a 双方固定使用同一 TCP 连接类型；Electron 的 Unix socket 原版负载可另列，不能混入框架收益。客户端测试顺序、TCP／Unix socket／relay 类型与 cache 状态写入 manifest，避免先测者承担独有的 daemon 冷加载成本。

冷启动从系统启动进程请求到首屏可输入且目录可操作；标记宿主初始化、JS runtime ready、SDK module eval 开始／结束、握手、首数据和首 paint。进程冷启动与磁盘 cache 冷启动分别命名，不擅自清系统 cache。相同配置做至少五轮冷启动，另报暖启动；“窗口出现”不等于可交互。

input-to-paint 从原生输入事件采样到对应内容真正显示，网络流更新另从客户端收到事件起算；不得把请求 RTT 或 setState 返回当 paint。跨 Rust／JS 时间戳先校准单调时钟偏移，保留校准误差；无可信 paint 时间戳时以原生录屏／可验证标记补证，标“未测得”，不能以回调耗时替代。帧比例以连续交互窗口的实际 present 间隔统计，记录屏幕刷新率，排除空闲不绘制时段。

内存每秒记录双方客户端完整进程树的同口径 footprint／RSS、峰值、稳定段中位数，另列 daemon。JS heap 与 Rust／原生内存分别记录可观测部分；QuickJS 无可用 heap 指标时明确缺测，不能用 RSS 假冒 heap。终端同时记录解析、frame 构造、编码、跨桥、present 各阶段；relay 报有效明文 MB/s、wire MB/s、加解密耗时、队列峰值和 JS heap。保留有 profiler 与无 profiler 两组，防止采样开销改变结论。

拟定 `manifest.json` 最少包含 run ID、时间、硬件／OS／屏幕、电源状态、所有 SHA／dirty patch hash、依赖锁与工具链版本、release 构建参数、daemon 认证与 security mode（不含秘密）、Electron 与 NSH 的 TCP／Unix socket／relay 类型、数据 hash、随机 seed、尺寸／字体／scrollback、操作脚本、预热／采样窗口、采样器版本、冻结阈值和失败判据。每轮原始 CSV/JSONL、阶段日志、截图／录屏、命令和退出码分别归档，结果表引用原始文件，不仅保存平均值。

阶段决策模板：`阶段/负责人/日期 | manifest hash | 必测 case 通过/失败/未测 | 基线与 NSH 原始结果链接 | 正确性硬阻塞 | 性能逐门槛结果 | 已裁剪功能 | 维护成本与置信边界 | Go 或 No-go | 长期选项及一次性/月度成本 | 用户批准人/日期/范围（未批准则空） | 下一阶段允许范围/预算`。失败与未测不得写成通过；Go 仅授权评审下一阶段，不自动允许合入 main。

维护成本也是独立门槛：记录 P0 期间 app／client／protocol 的行为变更，按去重后的实际功能而非提交数量，标明是否影响首版、能直接共享还是要二次实现。实际移植至少两个代表性变更（一个协议／同步、一个 UI 行为），记录人日，再估计每月追赶成本。建议常规追赶不超过 5 人日／月，悲观不超过 10 人日／月，且不会让核心兼容修复落后一个发布周期；超过门槛或样本不足以估算时不建议进入 P1，先缩范围或补证据。

维护成本按观察窗口 W 个工作日计算：先把变更去重为行为条目，再分为可直接共享、需同步适配、需重做 UI 三类。每类记录影响首版的条目数 N、实测单项人日 C（含回归和发布验证）；常规月成本拟按 `20/W × Σ(N × C) + 固定双端回归成本 + NSH 升级摊销`，20 个工作日是假设，manifest 中固定。悲观值用每类较高成本和已观察的高变更量，不用任意倍数。两个移植样本至少覆盖同步与 UI；找不到真实代表变更、窗口过短或某类没有样本时标“无法可靠估算”，不得把该类计零。迁移的一次性成本不混入月度追赶，安全／兼容紧急修复的最大落后时间单独列出。

P0c C3 比较 NSH 实验 tag 与相邻已发布 tag 在实际使用 API 上的 breaking delta：TSX 响应式、List/TextView props/events、Rust classes 字节接口／异步 callback、objc2 构建和签名。窗口内无新 tag 就用既有相邻 tag，不能以“未升级”计零。用最小 app 做一次升级演练，回放 SDK 字节往返、一个文本交互及 NSView release 探针，记录改动、失败、迁移／QA 人日和回退 revision。计入 C3 现有维护预算，不升级全产品；到时间盒证据不足则不建议 P1。升级摊销为实测单次成本乘明确的预期频率，给频率依据／区间。

P1 投资前必须填完以下选项成本；推荐第一项的条件目标，不在本轮选择或承诺替代时间：

| 长期选择                        | 必须列出的成本与门槛                                                                                                                                                                                         | 用户批准栏                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| 有条件替代 Electron（推荐目标） | 除首版 WBS，逐项列 browser/automation、完整 editor、schedule、voice、多窗口、完整客户端插件、routed hosts／SSH 的缺口、O/M/P 补齐及 QA 成本；取消某项须用户明确批准。功能、迁移／回滚验收完成前保留 Electron | 待用户选择；P0 Go 不批准替代 |
| 受限长期并存                    | 明确两端工作流与不支持项；两套插件 API 的作者适配、文档、发布、兼容测试与支持成本永久计入月维护，加双端追赶与 NSH 升级摊销，仍须通过维护门槛                                                                 | 待用户接受持续成本与范围     |
| 停止                            | 记录已投入、证据保留和收尾成本，列 Electron 定向优化后续预算，不以新伴侣产品默认替代                                                                                                                         | 待用户确认停止／另案投资     |

选项未决、缺口成本仍“未估”或升级样本不足，可以交付 P0 可行性结论，但不能形成 P1／P2 产品化承诺。首版裁剪保持不变，估算缺口不等于将这些功能加入 P0／P1 实现。

Electron 内存剖析纳入 P0a 的 5 个工作日时间盒，随基线交付进程内存分布、主要占用来源及定向优化的成本估算；不能留到 P0c 才准备。将其作为替代方案：若低成本定向优化足以达到相近目标，优先该路线。菜单栏监控伴侣是另一项产品范围选择，若完整客户端 No-go，可提交独立提案，不能自动替换本方案目标。

若关键 SDK 依赖无法合理适配、终端需要长期维护另一套语义、核心文本交互退步，或必须维护大幅修改的 NSH fork，则不进入 P1。保留实验结论和可复用测试，不自动扩大方案。

## 测试与改动清单

单测覆盖新领域逻辑和适配层；真实 daemon 集成验证现有认证、RPC 与订阅，复用现有 harness 和测试入口；NSH 原生交互另做 macOS 验证。真实 provider smoke 使用现有实际认证，不给测试添加 provider auth skip。遵循 [Testing](testing.md) 和 [QA](qa.md)。

| 阶段                      | 预计修改位置                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| P0                        | 实验 worktree 内新增 `packages/nsh-client/`；局部构建和验证配置，不改根 workspace／lockfile／Nix／默认 CI                  |
| P0 已知抽取／其他实际缺口 | A4 三个纯模块、session-store／原入口接线及定向测试；B2 dispatcher 按预定边界移动；其他 client 适配先列实际阻挡，不批量重构 |
| P1／P2                    | 新包内的对应领域与平台宿主；必要的桌面打包和 CI 配置                                                                       |
| 文档                      | 本方案维护决策和阶段出口；实现后将现行架构与开发要求整合回所属文档                                                         |

已有仓库改动运行 `npm run typecheck`、`npm run lint` 和改动对应的定向测试；独立实验包另显式运行 NSH 类型生成、检查及原生 release 构建，不能把根 typecheck 通过当作它已被覆盖；提交前使用仓库格式化脚本。跨包声明失效时先重建拥有它的依赖栈。不在本机跑全量测试套件，不把 headless／模拟器证据当作原生实机验收。

## 隔离与回滚

实现阶段从核实后的基线 ref 创建主仓库内 `.worktrees/`，确认主仓库忽略该目录，并按主项目注册 local Paseo workspace。构建依赖和项目 setup 显式执行；不修改已有会话的 checkout。

新应用使用独立 bundle ID、连接配置、Keychain service 和缓存目录。旧客户端缓存不迁移；daemon 数据继续由 daemon 管理。关闭实验客户端仅释放其连接、订阅和自有进程，不归档 agent、不删除 workspace，也不停止外部 daemon。

P2 的托管 daemon 单独明确所有权：只能管理本应用启动的实例。退出、更新、崩溃恢复都必须验证所有权，不能按固定端口杀进程。端口 6767 的现有 daemon 不在实验重启范围。

每个阶段可撤销新增客户端包及接线，保留原产品入口。worktree 合入目标分支后按仓库清理规则当轮移除；尚未合入时保留，不强制删除。

## NSH 依据与待验证项

当前调研以 NSH v0.4.0 和调研时的 main 文档为参考；正式实验先核对 tag 与文档能力差异，再固定实际使用的 revision。

- [NSH repository](https://github.com/longbridge/nsh)：平台、授权与组件路线。
- [Project structure](https://nsh.dev/docs/project-structure/)：TSX 工程和 npm 包兼容边界。
- [Native components](https://nsh.dev/docs/native-components/)：应用自己的原生视图与桥接。
- [WebSocket credential headers issue](https://github.com/longbridge/nsh/issues/942)：旧版认证头兼容风险；当前 hello 认证不以该 issue 作为阻塞，传输优先解决帧上限和字节通道。
- [Remote push issue](https://github.com/longbridge/nsh/issues/1058) 与 [Realtime audio issue](https://github.com/longbridge/nsh/issues/1060)：移动端扩展前核对的能力项。
- [Web routing issue](https://github.com/longbridge/nsh/issues/1030)：Web 扩展时核对地址、刷新与深链接契约。
- [Performance report](https://nsh.dev/docs/performance-report/)：用于设计复现实验，不用于推导 Paseo 的性能收益。

### 按阻断顺序安排未决实验

| 优先级         | 最小验证 → 成功／失败证据 → 下一步影响                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 / P0a        | 固定 revision 后实际求值 SDK、reducers、crypto 和 xterm → 完整依赖闭包及确定性输出，或首个不支持 API／必须 fork 的位置 → 决定是否值得写 UI                |
| 2 / P0a        | Rust TCP 字节往返、真实 drain、TLS、认证、relay 大包 → 事件 trace／hash／内存回落，或无法满足系统信任与字节所有权 → 决定连接路线是否成立                  |
| 3 / P0a        | A2 后抽取同步及单 agent 提交／副作用决策，与 A3 可独立交错 → 与旧端一致且回归通过或超 2 人日／需搬完整 store → A3 后验集成，A1 后验性能                   |
| 3b / P0a       | A1 基线与预算冻结后跑完整入站 JSON+validator+reducer、xterm／relay → CPU、滞后、队列预算及原始数据或失败／缺测 → 决定 P0b；5 日不延时，自管凭据轮换留 P2  |
| 4 / P0b        | NSH release 的 IME、选择、长历史和流式 paint → 原生交互证据及冻结指标，或核心交互退步 → 决定是否继续终端投入                                              |
| 5 / P0c 前两日 | 签名 release 加载 NSView 并传二进制帧 → 可重复构建与生命周期证据，或只在 debug 可行 → 验证默认 Rust objc2 路线，失败停止网格开发，不追加 Swift 联编必做项 |
| 6 / P0c        | 完整终端、同负载对比、代表变更移植与相邻 tag 升级 → 正确性、收益、维护门槛全过或失败／缺测 → 形成 P1 WBS 与三种长期选项成本，用户选择前不承诺产品化       |

P3 尚未证明 Android/iOS 的输入法、选择、后台连接恢复、系统推送、原生终端及分发条件；Web 尚未证明路由／刷新／深链接、浏览器网络安全约束和相同 SDK 的运行时闭包。macOS 的 Rust transport／AppKit 结果不能证明这些平台；届时分别做最小 release 与核心工作流实验，再决定范围和预算。公开 issue 或组件文档只能提出验证问题，不能作为这些能力在 Paseo 中已可用的证据。

评审重点：P0 是否能在预算内给出决策；SDK 和字节桥接路线是否成立；终端和时间线是否遗漏关键语义；插件迁移是否越界；性能比较是否公平；是否存在比重写更小且收益接近的替代路线。
