# CliniVol Design System V1.0 — Tokens

版本：2026-11-03。唯一 Light 色彩权威为本轮用户提供的两张最终 Figma 色板与语义映射截图。原主题生成器的颜色不作为新依据。机器可读清单：`tokens.json`；运行样式：`../src/design-system/tokens.css`。

## 基础色板（不可随主题改变）

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

## Dark（保留A已实现的主题，不宣称为最终Figma深色色板）

未提供最终Dark色板。下表明确是既有A表面与可读性适配，待未来Dark规范核对；基础色板不变。文字白色Alpha按提供的文字规范90/55/35/22%。

| 语义 | Dark值/引用 |
|---|---|
| bg-color-page | `#101518` |
| bg-color-container | `#1A2024` |
| bg-color-secondarycontainer | `#22292E` |
| bg-color-component | `#252D32` |
| bg-color-component-hover | `#30393F` |
| bg-color-component-active | `#34423D` |
| bg-color-container-hover | `#252D32` |
| bg-color-container-active | `#2B353A` |
| bg-color-component-disabled | `#20262A` |
| component-stroke | `#343D42` |
| component-border | `#48545B` |
| text-color-primary | `rgba(255,255,255,.90)` |
| text-color-secondary | `rgba(255,255,255,.55)` |
| text-color-placeholder | `rgba(255,255,255,.35)` |
| text-color-disabled | `rgba(255,255,255,.22)` |
| text-color-anti | `rgba(0,0,0,.90)` |
| brand-color-light | `#18352D` |
| brand-color-focus | `#1D4639` |
| text-color-brand | `{brand.4}` |
| text-color-link | `{brand.4}` |
| error-color | `{error.4}` |
| error-color-light | `#472622` |
| warning-color | `{warning.4}` |
| warning-color-light | `#443719` |
| success-color | `{success.4}` |
| success-color-light | `#17392D` |

### 当前确认但不在本次最终Figma表中的值

- Info蓝色：沿用A进行中状态`#0052D9`，浅底`#E8F3FF`；Dark前景`#8BB7FF`、浅底`#183651`。这是状态兼容，不是新增Figma色阶。
- 四设计阶段沿用此前确认Cyan/Purple/Yellow/Pink：浅色前景/背景`#004E6D/#E8F5FF`、`#5610A4/#FBF0FF`、`#654900/#FFF5E4`、`#800A5F/#FFF0F6`。Dark配对保留现有实现。
- 五卡审核退回图标仍保留A紫色`#6F49A8/#F2EDFA`；真正退回状态/通知仍为Error红色。两种语义不可混用。
- 医学四视图方向色、CT灰阶、STL材质及CAD视窗白/深灰背景不由平台调色板反色。

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
| radius-medium | 8px | 卡片/Popup/Tooltip |
| radius-large | 12px | Dialog |
| radius-extra-large | 16px | 扩展展示组件 |
| radius-circle | 50% | 圆形控件/头像 |

图标图形内部1px微圆角与以上组件圆角完全独立。不使用CSS border-radius冒充SVG路径圆角。

## 阴影

截图裁掉了数值尾部，因此数值采用用户允许的**已安装tdesign-react 1.18.4/es/style/index.css**原定义，不宣称完整转录截图。截图用途层级可确认；若后续提供不同的完整Figma数值再核对。阴影不加到全局Header和普通白色业务卡片。

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

24px图标作者画板，1.5px描边，运行尺寸16/20/24。空间4/8/12/16/24；平台左右安全边距24。GlobalHeader=56px、单排专业工具栏=58px。卡片8px；面板伸缩不触发工程保存。

## 待核对

1. 最终Figma Dark全量色板与映射尚未提供；现有深色表面不是推测的Figma值。
2. 截图阴影数值尾部不能精确转录，已采用可核验TDesign原定义。
3. Info完整色阶与扩展四色完整色阶不在本轮最终截图，保留已有确认值。
4. Icon原作者非矩形曲线不统一改写为数学意义的1px圆角；通过同一24画板/1.5描边/round端点连接与矩形rx1统一，详见icons.md。
