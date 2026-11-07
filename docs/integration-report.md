# Memory Garden 三端联调报告

日期：2026-11-07（Asia/Shanghai）  
环境：本地 Node 服务，`AGENT_PROVIDER=mock`，无真实 DeepSeek Key。

## 读取到的输入

- 原始 PRD、API 契约、OpenAPI 3.1、Agent 架构、前后端集成清单。
- 页面 A/B、Mock Repository、领域状态机、Agent Provider、环境模板与现有预览服务。

## 状态定义

- `MOCK PASS`：本轮实际用 Mock/确定性代码执行并断言通过。
- `REAL PASS`：真实服务实际通过。本轮没有此状态。
- `FAIL`：实际执行失败。
- `BLOCKED`：缺少生产基础设施或当前架构尚无完整路径，未伪装为通过。
- `NOT RUN`：本轮未执行。

## 验证矩阵

| 验证项 | Mock 状态 | Real 状态 | 实际证据与限制 |
|---|---|---|---|
| 创建记录 | `MOCK PASS` | `NOT RUN` | Contract handler 创建稳定 ID、relationId/actor 绑定；当前浏览器业务记录仍存 IndexedDB。 |
| AI 预处理 | `MOCK PASS` | `NOT RUN` | 页面 B 已改为调用同源 `/api/agent/preprocess`；现场 HTTP 返回 `provider=mock`、`safety=clear`。网络失败不回退为本地 AI 成功。 |
| 用户确认 | `MOCK PASS` | `NOT RUN` | 测试覆盖 draft → pending-ai → pending-user → 确认；Agent 结果保持 `requiresUserConfirmation=true`。 |
| 冷静期取消 | `MOCK PASS` | `NOT RUN` | cooling 内容没有 A 页投影；取消转为 abandoned，仍无共享意象。 |
| 冷静期到期 | `MOCK PASS` | `NOT RUN` | 绝对 `serverNow/coolingEndsAt` 可解析；测试显式执行服务端到期转移后才允许归档/映射。浏览器旧 IndexedDB 定时器不是生产实现。 |
| 归档 | `MOCK PASS` | `NOT RUN` | 合法状态流转通过；非法状态由状态机拒绝。 |
| 意象映射 | `MOCK PASS` | `NOT RUN` | 只有归档/映射、关系组可见且安全记录可调用 map-imagery；冷静期测试返回冲突。 |
| A/B 深链 | `MOCK PASS` | `NOT RUN` | `/workspace/archive/{recordId}` 与 `/space/{scene}?object={imageryId}` 均由当前 SPA 返回 HTTP 200。未进行自动浏览器视觉定位检查。 |
| 图片 | `MOCK PASS` | `BLOCKED` | Mock 图片记录映射为 flower/petal/leaf，删除后安全快照同步移除；生产文件存储、扫描和签名 URL 尚未接入。 |
| 音频 | `MOCK PASS` | `BLOCKED` | 已验证授权音频的唱片叙事候选；真实上传、真实媒体内容和生产播放 token 未联调。没有自动播放。 |
| 计划补全 | `MOCK PASS` | `NOT RUN` | `planMissingFields` 对日期、时间、地点、动作及出发/到达语义做确定性检查；缺字段不能完成映射。 |
| 删除同步 | `MOCK PASS` | `NOT RUN` | 删除记录后 SceneSnapshot 不再返回对应 imageryId。 |
| 双方隔离输入 | `BLOCKED` | `NOT RUN` | 已验证未完成一方核验时摘要/纪念碑门禁拒绝；尚无完整 HTTP 双方输入投影端点联调，不能声称完整隔离流程通过。 |
| 本人核验 | `BLOCKED` | `NOT RUN` | 门禁逻辑与 fixture 检查通过，但页面 B 到服务端的本人核验写接口尚未真正接入共享服务端 Store。 |
| 共同纪要 | `MOCK PASS` | `NOT RUN` | 仅双方完成核验并保存的 Demo alignment 可获得中性摘要；响应不含 participants、fields 或原始输入。 |
| 高危暂停 | `MOCK PASS` | `NOT RUN` | 确定性安全代码在 Provider 前暂停；测试确认 Provider 调用次数为 0，不返回热线或浪漫化意象。 |
| 关系组隔离 | `MOCK PASS` | `NOT RUN` | 非成员访问返回 `FORBIDDEN`；私有记录对其他成员返回 `NOT_FOUND`。 |
| 刷新恢复 | `MOCK PASS` | `BLOCKED` | 同一 Mock 状态和浏览器 IndexedDB 可恢复；Agent 服务进程重启后的持久化未实现。 |
| 网络错误 | `MOCK PASS` | `NOT RUN` | AgentClient 将 fetch 失败映射为 `NETWORK_ERROR`，页面停止流程，不生成本地假候选。 |
| 权限拒绝 | `MOCK PASS` | `NOT RUN` | 403/404 路径实际断言通过，未授权数据没有先返回再隐藏。 |

## 隐私检查

- SceneSnapshot 测试拒绝 `rawText`、`privateText`、`transcript`、候选版本、对齐 participants/fields 和原始媒体 URL。
- 共同纪要只返回中性摘要与错位枚举；“完成对齐”不表示关系修复。
- 页面 B 的原文仍只存在档案视图；页面 A 不从 Agent 接口获取原文。

## 已执行命令

```powershell
node --check src/app.js
node --check src/domain.js
node --check src/api/agent-client.js
node --check scripts/integration-test.mjs
node scripts/api-contract-smoke.mjs
node scripts/agent-backend-test.mjs
node scripts/integration-test.mjs
```

最终结果：API Contract `PASS`；Agent Backend `PASS`；三端 Mock Integration `PASS`。首次 HTTP 测试因沙箱禁止本机网络而失败，获准访问本机环回地址后重跑通过；该环境失败不计为产品 FAIL。

## 未执行与阻塞项

1. 真实 DeepSeek：`NOT RUN`，没有真实 Key。
2. 输入端全部记录 CRUD 切换为服务端权威 Store：`BLOCKED`。目前 Agent preprocess 已同源联调，但页面业务数据仍以 IndexedDB Mock 为主。
3. 生产图片/音频存储、病毒扫描、签名和撤权：`BLOCKED`。
4. 完整双人异步输入与本人核验 HTTP 写入流程：`BLOCKED`。
5. 服务重启后的持久化、正式鉴权、分布式幂等/缓存与限流：`BLOCKED`。
6. 自动浏览器视觉截图与点击回归：`NOT RUN`；本轮只验证路由、数据、状态、隐私和 HTTP 行为。

## 下一步所需输入

- 若要解除阻塞，需要确认：是否将浏览器 IndexedDB 完全迁移到服务端 Demo Repository；正式鉴权主体格式；媒体存储/扫描方案；双人对齐写接口的并发与版本冲突策略。
