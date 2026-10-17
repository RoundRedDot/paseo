# #6699 最终 head 生产打包 UI 集成对照

**Result：complete，限下述集成范围；没有标 ready。** 来源/最终 Git SHA 均为 `2947e07d1209447d9b023302ed610efc81ae1aa8`，指定 checkout 最后仍 clean；产品 checkout、主 daemon、原用户 app、远端均未修改。开始 2026-10-17 16:32 +08，结束 2026-10-17T09:01:22.713Z（UTC）。任务配置 codex/gpt-6.1-sol High/full-access；实际 provider 是真实 Claude provider/mapper 的 queryFactory synthetic SDK frames replay，**0 真实 vendor/model 请求**。共 3 次 synthetic queryFactory session、6 个 Read tool lifecycle（含失败后保留的 A-B 部分运行），最终两种顺序各一个完整成功 run。

## 对照边界

| 证据 | 版本 / 来源 | 分发形态 | 结论 |
| --- | --- | --- | --- |
| 旧症状录像 | 官方 macOS 0.11.4；host tag `f55bfd50c2dabc3c03116f14e4518f6132e737fd`；app 精确构建 SHA 未知 | 原官方已签名 Release 包 | 旧 A→B 为 4→16→4→4；B→A 为 4→4→16→4 CSS px |
| 本轮 candidate | 最终 PR head `2947e07…`，app/host 0.12.0-beta.1，Electron 44.2.0，arm64 | 正常 Expo production export + electron-builder ZIP；本地 ad-hoc、hardenedRuntime=false、未公证 | 同 Read 场景的修复后集成通过；不是 dev Electron |

两个版本及分发形态独立，**不将全部显示差异单独归因本 PR，也不宣称正式 Developer ID/hardened/notarized 分发形态已验收**。原 2026-10-12 客户端精确版本/Release 模式仍未知。没有另造同树 baseline。

固定完整历史 plugin `58672b784b2082764b7c5de620978193f9aaa030`，673 个源文件逐一 SHA256 不变；renderer Git blob `1179d259aceac465194962ddf3baf0a327e599d3`。没有 arrival-cache、CSS/timestamp workaround、SDK shim 或 store 注入。candidate 快照 5680 个 tracked blobs 与固定 Git SHA 全部匹配，renderer 实际加载 `paseo://app/_expo/static/js/web/index-1a7596549c89221d32dd1176076cf76d.js`，并非旧 0.11.4 app 仅连接新 host。

## 最终验收结果

| 项目 | A→B（run-A-B-4） | B→A（run-B-A-1） |
| --- | --- | --- |
| both-running / first-complete / both-complete / next-item gap | **4 / 4 / 4 / 4 px PASS** | **4 / 4 / 4 / 4 px PASS** |
| 外部矩形采样 | 48 次，全部 4px | 48 次，全部 4px |
| canonical callId/status、client spinner、ID/顺序 | PASS，2 行无重复 | PASS，2 行无重复 |
| arrival timestamp / latestTimestamp | arrival 跨生命周期与 reload 不变；latest 与各 phase 原始 canonical 时间精确匹配 | 同左；较早到达的 A 最后完成，仍正确取 A 的最新时间 |
| native completed footer | 9440ms → **9s**；reload 后相同 | 9450ms → **9s**；reload 后相同 |
| 若只保留 arrival 而漏 latest 的时长 | 1406ms（用于区分回归，不是旧版时长结论） | 1408ms |
| 回合终态与真实 renderer cache/reload | idle / activeTurn=null；IndexedDB readonly 观测，ID、arrival/latest、顺序、状态恢复 PASS | 同左 PASS |
| 自然滚动/折叠 | window/document/各 scroll ancestor 均 0；Read 保持 collapsed | 同左 |
| 未剪 compositor 原片 | 786 原始帧 + 末尾时间标记；21.214939s | 787 原始帧 + 末尾时间标记；21.207919s |

为隔离 latest/duration 修复，回放在 Read 前增加 assistant 确认文本，Read 回合先实际终止，再用正常 system/init bracket 回放下一条 autonomous assistant。四个 gap phase 使用历史插件默认设置；仅在 both-complete 与 next-item 之间，通过插件既有 `settings.presentation.read/write` RPC 暂关 `assistantMarkdown` 露出 native footer，reload 核验后恢复默认并确认重投影。Read transformer/间距/时间戳逻辑没有修改。计时按 canonical 用户行到最大 lifecycle 边界验收；fixture 的 SDK duration_ms 是 synthetic metadata，不是 vendor 耗时证明。

**Reducer/canonical red-green 与此 UI 集成证据分开。** 本轮没有执行或新增单测，没有复跑旧绿 suite，没有把其它 head 的单测结果当成本 head 通过。这里的 canonical 证据来自真实 host 对 SDK fixture 的转换与实际客户端状态/缓存，原始事件和稳定 IDs 可审阅；不替代 reducer/canonical 独立红绿回归。

## 隔离与清理

两成功 run 均在进入 fixture 前保存分开的 raw IPC：`get_desktop_settings` 为 manageBuiltInDaemon=false；`desktop_daemon_status` 为 stopped/pid=null/ownedByDesktop=false/home=本 run desktop-home；`desktop_sandbox_diagnostics` enabled=true / Chromium default。结束前再次读取 false/stopped/home。新 HOME/userData/desktop-home/host-home、固定 D 和独立 PID 均在本目录；不连接 6767/6768。

实际 updater GitHub CONNECT 被代理拒绝，IPC 对应 `net::ERR_TUNNEL_CONNECTION_FAILED`；非 D loopback 被拒。代理只接受 `127.0.0.1:D` 或 `localhost:D` 两个精确 authority，实际 upstream 永远固定 127.0.0.1:D；其它目标不解析/不连接。Node 出站不由 Chromium proxy 全面约束，NetLog 没有全请求覆盖，不宣称全进程隔离或绝无 DIRECT。Chromium sandbox 未降低；hardenedRuntime=false 的本地签名差异明确保留。

五次 app launch 的自有 PID/监听最终均已清理；A-B-3 的晚到 CDP ACK 在 teardown 引发未捕获 rejection，独立 recovery 仅终止其仍存活的自有 app process group，并逐端口验证退出（recover-A3 exit0）。后续 recorder 在 stop 后解除监听、等待帧写完，两个成功 run 正常退出。新 homes/原始失败保留，不读取/清理用户旧日志/设置。最终 app Mach-O/asar hash、strict codesign 和 plugin 673 文件再次核验不变；没有修改原 app。A-B-3 的 emitter dump 未写出；已从该 run 实际 `provider.claude.parsed_event` trace 原样恢复 15 个 SDK rawEvent，并单独标注恢复来源，保留原失败状态。

## 命令 / 退出码 / 失败保留

所有安装、patch、build、packaging、runtime、编码/审计均由：

`/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh <本目录 scripts/*.zsh>`

正常阻塞串行，每阶段释放；每个脚本对应同名 .log / .exit。单 browser/runtime 顺序执行，无 runner 自动 retries。

| 阶段 | 实际关键命令 / 结果 |
| --- | --- |
| setup | `npm ci --ignore-scripts --no-audit --no-fund` → `npm run postinstall`；setup exit0 |
| production build | `npm run build:desktop -- --publish never --mac --arm64 --dir -c.mac.identity=- -c.mac.notarize=false …`；build exit0，owning stack tsc/Expo production export 完成 |
| source/signature preparation | prepare / verify-local / verify-release exit0；tracked-source、plugin hashes、strict codesign 通过 |
| local packaging | package-local exit0；随后正常 ZIP target `npm exec --workspace=@getpaseo/desktop -- electron-builder --config electron-builder.yml --publish never --mac zip --arm64 -c.mac.identity=- -c.mac.notarize=false -c.mac.hardenedRuntime=false …`，package-release-attempt2 exit0 |
| preserved CLI failure | package-release exit1：`Unknown argument: zip`（初次 target argv 次序错误），修正一次；未改包内文件补 updater config |
| runtime A-B-1 | exit1：ad-hoc + hardened runtime 在 dyld 发生 `different Team IDs`，尚未进入 renderer；原包保留，后续只调整新包签名配置 |
| runtime A-B-2 | exit1：splash 首帧早于 root 挂载，harness 立即断言；改为等候实际 root。另查明 `--dir` 不生成 app-update.yml，改正常 ZIP target |
| runtime A-B-3 | exit1：前三 phase、native footer/cache reload 已过；恢复插件设置时 localhost:D 被原 whitelist 拒绝超时，随后 late ACK teardown 错误。保留所有 raw JPEG/index、截图、日志及标明 reconstructed 的 recovery result |
| runtime A-B-4 / B-A-1 | **exit0 / exit0**；两种完整顺序通过 |
| finalize | **exit0**；两 ffmpeg/ffprobe/seek-decode 各 exit0，全部 packet PTS 对应原始 captured frames；没有剪辑/裁切/覆盖/变速 |

每个具体验收缺陷修正均未超过两次。单独失败、配置遗漏与最终成功证据没有覆盖。未修改产品源码，无 format/lint/typecheck 单独运行、无 hooks/commit、无旧绿 suite/full suite；正常 owning-stack build 的编译结果单列，不冒充单测。

原始输出片段（仅自身 synthetic 数据）：

`PHASE both-running / first-complete / both-complete / next-item: clientStatusMatched=true, gap=4`

`A-B: 工作了 9s, ended 16:51; before/after reload unchanged`

`B-A: 工作了 9s, ended 16:52; before/after reload unchanged`

`PASS final audit`

## 制品与 SHA

- 完整证据：`run-A-B-4/evidence/case-A-B/`、`run-B-A-1/evidence/case-B-A/`；每个目录保留原 JPEG/frames.json、未剪 MP4、phase PNG/矩形/canonical/cache、native footer/reload 和实际 seek/decode PNG。
- 安全发布候选：`public-allowlist/`，83 文件；`SHA256SUMS` SHA256：`93e8a28a2be18acceef8a748381aed623efb9bb6d6285d358c566d3cdd5bed5d`。此目录仍需 parent 审阅，不自行上传。
- renderer SHA256：`88fabf42a93cf2ff4c0f737b1e896d7b1f51358fcf4db47ccf8d05b99f84fc07`。
- Mach-O SHA256：`952d9865eb1b93f828ba1f56fa8992f6245b4bc0df06ed62b010625e50e686da`。
- asar SHA256：`eaf3842f9f17b59d886f9f43499cc7caeee49339e07293c4cea1eb6ad3bcfa98`。
- A→B MP4：`b97e7d70a42d2c1433ad2a63344960be49e6d4218b0a95372290161a798b2b66`；B→A MP4：`b309a870df4e37dedac78f8f1f6ae601b1684912e779be77b93dd6774fa28da2`。
- packet PTS 最大误差：A→B 2.3713683994230905e-7s；B→A 1.7173767097311554e-7s。每个最终 MP4 均实际 seek/decode，未用原截图代替。
- provider SDK 0.3.246（从真实 mapper 导入位置解析）；真实 vendor CLI 未执行，`resolveVersion=0.0.0-replay` 是明确的 fixture 标记。

allowlist 不含 private homes、auth/credentials、完整 host 日志/catalog/NetLog、用户旧材料或包/依赖树；JSON 仅脱敏本次临时根路径，录像仍为原片。旧 baseline 制品/报告未修改。

## 未验收与英文补充 draft

NOT_RUN：真实 vendor/model、完整 packaged self-managed-daemon/CLI smoke、官方签名/公证分发形态、iOS/Android/用户设备、Windows/Linux、单独无插件 grouped/canceled-tool UI 矩阵。没有为本轮补建 baseline 或重跑已绿 suite。parent 负责最终审阅、发布与 ready 决策。

> We verified final PR head 2947e07d1209447d9b023302ed610efc81ae1aa8 in a newly built macOS arm64 production-packaged 0.12.0-beta.1 renderer and same-source real host, with the complete historical plugin pinned to 58672b7 (673 source files unchanged; renderer blob 1179d259). Both Read completion orders measured 4 → 4 → 4 → 4 CSS px across the four phases; all 96 external rectangle samples were 4 px, with canonical call IDs/status, row identity/order, and natural scroll positions verified. Stable arrival timestamps and advancing latest lifecycle timestamps survived real renderer cache persistence/reload. A completed native footer showed 9s before and after reload, matching 9440/9450ms canonical lifecycle durations rather than the 1406/1408ms arrival-only boundaries. Normal plugin settings temporarily exposed the native assistant footer between gap phases and were restored; Read rendering, spacing, source timestamps and plugin code were unchanged. Continuous uncut compositor recordings, raw frames/timestamps, canonical/cache records, screenshots, hashes and earlier failures are retained. This used deterministic synthetic Claude SDK queryFactory replay, not vendor inference (zero real model requests). The older symptom videos use the official 0.11.4 Release; this candidate is a local ad-hoc package with hardenedRuntime=false and Chromium sandbox still enabled. They differ in version/distribution form: this establishes final-head integration in the same scenario, not isolated attribution of every visual difference to this PR or acceptance of official signed/notarized distribution. Reducer/canonical red-green evidence is separate and was not rerun here. The updater CONNECT/IPC rejection and non-target loopback denial were verified; Node networking and incomplete NetLog coverage remain explicit limits. All owned processes/listeners were cleaned up; no source, original user app, main daemon, remote PR or ready status was changed.
