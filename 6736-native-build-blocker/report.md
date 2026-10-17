# #6736 iOS Simulator Release 图片验收

**Result：blocked（Release编译环境，native runtime未运行）。** 固定候选 **bd3bbb45f612df5fcdd02f5355d545d13341ade0**，初始/结束clean；GitHub初始PR head一致、OPEN/Draft、base main、luoph/fix/cross-client-images。没有修改产品、Git、PR、远端、现有设备或主6767/6768。配置Codex / codex/gpt-6.1-sol High/full-access/complex QA；实际宿主model metadata未独立暴露，未转委托。

阶段开始2026-10-17T08:43:18Z，结束2026-10-17T09:05:26.736Z。初始计划完整保留report-plan.md；唯一写集本目录及其snapshot、DerivedData副本。没有把7186已建app、先前Pi29 checks、browser/mock结果或编译产物算成本轮native通过。

## 验收结果与停止条件

| 验收项 | 本轮结果 |
| --- | --- |
| iOS Simulator Release成功构建 | **BLOCKED**，四次编译均exit65 |
| Native image-only / text+image live展示 | NOTRUN |
| Native preview / lightbox打开关闭 | NOTRUN |
| 正常app reload / 隔离host新进程磁盘恢复 | NOTRUN |
| Native实际wire / SQLite图片bytes、hash和canonical identity | NOTRUN |
| 本轮真实Pi/OMP/model推理 | **0请求**，未启动provider fixture |
| 截图 / 连续录像 | **0张 / 0段**，无运行画面可提交 |
| Android / Electron / physical device | NOTRUN |

ExpoSQLite同一错误在attempt3和attempt4重复，已达到parent本切片“同一缺陷最多两轮”边界，因此没有第五次build、runtime或继续变更header/cache。这里是QA native编译环境阻塞，**没有证据将其归为本PR图片产品bug**。

## 精确source与环境差异

从git archive导出bd3bbb45到全新snapshot，5683个tracked文件逐hash核对，唯一差异是packages/app/metro.config.cjs。app renderer、route、gate/store、canonical reducer/cache、daemon协议及Pi修复源码全部原字节；没有行为instrument或fallback。Metro按正常resolver结果仅将@react-navigation/native/core sourceFile realpath化，watchFolders纳入本checkout物理依赖根，ENTRY_FILE使用/private/tmp真实路径；完整metro-environment.diff。当前尚未成功完成Metro打包，因此没有当前候选安装app/bundle digest或normalizer运行通过声明。

manifest/lockfile、patches、native app配置及expo-two-way-audio相对7186 seed inputs的git diff为空，native-seed-compatibility.diff保留。只APFS复制旧自有generated iOS/Pods/build cache到本目录；新generated路径重定位5043项，source-provenance.json与generated-ios-paths.diff完整记录。原7186来源仅提供相同原生输入的环境缓存，绝非当前candidate客户端acceptance。第一次cache relocation失败后改用空DerivedData-fresh。

已有依赖通过只读symlink复用本checkout，workspace dist复制到snapshot；未npm安装/全局安装、改依赖版本或manifest/lockfile，没有在产品node_modules运行podspec准备。为补native生成资产只改自有新Pods与native-assets：

1. enriched-markdown当前JS安装缺少vendored grammar assets与per-app生成registry。首次官方离线gen-registry调用exit1，明确缺json/highlights.scm，日志保留。随后从同版本已安装依赖复制vendor到本/tmp；**903个非vendor源码文件逐字一致**，按当前19语言config运行同一个官方generator，两份输出与兼容seed完全同hash。只重定向三份新Pods配置的vendor paths；native-asset-provenance.json、native-assets-manifest.json、native-asset-paths.diff。没有网络下载或禁用highlight功能。
2. ExpoSQLite podspec正常vendor_sqlite_src!仅复制vendor/sqlite3/sqlite3.c和.h到ios目录，当前JS安装缺这些准备产物。按同一规则复制当前candidate已有vendor文件到本/tmp，并证实与兼容seed的正常准备结果逐字一致。只改新Pods两file refs与Public/Private两个header symlink；Swift源码、C flags和SQLite实现不变。sqlite-preparation.diff/provenance.json保留。只读preflight显示**1811个native编译源引用全部存在**；这不保证Swift最终导入了正确Clang module。

## 所有失败、命令与返工

所有heavy setup/build/generator/诊断/最终核对均通过正常阻塞锁：

`/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh <本目录script>`

每一setup/build阶段结束释放，与6699worker串行；没有锁内包揽下一runtime、全套或旧绿suite。

| Attempt | UTC开始 | 最后log写入UTC | exit | 主错误 | 原始日志 |
| --- | --- | --- | ---: | --- | --- |
| 1 | 2026-10-17T08:44:24Z | 2026-10-17T08:44:31.997Z | 65 | relocated SwiftShims PCM cache | build/xcode.log |
| 2 | 2026-10-17T08:45:53Z | 2026-10-17T08:46:55.548Z | 65 | missing generated native grammar registry | build/attempt-2/xcode.log |
| 3 | 2026-10-17T08:52:30Z | 2026-10-17T08:58:05.710Z | 65 | ExpoSQLite exsqlite3_* not in scope | build/attempt-3/xcode.log |
| 4 | 2026-10-17T09:00:42Z | 2026-10-17T09:01:14.180Z | 65 | ExpoSQLite exsqlite3_* not in scope | build/attempt-4/xcode.log |

最后log写入时间来自文件mtime，**不是独立记录的精确进程结束时间**。统一工具结果证实各调用已结束exit65。每次开始由脚本date记录；未丢弃不利失败、替换日志或伪造成功。

- prepare.zsh exit0：Git/source archive、容量、device/runtimes inventory、新snapshot/Pods/DerivedData，prepare.log。
- build.zsh exit65：SwiftShims PCM记录旧7186绝对module-cache路径；build-correction.md列最小修正。
- build-attempt2.zsh exit65：改为空DerivedData-fresh后推进到enriched native asset缺失。
- prepare-registry.zsh exit1：官方gen-registry因本地缺vendored highlights失败，prepare-registry.log；脚本原样保留。
- prepare-native-assets.zsh exit0：同版本source/hash比较、只读复用vendor、官方离线生成与新Pods path修正，prepare-native-assets.log。
- build-attempt3.zsh exit65：首次ExpoSQLite命名空间编译失败。
- prepare-sqlite.zsh exit0：正常podspec copy规则与新Pods引用、1811输入preflight，prepare-sqlite.log。
- build-attempt4.zsh exit65：同一ExpoSQLite错误仍存在，停止此缺陷。
- sqlite-readonly-diagnostic.zsh exit0：其两条clang -module-file-info **各exit1**，不能读Swift产生的不同compiler-branch PCM；原始build/sqlite-module-info-*.log保留。没有进一步cache/source修复。

Xcode27.1 /27A9275，iPhoneSimulator SDK27.1，arm64、Release、jobs2、CODE_SIGNING_ALLOWED=NO、IPHONEOS_DEPLOYMENT_TARGET=15.1、ONLY_ACTIVE_ARCH=YES。所有build scripts保留exact argv、ENTRY_FILE与隔离endpoint。初始容量126GiB可用、48GiB物理RAM（原始disk-before/memory-capacity）；无新工具安装、静态/规范suite测试数0。

当前主错误原文：

`SQLiteModule.swift:114:14: error: cannot find 'exsqlite3_open' in scope`

以及exsqlite3_get_autocommit/malloc64/free等同类错误。修正后Public/Private header realpath都指向自有native-assets/expo-sqlite/sqlite3.h，直接内容检查有SQLITE_API int exsqlite3_open声明；仍不足以确定Swift实际导入的header身份。PCM metadata reader报clang-2100.3.34.2与Swift PCM的clang-2100.3.34.1 branch不兼容，**无法据此证明缓存因果**；sqlite-readonly-diagnostic.json明确列证据不足。

返工按缺陷区分：module-cache路径1次有据修正；enriched资产prepare失败后改为完整兼容vendor复用，源码/生成hash核对后推进；ExpoSQLite两次build同错后停止。没有产品修复或UI流程返工。

## Parent可选择的最小后续（未执行）

先用Swift toolchain能读的module metadata确认ExpoSQLite实际header/import身份；若证明是修正前PCM复用，只在本/tmp失效该模块缓存并批准额外一次构建。若不能定位，重建一套正常podspec已准备、完全自有依赖副本，再生成Pods/干净DerivedData；不改产品/source/native接口。前者是较小下一步，缓存原因目前只是待验假设。继续build需parent明确扩展本切片两轮边界；本报告没有自行启动。

## Provider fixture与预备harness边界

已完整阅读image canonical/native/cache/preview/lightbox链路、Pi修复报告、docs/qa/plugins/expo-router/development/ad-hoc/mobile-testing/markdown-renderer及ios-simulator skill。GitHub pr-before.json正文记录先前真实Pi1.3.0/29 checks与OMP defaultmodel/auth阻塞，均是历史归属。

现有MockLoadTestAgentSession不携image进history且history只在内存，所以预备provider-fixture.mjs使用**既有FakePi transport seam**，仍调用真实PiRpcAgentClient/normal API/manager；正常prompt收到的实际synthetic PNG会写入自有provider fixture file，新host创建全新FakePi从该文件读取。源PNG取当前PR captured synthetic fixture，不读用户会话/凭据。synthetic model明确为qa-fixture/native-images。该harness**从未运行**，没有backend fixture通过或新的真实Pi/OMP声明。

预备runtime.zsh只操作新建simulator、隔离home/repo/port；经正常已知workspace/menu UI取得demand，不混修已知direct-link缺口。设计上逐阶段验证current epoch、实际SQL bytes/hash/IDs、两类preview/lightbox、冷app和完整host进程重启，并保留连续原始帧录像。未达到build前提，因此这些脚本与YAML只是可审阅实现，不是native证据。

## 清理与安全公开

cleanup.json 2026-10-17T09:05:26.736Z：**没有创建任何host、provider、simulator、log/video进程**，无运行资源可停/删；四个编译调用均已退出。预分配port57190在127.0.0.1/::1都ECONNREFUSED，未连接6767/6768。22个既有simulator状态逐项不变；checkout HEAD固定且clean。所有自有snapshot/DerivedData/失败日志保留供parent审阅，不清理他人状态。

旧7186 root/causal/offline/perf公开manifest共242项当前bytes/hash全部一致；本轮未写这些目录或6699快照。

独立public/README.md、manifest.json提供安全allowlist：source/config/generation差异、全部编译失败摘录及原始日志SHA、只读诊断、未执行harness、cleanup摘要。无app binary、SQLite DB、home、用户会话/credential、既有device UUID或伪造截图/视频。原始完整Xcode logs/private diagnostics和所有失败均保留上层目录，parent负责最终审阅发布；未push、上传、markready或改PR。

报告生成器首轮因模板命令引号报ReferenceError: usr is not defined（exit1），只修/tmp报告字符串转义后exit0；首轮finalize-blocked.log、result/cleanup-finalize-attempt1.json保留，未重跑build或runtime。package-public.zsh仅对预备harness执行zsh/node语法检查和公开打包，不执行harness；通过不属于native验收。

公开打包首轮exit1：token模式将文件名/identifier中的sk-子串误匹配为key形状。只记录边界字符分类、不保留匹配值；原public-attempt1-rejected与audit/log保留。第二轮为sk-增加词法token边界，仍扫描全部公开文件，不按文件跳过；没有新build/runtime。
