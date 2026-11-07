# Memory Garden 展示端实施计划

## 0. 读取到的输入与方案定位

- 已完整读取 PRD V4.0、`docs/prd-analysis.md` 和根目录 `design.md`。
- 仓库现状：仅有上述规划文档，没有 `package.json`、框架入口或业务代码。因此采用原生 HTML/CSS/JavaScript ES Modules；若后续并入已有框架，应保留以下领域与适配器边界，不重建宿主工程。
- 目标是无需后端可演示的双页面产品，并通过同一数据接口切换真实 API。本文是实施方案，未定义的服务行为见 `docs/open-questions.md`。

## 1. 推荐目录与模块边界

```text
index.html                     # 单入口与可访问的基础壳
src/
  app.js                       # 初始化、依赖注入、页面挂载
  router.js                    # URL 解析、深链、返回上下文
  config/demo.js               # 可替换 Demo 参数与功能开关
  styles/tokens.css            # design.md 语义令牌
  styles/base.css              # 排版、焦点、响应式基础
  styles/a.css                 # A 页场景与信息层
  styles/b.css                 # B 页工作区
  domain/entities.js           # 结构定义和枚举
  domain/transitions.js        # 状态流与前置条件
  domain/permissions.js        # 关系组/成员/可见性判定
  domain/projections.js        # 可展示数据投影，A 页白名单
  domain/mapping.js            # 已确认记录到意象的纯函数
  data/contract.js             # Repository 接口约定
  data/mock-repository.js      # Demo 实现
  data/api-repository.js       # 真实 API 适配器占位
  data/storage.js              # 版本化本地持久化与重置
  data/fixtures.js             # 明示为演示的可重置样本
  features/a/                 # 花园、老屋、物件、侧板、唱片
  features/b/new-record/      # 四类输入、确认、冷静期
  features/b/archive/         # 列表、筛选、详情、删除
  features/b/alignment/       # 独立输入、本人核验、对照
  features/b/settings/        # 权限、关系状态（按优先级）
  shared/audio.js              # 两路音频状态，不自动播放
  shared/accessibility.js      # 焦点管理、状态播报、减动
  shared/media-preview.js      # object URL 生命周期
  assets/                      # 获授权的分层资源与 SVG
tests/                         # 纯函数、状态流、浏览器验收
```

页面组件只能请求 Repository 的投影或命令，不能直接读全量存储。`domain` 不依赖 DOM、网络或存储；`data` 不依赖具体页面；A/B 各自只依赖共享契约与其允许的数据投影。

## 2. 路由与深链

采用 History API，静态托管需把未知路径回退至 `index.html`；无法配置回退的离线展示可切换 hash 模式，路由语义保持一致。建议路径（实现假设）：

| 用途 | URL 示例 |
|---|---|
| A 场景 | `/r/{groupId}/space/{garden|home}` |
| A 物件定位 | `/r/{groupId}/space/{scene}?object={mappingId}` |
| B 新建 | `/r/{groupId}/workspace/new?purpose={memory|emotion|plan|alignment}` |
| B 档案列表/详情 | `/r/{groupId}/workspace/archive`、`/r/{groupId}/workspace/archive/{recordId}` |
| B 对齐列表/会话 | `/r/{groupId}/workspace/alignment`、`/r/{groupId}/workspace/alignment/{sessionId}` |
| B 设置 | `/r/{groupId}/workspace/settings` |

URL 仅放不敏感标识，不放原文、候选、摘要、权限令牌或音频地址。路由解析先验证当前关系组与可见性，再取详情；无权、已删除和不存在共用中性不可用视图。A→B 来源档案与 B→A 意象定位采用标识深链；心结入口仅传关联事件标识。筛选、滚动、场景视角、音频状态用会话级导航快照恢复；跨刷新范围待确认。

## 3. 数据实体与状态

所有持久实体包含 `id`、`groupId`、`createdAt`、`updatedAt`、`schemaVersion`。`groupId` 是查询、缓存、媒体索引、映射和深链的强制隔离键；不能仅靠 UI 隐藏实现隔离。演示成员标识只代表当前 Demo 视角，不模拟正式登录身份。

| 实体 | 最小字段 | 边界 |
|---|---|---|
| `RelationshipGroup` | `id`, `label`, `memberIds`, `territoryState`, `settings` | 领地状态：活跃共建、双向归档、冷静销毁、记忆帷幕（后者是本人视角设置） |
| `Record` | `id`, `groupId`, `authorId`, `kind`, `purpose`, `status`, `visibility`, `original`, `transcript`, `candidate`, `finalChoice`, `metadata`, `timestamps` | 原文/转写/润色仅供授权 B 投影；候选不覆盖原文 |
| `RecordPermission` | `scope: self|group|mutual`, `ownerId`, `rawDraftReadableByOthers` | 默认最小可见；原始草稿默认不向对方开放 |
| `SceneMapping` | `id`, `groupId`, `sourceType`, `sourceId`, `scene`, `objectType`, `summary`, `explanation`, `state` | 仅由已确认、可共享、已归档来源生成；A 投影白名单，不携带原始表达 |
| `AlignmentSession` | `id`, `groupId`, `participantIds`, `state`, `entriesByParticipant`, `reviewsByParticipant`, `mismatchTypes`, `jointMemo` | 先隔离输入和本人核验，再对照；共同纪要须双方确认 |
| `AudioState` | `recordId`, `playing`, `position`, `volume`, `captionsEnabled`, `backgroundMusicEnabled`; 独立 `ambient` 音量/静音 | 只在用户操作后播放；无权限即停止并清除元数据 |
| `DemoViewState` | `activeGroupId`, `viewpointMemberId`, `sceneCamera`, `filters`, `scroll`, `audioPrefs` | 仅演示视角与导航偏好，不等同真实身份认证 |

记录合法流转遵循 PRD：`草稿 → 待 AI 确认 → 待用户确认 →（情绪类）冷静期中 → 已归档 → 已映射`；非情绪类确认后可直接归档。草稿、待确认和冷静期可放弃；归档/映射后可变为仅自己可见或已删除。任何迁移都由 `domain/transitions.js` 检查前置条件，并写状态时间线；取消冷静期必须先撤销可见/映射资格。

对齐会话的技术状态建议为 `initiated → collecting → self_review → comparison_ready → saved|ended`，各参与者独立维护 `draft/submitted/reviewed`。只有两人的提交与本人核验都完成，Repository 才返回对照投影。此枚举为实现假设，不替代 PRD 的用户可见状态。

## 4. Mock 与 API 适配边界

`Repository` 暴露同一异步方法集：`listGroups`、`getScene(groupId, scene)`、`listRecords(groupId, filters)`、`getRecord(groupId, id)`、`createDraft`、`processDraft`、`confirmRecord`、`cancelCooling`、`deleteRecord`、`listAlignments`、`getAlignment`、`submitAlignmentEntry`、`reviewOwnAnalysis`、`saveAlignment`、`getMedia`。返回统一的 `{data, error, revision}`，错误码至少区分 `not_found_or_forbidden`、`validation`、`conflict`、`unavailable`，不在 UI 暴露跨组详情。

Mock Repository 用确定性样本和可控时钟模拟 Agent 输出、高危触发与双人视角；所有演示内容明确标为样本。真实 API 适配器只负责请求、响应规范化与错误映射；UI 仍调用 Repository。正式鉴权、原子状态转换、文件存储与权限必须由服务端再次执行，前端检查仅作演示和即时反馈。高危正式资源配置另设可验证数据提供方，缺失时不显示未经核验号码。

## 5. 本地持久化与重置

- 使用版本化 IndexedDB 保存 Demo 记录、会话和上传 Blob；小型偏好与路由快照可存 `sessionStorage`。不在 URL、日志、分析事件或 `localStorage` 明文键中复制原始表达。
- 初次启动装载显式标记的样本；样本与用户演示输入分区。迁移失败时提供可恢复的错误与重置入口，不静默覆盖。
- “重置 Demo 数据”在 B 的关系设置中二次确认：清除本应用命名空间的 IndexedDB/偏好，撤销 object URL，停止音频，重新装载样本。具体删除范围在确认框列明，不触及其他站点数据。
- 冷静期记录绝对到期时间 `coolingEndsAt`；页面恢复时以当前时间重算，不依赖仍在运行的 interval。到期归档与撤回竞态在 Mock 中采用单次状态事务；真实 API 的裁决规则待确认。后台标签页不承诺精确秒级触发，恢复时校准。
- 浏览器本地数据不具备正式多人隐私和同步能力，Demo UI 应明确其演示性质。

## 6. 迭代顺序与完成定义

| 阶段 | 范围与完成定义 | 对应验收 |
|---|---|---|
| 0 基础契约 | 令牌、路由、关系组隔离、Repository、状态迁移和演示重置可独立运行；越权深链返回中性错误 | MG-X-001、MG-X-005 |
| 1 P0 页面骨架 | A 花园/老屋与 B 四页签、响应式导航、固定互跳、空/加载/错误态；键盘可达 | MG-A-001、MG-A-002、MG-U-001、MG-U-003 |
| 2 P0 录入与档案 | 四入口、情绪三选、冷静期撤回、计划歧义、图片/音频元数据、档案列表详情与删除同步 | MG-A-003、MG-I-001~003、MG-X-002 |
| 3 P0 意象与音频 | 已确认图片驱动花/叶、音频唱片、来源和解释；无自动播放；删除同步 | MG-G-001~004、MG-X-003 |
| 4 P0 对齐与安全 | 双方独立输入、本人核验、错位标记、保存/暂时结束；高危 Demo 分流 | MG-C-001~004、MG-X-004 |
| 5 P0 稳定验收 | 375/768/1024/1440、键盘、焦点、减动、颜色非唯一、隐私负向场景均通过；无横向滚动 | MG-U-001~003、MG-X-001~005 |
| 6 P1 选做 | 按产品确认范围加入心愿树阶段、桌宠、字幕、纪念物、深链定位、帷幕/双向归档演示；逐项复用既有验收 | MG-G-004、MG-C-004、MG-X-001 等相关项 |
| 7 P2 后续 | 完整大陆、主题自定义、真实账号同步、守园者与商用合规另立里程碑；不得列为首版完成条件 | 需另拟验收，不能冒充第 13 章 P0 |

每阶段以可演示路径、对应自动化/人工验收记录和未决问题更新为完成标准；未获得正式资源或服务契约时仅交付明确标记的 Demo 能力。

## 7. 高风险与控制措施

| 风险 | 控制与验证 |
|---|---|
| 浏览器音频策略 | 用户点击后调用播放；拒绝播放时留在暂停态并说明；唱片/氛围音独立控制，切场景策略配置化 |
| 上传预览与存储 | 检查 MIME、大小和解码结果；object URL 用毕撤销；Blob 配额失败可恢复；限制值待确认 |
| 隐私泄漏 | A 使用专用白名单投影；B 逐字段授权；跨组缓存/深链/媒体负向测试；不把敏感内容写 URL/日志 |
| 倒计时恢复 | 存绝对到期时间，页面恢复重算；撤回与到期原子裁决；测试系统时钟跳变和后台恢复 |
| 移动端 | 四断点、窄屏与横屏测试；固定 CTA 安全区和软键盘遮挡检查 |
| 键盘漫游 | 所有物件可 Tab/Enter，平移/缩放有按钮与键盘替代；焦点不随场景重排丢失 |
| 资源性能 | 分层资产、WebP/AVIF、懒加载、预留尺寸、花簇聚合、长列表分页/虚拟化；性能预算待确认 |
| 高危模拟 | 触发即暂停普通处理与映射；不诊断、不生成意象；援助资源从可配置且核验的数据源获取 |

## 8. 测试策略

- **单元**：状态迁移、权限判定、A 投影白名单、映射计数与删除、冷静期时间计算、路由解析。
- **状态流**：情绪三选/撤回/到期、计划未补全、私人归档、删除、对齐双人核验与修改；使用可控时钟。
- **端到端**：A↔B 深链、录入到映射、档案回看、音频点击播放、重置 Demo 数据、刷新恢复。
- **无障碍**：纯键盘、焦点恢复、可访问名称、错误播报、44×44、对比度、减动和非颜色编码。
- **响应式**：375、768、1024、1440 px 与移动横屏；无横向滚动、底部安全区、弹窗和输入法遮挡。
- **隐私负向**：未确认/冷静期/仅自己可见内容不得进入 A；跨组 ID、失效深链、媒体地址、对齐单方未核验均不得泄露标题、原文、解析或元数据。
- **手工审核**：高危分流不诊断、不浪漫化；对齐文案不裁判、不宣称关系修复；视觉资产授权和加载质量。

## 9. 产物、检查结果、待确认项、下一步所需输入

- **产物**：本实施计划；后端及产品未决事项见 `docs/open-questions.md`。
- **检查结果**：规划覆盖目录、技术栈、路由、实体、适配器、持久化、优先级、风险、测试和逐阶段验收；P2 未列为首版必做；A 投影与对齐门禁均设显式边界。
- **待确认项**：以 `docs/open-questions.md` 为准，尤其真实鉴权、文件/媒体、冷静期并发和援助资源契约。
- **下一步所需输入**：产品确认 P1 范围与 Demo 视角；服务端负责人确认 API、权限、并发和媒体契约；视觉负责人提供获授权资产。确认前可按阶段 0 建立纯前端 Mock 骨架。
