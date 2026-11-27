# 成员开关关闭态修正

2026-11-27，替代上一轮可操作关闭态 #E7E7E7、禁用关闭态 #EEEEEE 的双底色方案。

浅色所有关闭开关统一使用现有 `--td-bg-color-component-disabled`（#EEEEEE），包括 Hover；关闭态手柄统一无阴影。开启态、真实 disabled 属性、权限校验和 Dark 主题不变。

在本机 http://127.0.0.1:5260/ 分两页逐条打开全部 11 条成员记录，读取共 132 个开关的真实背景、开启/禁用状态和手柄阴影。所有关闭开关均为 rgb(238,238,238)、阴影 none；资产查询关闭 Hover 同样为此色。试切换已恢复并关闭取消，没有保存权限或成员变更。机构与成员其他编辑表单源码不存在额外 Switch 实现。

TypeScript 与 Vite 构建通过，只有现有大包体积提示；git diff --check 通过。未部署。

实测数据：all-members.json；截图：member-switches.jpg。
