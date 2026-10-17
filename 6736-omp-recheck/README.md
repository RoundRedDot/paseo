# #6736 OMP条件复核

Result：仍没有可核验的OMP授权/默认模型路径，本轮不启动推理。

- 重新执行原隔离安装binary的--version为omp/18.11.3；shell PATH中没有omp。只读--help确认PI_CODING_AGENT_DIR默认~/.omp/agent、可显式--model/--profile/--config。
- provider-preflight.json只记录默认状态路径存在性和相关环境变量是否存在，不读取/输出密钥。默认agent.db与列出的config路径不存在，常见provider key及Google Cloud配置环境均未设置，未发现PI_CODING_AGENT_DIR/OMP_PROFILE指定其他状态。
- 这不是对所有外部broker/自定义授权机制的穷举证明；也没有用旧No default model selected日志冒称本轮实际runtime错误。旧真实启动失败继续保留，当前没有新的可核验配置可依赖。
- Pi1.3.0/google-cloud/gemini-3.8-flash旧29check仍是Pi证据，不能当OMP证据。未导入Pi OAuth/扩展、复制凭据、登录、安装或改用户默认配置。
- 下一步最小条件是一个已配置可用的OMP模型/授权路径（仅需非秘密路径和模型名）。在此之前保留Draft，另行补native图片UI/缓存验收不代表OMP完整通过。

模型请求0、daemon/device启动0，产品/Git/用户配置写入0。新增写集仅本/tmp文档与help/preflight输出。
