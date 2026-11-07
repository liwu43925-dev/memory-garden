# Memory Garden API 契约（Demo → 正式服务）

版本：`2026-11-06`。产品事实来源为原始 PRD；本文件只规定 API 边界，不定义真实账号、模型、存储或援助资源。

## 读取到的输入

- 原始 PRD、`design.md` as-built 记录、`domain.js` 状态机、当前 Mock fixtures 与 Repository 接口。
- 已知未决项：正式鉴权、资源地区数据、媒体病毒/版权规则、多人并发裁决，见 `open-questions.md`。

## 总则

1. 所有业务资源必须携带 `relationId`；服务端从认证主体和路径同时校验成员关系。客户端传入的 `relationId` 不是授权依据。
2. 所有写接口使用 `Idempotency-Key`；同一键、同一 actor、同一路径返回第一次成功结果。键复用但请求体不同返回 `409 IDEMPOTENCY_CONFLICT`。
3. 时间使用 ISO-8601 UTC 时间戳。冷静期响应必须包含服务端绝对 `coolingEndsAt` 与 `serverNow`；客户端只倒计时，不自行裁决到期。
4. 页面 A 只调用 `SceneSnapshot`/`SceneImagery`/安全媒体 token。它们**绝不**返回 `rawText`、`transcript`、`rewriteCandidate`、认知对齐原始输入或完整拆解字段。
5. 任何越权、删除、仅自己可见、冷静期、安全暂停的资源返回 `404 NOT_FOUND` 或最小 `403 FORBIDDEN`，不得先返回再由 CSS 隐藏。

## 认证、错误与分页

- 认证占位：`Authorization: Bearer <access-token>`；Mock 使用 `X-Demo-Actor-Id`，仅表示演示视角。
- 追踪：客户端可给 `X-Request-Id`；服务端响应 `requestId`。
- 分页：`limit`（默认 50，最大 100）与不透明 `cursor`；响应 `{items,nextCursor,limit,total?}`。`total` 在真实大数据集可省略。
- 统一错误：`VALIDATION_ERROR` 400、`UNAUTHENTICATED` 401、`FORBIDDEN` 403、`NOT_FOUND` 404、`CONFLICT` 409、`STATE_CONFLICT` 409、`SAFETY_PAUSED` 422、`RATE_LIMITED` 429、`MEDIA_UNAVAILABLE` 503。错误体采用 RFC 9457 风格，并带可本地化 `message`。

## 实体与枚举

共享枚举在 `src/api/shared-schema.js`：

- RecordStatus：`draft | pending-ai | pending-user | cooling | archived | mapped | abandoned | private | deleted`
- Visibility：`self | group`；Territory：`active | archived | destroy-cooling | deleted`
- RecordKind：`text | voice | image | audio`；Purpose：`memory | emotion | plan | alignment`
- Imagery：`flower | petal | leaf | branch | record | plant`
- AlignmentState：`draft | collecting | reviewing | saved | paused | ended | deleted`

公共审计字段：`id`、`relationId`、`createdAt`、`updatedAt`、`version`。修改/删除请求带 `If-Match: <version>`；版本不一致返回 `STATE_CONFLICT`，响应只给冲突字段与当前版本号，不泄露他人受限内容。

## 接口组

| 接口 | 用途与隐私边界 |
|---|---|
| `GET /v1/relations`、`/members`、`/territory` | 当前 actor 已授权的关系组、成员显示信息、领地状态。 |
| `POST /v1/records`、`/{id}/preprocess`、`/{id}/confirm`、`/{id}/transition` | B 页创建、Agent 预处理、确认版本及合法状态流转。情绪确认返回冷静期绝对时间。 |
| `POST /v1/uploads`、`/{id}/complete` | 预签/分段上传会话；正式服务须在服务器做 MIME、大小、授权、扫描与撤权。 |
| `GET /v1/records`、`/{id}`、`DELETE /{id}` | B 页档案；详细审计只可对本人/授权成员按权限输出。删除同步撤除投影。 |
| `GET /v1/scene-snapshots/{scene}` | A 页白名单投影：安全 `SceneImagery`、纪念碑和环境提示。 |
| `POST /v1/audio/{recordId}/playback-token` | 经授权的短时媒体 URL；不自动播放。 |
| `POST /v1/alignments`、`/inputs`、`/self-review`、`/save`、`/summary` | 双方隔离输入、本人核验、保存、仅已核验后输出对照/中性摘要。 |
| `POST /v1/safety/evaluate` | 返回 `clear` 或 `paused`；暂停时不返回润色/映射/浪漫化结果，正式资源来自可验证配置。 |
| `POST /api/agent/preprocess\|translate-memory\|map-imagery\|record-narration\|alignment-summary\|safety-check` | 本项目同源 Agent 后端；服务端先校验身份、`relationId`、可见性与状态，再调用 Mock 或 DeepSeek Provider。每个可采纳建议标出 `requiresUserConfirmation`，不得暗示已经发送/公开。 |

## 关键对象

### Record（B 页权限视图）

`rawText`、`transcript`、`rewriteCandidate`、`finalChoice`、`advice` 是 B 页审计字段；服务端按 actor/visibility 决定是否输出。`plan` 含原句与结构化字段。媒体只输出 `mediaId`，播放/下载 URL 须单独按权限签发。

### SceneImagery（A 页安全投影）

`imageryId, sourceRecordId, relationId, imageryType, scene, position, title, occurredAt, location?, note?, confirmedEmotionTag?, imageMediaToken?, recordDiscId?, explanation`。对于情绪/普通短句，`title/note/location` 均为中性转译字段；不得复用原文。`sourceRecordId` 仅用于同组 B 页深链，服务端再次鉴权。

### Alignment

输入与解析按 participant 私有存储。对方提交并本人核验前，响应只能含状态，如 `{submitted:false, reviewed:false}`，不得含长度、标签、摘要或字段。`AlignmentSummary` 只在双方保存确认后返回错位标签与中性摘要；纪念碑映射须同时满足 PRD 门禁。

## Mock 与正式 API 对齐

- `src/api/shared-schema.js` 是前端共用枚举和问题对象。
- `src/api/mock-handlers.js` 暴露同样的 actor/relationId 参数，先做关系组成员校验，再返回 B 视图或 A 白名单投影。
- 正式 HTTP Adapter 必须映射 OpenAPI，而不是让 UI 直接请求 Agent/数据库。现有 `ApiRepository` 是替换位置；接入前需完成下方清单。

## 待确认而不固化为业务规则

- 正式 token 认证、关系组邀请/成员管理、上传限制、正式冷静期时长、媒体签名与撤权、并发与删除审计、地区化援助资源、多人对齐参与人选择。
