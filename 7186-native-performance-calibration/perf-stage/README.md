# #7186 同树native Release性能尝试：安全公开子集

partial; A/A failed pre-registered noise gate; A/B not run。先读report.md和calibration.json；全部已执行run的raw timing、实际SQL/hash和在线/离线END截图逐项列在manifest.json，没有删除校准失败或挑样本。未运行B warm-up及ABBA/BAAB八次计分，未挑样本、未扩大负载、未重做校准。B只构建成功，没有native runtime通过声明。

只含自建synthetic数据及严格必要字段；没有home、凭据、SQLite DB、app binary、用户会话、完整OS/build日志或既有设备UUID。原始build/runtime日志在private上层目录保留，parent负责审阅发布。本目录未上传。
