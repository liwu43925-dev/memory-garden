# Agent 后端测试报告

日期：2026-11-07（Asia/Shanghai）

## 读取到的输入

- 原始 PRD、API 契约、OpenAPI 3.1、as-built `design.md`、当前 Mock fixtures、领域状态机与前端 Adapter。

## 已执行

命令：

```powershell
node --check dev-server.mjs
node --check server/agent/config.js
node --check server/agent/schemas.js
node --check server/agent/demo-store.js
node --check server/agent/service.js
node --check server/agent/http.js
node --check server/agent/providers/mock-provider.js
node --check server/agent/providers/deepseek-provider.js
node scripts/agent-backend-test.mjs
```

结果：`PASS`。

覆盖内容：

- Mock Provider 的 preprocess、translate-memory、map-imagery、record-narration、alignment-summary、safety-check。
- 同一幂等键重放；同键不同请求返回冲突。
- relationId 成员隔离、私有记录拒绝、4000 字输入限制。
- 冷静期记录不能进行意象映射。
- 高危模拟关键词由确定性代码暂停，Provider 调用次数为 0。
- 非法 Provider JSON 输出在配置次数内重试，最终统一失败，不返回自由文本。
- 本机临时端口 HTTP 请求 `/api/agent/map-imagery` 返回契约化结果。
- 完整 `dev-server.mjs` 同源检查：`POST http://127.0.0.1:4173/api/agent/map-imagery` 返回 `imageryType=flower`、`requiresUserConfirmation=true`；页面路由返回 HTTP 200。

## 未执行

- 真实 DeepSeek 网络调用：`NOT RUN`（当前没有真实 Key，且本轮不要求 Key）。
- 正式 Bearer Token、数据库、分布式缓存、多实例并发、限流及生产安全审计：`NOT RUN`。
- 第三方 OpenAPI 校验器：`NOT RUN`；当前环境未安装额外 YAML/OpenAPI 依赖。

## 剩余风险

- Demo 身份使用 `X-Demo-Actor-Id`，仅适合本地演示。
- Demo Store 与浏览器 IndexedDB 不是实时共享数据库；真实接入前需统一为服务端 Repository。
- 进程内幂等/缓存重启后失效，生产环境需共享存储。
