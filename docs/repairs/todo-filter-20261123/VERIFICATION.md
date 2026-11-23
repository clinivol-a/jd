# 待办字段与文本筛选框定向修正

2026-11-23；基线 `f690c69b1e87cc3b4cf272b4a0f32c348b3254c0`。修改前安全分支：`codex/backup-before-todo-filter-20261123`。

- 销售首页“我的待办”增加已有业务类型字段，顺序为：业务类型、业务对象、当前状态、最近更新时间、操作。仍展示3条，沿用原数据与操作。完整待办已有字段未删减。
- 销售与设计师业务列表的文本筛选框统一使用Placeholder；移除设计师我的项目和保留的旧任务筛选入口的搜索装饰Icon。销售订单、客户及设计师审核筛选原本无此Icon，保持一致。
- 未改日期选择器、下拉选择器的功能控件，未改筛选逻辑、表格布局、权限或数据。
- 在 `design-system/ui-ux-consistency.md` 原筛选规范中同步文本筛选框规则。

浏览器验证：

1. 销售首页我的待办表头严格为上述5列，数据3条。
2. 销售订单提示词“搜索订单编号”、客户“搜索医生姓名或手机号”、设计师项目与审核“搜索项目编号”，文本前置图标均为0。见 [checks.json](checks.json)。
3. 设计师任务视角输入 `CV-2026-0002` 后显示对应两条专业任务，重置正常。
4. TypeScript与Vite构建通过，`git diff --check`通过；构建保留既有大资源包提示。

截图：[销售待办](01-sales-todo.jpg)、[设计师项目筛选](02-project-filter.jpg)、[审核筛选](03-review-filter.jpg)。

修改代码：`src/sales/SalesWorkspace.tsx`、`src/projects/ProjectPages.tsx`、`src/App.tsx`；未改专业工作区、管理员端、认证及Token，未部署或推送。
