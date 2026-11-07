# Memory Garden 交付清单

- 版本：`page-a-hitfix-2026-11-07`
- 交付日期：2026-11-07
- 技术栈：原生 HTML/CSS/JavaScript + Node 静态/同源 Mock Agent 服务
- 唯一可编辑源码：`Memory-Garden-source.zip` 解压后的根目录源码（不再维护第二套代码）。
- 说明：本清单保留在项目根目录并随交付链接提供；为避免归档哈希自引用，`docs/delivery-manifest.md` 不嵌入 source ZIP。
- Demo 默认：Mock Provider，无真实 API Key

## 交付包

| 文件 | SHA-256 | 内容 |
|---|---|---|
| `Memory-Garden-source.zip` | `41E5B880803BE9A9344D4D09BA959918F1C8DB5BEA09B29DA89462C94F4359AB` | 完整未压缩源码、文档、Mock/API、测试、P0/P1 资产、`.env.example`（不含本清单自身） |
| `Memory-Garden-demo.zip` | `2CF90A56C1A0E6D60F8443D986B6563194138BF4E3CFEF5D0D58AAF0B95D564D` | `demo-preview/` 静态演示副本、相对资产路径、Mock 启动说明 |

## 源码文件清单

- `index.html`、`src/`：页面入口、页面 A/B、状态与交互、Mock 数据、API Adapter、样式和资产路径。
- `server/agent/`、`dev-server.mjs`：同源 Agent Mock/Real Provider 边界。
- `assets/generated/source/`、`assets/generated/web/`：P0/P1 插画资产；原始源文件保留。
- `docs/`：PRD 分析、设计、API 契约、联调、验收和资产文档。
- `scripts/`：契约、Agent、联调、页面 A 交互与场景控制测试。
- `.env.example`：仅变量名和 Mock 默认值，不含密钥。

## 完成情况

- P0：页面 A 花园/老屋、页面 B 四页签、录入/档案/冷静期/计划歧义/删除/关系组隔离/安全暂停/核心无障碍与 Mock 闭环已完成并有验收证据。
- P1：桌宠、纪念碑、唱片/留声机、记忆帷幕、场景控制和即时动态反馈已接入 Demo。
- P2：完整记忆大陆、多主题领地、守园者、奇遇/战斗/奖励/排行榜、生产级多人同步未实现。

## 验收摘要

- Mock API/Agent、页面 A 真实 pointer 交互、键盘焦点、场景控制测试：已运行。
- 真实 DeepSeek：`NOT RUN`，无 Key。
- 阻塞项：服务端双方隔离输入/本人核验写接口、unresolved phantom fixture、真实音频文件、768/1024 专项视觉检查和完整对比度自动审计；详见 `docs/acceptance-report.md`。

## 交付边界

两个 ZIP 均不包含 `.env`、`.env.local`、`.env.*.local`、`node_modules`、浏览器缓存、运行日志或私人工作目录。源码保持未压缩、未混淆；图片均使用相对路径。
