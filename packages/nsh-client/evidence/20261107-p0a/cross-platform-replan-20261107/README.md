# 跨平台前端方案纠偏

本次文档提交仅包含主方案、两个文档入口、本报告、旧方案快照和证据索引。已暂停的实验源码与原始运行材料留在原 worktree，未随文档提交发布；指向这些历史材料的相对链接需在保留该 worktree 的本机读取，远端文档中的链接不代表原始材料已上传。索引中的 hash 用于核对保留材料，不代表新方案已经实现或验收。

本片已重写[主方案](../../../../../docs/nsh-client-plan.md)：目标为 NSH 共享跨平台客户端前端，复用现有 Paseo daemon／server。父级已全文验收文档方向；新稿独立评审和用户确认具体实施切片仍待完成。没有跨平台实测、实施 Go 或预算自动转移。

父级消息 `f99078b3-41d3-477e-bb95-650651b0a2e4` 转述用户：“你来重新规划一下 修正一下之前犯的错误 把这个教训记一下”。本会话只写指定文档；记忆由父级独占负责，本会话未写 memory、未委派。实际 runtime 起始读回 `codex/gpt-6.1-sol high`，开始 `2026-11-07T11:30:33.034Z`；完成时间与检查结果见[evidence-index.json](evidence-index.json)。

## 本次错误与修正

| 本次错误                     | 可核对事实                                                                                     | 修正与后续检查                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 替代了用户目标               | 旧稿明确写“有条件替代Electron”，移动／Web排到桌面收益之后                                      | 六端从第一阶段列验证面；先Web＋macOS共享UI，再紧接两移动端；Windows／Linux登记runner缺口与owner，不能由macOS成功外推                   |
| 把桌面优化代理指标当交付前置 | 原生0/5、计算五轮及30%内存等门阻挡最小UI                                                       | 原数值和失败全部保留为旧研究未完成；共享UI按真实功能tracer bullets推进。性能仍做实际负载下的风险／回归与有方法的公平比较，不是永不验证 |
| 仪器投入超过当前交付需要     | 多次滚轮／capture控制迭代，最后16物理事件路由未到DOM；没有有效原生基线                         | 停止CGEvent路线／计算扩展，32余量继续封存；只有可复现产品阻挡才补对应测量，不建设通用ROI／profiling平台                                |
| 多轮review偏重内部自洽       | 评审修好了预算／队列／配对公式，却未纠正“用户要跨平台重写”这一主线偏移                         | 新评审先查原用户目标、sharedUI源码、六端验证顺序与真实画面，再查技术自洽；旧评审不覆盖新架构                                           |
| 没有实际交付sharedUI         | 本次只读看到 `packages/nsh-client/App.tsx` 仍返回null，probe宿主写死MacIntel／导入paseo/probes | 首片明确连接页／agent列表共用UI与domain、双端画面和真实daemon，脚本／probe不能替代；移动接入不等全部桌面功能或性能收益                 |
| 插件归类过粗                 | 旧稿把命令、纯transformer、主题、附件源和React UI一并判暂不可用                                | 按import闭包和host依赖分类；保留server插件，先以linear附件描述符样例验证拟定NSH adapter，不承诺旧React bundle兼容                      |

这是本次决策和执行错误的记录，不把性能验证本身当错误。本会话没有改产品合并规则、供应商认证或服务端契约来规避难点。

## 新的交付顺序

1. **S1：共享app与真实目录。** Web／macOS先交同一NSH连接／列表UI，随后iOS／Android模拟器跑同片；S1同步登记Windows／Linux原生runner／smoke，不同时建设六套业务实现。
2. **S2：同一会话可操作。** 四端历史、流式、发送取消、权限审批、relay及重连权威补载。保留唯一directory turn与submission双事实。
3. **S3：日常工作流。** Markdown／工具、附件、project／workspace、文件／只读Diff及多主机／routed。
4. **S4：终端与系统集成。** 共享terminal语义与各端renderer／输入，通知／深链／恢复、适用桌面的SSH和本地连接。
5. **S5–S6：插件、功能补齐与发布。** 先现有插件样例，再调度、语音、浏览器／编辑review；六端各自签名／安装／Web部署／回滚。未估项不是零成本，平台未测不能称可替代。

主方案给出服务端保留／新surface待做矩阵、ports、真实画面与源码hash证据要求、首片精确写集／停止点和粗WBS。Web使用标准浏览器网络／安全约束；原Rust socket仅为验证过macOS的候选，不强绑全部runtime。检查到现有nsh.json无条件引用native probe crate，所以把Web构建隔离明确列为首片实际接线风险，不编造配置API。

## 旧成果与预算保留

[previous-plan.md](previous-plan.md)是逐字节复制的旧稿，归档SHA256为 `2b4be79adacbf0f2d7492c137e46a73bf663ea30f6ebfe6a42a401b31e08389a`；不格式化这个历史快照。旧P0a／A4历史约束、原数值门槛、独立评审及全部失败raw保留，新阶段不令旧阶段通过。

旧W1的24个代码／测试文件和compute报告均不修改。已记录27定向用例、短功能配对和类型／lint／格式检查；最新plain relay短例资源覆盖仍未测。W1未完成，compute freeze未生成／签定，正式性能矩阵0次；旧报告标题仍写“实施中”，是历史记录，当前以[budget.json](../compute-20261107/budget.json)的 `executionSuspended=true` 和本报告为准。

旧24h授权专属W1–W3计算，实施者记录 `2322.652s＝0.645181h`；父级／评审投入未完整并账，不能据此认定剩余额度，更不能移用新UI。历史活跃余额unknown。新稿仅建议首片S1a **2–4新人日、最多32活跃小时**，由父级在评审后向用户确认；后续移动、Windows／Linux、会话等切片另按真实结果确认投入。本次文档重规划不记为已获新UI实施额度。

首片的具体写集、验收和停止点见[方案S1a](../../../../../docs/nsh-client-plan.md#首片-s1a-的可执行边界待批准)。

当前没有运行服务／GUI／原生输入／基准，没有commit／push，也没有启动任何目标平台构建。旧daemon／protocol／app七文件、root lock、旧compute／replan报告和实验源码均保留。

## 依据与验证边界

完整读取旧稿、architecture／product／plugins／connected-hosts／protocol-compatibility／timeline-sync，以及Android、Expo路由、mobile-panels／mobile-testing、notifications、Markdown／terminal-rendering和QA文档；只读定位app路由、workspace／schedules／voice／browser入口、SDK契约、插件样例、NSH入口及compute检查点，未全仓扫描实现。

本次访问[NSH平台](https://nsh.dev/docs/platforms/)、[Web](https://nsh.dev/docs/web/)、[平台差异](https://nsh.dev/docs/platform-specific/)官方文档，并对照固定源码内的对应文档／现有宿主配置。官方支持声明、固定源码依据、Paseo探针、真实UI／设备结果分层；本次未增加任何跨平台运行结论。

只运行指定文档的npm格式化／格式检查、本地链接与锚点、归档／输入hash和diff空白检查；仅文档变更不重跑types／lint／tests。索引绑定原方案、新稿及protected文件hash，并比较旧证据文件元数据；不声称重新逐字节扫描所有大型movie。旧raw未改判／拼接，原剩余32事件未复用。

父级消息 `84fe6f38-023a-44d2-bd74-d6155aab17af` 确认已全文阅读196行主方案及报告，文档方向验收通过；这不是独立review或实施／预算批准。按该消息扩写集，仅同步 `docs/architecture.md` 的提案入口与 `CLAUDE.md` 的NSH文档表描述，保留原plan链接及其他规则；npm格式化另统一了CLAUDE表格空白。主方案正文／hash不变，两入口hash、格式／链接／差异检查见索引。待决事项为独立评审、首片32h与runner安排、后续未估功能补估。
