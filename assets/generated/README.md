# `assets/generated/` 场景资产交付说明

## 读取到的输入

- `docs/visual-asset-manifest.md`：唯一文件名、层级、画布、锚点、点击与动效规划。
- `docs/imagegen-asset-prompts.md`：逐件 GPT Image 中文提示词与透明失败替代方案。
- 原始 PRD 与 `design.md`：产品、安全、优先级、无障碍和性能边界。

## 当前状态

本轮已在 `source/garden/`、`source/home/` 与 `source/audio/` 生成最小 P0 PNG 母版；逐项状态、提示词编号、参考图、文件时间与复核结果见 `generation-log.md`。它们均仍处于 7.5.3 之前的候选状态，**不得据此宣称视觉验收通过**。其中繁花期树冠已标记待重生成，禁止接入页面。6 张 `assets/reference/` 图片仍只可作为整体构图参考，不能复制到这里后当作正式分层资产，也不能整张作为网页背景冒充可交互页面。

## 建议目录

```text
assets/generated/
├─ garden/
│  ├─ background/
│  ├─ ground/
│  ├─ tree/
│  ├─ growth/
│  └─ foreground/
├─ home/
│  ├─ background/
│  ├─ architecture/
│  ├─ objects/
│  └─ foreground/
├─ audio/
│  ├─ gramophone/
│  ├─ records/
│  └─ covers/
├─ pets/
│  ├─ cat/
│  └─ dog/
├─ continent/              # P2；不可计入首版完成度
│  ├─ creatures/
│  ├─ phantom/
│  ├─ wish-vision/
│  └─ monument/
├─ atmosphere/
├─ source/                 # PNG 母版；是否入库待团队确认
└─ README.md
```

## 文件与版本规则

- 网页交付：`mg-{scene}-{layer}-{object}-{state}@1x.webp`、`@2x.webp`。
- 透明母版：同名 `.png`，保留真实 alpha，不接受棋盘格伪透明。
- 背景：优先 WebP/AVIF；透明对象：WebP + PNG 母版。
- 同对象状态必须同画布、同锚点、同视角、同光源；禁止靠 CSS 修补跳位。
- 不在文件中烘焙文字、UI、按钮、焦点框、可访问名称或用户数据。
- 每次修改提高版本元数据，不在文件名中使用“final-final2”；版本记录写入资产登记表。

## 每件资产必须随附的登记字段

建议在后续资产登记文件中记录：

```yaml
file: mg-garden-tree-trunk@2x.webp
status: draft | reviewed | approved | rejected
priority: P0 | P1 | P2
source_prompt: docs/imagegen-asset-prompts.md#P-G04
reference_images:
  - assets/reference/记忆花园：温暖陪伴界面展览.png
  - assets/reference/温暖记忆花园与唱片 UI.png
canvas: 2048x2560
anchor: { x: 0.5, y: 0.96 }
alpha_checked: false
edge_checked_100: false
edge_checked_200: false
state_alignment_checked: false
mobile_crop_checked: false
desktop_crop_checked: false
license_owner: "[待确认]"
reviewer: "[待确认]"
approved_at: null
sha256: ""
notes: ""
```

## 导入门槛

只有同时满足以下条件的文件才能从草稿进入网页实现：

1. 文件名、尺寸、比例、透明、安全边距和锚点符合资产清单。
2. 100% 与 200% 检查无白边、绿边、色溢、透明孔洞或被裁断轮廓。
3. 同一对象多状态原位叠放无缩放、跳位、视角和光向变化。
4. 在 375/768/1024/1440 裁切测试中，关键主体不被导航、详情抽屉或安全区遮挡。
5. 不含文字、UI、Logo、水印、伪按钮、焦点框或用户内容。
6. 未添加参考图中不存在的装饰；不同对象没有被合并成一张图。
7. P2 资产已明确标记，不计入首版 P0/P1 完成度。
8. 资产来源、生成提示词、人工修订、版权/使用授权和审批人均可追溯。
9. 高危内容没有被转成花、唱片、光点等浪漫化意象；幻影与纪念碑无诊断、裁判或“关系已修复”暗示。

## 纯色抠图资产处理

若 GPT Image 无法可靠输出透明背景：

1. 只接受提示词规定的均匀 `#00FF00` 纯色背景版本。
2. 必须人工去背；不可在运行时用 CSS `mix-blend-mode` 或色键滤镜冒充透明。
3. 检查毛发、叶缘、花瓣、玻璃、光晕和半透明雾气。光影/薄雾/萤火类若无法直接输出 alpha，应由美术手工合成，不使用绿色底版本。
4. 去背后的 PNG 重新执行全套边缘、锚点和叠放检查。

## Web 使用边界

- 插画层只负责视觉；点击、键盘焦点、ARIA、文字说明、抽屉、播放器和权限状态由真实 HTML/SVG 交互层承担。
- 页面 A 资产的文件名、alt、DOM 属性、日志和元数据中不得出现情绪/争吵原文或认知对齐输入。
- 花/叶/枝叶/唱片/纪念纹理只在真实记录达到 PRD 合法状态后显示；冷静期、已放弃、仅自己可见、高危暂停内容不得生成共享意象。
- 氛围层不代表对关系好坏的判断；疲惫、委屈等情绪不得用惩罚性枯萎表达。
- 所有动画需可中断；`prefers-reduced-motion` 下直接显示终态。音频永不因资产加载自动播放。

## 产物、检查结果、待确认项、下一步所需输入

- 产物：本目录结构、命名、登记、导入门槛、安全边界说明，以及 `source/` 中的最小 P0 PNG 候选资产。
- 检查结果：未把整体参考图复制或伪装成正式资产；P2 和透明失败流程均有明确标记。PNG 候选资产的逐项解码检查见 `generation-log.md`。
- 待确认项：源 PNG 是否入库、AVIF 浏览器策略、版权/授权责任人、审批人、P1/P2 本轮范围。
- 下一步所需输入：视觉负责人批准清单后，按 `docs/imagegen-asset-prompts.md` 从 P0 背景与核心物件开始逐件生成、质检、登记。
