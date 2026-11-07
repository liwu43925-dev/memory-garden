# 页面 A 运行时资产映射

## 读取到的输入

当前 `src/scene-view.js`、`src/asset-paths.js`、P0/P1 源文件、页面 A 的花园与老屋实际预览。此表记录 Demo 的主要渲染来源，不把环境装饰当作用户记录。

| 真实文件（均以 `assets/generated/source/` 为根） | 页面与 DOM/组件 | 层级及状态 | 来源分类 | 点击行为 |
|---|---|---|---|---|
| `garden/mg-garden-bg-sky-dawn@2x.png` | A 花园 `.sky` | 后景 | 底图自带天空/远山 | 无 |
| `garden/mg-garden-bg-vegetation@2x.png` | A 花园 `.vegetation` | 中景 z=4，含唯一围栏与固定花丛；PNG 顶部视觉裁切，围栏可见底边锚定设计坐标 y≈555 | 底图自带 | 无，`pointer-events:none` |
| `garden/mg-garden-mid-ground-path@2x.png` | A 花园 `.path`、A 老屋 `.home-ground` | 中远景/前景地面 z=6；花园盒 `(0,45,1440,960)`、老屋盒 `(0,195,1440,805)`，以底边为锚，远景草坡向上压入围栏/院墙底边 | 底图自带 | 无，`pointer-events:none` |
| `garden/mg-garden-tree-trunk@2x.png` | A 花园 `.trunk` | 中景树干 | 独立成长层 | 无 |
| `garden/mg-garden-tree-canopy-base@2x.png` | A 花园 `.canopy` | 中景基础树冠 | 独立成长层 | 无 |
| `garden/mg-garden-tree-buds@2x.png`、`garden/mg-garden-tree-early-bloom@2x.png`、`garden/mg-garden-tree-full-bloom@2x.png` | A 花园 `.bloom` | 中景，按已映射图片数量择一 | 独立成长层 | 无 |
| `garden/mg-garden-flower-memory-01-open@2x.png` | A 双场景 `button.flower[data-object]` | 树冠附近，图片记录 | 独立交互层 | 打开对应 `sourceRecordId` 的安全详情 |
| `garden/mg-garden-leaf-memory-01@2x.png` | A 双场景 `button.branch` / `button.plant` / 图片叶片 | 树冠/场景，计划或中性植物意象 | 独立交互层 | 打开对应记录详情 |
| `home/mg-home-bg-sky-dawn@2x.png` | A 老屋 `.sky` | 后景天空/远山 | 底图自带 | 无 |
| `home/mg-home-bg-wall-mountain@2x.png` | A 老屋 `.home-wall` | 中景 z=4，唯一院墙、院门和固定植物；独立于花园围栏坐标 | 底图自带 | 无，`pointer-events:none` |
| `home/mg-home-mid-house-main@2x.png` | A 老屋 `.house` | 中景房屋、唯一窗户 | 底图自带 | 无 |
| `home/mg-home-mid-yard-tree-trunk@2x.png`、`home/mg-home-mid-yard-tree-canopy@2x.png` | A 老屋 `.home-trunk` / `.home-canopy` | 中景院树，各一层 | 底图组成 | 无 |
| `home/mg-home-mid-dining-table@2x.png` | A 老屋 `.table` | 中景固定家具 | 底图组成 | 无 |
| `audio/mg-audio-gramophone-body@2x.png` | A 双场景 `button[data-gramophone]` | 中景，留声机 | 独立交互层 | 有唱片时打开对应详情；无唱片时提示空状态 |
| `audio/mg-audio-record-black-01@2x.png` | A `.record-collection button[data-object]` | HTML 木质唱片收藏区内，每个音频记录一个按钮 | 独立交互层 | 打开对应唱片详情并可装入留声机 |
| `pets/pet-a-rest.png`、`pets/pet-b-rest.png` | A `button.pet` | 前景，空状态/安静休息 | 独立交互层 | 近期变化摘要 |
| `pets/pet-a-curious.png`、`pets/pet-b-curious.png` | A `button.pet` | 前景，有已映射意象 | 独立交互层 | 近期变化摘要 |
| `memorial/alignment-memorial-base.png`、`memorial/alignment-memorial-light.png` | A `button.memorial` | 花园树根侧边 `(900,790,w180)`；老屋院树右侧草地 `(925,790,w165)`；z=25（普通地表之上、桌宠/留声机之下），双方确认并保存后 | 独立交互层 | 中性说明，不宣称关系修复 |
| `phantom/knot-phantom-idle.png` | A `button.phantom` | 前景，仅显式 `unresolved` 会话 | 独立交互层 | 跳页面 B 的关联对齐入口 |
| `veil/memory-veil-desktop.png` | A `.veil-layer` | 氛围覆盖层，当前用户开启时 | 独立状态层 | 无；`pointer-events:none` |

## 当前场景不使用的独立文件

| 文件 | 原因 |
|---|---|
| `audio/mg-audio-record-rack@2x.png` | 造型像梯架且会与留声机争夺空间；改用可访问的 HTML 木质唱片收藏区 |
| `home/mg-home-mid-windowsill@2x.png` | 房屋主体已有窗户；叠加会产生第二套窗结构 |
| `home/mg-home-mid-photo-rack@2x.png` | 与独立唱片架争夺同一墙面，造成重叠 |
| `garden/mg-garden-foreground-hydrangea-left@2x.png`、`garden/mg-garden-foreground-leaves-right@2x.png` | 地面和植被图已包含固定花丛；再次叠加会重复 |
| `pets/pet-a-active.png`、`pets/pet-b-active.png`、`pets/pets-celebrate.png` | 第 11 步才接入状态动画，当前保持稳定落脚 |
| `memorial/alignment-memorial-ring.png`、`memorial/alignment-memorial-repair-texture.png` | 后续与实际双方确认次数关联，不作假累积 |
| `phantom/knot-phantom-focus.png` | 第 11 步聚焦响应状态 |
| `veil/memory-veil-mobile.png` | 当前 Demo 使用同一透明层缩放；移动资产后续再接 |

## 映射与边界

场景数据由 `src/domain.js#toSceneProjection` 投影：`imageryId` 是稳定的 `mappingId`，`sourceRecordId` 对应一条记录，同时保留 `relationId`、`imageryType`、`scene`、`position`、`createdAt`、`visibility`、`status`。只有符合共享、归档/映射和安全条件的记录进入页面 A。固定花丛和家具无点击行为，不冒充记录。页面 A 不接收敏感原文或对齐拆解表。

## 产物、检查结果、待确认项、下一步所需输入

- 产物：本表与页面 A 的单一渲染来源一致。
- 检查结果：JavaScript 语法检查已执行；自动浏览器 UI 检查未用于本轮，人工视觉复核仍需用户进行。
- 待确认项：长期未解决差异的正式判定字段；Demo 仅接受显式 `unresolved` 标记。
- 下一步所需输入：用户对花园/老屋构图、桌宠和唱片架位置的人工反馈。
