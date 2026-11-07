# DeepSeek 服务端配置

## 默认 Mock 模式

不创建 `.env` 也可运行：

```powershell
node dev-server.mjs
```

默认 `AGENT_PROVIDER=mock`。浏览器只调用本项目 `/api/agent/*`，不需要 API Key。

## 配置真实 Provider

1. 复制 `.env.example` 为 `.env.local`。
2. 仅在本机服务器环境填写 Provider 参数，不要把文件发送、提交或打包。
3. 设置 `AGENT_PROVIDER=deepseek` 后重启 Node 服务。

```dotenv
DEEPSEEK_API_KEY=<仅保存在服务端本机>
DEEPSEEK_BASE_URL=<经团队核验的服务地址>
DEEPSEEK_MODEL=<经团队核验的模型名>
AGENT_PROVIDER=deepseek
AGENT_REQUEST_TIMEOUT_MS=30000
AGENT_MAX_RETRIES=1
```

本项目会读取 `.env` 和 `.env.local` 中的白名单变量；已存在的进程环境变量优先。`.gitignore` 排除了 `.env`、`.env.local` 和 `.env.*.local`。

## 安全要求

- Key 只由 `DeepSeekProvider` 在服务端 Authorization 头使用，不得注入 HTML、前端 JS、浏览器存储或 API 响应。
- 不要在日志、问题单、截图、Git diff、ZIP 或聊天回复中粘贴真实 Key。
- `DEEPSEEK_BASE_URL` 和模型名必须由团队核验后配置；示例文件保持空值。
- Provider 输出先解析 JSON，再按 operation schema 校验。失败只返回统一错误。
- 切换真实 Provider 不会绕过 relationId、可见范围、状态、冷静期、安全暂停与对齐核验。

## 验证

Mock：

```powershell
node scripts/agent-backend-test.mjs
```

真实 Provider 本轮未执行。团队提供测试环境、测试 Key 和允许的网络后，另行运行隔离的 staging 测试；不得用生产数据作为提示输入。
