# Memory Garden：Demo 合并快速检查与延后事项

日期：2026-11-06。范围：现有 P0 26 个主文件、新生成 P1 15 个文件；排除 previous/rejected 历史版本。不生成 P2，不修改网页代码。

## 读取到的输入
原始 PRD、design.md、资产清单、专用生成提示词、历史 visual-asset-qa.md、generation-log.md、六张整体参考图、现有 P0 和本轮 P1 源图片。旧审计中的 REGENERATE/MISSING 是历史制作级结论，不用于覆盖用户最新 Demo 决策。

## 状态与结论
P0 按本轮开始要求记录为“已修复、待合并复检”。P1 生成结束后已完成本次唯一的 P0+P1 合并快速检查。当前结论：**具备进入第 10 步进行 Demo 组装的文件基础；不是全部制作级 PASS，也不是网页合成截图验收通过。**

P1 实际生成 15/15，生成失败 0，当前必须单项重试 0。当前阻塞页面组装的文件级问题 0。P0 未在本轮重新生成。WebP/AVIF 优化版与实际页面尺寸、四断点合成效果尚未在本轮验收。

## 检查结果与方法
使用 Bitmap 解码全部 41 个主 PNG，并核对字节数、尺寸、像素格式及 32×32 网格 alpha 取样；生成每项后立即打开图片作视觉检查。alpha 取样不替代逐像素边缘检查，本轮不做制作级审计。

| 限定项目 | 快速检查结果 | 实际限度 |
|---|---|---|
| 文件存在且能打开 | 41/41 可解码，非空 | 详见下面逐文件清单 |
| 透明交互资产真实 alpha | 39 个 RGBA 文件均取样到 alpha=0 和非零像素；两张天空是 RGB | 未因存在 alpha 就宣称所有柔光/边缘完美 |
| 主要对象明显裁切 | 核心物件未发现阻止组装的明显裁切 | 环形刻痕线接近边缘，列 OPTIONAL |
| 同组状态严重跳位 | 桌宠单体统一 1254×1254；幻影统一 1254×1254；树冠成长层统一 1536×1024 | 坐姿/站姿占位、脚点和叠层偏移仍须布局补偿；无逐帧动画测试 |
| P0/P1 风格一致 | 基本延续米白、苔藓绿、暖棕和柔和纸/织物笔触，未另起风格 | 角色略偏可爱，属于视觉待办；无完整场景截图比较 |
| 关键资产完整 | 背景/地面、房屋、树干/树冠/三成长层、花叶、留声机/独立唱片均存在；P1 四组齐备 | 组装时检验遮挡关系，不强制所有旧独立层进入首屏 |
| 错误元素 | 未见明显文字、按钮、水印、棋盘格假透明；幻影无敌对/恐怖形象 | 庆祝图与刻痕有宽幅半透明柔光，不能当作完全干净的切片 |

纪念物只用于“记录双方确认的对齐”，不得标注“关系已修复”。桌宠是植物精灵原创方向，未观察到可识别的已知角色模仿；这不是对所有既有 IP 的穷尽检索。

## A. BLOCKING
当前合并快速检查未发现必须先重生成才能开始 Demo 组装的文件。若实际组装暴露明显遮挡、不可修正的裁切或关键层无法叠放，只修复对应资产，不重做全部 P0/P1。

## B. NON_BLOCKING
| 编号 | 文件/范围 | 观察到的问题 | 第 10 步处理建议（实现建议，不是产品规则） |
|---|---|---|---|
| D-01 | P0 树干、树冠、三个成长叠层 | 画布比例不同；成长层有较宽柔光 | 共享场景坐标，分别设置宽度与基准点；固定基础树冠，只切换成长叠层，截图核对 |
| D-02 | P0 花叶、前景、老屋/庭院层 | 半透明边缘和局部色差，非精确 2× | 先按实际最大显示尺寸观察；轻微遮罩和缩放，不以文件名 @2x 判断清晰度 |
| D-03 | pet-a/b 的 rest/curious/active | 坐姿与站姿包围盒不同，头身比偏可爱 | 使用统一脚点容器和各状态小幅缩放；不要把换姿势当作缩放动画，角色美术成熟度后续决定 |
| D-04 | pets-celebrate.png | 宽幅暖色半透明柔光，四角微小残留 alpha | 先缩小放在双人区域，必要时柔边遮罩；若仍遮挡场景，暂用两张 active 单体并列表示庆祝 |
| D-05 | memorial light / repair-texture | 图层中心与石面需要微调 | 依附石面局部定位，低透明度叠加；不改变“对齐记录”的语义 |
| D-06 | memory-veil-desktop/mobile | 原始层局部 alpha 较高，不能直接满强度覆盖 | 初始 CSS opacity 建议 0.12–0.25，可调整；保持场景可辨识，只作用当前用户视角 |
| D-07 | 所有 PNG | 尚未压缩为网页资源 | 保留原始 PNG，按实际显示尺寸输出 WebP；对比透明边缘后再替换，当前不是资源性能验收 |
| D-08 | phantom idle/focus | 细丝与边缘轻微变化 | 固定同尺寸容器及中心点；使用轻微交叉淡入，reduced-motion 直接切换 |

## C. OPTIONAL
| 项目 | 原因及处理 |
|---|---|
| alignment-memorial-ring.png 的当前显示 | 宽幅雾状底色与接近左边缘的环线不宜直接满画布叠加。可先不启用该层，用已生成光点/修复纹理呈现记录累积；待实际石面截图决定局部遮罩或单项重生。文件保留，不声称高质量刻痕完成。 |
| pets-celebrate.png 的合并显示方式 | 若宽幅柔光影响构图，可用已有 A/B active 单体并列；不是缺少角色文件。 |
| 独立唱臂/转盘、唱片架、窗台、照片架等精细拆层 | 文件已经存在，但若首版不做对应独立运动，可暂不启用；不得叠加出双重物件。 |
| P2 扩展素材 | 本轮未生成，也不纳入本轮关键资产门禁。 |

## 产物、待确认项、下一步所需输入
- 产物：15 个 P1 原始透明 PNG、追加的 generation-log.md、本报告及交付清单。
- 检查：一次合并快速检查完成；未进行浏览器组装、性能、动画或四断点截图验收。
- 待确认项：庆祝图柔光、纪念刻痕和角色成熟度在实际页面中的接受程度，允许后续截图决策，不阻塞本轮。
- 下一步所需输入：无需重新跑制作级 7.5.3。进入第 10 步时使用这些源图组装，再用实际截图处理本表待办；本轮未执行第 10 步。

## P0+P1 文件检查清单
路径均相对 assets/generated/source/。状态“可解码/真实alpha”是技术检查，不是制作级 PASS。

| 文件 | 尺寸 | 技术结果 |
|---|---|---|
| audio/mg-audio-gramophone-arm-play@2x.png | 1254×1254 | 可解码；真实 alpha |
| audio/mg-audio-gramophone-arm-rest@2x.png | 1254×1254 | 可解码；真实 alpha |
| audio/mg-audio-gramophone-body@2x.png | 1122×1402 | 可解码；真实 alpha |
| audio/mg-audio-record-black-01@2x.png | 1254×1254 | 可解码；真实 alpha |
| audio/mg-audio-record-rack@2x.png | 1448×1086 | 可解码；真实 alpha |
| audio/mg-audio-turntable@2x.png | 1254×1254 | 可解码；真实 alpha |
| garden/mg-garden-bg-sky-dawn@2x.png | 1672×941 | 可解码；RGB 背景，不要求透明 |
| garden/mg-garden-bg-vegetation@2x.png | 1913×822 | 可解码；真实 alpha |
| garden/mg-garden-flower-memory-01-open@2x.png | 1254×1254 | 可解码；真实 alpha |
| garden/mg-garden-foreground-hydrangea-left@2x.png | 1122×1402 | 可解码；真实 alpha |
| garden/mg-garden-foreground-leaves-right@2x.png | 1122×1402 | 可解码；真实 alpha |
| garden/mg-garden-leaf-memory-01@2x.png | 1254×1254 | 可解码；真实 alpha |
| garden/mg-garden-mid-ground-path@2x.png | 1672×941 | 可解码；真实 alpha |
| garden/mg-garden-tree-buds@2x.png | 1536×1024 | 可解码；真实 alpha |
| garden/mg-garden-tree-canopy-base@2x.png | 1536×1024 | 可解码；真实 alpha |
| garden/mg-garden-tree-early-bloom@2x.png | 1536×1024 | 可解码；真实 alpha |
| garden/mg-garden-tree-full-bloom@2x.png | 1536×1024 | 可解码；真实 alpha |
| garden/mg-garden-tree-trunk@2x.png | 1122×1402 | 可解码；真实 alpha |
| home/mg-home-bg-sky-dawn@2x.png | 1672×941 | 可解码；RGB 背景，不要求透明 |
| home/mg-home-bg-wall-mountain@2x.png | 1881×836 | 可解码；真实 alpha |
| home/mg-home-mid-dining-table@2x.png | 1536×1024 | 可解码；真实 alpha |
| home/mg-home-mid-house-main@2x.png | 1448×1086 | 可解码；真实 alpha |
| home/mg-home-mid-photo-rack@2x.png | 1086×1448 | 可解码；真实 alpha |
| home/mg-home-mid-windowsill@2x.png | 1536×1024 | 可解码；真实 alpha |
| home/mg-home-mid-yard-tree-canopy@2x.png | 1536×1024 | 可解码；真实 alpha |
| home/mg-home-mid-yard-tree-trunk@2x.png | 1122×1402 | 可解码；真实 alpha |
| memorial/alignment-memorial-base.png | 1122×1402 | 可解码；真实 alpha |
| memorial/alignment-memorial-light.png | 1122×1402 | 可解码；真实 alpha |
| memorial/alignment-memorial-repair-texture.png | 1122×1402 | 可解码；真实 alpha |
| memorial/alignment-memorial-ring.png | 1122×1402 | 可解码；真实 alpha |
| pets/pet-a-active.png | 1254×1254 | 可解码；真实 alpha |
| pets/pet-a-curious.png | 1254×1254 | 可解码；真实 alpha |
| pets/pet-a-rest.png | 1254×1254 | 可解码；真实 alpha |
| pets/pet-b-active.png | 1254×1254 | 可解码；真实 alpha |
| pets/pet-b-curious.png | 1254×1254 | 可解码；真实 alpha |
| pets/pet-b-rest.png | 1254×1254 | 可解码；真实 alpha |
| pets/pets-celebrate.png | 1536×1024 | 可解码；真实 alpha |
| phantom/knot-phantom-focus.png | 1254×1254 | 可解码；真实 alpha |
| phantom/knot-phantom-idle.png | 1254×1254 | 可解码；真实 alpha |
| veil/memory-veil-desktop.png | 1672×941 | 可解码；真实 alpha |
| veil/memory-veil-mobile.png | 941×1672 | 可解码；真实 alpha |

