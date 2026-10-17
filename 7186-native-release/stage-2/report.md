# #7186 iOS Simulator Release QA

**Result：partial。** candidate 已成功生成并运行真正的 iOS Simulator Release/Hermes app；进入 workspace 时遇到 navigation-context 异常，尚未触发 mock stream，因此 **native 流式 SQLite 字节、offline reload 和性能均未验收**。不将此异常归因于 #7186；临时 snapshot 的依赖解析仍是混杂因素。没有产品源码修改、commit、push、GitHub 写入、部署或真实模型请求。

## 来源与环境

- 唯一 checkout：`/Users/luopeihuan/workspace/rrd/paseo/.worktrees/native-render-stream-cost`。开始及结束 HEAD 均为 `85f7d56ea79f8b7c22538a2b763875f4ce2d74ad`，`git status --short` 均为空。没有操作 #6736/#6699、旧 diverged worktree 或 dirty main。
- baseline `cd77ecd837df40d042599d8847403eb416b35b04` **本轮未构建/运行**。本轮不报告 A/B、速度改善或 frame 差异归因；未重复已绿的 web/单测或先前 synthetic Hermes benchmark。
- 执行者 Codex；任务指定 `codex/gpt-6.1-sol`、High，宿主没有可独立核验的实际 model metadata。两次构建修正，一次未处理弹窗的首启 attempt，一次含原生 UI 自动化的 runtime attempt。
- Xcode27.1/27A9275，iPhoneSimulator27.1 SDK，arm64，RN0.81.5、Expo54.0.33、app0.12.0-beta.1、Node24.18.0、CocoaPods1.17.0（复用已安装）。Mac48GiB RAM，开始可用磁盘139GiB。自建 iPhone16Pro/iOS18.6（22G86）；无物理设备/Android/其他 desktop 平台验收。
- 已完整阅读 checkout CLAUDE、docs/qa.md、development.md、ad-hoc-daemon-testing.md、mobile-testing.md、agent-stream-performance.md、data-model.md；使用 `ios-simulator` skill及simctl reference。

本轮文件均位于 `/tmp/paseo-pr-gap-20261017/7186-release/`；只在此前自己的 `/tmp/paseo-review-repair-20261017/qa/native-7186` 修复临时构建配置/依赖产物，复用 `.../qa/7186-derived`。未安装新依赖或全局工具。

## 两轮构建修正

旧失败日志原样保留：`/tmp/paseo-review-repair-20261017/qa/7186-release-build-3.log`。`diagnose.log` 确认 `/tmp`→`/private/tmp`：Metro projectRoot/watchFolders 是 canonical `/private/tmp/...`，Xcode ENTRY_FILE 是 `/tmp/.../index.ts`；snapshot node_modules 为指向本 checkout 既有安装的 symlink。

1. `build-1.zsh` 显式传 canonical ENTRY_FILE，在临时 Metro watchFolders 加入依赖 symlink 的实际 checkout 目录。入口解析通过，5,589模块后报 snapshot 缺 `@getpaseo/highlight/dist/index.js`、protocol dist 等，退出65；`build-1.xcode.log` 完整保留。开始04:52:42Z。
2. `build-2.zsh` 仅复制此 checkout 已构建的 highlight/protocol/client/plugin/relay dist 与 expo-two-way-audio build 到 snapshot。**04:54:11Z→04:55:02Z，退出0，BUILD SUCCEEDED**；Metro6,535模块、bundling24,918ms，`build-2.xcode.log`。`Paseo.app/main.jsbundle` 为 **Hermes JavaScript bytecode v96**，binary/bundle SHA256见公开摘要。

实际 build 命令：

```sh
APP_VARIANT=production EXPO_NO_TELEMETRY=1 CI=1 \
EXPO_PUBLIC_LOCAL_DAEMON=127.0.0.1:54883 \
ENTRY_FILE=/private/tmp/paseo-review-repair-20261017/qa/native-7186/packages/app/index.ts \
xcodebuild -workspace <snapshot>/packages/app/ios/Paseo.xcworkspace \
  -scheme Paseo -configuration Release -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath <prior-qa>/7186-derived -jobs 2 \
  CODE_SIGNING_ALLOWED=NO IPHONEOS_DEPLOYMENT_TARGET=15.1 \
  ONLY_ACTIVE_ARCH=YES ARCHS=arm64 build
```

generated iOS/Pods 沿用上轮 prebuild，15.1 为 SDK27兼容的 build-only 参数。source instrumentation **无**；唯一临时 tracked 配置差异是 `metro.config.cjs` 的 watchFolders，见 `public/metro-snapshot.diff`。ENTRY_FILE/env、复制 dist/build 均为临时构建接线，不改产品逻辑。两轮已用完，没有继续第三轮构建或环境修复。

## Runtime 结果及阻塞

`runtime.zsh` / `runtime-2.zsh` 在安装前检查 Release bundle 含 `127.0.0.1:54883`；该端口由 OS `listen(0)` 分配，harness拒绝6767/6768。使用独立 PASEO_HOME、synthetic git repo、test daemon，只注入 `MockLoadTestAgentClient`，选用实际 mock model `e2e-fast-stream`，**不是 real-provider 验收**。

预设 response 为 `('缓存😀'.repeat(2500)+'\n\n').repeat(2)+'QA7186-END'`，20,014 UTF16 code units /50,014 UTF8 bytes，SHA256 `42f194a3fd10cb26886dd17d5847b1344e715a93fe9c96f6d17ff4470d838a9c`。此为 **fixture 预设值，未从 native cache 读回**。

首个 attempt 首启成功，但通知权限/deeplink确认弹窗挡住流程；主动结束后wrapper返回70，保留 `runtime/first-launch.png`、`before-stream.png`、`release-smoke.mov`。此 attempt 未完成 EXIT 清理的 simulator，由下一 locked phase 按自有 UUID 明确 shutdown/delete，记录 `runtime/cleanup-resumed.log`。没有 stream marker。

第二个 attempt 的自建UUID为 `5D42181F-85E8-4F14-A017-29AECD4266C9`。04:57:21.145Z开始host，Maestro实际识别该UUID/iOS18.6，点击“打开”和“不允许”均完成；然后等待 `message-input-root` 超时，wrapper退出1。截图显示 RootErrorBoundary：

```text
Error: Couldn't find a navigation object. Is your component inside NavigationContainer?
    at useNavigation (.../main.jsbundle:1027605:22)
    at HostWorkspaceRouteContent (.../main.jsbundle:1021833:63)
```

原始证据：`runtime-2/maestro.log`、`runtime-2/maestro/.maestro/tests/2026-10-17_125805/`、`runtime-2/app-unified.log`、`runtime-2/release-smoke.mov`。异常发生于04:58:12.759Z，host于04:58:51.715Z关闭。没有 `stream` / `stream-done` / `cache-after-stream.json`，也未执行 offline reload。

只读检查 generated JS 发现 **两个 `NavigationContext = React.createContext(undefined)` 定义**（lines126106和1027357），抛错hook来自第二组，而render stack包含第一组navigation代码。此结果提示 duplicate module identity，**尚未证明原因是 snapshot symlink/exports 解析还是上游路由**；不能报告产品 bug 或 #7186 regression。workspace route 在 `useNavigation()` 第一行即抛错，尚未执行 open-intent/cache streaming 路径。

最小后续诊断方案（本轮未执行）：让 Metro 在单一物理依赖树中打包，并对 expo-router/app 两侧解析到的 `@react-navigation/native` / core 的模块identity做比对；先排除临时构建混杂因素，再判断是否需要路由源码修复。没有建议或实施 cache fallback、协议变更或 #7000 依赖。

## 命令、退出码与清理

所有 dependency/runtime诊断、build、Maestro、runtime、媒体导出均使用独立正常阻塞：

```sh
/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh <absolute-script> > <unique-log> 2>&1
```

build与runtime分别释放/重新取得共享锁，没有一个锁作用域串联多轮构建。没有新增依赖、产品代码变更，因此不重复源码typecheck/lint/format/单测。

| Script | Exit | Raw evidence |
|---|---:|---|
| diagnose.zsh | 0 | diagnose.log、devices-before.json、runtimes.json |
| build-1.zsh | 65 | build-1.log、build-1.xcode.log |
| build-2.zsh | 0 | build-2.log、build-2.xcode.log、build-2.started/finished |
| runtime.zsh | 70（主动结束后） | runtime.log、runtime/；后续仅清理自有残留simulator |
| run-runtime-2.zsh / runtime-2.zsh | 1 | runtime-2.log、runtime-2/maestro.log、host-result.json |
| prepare-evidence.zsh | 0 | prepare-evidence.log、public/：源码比对、媒体、manifest及清理摘要 |
| diagnostic/inspect-cache.zsh | 0 | diagnostic/inspect-cache.log、filemap-navigation.json |
| diagnostic/map-modules.zsh | 143（主动结束低效只读解析） | diagnostic/map-modules.log；无build/runtime/设备动作 |
| diagnostic/map-modules-fast.zsh | 0 | diagnostic/map-modules-fast.log、module-mapping.json；复用原始缓存、无transform |
| diagnostic/finalize.zsh | 0 | diagnostic/finalize.log、最终manifest/本报告 |

两个自建simulator分别为 `10DE02F7-15F9-41B0-9728-8F54685AD054` 和 `5D42181F-85E8-4F14-A017-29AECD4266C9`，均仅操作本worker返回的ID。第二轮trap明确关闭录屏、host/client/project，并shutdown/delete该UUID。没有操作现有RRD10625-Fav-Tag、其他simulator、物理OPPO/Android/用户AVD；没有接入或重启6767/6768。

## 可公开子集

`7186-release/public/` 仅供parent审核发布，本worker未上传。包括 source/result/build digest、临时Metro diff、脚本、首启/错误截图、原生启动→错误视频、精选错误日志、Maestro结果及cleanup摘要。**不包含 synthetic home、SQLite database、凭据、用户session、app binary或整份Xcode环境日志**。完整旧/新失败日志留在private原路径。

证据整理退出0：对比5,678个tracked文件，只有已披露的临时Metro配置不同，其余snapshot文件与candidate一致；原checkout仍clean。`public/cleanup.json`（05:00:13.886Z）确认两个自建UUID均不存在、自有runtime进程为空、所有既有simulator状态未变。公开视频实际container时长65.646667s，manifest含逐文件SHA256且凭据模式扫描无命中。结论严格限定：**Release build + native startup通过；stream/cache/reload blocked；native performance仍partial**。已有physical OPPO证据及issue关联由parent处理，本轮未重复查验或声称复现。

## 追加严格只读模块诊断

本章节只读取已生成bundle、原transform cache、serialized TreeFS和这两个包的入口/相关import链。没有source map独立文件，未重启Metro、未重新transform、未进行第三轮build/runtime，也未改变原harness/临时Metro配置。原始映射为 `diagnostic/module-mapping.json`，精简公开证据为 `public/import-chain.json`。

| 分支 | bundle模块ID与实际依赖边 | source / version |
|---|---|---|
| app workspace route | route6193 → native6194 → core6196 → useNavigation6254 → NavigationContext6249（定义line1027357） | route来自snapshot；native7.1.33、core7.16.1的lib/module |
| Expo Router容器 | ExpoRoot1163、NavigationContainer1167 → native806 → core808 → useNavigation867 → NavigationContext862（定义line126106） | expo-router6.0.23；相同native7.1.33/core7.16.1的lib/module |

两个context源文件canonical路径均为：

```text
/Users/luopeihuan/workspace/rrd/paseo/.worktrees/native-render-stream-cost/node_modules/@react-navigation/core/lib/module/NavigationContext.js
```

另一个TreeFS身份为 `/private/tmp/paseo-review-repair-20261017/qa/native-7186/node_modules/@react-navigation/core/lib/module/NavigationContext.js`。磁盘realpath、device/inode和文件bytes完全相同；源SHA1 `d5732e21aa75ea2b1f2e265ff15f5c13b6dc6580`。两个transform-cache记录source SHA1相同、transformed body逐字相同，分别在bundle中形成862和6249两个React.createContext实例；不是仅凭函数名称推测。包只存在一个物理安装，snapshot symlink与真实checkout在TreeFS中形成两套lexical身份。

导出条件：app route源码为ESM import，原cache `isESMImport=true`；ExpoRoot/NavigationContainer编译文件使用require，原cache为false。当前Metro配置 `unstable_conditionNames=[]`，iOS平台条件为react-native，故active set分别为 `{default, import, react-native}` / `{default, require, react-native}`。native/core的exports只有source、types、default；source/types未启用，两者都选择 `default: ./lib/module/index.js`，context叶文件再经相对 `.js` import加载。两组输出并非同一package的CJS/ESM双入口；Babel输出里的CommonJS包装不能作为CJS源入口证据。

真实resolver探针复用了本次保存的TreeFS、checkout已安装的Metro ModuleResolver和snapshot config：从snapshot app route解析返回snapshot lexical native/core/context路径，从物理ExpoRoot/NavigationContainer解析返回真实checkout路径；切换isESMImport为true/false保持各自同一入口。**边界：这不是历史Expo CLI扩展/autolinking resolver的执行trace**；未把这一层重新运行。原bundle的ID依赖边、源内容SHA/物理identity已确定，历史CLI究竟在哪一层选择这些lexical根仍缺直接trace，不能把完整原因链写成已验证。

最小临时QA配置建议（仅proposal，未实施）：在snapshot现有resolver完成正常解析之后，只对 `@react-navigation/native` / core内返回的sourceFile执行 `fs.realpathSync(result.filePath)`，统一其模块identity；保持原import/export条件和所选lib/module文件。该操作不改源码、版本、导出分支或运行逻辑，仅消除该snapshot暴露出的同一物理文件双身份；不需要改路由产品代码。按当前证据尚无产品修改依据。

唯一最小下一步：若parent决定继续，在其批准的下一轮bundle中仅记录上述native/core解析的origin、specifier、返回path/realpath及assigned module ID，并检查862/6249是否收敛成一个context；不扩大依赖树、不改路由。本轮没有执行此步骤。

最终回填完成：2026-10-17T05:08:24.570Z；HEAD未变、clean，自有process/device均为空。公开manifest现包含README及追加只读诊断；证据与命令结果已全部回填。
