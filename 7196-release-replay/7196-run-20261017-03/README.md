# #7196 第三次隔离 Release runtime

正常代理/IPC前置通过，真实packaged 0.11.4连接隔离baseline host，历史插件server running。随后harness因未配置隔离PATH中的Claude绝对路径，被正常availability检查拒绝创建agent。0 Read cases、0 vendor replay frames、0模型请求，未生成症状录像。截图仅证明新profile下真实Release接入host，不证明gap。Node网络不受Chromium proxy保护，不宣称全进程隔离或绝无DIRECT。进程/监听清理、签名/hash不变。两次旧失败保留，无上传。
