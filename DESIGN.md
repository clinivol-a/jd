---
name: CliniVol Design System V1.0
description: Confirmed project dashboard, stable professional workspaces and Figma-backed semantic tokens
---

# CliniVol Design System V1.0

本轮（2026-11-03）已确认的最终Figma截图与以下四份规范替代旧的字号、色阶、圆角和专业分类描述。产品Logo与已实现交互保持，不建立新品牌。

- [Token与来源](design-system/tokens.md)
- [Icon规范与例外](design-system/icons.md)
- [组件与状态规则](design-system/component-rules.md)
- [Figma Variables映射](design-system/figma-variable-mapping.md)

运行实现为`src/design-system/tokens.css`及`CliniVolIcon.tsx`；`design-system/tokens.json`为上次运行快照。2026-11-03新增确认的Dark/Info/Shadow规范已写入Markdown，本轮尚未同步CSS/JSON，不以旧快照覆盖新规范。

品牌核心#0D7A5D、Light页面#F5F7F9，主要表面白色；常规正文14/22 Regular、卡片标题16/24 Medium、页面标题24/32 Medium。GlobalHeader56px，专业工具栏58px。进行中蓝、待审核橙、退回红、完成绿，与设计阶段Cyan/Purple/Yellow/Pink身份独立。

平台首页以稳定项目ID聚合。项目编号/医院/名称冻结左侧，操作冻结右侧；最近项目与通知统一进入同一项目详情。详情为项目基本信息、设计阶段、项目流转记录；宽内容四列阶段卡片，保留任务ID与原有工作区、只读审核和CAD解锁逻辑。

三维重建为AI/视图/图像/分割；不再开放主动文件入口或插件分类。AI缺真实处理能力的命令禁用，不伪造结果。CAD保持原单排纯Icon工具栏、浮动命令面板、真实展示STL与原材质。二维医学画布黑色，医学3D视图白色，CAD沿用Light白/Dark#24292D，不受平台颜色重映射强制反色。

Light/Dark颜色的来源、截图未给出的值、保留的面性Icon与复杂圆角限制均在四份规范中明确记录。当前无真实临床AI算法、服务端鉴权或制造级CAD精度能力。

主题最终规则：Light沿用最终Figma色板，页面背景唯一例外#F5F7F9；Dark品牌绿用用户指定十级阶梯与Brand8/7/9映射，其他颜色及阴影全部TDesign官方Dark。官方原品牌蓝独立保存为Info双主题备用色。Light/Dark三级阴影均使用官方默认值，参数已核对，不再待确认。
