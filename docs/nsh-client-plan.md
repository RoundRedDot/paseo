# Paseo NSH 跨平台前端重写方案

日期：2026-11-07。状态：按用户纠偏重新规划，待全文评审和新实施范围／预算确认；本稿没有跨平台运行验收或实施 Go。用户目标是**使用 NSH 的跨平台能力重写 Paseo 客户端前端，继续使用 Paseo daemon／server 能力**。

旧 macOS／性能研究方案已[原样归档](../packages/nsh-client/evidence/20261107-p0a/cross-platform-replan-20261107/previous-plan.md)，SHA256 为 `2b4be79adacbf0f2d7492c137e46a73bf663ea30f6ebfe6a42a401b31e08389a`。旧评审不覆盖本架构；旧阶段未通过，不再作为共享 UI 的前置。范围纠错、证据资格及预算记录见[本次报告](../packages/nsh-client/evidence/20261107-p0a/cross-platform-replan-20261107/README.md)。

## 目标与替换边界

交付一套 NSH TSX 组件、响应式绑定和可脱离 UI 框架的领域逻辑，面向 Web、macOS、iOS、Android、Windows、Linux。先在 Web／macOS 开发同一纵向切片，尽早在两移动端运行；Windows／Linux 从第一阶段登记构建和运行验证，不等待桌面性能收益。布局按空间和输入能力适配，不承诺六端像素完全一致。

| 边界                  | 保留／重做                                                               | 约束                                                                                                 |
| --------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 客户端前端            | 以 NSH 重做导航、目录、会话、composer 和各功能 surface                   | React／React Native、Expo Router、Zustand hooks、Unistyles 和 Electron IPC 不直接移入共享 UI         |
| 领域模型              | 复用框架无关的同步、分页、submission、turn、终端及文件契约               | 按实际依赖最小抽取；不把完整 app store／host-runtime 搬入 NSH，不先建立通用状态框架                  |
| SDK／协议／relay      | 复用 `packages/client`、`packages/protocol`、`packages/relay`            | UI 走 SDK；facade 未覆盖的操作集中在领域 adapter 使用现有低层客户端，不要求 server 增加 NSH 专用 RPC |
| daemon／provider／PTY | 保留现有进程管理、数据、provider 认证、权限、终端 worker、调度和后台能力 | 新客户端不执行 provider、不重新实现 PTY、不复制服务端状态机                                          |
| 服务端插件            | 保留 RPC、hooks、providers、usage sources 等现有运行方式                 | 服务端能力仍存在，不等于新 UI 已有入口；客户端贡献按后文分类移植                                     |
| CLI 与桌面宿主        | CLI 保留；NSH 宿主替代客户端平台集成                                     | 首片连接已运行 daemon。自管 daemon 放到发布阶段，复用既有生命周期接口，退出 UI 不停止外部 daemon     |

第一片不改 server／protocol、根 workspaces／lock／CI，不接入完整浏览器、语音、终端、离线缓存或动态插件分发。它们是后续覆盖项，不是终局删除项。旧 Expo／Electron 客户端保留供现有用户使用和功能对照；逐平台覆盖、迁移和发布验收后，再由用户决定替换入口与退役安排。

## NSH 依据与证据级别

[官方平台说明](https://nsh.dev/docs/platforms/)列出六类目标及其后端；[Web 说明](https://nsh.dev/docs/web/)说明共享组件／应用逻辑在浏览器以 HTML/CSS 呈现，已发布 TSX 使用浏览器 JS 引擎；[平台差异说明](https://nsh.dev/docs/platform-specific/)提供平台属性与模块边界。这些是上游能力声明，不能当作 Paseo 在六端实测。

候选工具链继续固定 NSH v0.4.0 源码 `e626a8dd8f8d8b277b9507cfd5ac74d0e67020f3`。本地对应文档及本次访问来源绑定于证据索引。原生 QuickJS、浏览器 JS、原生模块和 Web 构建闭包分别验；已有 macOS standalone 成功不能替代其他 runtime。发现版本差异，先提交可复现缺口与最小修订，不自动升级 NSH、维护 fork 或回退到旧 React 页面。

每条平台记录分开标明：上游声明、源码／类型检查、构建、运行及真实画面、隔离真实 daemon、模拟器、真机、生产发布。静态 UI fixture、headless probe 和测试 provider 不冒充后几层。

## 共享架构与平台 ports

```text
同一 NSH TSX UI（宽屏／紧凑布局）
           ↓ 意图／领域快照
框架无关 owners：connection / directory / timeline / composer / files / terminal
           ↓                         ↘ 平台 ports（按宿主注入）
Paseo SDK + protocol + relay           网络、Storage、系统输入与集成
           ↓
已有 Paseo daemon → provider / PTY worker / schedule / server plugins
```

应用 owner 管连接与资源，视图只管自身呈现／监听。连接按主机隔离，workspace ID 不当路径；目录与时间线按需求订阅，离开时按现存契约释放。目录不为全部 200 agents 预取历史，因为 fetch 会恢复 provider。遵循 [Connected hosts](connected-hosts.md)、[Timeline sync](timeline-sync.md) 和 [Protocol compatibility](protocol-compatibility.md)。

时间线复用 A4 已抽出的 reducers、单副本提交和副作用决策，保留权威 fetch／live 合流、cursor、coverage、epoch 和迟到响应规则。`directory agent.turn` 是唯一活动副本；composer 的 canonical acknowledgement 与 RPC settlement 是独立事实。NSH 响应式绑定发布这些状态，不另造 turn Map／“运行中”组件 boolean。先用内存副本；持久化历史以后单独验收。

连接继续使用现有 `DaemonClient.transportFactory` 与 `createPaseoApi()`。按现有 app 契约显式设 `clientType: "mobile"`、Paseo 基线 `appVersion`，核对最终 hello 默认 capabilities；这不是布局／OS 判断。保留 SDK 协议能力，未实现的 browser host 等宿主能力不宣告。每项服务端功能只在入口检测一次 `server_info.features.*`，缺能力给出明确更新提示，不用新 RPC 或其他主机静默模拟。

下表是**拟定的应用内部 ports 分工**，不是 NSH 新 API。先使用平台已有能力；仅在当前切片确有缺口时补最小 adapter。

| Port                   | Web                                                                                              | 原生与边界验收                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 网络                   | 浏览器标准 WebSocket，通过 SDK transport；认证走 hello，不能依赖任意握手 headers                 | 先验该 runtime 的 NSH 网络实现；确有帧预算、TLS 或字节／drain 缺口时评估已有 Rust transport。它只在 macOS 验过，不是共享 UI 唯一前提                        |
| 网络安全／容量         | HTTPS 页面使用可达的 WSS 路线；核对 Origin、混合内容、证书和 fetch 的 CORS；不关闭浏览器安全限制 | 系统信任、close／error、二进制切片、真实发送背压按 adapter 验。保留 SDK 分块／100MiB logical、relay wire 与加密余量分层限制，不把宿主小帧成功写成大消息兼容 |
| 凭据与 Storage         | 先内存；保存主机偏好可用浏览器存储，密码存储策略另审，不复制 Keychain 方案                       | 平台安全存储与普通偏好分离；不读取其他实例凭据。按现有 daemon 所有权路径取得自管 credential，不保存轮换值                                                   |
| 文件／附件             | 用户手势触发选择，处理浏览器 Blob／文件生命周期，无任意磁盘访问                                  | 系统 picker／相册权限／临时文件由平台负责；上传与远端路径走现有 daemon 契约，不能把远端路径当客户端本机路径                                                 |
| 剪贴板／外链           | secure context、用户手势和浏览器限制可见                                                         | 系统剪贴板与 URL 打开；选择文本、代码复制及权限失败均验，不借组件存在推导可用                                                                               |
| 导航／深链             | URL、刷新、Back／Forward、直接打开 host／agent 目标                                              | 系统深链与返回键；共同消费 host／entity 导航意图，不移植 Expo Router。通知里的 agent 目标按当前目录解析 workspace                                           |
| 生命周期／通知         | 页面可见性、恢复及适用的浏览器通知                                                               | App 前后台、挂起、进程重建、系统推送分别验；恢复以权威补载为准，不保证后台 socket 常活。不抢占其他客户端的通知 presence                                     |
| 终端／音频／浏览器宿主 | 在各功能阶段选择受浏览器权限约束的实现                                                           | NSH 系统组件／原生模块只封装平台资源，领域状态仍共享；不把 AppKit／objc2 硬搬到手机、Windows／Linux                                                         |

旧 `src/platform/globals.ts` 把 `navigator.platform` 写成 `MacIntel`，`transport.ts` 直接导入 `paseo/probes`。二者是实验宿主边界，不能原样进入六端入口。首片应把运行期要求和平台选择显式隔离，保留原失败记录；禁止伪造 React／Node 模块来掩盖依赖。现有 `nsh.json` 还无条件引用含 tokio／native-tls 的 probe crate，Web 构建必须隔离这条依赖。具体采用固定版支持的构建选择或最小 target cfg，在首片核实后落地，不预造 NSH 配置字段。

## 跨平台验证面

从 S1 登记下表；串行推进，避免同时建设六套实现。每次证据绑定 shared UI／领域源码 hash、平台入口／adapter hash、构建产物、daemon 身份及命令。平台 runner 不可用写“未测＋负责人／待安排”，不能取消该目标或记通过。

| 目标    | S1 的最小证据与顺序                                             | 后续平台重点／当前 runner 缺口                                                                  |
| ------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Web     | 先构建并在真实浏览器呈现连接页、agent 列表；连接隔离既有 daemon | 地址刷新／深链、WS 安全、键鼠／触摸、选择；当前未运行 NSH Web                                   |
| macOS   | 与 Web 同一组件／领域切片，真实 NSH 窗口呈现同一 daemon 的列表  | 键盘／IME、窗口生命周期、文件选择与发布签名；现有 standalone 不是会话 UI                        |
| iOS     | S1 紧接 Web／macOS，先模拟器真实画面与同一 agent 列表           | 真机再验输入法、软件键盘、权限／挂起／推送；本次未核实可用设备、签名与 runner                   |
| Android | S1 同期按顺序接入 emulator 的同一切片                           | 明确宿主可达地址，不能默认设备 localhost；真机输入法／Back／进程重建另验，工具链／runner 待核实 |
| Windows | S1 先登记 owner／runner，取得原生构建与列表运行 smoke           | Win32 输入／窗口／路径／凭据；本会话没有已核实 runner，不能用 macOS 交叉构建替代原生运行        |
| Linux   | 同样在 S1 安排本机／CI runner 的构建与列表 smoke                | GTK／字体／剪贴板／桌面发行包；runner／依赖待落实，不以官方支持表当实测                         |

S1 的首个可展示检查点是 Web＋macOS 共享 UI 真实连 daemon；S1 的四端切片完成还必须有 iOS／Android 模拟器画面。Windows／Linux 缺 runner 时可经阶段范围核对继续已有四端的 S2，但 S1 六端状态保持未完成，六端产品验收不得通过；runner 安排不能拖到性能收益之后。模拟器通过不声明真机通过，桌面宽屏通过不声明手机布局通过。

## 功能保留与移植矩阵

“服务端保留”指原能力和数据继续由已有服务端提供；“新 UI 待做”在当前均未交付。阶段只裁剪交付顺序，不改变终局功能范围。平台专属功能按现有适用面验收，不要求浏览器获得本机进程权限。

下表 `screens/`、`schedules/`、`voice/`、`desktop/browser/` 入口相对 `packages/app/src/`；插件样例路径相对仓库根目录。

| 工作流                     | 保留的能力／现有入口参考                                                              | 新客户端 surface 与交付阶段                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| agent／provider            | server agent manager、provider registry／认证；SDK `agents`／`providers`              | S1 列表；S2 会话／状态／权限；S3 创建、导入／恢复、模型／模式、归档与子会话。provider 名录由 daemon 提供                                                      |
| project／workspace／目录   | 目录同步、创建 journal、setup、脚本与工作区元数据                                     | S1 最小 agent 上下文；S3 导航、创建、切换、setup 状态／输出、脚本与标签；参考 `screens/workspace/`、`screens/new-workspace-screen.tsx`                        |
| 历史／stream／send／cancel | 现有 SDK、A4 共享副本、submission model／writer                                       | S2 同一会话的权威历史、流式文本、工具基础行、发送、取消、权限审批、断线补载；完整 composer／queued send 按现有 writer，不直接绕过 dispatcher                  |
| Markdown／工具／文件／Diff | 工具详情及文件／Git RPC 保留；[Markdown](markdown-renderer.md)行为参考                | S3 新 NSH renderer、代码复制、文件链接、图片附件、远端 explorer／文本预览、只读 Diff；编辑／完整 Git review 放 S5 功能补齐，不能宣称直接复用 RN Markdown 组件 |
| terminal                   | daemon PTY worker、replay／input／resize／capture 和宽度契约                          | S4 附着、输入、绘制、选择、恢复；六端渲染路线见下节。UI 关闭不 kill 远端 PTY                                                                                  |
| relay／routed hosts／SSH   | SDK relay／hosts、daemon 路由与 Node connector；[Connected hosts](connected-hosts.md) | S2 先接 relay 路线；S3 多主机／routed scope；S4 本地 socket／pipe及适用桌面的 SSH adapter。Web 不启动 SSH，可显式使用已有 daemon routed 连接，不静默换路      |
| 调度／heartbeat            | daemon schedule 与后台执行、现有 CLI 保留                                             | S5 调度列表／创建编辑／暂停恢复／日志与目标导航；参考 `screens/schedules-screen.tsx`、`schedules/`。早期无 UI 不代表任务停用                                  |
| 通知／presence             | server 通知生成与路由保留，SDK 事件可复用                                             | S4 平台推送注册、warm／cold tap、去重及前台 presence；参考 [Notifications](notifications.md)。不因新客户端上线压制旧客户端通知                                |
| 语音／dictation            | 已有服务端 speech／实时会话能力保留                                                   | S5 录音、播放、音频焦点／权限与发送整链；`voice/` 的 React／Expo 音频宿主不能直接搬，真机验证另列                                                             |
| 浏览器／automation         | daemon 转发能力保留，但实际浏览器宿主在 Electron 客户端                               | S5 单列桌面 WebView／自动化宿主迁移与权限评估；`desktop/browser/` 仅作行为参考。Web 跨域／外部浏览器控制有限制，不把“server保留”写成现已可用                  |
| 插件／设置／主题           | daemon 插件、RPC／hooks／providers／usage／settings 保留                              | S5 按下表迁移客户端贡献；S3 先具备基础主题和 app 偏好／中文英文文案                                                                                           |
| CLI／桌面 daemon 管理      | CLI 及既有 daemon-control／process 生命周期边界保留                                   | S6 桌面托管／attach、升级和安装。只能停本客户端明确启动且身份匹配的实例；外部 daemon 始终 attach-only                                                         |

### 终端的六端路线

保留 xterm 家族及现有字符宽度、replay、尺寸、选择语义作为基线；不未经差分就换 NSH 内置 ANSI parser。共同的 terminal owner 管理 session／subscription／尺寸与输入，renderer port 管本地显示与平台输入。

Web 候选复用现有 xterm.js 绘制能力，由 NSH 宿主 adapter 承载；原生候选复用 `@xterm/headless` 和 `terminal-frame`／selection，以 NSH 绘制／原生组件扩展实现。S4 先验证固定版扩展接线和一个 ANSI／grapheme 小例，再分别覆盖 AppKit、UIKit、Android、Windows、Linux 所需的系统输入与绘制。能否共用 NSH 绘制层尚待验证；现有 Swift／Kotlin 仅作语义参考，不能按“复制 NSView”估算全平台。

沿用 [Terminal rendering](terminal-rendering.md) 和 [Terminal worker](terminal-worker.md)：xterm 决定 cell，不让字体 advance 改列；测得 viewport／cell 后 attach，resize 的主动权与被动显示分开；重连不重复写入，detach 释放本地观察。保留二进制字节所有权，不全帧塞入组件 JSON。不成立则停止该 terminal 切片并重估，不顺手改 server、换 parser 或嵌入旧 React 应用。

### 插件贡献分类

既有客户端 bundle 面向 React 宿主，不承诺在 NSH 二进制兼容；纯逻辑／描述符也不能因入口叫 `index.client.tsx` 就一概丢弃。按 import 闭包、host 依赖及上下文契约逐项核对。

| 贡献                                                     | 复用候选                                  | NSH 待实现／验证                                                                         |
| -------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| server RPC／hooks／providers／usage                      | 原 server entry、shared schema 与运行方式 | 新 client 通过现有 SDK／plugin RPC 使用，保持 host／principal／subscription 所有权       |
| Command Center／slash command                            | 不依赖 React 的 handler／命令描述数据     | NSH 注册、当前 host／workspace／agent 快照、导航与错误呈现；含 hooks 的 callback 需拆分  |
| timeline transformer                                     | 确定性纯转换、schema／plain data          | 保留 source identity／cursor／phase／顺序；renderer 另做 NSH 组件，不执行 React renderer |
| 主题                                                     | palette／语义色描述数据                   | NSH token 映射、选择持久化与 host 归属；不引入 Unistyles runtime                         |
| 附件源                                                   | shared 描述符、schema、现有 server RPC    | NSH picker／draft／pill／提交快照；凭据留 daemon，不能把 source 等同已实现 picker        |
| panels／screens／按钮／设置／文件面板／timeline renderer | 内容 schema、可拆纯 model                 | React UI 重写，导航／主题／RPC／卸载清理上下文由 NSH host 适配；复杂编辑器另估           |

S5 的第一例优先用现有 `plugin-examples/linear`：`shared/issues.ts` 的附件描述符 → 原 plugin RPC → NSH picker → composer 文本快照。先核对 descriptor／handler 的真实依赖，隔离 fixture 与真实 Linear 凭据／供应商结果分层；无凭据不能写真实 Linear 通过。再以 `timeline-items` 的纯 transformer／React renderer、`catppuccin` palette 验证分类，不一次建设所有扩展点。

NSH contribution adapter、注册形状、产物声明和加载方式目前均为**拟定应用设计**；样例通过后才评审版本与分发契约。不开新 server 专用 RPC，不直接执行 daemon 下发的 React bundle，也不把不兼容产物装入现有 manifest 字段。保留 [Plugins](plugins.md) 的可信代码、host 隔离和卸载清理规则；不自动启用用户插件。

## 按功能交付的阶段

每阶段实施者提供源码／产物／真实操作证据，父级核对范围与预算，评审先问“是否交付用户要的共享跨平台前端”，再查内部自洽。阶段完成不自动授予下一阶段、提交、发布或旧客户端退役许可。

| 阶段                  | 依赖与可观察交付                                                                                                                | 验收／停止条件                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 共享 app＋真实目录 | 新方案／首片预算确认后，Web＋macOS共享 NSH UI／domain 连隔离现有 daemon，继而 iOS／Android 同一列表；安排 Windows／Linux runner | 实际组件画面、连接／错误／列表更新与退出释放；build 与运行分列。不能仅交 scripts／probe；需要 React shim、NSH fork、server新RPC或超首片额度即停             |
| S2 可交互会话         | S1 四端列表切片；同一会话历史／stream／文本发送取消／权限审批／重连补载，接 relay                                               | Web／macOS／iOS／Android 同流程、相同领域代码；实际真人输入／IME 小例、权限结果、断线后最终正文与 coverage；状态不一致、串 host、重复提交等复现即停止该切片 |
| S3 日常工作流         | S2；Markdown／工具／附件、project／workspace 创建切换、文件／Diff、多主机／routed scope                                         | 用户能创建并持续处理任务、审阅文件；切换和迟到结果不串目标，保留历史锚点／复制／键盘／紧凑布局。新协议绕路或需要搬完整 store 时重估                         |
| S4 终端与系统集成     | S2／S3 的稳定连接及导航，终端小例先于完整网格                                                                                   | 六端 terminal 路线分列；再验文件选择、通知／深链、后台恢复、适用平台SSH／本地连接。IME、replay、释放／安全失败不靠性能优化掩盖                              |
| S5 插件与功能补齐     | 核心使用路径成立后，先现有插件样例，再调度、语音、浏览器／编辑／review及其他矩阵缺口                                            | 每项标适用平台、保留 backend／新 surface、真实 provider／vendor 与 fixture 区别；未知项不记零成本，不能因 MVP 无入口悄删能力                                |
| S6 发布与替换         | 目标平台覆盖表、迁移／安全／质量验收，独立发布批准                                                                              | 原生签名与安装、Web静态部署／深链、更新与回滚、CLI／自管 daemon 生命周期、真实设备及 Windows／Linux 原生 runner；缺关键证据不宣称该平台可替代旧客户端       |

性能随这些切片做风险检查和回归：先记录实际负载、UI 交互、startup／内存与卡顿证据；出现可复现阻塞再定位改动。正式收益比较仍须预先固定相同功能、负载、方法和阈值，不从结果倒推目标。不给每个功能前置完整 profiling 平台，不用“无性能数据”无限延迟首个 NSH UI。

## 首片 S1a 的可执行边界（待批准）

首片交付：Web 和 macOS 使用同一连接表单／agent 列表组件、同一 connection／directory owner，经各自 transport 连同一个隔离的现有 daemon；真实画面可见，更新和关闭可验证。只读目录，不包含发送、provider 新建、终端或插件 UI。先保持凭据在内存，错误原因可见；不持久化新密码。

最小写集拟限 `packages/nsh-client/`：

- `App.tsx`、`nsh.json`、必要局部 `package.json`／锁／类型与运行配置：从空入口成为实际 UI，隔离旧 probes／standalone；Web 不强制编入旧 native probe crate。
- `src/ui/` 的共享连接／agent 列表组件，`src/connection/` 的连接 owner，`src/directory/` 的快照／订阅 adapter；状态逻辑不进入平台视图。
- `src/platform/` 的 Web／native bootstrap 与本片所需网络 port。若固定构建器要求原生 target cfg，才最小调整 `native/Cargo.toml`／`native/src/lib.rs` 的编译边界；不修改 socket 算法或 benchmark。构建选择和 module API 须先核对，不照搬 Metro 平台后缀假定 NSH 支持。
- 现有测试路由下的对应定向测试和独立新证据目录；实际新增路径在实施前确认。旧 `scripts/compute-*`、滚轮工具、失败 raw 和 app 七文件不在本片写集；根依赖／CI 另审。

顺序与检查点：先核对工具链和现有 port／编译边界 → 共享连接／错误／列表静态组件在两端实际可见 → 接真实 SDK list＋owned observation → 以本任务隔离 fixture 改一条 agent 状态并确认两端先后收到 → 退出读回订阅／自有进程释放。fixture provider 只制造可重复事件，不改产品 daemon。每次只运行自有有限时服务，记录 PID／port／home；排除6767／6768。iOS／Android 的 S1b 接着复用这些组件，不另做手机专属业务实现。

验收包必须同时有：两端 shared UI hash／平台配置 hash，产物与真实画面，最终 hello／server_info 脱敏记录，正常密码成功／错误密码可操作失败，agent 身份与目录更新，观察释放／关闭读回。明确“隔离真实 daemon＋测试 provider”；一个真实 provider smoke 在 S2 另做，不把 fixture 升格。

建议首片 **2–4 新人日，封顶32活跃小时**，只是待用户批准的实施提议。前8h先交双端实际 UI／构建阻挡；若 Web 因 probe crate 或 SDK 闭包不能构建，交首个错误和最小改动清单，停止扩功能并核对方向。到32h交部分结果和清理读回，不自动续期；不得转去迭代滚轮／benchmark 以填满预算。

## 工作量与待决预算

以下为粗估，不是排期承诺。假设一名熟悉 TS／NSH／Rust 的实施者、有人提供平台 QA／评审和可用 runner；一新人日按8活跃小时计，包含实现、阅读、定向验证、必要命令等待及评审，参与者累计，同人重叠去重。外部设备／签名／runner 等待另列墙钟。估计不反算旧5日／A4余额，不代表本轮已授权实现。

| WBS                       | 粗估新人日（含相应验证） | 估计边界／重估点                                                                           |
| ------------------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| S1a Web＋macOS真实列表    | 2–4                      | 上述首片，最多32h单独批准                                                                  |
| S1b iOS＋Android同片      | 3–6                      | 工具链／模拟器可用、输入／网络最小适配；真机与签名外部等待另列                             |
| S1c Windows＋Linux smoke  | 2–5                      | 需原生 runner；环境开通与未知平台构建阻挡未估，先落实 owner                                |
| S2 会话闭环               | 6–12                     | 共享纯副本基础可复用；composer writer 接线、恢复、四端交互，真实provider另列结果           |
| S3 目录／内容／附件／文件 | 8–16                     | 常用 Markdown／工具与只读 Diff；完整编辑器／复杂review不含在此                             |
| S4 终端／系统集成         | 12–25                    | 高不确定：共享frame与各native绘制／输入、通知恢复；首个终端跨端小例后重估                  |
| S5 插件首例／调度等补齐   | 10–20＋未估项            | 先一个插件边界；完整浏览器自动化、语音宿主、复杂编辑和所有第三方插件兼容逐项未估，不能算零 |
| S6 发布／迁移             | 5–10＋外部等待           | 六端已有runner／账号／签名材料；商店审核与部署审批不包含在活跃开发估计中                   |

已量化块约48–98新人日，另有明确未估功能与环境项；**不是全功能总工期／总预算**。每完成一个纵向切片，按真实剩余功能重估下一片，再决定是否投入；不一次授权全部重写，也不以行数／benchmark快慢推算工期。

旧 W1–W3 的24活跃小时仅获准用于计算验证，已因纠偏停止；实施者记录 `2322.652s≈0.645h`，父级／评审投入尚未完整合账。未知历史余额及旧额度均不自动转为本计划预算。当前授权仅为重规划和文档验证；本稿评审后，由父级向用户确认具体首片及其新额度，不在此会话发起新权限问题。

## 历史成果与门槛去向

历史结果保持原资格；引用是复用候选，不表示新 UI 已完成。原 P0a 5工作日／A4 2人日及旧账保留，不用新阶段名称宣称原阶段通过。

| 旧成果／门槛                                             | 当前事实与本计划用途                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SDK／Rust bytes／认证／relay／TLS                        | 固定 macOS runtime、两daemon及隔离网络功能已有[证据](../packages/nsh-client/evidence/20261107-p0a/resume-unlocked/report.md)；可缩小对应port风险，但不推导Web／移动／Windows／Linux支持；原信任清理记录保留，本片不改系统信任                                                                                                       |
| A4 reducers／副本／timeline                              | [旧端回归与写集](../packages/nsh-client/evidence/20261107-p0a/continuation-1/a4-write-set-audit.json)及同初态差分可复用；[冷／热12个显示ID差异](../packages/nsh-client/evidence/20261107-p0a/d2-evidence-limits.md)仍在。ID只在单副本生命周期内作显示key，不跨冷热持久化；动作锚点遵循epoch＋seqEnd，新UI锚点／跨端身份结论仍待验   |
| W1新增24文件                                             | [精确写集](../packages/nsh-client/evidence/20261107-p0a/compute-20261107/write-set.json)与[停止预算账](../packages/nsh-client/evidence/20261107-p0a/compute-20261107/budget.json)保留；27定向用例／若干短功能配对通过，最新plain relay资源覆盖未测。W1未完成、compute freeze未生成／签定、正式矩阵0次；不恢复、不删除、不接为UI前置 |
| 原生滚轮／present                                        | [失败短探针](../packages/nsh-client/evidence/20261107-p0a/resume-unlocked/continuous-short-run/README.md)及0/5有效轮保留；已消费16／余32事件封存。停止开发CGEvent／capture控制，不据仪器失败判NSH失败                                                                                                                               |
| CPU／吞吐／内存五轮研究                                  | 原负载／最近秩p95／plain-profile配对／CPU/60／owned queue等数值与方法原样在旧计划和contract归档；研究未完成。若日后专门恢复，先独立确认该研究范围／方法／预算，不能继承为已通过                                                                                                                                                     |
| 30%内存／20%启动收益、paint≤1.1×且≤+8ms、帧比例≤基线+1pp | 保留为旧“桌面收益投资”研究目标，均未验收；不再决定共享UI能否启动。当前迁移按真实功能、稳定性、安全和各端质量验收；若提出同类收益声明，须单独冻结公平对照并交证据，不更名虚报或事后调阈值                                                                                                                                            |

## 验收、风险与回滚

遵循 [QA](qa.md) 的平台矩阵与证据层级。未来代码切片运行对应单测／定向回归、typecheck／lint与局部NSH构建；只跑改动相关测试，不跑本机全量套件。每片同时验证真实 NSH 画面和真实 daemon 行为；Web实际浏览器、iOS／Android模拟器及真机、Windows／Linux原生 runner 各自留证。中文IME／软件键盘、跨段选择／复制、历史锚点、前后台恢复、终端字符／输入和插件上下文是使用质量门，不由headless hash或组件API代替。

优先风险是：SDK在每个runtime的实际闭包与认证；共享UI是否被宿主耦合破坏；同步与submission语义；浏览器安全与平台Storage；移动IME／恢复；终端绘制／输入；插件host契约。只为实际阻挡增加适配，不先建完整profiling或视觉测量框架。复现安全错误、数据串目标、漏／重复提交或确定泄漏，停止相应切片定位；缺设备则标未测并交安排，不能宣称全平台Go。

实验继续使用现有worktree／branch，固定基线并保留全部dirty；不rebase，不接主检出。新app使用独立ID／存储命名空间，CLI与daemon数据不迁移、不复制凭据。关闭客户端只释放自身连接／观察／资源，不archive agent、不删workspace、不停外部daemon。新Web静态产物先独立托管；后续是否替换daemon随包静态资源，在S6单独评审构建／发布接线，不改变server业务协议。

撤回一个切片时保留其raw、已验证纯模块与旧客户端入口，不自动删除旧实验。逐平台达到功能覆盖和发布资格后再审替换；若核心目标必须靠server专属改造、大幅NSH fork或长期复制业务状态机才能实现，报告具体失败并重新选择范围。当前只完成方案，不作产品替代或性能Go。
