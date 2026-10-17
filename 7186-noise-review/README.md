# #7186 A/A 噪声复核

Result：已有数据分析完成；没有新增运行或性能收益结论。

## 数据与方法

输入为已发布 perf-stage 的 WARM1、CAL01、CAL02 analysis.json 与 perf-raw-events.json。复用原窗口（stream trigger至结束后8秒），使用原header.wallAtZero映射时间，仅取包含timeline upsert的persist；保留全部事件，不删除长尾，不重算一个更宽松的校准门槛。analyze-noise.py及输出7186-noise-analysis.json可复算。执行者为parent本会话，不是新增独立评审。

| Run | Counter总wall ms | Persist总wall ms | 最大三次persist占比 | Timeline编码bytes |
| --- | ---: | ---: | ---: | ---: |
| WARM1 |0.964919|344.850790|53.24%|755820|
| CAL01 |0.988167|238.460038|71.48%|710357|
| CAL02 |0.930291|441.791294|57.28%|756350|

CAL01/02总counter约1ms，persist为238–442ms；counter/persist数值比例仅0.21–0.41%。这不是CPU占比，也不能把差值归给SQLite。原计时包含await的persist，未拆prepareStore、index、materialize、budget及rowStore.apply各段，现有事件不能判定长尾具体来自磁盘、JS调度、native桥还是其他等待。三个最长persist已支配多数累计wall时间，明确说明总persist不是这个小负载下稳定的计数成本代理。

三轮实际assistant均50014 UTF8 bytes且hash完全一致，但到达帧数457/459/458、timeline misses28/27/28、物化upsert量不同；不能把相同最终文本当完全相同执行负载。CAL01/02按MiB归一化counter仍差12.29%，persist差54.06%；原15%全指标门槛失败仍成立。

## 后续边界

不复跑同一校准、不删长尾或用counter稳定替换原校准结果，也不直接启动A/B。若继续，先预注册一个新实验：同步counter成本为主指标，异步persist作为独立次指标；两侧逐项报告实际调用次数、payload累计大小和到达量。若要说明应用持久化/帧率改善，需要对await阶段分段或原生trace定位长尾，而不是用counter微测替代。任何新协议都必须与这次失败分开展示。当前Draft保持。

本轮仅读取现有合成产物和新建/tmp分析文档；没有build、model请求、设备操作、产品/Git修改、6767/6768访问。既有原始/已公开证据字节不变。
