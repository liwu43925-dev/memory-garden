# 输入端—展示端—Agent 后端联调差异

日期：2026-11-07（Asia/Shanghai）

## 读取到的输入

- 原始 PRD、`docs/api-contract.md`、`openapi.memory-garden.yaml`、`docs/agent-architecture.md`。
- `README.md`、`.env.example`、页面 A/B 源码、Mock Repository、领域状态机和 Agent 后端源码。

## 联调前发现的差异

| 类别 | 输入端/展示端现状 | API/后端契约 | 处理决定 |
|---|---|---|---|
| 资源主键 | 本地实体使用 `id`、`groupId`，意象兼有 `type` | HTTP 使用 `recordId`、`relationId`、`imageryType` | Adapter 边界显式转换；核心状态机内部暂保留旧字段，禁止在接口中混用。 |
| 状态枚举 | UI 已使用契约中的九种记录状态 | OpenAPI 相同 | 保持；未知状态直接 `VALIDATION_ERROR`，不降级为 draft。 |
| 冷静期时间 | IndexedDB Mock 使用毫秒时间戳，客户端自行到期归档 | 契约要求 ISO-8601 `coolingEndsAt` 和 `serverNow`，服务端裁决 | 联调 HTTP 流程使用服务端绝对时间；旧本地 Demo 路径标记为非生产兼容，不冒充后端通过。 |
| AI 预处理 | `app.js` 直接调用本地 `isHighRisk/buildCandidate` | 浏览器必须调用 `/api/agent/preprocess` | 改为同源 AgentClient；网络失败不得自动退回本地假成功。 |
| 数据权威源 | 浏览器 IndexedDB 与服务端 DemoAgentStore 各有一份 fixtures | Agent 必须对创建后的同一记录做权限/状态检查 | 合并为服务端共享 Demo Store 并提供契约 CRUD；否则新记录的 Agent 操作会 `NOT_FOUND`。这是阻塞差异，必须修复。 |
| 用户确认 | UI 通过多次本地 transition 完成 | API 要求确认、冷静期和映射分别由服务端检查 | 服务端新增确定性记录操作；Agent 只产候选，不写状态。 |
| 意象映射 | 本地 `mappingId/mappingType` 直接写入 | A 页只消费安全 SceneSnapshot | 服务端映射后返回白名单投影；页面 A 不接收原文、转写或完整对齐 fields。 |
| 计划歧义 | UI 用正则和本地表单逐问 | Agent preprocess 只能建议，完整性由确定性代码裁决 | 计划字段完整性由服务端校验；缺字段返回 `PLAN_AMBIGUITY`，不由模型擅自补全。 |
| 上传 | 浏览器 Object URL，仅当前会话有效 | OpenAPI 有上传会话/complete | Demo 只验证元数据和会话状态，不冒充生产文件存储；真实上传标记 `BLOCKED`。 |
| 音频 | 本地 URL/空样本 | 播放需授权 token，禁止自动播放 | Mock token 可验证权限但不伪造真实音频；真实媒体播放标记 `BLOCKED`。 |
| 对齐隔离 | 单个 fixture 含双方 fields，B 页由 UI 控制展示 | 双方本人提交/核验前服务端不得返回对方内容 | 新增按 actor 的服务端投影；未达门禁只返回进度，不把完整对象交前端隐藏。 |
| 共同纪要 | fixture 已是 saved | 保存前须双方本人核验和确认 | 服务端门禁；未满足返回 `409 STATE_CONFLICT`。 |
| 高危暂停 | UI 与后端均有关键词检测 | 必须先确定性暂停，不调用模型 | 后端为权威；UI 仅展示 Problem/暂停结果。 |
| 关系组隔离 | UI 按 `groupId` 筛选 | 服务端必须校验 actor membership | 所有 HTTP 操作先校验 relation；越权返回 403/404，不返回数据后再隐藏。 |
| 刷新恢复 | IndexedDB 恢复本地状态 | 服务端应返回绝对状态和时间 | Mock HTTP Store 在进程内恢复；跨进程持久化仍 `BLOCKED`，文档明确。 |
| 错误 | UI 多使用普通 Error/announce | RFC 9457 Problem + 明确状态码 | 新 Agent/API client 统一解析；网络错误显示失败，不自动标记成功。 |
| 环境 | 默认 Mock，无 Key | `AGENT_PROVIDER=mock` | 本轮全部 Agent 结果只可标记 `MOCK PASS`；真实 DeepSeek 一律 `NOT RUN`。 |

## 不允许的静默兼容

1. 不把数字时间和 ISO 时间互相猜测后继续状态流转；转换只在明确 Adapter 边界完成。
2. 不因服务端 `403/409/422/5xx` 而回退到浏览器本地 AI 候选或本地映射。
3. 不把 `groupId` 缺失当作当前关系组，也不让 URL 的 relationId 单独构成授权。
4. 不向页面 A 返回完整 Record/Alignment 再用 CSS 隐藏敏感字段。
5. 不把 Object URL、Mock 音频 token、演示摘要写成真实上传、真实播放或真实 DeepSeek 成功。

## 本轮联调目标

- 让同一进程的 Mock API Store 成为 HTTP 联调的权威数据源，并由页面/测试通过契约端点访问。
- 保留原 IndexedDB Demo 作为离线展示实现，但在集成报告中与 HTTP Mock 结果分开标记。
- 所有业务和隐私冲突以显式 Problem、`FAIL` 或 `BLOCKED` 结束。
