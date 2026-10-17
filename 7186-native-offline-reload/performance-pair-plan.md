# #7186 同树 Release 配对测量计划（仅计划，未执行）

前提：先验收本阶段offline cold reload；所有构建/采样仍须parent批准后才能开始。当前candidate固定`85f7d56ea79f8b7c22538a2b763875f4ce2d74ad`，不以已漂移的main做baseline。不在本阶段运行A/B。

1. **只变bytecount实现。** 从同一candidate生成两个独立/tmp QA snapshot：A保留TextEncoder.encodeInto的16,384窗口；B仅将`packages/app/src/runtime/replica-cache/index.ts:utf8ByteLength`换回其parent `cd77ecd837df40d042599d8847403eb416b35b04`里的JS charCodeAt循环。其余source、row WeakMap、cache budget、protocol/client dist、Pods、route/demand路径及navigation realpath normalizer逐文件hash一致。记录唯一source diff、app/bundle digest、Hermes/SDK/Release flags。不是跨版本main对比。
2. **同一负载和UI顺序。** 使用已验证的50,014-byte“缓存😀”mock response、5ms provider interval、同一app/daemon版本及合成repo状态；每次fresh synthetic home/cache，正常菜单取得demand、相同agent tab、相同jump行为。A/B各一次非计分warm-up；计分按ABBA/BAAB顺序共8次，每种4次，单设备串行。一次运行完成即释放共享锁；构建与runtime分阶段，不并行启动A/B。对每次native实际输入记录final hash、chunk数/到达节奏、timeline payload大小/写入次数，负载差异不隐去。
3. **主指标是计数路径成本。** 两树加入完全相同、只观测的QA timing：记录`utf8ByteLength`及一次persist的duration、payload UTF16/UTF8大小、row cache命中/未命中及调用次数。只在内存累积有限摘要，结尾统一导出，避免每chunk console/文件I/O污染。用同一时钟`performance.now()`并记录分辨率/观测开销。报告每次运行累计计数wall duration、按实际payload大小归一化成本、p50/p95/max；CPU成本只在另加Time Profiler采样时报告，不把wall时间称为CPU。保留全部raw runs，不挑最好值。
4. **先判断噪声，再谈差异。** 正式A/B前以同candidate做两次A/A短校准，若同负载计数或persist指标波动超过预设15%，保留失败数据、停止解释A/B并调查环境。需要UI帧指标时另开两侧同配置native trace，避免把trace开销混入主计数测量；区分主线程/JS线程/持久化耗时与WS到达抖动。Simulator结果只证明此受控环境下的相对成本，不能替代physical OPPO Release掉帧因果。
5. **正确性与交付边界。** 每次actual SQLite assistant bytes/hash、timeline bytes/hash、END显示和offline reload必须一致；失败样本保留并单独解释，不算性能胜利。先交全部run表、A/A噪声、source/build diff和平台限制，再由parent决定是否扩大payload或物理设备验证。无真实模型请求、产品源码/Git/远端写入、现有设备操作或6767/6768连接。

预算口径：当前32MiB cache budget保持不变；若parent之后批准第二个payload档位，预先固定JSON尺寸和UTF16 surrogate窗口位置，再两侧同负载测量，不能在看完A/B结果后挑样本。
