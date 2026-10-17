# #7186 同树native Release配对测量

状态：A/A未通过15%门槛，已停止A/B解释；功能链通过。固定candidate `85f7d56ea79f8b7c22538a2b763875f4ce2d74ad`；仅/tmp QA snapshot和产物，不写产品/Git/远端。

## 写入前设计与先验

临时写集只有active QA snapshot的 `packages/app/src/runtime/replica-cache/index.ts`（rowBytes miss和既有persist操作计时、内存有界记录、正常AppState background时结尾导出），以及Metro日志目标路径（normalizer算法不变）。候选source已完整阅读至文件末尾，row-store/native/sqlite依赖已阅读。产品checkout不变。旧active snapshot source和Release app先备份，A/B source快照各自保留；构建在同一个既有iOS staging root/Pods/DerivedData执行，逐次核对staging source等于相应snapshot，以消除构建路径/原生依赖差异。

A/B唯一行为差异：`utf8ByteLength`函数体；A为candidate TextEncoder.encodeInto，B取parent `cd77ecd837df40d042599d8847403eb416b35b04`的charCodeAt循环。同样保留encoder/scratch初始化、WeakMap、cache budget、persist调度、协议、路由及相同QA观测。无新依赖或公共/daemon接口。timing围绕实际既有调用，既有return/catch/await顺序不改。

每run fresh own simulator、home/repo/cache，同50,014-byte负载与5ms interval；正常菜单/跳底部、真实SQLite hash和offline known-workspace检查与已验收offline阶段相同。所有perf runtime **不录视频，也不在stream测量窗口截图**；不为媒体增加runtime。输入ledger两侧相同。时间样本只累积在内存，测量窗后正常切到own simulator Safari触发AppState background统一导出，再恢复app，日志I/O不进入主测量窗。

计数样本最多10,000条、persist样本最多10,000条；溢出使该run不可解释，保留失败。时钟为Hermes `performance.now()`，启动时报告连续读取分辨率/空读取开销与零时长比例。观测是wall duration，不是CPU或整app帧率。

**15%先验阈值和计算规则（未看数据前固定）：** 两个A/A校准run均需正确性通过、实际相同最终assistant bytes/hash；测量窗从control stream-trigger到stream结束后8秒settle marker，按native基准时钟映射UTC筛选。对timeline row miss的累计counter wall ms及每编码MiB归一化counter wall、含timeline upsert的累计persist wall ms及每实际upsert MiB归一化persist wall，均计算 `abs(x1-x2)/((x1+x2)/2)`；任一>0.15、分母为0/不可测或观测/正确性不完整即停止A/B解释，完整保留数据，不调整负载或换样本。原始到达/写入次数/字节差异全部展示，不靠归一化隐藏。

执行顺序：构建A/B（分别锁阶段）；A非计分warm-up；A/A校准两次（每run独立锁释放）；只有校准满足，才执行B非计分warm-up和ABBA/BAAB共8次计分，每种4次。A warm-up兼作运行观测/校验，不作为计分替代。每个run正常阻塞同一共享锁，与7196可穿插。若A/A不满足，不运行B warm-up或计分来挑结果。

媒体仅END/离线稳态截图；无视频run混入未录run。每个原始失败保留，不重复旧绿suite；不进行真实模型推理或操作已有设备/6767/6768。

## 执行结果（本阶段最终回填）

**Result：partial（功能链通过，性能校准未通过）。** A/A任一指标超出15%即停止A/B解释。 未运行B warm-up及ABBA/BAAB八次计分，未挑样本、未扩大负载、未重做校准。B只构建成功，没有native runtime通过声明。

执行者配置为Codex / codex/gpt-6.1-sol High；实际宿主model metadata未独立暴露。provider仅MockLoadTestAgentClient / e2e-fast-stream；没有真实推理、登录或凭据。candidate固定85f7d56ea79f8b7c22538a2b763875f4ce2d74ad，结束HEAD相同且clean。parent报告main已漂移至30799fda19f50febc62349c64460368adc85ff07，未合并或测试该main。

### 构建与唯一差异

完整source核对5680个tracked文件，A/B只有replica-cache/index.ts不同，A-B-only.diff精确限制于utf8ByteLength函数体。B取candidate parent cd77ecd837df40d042599d8847403eb416b35b04的循环，其他仍为candidate；不称跨版本baseline。两侧共享同一iOS staging root/Pods/DerivedData，逐build复制immutable source并cmp，Release flags与normalizer一致。instrument-A.diff/B.diff保留相同计时observer；runtime-observation.diff保留相对已验收offline harness的变化。没有产品代码变更、新依赖、route/gate/store注入或协议接口。

| Build | UTC开始→结束 | Native executable SHA256 | Hermes bundle SHA256 |
| --- | --- | --- | --- |
| A | 2026-10-17T06:55:56Z→2026-10-17T06:56:50Z | 7a07b73393b1baeca7a1bd892b4435701fe9d5ed0a61fcd6fccd60e3db4d5115 | ead2ad27012b8f2cb287e40e60e95203a2243105823d3ad023c40c3296dbfd2a |
| B | 2026-10-17T06:57:07Z→2026-10-17T06:57:31Z | 7a07b73393b1baeca7a1bd892b4435701fe9d5ed0a61fcd6fccd60e3db4d5115 | 6f50eb852e912c77c5fc192e0f3ad189f78e1cfa2ad9f75d0d5ac006a819a905 |

平台为arm64 iPhone16Pro Simulator / iOS18.6，Xcode27.1(27A9275)、iOS SDK27.1、React Native0.81.5、Expo54.0.33、Hermes Release、app0.12.0-beta.1、Node24.18.0。不是physical OPPO/Android验收。builds/A、builds/B分别保留raw.jsbundle、完整xcode.log、开始结束和digests；apps/A、apps/B保留实际安装二进制。原临时snapshot source/Metro、原功能Release app及rawJS已从备份恢复并逐文件核对，perf apps和失败证据独立保留。

### A/A先验门槛

阈值在看数据前固定15%，四项都必须通过；公式abs(x1-x2)/mean(x1,x2)。时间窗按control-stream-trigger至stream结束后8秒settle，选operation start在窗内者并记录其完整duration；persist计时从既有write队列获得执行后开始，排除queue wait。原始到达量/物化upsert量差异均保留。

| 指标 | CAL01 | CAL02 | 相对差异 | 15%门槛 |
| --- | ---: | ---: | ---: | --- |
| counterMs | 0.988167 | 0.930291 | 6.033592% | 通过 |
| counterMsPerMiB | 1.458658 | 1.289721 | 12.293562% | 通过 |
| persistMs | 238.460038 | 441.791294 | 59.781215% | 超限/不可测 |
| persistMsPerMiB | 349.460907 | 608.337106 | 54.056533% | 超限/不可测 |

### 所有运行，包含warm-up和失败

| Run | 实现/角色 | Runtime exit/观测 | counter累计ms | persist累计ms | timeline miss数/编码bytes | 含timeline persist数/物化upsert bytes | 实际assistant帧/bytes |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
| CAL01 | A/calibration | 0/完整 | 0.988167 | 238.460038 | 27/710357 | 27/715512 | 459/50014 |
| CAL02 | A/calibration | 0/完整 | 0.930291 | 441.791294 | 28/756350 | 28/761505 | 458/50014 |
| WARM1 | A/warmup | 0/完整 | 0.964919 | 344.850790 | 28/755820 | 28/760975 | 457/50014 |

每run的started、ui-markers.jsonl、host-result.json、cleanup.finished保存完整UTC和顺序；analysis.json保存窗口、p50/p95/max、实际输入hash及四次SQL hash，perf-raw-events.json保存所有原始计时/时钟读数，未删失败或替换样本。每run均不录视频，测量窗内不截图；同一AppState background在窗外统一导出，console/file I/O不在counter计时区间。代理输入ledger仍有相同观测开销，不能声称零扰动。

### 时钟分辨率与数据量边界

| Run | 最小正时钟增量ms | 连续空读取p50/p95 ms | 空读取零值/计数零duration | 实际assistant到达间隔p50/p95/max ms |
| --- | ---: | --- | --- | --- |
| CAL01 | 0.000083 | 0.000125/0.000125 | 0/0 | 63/66/75 |
| CAL02 | 0.000041 | 0.000083/0.000125 | 0/0 | 63/67/71 |
| WARM1 | 0.000041 | 0.000042/0.000084 | 3/0 | 63/67/67 |

这些是同Hermes时钟连续读取观测，不是计时器准确度保证或已扣除完整observer开销。JS侧wall duration受调度影响，persist含异步SQLite等待；upsert bytes是物化rows的逻辑payload大小，不能换成真实文件写次数/磁盘吞吐量。总计数调用/cache hit在每run dump中保留。固定provider interval=5ms并不等于网络逐帧5ms，实际coalescing/arrival以上表及ledger为准。

### 每次实际正确性与正常UI

全部已执行run均通过正常菜单取得demand、正常跳底部看到QA7186-END、实际stream与SQLite字节/hash、正常停host独立端口关闭证明、terminate/relaunch后正常已知workspace导航、离线END与稳态SQL。每次assistant实际输入/读回都是50,014 UTF8 bytes，SHA256 42f194a3fd10cb26886dd17d5847b1344e715a93fe9c96f6d17ff4470d838a9c；timeline JSON50,869bytes，native计数终值与SQL BLOB/hex逐字一致。四阶段after-stream、steady、after-reload、offline-steady的assistant和timeline hash在同run内一致；不同run合成IDs/时间不同，不要求timeline hash跨run相等。

仍保留先前功能边界：fresh compact direct-link需要正常打开菜单触发目录demand，产品缺口没有修复；cold-launch初始自动route restore没有通过/宣称，离线接受是冷进程后正常已知workspace导航。没有将预设fixture bytes当作实际SQL测量。真实provider/物理设备/CPU trace/全app帧率未测，无performance improvement或cache导致原物理掉帧的因果结论。

### 命令、退出码、资源与安全公开

所有heavy子阶段以/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh执行，正常阻塞；build A/B、每run runtime、每run分析、校准和finalize/public分别释放锁，driver自身只编排锁内子阶段，无锁内连续包揽build和runtime。具体命令及所有raw logs保留：prepare.zsh→prepare.log、build.zsh A/B→build-A.log/build-B.log及builds/*/xcode.log、prepare-runtime.zsh→prepare-runtime.log、runtime.zsh A|B runId role→runs/runId.log、analyze-run.zsh runId→runs/runId.analysis.log、calibrate.zsh→calibrate.log、finalize.zsh→finalize.log、publish-local.zsh→publish-local.log。构建/已执行runtime/分析/校准/finalize均exit0；校准不通过作为result决策保存，非shell错误。driver exit单独记录driver.exit。规范suite测试数0，无旧绿suite/全仓static/新依赖安装/真实provider调用。

cleanup.json时间2026-10-17T07:11:11.179Z：3个自建simulator全部删除、host PID全部不存活，8项自有port/address probe均ECONNREFUSED；22个既有simulator状态逐项未变。日志子进程均trap停止并wait。product HEAD clean，6767/6768未连接/重启。旧root/causal/offline公开manifest共137项逐项未改，previous-public-integrity.json保留核对。

新安全公开入口public/README.md与独立manifest.json：准确diff/digests、先验规则/校准/所有run计时（含warm-up、全部失败）、必要字段WS ledger、实际SQL bytes/hash摘要、在线END/离线END截图、正常UI日志及端口proof；无视频、app binary、SQLite DB、home、凭据、完整OS/Xcode日志或用户device inventory。其余全部原始失败/日志和build保留在private stage供parent审阅；本worker未上传或改PR。功能已验收，性能结论严格受校准决策限制。
