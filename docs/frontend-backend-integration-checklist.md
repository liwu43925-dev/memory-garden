# 前后端集成核对清单

## 读取到的输入

- 原始 PRD、as-built `design.md`、`docs/api-contract.md`、`openapi.memory-garden.yaml`、现有 `MockRepository` 和 Demo fixtures。

## 接入前

- [ ] UI 只依赖 Repository/HTTP Adapter；不得直接读 Agent、数据库或媒体存储。
- [ ] 每个请求携带 `Authorization: Bearer <access-token>`；Demo 可使用 `X-Demo-Actor-Id`，但不得进入生产构建。
- [ ] 写请求携带唯一 `Idempotency-Key`；修改/删除携带服务端发放的 `If-Match` 版本。
- [ ] 当前关系组只从已授权 `GET /relations` 选择；每个资源 URL 都带同一 `relationId`。
- [ ] 不在浏览器、日志、URL、源码或 Mock fixture 写真实 API Key。

## 页面 B：输入、确认与档案

| 场景 | API | 客户端必须检查 |
|---|---|---|
| 创建记录 | `POST /relations/{relationId}/records` | 服务端返回 `recordId`、`version`，不以前端状态假定已共享。 |
| AI 预处理 | `POST .../records/{recordId}/preprocess` | 候选仅供本人确认；`paused` 立即停止普通流程。 |
| 情绪确认 | `POST .../confirm` | 使用 `coolingEndsAt` 与 `serverNow` 计算倒计时；取消前不请求场景投影。 |
| 状态/删除 | `POST .../transition`、`DELETE .../records/{recordId}` | `409` 时刷新该记录，不覆盖他人更新；删除后失效深链。 |
| 计划歧义 | `preprocess` 与记录更新 | 未确认关键字段不能声明完整或映射枝叶。 |
| 上传 | `POST /uploads` → 上传 URL → `POST /complete` | 只上传已授权文件；先等服务器验证为 `ready` 才创建记录。 |
| 档案 | `GET /records`、`GET /records/{id}` | 详情仅在 B 页受权渲染；403/404 一律显示无权/不存在，不能从缓存回填。 |

## 页面 A：只消费安全投影

- [ ] A 只调用 `GET /scene-snapshots/{scene}`、媒体播放 token 和安全的深链标识。
- [ ] Snapshot schema 中不得增加 `rawText`、`transcript`、`rewriteCandidate`、对齐原始输入、解析 fields 或未确认内容。
- [ ] A 收到 `404/403` 时清除旧投影，不保留上一关系组的物件。
- [ ] 以稳定 `imageryId` 去重；`sourceRecordId` 只用于带 `relationId` 的 B 页深链。
- [ ] 页面加载/刷新不写回映射，不把冷静期、私有、暂停、删除或已放弃记录渲染成共享意象。

## 音频、对齐、安全

- [ ] 播放前申请短时 `playback-token`；`audio` 元素不得自动播放，token 过期/403 时停止并提示。
- [ ] 发起对齐、提交本人输入、本人核验和保存分别请求专属端点；对方输入不得预取。
- [ ] `summary` 未就绪时只显示进度；不尝试以本地数据合成双方摘要。
- [ ] 只有服务器确认双方核验、保存、关系组可见且安全时，A snapshot 才返回纪念碑 mark。
- [ ] `SAFETY_PAUSED` 不调用润色、映射、唱片叙事或任何成长 endpoint；资源区域只显示后端配置状态，不硬编码援助信息。

## 错误、分页与恢复

- [ ] 统一处理 RFC 9457 `application/problem+json`：401 重新认证、403/404 最小提示、409 刷新、422 按可修正字段展示、429/503 可重试。
- [ ] 列表使用 cursor，不拼接猜测页码；筛选条件留在 URL/安全本地偏好，服务端仍二次鉴权。
- [ ] 恢复冷静期时重新取记录/服务端 `serverNow`；不使用纯本地 timer 判定完成。
- [ ] 不把上传 URL、媒体 token 或受限档案写进 `localStorage`。

## Mock / Real 切换验收

- [ ] `src/api/shared-schema.js` 枚举被 Mock 和 HTTP Adapter 共用。
- [ ] `MockRepository.contractHandlers()` 使用 `src/api/mock-handlers.js`，先检查 actor 与 relationId，再输出同形响应。
- [ ] HTTP Adapter 对照 `openapi.memory-garden.yaml` 实现同名操作、相同错误对象、分页和并发头。
- [ ] 用同一组前端契约测试分别跑 Mock 和 staging；不得为了 Mock 绕过权限、冷静期或安全暂停。
- [ ] 合约变更同时修改 OpenAPI、共享 schema、Mock fixtures/handlers、前端 Adapter 和本清单。

## 实施前待确认项

- 正式身份提供方、成员角色模型、上传限制及扫描、预签名 URL 的域与撤权策略、地区化可验证安全资源、正式冷静期时长、审计保留期和多人对齐规则仍由后端产品/安全负责人确认；不得由前端补写为既定事实。
