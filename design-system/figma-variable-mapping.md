# Figma Variable Mapping — CliniVol V1.0

本轮记录已确认的未来Figma写入规范，不修改Figma文件。Light以最终Figma截图为准；Dark只覆盖用户指定品牌绿，其余使用TDesign 1.18.4官方Dark；Info独立保存官方品牌蓝。Color→语义→组件三层引用。下表中新增变量是规划映射，不表示当前CSS/JSON或Figma已同步。

| Variable名称 | 集合 | 模式 | 类型 | 基础值或别名 | 引用基础色 | 使用场景 | CSS/Token |
|---|---|---|---|---|---|---|---|
| palette/brand/1 | CliniVol Palette | Shared | COLOR | `#E8F5F0` | — | 基础色板 | `--cv-palette-brand-1` |
| palette/brand/2 | CliniVol Palette | Shared | COLOR | `#C7E9DD` | — | 基础色板 | `--cv-palette-brand-2` |
| palette/brand/3 | CliniVol Palette | Shared | COLOR | `#9BD9C4` | — | 基础色板 | `--cv-palette-brand-3` |
| palette/brand/4 | CliniVol Palette | Shared | COLOR | `#68C5A5` | — | 基础色板 | `--cv-palette-brand-4` |
| palette/brand/5 | CliniVol Palette | Shared | COLOR | `#3BAA83` | — | 基础色板 | `--cv-palette-brand-5` |
| palette/brand/6 | CliniVol Palette | Shared | COLOR | `#218E6D` | — | 基础色板 | `--cv-palette-brand-6` |
| palette/brand/7 | CliniVol Palette | Shared | COLOR | `#0D7A5D` | — | 基础色板 | `--cv-palette-brand-7` |
| palette/brand/8 | CliniVol Palette | Shared | COLOR | `#086349` | — | 基础色板 | `--cv-palette-brand-8` |
| palette/brand/9 | CliniVol Palette | Shared | COLOR | `#064B38` | — | 基础色板 | `--cv-palette-brand-9` |
| palette/brand/10 | CliniVol Palette | Shared | COLOR | `#033528` | — | 基础色板 | `--cv-palette-brand-10` |
| palette/error/1 | CliniVol Palette | Shared | COLOR | `#FFF0ED` | — | 基础色板 | `--cv-palette-error-1` |
| palette/error/2 | CliniVol Palette | Shared | COLOR | `#FFD8D2` | — | 基础色板 | `--cv-palette-error-2` |
| palette/error/3 | CliniVol Palette | Shared | COLOR | `#FFB9B0` | — | 基础色板 | `--cv-palette-error-3` |
| palette/error/4 | CliniVol Palette | Shared | COLOR | `#FF9285` | — | 基础色板 | `--cv-palette-error-4` |
| palette/error/5 | CliniVol Palette | Shared | COLOR | `#F6685D` | — | 基础色板 | `--cv-palette-error-5` |
| palette/error/6 | CliniVol Palette | Shared | COLOR | `#D54941` | — | 基础色板 | `--cv-palette-error-6` |
| palette/error/7 | CliniVol Palette | Shared | COLOR | `#AD352F` | — | 基础色板 | `--cv-palette-error-7` |
| palette/error/8 | CliniVol Palette | Shared | COLOR | `#881F1C` | — | 基础色板 | `--cv-palette-error-8` |
| palette/error/9 | CliniVol Palette | Shared | COLOR | `#68070A` | — | 基础色板 | `--cv-palette-error-9` |
| palette/error/10 | CliniVol Palette | Shared | COLOR | `#490002` | — | 基础色板 | `--cv-palette-error-10` |
| palette/warning/1 | CliniVol Palette | Shared | COLOR | `#FFF1E9` | — | 基础色板 | `--cv-palette-warning-1` |
| palette/warning/2 | CliniVol Palette | Shared | COLOR | `#FFD9C2` | — | 基础色板 | `--cv-palette-warning-2` |
| palette/warning/3 | CliniVol Palette | Shared | COLOR | `#FFB98C` | — | 基础色板 | `--cv-palette-warning-3` |
| palette/warning/4 | CliniVol Palette | Shared | COLOR | `#FA9550` | — | 基础色板 | `--cv-palette-warning-4` |
| palette/warning/5 | CliniVol Palette | Shared | COLOR | `#E37318` | — | 基础色板 | `--cv-palette-warning-5` |
| palette/warning/6 | CliniVol Palette | Shared | COLOR | `#BE5A00` | — | 基础色板 | `--cv-palette-warning-6` |
| palette/warning/7 | CliniVol Palette | Shared | COLOR | `#954500` | — | 基础色板 | `--cv-palette-warning-7` |
| palette/warning/8 | CliniVol Palette | Shared | COLOR | `#713300` | — | 基础色板 | `--cv-palette-warning-8` |
| palette/warning/9 | CliniVol Palette | Shared | COLOR | `#532300` | — | 基础色板 | `--cv-palette-warning-9` |
| palette/warning/10 | CliniVol Palette | Shared | COLOR | `#3B1700` | — | 基础色板 | `--cv-palette-warning-10` |
| palette/success/1 | CliniVol Palette | Shared | COLOR | `#E3F9E9` | — | 基础色板 | `--cv-palette-success-1` |
| palette/success/2 | CliniVol Palette | Shared | COLOR | `#C6F3D7` | — | 基础色板 | `--cv-palette-success-2` |
| palette/success/3 | CliniVol Palette | Shared | COLOR | `#92DAB2` | — | 基础色板 | `--cv-palette-success-3` |
| palette/success/4 | CliniVol Palette | Shared | COLOR | `#56C08D` | — | 基础色板 | `--cv-palette-success-4` |
| palette/success/5 | CliniVol Palette | Shared | COLOR | `#2BA471` | — | 基础色板 | `--cv-palette-success-5` |
| palette/success/6 | CliniVol Palette | Shared | COLOR | `#008858` | — | 基础色板 | `--cv-palette-success-6` |
| palette/success/7 | CliniVol Palette | Shared | COLOR | `#006C45` | — | 基础色板 | `--cv-palette-success-7` |
| palette/success/8 | CliniVol Palette | Shared | COLOR | `#005334` | — | 基础色板 | `--cv-palette-success-8` |
| palette/success/9 | CliniVol Palette | Shared | COLOR | `#003B23` | — | 基础色板 | `--cv-palette-success-9` |
| palette/success/10 | CliniVol Palette | Shared | COLOR | `#002515` | — | 基础色板 | `--cv-palette-success-10` |
| palette/gray/1 | CliniVol Palette | Shared | COLOR | `#F3F3F3` | — | 基础色板 | `--cv-palette-gray-1` |
| palette/gray/2 | CliniVol Palette | Shared | COLOR | `#EEEEEE` | — | 基础色板 | `--cv-palette-gray-2` |
| palette/gray/3 | CliniVol Palette | Shared | COLOR | `#E7E7E7` | — | 基础色板 | `--cv-palette-gray-3` |
| palette/gray/4 | CliniVol Palette | Shared | COLOR | `#DCDCDC` | — | 基础色板 | `--cv-palette-gray-4` |
| palette/gray/5 | CliniVol Palette | Shared | COLOR | `#C5C5C5` | — | 基础色板 | `--cv-palette-gray-5` |
| palette/gray/6 | CliniVol Palette | Shared | COLOR | `#A6A6A6` | — | 基础色板 | `--cv-palette-gray-6` |
| palette/gray/7 | CliniVol Palette | Shared | COLOR | `#8B8B8B` | — | 基础色板 | `--cv-palette-gray-7` |
| palette/gray/8 | CliniVol Palette | Shared | COLOR | `#777777` | — | 基础色板 | `--cv-palette-gray-8` |
| palette/gray/9 | CliniVol Palette | Shared | COLOR | `#5E5E5E` | — | 基础色板 | `--cv-palette-gray-9` |
| palette/gray/10 | CliniVol Palette | Shared | COLOR | `#4B4B4B` | — | 基础色板 | `--cv-palette-gray-10` |
| palette/gray/11 | CliniVol Palette | Shared | COLOR | `#383838` | — | 基础色板 | `--cv-palette-gray-11` |
| palette/gray/12 | CliniVol Palette | Shared | COLOR | `#2C2C2C` | — | 基础色板 | `--cv-palette-gray-12` |
| palette/gray/13 | CliniVol Palette | Shared | COLOR | `#242424` | — | 基础色板 | `--cv-palette-gray-13` |
| palette/gray/14 | CliniVol Palette | Shared | COLOR | `#181818` | — | 基础色板 | `--cv-palette-gray-14` |
| palette/white/1 | CliniVol Palette | Shared | COLOR | `#FFFFFF` | — | 基础色板 | `--cv-palette-white-1` |
| color/bg-color-page | CliniVol Semantic | Light | COLOR | `#F5F7F9` | 直接值/明确例外 | bg-color-page | `--cv-bg-color-page` → `--td-bg-color-page` |
| color/bg-color-container | CliniVol Semantic | Light | COLOR | `{white.1}` | {white.1} | bg-color-container | `--cv-bg-color-container` → `--td-bg-color-container` |
| color/bg-color-secondarycontainer | CliniVol Semantic | Light | COLOR | `{gray.1}` | {gray.1} | bg-color-secondarycontainer | `--cv-bg-color-secondarycontainer` → `--td-bg-color-secondarycontainer` |
| color/bg-color-component | CliniVol Semantic | Light | COLOR | `{gray.3}` | {gray.3} | bg-color-component | `--cv-bg-color-component` → `--td-bg-color-component` |
| color/component-stroke | CliniVol Semantic | Light | COLOR | `{gray.3}` | {gray.3} | component-stroke | `--cv-component-stroke` → `--td-component-stroke` |
| color/component-border | CliniVol Semantic | Light | COLOR | `{gray.4}` | {gray.4} | component-border | `--cv-component-border` → `--td-component-border` |
| color/bg-color-container-hover | CliniVol Semantic | Light | COLOR | `{gray.1}` | {gray.1} | bg-color-container-hover | `--cv-bg-color-container-hover` → `--td-bg-color-container-hover` |
| color/bg-color-container-active | CliniVol Semantic | Light | COLOR | `{gray.3}` | {gray.3} | bg-color-container-active | `--cv-bg-color-container-active` → `--td-bg-color-container-active` |
| color/bg-color-component-hover | CliniVol Semantic | Light | COLOR | `{gray.4}` | {gray.4} | bg-color-component-hover | `--cv-bg-color-component-hover` → `--td-bg-color-component-hover` |
| color/bg-color-component-active | CliniVol Semantic | Light | COLOR | `{gray.6}` | {gray.6} | bg-color-component-active | `--cv-bg-color-component-active` → `--td-bg-color-component-active` |
| color/bg-color-component-disabled | CliniVol Semantic | Light | COLOR | `{gray.2}` | {gray.2} | bg-color-component-disabled | `--cv-bg-color-component-disabled` → `--td-bg-color-component-disabled` |
| color/text-color-primary | CliniVol Semantic | Light | COLOR | `rgba(0,0,0,0.90)` | 直接值/明确例外 | text-color-primary | `--cv-text-color-primary` → `--td-text-color-primary` |
| color/text-color-secondary | CliniVol Semantic | Light | COLOR | `rgba(0,0,0,0.60)` | 直接值/明确例外 | text-color-secondary | `--cv-text-color-secondary` → `--td-text-color-secondary` |
| color/text-color-placeholder | CliniVol Semantic | Light | COLOR | `rgba(0,0,0,0.40)` | 直接值/明确例外 | text-color-placeholder | `--cv-text-color-placeholder` → `--td-text-color-placeholder` |
| color/text-color-disabled | CliniVol Semantic | Light | COLOR | `rgba(0,0,0,0.26)` | 直接值/明确例外 | text-color-disabled | `--cv-text-color-disabled` → `--td-text-color-disabled` |
| color/text-color-anti | CliniVol Semantic | Light | COLOR | `rgba(255,255,255,0.90)` | 直接值/明确例外 | text-color-anti | `--cv-text-color-anti` → `--td-text-color-anti` |
| color/text-color-brand | CliniVol Semantic | Light | COLOR | `{brand.7}` | {brand.7} | text-color-brand | `--cv-text-color-brand` → `--td-text-color-brand` |
| color/text-color-link | CliniVol Semantic | Light | COLOR | `{brand.7}` | {brand.7} | text-color-link | `--cv-text-color-link` → `--td-text-color-link` |
| color/brand-color | CliniVol Semantic | Light | COLOR | `{brand.7}` | {brand.7} | brand-color | `--cv-brand-color` → `--td-brand-color` |
| color/brand-color-hover | CliniVol Semantic | Light | COLOR | `{brand.6}` | {brand.6} | brand-color-hover | `--cv-brand-color-hover` → `--td-brand-color-hover` |
| color/brand-color-active | CliniVol Semantic | Light | COLOR | `{brand.8}` | {brand.8} | brand-color-active | `--cv-brand-color-active` → `--td-brand-color-active` |
| color/brand-color-disabled | CliniVol Semantic | Light | COLOR | `{brand.3}` | {brand.3} | brand-color-disabled | `--cv-brand-color-disabled` → `--td-brand-color-disabled` |
| color/brand-color-focus | CliniVol Semantic | Light | COLOR | `{brand.2}` | {brand.2} | brand-color-focus | `--cv-brand-color-focus` → `--td-brand-color-focus` |
| color/brand-color-light | CliniVol Semantic | Light | COLOR | `{brand.1}` | {brand.1} | brand-color-light | `--cv-brand-color-light` → `--td-brand-color-light` |
| color/error-color | CliniVol Semantic | Light | COLOR | `{error.6}` | {error.6} | error-color | `--cv-error-color` → `--td-error-color` |
| color/error-color-hover | CliniVol Semantic | Light | COLOR | `{error.5}` | {error.5} | error-color-hover | `--cv-error-color-hover` → `--td-error-color-hover` |
| color/error-color-active | CliniVol Semantic | Light | COLOR | `{error.7}` | {error.7} | error-color-active | `--cv-error-color-active` → `--td-error-color-active` |
| color/error-color-disabled | CliniVol Semantic | Light | COLOR | `{error.3}` | {error.3} | error-color-disabled | `--cv-error-color-disabled` → `--td-error-color-disabled` |
| color/error-color-focus | CliniVol Semantic | Light | COLOR | `{error.2}` | {error.2} | error-color-focus | `--cv-error-color-focus` → `--td-error-color-focus` |
| color/error-color-light | CliniVol Semantic | Light | COLOR | `{error.1}` | {error.1} | error-color-light | `--cv-error-color-light` → `--td-error-color-light` |
| color/warning-color | CliniVol Semantic | Light | COLOR | `{warning.5}` | {warning.5} | warning-color | `--cv-warning-color` → `--td-warning-color` |
| color/warning-color-hover | CliniVol Semantic | Light | COLOR | `{warning.4}` | {warning.4} | warning-color-hover | `--cv-warning-color-hover` → `--td-warning-color-hover` |
| color/warning-color-active | CliniVol Semantic | Light | COLOR | `{warning.6}` | {warning.6} | warning-color-active | `--cv-warning-color-active` → `--td-warning-color-active` |
| color/warning-color-disabled | CliniVol Semantic | Light | COLOR | `{warning.3}` | {warning.3} | warning-color-disabled | `--cv-warning-color-disabled` → `--td-warning-color-disabled` |
| color/warning-color-focus | CliniVol Semantic | Light | COLOR | `{warning.2}` | {warning.2} | warning-color-focus | `--cv-warning-color-focus` → `--td-warning-color-focus` |
| color/warning-color-light | CliniVol Semantic | Light | COLOR | `{warning.1}` | {warning.1} | warning-color-light | `--cv-warning-color-light` → `--td-warning-color-light` |
| color/success-color | CliniVol Semantic | Light | COLOR | `{success.5}` | {success.5} | success-color | `--cv-success-color` → `--td-success-color` |
| color/success-color-hover | CliniVol Semantic | Light | COLOR | `{success.4}` | {success.4} | success-color-hover | `--cv-success-color-hover` → `--td-success-color-hover` |
| color/success-color-active | CliniVol Semantic | Light | COLOR | `{success.6}` | {success.6} | success-color-active | `--cv-success-color-active` → `--td-success-color-active` |
| color/success-color-disabled | CliniVol Semantic | Light | COLOR | `{success.3}` | {success.3} | success-color-disabled | `--cv-success-color-disabled` → `--td-success-color-disabled` |
| color/success-color-focus | CliniVol Semantic | Light | COLOR | `{success.2}` | {success.2} | success-color-focus | `--cv-success-color-focus` → `--td-success-color-focus` |
| color/success-color-light | CliniVol Semantic | Light | COLOR | `{success.1}` | {success.1} | success-color-light | `--cv-success-color-light` → `--td-success-color-light` |
| typography/font-size/link-small | CliniVol Typography | Shared | FLOAT | 12 | — | link-small | `--cv-font-size-link-small` |
| typography/line-height/link-small | CliniVol Typography | Shared | FLOAT | 20 | — | link-small | `--cv-line-height-link-small` |
| typography/font-size/link-medium | CliniVol Typography | Shared | FLOAT | 14 | — | link-medium | `--cv-font-size-link-medium` |
| typography/line-height/link-medium | CliniVol Typography | Shared | FLOAT | 22 | — | link-medium | `--cv-line-height-link-medium` |
| typography/font-size/link-large | CliniVol Typography | Shared | FLOAT | 16 | — | link-large | `--cv-font-size-link-large` |
| typography/line-height/link-large | CliniVol Typography | Shared | FLOAT | 24 | — | link-large | `--cv-line-height-link-large` |
| typography/font-size/mark-small | CliniVol Typography | Shared | FLOAT | 12 | — | mark-small | `--cv-font-size-mark-small` |
| typography/line-height/mark-small | CliniVol Typography | Shared | FLOAT | 20 | — | mark-small | `--cv-line-height-mark-small` |
| typography/font-size/mark-medium | CliniVol Typography | Shared | FLOAT | 14 | — | mark-medium | `--cv-font-size-mark-medium` |
| typography/line-height/mark-medium | CliniVol Typography | Shared | FLOAT | 22 | — | mark-medium | `--cv-line-height-mark-medium` |
| typography/font-size/body-small | CliniVol Typography | Shared | FLOAT | 12 | — | body-small | `--cv-font-size-body-small` |
| typography/line-height/body-small | CliniVol Typography | Shared | FLOAT | 20 | — | body-small | `--cv-line-height-body-small` |
| typography/font-size/body-medium | CliniVol Typography | Shared | FLOAT | 14 | — | body-medium | `--cv-font-size-body-medium` |
| typography/line-height/body-medium | CliniVol Typography | Shared | FLOAT | 22 | — | body-medium | `--cv-line-height-body-medium` |
| typography/font-size/body-large | CliniVol Typography | Shared | FLOAT | 16 | — | body-large | `--cv-font-size-body-large` |
| typography/line-height/body-large | CliniVol Typography | Shared | FLOAT | 24 | — | body-large | `--cv-line-height-body-large` |
| typography/font-size/title-small | CliniVol Typography | Shared | FLOAT | 14 | — | title-small | `--cv-font-size-title-small` |
| typography/line-height/title-small | CliniVol Typography | Shared | FLOAT | 22 | — | title-small | `--cv-line-height-title-small` |
| typography/font-size/title-medium | CliniVol Typography | Shared | FLOAT | 16 | — | title-medium | `--cv-font-size-title-medium` |
| typography/line-height/title-medium | CliniVol Typography | Shared | FLOAT | 24 | — | title-medium | `--cv-line-height-title-medium` |
| typography/font-size/title-large | CliniVol Typography | Shared | FLOAT | 20 | — | title-large | `--cv-font-size-title-large` |
| typography/line-height/title-large | CliniVol Typography | Shared | FLOAT | 28 | — | title-large | `--cv-line-height-title-large` |
| typography/font-size/headline-small | CliniVol Typography | Shared | FLOAT | 24 | — | headline-small | `--cv-font-size-headline-small` |
| typography/line-height/headline-small | CliniVol Typography | Shared | FLOAT | 32 | — | headline-small | `--cv-line-height-headline-small` |
| typography/font-size/headline-medium | CliniVol Typography | Shared | FLOAT | 28 | — | headline-medium | `--cv-font-size-headline-medium` |
| typography/line-height/headline-medium | CliniVol Typography | Shared | FLOAT | 36 | — | headline-medium | `--cv-line-height-headline-medium` |
| typography/font-size/headline-large | CliniVol Typography | Shared | FLOAT | 36 | — | headline-large | `--cv-font-size-headline-large` |
| typography/line-height/headline-large | CliniVol Typography | Shared | FLOAT | 44 | — | headline-large | `--cv-line-height-headline-large` |
| typography/font-size/display-medium | CliniVol Typography | Shared | FLOAT | 48 | — | display-medium | `--cv-font-size-display-medium` |
| typography/line-height/display-medium | CliniVol Typography | Shared | FLOAT | 56 | — | display-medium | `--cv-line-height-display-medium` |
| typography/font-size/display-large | CliniVol Typography | Shared | FLOAT | 64 | — | display-large | `--cv-font-size-display-large` |
| typography/line-height/display-large | CliniVol Typography | Shared | FLOAT | 72 | — | display-large | `--cv-line-height-display-large` |
| typography/font-weight/regular | CliniVol Typography | Shared | FLOAT | 400 | — | 字重 | `--cv-font-weight-regular` |
| typography/font-weight/medium | CliniVol Typography | Shared | FLOAT | 500 | — | 字重 | `--cv-font-weight-medium` |
| radius/small | CliniVol Geometry | Shared | FLOAT | 3 | — | 组件圆角 | `--cv-radius-small` |
| radius/default | CliniVol Geometry | Shared | FLOAT | 4 | — | 组件圆角 | `--cv-radius-default` |
| radius/medium | CliniVol Geometry | Shared | FLOAT | 8 | — | 组件圆角 | `--cv-radius-medium` |
| radius/large | CliniVol Geometry | Shared | FLOAT | 12 | — | 组件圆角 | `--cv-radius-large` |
| radius/extra-large | CliniVol Geometry | Shared | FLOAT | 16 | — | 组件圆角 | `--cv-radius-extra-large` |
| radius/circle | CliniVol Geometry | Shared | STRING | 50% | — | 组件圆角 | `--cv-radius-circle` |

阴影是Figma Effect Style复合属性，不把CSS逗号串冒充单个COLOR变量。Effect样式Shadow/1、Shadow/2、Shadow/3对应`--cv-shadow-1/2/3`，数值见tokens.md，来源是当前安装的TDesign样式。Icon尺寸16/20/24、描边1.5、图形圆角基准1为FLOAT，实际路径限制见icons.md。

## 对应关系特别说明

- @component-stroke → --cv-component-stroke → --td-border-level-1-color；@component-border → --td-border-level-2-color/--td-component-border。
- 正文14/22与卡片16/24、标题24/32是组件消费映射；字号原始比例不因单页空间调整。
- Light的@bg-color-page固定#F5F7F9，Gray2仍是#EEEEEE；Dark页面背景沿用官方Gray14=#181818，不把Light例外套入Dark。
- Dark与Info已确认，完整定义见下文；扩展设计阶段色保持原规则。本轮未调用Figma，不伪称已同步变量库。

## 已确认新增色板与Dark映射

原始值集合`CliniVol Palette`保持Shared模式；不同来源原始色分开命名，避免覆盖Light基础值。语义集合`CliniVol Semantic`使用Light / Dark模式，通过别名引用对应原始色；组件绑定语义变量，不直接挑色阶编号。

| Variable名称 | 集合 | 模式 | 类型 | 基础值或别名 | 引用基础色 | 使用场景 | CSS/Token目标 |
|---|---|---|---|---|---|---|---|
| palette/dark/brand/1 | CliniVol Palette | Shared | COLOR | `#0F2D24` | 用户Dark绿阶1 | Dark品牌原始值 | `--td-brand-color-1`（Dark） |
| palette/dark/brand/2 | CliniVol Palette | Shared | COLOR | `#12372C` | 用户Dark绿阶2 | Dark品牌原始值 | `--td-brand-color-2`（Dark） |
| palette/dark/brand/3 | CliniVol Palette | Shared | COLOR | `#164235` | 用户Dark绿阶3 | Dark品牌原始值 | `--td-brand-color-3`（Dark） |
| palette/dark/brand/4 | CliniVol Palette | Shared | COLOR | `#195040` | 用户Dark绿阶4 | Dark品牌原始值 | `--td-brand-color-4`（Dark） |
| palette/dark/brand/5 | CliniVol Palette | Shared | COLOR | `#1D604B` | 用户Dark绿阶5 | Dark品牌原始值 | `--td-brand-color-5`（Dark） |
| palette/dark/brand/6 | CliniVol Palette | Shared | COLOR | `#227258` | 用户Dark绿阶6 | Dark品牌原始值 | `--td-brand-color-6`（Dark） |
| palette/dark/brand/7 | CliniVol Palette | Shared | COLOR | `#2C8B6A` | 用户Dark绿阶7 | Dark品牌原始值 | `--td-brand-color-7`（Dark） |
| palette/dark/brand/8 | CliniVol Palette | Shared | COLOR | `#45A986` | 用户Dark绿阶8 | Dark品牌原始值 | `--td-brand-color-8`（Dark） |
| palette/dark/brand/9 | CliniVol Palette | Shared | COLOR | `#6BC3A1` | 用户Dark绿阶9 | Dark品牌原始值 | `--td-brand-color-9`（Dark） |
| palette/dark/brand/10 | CliniVol Palette | Shared | COLOR | `#9ADABE` | 用户Dark绿阶10 | Dark品牌原始值 | `--td-brand-color-10`（Dark） |
| palette/info/light/1 | CliniVol Palette | Shared | COLOR | `#F2F3FF` | 官方light原Brand1 | 独立备用Info原始值 | `--cv-palette-info-light-1`（目标） |
| palette/info/light/2 | CliniVol Palette | Shared | COLOR | `#D9E1FF` | 官方light原Brand2 | 独立备用Info原始值 | `--cv-palette-info-light-2`（目标） |
| palette/info/light/3 | CliniVol Palette | Shared | COLOR | `#B5C7FF` | 官方light原Brand3 | 独立备用Info原始值 | `--cv-palette-info-light-3`（目标） |
| palette/info/light/4 | CliniVol Palette | Shared | COLOR | `#8EABFF` | 官方light原Brand4 | 独立备用Info原始值 | `--cv-palette-info-light-4`（目标） |
| palette/info/light/5 | CliniVol Palette | Shared | COLOR | `#618DFF` | 官方light原Brand5 | 独立备用Info原始值 | `--cv-palette-info-light-5`（目标） |
| palette/info/light/6 | CliniVol Palette | Shared | COLOR | `#366EF4` | 官方light原Brand6 | 独立备用Info原始值 | `--cv-palette-info-light-6`（目标） |
| palette/info/light/7 | CliniVol Palette | Shared | COLOR | `#0052D9` | 官方light原Brand7 | 独立备用Info原始值 | `--cv-palette-info-light-7`（目标） |
| palette/info/light/8 | CliniVol Palette | Shared | COLOR | `#003CAB` | 官方light原Brand8 | 独立备用Info原始值 | `--cv-palette-info-light-8`（目标） |
| palette/info/light/9 | CliniVol Palette | Shared | COLOR | `#002A7C` | 官方light原Brand9 | 独立备用Info原始值 | `--cv-palette-info-light-9`（目标） |
| palette/info/light/10 | CliniVol Palette | Shared | COLOR | `#001A57` | 官方light原Brand10 | 独立备用Info原始值 | `--cv-palette-info-light-10`（目标） |
| palette/info/dark/1 | CliniVol Palette | Shared | COLOR | `#1B2F51` | 官方dark原Brand1 | 独立备用Info原始值 | `--cv-palette-info-dark-1`（目标） |
| palette/info/dark/2 | CliniVol Palette | Shared | COLOR | `#173463` | 官方dark原Brand2 | 独立备用Info原始值 | `--cv-palette-info-dark-2`（目标） |
| palette/info/dark/3 | CliniVol Palette | Shared | COLOR | `#143975` | 官方dark原Brand3 | 独立备用Info原始值 | `--cv-palette-info-dark-3`（目标） |
| palette/info/dark/4 | CliniVol Palette | Shared | COLOR | `#103D88` | 官方dark原Brand4 | 独立备用Info原始值 | `--cv-palette-info-dark-4`（目标） |
| palette/info/dark/5 | CliniVol Palette | Shared | COLOR | `#0D429A` | 官方dark原Brand5 | 独立备用Info原始值 | `--cv-palette-info-dark-5`（目标） |
| palette/info/dark/6 | CliniVol Palette | Shared | COLOR | `#054BBE` | 官方dark原Brand6 | 独立备用Info原始值 | `--cv-palette-info-dark-6`（目标） |
| palette/info/dark/7 | CliniVol Palette | Shared | COLOR | `#2667D4` | 官方dark原Brand7 | 独立备用Info原始值 | `--cv-palette-info-dark-7`（目标） |
| palette/info/dark/8 | CliniVol Palette | Shared | COLOR | `#4582E6` | 官方dark原Brand8 | 独立备用Info原始值 | `--cv-palette-info-dark-8`（目标） |
| palette/info/dark/9 | CliniVol Palette | Shared | COLOR | `#699EF5` | 官方dark原Brand9 | 独立备用Info原始值 | `--cv-palette-info-dark-9`（目标） |
| palette/info/dark/10 | CliniVol Palette | Shared | COLOR | `#96BBF8` | 官方dark原Brand10 | 独立备用Info原始值 | `--cv-palette-info-dark-10`（目标） |
| palette/td-dark/error/1 | CliniVol Palette | Shared | COLOR | `#472324` | TDesign官方Dark | Dark原始值 | `--td-error-color-1`（官方） |
| palette/td-dark/error/2 | CliniVol Palette | Shared | COLOR | `#5e2a2d` | TDesign官方Dark | Dark原始值 | `--td-error-color-2`（官方） |
| palette/td-dark/error/3 | CliniVol Palette | Shared | COLOR | `#703439` | TDesign官方Dark | Dark原始值 | `--td-error-color-3`（官方） |
| palette/td-dark/error/4 | CliniVol Palette | Shared | COLOR | `#83383e` | TDesign官方Dark | Dark原始值 | `--td-error-color-4`（官方） |
| palette/td-dark/error/5 | CliniVol Palette | Shared | COLOR | `#a03f46` | TDesign官方Dark | Dark原始值 | `--td-error-color-5`（官方） |
| palette/td-dark/error/6 | CliniVol Palette | Shared | COLOR | `#c64751` | TDesign官方Dark | Dark原始值 | `--td-error-color-6`（官方） |
| palette/td-dark/error/7 | CliniVol Palette | Shared | COLOR | `#de6670` | TDesign官方Dark | Dark原始值 | `--td-error-color-7`（官方） |
| palette/td-dark/error/8 | CliniVol Palette | Shared | COLOR | `#ec888e` | TDesign官方Dark | Dark原始值 | `--td-error-color-8`（官方） |
| palette/td-dark/error/9 | CliniVol Palette | Shared | COLOR | `#edb1b6` | TDesign官方Dark | Dark原始值 | `--td-error-color-9`（官方） |
| palette/td-dark/error/10 | CliniVol Palette | Shared | COLOR | `#eeced0` | TDesign官方Dark | Dark原始值 | `--td-error-color-10`（官方） |
| palette/td-dark/warning/1 | CliniVol Palette | Shared | COLOR | `#4f2a1d` | TDesign官方Dark | Dark原始值 | `--td-warning-color-1`（官方） |
| palette/td-dark/warning/2 | CliniVol Palette | Shared | COLOR | `#582f21` | TDesign官方Dark | Dark原始值 | `--td-warning-color-2`（官方） |
| palette/td-dark/warning/3 | CliniVol Palette | Shared | COLOR | `#733c23` | TDesign官方Dark | Dark原始值 | `--td-warning-color-3`（官方） |
| palette/td-dark/warning/4 | CliniVol Palette | Shared | COLOR | `#a75d2b` | TDesign官方Dark | Dark原始值 | `--td-warning-color-4`（官方） |
| palette/td-dark/warning/5 | CliniVol Palette | Shared | COLOR | `#cf6e2d` | TDesign官方Dark | Dark原始值 | `--td-warning-color-5`（官方） |
| palette/td-dark/warning/6 | CliniVol Palette | Shared | COLOR | `#dc7633` | TDesign官方Dark | Dark原始值 | `--td-warning-color-6`（官方） |
| palette/td-dark/warning/7 | CliniVol Palette | Shared | COLOR | `#e8935c` | TDesign官方Dark | Dark原始值 | `--td-warning-color-7`（官方） |
| palette/td-dark/warning/8 | CliniVol Palette | Shared | COLOR | `#ecbf91` | TDesign官方Dark | Dark原始值 | `--td-warning-color-8`（官方） |
| palette/td-dark/warning/9 | CliniVol Palette | Shared | COLOR | `#eed7bf` | TDesign官方Dark | Dark原始值 | `--td-warning-color-9`（官方） |
| palette/td-dark/warning/10 | CliniVol Palette | Shared | COLOR | `#f3e9dc` | TDesign官方Dark | Dark原始值 | `--td-warning-color-10`（官方） |
| palette/td-dark/success/1 | CliniVol Palette | Shared | COLOR | `#193a2a` | TDesign官方Dark | Dark原始值 | `--td-success-color-1`（官方） |
| palette/td-dark/success/2 | CliniVol Palette | Shared | COLOR | `#1a4230` | TDesign官方Dark | Dark原始值 | `--td-success-color-2`（官方） |
| palette/td-dark/success/3 | CliniVol Palette | Shared | COLOR | `#17533d` | TDesign官方Dark | Dark原始值 | `--td-success-color-3`（官方） |
| palette/td-dark/success/4 | CliniVol Palette | Shared | COLOR | `#0d7a55` | TDesign官方Dark | Dark原始值 | `--td-success-color-4`（官方） |
| palette/td-dark/success/5 | CliniVol Palette | Shared | COLOR | `#059465` | TDesign官方Dark | Dark原始值 | `--td-success-color-5`（官方） |
| palette/td-dark/success/6 | CliniVol Palette | Shared | COLOR | `#43af8a` | TDesign官方Dark | Dark原始值 | `--td-success-color-6`（官方） |
| palette/td-dark/success/7 | CliniVol Palette | Shared | COLOR | `#46bf96` | TDesign官方Dark | Dark原始值 | `--td-success-color-7`（官方） |
| palette/td-dark/success/8 | CliniVol Palette | Shared | COLOR | `#80d2b6` | TDesign官方Dark | Dark原始值 | `--td-success-color-8`（官方） |
| palette/td-dark/success/9 | CliniVol Palette | Shared | COLOR | `#b4e1d3` | TDesign官方Dark | Dark原始值 | `--td-success-color-9`（官方） |
| palette/td-dark/success/10 | CliniVol Palette | Shared | COLOR | `#deede8` | TDesign官方Dark | Dark原始值 | `--td-success-color-10`（官方） |
| palette/td-dark/gray/1 | CliniVol Palette | Shared | COLOR | `#f3f3f3` | TDesign官方Dark | Dark原始值 | `--td-gray-color-1`（官方） |
| palette/td-dark/gray/2 | CliniVol Palette | Shared | COLOR | `#eee` | TDesign官方Dark | Dark原始值 | `--td-gray-color-2`（官方） |
| palette/td-dark/gray/3 | CliniVol Palette | Shared | COLOR | `#e8e8e8` | TDesign官方Dark | Dark原始值 | `--td-gray-color-3`（官方） |
| palette/td-dark/gray/4 | CliniVol Palette | Shared | COLOR | `#ddd` | TDesign官方Dark | Dark原始值 | `--td-gray-color-4`（官方） |
| palette/td-dark/gray/5 | CliniVol Palette | Shared | COLOR | `#c6c6c6` | TDesign官方Dark | Dark原始值 | `--td-gray-color-5`（官方） |
| palette/td-dark/gray/6 | CliniVol Palette | Shared | COLOR | `#a6a6a6` | TDesign官方Dark | Dark原始值 | `--td-gray-color-6`（官方） |
| palette/td-dark/gray/7 | CliniVol Palette | Shared | COLOR | `#8b8b8b` | TDesign官方Dark | Dark原始值 | `--td-gray-color-7`（官方） |
| palette/td-dark/gray/8 | CliniVol Palette | Shared | COLOR | `#777` | TDesign官方Dark | Dark原始值 | `--td-gray-color-8`（官方） |
| palette/td-dark/gray/9 | CliniVol Palette | Shared | COLOR | `#5e5e5e` | TDesign官方Dark | Dark原始值 | `--td-gray-color-9`（官方） |
| palette/td-dark/gray/10 | CliniVol Palette | Shared | COLOR | `#4b4b4b` | TDesign官方Dark | Dark原始值 | `--td-gray-color-10`（官方） |
| palette/td-dark/gray/11 | CliniVol Palette | Shared | COLOR | `#393939` | TDesign官方Dark | Dark原始值 | `--td-gray-color-11`（官方） |
| palette/td-dark/gray/12 | CliniVol Palette | Shared | COLOR | `#2c2c2c` | TDesign官方Dark | Dark原始值 | `--td-gray-color-12`（官方） |
| palette/td-dark/gray/13 | CliniVol Palette | Shared | COLOR | `#242424` | TDesign官方Dark | Dark原始值 | `--td-gray-color-13`（官方） |
| palette/td-dark/gray/14 | CliniVol Palette | Shared | COLOR | `#181818` | TDesign官方Dark | Dark原始值 | `--td-gray-color-14`（官方） |
| palette/td-dark/font-white-1 | CliniVol Palette | Shared | COLOR | `rgba(255, 255, 255, 0.9)` | TDesign官方Dark | Dark文字原始值 | `--td-font-white-1`（官方） |
| palette/td-dark/font-white-2 | CliniVol Palette | Shared | COLOR | `rgba(255, 255, 255, 0.55)` | TDesign官方Dark | Dark文字原始值 | `--td-font-white-2`（官方） |
| palette/td-dark/font-white-3 | CliniVol Palette | Shared | COLOR | `rgba(255, 255, 255, 0.35)` | TDesign官方Dark | Dark文字原始值 | `--td-font-white-3`（官方） |
| palette/td-dark/font-white-4 | CliniVol Palette | Shared | COLOR | `rgba(255, 255, 255, 0.22)` | TDesign官方Dark | Dark文字原始值 | `--td-font-white-4`（官方） |
| palette/td-dark/font-gray-1 | CliniVol Palette | Shared | COLOR | `rgba(0, 0, 0, 0.9)` | TDesign官方Dark | Dark文字原始值 | `--td-font-gray-1`（官方） |
| palette/td-dark/font-gray-2 | CliniVol Palette | Shared | COLOR | `rgba(0, 0, 0, 0.6)` | TDesign官方Dark | Dark文字原始值 | `--td-font-gray-2`（官方） |
| palette/td-dark/font-gray-3 | CliniVol Palette | Shared | COLOR | `rgba(0, 0, 0, 0.4)` | TDesign官方Dark | Dark文字原始值 | `--td-font-gray-3`（官方） |
| palette/td-dark/font-gray-4 | CliniVol Palette | Shared | COLOR | `rgba(0, 0, 0, 0.26)` | TDesign官方Dark | Dark文字原始值 | `--td-font-gray-4`（官方） |
| color/brand-color | CliniVol Semantic | Dark | COLOR | `{palette/dark/brand/8}` | 官方Dark别名链/用户品牌覆盖 | brand-color | `--td-brand-color` |
| color/warning-color | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/warning/5}` | 官方Dark别名链/用户品牌覆盖 | warning-color | `--td-warning-color` |
| color/error-color | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/error/6}` | 官方Dark别名链/用户品牌覆盖 | error-color | `--td-error-color` |
| color/success-color | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/success/5}` | 官方Dark别名链/用户品牌覆盖 | success-color | `--td-success-color` |
| color/brand-color-hover | CliniVol Semantic | Dark | COLOR | `{palette/dark/brand/7}` | 官方Dark别名链/用户品牌覆盖 | brand-color-hover | `--td-brand-color-hover` |
| color/brand-color-focus | CliniVol Semantic | Dark | COLOR | `{palette/dark/brand/2}` | 官方Dark别名链/用户品牌覆盖 | brand-color-focus | `--td-brand-color-focus` |
| color/brand-color-active | CliniVol Semantic | Dark | COLOR | `{palette/dark/brand/9}` | 官方Dark别名链/用户品牌覆盖 | brand-color-active | `--td-brand-color-active` |
| color/brand-color-disabled | CliniVol Semantic | Dark | COLOR | `{palette/dark/brand/3}` | 官方Dark别名链/用户品牌覆盖 | brand-color-disabled | `--td-brand-color-disabled` |
| color/brand-color-light | CliniVol Semantic | Dark | COLOR | `{palette/dark/brand/1}` | 官方Dark别名链/用户品牌覆盖 | brand-color-light | `--td-brand-color-light` |
| color/brand-color-light-hover | CliniVol Semantic | Dark | COLOR | `{palette/dark/brand/2}` | 官方Dark别名链/用户品牌覆盖 | brand-color-light-hover | `--td-brand-color-light-hover` |
| color/warning-color-hover | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/warning/4}` | 官方Dark别名链/用户品牌覆盖 | warning-color-hover | `--td-warning-color-hover` |
| color/warning-color-focus | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/warning/2}` | 官方Dark别名链/用户品牌覆盖 | warning-color-focus | `--td-warning-color-focus` |
| color/warning-color-active | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/warning/6}` | 官方Dark别名链/用户品牌覆盖 | warning-color-active | `--td-warning-color-active` |
| color/warning-color-disabled | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/warning/3}` | 官方Dark别名链/用户品牌覆盖 | warning-color-disabled | `--td-warning-color-disabled` |
| color/warning-color-light | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/warning/1}` | 官方Dark别名链/用户品牌覆盖 | warning-color-light | `--td-warning-color-light` |
| color/warning-color-light-hover | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/warning/2}` | 官方Dark别名链/用户品牌覆盖 | warning-color-light-hover | `--td-warning-color-light-hover` |
| color/error-color-hover | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/error/5}` | 官方Dark别名链/用户品牌覆盖 | error-color-hover | `--td-error-color-hover` |
| color/error-color-focus | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/error/2}` | 官方Dark别名链/用户品牌覆盖 | error-color-focus | `--td-error-color-focus` |
| color/error-color-active | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/error/7}` | 官方Dark别名链/用户品牌覆盖 | error-color-active | `--td-error-color-active` |
| color/error-color-disabled | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/error/3}` | 官方Dark别名链/用户品牌覆盖 | error-color-disabled | `--td-error-color-disabled` |
| color/error-color-light | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/error/1}` | 官方Dark别名链/用户品牌覆盖 | error-color-light | `--td-error-color-light` |
| color/error-color-light-hover | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/error/2}` | 官方Dark别名链/用户品牌覆盖 | error-color-light-hover | `--td-error-color-light-hover` |
| color/success-color-hover | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/success/4}` | 官方Dark别名链/用户品牌覆盖 | success-color-hover | `--td-success-color-hover` |
| color/success-color-focus | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/success/2}` | 官方Dark别名链/用户品牌覆盖 | success-color-focus | `--td-success-color-focus` |
| color/success-color-active | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/success/6}` | 官方Dark别名链/用户品牌覆盖 | success-color-active | `--td-success-color-active` |
| color/success-color-disabled | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/success/3}` | 官方Dark别名链/用户品牌覆盖 | success-color-disabled | `--td-success-color-disabled` |
| color/success-color-light | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/success/1}` | 官方Dark别名链/用户品牌覆盖 | success-color-light | `--td-success-color-light` |
| color/success-color-light-hover | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/success/2}` | 官方Dark别名链/用户品牌覆盖 | success-color-light-hover | `--td-success-color-light-hover` |
| color/mask-active | CliniVol Semantic | Dark | COLOR | `rgba(0, 0, 0, 0.4)` | 官方Dark别名链/用户品牌覆盖 | mask-active | `--td-mask-active` |
| color/mask-disabled | CliniVol Semantic | Dark | COLOR | `rgba(0, 0, 0, 0.6)` | 官方Dark别名链/用户品牌覆盖 | mask-disabled | `--td-mask-disabled` |
| color/mask-background | CliniVol Semantic | Dark | COLOR | `rgba(36, 36, 36, 0.96)` | 官方Dark别名链/用户品牌覆盖 | mask-background | `--td-mask-background` |
| color/mask-gradient | CliniVol Semantic | Dark | COLOR | `rgba(36, 36, 36, 0)` | 官方Dark别名链/用户品牌覆盖 | mask-gradient | `--td-mask-gradient` |
| color/bg-color-page | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/14}` | 官方Dark别名链/用户品牌覆盖 | bg-color-page | `--td-bg-color-page` |
| color/bg-color-container | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/13}` | 官方Dark别名链/用户品牌覆盖 | bg-color-container | `--td-bg-color-container` |
| color/bg-color-container-hover | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/12}` | 官方Dark别名链/用户品牌覆盖 | bg-color-container-hover | `--td-bg-color-container-hover` |
| color/bg-color-container-active | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/10}` | 官方Dark别名链/用户品牌覆盖 | bg-color-container-active | `--td-bg-color-container-active` |
| color/bg-color-container-select | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/9}` | 官方Dark别名链/用户品牌覆盖 | bg-color-container-select | `--td-bg-color-container-select` |
| color/bg-color-secondarycontainer | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/12}` | 官方Dark别名链/用户品牌覆盖 | bg-color-secondarycontainer | `--td-bg-color-secondarycontainer` |
| color/bg-color-secondarycontainer-hover | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/11}` | 官方Dark别名链/用户品牌覆盖 | bg-color-secondarycontainer-hover | `--td-bg-color-secondarycontainer-hover` |
| color/bg-color-secondarycontainer-active | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/9}` | 官方Dark别名链/用户品牌覆盖 | bg-color-secondarycontainer-active | `--td-bg-color-secondarycontainer-active` |
| color/bg-color-component | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/11}` | 官方Dark别名链/用户品牌覆盖 | bg-color-component | `--td-bg-color-component` |
| color/bg-color-component-hover | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/10}` | 官方Dark别名链/用户品牌覆盖 | bg-color-component-hover | `--td-bg-color-component-hover` |
| color/bg-color-component-active | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/9}` | 官方Dark别名链/用户品牌覆盖 | bg-color-component-active | `--td-bg-color-component-active` |
| color/bg-color-secondarycomponent | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/10}` | 官方Dark别名链/用户品牌覆盖 | bg-color-secondarycomponent | `--td-bg-color-secondarycomponent` |
| color/bg-color-secondarycomponent-hover | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/9}` | 官方Dark别名链/用户品牌覆盖 | bg-color-secondarycomponent-hover | `--td-bg-color-secondarycomponent-hover` |
| color/bg-color-secondarycomponent-active | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/8}` | 官方Dark别名链/用户品牌覆盖 | bg-color-secondarycomponent-active | `--td-bg-color-secondarycomponent-active` |
| color/bg-color-component-disabled | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/12}` | 官方Dark别名链/用户品牌覆盖 | bg-color-component-disabled | `--td-bg-color-component-disabled` |
| color/bg-color-specialcomponent | CliniVol Semantic | Dark | COLOR | `transparent` | 官方Dark别名链/用户品牌覆盖 | bg-color-specialcomponent | `--td-bg-color-specialcomponent` |
| color/text-color-primary | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/font-white-1}` | 官方Dark别名链/用户品牌覆盖 | text-color-primary | `--td-text-color-primary` |
| color/text-color-secondary | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/font-white-2}` | 官方Dark别名链/用户品牌覆盖 | text-color-secondary | `--td-text-color-secondary` |
| color/text-color-placeholder | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/font-white-3}` | 官方Dark别名链/用户品牌覆盖 | text-color-placeholder | `--td-text-color-placeholder` |
| color/text-color-disabled | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/font-white-4}` | 官方Dark别名链/用户品牌覆盖 | text-color-disabled | `--td-text-color-disabled` |
| color/text-color-anti | CliniVol Semantic | Dark | COLOR | `#fff` | 官方Dark别名链/用户品牌覆盖 | text-color-anti | `--td-text-color-anti` |
| color/text-color-brand | CliniVol Semantic | Dark | COLOR | `{palette/dark/brand/8}` | 官方Dark别名链/用户品牌覆盖 | text-color-brand | `--td-text-color-brand` |
| color/text-color-link | CliniVol Semantic | Dark | COLOR | `{palette/dark/brand/8}` | 官方Dark别名链/用户品牌覆盖 | text-color-link | `--td-text-color-link` |
| color/text-color-watermark | CliniVol Semantic | Dark | COLOR | `rgba(255, 255, 255, 0.1)` | 官方Dark别名链/用户品牌覆盖 | text-color-watermark | `--td-text-color-watermark` |
| color/border-level-1-color | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/11}` | 官方Dark别名链/用户品牌覆盖 | border-level-1-color | `--td-border-level-1-color` |
| color/component-stroke | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/11}` | 官方Dark别名链/用户品牌覆盖 | component-stroke | `--td-component-stroke` |
| color/border-level-2-color | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/9}` | 官方Dark别名链/用户品牌覆盖 | border-level-2-color | `--td-border-level-2-color` |
| color/component-border | CliniVol Semantic | Dark | COLOR | `{palette/td-dark/gray/9}` | 官方Dark别名链/用户品牌覆盖 | component-border | `--td-component-border` |
| color/table-shadow-color | CliniVol Semantic | Dark | COLOR | `rgba(0, 0, 0, 0.55)` | 官方Dark别名链/用户品牌覆盖 | table-shadow-color | `--td-table-shadow-color` |
| color/scrollbar-color | CliniVol Semantic | Dark | COLOR | `rgba(255, 255, 255, 0.1)` | 官方Dark别名链/用户品牌覆盖 | scrollbar-color | `--td-scrollbar-color` |
| color/scrollbar-hover-color | CliniVol Semantic | Dark | COLOR | `rgba(255, 255, 255, 0.3)` | 官方Dark别名链/用户品牌覆盖 | scrollbar-hover-color | `--td-scrollbar-hover-color` |
| color/scroll-track-color | CliniVol Semantic | Dark | COLOR | `#333` | 官方Dark别名链/用户品牌覆盖 | scroll-track-color | `--td-scroll-track-color` |
| color/info-color | CliniVol Semantic | Light | COLOR | `{palette/info/light/7}` | 官方Light蓝阶7 | 备用信息语义 | `--td-info-color`（目标自定义别名） |
| color/info-color-hover | CliniVol Semantic | Light | COLOR | `{palette/info/light/6}` | 官方Light蓝阶6 | 备用信息语义 | `--td-info-color-hover`（目标自定义别名） |
| color/info-color-active | CliniVol Semantic | Light | COLOR | `{palette/info/light/8}` | 官方Light蓝阶8 | 备用信息语义 | `--td-info-color-active`（目标自定义别名） |
| color/info-color-focus | CliniVol Semantic | Light | COLOR | `{palette/info/light/2}` | 官方Light蓝阶2 | 备用信息语义 | `--td-info-color-focus`（目标自定义别名） |
| color/info-color-disabled | CliniVol Semantic | Light | COLOR | `{palette/info/light/3}` | 官方Light蓝阶3 | 备用信息语义 | `--td-info-color-disabled`（目标自定义别名） |
| color/info-color-light | CliniVol Semantic | Light | COLOR | `{palette/info/light/1}` | 官方Light蓝阶1 | 备用信息语义 | `--td-info-color-light`（目标自定义别名） |
| color/info-color-light-hover | CliniVol Semantic | Light | COLOR | `{palette/info/light/2}` | 官方Light蓝阶2 | 备用信息语义 | `--td-info-color-light-hover`（目标自定义别名） |
| color/info-color | CliniVol Semantic | Dark | COLOR | `{palette/info/dark/8}` | 官方Dark蓝阶8 | 备用信息语义 | `--td-info-color`（目标自定义别名） |
| color/info-color-hover | CliniVol Semantic | Dark | COLOR | `{palette/info/dark/7}` | 官方Dark蓝阶7 | 备用信息语义 | `--td-info-color-hover`（目标自定义别名） |
| color/info-color-active | CliniVol Semantic | Dark | COLOR | `{palette/info/dark/9}` | 官方Dark蓝阶9 | 备用信息语义 | `--td-info-color-active`（目标自定义别名） |
| color/info-color-focus | CliniVol Semantic | Dark | COLOR | `{palette/info/dark/2}` | 官方Dark蓝阶2 | 备用信息语义 | `--td-info-color-focus`（目标自定义别名） |
| color/info-color-disabled | CliniVol Semantic | Dark | COLOR | `{palette/info/dark/3}` | 官方Dark蓝阶3 | 备用信息语义 | `--td-info-color-disabled`（目标自定义别名） |
| color/info-color-light | CliniVol Semantic | Dark | COLOR | `{palette/info/dark/1}` | 官方Dark蓝阶1 | 备用信息语义 | `--td-info-color-light`（目标自定义别名） |
| color/info-color-light-hover | CliniVol Semantic | Dark | COLOR | `{palette/info/dark/2}` | 官方Dark蓝阶2 | 备用信息语义 | `--td-info-color-light-hover`（目标自定义别名） |

## Shadow → Figma Effect Styles

Shadow为多层DROP_SHADOW复合Effect，不存在原生SHADOW类型的Figma Variable，不能把CSS逗号串写成COLOR变量。未来建立`Shadow/Light/1–3`与`Shadow/Dark/1–3`共六个Effect Styles；每个Style依原顺序保留三层阴影。可拆分offsetX/offsetY/blur/spread/opacity为FLOAT、color为COLOR变量，再按Figma支持能力绑定。不能因此减少为一层阴影。

| Effect Style | 模式 | CSS来源 | 含义 |
|---|---|---|---|
| Shadow/Light/1 | Light | --td-shadow-1（Light） | 基础投影 |
| Shadow/Light/2 | Light | --td-shadow-2（Light） | 中层投影 |
| Shadow/Light/3 | Light | --td-shadow-3（Light） | 上层投影 |
| Shadow/Dark/1 | Dark | --td-shadow-1（Dark） | 基础投影 |
| Shadow/Dark/2 | Dark | --td-shadow-2（Dark） | 中层投影 |
| Shadow/Dark/3 | Dark | --td-shadow-3（Dark） | 上层投影 |

完整参数见tokens.md，已与TDesign 1.18.4原定义核对。当前只准备映射，未来获得指定Figma文件及操作指令后再检查现有集合、模式、变量和Style，复用并更新，不擅自重复新建或覆盖无关内容。

## Card组件圆角例外（最新确认）

| Variable名称 | 集合 | 模式 | 类型 | 值 | 来源 | 使用场景 | CSS依据 |
|---|---|---|---|---|---|---|---|
| card/radius | CliniVol Components | Shared | FLOAT | 6 | tdesign-react 1.18.4官方Card | 首页大卡片、平台通用Card | .t-card → --td-radius-medium；官方默认6px |

这是规划的CliniVol组件变量，不冒称TDesign存在同名Card专属Token。`radius/medium = 8`继续保留给其他既定组件类型，Card不得错误绑定到它。当前运行Card已使用独立--cv-card-radius=6px，其他medium组件保持8px；本次未更改Figma。Icon路径1px微圆角与组件圆角分别管理。
