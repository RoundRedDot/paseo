# #7196 / PR #6699 隔离 macOS Release 复现报告

**最新：COMPLETE_WITH_LIMITATIONS（执行完成，保留限制；不标PR ready）。** 正常Claude绝对路径配置后，两个fixture完成顺序已进入真实0.11.4 packaged Release的历史插件客户端：A→B gap **4 → 16 → 4 → 4 CSS px**，B→A gap **4 → 4 → 16 → 4 CSS px**。两种顺序均已实际记录gap出现并自然消失；B→A在后续assistant item到达后恢复紧凑间距。全程0真实模型请求，明确为SDK queryFactory synthetic replay；所有旧失败保留。

**历史 run03：BLOCKED，原因是 replay harness 未配置 Claude 可执行文件路径。** parent接受NetLog缺失限制后，本轮代理/IPC检查通过，真实0.11.4 Release接入专属baseline host，历史插件server loader正常；创建agent时报 `Provider 'claude' is not available`，native replay尚未启动。harness正常availability检查没有因queryFactory注入而跳过，这次路径配置遗漏属于本次QA实现错误，不能归为产品或SDK兼容失败。已清理，0真实模型请求、0/2 Read cases，仍缺症状录像。前两次失败完整保留。

**上一轮 run02：代理受控launch完成，BLOCKED（NetLog门槛后来由parent撤销）。** 保留Chromium sandbox后Release可正常打开；真实updater CONNECT和非D loopback被proxy拒绝，IPC settings等检查通过。NetLog缺少相关请求/代理解析事件，不能证明无DIRECT，因此按前置失败即退出的指令清理，未运行两个Read case。旧Seatbelt失败章节原样保留，新增证据见文末。

## 首次 Seatbelt 尝试（原报告保留）

**Result：BLOCKED。** 已按批准方案启动一次原样签名的0.11.4 Release副本，但Chromium network/GPU helpers在外层Seatbelt策略中无法初始化自身sandbox，主进程在CDP/IPC可用前退出。没有取得“gap出现→随后自然消失”的Release录像；不能据此判断症状已修复或不可复现。未取消网络隔离、禁用Chromium sandbox、修改/重签binary或改用dev Electron。

## 版本、执行身份与时间

- Task configured：`codex/gpt-6.1-sol High`，复杂QA，无转委托。
- 实际provider：**none**。计划路径为 **vendor replay fixture + real packaged app/Claude mapper/baseline host/historical plugin**，实际仅到达packaged main启动，mapper/host/plugin尚未执行；不得称真实vendor验证。
- 唯一新写入根：`/tmp/paseo-pr-native-followup-20261017/7196-run-20261017-01/`；本报告为指定顶层产物。准备开始 **2026-10-17T06:32:23Z**；runtime **06:32:57.528Z→06:33:45.032Z**；清理/制品复核 **06:34:31.624Z**（UTC，UTC+8为14:32:23→14:34:31）。
- 启动attempt **1**；harness返工/重跑 **0**；两个synthetic case实际执行 **0/2**；真实模型请求 **0**。未安装依赖、未build源码、未启动provider、未读用户credentials/sessions。
- 新baseline archive来源：本地 `v0.11.4` / `f55bfd50c2dabc3c03116f14e4518f6132e737fd`，仅 `git archive | tar` 输出到新/tmp baseline。没有把这个tag冒称installed二进制的精确构建SHA。
- 历史插件计划pin仍为 `58672b784b2082764b7c5de620978193f9aaa030` / renderer blob `1179d259aceac465194962ddf3baf0a327e599d3`；**本次未复制完整插件、未安装/编译/加载**，未用当前cache版代替。

## 隔离执行与阻塞证据

从 `/Applications/Paseo.app` 经 `ditto` 复制完整app到新R/Paseo.app；Info.plist/package0.11.4、签名和production JS的先前只读取证保留。此次真实main日志进一步确认：

```text
[desktop] app startup {
  version: '0.11.4',
  platform: 'darwin',
  arch: 'arm64',
  isPackaged: true
}
```

使用新userData、HOME、desktop-home及独立host-home。实际专属端口D=57249、C=57250；不是6767/6768，没有查询/连接/重启主daemon。profile预写完整version1 settings、`manageBuiltInDaemon=false`、`keepRunningAfterQuit=false`及两migration=true。直接spawn副本；未通过LaunchServices定位用户app。

执行命令形状：

```sh
/usr/bin/sandbox-exec -f "$R/loopback-only.sb" "$R/Paseo.app/Contents/MacOS/Paseo"
```

子进程env是显式allowlist：`HOME/USERPROFILE=R/home`、`SHELL=/bin/sh`、受限初始PATH、`TMPDIR=R/tmp`、`PASEO_HOME=R/desktop-home`、新listen/userData与仅127.0.0.1的CDP flags。包内正常login-shell环境导入在本次新HOME下运行，日志记录PATH被系统profile扩展；没有读取或复制用户shell配置/凭据。Seatbelt规则与先前通过Node探针的策略一致，仅允许新D/C loopback出站，IP bind/inbound仅C；未改全局网络配置。

真实Release stderr随后出现：

```text
Failed to initialize sandbox.
sandbox initialization failed: Operation not permitted
Network service crashed or was terminated, restarting service.
GPU process exited unexpectedly: exit_code=6
FATAL:content/browser/gpu/gpu_data_manager_impl_private.cc:417
GPU process isn't usable. Goodbye.
```

这是该签名Release与外层Seatbelt组合下的实际启动失败；不能由此推广为所有Seatbelt/Electron组合都不兼容。先前Node socket/exec probe通过仅证明该探针的网络限制，不覆盖Chromium helper自身sandbox初始化。app内部自行重启过network/GPU helpers，**不是多次harness/app启动**。

最终harness错误为 `AssertionError [ERR_ASSERTION]: CDP endpoint required`，exit1；记录的child exitCode为null，未保存实际终止signal，故不猜测signal值。harness在45秒CDP预算后结束（其退出检查未覆盖signalCode，导致主进程已退出后仍等到预算；没有再次launch）。根因日志在此前已产生；没有用这段等待当作任何服务重启理由。

## 验收矩阵

| 验收 | 结果 | 证据/限制 |
|---|---|---|
| 原样packaged Release副本、独立PID/userData | PASS（main层） | PID97708的命令属于新R/Paseo.app；stdout确认0.11.4/isPackaged/forced userData；未到renderer |
| Mach-O/asar复制前后、原app未变、codesign | PASS | 下表及copy-before/after-hashes、codesign日志 |
| Seatbelt精确新端口策略 | 已应用；完整Electron启动FAIL | loopback-only.sb，真实helper sandbox失败；不是updater transport运行通过 |
| 正常IPC settings=false/status=stopped/本次home | **NOTRUN** | CDP/renderer不可用；不能把预写文件或上轮离线settings probe冒称本轮IPC通过 |
| actual `check_app_update` 请求被策略阻断 | **NOTRUN** | 未调用IPC；没有actual updater transport通过证据；无update-downloaded/quitAndInstall日志 |
| baseline host/Claude mapper/历史plugin compiler与两端loader | **NOTRUN** | 按先隔离门槛后provider的顺序停止；未安装、未build、未运行 |
| A→B / B→A：both-running/first-complete/both-complete/next-item | **NOTRUN，0/2 cases** | 无工具事件、gap测量、截图或连续录像 |
| gap实际出现并随后自然消失 | **NOT_VERIFIED** | 不能替换为旧cache版绿色录像或其它测试 |
| 自有app/helpers/监听清理 | PASS | final-audit.json；PID/子进程均无，D/C两监听均无 |
| 原2026-10-12准确客户端版本/Release模式 | **仍未知** | 本次0.11.4启动不能追溯旧截图的版本 |
| iOS/Android/其它桌面平台 | **NOTRUN** | 无设备/simulator操作 |

## 制品字节、命令与原始日志

原app、copy-before及copy-after的以下SHA256完全一致；原app与副本最终 `codesign --verify --deep --strict` 均exit0：

| 文件 | SHA256 |
|---|---|
| `Contents/MacOS/Paseo` | `65d1fc76c65f7c85b9f206571370d7215b77006caaf17ea3bdd634ea6ac136f5` |
| `Contents/Resources/app.asar` | `5cb34e255bac791ea2d52a487f45a5451306d7b0b7827a5cc1d5297557c831af` |

R内脚本均通过共享锁正常阻塞执行：

```sh
/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh "$R/<script>"
```

| 实际脚本 | exit | 内容与原始日志 |
|---|---|---|
| `prepare.zsh` | 0 | git archive、ditto、codesign、hash、ffmpeg路径只读inventory、预写新settings；`prepare.log/.exit` |
| `isolation.zsh` | **1** | 唯一一次sandboxed Release launch及CDP等待；`isolation.log/.exit`、`evidence/app-stdout.log`、`app-stderr.log`、`isolation-result.json` |
| `finalize.zsh` | 0 | 原app/copy hash与codesign复核、自有PID/监听、新路径及公开allowlist；`finalize.log/.exit`、`evidence/final-audit.json` |

没有运行npm/build/tests/fullsuite/模型请求；准备的baseline源码未被修改或build。未使用另一worker正在执行的7186 runtime，三个脚本分别持锁至退出，均已释放。

## 路径、清理与公开边界

- 实际新main log：`R/home/Library/Logs/Paseo/main.log`。新Chromium Code Cache、Dawn/GPU caches、Local Storage等均在 `R/user-data/`，文件路径清单在final-audit；没有读取旧用户日志/配置/会话。macOS可能产生该副本的通知/崩溃诊断等常规OS元数据，本轮未读取用户通知/诊断数据库，也不宣称OS零写入。
- 主进程自行退出；harness finally只针对捕获的本次process group做清理；final audit确认该PID及copy路径helpers均无、57249/57250无监听。没有启动host，因此无host/provider/client资源遗留。未移除新profile、app copy、baseline及原始日志，留待parent验收。
- 只准备公开allowlist：`R/public-allowlist/README.md`、`result.json`、`startup-error-excerpt.txt`、`manifest.json`。它明确描述启动blocker，不含private homes、完整profile、baseline源码、凭据或用户材料；没有上传。原始未剪录像**未产生**，不是遗漏/删去失败录像。
- 没有Git提交/状态写入、push、上传、PR修改、用户app/账号操作、全局工具安装或更改认证。旧原始截图、已发布证据、此前29/29 Pi QA和17PASS4FAIL等均未改写。

## English PR/issue supplement draft

> A new attempt used an unmodified copy of the signed/notarized macOS 0.11.4 packaged app, fresh profile and homes, and a per-process Seatbelt policy that allowed only the isolated host and CDP ports. The packaged main process reported `isPackaged: true`, but Chromium network/GPU helpers failed sandbox initialization (`Operation not permitted`), and the app exited before CDP/IPC became available. No baseline host, historical plugin, vendor replay or model inference ran; neither requested completion-order case ran, and no symptom video was produced. This is an isolated Release startup blocker, not evidence that the transient gap is fixed or cannot be reproduced. The original app and copy retained identical Mach-O/asar hashes and valid signatures. Owned processes and listeners were verified gone. The exact app version/build mode of the original 2026-10-12 screenshot remains unknown.


## 追加：一次受控proxy launch（第二种harness，未降低sandbox）

- Task configured仍为 `codex/gpt-6.1-sol High`；实际provider仍none，计划vendor replay未到达。准备06:43:02Z，runtime **2026-10-17T06:43:58.205Z → 2026-10-17T06:44:19.025Z**；最终audit **2026-10-17T06:47:31.169Z**。本轮app launch1次、无重跑；与前轮Seatbelt合计2次app尝试，仍0/2 Read cases、0真实模型请求。未安装依赖或启动baseline host/plugin。
- 新目录仅 `/tmp/paseo-pr-native-followup-20261017/7196-run-20261017-02`；保留前轮copy和失败证据，新copy来自前轮未改签名app。新增进程PID38188；D=60681、C=60682、P=60684、非D测试F=60683。D仅保留给未来host，未启动host。未连接6767/6768、未改全局代理。
- 正常直接spawncopy，**无外层Seatbelt、无no-sandbox**。`PASEO_ELECTRON_FLAGS`含proxy-server、proxy-bypass-list=<-loopback>、log-net-log及loopback CDP。HOME、userData、desktop-home/host-home均全新；proxy只会dial固定D，拒绝其它authority前不DNS/connect。

| 前置/验收 | 本轮结果 | 精确证据及边界 |
|---|---|---|
| 实际Release renderer打开 | PASS | 人工查看 `evidence/failure.png`，全新欢迎页，v0.11.4；不是症状截图或录像 |
| sandbox保持启用 | PASS（正常IPC报告） | `desktop_sandbox_diagnostics={enabled:true,reason:"Chromium default"}`；未独立进行macOS OS级sandbox探测 |
| settings false / 新desktop-home daemon stopped | PASS（harness断言） | get_desktop_settings完整false值保留；status/home/无pid断言已先于updater通过。但raw status对象被最终overall status字段覆盖，原始响应未单独保留，不能补造 |
| actual updater partition拒绝 | PASS | 正常check_app_update后proxy拒绝CONNECT github.com:443；IPC `net::ERR_TUNNEL_CONNECTION_FAILED`、hasUpdate=false、readyToInstall=false；不是只测renderer fetch |
| 非D loopback无隐式绕过 | PASS | fetch `127.0.0.1:60683/qa-loopback-deny`到达proxy并被拒，未dial F |
| NetLog无DIRECT且覆盖相关请求 | **FAIL / evidence missing** | 完整可解析NetLog仅11 events，proxy-resolution=0、URL=0；虽DIRECT出现0次，但缺少正向覆盖，不能以零记录证明无绕过 |
| A→B/B→A及gap出现→自然消失录像 | **NOTRUN / NOT_VERIFIED** | 前置失败后立刻进入清理，没有第三次launch、replay、截图拼接或旧绿色录像替代 |
| app/helper/proxy/监听清理 | PASS | app正常exit0，helper均无，D/C/P监听均无；final-audit.json |
| copy/原app bytes及签名 | PASS | Mach-O/asar前后不变、与原app相同；两者codesign严格verify exit0 |

### 实际请求与失败原因

`proxy-events.json`完整记录1次非D loopback GET拒绝、3次GitHub CONNECT拒绝。第一条对应本次显式IPC，其余来自app正常启动自动检查；不是模型请求或额外case。没有任何allowed代理上游连接，proxy没有向外网发出CONNECT。Node网络不受该proxy强制保护，此边界没有被抹去；本次尚未启动任何Node baseline host/provider。

`Netlog proxy resolution evidence required`是门槛断言错误。本轮最终NetLog确实缺少proxy/request事件，**不是已证实的proxy_list字段改名**，也没有查明日志覆盖缺失的原因；不归因为产品gap bug。main/renderer代理行为已经有真实拒绝证据，但不能放宽parent明确要求的NetLog门槛后继续。未尝试其它flags、修改app或额外launch。

原始片段：

```text
PROXY {"at":"2026-10-17T06:44:03.720Z","method":"CONNECT","target":"github.com:443","allowed":false}
PROXY {"at":"2026-10-17T06:44:03.724Z","method":"GET","target":"http://127.0.0.1:60683/qa-loopback-deny","allowed":false}
"errorMessage": "net::ERR_TUNNEL_CONNECTION_FAILED"
AssertionError [ERR_ASSERTION]: Netlog proxy resolution evidence required
```

脚本均正常阻塞共享lockf：`prepare.zsh` exit0、`runtime.zsh` exit1、`finalize.zsh` exit0。原始 `runtime.log`、`evidence/result.json`、`proxy-events.json`、`netlog.json`、stdout/stderr、`postmortem.json`与签名/hash清理证据保留。NetLog包含本次新profile的网络诊断，未进入公开allowlist。新profile和HOME保留，未读/清理用户旧日志或设置；实际新日志仍为R/home/Library/Logs/Paseo/main.log。无Git/源码/账号/远端操作。

本轮只读公开子集在 `R/public-allowlist/`：README、脱敏result、proxy事件、manifest；不含private homes、完整profile、raw NetLog、用户材料。没有上传或改写前轮公开子集。原2026-10-12 app准确版本/模式以及iOS/Android/其它桌面验收仍未知/未运行。

### English supplement — controlled proxy follow-up

> A single follow-up launch retained Chromium's built-in sandbox and used a fresh profile/home plus an isolated fixed-target HTTP/CONNECT/WebSocket proxy. The unchanged macOS 0.11.4 Release app opened. Normal IPC reported sandbox enabled and daemon management disabled; the stopped-daemon/home assertions passed. The actual updater GitHub CONNECT was denied, with ERR_TUNNEL_CONNECTION_FAILED returned by IPC, and a non-target loopback request also reached the proxy and was denied. However, the required NetLog evidence gate failed: the complete log contained only 11 events and no proxy-resolution or URL-request events. Zero DIRECT mentions is insufficient without request coverage. We stopped and cleaned the owned app/proxy processes instead of proceeding. No provider replay, model inference or Read completion-order cases ran, and the requested symptom video remains missing. The earlier Seatbelt failure is preserved; signatures and Mach-O/asar bytes remain unchanged. Node networking is outside this proxy's enforcement boundary.


本轮实际命令（各次完成后才执行下一条，日志分别为 prepare.log / runtime.log / finalize.log）：

```sh
R=/tmp/paseo-pr-native-followup-20261017/7196-run-20261017-02
/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh "$R/prepare.zsh"
/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh "$R/runtime.zsh"
/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh "$R/finalize.zsh"
```

实际 `PASEO_ELECTRON_FLAGS`：

```text
--remote-debugging-address=127.0.0.1 --remote-debugging-port=60682 --proxy-server=http://127.0.0.1:60684 --proxy-bypass-list=<-loopback> --log-net-log=/tmp/paseo-pr-native-followup-20261017/7196-run-20261017-02/evidence/netlog.json
```


## 第三次：接受NetLog限制后接入真实baseline host

- Task configured：`codex/gpt-6.1-sol High`；本轮准备始于 `2026-10-17T06:49:36Z`；runtime **2026-10-17T06:52:34.711Z → 2026-10-17T06:53:40.144Z**；清理复核 **2026-10-17T06:55:19.811Z**。本轮1次app launch（总计3次）、1次baseline host、1次agent创建请求被拒；0 SDK queryFactory调用、0 vendor frames、0/2 Read case、0真实模型请求。没有第二次本轮launch或额外case。
- 写集：`/tmp/paseo-pr-native-followup-20261017/7196-run-20261017-03` 与本报告；原仓库/Git、原app、用户账号/配置/旧会话、已有实例和6767/6768均未操作。复制原签名app，独立HOME/userData/desktop-home/host-home，保留Chromium sandbox，无Seatbelt/no-sandbox/重签名。
- Source：baseline为首次run的原样 `v0.11.4=f55bfd50c2dabc3c03116f14e4518f6132e737fd` archive副本，经独立npm依赖与标准build；不是冒称installedapp精确build SHA。app仍原包0.11.4，Mach-O/asar哈希同前两轮。
- 历史插件完整archive固定 `58672b784b2082764b7c5de620978193f9aaa030`；`client/live-renderers.tsx` Git blob仍 `1179d259aceac465194962ddf3baf0a327e599d3`，无arrivalRef。runtime后将全部 **673** source文件与另行解包的pristine archive逐字节hash比较一致；未加cache/CSS/时间戳修正。仅node_modules由npm ci生成。

| 验收 | 本轮结果 | 证据/边界 |
|---|---|---|
| Release原包copy启动/Chromium sandbox | PASS | normalIPC enabled=true / Chromium default；未独立OS级探测 |
| manageBuiltInDaemon=false / stopped / 本次home | PASS | `desktop-settings-raw.json`、`desktop-status-raw.json`分别保留，无字段覆盖；pid=null、ownedByDesktop=false |
| actual updater CONNECT拒绝与IPC对应失败 | PASS | proxy拒绝GitHub CONNECT，IPC ERR_TUNNEL_CONNECTION_FAILED；无update/download成功 |
| 非D loopback被proxy拒绝 | PASS | F=63450；不DNS/connect到F |
| NetLog | LIMITATION | 未作为Read阻塞，不宣称全进程隔离或绝无DIRECT |
| 专属D真实连接 | PASS | 正常“直接连接”填127.0.0.1、D=63448后，proxy CONNECT allowed=true；真实packaged app显示新host的synthetic cwd workspace |
| 历史plugin server compiler/loader | PASS | normal listPlugins status=running，catalog保留；未shim |
| client tool renderer实际挂载/间距 | NOT_VERIFIED | 未能创建agent、尚无tool行；不能仅由server running证明 |
| A→B、B→A完成顺序、gap出现→自然消失录像 | NOTRUN | availability先拒绝；未生成视频或使用旧绿图替代 |
| 清理、bytes/signature | PASS | app exit0；host/插件/observer/app helpers均无，D/C/P/F监听均无；原app与copy严格codesign exit0、hash一致 |

### 精确失败与只读定位

`host.mjs`用既有`ClaudeAgentClient({queryFactory, resolveBinary, resolveVersion})` seam，未改SDK或产品。隔离runtime PATH是 `/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`。`resolveBinary`只控制session launch；正常 `ClaudeAgentClient.isAvailable()`仍独立使用`runtimeSettings.command`或默认`claude`做可执行文件存在性查找。`provider-snapshot-manager.ts:506`在status!=ready时拒绝创建，随后agent-manager也有独立isAvailable门。此次未给runtimeSettings.command绝对路径，故尚未到达queryFactory。这是可避免的harness配置遗漏，已明确承认；没有改availability返回值或换假provider。

脱敏原始片段（完整runtime.log保留）：

```text
RUNTIME READY {"D":63448,"C":63449,"P":63451,"F":63450,"appPid":8842}
Error: Provider 'claude' is not available
    at DaemonClient.createAgent (.../baseline/packages/client/dist/daemon-client.js:1634:19)
```

在app/host退出后只运行一次filesystem-only availability对照，不启动CLI、不调用queryFactory、不读取auth/session：原隔离PATH下defaultAvailable=false；以`command:{mode:"replace",argv:[实际Claude绝对路径]}`配置的同一个真实ClaudeAgentClient返回configuredAvailable=true。路径由正常command -v查出并仅stat；CLI版本与账号未探测。这是正常配置可行性的证据，**未应用到新的runtime、未证明Read回放**。若parent另行批准继续，最小准备是为真实Claude客户端配置该绝对路径并让resolveBinary返回同一路径，queryFactory仍作为明确标注的vendor replay seam；不需要SDKshim或重写isAvailable。

另有finalize脚本取证返工1：曾错误假定本地SDK npm包有cli.js，filesystem stat报ENOENT，保留`availability-audit-attempt1.log`及`finalize-attempt1.log`。后改为读取实际已安装CLI路径，只检查存在性；没有通过下载/安装工具补缺。这个审计失败未启动app/provider/模型。

### 命令、退出与清理

全部npm/build/runtime/取证正常阻塞共享lockf，未并行runtime、未跑suite或设备：

```sh
R=/tmp/paseo-pr-native-followup-20261017/7196-run-20261017-03
/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh "$R/prepare.zsh"
/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh "$R/runtime.zsh"
/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh "$R/finalize.zsh"
```

- prepare exit0：baseline `npm ci --ignore-scripts --no-audit --no-fund`、`npm run postinstall`、`npm run build:server`，plugin `npm ci --ignore-scripts --no-audit --no-fund`均通过；各自原始log保留。npm cache与userconfig均专属/tmp。无product edits，未运行format/lint/typecheck或源码tests。
- runtime业务失败已写result、正常关闭app（exit0）和host，保存proxy/observer/vendor-frame记录；Node仍有未退出handles，随后只对本次PTY发SIGINT，工具返回exit1并中断外层shell，故`runtime.exit`未写出，不能补造一个独立Node退出码。清理复核证明相关PID/插件/监听均无。
- finalize attempt1 exit1（SDKcli.js stat ENOENT）；attempt2 exit0（实际CLI纯存在性检查、全树插件比对、签名/hash、PID/listener复核）。没有因此再launch或运行case。
- proxy共3条GitHub CONNECT拒绝、1条F GET拒绝、1条专属D CONNECT允许；允许项仅本次host，Node路径不受Chromium proxy强制保护仍是边界。

### 安全证据与未覆盖项

本轮公开候选仅`R/public-allowlist`：中文README、脱敏result、proxy事件、原始IPC settings及脱敏status、原样新profile界面截图、hash manifest。原始host日志（含本机hostname）、完整catalog/NetLog、HOME/userData、dependency树及CLI绝对路径审计均不进入公开子集；原始证据在专属run内保留。无上传/远端修改。普通通知登记、新HOME日志为已接受边界，未读/清理用户旧日志。原2026-10-12精确客户端版本/模式继续未知；无iOS/Android/其它设备验收。

### English supplement — baseline host and historical plugin

> After accepting the missing NetLog coverage as a limitation, one further controlled launch of the unchanged macOS 0.11.4 Release copy passed the proxy and normal-IPC preflight checks. The stopped-daemon/home and disabled-management responses were retained separately. The app connected normally to the isolated 0.11.4 baseline host; the complete historical plugin at 58672b7 compiled and reported running, with all 673 source files matching its pinned archive and renderer blob 1179d259 unchanged. Agent creation then failed with “Provider 'claude' is not available”: our replay harness omitted an absolute Claude command in its restricted PATH, while the normal availability check still runs independently of queryFactory injection. This is a harness configuration error, not an observed plugin/SDK compatibility failure. No SDK frames, Read cases or model inference ran, so the requested transient-gap video is still missing. A filesystem-only check showed that normal absolute-command configuration resolves availability, but no additional app launch was attempted. Owned processes/listeners were removed, signatures/bytes stayed unchanged, and both previous failures remain preserved. Node networking remains outside the Chromium proxy enforcement boundary.


## 最终追加：绝对路径修正后的两个fixture Read

### 结果与准确证据范围

| Case / phase | both-running | first-complete | both-complete | next-item | 结论 |
|---|---:|---:|---:|---:|---|
| A→B，run04 | 4 | 16 | 4 | 4 | 实际出现→自然消失 |
| B→A，run05 | 4 | 4 | 16 | 4 | 实际出现→自然消失 |

单位均为CSS px：`gap=B.root.top-A.root.bottom`。每phase取12次200ms间隔外部DOM读数；完整samples、逐phase两个row/header矩形、marginBottom、真实Running progressbar、expanded状态、滚动祖先与canonical timeline均保存。两case都验证仅两个native Read callId、A/B位置不变、按callId等待实际canonical status后才推进。没有CSS/layout/timestamp/arrival cache修改，没有强制滚动或折叠；document、window与agent-chat-scroll均scrollTop=0。实际viewport1200×800 / devicePixelRatio2；CDP JPEG录像最大1920×1280，视频像素与CSS坐标不能直接混用。

A→B：first-complete时A的canonical timestamp由首次到达变为完成事件时间，原位置保持；历史插件的A marginBottom从-12px变0px，B变-12px，gap4→16。B完成后A重新有后继，gap自然恢复4；next-item仍4。B→A的状态、时间和margin以对应原始phase JSON为准，不用A→B结果替代。

**实际provider链：synthetic Claude SDK queryFactory frames → 原始ClaudeAgentSession mapper → 真实0.11.4 baseline host/WS → 原始0.11.4 packaged app → 历史beautiful-chat transformer/renderer。** queryFactory是已有测试seam，未改SDK、isAvailable或产品代码；不是实际vendor/CLI执行或模型推理。两PNG为本次自有1×1 synthetic本地文件；Read result使用SDK允许的text content表示完成，不附base64 assistant image block，也未执行真实Read工具。本轮证明native Read生命周期timestamp导致的画面间距现象，不宣称真实vendor返回图像/推理图片链通过。

### 原片与截图

- A→B：`/tmp/paseo-pr-native-followup-20261017/7196-run-20261017-04/evidence/case-A-B/release-uncut.mp4`；`frames/`、`frames.json`、`uncut.ffconcat`、`ffprobe.json`、四phasePNG及turn-complete.png全部保留。原片含录制时工作区hover提示，部分遮住B行下侧；未后期擦除/裁切，gap区域及原始DOM测量可核对。
- B→A：`/tmp/paseo-pr-native-followup-20261017/7196-run-20261017-05/evidence/case-B-A/release-uncut.mp4`；同样保留完整原始帧和四phase截图。本case在录制前正常移开鼠标消除工作区tooltip；不是DOM/CSS修改。
- 录像来源为真实Release renderer的`Page.startScreencast` compositor JPEG帧，**不是全桌面/OS窗口chrome录像**。全部帧按原顺序与原metadata时间戳单次编码为VFR H.264，无剪辑、裁切、overlay或变速。CDP是采样捕获，不声称每个compositor frame都完整；以frames.json原始时间戳为准。视频编码duration与capture区间误差<0.2s；编码/ffprobe exit0。

- A-B：3089 frames；capture 63.317s，encoded 63.317s，1920×1280。
- B-A：722 frames；capture 15.534s，encoded 15.534s，1920×1280。

### 本轮版本、隔离与清理

- Task configured `codex/gpt-6.1-sol High`；run04 **2026-10-17T06:57:35.476Z → 2026-10-17T07:00:15.517Z**，run05 **2026-10-17T07:07:05.722Z → 2026-10-17T07:07:54.705Z**，最终audit **2026-10-17T07:15:00.304Z**。共5次app launch（run01–05）；有效case2，另1次跨工作区B→A启动后因视觉status断言失败中止。所有真实模型请求累计仍0，未重新安装依赖/build；复用run03已build的archive/dependency。
- 0.11.4 app仍原签名copy，Mach-O `65d1fc76c65f7c85b9f206571370d7215b77006caaf17ea3bdd634ea6ac136f5`，asar `5cb34e255bac791ea2d52a487f45a5451306d7b0b7827a5cc1d5297557c831af`，原app与两个copy前后hash相同、codesign deep/strict exit0。Electron44.2.0。原制品准确构建SHA仍未知。
- host源码/编译来自 `v0.11.4=f55bfd50c2dabc3c03116f14e4518f6132e737fd`，未修改源码；生产renderer bundle SHA256 `f420d2f7bf85d22207ea62dc54b5593e9dee8b4261874a83fa8e37f938872486`。该tag不冒称制品精确构建SHA。历史plugin仍固定 `58672b784b2082764b7c5de620978193f9aaa030`，673 source文件逐项与pristine pin一致，renderer blob `1179d259aceac465194962ddf3baf0a327e599d3`；compiler/host SDK0.11.4，插件声明开发SDK0.11.2。实际client tool roots与running/completed画面已挂载，不再仅凭server running判断。
- 每次新HOME/userData/desktop-home/host-home；正常IPC分别保存settings原始响应和stopped/home原始响应：false、pid=null、ownedByDesktop=false。未继承旧用户session/auth，未连接6767/6768。保留Chromium sandbox，无Seatbelt/no-sandbox/改签；updater实际CONNECT拒绝且IPC失败，非D loopback拒绝，固定D允许。NetLog缺少正向覆盖为既知限制，不声称全进程隔离/绝无DIRECT；Node不受Chromium proxy强制保护。
- run04 app exit0、harness exit1（B phase断言），run05 app exit0、harness exit0；共享lockf已释放。run05停前记录完整自有process tree，停后全部PID与D/C/P/F监听消失；run04进程/监听也复核无。仅清理本次PID/监听，新home/evidence保留，没有Git/远端/生产源码或原用户实例写入。

### 返工与未抹去的失败

1. run01：外层Seatbelt导致Chromium helper嵌套sandbox失败；原copy/日志保留。
2. run02：真实proxy拒绝通过，但自设NetLog覆盖门槛终止，parent后撤销该门槛；证据保留。
3. run03：隔离PATH缺少默认Claude，queryFactory不跳过正常availability；harness配置遗漏。之后按正常runtimeSettings.command replace argv=实际已安装Claude绝对路径、resolveBinary同路径修正；isAvailable未改，CLI不执行。
4. run04：A→B完成并取得症状；随后同一app跨工作区启动B→A，canonical A/B running但DOM A未显示Running progressbar，断言失败，清理并保留raw frames/截图/log。根因尚未确定，不能武断称插件/产品bug。该失败case的frames.json未在异常前落盘，只有原始JPEG序列，不冒称完整可审计录像。
5. run05：为B→A换全新profile+单agent，先等待空聊天挂载稳定再回放；DOM status mismatch改为如实记录观测FAIL，而非作为提前停止录像的门槛，canonical callId/status门控未放宽，隔离/loader要求未放宽。该case每phase客户端状态观测：both-running=true, first-complete=true, both-complete=true, next-item=true。

原run03 finalize的SDKcli.js文件假设错误也保留，未覆盖原始失败。本轮没有因日志缺失另launch，没有为结果修改产品/插件workaround。

编码取证返工：首次A视频format.duration=62.575s与capture63.317s不符，断言正确失败；微秒输入timebase后仍有同一差异，故早先“逐帧毫秒取整”的解释不足。随后对input/output逐packet只读核验：全部3090帧的presentation timestamp实际保留到63.316911s，但B-frame重排导致最后DTS及MP4 duration提前。关闭编码端B-frame重排（-bf 0）、显式微秒encoder timebase及x264 60fps nominal hint（force-cfr=0），再从同一全部原始帧编码，逐项检查nb_frames=raw+1、has_b_frames=0、duration误差<0.2s。attempt3曾使用-r 60与VFR组合，被本机ffmpeg明确拒绝（exit234，未生成视频），已保留log；最后采用encoder的fps hint。attempt1/2 mp4、ffprobe、log、concat和packet诊断全部保留；未重录/重跑case，原始帧未覆盖。

### 实际命令与退出

```sh
# R分别是7196-run-20261017-04、7196-run-20261017-05
/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh "$R/prepare.zsh"
/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh "$R/runtime.zsh"
# 两case结束后，串行编码和审计
/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh /tmp/paseo-pr-native-followup-20261017/7196-run-20261017-05/finalize.zsh
```

prepare04/05 exit0；runtime04 exit1、05 exit0；finalize exit0；两个ffmpeg/ffprobe exit0。runtime04/05原始log、完整命令脚本、SDKframe记录、observer事件、host/client catalog与DOM测量保留。未运行全套tests、其他绿色fixture或native-device测试。

### 公开候选与剩余限制

新`run05/public-allowlist`只含两个原片、四phase截图/脱敏测量/结果、proxy事件、settings与脱敏daemon status、版本/hash manifest/README；不含private homes、raw auth/credentials、完整host日志、catalog、NetLog或用户旧材料。A原片有本机hostname与/tmp合成路径的正常tooltip，parent发布前可自行决定是否公开；未剪辑掩盖。不上传/改GitHub，parent统一验收。原2026-10-12客户端精确版本/Release模式继续未知；本轮只证明当前macOS0.11.4 packaged Release的确定性回放，不涵盖真实Claude vendor、OMP、iOS/Android或其它用户设备。

### English PR/issue supplement draft

> We reproduced the transient spacing change in the unmodified, signed macOS 0.11.4 packaged Release app with Electron 44.2.0. A real isolated 0.11.4 baseline host and Claude mapper received deterministic synthetic SDK Read lifecycle frames through the existing queryFactory test seam; no vendor CLI/model inference ran. The complete historical beautiful-chat plugin was pinned to 58672b7, with all 673 source files unchanged and renderer blob 1179d259, without an arrival cache or spacing workaround. Both completion-order cases were executed. The measured A→B gaps were 4 → 16 → 4 → 4 CSS px across both-running, first-complete, both-complete, and next-item; B→A measured 4 → 4 → 16 → 4 CSS px. Native call IDs and row order remained stable, with no scrolling/collapse/style modification. Continuous uncut CDP recordings of the real Release renderer, original frames/timestamps, screenshots, canonical events and external DOM measurements are retained. Earlier sandbox, NetLog-gate and harness failures are also preserved; a cross-workspace status-observation failure led to running B→A in its own fresh profile. The app/host processes and listeners were cleaned up, and signatures/Mach-O/asar/plugin source hashes stayed unchanged. The proxy blocked actual updater CONNECTs with matching IPC failure and non-target loopback traffic; Node networking is outside its enforcement boundary and missing NetLog coverage is a stated limitation. This does not establish the exact client version/build mode of the original 2026-10-12 report or real-vendor/mobile-device coverage. No upload or PR-ready change was made.


## 最后制品核验

- A-B：全部3090个packet（全部原始帧+末尾时间标记）PTS与原始capture逐项一致，最大误差1.485e-7s；ffprobe exit0。
- B-A：全部723个packet（全部原始帧+末尾时间标记）PTS与原始capture逐项一致，最大误差1.676e-7s；ffprobe exit0。

B→A both-complete/next-item从最终mp4实际seek/decode为PNG，ffmpeg各exit0；未用原截图替代解码验证。最终finalize attempt4 exit0；attempt1/2时长断言及attempt3参数冲突的失败均保留，后续final-verify exit0。

实际runtime字节SHA256（最后核验 2026-10-17T07:15:42.668Z）：

- hostBootstrap: `feecd0a1967f9d16bbe0c4895c1efd930e05bc885b7ddb0d6952aa8a3b89ef3a`
- claudeSessionMapper: `519318ffe2c3427e9478ebd3e29e2d28835558c9fb40ff3136f3557c1a077060`
- claudeToolCallMapper: `ce7a4ce016271bc7637d8e226952b0ccee411352fcad9514efba5660339bfda1`
- pluginCompiler: `4445e6f90710d7cc30c76a4a865625ee046ab15d96a397789e9dee2a336d125b`
- loadedPluginClientBundle: `68e89027b53aad1dbf0706d19ced61b03e0da3adafba1d87d43d59e57c9d5ce6`
- packagedRenderer: `f420d2f7bf85d22207ea62dc54b5593e9dee8b4261874a83fa8e37f938872486`
