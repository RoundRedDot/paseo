# 桌面客户端 UI 技术选型方案

调研日期：2026-10-16。状态：候选筛选完成，尚未进行原型验证或最终选型。

## 目标与边界

保留 Paseo daemon，评估自研桌面客户端，重点改善安装体积、启动、常驻资源和复杂界面交互。当前架构及客户端边界见 [architecture.md](architecture.md)，协议与能力协商见 [protocol-compatibility.md](protocol-compatibility.md)。

本方案保存本次讨论的证据与判断，不代表已经决定替换 Electron，也不包含移动端重写。框架版本、维护者组织关系和社区动态均为调研时点快照，立项前需要复核。

## 当前建议

优先比较两条路线：

1. **Tauri + React：复用路线。** 复用现有 Web UI、TypeScript SDK 和富文本/终端生态，替换 Electron 的桌面桥接能力。与 MyGo WebView 模式直接对比。
2. **GPUI + GPUI Kit、MyGo 原生 UI：原生重写路线。** 面向聊天、终端、多面板和长列表，分别验证 Rust 与 Go 实现。MyGo 已有相关组件，提升为第一轮原生原型的对照候选；第三方交付案例证据仍弱于 GPUI + GPUI Kit。

egui 和 Iced 保留为原生方案对照；Dioxus 提高关注；Slint 放入第二梯队。现有 Electron 客户端作为功能与性能基线。

这些优先级是架构适配与生态证据判断，没有同负载性能实测。Rust、Go、GPU 绘制或不打包浏览器引擎，都不能单独证明完整客户端会更快。

## 筛选标准

| 维度         | 采用的证据                                                 | 判断边界                               |
| ------------ | ---------------------------------------------------------- | -------------------------------------- |
| 社区活跃度   | 近期正式发布、参与贡献者、持续修复、维护者响应与维护集中度 | Stars 和一次热门发布不能替代维护证据   |
| 案例丰富度   | 独立应用、组件展示、接近聊天/终端/工作台的实现             | 区分 demo、开发中应用和已交付产品      |
| 成功案例     | 可安装且持续发布的实际产品、明确公开的技术采用             | 产品采用不等于公开了性能或商业成功指标 |
| 开发者背景   | 作者过去交付的产品、框架经验、持续维护团队                 | 作者知名度不能替代当前框架的成熟度     |
| Paseo 适配度 | SDK 复用、文本与终端、浏览器、桌面 API、跨平台交付         | 本项目的关键路径优先于泛化排名         |

## 候选比较

表中“建议”是本方案判断，来源支持各自的架构、维护或案例事实。

| 方案                                                                          | 技术路线                                         | 社区与产品证据                                                                                                                      | 主要成本或边界                                                                 | 建议                                    |
| ----------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------- |
| [Tauri](https://v2.tauri.app/start/) + React                                  | Rust 外壳 + 系统 WebView                         | 2026-10-14 发布稳定版 2.12.4；GitButler、Yaak 有明确采用与持续交付证据 [S1–S4]                                                      | Electron IPC、浏览器及桌面能力需要适配；Web 渲染开销仍在                       | 复用路线主候选                          |
| [GPUI](https://gpui.rs/) + [GPUI Kit](https://github.com/longbridge/gpui-kit) | Rust UI + GPU 绘制                               | Zed、Longbridge Pro；Kit 0.7.1 于 2026-10-05 发布，列出 27 位贡献者；提供虚拟列表、Dock、Markdown、编辑器 [S5–S8]                   | 重写 UI 和协议客户端；跟进 GPUI 与组件库的匹配版本                             | 原生重写主候选                          |
| [egui / eframe](https://github.com/emilk/egui)                                | 即时模式 UI                                      | 0.37.0 于 2026-10-15 发布；Rerun Viewer 明确使用 egui + eframe；作者 Emil Ernerfeldt 为 Rerun CTO、联创，曾任 Algodoo 主程 [S9–S11] | 需要验证聊天文本选择、输入、布局与交互成本                                     | 原生工具工作台对照                      |
| [Iced](https://github.com/iced-rs/iced)                                       | Elm 风格状态、消息与视图模型                     | Halloy 为实际 IRC 客户端；COSMIC 的 libcosmic 基于 Iced；正式版 0.14.0 于 2025-12-07 发布 [S12–S15]                                 | 上游审阅集中，官方 FAQ 提醒 PR 可能等待数月；COSMIC 控件不能全部视作 Iced 自带 | 聊天与多窗格对照                        |
| [Dioxus](https://github.com/DioxusLabs/dioxus)                                | Rust 声明式 UI；WebView 与原生渲染分支需分别评估 | Jonathan Kelley 团队 2026-09-10 加入 Cognition；官方确认在 Devin 中使用并继续支持相关开源项目 [S16–S18]                             | CLI/TUI 采用不能证明原生 GUI 成熟；原生渲染仍需单独验证                        | 提高关注，暂不替代主候选                |
| [Slint](https://slint.dev/)                                                   | `.slint` 声明式 UI + Rust 等业务逻辑             | Qt/Trolltech 背景团队；OTIV、WesAudio、SK Signet 具名案例；1.18.1 于 2026-09-21 发布 [S19–S21]                                      | 案例重心在 HMI、嵌入式和插件；需评估许可、复杂文本和终端集成                   | 第二梯队                                |
| [MyGo](https://github.com/egoist/mygo)                                        | Go + 系统 WebView，或 Go 编写的自绘原生 UI       | 官方提供虚拟列表、流式 Markdown、编辑器、diff、终端与嵌入 WebView；EGOIST 有 tsup、cac、ChatWise 等项目背景 [S22–S28]               | 组件覆盖不等于完整产品验收；需实现 Go 协议客户端；未核实到同等级第三方交付案例 | 原生原型对照候选；保留 WebView 换壳对照 |

其他已调研方案包括 [Floem](https://github.com/lapce/floem)、[Freya](https://github.com/marc2332/freya)、[Makepad](https://github.com/makepad/makepad)、[Xilem / Masonry](https://github.com/linebender/xilem)。本轮未收集到足以优先于主候选的同类交付证据，因此不进入第一轮原型；这不代表这些项目缺乏价值或维护。

## MyGo 原生组件与接入评估

补充核验日期：2026-10-16。以下能力来自官方文档与公开 API，尚未在 Paseo 原型中运行验证。MyGo 的原生 UI 由 Go 编写并自行绘制，不表示所有组件均为系统原生控件；终端插件还依赖打包的 `libghostty-vt` 原生库。

| Paseo 所需能力         | MyGo 提供的基础                                                 | 可复用范围与待补部分                                                                               |
| ---------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 设置、菜单、弹窗与搜索 | Button、Form、Popover、Dialog、Toast、SearchField、Autocomplete | 可直接作为基础组件；校验、配置与业务行为需要接入 [S24]                                             |
| 工作区与文件侧栏       | Sidebar、Tree、Outline、Table、虚拟 List                        | 可组合实现；加载、订阅、排序、选中与业务状态自己管理 [S24]                                         |
| 分栏与标签页           | 横向/纵向 Split、Tabs、拖放基础能力                             | 可搭建布局；Split 为双面板分隔器，不能由此推断完整 Dock、标签重排或跨窗拖拽已经具备 [S24、S27]     |
| 聊天正文               | `ui/markdown` 的 `View`、`Stream`，增量解析与选择复制           | 支持完成文档和流式回复；跨消息选择、历史虚拟化、图片加载后的定位、工具调用卡片仍需组合与验证 [S25] |
| 文件与 diff            | `ui/editor` 代码编辑器及 diff viewer                            | 可作为预览与编辑基础；daemon 文件读写、诊断与语言服务需要接入 [S26]                                |
| 终端                   | 基于 `libghostty-vt` 的终端插件、外部 `Conn`                    | 接入 daemon 的现有终端；协议、快照、重连和尺寸所有权仍需适配 [S28]                                 |
| 内嵌浏览器             | 原生 UI 中嵌入系统 WebView，页面导航、脚本执行与截图接口        | 可以嵌入网页；配置持久化、登录弹窗、焦点与浏览器自动化需单独验证 [S27]                             |

Markdown 提供 `markdown.View` 显示完成文档、`markdown.Stream` 显示增长中的回复。官方描述了增量解析、未完成语法处理和平滑显示，因此无需预设从零编写渲染器；长历史和复杂消息的性能仍须实测。Go UI 组件不能直接复用现有 React 组件与 TypeScript SDK。[官方 Markdown 文档](https://mygo.egoist.dev/docs/ui/markdown)

终端的 `terminal.Options.Conn` 可连接自定义读写流，连接实现 `Resize(cols, rows int) error` 时会接收尺寸回调。Paseo 可通过适配层将输出、输入和 resize 映射到 daemon 终端协议；`Conn` 本身不实现 Paseo 的订阅、快照和重连语义，也不能直接假设两种终端快照格式兼容。插件需要随应用分发 `libghostty-vt`，应验证各目标架构的库、签名和最低系统要求。[官方终端文档](https://mygo.egoist.dev/docs/plugins/terminal)

当前判断：组件覆盖足以支持“工作区侧栏 + 聊天 + 终端 + 文件预览”的原生 MVP 验证。与 GPUI Kit 比较时，应记录达到同一功能范围所需的实现代码、适配成本、交互缺陷和性能数据。组件清单较完整与成熟第三方产品案例不足是两项独立事实，分别保留为能力判断和交付风险。

## 近期 X 讨论与证据边界

本轮检索的 X 原帖部分返回 403 或无法读取，部分内容来自搜索缓存和公开镜像。未取得完整实时搜索结果与可比互动数据，不能据此给出“当前最热”排名。缓存中的相对时间不能换算成可靠的原帖日期。

### GPUI Fast：保留式渲染与原生内容混合

Jason Lee 的 [X 内容缓存](https://source.twstalker.com/huacnlee)及[转发缓存](https://www.instalker.org/wuvidy)展示了 retained mode、滚动 CPU 优化和 WebView 混合布局。官方 [GPUI Fast 仓库](https://github.com/longbridge/gpui-fast)能交叉验证实现方向，也明确标注该项目仍为实验性 fork。

该仓库公布了 Linux release-build 的特定负载对比，例如侧栏滚动 CPU 时间从 5.95 ms/frame 降至 0.79 ms/frame；不同用例的 baseline 定义不同，结果依赖负载。这些数字只能视为作者公开基准，不能归到上游 GPUI、不能与 Electron 直接对比，也不能推算 Paseo 收益。

原生内容混合与 Paseo 的内嵌浏览器需求相关，但层叠、焦点、输入、自动化、平台支持仍需实测。第一轮原型应记录所用的是上游 GPUI 还是 GPUI Fast，不混用两者的成熟度与性能证据。

### Dioxus：团队加入 Cognition

2026-09-10 的 [X 公告链接](https://x.com/cognition/status/2098109121169883237)可通过 [Cognition 官方公告](https://cognition.com/blog/welcoming-dioxus)交叉验证。官方说明将继续支持 Dioxus、Blitz、Taffy、Subsecond，并增加对 Dioxus-Native 和 Blitz 的投入。

[作者说明](https://dioxuslabs.com/blog/joining-cognition/)页面标为 draft，其中具体提到 Devin CLI 的终端渲染器，也说明加入后团队完全投入 Dioxus 的时间会减少。组织支持是正面信号，原生桌面聊天工作台仍需独立证明。

### Tauri：Epic Launcher 预览版讨论

2026-10-15 的[社区摘要](https://rustcc.cn/article?current_page=1&id=19dc74d5-e41b-4919-8a56-d8bdc2613eb3)记录了新 Epic Launcher 预览版与 Tauri 的讨论，引用 [Epic X 帖文](https://x.com/EpicGames/status/2110369347592229333)。本次读取的 [Epic 官方说明页](https://store.epicgames.com/news/epic-games-launcher-preview)没有写明 Tauri，故暂不计入已核实采用案例，也不引用评论中的包体和启动数字作为性能证据。

## 接入成本与性能预期

两条路线均通过 daemon 能力边界接入。WebView 路线可使用 [TypeScript SDK](../packages/client/README.md)；原生 Rust/Go 路线需要实现相应协议客户端，覆盖身份认证、能力协商、请求关联、订阅生命周期、重连、历史补齐及二进制帧。

终端必须显示并控制 daemon 已有会话，不能以另建本地 PTY 替代。完整替换还需盘点 Electron 承担的本地/SSH 传输、daemon 生命周期管理、内嵌浏览器、浏览器自动化、菜单、剪贴板、通知与发布更新。

| 性能目标               | 换壳路线                                               | 原生 UI 重写路线                                   |
| ---------------------- | ------------------------------------------------------ | -------------------------------------------------- |
| 安装体积               | 不随应用打包浏览器引擎，有缩小空间；系统运行时成本另计 | 有缩小空间；字体、图形库、资源与打包方式仍影响结果 |
| 冷启动与常驻内存       | 有改善潜力，需统计 WebView 子进程                      | 有改善潜力，需包含图形和文本资源                   |
| 长聊天与流式 Markdown  | 现有解析、状态更新和渲染成本仍需优化                   | 可重新设计，但虚拟化、文本布局与增量解析决定结果   |
| 终端延迟               | 取决于传输、主线程和终端渲染链路                       | 同样需要区分输入、传输与渲染阶段                   |
| 模型生成与 daemon 工作 | 不因前端换壳而直接改善                                 | 不因 UI 改用 Rust/Go 而直接改善                    |

现有瓶颈和测量方法分别由 [agent-stream-performance.md](agent-stream-performance.md) 与 [terminal-performance.md](terminal-performance.md)维护。不要将 daemon 序列化、relay 加密或模型等待时间计为 UI 框架可消除的成本。MyGo 等框架的小型示例内存也不代表完整 Paseo 客户端，更不包含保留的 daemon 与 agent 进程。

## 原型与验收计划

原型范围为连接既有 daemon、工作区/agent 列表、聊天流、历史加载、一个终端和可调整分栏。内嵌浏览器与自动化作为独立可行性关卡；若要求完整替换现有桌面客户端，该关卡属于必要验收项。

1. 先测当前 Electron 基线，再用相同 Web UI 测 Tauri；MyGo WebView 作为可选同组对照，隔离换壳收益。
2. 用 GPUI + GPUI Kit 与 MyGo 原生 UI 验证同一套核心流程，分别记录实现成本；按需要加入 Iced 或 egui 对照。MyGo 优先验证流式 Markdown、中文 IME、跨块选择、daemon 终端适配和嵌入 WebView，不能以 gallery 展示替代这些验收。
3. 在相同机器、分辨率、刷新率、release 构建、daemon revision 和固定负载下测量；区分直连与 relay。
4. 每次记录冷启动至可交互时间、全部前端进程内存、空闲及负载 CPU/GPU、滚动帧时间/掉帧、输入至显示 p50/p95。daemon、agent 与前端分别统计，同时给出总量，避免将开销转移视为降低。
5. 覆盖长历史与图片/代码块、连续 Markdown 增长、大 diff、终端持续输出、多面板切换、后台恢复与断线补齐；验证中文 IME、跨块选择复制、快捷键、焦点和无障碍。各目标桌面系统分别验收。

立项前先确定改善目标和可接受的功能差距，再运行测试。当前未约定节省比例、内存上限或帧时间门槛，不能事后挑选有利数字作为通过标准。

## 最终决策前待补证据

- 各候选的同负载原型数据及构建、签名、安装和更新验证。
- 原生协议客户端的维护成本、协议跟进策略，以及现有插件 UI 的适配范围。
- 内嵌浏览器的配置持久化、登录弹窗、权限、自动化和多窗口行为。
- 各目标系统上的文字、输入法、无障碍与 GPU 驱动兼容性。
- 框架及实际依赖版本的许可确认；近期发版、维护响应与组织投入复核。

在上述证据补齐之前，保留当前推荐顺序，不将社区热度或作者声誉视为最终选型结果。

## 官方来源索引

以下链接为调研时使用的来源；动态首页可能展示后续版本，版本事实优先使用固定 release 链接。

- S1：[Tauri 架构与 WebView 路线](https://v2.tauri.app/start/)。
- S2：[Tauri 发布记录](https://github.com/tauri-apps/tauri/releases)。
- S3：[GitButler 技术栈](https://github.com/gitbutlerapp/gitbutler)。
- S4：[Yaak 技术栈](https://github.com/mountain-loop/yaak)、[作者背景](https://yaak.app/about)、[交付与版本记录](https://yaak.app/)。
- S5：[GPUI 官方介绍与上游关系](https://gpui.rs/)。
- S6：[GPUI Kit 组件、Longbridge Pro 案例与许可](https://github.com/longbridge/gpui-kit)。
- S7：[GPUI Kit v0.7.1](https://github.com/longbridge/gpui-kit/releases/tag/v0.7.1)。
- S8：[Nathan Sobo 背景](https://x.com/nathansobo/with_replies)、[GPUI 所有权设计](https://zed.dev/blog/gpui-ownership)、[社区应用展示](https://github.com/longbridge/gpui-kit/discussions/989)。展示列表本身不证明每个项目均已成熟交付。
- S9：[egui 0.37.0](https://github.com/emilk/egui/releases/tag/0.37.0)。
- S10：[Rerun Viewer 架构](https://github.com/rerun-io/rerun/blob/main/ARCHITECTURE.md)。
- S11：[Emil Ernerfeldt 背景](https://www.ilikebigbits.com/about.html)。
- S12：[Halloy](https://halloy.chat/)。
- S13：[libcosmic 与 Iced 的关系](https://github.com/pop-os/libcosmic)。
- S14：[Iced 0.14.0](https://github.com/iced-rs/iced/releases/tag/0.14.0)。
- S15：[Iced 维护与贡献说明](https://book.iced.rs/faq.html)。
- S16：[Dioxus 渲染路线](https://github.com/DioxusLabs/dioxus)。
- S17：[Cognition 公告](https://cognition.com/blog/welcoming-dioxus)。
- S18：[Dioxus 作者说明，页面标为 draft](https://dioxuslabs.com/blog/joining-cognition/)。
- S19：[Slint 具名产品案例](https://slint.dev/)。
- S20：[Slint 团队背景](https://old.slint.dev/#aboutus)。
- S21：[Slint v1.18.1](https://github.com/slint-ui/slint/releases/tag/v1.18.1)。
- S22：[MyGo 两种 UI 路线](https://mygo.egoist.dev/docs/architecture)。
- S23：[EGOIST 作者与项目背景](https://github.com/egoist)。
- S24：[MyGo 原生组件目录](https://mygo.egoist.dev/docs/ui)、[公开 UI API](https://pkg.go.dev/github.com/egoist/mygo/ui)。文档与 API 索引可能对应不同版本，原型需固定版本并核对可用接口。
- S25：[MyGo Markdown 与流式回复](https://mygo.egoist.dev/docs/ui/markdown)。
- S26：[MyGo 原生代码编辑器](https://mygo.egoist.dev/docs/ui/code-editor)。
- S27：[MyGo Split](https://mygo.egoist.dev/docs/ui/split)、[原生 UI 中嵌入 WebView](https://mygo.egoist.dev/docs/ui/web-view)。
- S28：[MyGo 终端插件、外部连接与原生库](https://mygo.egoist.dev/docs/plugins/terminal)。
