# CliniVol 项目开发规范

本文件适用于项目根目录及其全部子目录。后续开发、维护与验证工作均应遵循以下约定。

## 产品与视觉

1. 产品名称统一为 **CliniVol**，始终使用项目现有品牌 Logo，不重新绘制或以文字替代。
2. 品牌核心色为 `#0D7A5D`；颜色基础值和成功、警告、错误等语义映射以 Design System V1.0 的最终 Figma 规范为准，不再使用旧辅助色色阶覆盖。Info 蓝色保持已确认的独立状态语义。
3. 默认采用 Light Mode，并保留已实现的 Dark 偏好；医学影像 Viewport 保持各自已确认的背景、材质与方向色。
4. 首页大卡片及平台通用Card使用当前安装的tdesign-react 1.18.4官方Card默认圆角：`.t-card { border-radius: var(--td-radius-medium) }`，官方`--td-radius-medium: 6px`，最终默认值为6px。不得用“通用卡片一律8px”替代；其他组件按既定3/4/8/12/16px及50%体系选用。业务页面保持流体全宽布局、左右安全边距24px。
5. `GlobalHeader` 必须保持稳定，页面或任务 Tab 切换时不得闪烁、位移或重新布局。收起左侧导航只改变 Sidebar 宽度；Logo 容器与当前图片尺寸保持固定，不随侧栏收缩。

## 技术与组件

6. 项目技术栈保持为 React + TypeScript + Vite；平台级通用组件优先使用 TDesign React，平台级通用图标优先使用 TDesign Icons。
7. 专业医学影像界面采用自主设计，不强行套用 TDesign 的普通后台布局；可按需复用基础按钮、弹窗、Tooltip 等通用能力。

## 业务与专业功能

8. 必须保留任务Tabs、任务打开与关闭、工程持久化、提交审核、审核退回、正式成果锁定、上下游任务解锁及状态同步。审核人不固定为医生，由未来管理员后台根据任务与审核权限指定，可为医生、管理员或其他授权人员；本轮不新增后台或更改既有审核记录身份。CAD修改工程数据后自动保存，无须手动点击；顶部时间（如“15:49 已保存”）必须取自实际保存成功记录，保留保存中及失败状态，不伪造成功时间。CAD工具栏禁止重新添加独立“保存工程”按钮。
9. 专业医学功能必须以现有用户手册和已经确认的产品能力为依据，不自行增加未经确认的医学功能。

## 修改范围与工作方式

10. 只修改用户本轮明确指定的范围，不主动重构、清理或调整无关模块。
11. 优先定位相关文件并进行最小范围修改；搜索和检查时排除 `node_modules`、`dist` 等依赖或生成目录。
12. 简单 UI 修改只执行与改动风险相匹配的必要验证，不重复运行无关测试。
13. 完成工作后，仅简要报告修改文件、完成结果及未完成事项，不输出大段源码或重复介绍项目背景。
14. 列表项 Hover 必须覆盖当前列表项的完整有效行宽；单独按钮或文字链接仅高亮自身，不将高亮扩展到整行。

## 开发与部署规范

15. 日常 UI/UX 修改默认只完成代码修改、与风险匹配的必要测试和本地预览，不默认部署到 Vercel。只有用户明确要求“部署”“发布线上”或“更新 Vercel”时，才允许执行线上部署。
16. 未获得本轮明确部署授权时，禁止主动调用 Vercel 插件、Vercel API 或 Vercel CLI 执行发布、推广、回滚、项目关联或域名变更。
17. 部署优先使用项目已配置的 GitHub → Vercel 自动部署机制，避免重复维护独立发布链路。
18. 如尚未配置 GitHub 自动部署，应先以只读方式检查现有 Git 仓库、GitHub 远端及 Vercel 项目关联关系，并提出最简配置方案；不得擅自创建新项目、重新关联项目、覆盖现有项目或修改线上域名。
19. 用户明确要求部署时，优先使用已经配置的自动部署；确需手动发布时再使用 Vercel CLI。不得默认通过 Vercel 插件执行多轮部署操作。
20. 仅检查部署结果时，优先读取简短的部署状态和访问结果；只有失败或状态异常时，才获取必要的错误信息，不反复拉取完整构建日志。
21. 已确认的 Vercel 项目 ID、团队、部署环境、域名和相关配置应复用，不重复查询；仅在上下文缺失、配置可能变化或部署异常时重新核验。
22. 部署成功后仅简要返回访问链接和最终状态，不输出大量构建或部署日志。
23. A方案是唯一正式主方案。B方案已正式弃用，作为历史归档保留，不进行日常开发、维护或部署；未经针对B的明确授权，不修改、覆盖或部署B。双端审核交互原型保留为独立实验环境，复杂新审核能力可先在其中验证；A与独立实验环境继续保持代码目录和部署项目隔离，不交叉发布或覆盖。
24. 未经用户明确确认，不得重新关联、覆盖、删除或迁移任何现有线上项目、域名及部署配置。
25. A方案与独立实验项目的日常工作默认为代码修改、必要检查和本地预览；修改完成不等于部署完成。B是历史归档，不属于日常开发或默认部署目标。
26. 日常修改完成后，仅需报告本次修改结果、本地预览地址和必要的验证说明。不得将 `localhost` 或 `127.0.0.1` 描述为他人可访问的公开地址。
27. 本地预览应优先复用当前项目已有的开发服务器进程和端口；启动前先检查服务是否仍可用，避免重复启动或占用多个端口。只有实际访问验证成功后，才可声明本地预览地址可用。
28. 未收到明确部署指令时，不调用 Vercel 插件、Vercel API、Vercel CLI 或其他线上部署工具，也不为了生成线上链接而擅自发布。
29. 部署范围严格按照用户指令执行：
    - “部署 A”：仅部署交互方案 A。
    - “部署全部”：不包含已弃用B；须先明确本轮A及指定独立实验项目的具体范围，不擅自发布所有实验项目。
    - B归档操作不属于正常发布流程；只有明确针对B的特殊授权才可执行，不因“部署全部”被包含。
    - “部署独立原型”：仅部署用户指定的独立探索项目。
30. 部署前必须核对目标项目目录、本地方案身份和已关联的 Vercel 项目；不得将A方案或指定独立实验项目发布到错误目标，亦不得误触已归档B，不得未经授权创建、覆盖或重新关联其他项目。
31. 部署时优先采用现有的最简发布链路，避免重复调用插件或反复检查日志；先读取简短状态，只有发生错误时才读取必要的构建日志。
32. 每次修改完成后不主动询问是否部署，默认维持本地预览并等待用户主动提出部署要求。
33. **最高优先级：修改不等于部署。只有用户明确要求发布时，才执行 Vercel 或其他线上部署。**

## Design System V1.0（2026-11-03）

34. 任何 UI 修改前，必须先阅读 `design-system/tokens.md`、`design-system/icons.md`、`design-system/component-rules.md` 和 `design-system/figma-variable-mapping.md`。它们与本轮用户确认的最终 Figma 截图构成当前视觉基准；旧 DESIGN.md 及旧主题生成器中的冲突数值不再生效。
35. Token 采用基础色板 → 语义 → 组件三层；Light核心品牌色 #0D7A5D，Light页面背景语义固定 #F5F7F9，但 Gray2 基础值保持 #EEEEEE。普通 Hover 中性灰，进行中保持独立蓝色。运行变量在 `src/design-system/tokens.css`，机器可读快照在 `design-system/tokens.json`；快照尚未同步的新确认规则以本文件和关联规范为准，不得用旧实现覆盖用户已确认规则。
36. 通用 Icon 通过 CliniVolIcon 适配，24×24画板、1.5px描边、16/20/24px使用尺寸。不得对医学影像、View Cube或模型几何进行全局SVG描边/填色覆盖。面性统计Icon和复杂路径圆角的边界以icons.md为准，不伪称已逐点重绘。
37. 正式A项目入口使用项目/订单稳定ID，名称不作主键；保留现有A任务、审核、CAD依赖与本地存储键。不导入实验E*任务或实验存储，不改写真实人员或审计身份。医院演示映射必须有demo来源，不能回填production记录。
38. 默认保持Light。Dark只覆盖2026-11-03用户确认的十级品牌绿及其Brand8/7/9语义映射；文字、背景、边框、灰阶、Error/Warning/Success和阴影沿用TDesign官方Dark。Info独立保存TDesign官方Light/Dark蓝阶，不得引用已改绿的品牌变量。通用Tooltip Light白底、深色文字；专业医学画布和材质不自动反色。
39. 本次集成在独立worktree与`codex/a-dashboard-design-system-v1`分支进行。备份Tag为`backup/a-before-project-dashboard-20261103`，恢复方法见README。修改完成仍不等于部署；须继续遵守15–33条。

40. 2026-11-03已确认三级阴影使用TDesign官方默认值；Light最终Figma、Dark品牌绿、Info双主题蓝色与官方Dark非品牌变量均已定稿，详见tokens.md及figma-variable-mapping.md。未来Figma写入前按这两份映射核对，Shadow使用Effect Styles而非伪造SHADOW变量。最新规则已同步至CSS/JSON运行实现；Figma尚未写入，不得混淆两者状态。

## 已确认的长期 Token 执行规则（2026-11-03）

以下是用户明确确认的项目约定，直接写入本文件作为后续开发依据，不仅依赖聊天上下文。每次修改UI、主题、设计规范或Figma变量前均须读取；不得再次将已确认项列为“待定”，也不得擅自换一套近似颜色。完整逐项映射仍须配合第34条的四份文档读取。若未来用户明确更新，以最新确认同步修订本文件。

### Light / Dark 的边界

- **Light**：以用户提供的最终Figma浅色色板和语义映射图片为准，不使用旧主题生成器色阶覆盖。
- **Light唯一页面背景例外**：`@bg-color-page = #F5F7F9`。只覆盖页面背景语义，不修改基础Gray2的`#EEEEEE`。此例外不适用于Dark。
- **Dark**：仅品牌绿采用下表用户提供的Dark阶梯及语义映射；文字、背景、容器、边框、灰阶、Error红、Warning橙、Success绿、遮罩、滚动条和阴影全部沿用TDesign官方Dark默认定义。不能保留旧的自定义蓝灰表面或自行推导暗色色阶。
- **Info**：官方TDesign品牌蓝在Light / Dark中各保留完整十级色阶，单独作为备用信息语义；不是CliniVol品牌色。必须先独立保存蓝阶，不能将Info引用到已覆盖为绿色的`--td-brand-color-*`上。
- 当前官方值来源固定为项目已安装的`tdesign-react 1.18.4/es/style/index.css`。升级组件库需核对差异，不静默改变已确认视觉。Dark通过官方`:root.dark`或`:root[theme-mode='dark']`机制生效，不能只给页面加黑色背景。

### 品牌绿与备用Info蓝完整阶梯

| 级别 | Brand Light | Brand Dark | Info Light（TD官方蓝） | Info Dark（TD官方蓝） |
|---|---|---|---|---|
| 1 | #E8F5F0 | #0F2D24 | #F2F3FF | #1B2F51 |
| 2 | #C7E9DD | #12372C | #D9E1FF | #173463 |
| 3 | #9BD9C4 | #164235 | #B5C7FF | #143975 |
| 4 | #68C5A5 | #195040 | #8EABFF | #103D88 |
| 5 | #3BAA83 | #1D604B | #618DFF | #0D429A |
| 6 | #218E6D | #227258 | #366EF4 | #054BBE |
| 7 | #0D7A5D | #2C8B6A | #0052D9 | #2667D4 |
| 8 | #086349 | #45A986 | #003CAB | #4582E6 |
| 9 | #064B38 | #6BC3A1 | #002A7C | #699EF5 |
| 10 | #033528 | #9ADABE | #001A57 | #96BBF8 |

| 品牌语义 | Light引用 | Dark引用 |
|---|---|---|
| Normal | Brand7 | Brand8 |
| Hover | Brand6 | Brand7 |
| Active / Click | Brand8 | Brand9 |
| Focus | Brand2 | Brand2 |
| Disabled | Brand3 | Brand3 |
| Light | Brand1 | Brand1 |
| Light Hover | Brand2 | Brand2 |

Dark品牌文字与链接引用Brand8=`#45A986`。Info采用相同官方蓝色语义映射：Light Normal/Hover/Active为Info7/6/8；Dark为Info8/7/9；Focus2、Disabled3、Light1、Light Hover2。不能将“品牌文字色”误当作普通文字色；Header和Sidebar默认Icon继续使用主要文字色。

Light的Error Normal/Hover/Active为Error6/5/7，Warning为Warning5/4/6，Success为Success5/4/6，完整值按最终Figma图片及tokens.md。Dark三类语义色及其全部状态直接采用官方Dark，不把Light原始色阶机械套入Dark。

### 官方默认阴影（已确认，不再待核对）

Light三级参数已与用户提供的完整Shadow图片及当前TDesign原定义核对；Dark使用同版本官方Dark值，不自配偏移、模糊或透明度。Header和普通白色业务卡片不因建立阴影Token而新增投影。

| 模式 / Token | 参数 |
|---|---|
| Light shadow-1 | `0 1px 10px rgba(0,0,0,.05), 0 4px 5px rgba(0,0,0,.08), 0 2px 4px -1px rgba(0,0,0,.12)` |
| Light shadow-2 | `0 3px 14px 2px rgba(0,0,0,.05), 0 8px 10px 1px rgba(0,0,0,.06), 0 5px 5px -3px rgba(0,0,0,.1)` |
| Light shadow-3 | `0 6px 30px 5px rgba(0,0,0,.05), 0 16px 24px 2px rgba(0,0,0,.04), 0 8px 10px -5px rgba(0,0,0,.08)` |
| Dark shadow-1 | `0 4px 6px rgba(0,0,0,.06), 0 1px 10px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.12)` |
| Dark shadow-2 | `0 8px 10px rgba(0,0,0,.12), 0 3px 14px rgba(0,0,0,.1), 0 5px 5px rgba(0,0,0,.16)` |
| Dark shadow-3 | `0 16px 24px rgba(0,0,0,.14), 0 6px 30px rgba(0,0,0,.12), 0 8px 10px rgba(0,0,0,.2)` |

shadow-1用于基础投影及指定轻量交互，shadow-2用于Dropdown/Popover/选择器，shadow-3用于重要提示或弹窗；按既有组件场景使用，不到处增加阴影。

### 其余已确认基准与专业显示例外

- 字体PingFang SC；普通业务文字14px/22px Regular（400），卡片标题16px/24px Medium（500），页面标题24px/32px Medium（500）。正式字体Token覆盖Link/Mark/Body/Title/Headline/Display，行高=字号+8px；不缩小正文制造层级，不改根字号或全局zoom。
- 其他组件的既定圆角体系：small3px、default4px、medium8px、large12px、extra-large16px、circle50%，按实际组件类型选用。Card单独遵循第4条的官方默认6px，不以该通用medium8px覆盖。Icon路径内部1px微圆角独立管理。
- Icon标准画板24×24、线性描边1.5px、运行16/20/24px；默认主要文字色，普通Hover中性灰，Selected/持续Active品牌色，Disabled使用官方禁用语义。保留线性/面性及复杂路径的已记录边界，不伪称所有路径已逐点重绘。
- 状态语义不混用：未开始灰、进行中Info蓝、待审核橙、审核退回红、已完成成功绿。设计阶段Cyan/Purple/Yellow/Pink是专业身份色，不替代任务状态。
- 医学二维影像黑底、医学3D视图白底、CAD已确认白/深灰视窗、定位线、方向色及模型几何材质保持原规则，不受平台主题强制反色。

### 未来Figma写入规则

用户以后明确指定Figma文件并要求写入时，以本文件和`design-system/figma-variable-mapping.md`为依据执行。原始色板 → Light/Dark语义变量 → 组件绑定；品牌绿与Info蓝使用独立原始色，保留完整别名链。先检查既有集合、变量、模式和样式，复用更新，不重复建立另一套规范或覆盖无关内容。

颜色用COLOR变量、尺寸/字号/行高等按对应FLOAT映射；多层阴影采用Figma Effect Styles（Light/Dark各三级），不能把CSS阴影字符串冒充COLOR或不存在的SHADOW变量。未经本轮明确授权不操作Figma、不部署；必须区分“规范已确认”“文档已记录”“代码已落地”“Figma已写入”，只报告实际完成的状态。

41. Card使用独立组件Token `--cv-card-radius: 6px`，不全局修改medium8px；深色统计卡片的品牌/Info/Warning/Success图标必须引用对应主题语义，紫色审核退回统计图标使用可读的Dark紫色配对。设计阶段四枚图标使用同一24px画板、1.5px线性笔画、20px显示尺寸，不堆叠多个微小符号；保留Cyan/Purple/Yellow/Pink身份色和完整Tooltip。
