# #6736 iOS Simulator Release 图片验收

状态：准备中，尚无本轮native通过结论。配置Codex / codex/gpt-6.1-sol High/full-access/complex QA，实际宿主model metadata未独立暴露；不转委托。

## 已批准范围与写入前方案

- 只读产品checkout `/Users/luopeihuan/workspace/rrd/paseo/.worktrees/pr-6736-parallel-20261016`，固定 `bd3bbb45f612df5fcdd02f5355d545d13341ade0`。GitHub PR #6736 head一致，OPEN/Draft、base main、原luoph分支不变；初始clean，见pr-before.json。
- 唯一新写集本目录及其新snapshot/DerivedData。通过git archive导出精确HEAD，复用此checkout已安装依赖；仅APFS复制既有自有7186的generated iOS/Pods/build cache，再在新副本重定位生成路径。native manifest/lock/patches与7186版本逐项git diff为空；不使用7186已建app作为当前修复验收，不改旧证据/6699快照。构建flags、来源和完整差异另记。
- 新snapshot仅Metro配置追加已证实normal resolver之后对@react-navigation/native/core sourceFile执行realpath的环境修正，并记录原path/realpath/相同bytes；watchFolders允许本checkout依赖物理根。entry使用/private/tmp真实路径。产品app route、renderer、协议、gate/store不改，不加运行逻辑instrument。
- 正常独立DaemonClient.sendAgentMessage输入两张source synthetic PNG（image-only和text+image），native通过真实workspace/menu UI接收、打开/关闭预览lightbox。实际wire、独立client fetch和app SQLite SELECT逐字/逐hash核对图片、MIME、canonical/client IDs、顺序及无重复；正常terminate/relaunch后已知workspace导航再查；隔离host完整进程stop/start及provider磁盘replay后查当前epoch和稳态图片/lightbox。
- 现有MockLoadTestAgentSession echo不带images、history只在内存，不能据此声称磁盘恢复。采用现有FakePi PiRuntime seam，真实PiRpcAgentClient/manager/API不改；fixture记录正常prompt实际收到的image bytes到专属synthetic文件，重启创建全新FakePi读取该文件，使用已有entry-capture/submitted-entry桥接。没有新增产品接口、fake server_info、UI/store注入或真实推理。只称native客户端+明确provider fixture，原真实Pi29 checks及OMP阻塞另列，不累加。
- 只创建自己的simulator、home/repo、loopback ephemeral端口；不连接6767/6768、不操作已有设备/用户配置。每个heavy阶段正常阻塞共享lockf并释放，与6699串行。正常有据harness修正保留全部失败，同一缺陷最多两轮；不跑旧绿/全套。

验收标准是正常native UI可见两图/图文、lightbox实际图片、reload及隔离host磁盘重启后当前canonical epoch/身份/原始bytes保持；缓存首帧不当作authoritative恢复。截图和连续录像保留实际帧时序，单文件<100MB；计量/公开hash、起止时间、失败、清理待执行后按事实记录。

已读：CLAUDE/AGENTS、docs/qa.md/plugins.md/expo-router.md/development.md/ad-hoc-daemon-testing.md/mobile-testing.md/markdown-renderer.md、ios-simulator skill、Pi修复报告；message.tsx、stream.ts、replica-cache/index.ts、agent-stream/view.tsx、presentation、plugin projection、thumbnail/lightbox/zoomable image、native/sqlite row store完整相关路径；mock provider/FakePi/runtime和Pi image fixture，Pi session提交/metadata/history及manager canonical提交/echo依赖。下步只实现临时harness/config，不改产品。
