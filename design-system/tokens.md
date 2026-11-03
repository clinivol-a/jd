# CliniVol Design System V1.0 — Tokens

版本：2026-11-03。唯一 Light 色彩权威为本轮用户提供的两张最终 Figma 色板与语义映射截图。原主题生成器的颜色不作为新依据。机器可读/运行快照：`tokens.json`与`../src/design-system/tokens.css`；Dark/Info映射已同步运行实现，详见下文。

## Light基础色板（原始值保持不变）

| 色板 | 级别 | 基础值 |
|---|---|---|
| Brand | 1 | `#E8F5F0` |
| Brand | 2 | `#C7E9DD` |
| Brand | 3 | `#9BD9C4` |
| Brand | 4 | `#68C5A5` |
| Brand | 5 | `#3BAA83` |
| Brand | 6 | `#218E6D` |
| Brand | 7 | `#0D7A5D` |
| Brand | 8 | `#086349` |
| Brand | 9 | `#064B38` |
| Brand | 10 | `#033528` |
| Error | 1 | `#FFF0ED` |
| Error | 2 | `#FFD8D2` |
| Error | 3 | `#FFB9B0` |
| Error | 4 | `#FF9285` |
| Error | 5 | `#F6685D` |
| Error | 6 | `#D54941` |
| Error | 7 | `#AD352F` |
| Error | 8 | `#881F1C` |
| Error | 9 | `#68070A` |
| Error | 10 | `#490002` |
| Warning | 1 | `#FFF1E9` |
| Warning | 2 | `#FFD9C2` |
| Warning | 3 | `#FFB98C` |
| Warning | 4 | `#FA9550` |
| Warning | 5 | `#E37318` |
| Warning | 6 | `#BE5A00` |
| Warning | 7 | `#954500` |
| Warning | 8 | `#713300` |
| Warning | 9 | `#532300` |
| Warning | 10 | `#3B1700` |
| Success | 1 | `#E3F9E9` |
| Success | 2 | `#C6F3D7` |
| Success | 3 | `#92DAB2` |
| Success | 4 | `#56C08D` |
| Success | 5 | `#2BA471` |
| Success | 6 | `#008858` |
| Success | 7 | `#006C45` |
| Success | 8 | `#005334` |
| Success | 9 | `#003B23` |
| Success | 10 | `#002515` |
| Gray | 1 | `#F3F3F3` |
| Gray | 2 | `#EEEEEE` |
| Gray | 3 | `#E7E7E7` |
| Gray | 4 | `#DCDCDC` |
| Gray | 5 | `#C5C5C5` |
| Gray | 6 | `#A6A6A6` |
| Gray | 7 | `#8B8B8B` |
| Gray | 8 | `#777777` |
| Gray | 9 | `#5E5E5E` |
| Gray | 10 | `#4B4B4B` |
| Gray | 11 | `#383838` |
| Gray | 12 | `#2C2C2C` |
| Gray | 13 | `#242424` |
| Gray | 14 | `#181818` |
| White | 1 | `#FFFFFF` |

## Light 语义映射

页面背景是唯一明确例外：#F5F7F9，不改变Gray2=#EEEEEE。Brand Normal明确映射Brand7，Error Normal映射Error6，Warning/Success Normal映射第5级，绝不由编号猜测。

| 语义 | 引用/值 | CSS/TDesign |
|---|---|---|
| @bg-color-page | `#F5F7F9` | `--cv-bg-color-page` → `--td-bg-color-page` |
| @bg-color-container | `{white.1}` | `--cv-bg-color-container` → `--td-bg-color-container` |
| @bg-color-secondarycontainer | `{gray.1}` | `--cv-bg-color-secondarycontainer` → `--td-bg-color-secondarycontainer` |
| @bg-color-component | `{gray.3}` | `--cv-bg-color-component` → `--td-bg-color-component` |
| @component-stroke | `{gray.3}` | `--cv-component-stroke` → `--td-component-stroke` |
| @component-border | `{gray.4}` | `--cv-component-border` → `--td-component-border` |
| @bg-color-container-hover | `{gray.1}` | `--cv-bg-color-container-hover` → `--td-bg-color-container-hover` |
| @bg-color-container-active | `{gray.3}` | `--cv-bg-color-container-active` → `--td-bg-color-container-active` |
| @bg-color-component-hover | `{gray.4}` | `--cv-bg-color-component-hover` → `--td-bg-color-component-hover` |
| @bg-color-component-active | `{gray.6}` | `--cv-bg-color-component-active` → `--td-bg-color-component-active` |
| @bg-color-component-disabled | `{gray.2}` | `--cv-bg-color-component-disabled` → `--td-bg-color-component-disabled` |
| @text-color-primary | `rgba(0,0,0,0.90)` | `--cv-text-color-primary` → `--td-text-color-primary` |
| @text-color-secondary | `rgba(0,0,0,0.60)` | `--cv-text-color-secondary` → `--td-text-color-secondary` |
| @text-color-placeholder | `rgba(0,0,0,0.40)` | `--cv-text-color-placeholder` → `--td-text-color-placeholder` |
| @text-color-disabled | `rgba(0,0,0,0.26)` | `--cv-text-color-disabled` → `--td-text-color-disabled` |
| @text-color-anti | `rgba(255,255,255,0.90)` | `--cv-text-color-anti` → `--td-text-color-anti` |
| @text-color-brand | `{brand.7}` | `--cv-text-color-brand` → `--td-text-color-brand` |
| @text-color-link | `{brand.7}` | `--cv-text-color-link` → `--td-text-color-link` |
| @brand-color | `{brand.7}` | `--cv-brand-color` → `--td-brand-color` |
| @brand-color-hover | `{brand.6}` | `--cv-brand-color-hover` → `--td-brand-color-hover` |
| @brand-color-active | `{brand.8}` | `--cv-brand-color-active` → `--td-brand-color-active` |
| @brand-color-disabled | `{brand.3}` | `--cv-brand-color-disabled` → `--td-brand-color-disabled` |
| @brand-color-focus | `{brand.2}` | `--cv-brand-color-focus` → `--td-brand-color-focus` |
| @brand-color-light | `{brand.1}` | `--cv-brand-color-light` → `--td-brand-color-light` |
| @error-color | `{error.6}` | `--cv-error-color` → `--td-error-color` |
| @error-color-hover | `{error.5}` | `--cv-error-color-hover` → `--td-error-color-hover` |
| @error-color-active | `{error.7}` | `--cv-error-color-active` → `--td-error-color-active` |
| @error-color-disabled | `{error.3}` | `--cv-error-color-disabled` → `--td-error-color-disabled` |
| @error-color-focus | `{error.2}` | `--cv-error-color-focus` → `--td-error-color-focus` |
| @error-color-light | `{error.1}` | `--cv-error-color-light` → `--td-error-color-light` |
| @warning-color | `{warning.5}` | `--cv-warning-color` → `--td-warning-color` |
| @warning-color-hover | `{warning.4}` | `--cv-warning-color-hover` → `--td-warning-color-hover` |
| @warning-color-active | `{warning.6}` | `--cv-warning-color-active` → `--td-warning-color-active` |
| @warning-color-disabled | `{warning.3}` | `--cv-warning-color-disabled` → `--td-warning-color-disabled` |
| @warning-color-focus | `{warning.2}` | `--cv-warning-color-focus` → `--td-warning-color-focus` |
| @warning-color-light | `{warning.1}` | `--cv-warning-color-light` → `--td-warning-color-light` |
| @success-color | `{success.5}` | `--cv-success-color` → `--td-success-color` |
| @success-color-hover | `{success.4}` | `--cv-success-color-hover` → `--td-success-color-hover` |
| @success-color-active | `{success.6}` | `--cv-success-color-active` → `--td-success-color-active` |
| @success-color-disabled | `{success.3}` | `--cv-success-color-disabled` → `--td-success-color-disabled` |
| @success-color-focus | `{success.2}` | `--cv-success-color-focus` → `--td-success-color-focus` |
| @success-color-light | `{success.1}` | `--cv-success-color-light` → `--td-success-color-light` |

`component-stroke`另映射`--td-border-level-1-color`；`component-border`映射`--td-border-level-2-color`及`--td-component-border`。`text-color-brand/link`由可读文本语义消费；品牌按钮以brand-color消费。进行中仍是独立Info蓝色，绝不跟随品牌绿。

## 2026-11-03 最终主题确认（覆盖此前临时映射）

本节及Figma映射表是本次最新确认的规范。浅色沿用最终Figma色板；**只有Light页面背景语义为#F5F7F9**，Gray2仍为#EEEEEE。深色只替换品牌绿色十级色阶，文字、背景、边框、灰阶、Error/Warning/Success、遮罩、滚动条与阴影全部保留TDesign官方Dark定义。不得继续沿用旧A蓝灰色表面或自行推导深色语义色。

来源：用户2026-11-03提供的Dark品牌CSS、最终确认文字和完整Shadow截图；官方默认值取自`tdesign-react 1.18.4 / node_modules/tdesign-react/es/style/index.css`。最新Dark/Info确认已同步至`tokens.json`与`src/design-system/tokens.css`，规范与运行源一致；Figma尚未写入。

### 品牌绿与独立Info蓝

Info是独立备用信息语义，使用TDesign未被品牌绿覆盖之前的官方品牌蓝。蓝色必须单独保存十级原始值，不能把`info-color`别名指向已经改绿的`--td-brand-color`。品牌文字、链接、选中态使用品牌语义；进行中/信息状态使用Info；错误红、警告橙、成功绿各自独立。Info作为备用色，不意味着本轮新增组件或重新给所有页面着色。

| 级别 | 品牌绿 Dark | Info 蓝 Light | Info 蓝 Dark |
|---|---|---|---|
| 1 | `#0F2D24` | `#F2F3FF` | `#1B2F51` |
| 2 | `#12372C` | `#D9E1FF` | `#173463` |
| 3 | `#164235` | `#B5C7FF` | `#143975` |
| 4 | `#195040` | `#8EABFF` | `#103D88` |
| 5 | `#1D604B` | `#618DFF` | `#0D429A` |
| 6 | `#227258` | `#366EF4` | `#054BBE` |
| 7 | `#2C8B6A` | `#0052D9` | `#2667D4` |
| 8 | `#45A986` | `#003CAB` | `#4582E6` |
| 9 | `#6BC3A1` | `#002A7C` | `#699EF5` |
| 10 | `#9ADABE` | `#001A57` | `#96BBF8` |

| 状态/用途 | Brand Light | Brand Dark | Info Light | Info Dark |
|---|---|---|---|---|
| Normal | Brand7 | Brand8 | Info7 | Info8 |
| Hover | Brand6 | Brand7 | Info6 | Info7 |
| Active | Brand8 | Brand9 | Info8 | Info9 |
| Focus | Brand2 | Brand2 | Info2 | Info2 |
| Disabled | Brand3 | Brand3 | Info3 | Info3 |
| Light | Brand1 | Brand1 | Info1 | Info1 |
| Light Hover | Brand2 | Brand2 | Info2 | Info2 |

Dark的品牌文字、链接均引用Brand8=#45A986。官方Dark的非品牌语义引用链原样保留，品牌阶梯更换后自动跟随。当前代码仍使用data-theme区分医学视窗；后续运行落地应同时设置TDesign的theme-mode，使官方深色样式真正生效，避免自定义反色或循环变量别名。

### Dark官方非品牌值（完整来源快照）

以下Token读取官方Dark块，保持原值/原别名。升级TDesign时应复核差异，不静默改动已确认视觉。原始TDesign蓝色仅作为Info副本保存，品牌绿是唯一的品牌覆盖。

| TDesign Token | 官方Dark定义 |
|---|---|
| `--td-warning-color-1` | `#4f2a1d` |
| `--td-warning-color-2` | `#582f21` |
| `--td-warning-color-3` | `#733c23` |
| `--td-warning-color-4` | `#a75d2b` |
| `--td-warning-color-5` | `#cf6e2d` |
| `--td-warning-color-6` | `#dc7633` |
| `--td-warning-color-7` | `#e8935c` |
| `--td-warning-color-8` | `#ecbf91` |
| `--td-warning-color-9` | `#eed7bf` |
| `--td-warning-color-10` | `#f3e9dc` |
| `--td-error-color-1` | `#472324` |
| `--td-error-color-2` | `#5e2a2d` |
| `--td-error-color-3` | `#703439` |
| `--td-error-color-4` | `#83383e` |
| `--td-error-color-5` | `#a03f46` |
| `--td-error-color-6` | `#c64751` |
| `--td-error-color-7` | `#de6670` |
| `--td-error-color-8` | `#ec888e` |
| `--td-error-color-9` | `#edb1b6` |
| `--td-error-color-10` | `#eeced0` |
| `--td-success-color-1` | `#193a2a` |
| `--td-success-color-2` | `#1a4230` |
| `--td-success-color-3` | `#17533d` |
| `--td-success-color-4` | `#0d7a55` |
| `--td-success-color-5` | `#059465` |
| `--td-success-color-6` | `#43af8a` |
| `--td-success-color-7` | `#46bf96` |
| `--td-success-color-8` | `#80d2b6` |
| `--td-success-color-9` | `#b4e1d3` |
| `--td-success-color-10` | `#deede8` |
| `--td-gray-color-1` | `#f3f3f3` |
| `--td-gray-color-2` | `#eee` |
| `--td-gray-color-3` | `#e8e8e8` |
| `--td-gray-color-4` | `#ddd` |
| `--td-gray-color-5` | `#c6c6c6` |
| `--td-gray-color-6` | `#a6a6a6` |
| `--td-gray-color-7` | `#8b8b8b` |
| `--td-gray-color-8` | `#777` |
| `--td-gray-color-9` | `#5e5e5e` |
| `--td-gray-color-10` | `#4b4b4b` |
| `--td-gray-color-11` | `#393939` |
| `--td-gray-color-12` | `#2c2c2c` |
| `--td-gray-color-13` | `#242424` |
| `--td-gray-color-14` | `#181818` |
| `--td-font-white-1` | `rgba(255, 255, 255, 0.9)` |
| `--td-font-white-2` | `rgba(255, 255, 255, 0.55)` |
| `--td-font-white-3` | `rgba(255, 255, 255, 0.35)` |
| `--td-font-white-4` | `rgba(255, 255, 255, 0.22)` |
| `--td-font-gray-1` | `rgba(0, 0, 0, 0.9)` |
| `--td-font-gray-2` | `rgba(0, 0, 0, 0.6)` |
| `--td-font-gray-3` | `rgba(0, 0, 0, 0.4)` |
| `--td-font-gray-4` | `rgba(0, 0, 0, 0.26)` |
| `--td-warning-color` | `var(--td-warning-color-5)` |
| `--td-error-color` | `var(--td-error-color-6)` |
| `--td-success-color` | `var(--td-success-color-5)` |
| `--td-warning-color-hover` | `var(--td-warning-color-4)` |
| `--td-warning-color-focus` | `var(--td-warning-color-2)` |
| `--td-warning-color-active` | `var(--td-warning-color-6)` |
| `--td-warning-color-disabled` | `var(--td-warning-color-3)` |
| `--td-warning-color-light` | `var(--td-warning-color-1)` |
| `--td-warning-color-light-hover` | `var(--td-warning-color-2)` |
| `--td-error-color-hover` | `var(--td-error-color-5)` |
| `--td-error-color-focus` | `var(--td-error-color-2)` |
| `--td-error-color-active` | `var(--td-error-color-7)` |
| `--td-error-color-disabled` | `var(--td-error-color-3)` |
| `--td-error-color-light` | `var(--td-error-color-1)` |
| `--td-error-color-light-hover` | `var(--td-error-color-2)` |
| `--td-success-color-hover` | `var(--td-success-color-4)` |
| `--td-success-color-focus` | `var(--td-success-color-2)` |
| `--td-success-color-active` | `var(--td-success-color-6)` |
| `--td-success-color-disabled` | `var(--td-success-color-3)` |
| `--td-success-color-light` | `var(--td-success-color-1)` |
| `--td-success-color-light-hover` | `var(--td-success-color-2)` |
| `--td-mask-active` | `rgba(0, 0, 0, 0.4)` |
| `--td-mask-disabled` | `rgba(0, 0, 0, 0.6)` |
| `--td-mask-background` | `rgba(36, 36, 36, 0.96)` |
| `--td-mask-gradient` | `rgba(36, 36, 36, 0)` |
| `--td-bg-color-page` | `var(--td-gray-color-14)` |
| `--td-bg-color-container` | `var(--td-gray-color-13)` |
| `--td-bg-color-container-hover` | `var(--td-gray-color-12)` |
| `--td-bg-color-container-active` | `var(--td-gray-color-10)` |
| `--td-bg-color-container-select` | `var(--td-gray-color-9)` |
| `--td-bg-color-secondarycontainer` | `var(--td-gray-color-12)` |
| `--td-bg-color-secondarycontainer-hover` | `var(--td-gray-color-11)` |
| `--td-bg-color-secondarycontainer-active` | `var(--td-gray-color-9)` |
| `--td-bg-color-component` | `var(--td-gray-color-11)` |
| `--td-bg-color-component-hover` | `var(--td-gray-color-10)` |
| `--td-bg-color-component-active` | `var(--td-gray-color-9)` |
| `--td-bg-color-secondarycomponent` | `var(--td-gray-color-10)` |
| `--td-bg-color-secondarycomponent-hover` | `var(--td-gray-color-9)` |
| `--td-bg-color-secondarycomponent-active` | `var(--td-gray-color-8)` |
| `--td-bg-color-component-disabled` | `var(--td-gray-color-12)` |
| `--td-bg-color-specialcomponent` | `transparent` |
| `--td-text-color-primary` | `var(--td-font-white-1)` |
| `--td-text-color-secondary` | `var(--td-font-white-2)` |
| `--td-text-color-placeholder` | `var(--td-font-white-3)` |
| `--td-text-color-disabled` | `var(--td-font-white-4)` |
| `--td-text-color-anti` | `#fff` |
| `--td-text-color-brand` | `var(--td-brand-color-8)` |
| `--td-text-color-link` | `var(--td-brand-color-8)` |
| `--td-text-color-watermark` | `rgba(255, 255, 255, 0.1)` |
| `--td-border-level-1-color` | `var(--td-gray-color-11)` |
| `--td-component-stroke` | `var(--td-gray-color-11)` |
| `--td-border-level-2-color` | `var(--td-gray-color-9)` |
| `--td-component-border` | `var(--td-gray-color-9)` |
| `--td-table-shadow-color` | `rgba(0, 0, 0, 0.55)` |
| `--td-scrollbar-color` | `rgba(255, 255, 255, 0.1)` |
| `--td-scrollbar-hover-color` | `rgba(255, 255, 255, 0.3)` |
| `--td-scroll-track-color` | `#333` |

### 已确认的专业显示例外

医学二维影像、三维医学视图、CAD视窗白/深灰背景、方向识别色和模型材质继续按已有专业规则显示，不因平台Dark背景恢复官方值而强制反色。Cyan/Purple/Yellow/Pink设计阶段色保持既有身份语义，不与任务状态混用。

## 字体与行高

PingFang SC优先，Windows使用微软雅黑回退。Regular=400，页面/模块标题Medium=500。截图为固定行高模式，**line-height = font-size + 8px**，常规业务文字14/22，不通过缩小Label制造层级。

| Token | 字号 | 行高 | 使用 |
|---|---|---|---|
| link-small | 12px | 20px | 特殊小型标注，不代替业务正文 |
| link-medium | 14px | 22px | 按语义角色使用 |
| link-large | 16px | 24px | 按语义角色使用 |
| mark-small | 12px | 20px | 特殊小型标注，不代替业务正文 |
| mark-medium | 14px | 22px | 按语义角色使用 |
| body-small | 12px | 20px | 特殊小型标注，不代替业务正文 |
| body-medium | 14px | 22px | 按语义角色使用 |
| body-large | 16px | 24px | 按语义角色使用 |
| title-small | 14px | 22px | 按语义角色使用 |
| title-medium | 16px | 24px | 按语义角色使用 |
| title-large | 20px | 28px | 按语义角色使用 |
| headline-small | 24px | 32px | 按语义角色使用 |
| headline-medium | 28px | 36px | 按语义角色使用 |
| headline-large | 36px | 44px | 按语义角色使用 |
| display-medium | 48px | 56px | 按语义角色使用 |
| display-large | 64px | 72px | 按语义角色使用 |

TDesign `title-extraLarge`历史别名映射当前title-large=20/28，不引入18px新层级。表格/Label/Value/辅助说明/普通链接/专业工具文字用body-medium=14/22；卡片标题16/24；页面标题24/32。五统计数字沿用28/36、400。字体不更改根rem，不使用zoom/scale压缩DOM。

## 圆角

| Token | 值 | 用途 |
|---|---|---|
| radius-small | 3px | 基础组件内部 |
| radius-default | 4px | 按钮/输入等基础控件 |
| radius-medium | 8px | 按既有组件场景用于Popup/Tooltip等；不作为Card强制值 |
| radius-large | 12px | Dialog |
| radius-extra-large | 16px | 扩展展示组件 |
| radius-circle | 50% | 圆形控件/头像 |

图标图形内部1px微圆角与以上组件圆角完全独立。不使用CSS border-radius冒充SVG路径圆角。

## 阴影

用户已确认阴影统一使用**TDesign官方默认值**。本次完整Shadow截图的三个Light层级与已安装tdesign-react 1.18.4/es/style/index.css逐项一致；Dark也直接使用同文件官方Dark值。此前“截图尾部待核对”的状态已解除。阴影不加到全局Header和普通白色业务卡片。

| 层级 | Light实际值 | 场景 |
|---|---|---|
| shadow-1 | `0 1px 10px rgba(0,0,0,.05), 0 4px 5px rgba(0,0,0,.08), 0 2px 4px -1px rgba(0,0,0,.12)` | 轻量浮层/特定交互 |
| shadow-2 | `0 3px 14px 2px rgba(0,0,0,.05), 0 8px 10px 1px rgba(0,0,0,.06), 0 5px 5px -3px rgba(0,0,0,.1)` | Dropdown、Popover、选择器 |
| shadow-3 | `0 6px 30px 5px rgba(0,0,0,.05), 0 16px 24px 2px rgba(0,0,0,.04), 0 8px 10px -5px rgba(0,0,0,.08)` | Dialog、重要提示 |

Dark使用同一TDesign文件既有Dark值：
- shadow-1: `0 4px 6px rgba(0,0,0,.06), 0 1px 10px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.12)`
- shadow-2: `0 8px 10px rgba(0,0,0,.12), 0 3px 14px rgba(0,0,0,.1), 0 5px 5px rgba(0,0,0,.16)`
- shadow-3: `0 16px 24px rgba(0,0,0,.14), 0 6px 30px rgba(0,0,0,.12), 0 8px 10px rgba(0,0,0,.2)`

## 尺寸与兼容

24px图标作者画板，1.5px描边，运行尺寸16/20/24。空间4/8/12/16/24；平台左右安全边距24。GlobalHeader=56px、单排专业工具栏=58px。首页大卡片及平台通用Card使用官方默认6px；面板伸缩不触发工程保存。

## 确认状态与实施边界

- Light最终Figma色板、Light页面背景例外、Dark品牌绿、Dark其他官方默认值、Info双主题完整蓝色和三级官方阴影均已确认，不再标记为待定。
- 字体、字号+8px行高、圆角、Icon标准继续沿用原规范，不因本次主题确认而改变。
- Icon复杂路径逐点1px圆角属于矢量实现边界，不是主题Token缺失；不以SVG容器圆角伪装路径已调整。
- 最新确认已同步至CSS、JSON与页面；未来Figma写入仍以figma-variable-mapping.md为依据，尚未修改Figma。

## Card官方圆角核验（优先于旧“卡片一律8px”规则）

依赖版本：tdesign-react 1.18.4。实际编译样式`node_modules/tdesign-react/es/card/style/index.css`第9行：`.t-card`的`border-radius: var(--td-radius-medium)`；官方`es/style/index.css`第330行定义`--td-radius-medium: 6px`，因此无覆盖时Card最终默认圆角为**6px**。未发现独立的官方Card圆角变量；不要臆造Card专属TDesign Token。

项目上次集成的运行CSS把同名medium映射为8px，属于项目覆盖，不是官方Card默认值。本轮已将Card运行规则改为独立--cv-card-radius=6px，避免改变其他medium组件。后续落实Card规范时需区分Card的6px组件规则与其他组件既定3/4/8/12/16px、50%体系，不全局把medium改成6px。Icon内部1px微圆角不受影响。
