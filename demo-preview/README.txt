Memory Garden 静态演示副本（Mock）
================================

这是从项目可编辑源码复制的预览快照。后续开发请修改上一级目录，不要在此目录单独维护另一套源码。

在 demo-preview 目录运行：node dev-server.mjs
打开终端显示的地址。默认 http://127.0.0.1:4173/
同一局域网共享：PowerShell 执行 `$env:HOST='0.0.0.0'; $env:PORT='4173'; node dev-server.mjs`，队友使用主机 IPv4 地址访问，例如 `http://192.168.1.23:4173/`。需要放行 Windows 防火墙端口；不需要 VPN。跨网络请部署到测试服务器或 HTTPS 托管环境。
页面 A: /r/group-home/space/garden 或 /r/group-home/space/home
页面 B: /r/group-home/workspace/new、/archive、/alignment、/settings
端口占用时会自动选择其他端口，以终端输出为准。Ctrl+C 停止。
不要直接双击 index.html；浏览器的 file:// 模块、路由、媒体权限可能限制运行。

默认使用本地 Mock 和 IndexedDB 演示数据，不需要 API Key。未包含 .env、正式 API Key 或真实后端。当前页面 A/B 功能尚未完整验收。

