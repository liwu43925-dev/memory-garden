# Memory Garden 当前可编辑 Demo

当前为可编辑的原生 HTML、CSS、JavaScript Demo。页面 A 接入分层 P0/P1 源图；页面 B 使用 IndexedDB Mock 演示录入、确认、档案、对齐与设置。请在本目录继续开发，不修改 `demo-preview/` 作为主源码。

## 本地预览
安装 Node.js 后，在本目录运行：

```powershell
node dev-server.mjs
```

终端输出实际端口；默认 `http://127.0.0.1:4173/`。若端口被占用，服务自动改用空闲端口并打印地址。按 Ctrl+C 停止。浏览器访问：

仅自己电脑访问时使用默认命令：

```powershell
node dev-server.mjs
```

同一局域网内让队友访问时，在主机运行：

```powershell
$env:HOST='0.0.0.0'; $env:PORT='4173'; node dev-server.mjs
```

然后将 `ipconfig` 中本机 IPv4 地址替换到地址中，例如 `http://192.168.1.23:4173/`。需要在 Windows 防火墙允许 Node 监听该端口；这不需要 VPN。跨网络访问应部署到内网/测试服务器或 HTTPS 托管环境，不要把开发端口直接暴露到公网。
- 页面 A 花园：`http://127.0.0.1:4173/r/group-home/space/garden`
- 页面 A 老屋：`http://127.0.0.1:4173/r/group-home/space/home`
- 页面 B 新建：`http://127.0.0.1:4173/r/group-home/workspace/new`
- 页面 B 档案：`http://127.0.0.1:4173/r/group-home/workspace/archive`
- 页面 B 对齐/设置：将末段改成 `alignment` / `settings`

以上示例端口如发生自动变更，使用终端打印的端口。不要直接双击 index.html：ES Modules、路由及本地媒体可能受到浏览器 file:// 限制。

## 修改入口
- `index.html`：语义页面壳和 CSS/JS 入口。
- `src/content.js`：导航、页面标题、场景提示及页面 B 可替换 Demo 文案/选项。
- `src/asset-paths.js`：P0/P1 场景素材相对路径。把替换图片放在 `assets/generated/source/` 相应目录，并改这里的路径；不使用 Base64。
- `src/scene-view.js`：页面 A 图层和可点击物件 HTML。
- `src/styles/tokens.css`：全局令牌；`src/styles/app.css`：当前页面 A/B、场景、组件及移动端样式。
- `src/app.js`：路由、页面 B 表单、状态与交互。视图入口以 `scene-view.js`、文案以 `content.js`、状态投影以 `domain.js` 分离；后续拆分应保持这些边界。
- `src/domain.js`：状态流、权限与页面 A 安全投影。更换文案、图片、Mock 样例无需改此文件。
- `src/data/fixtures.js`：集中修改演示关系组、记录和对齐样本；样例必须持续标记为演示数据。
- `src/data/repository.js`：`MockRepository` 与尚未联调的 `ApiRepository` 边界；`src/data/storage.js` 为本地 IndexedDB。
- `src/api/shared-schema.js`、`src/api/mock-handlers.js`、`src/api/http-contract-adapter.js`：Mock 与未来 HTTP Adapter 共用的 API 枚举、错误对象、契约形 Mock handlers 和 OpenAPI 路由适配器。
- `docs/api-contract.md`、`openapi.memory-garden.yaml`、`docs/frontend-backend-integration-checklist.md`：服务端联调唯一接口依据、OpenAPI 3.1 描述和上线前核对项。
- `docs/runtime-asset-map.md`：实际资产与组件映射；`docs/visual-diff.md`：视觉待检查事项。

## Mock / Real API
当前 `src/app.js` 初始化 `MockRepository`。要切换真实 API，需先与服务端确认 `docs/open-questions.md` 中的鉴权、权限、媒体和状态契约，再向 `ApiRepository` 注入符合契约的 client，并将初始化点改为该适配器。**当前 Real 模式只是边界，未完成真实联调。** 不要把真实 API Key 写入 `src/`、`index.html`、`dev-server.mjs`、`demo-preview/`、Git 或交付 ZIP；服务端密钥应由服务端保管。

接入前运行 `node scripts/api-contract-smoke.mjs`，它只验证本地 Mock 的关系组隔离、A 页安全投影和安全暂停路径；不代表真实服务联调成功。

## Agent 后端

现有 `dev-server.mjs` 同时提供静态网页和同源 `/api/agent/*` 后端。默认 `AGENT_PROVIDER=mock`，无需 Key，支持：

- `POST /api/agent/preprocess`
- `POST /api/agent/translate-memory`
- `POST /api/agent/map-imagery`
- `POST /api/agent/record-narration`
- `POST /api/agent/alignment-summary`
- `POST /api/agent/safety-check`

本地 Demo 请求使用 `X-Demo-Actor-Id`，所有写请求携带 16—128 字符的 `Idempotency-Key`。服务端实现位于 `server/agent/`；架构和安全门禁见 `docs/agent-architecture.md`，DeepSeek 的服务端配置见 `docs/deepseek-setup.md`。`.env.example` 只列变量名，不包含 Key；本地 `.env` 文件已被 `.gitignore` 排除。

运行 Agent 测试：

```powershell
node scripts/agent-backend-test.mjs
```

真实 DeepSeek 调用本轮为 `NOT RUN`。浏览器不得直接访问 DeepSeek，也不得在任何前端文件中保存 Provider Key。

页面 B 的文字预处理已通过 `src/api/agent-client.js` 调用同源 Agent 后端；后端错误或网络失败会停止流程，不会静默回退为浏览器本地“AI 成功”。联调差异和逐项结果见 `docs/integration-diff.md`、`docs/integration-report.md`。运行完整 Mock 联调：

```powershell
node scripts/integration-test.mjs
```

## 预览副本
`demo-preview/` 是本轮从上述可编辑源码与 41 个主 PNG 复制的静态演示快照。后续修改只在根目录进行，交付时重新生成副本。它默认使用 Mock，不需要 DeepSeek 或 API Key。

## 交付范围与启动顺序

本交付包含页面 A 展示端、页面 B 输入/档案/认知对齐工作区，以及同源 `/api/agent/*` Mock Agent 后端。推荐顺序：先启动 `node dev-server.mjs`，再打开页面 A；需要录入或复盘时进入页面 B。默认 `AGENT_PROVIDER=mock`，无需密钥。

Mock 重置：页面 B「关系设置」中的「重置 Demo 数据」，或清理浏览器对本地站点的 IndexedDB/Local Storage。

修改位置：

- 文案与选项：`src/content.js`
- P0/P1 资产路径：`src/asset-paths.js`
- Mock 关系组、记录、对齐：`src/data/fixtures.js`
- 状态机与安全投影：`src/domain.js`
- Agent Mock/HTTP 边界：`src/api/`、`server/agent/`
- 页面 A：`src/scene-view.js`、`src/styles/app.css`
- 页面 B、路由与交互：`src/app.js`

完整 Mock 复验：

```powershell
node scripts/api-contract-smoke.mjs
node scripts/integration-test.mjs
node scripts/agent-backend-test.mjs
```

真实 DeepSeek 后续配置：仅在服务端配置 `.env`，复制 `.env.example` 后填写 `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`，并将 `AGENT_PROVIDER` 切换为真实 Provider。浏览器、源码和 ZIP 不得包含 Key。

## 当前限制

真实 DeepSeek、真实语音识别、真实音频上传持久化、生产级多人权限、正式援助资源和 P2 记忆大陆均未实现。预置唱片没有真实音频文件，页面会显示明确缺失提示且不会自动播放。服务端双方隔离输入/本人核验写接口仍属于联调阻塞项。768/1024 专项视觉检查和完整自动对比度审计未运行。文件预览采用浏览器 Object URL，仅适合作为本地 Demo。

