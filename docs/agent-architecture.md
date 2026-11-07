# Memory Garden Agent 后端架构

## 读取到的输入

- 原始 PRD（SHA-256：`DE4256C1BE94655E8F6B51B44EBF512E9B58BB0F5DAAD3E37AF6147F4247113F`）。
- `docs/api-contract.md`、`openapi.memory-garden.yaml`、`design.md`、前端 `ContractHttpAdapter`、Mock Repository 与领域状态机。

## 目标与信任边界

```text
浏览器
  └─ POST /api/agent/*（同源；身份与 Idempotency-Key）
       └─ HTTP 边界：JSON、大小、方法检查
            └─ AgentService：关系组、可见性、状态、安全暂停、本人核验
                 └─ MockAgentProvider 或 DeepSeekProvider
                      └─ JSON Schema 校验、有限重试
                           └─ 过滤后的结构化响应 → 浏览器
```

浏览器不持有 DeepSeek Key，也不直接访问 Provider。Provider 不决定关系组成员资格、可见范围、用户确认、冷静期、删除/放弃、安全暂停或认知对齐核验门禁。

## 服务端模块

- `server/agent/http.js`：六个同源 POST 路由、16 KiB HTTP 请求上限、JSON Content-Type、统一 Problem 响应。
- `server/agent/service.js`：鉴权占位、输入限长、确定性门禁、幂等、短时缓存、有限重试和安全日志。
- `server/agent/demo-store.js`：当前 Demo 的关系组、记录与对齐状态；真实部署应替换为服务端 Repository。
- `server/agent/schemas.js`：每项 Provider 输出的 JSON Schema 与拒绝额外字段的校验器。
- `server/agent/providers/mock-provider.js`：无 Key 时的确定性演示输出。
- `server/agent/providers/deepseek-provider.js`：仅服务端调用 OpenAI-compatible `chat/completions`，请求 JSON mode。
- `server/agent/config.js`：只读取白名单环境变量；`.env`/`.env.local` 不进入浏览器。

## 路由与确定性前置检查

| 路由 | Provider 能力 | 调用 Provider 前的强制检查 |
|---|---|---|
| `/api/agent/preprocess` | 分类/表达候选 | actor 属于 relation；输入限长；安全关键词由服务端先暂停。 |
| `/api/agent/translate-memory` | 中性记忆转译 | 记录属于 relation；actor 可见且为提交人；非删除、放弃、安全暂停。 |
| `/api/agent/map-imagery` | 意象类型建议 | 记录已确认归档/映射、关系组可见、安全、非冷静期、非删除/放弃。 |
| `/api/agent/record-narration` | 唱片叙事 | 上述映射门禁；记录是音频且允许播放。 |
| `/api/agent/alignment-summary` | 中性错位摘要 | 用户主动发起、双方提交、本人核验和解析确认、双方确认保存、关系组可见且安全。 |
| `/api/agent/safety-check` | 安全分流结构 | actor 属于 relation；高危 Demo 触发完全由确定性代码处理，不调用模型。 |

页面 A 不调用这些接口取得原文。场景仍只消费安全 `SceneSnapshot`。Agent 输出只是候选，不自动发送、覆盖、公开或生成共享意象。

## JSON 校验与失败策略

1. 每个 operation 绑定固定 JSON Schema，`additionalProperties: false`。
2. Provider 自由文本、Markdown、额外字段、错误枚举、超长字段均视为 `PROVIDER_INVALID_OUTPUT`。
3. 最多重试 `AGENT_MAX_RETRIES` 次，当前上限被服务端限制为 2；超时上限 60 秒。
4. 最终返回 RFC 9457 风格错误，不把无效 Provider 文本返回浏览器。

## 幂等、缓存与日志

- `Idempotency-Key` 按 actor、operation 和请求指纹保存结果；同键不同请求返回 `409 IDEMPOTENCY_CONFLICT`。
- 相同 actor、relation、资源与确定性输入使用 SHA-256 缓存键，默认缓存五分钟；键中不保存明文。
- 日志仅记录 operation、actorId、relationId、资源 ID、Provider、错误码和尝试次数；不记录输入、候选内容、Key、Authorization 或 Provider 原始响应。
- 当前缓存/幂等存储为单进程内存实现；生产多实例必须换成具备 TTL 和原子写的共享存储。

## 明确未实现

- 正式 Bearer Token 验证、生产数据库、分布式缓存、速率限制和审计存储。
- 可验证的地区援助资源数据源。
- 真实 DeepSeek 联调；当前状态为 `NOT RUN`。
