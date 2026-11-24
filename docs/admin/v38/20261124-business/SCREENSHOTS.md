# 截图与测量索引

均为本地真实浏览器截图，2026-11-24；不是生成的效果图。QA截图用隔离副本；final-clean / final-sales / final-designer为重新复制原始业务资料后的最终运行时。

## 前后与最终状态

| 内容 | 修改前 | 修改后 |
|---|---|---|
| 首页 | [before-home](before-home.jpg) | [final-clean-home](final-clean-home.jpg) |
| 订单详情 | [before-detail](before-detail.jpg) | [final-clean-detail](final-clean-detail.jpg) |
| 完整订单列表 | 基线首页截图和Git基线可复核；未单独保存完整列表改前截图 | [final-clean-orders](final-clean-orders.jpg) |
| 日期 | — | [date-panel](date-panel.jpg)、[invalid-date](invalid-date.jpg)、[销售](final-sales-orders.jpg) |
| More与必填 | — | [more-menu](more-menu.jpg)、[required-reason](required-reason.jpg) |
| 分页 | — | [第2页](orders-page2.jpg)、[末页](orders-last-page.jpg) |
| 空状态 | — | [120px](empty-120.jpg) |
| 深色详情 | — | [detail-dark](detail-dark.jpg) |
| 原设计师首页 | 冻结代码 | [final-designer-home](final-designer-home.jpg) |
| 最终可用预览 | — | [final-ready](final-ready.jpg) |

## 三端真实业务

依次查看：[销售提交](sales-submit.jpg) → [管理退回](admin-returned.jpg) → [销售收到退回](sales-returned.jpg) → [受理核对](accept-dialog.jpg) → [受理后](admin-accepted.jpg) → [分配两任务](assigned-two-tasks.jpg) → [设计师项目](designer-same-project.jpg) → [设计师详情](designer-same-detail.jpg) → [两任务](designer-two-tasks.jpg)。

[版本冲突](version-conflict.jpg)显示旧窗口提交被409拒绝后的实际状态。[关联ID与事件](cross-role-evidence.json)记录同一业务关系。

## 其他模块与权限边界

- [账号审核资料](account-review-drawer.jpg)
- [资产追溯](asset-drawer.jpg)
- [授权合成资质预览](doctor-preview.jpg)
- [共享档案只读](shared-doctor-readonly.jpg)
- [审计业务字段](audit-business-fields.jpg)

## 八模块视口矩阵

| 模块 | 1440×900 Light | 1366×768 Light | 1920×1080 Light | 1440×768 Dark |
|---|---|---|---|---|
| 工作台 | [图](module-light-工作台.jpg) | [图](1366-light-工作台.jpg) | [图](1920-light-工作台.jpg) | [图](1440-dark-工作台.jpg) |
| 订单管理 | [图](module-light-订单管理.jpg) | [图](1366-light-订单管理.jpg) | [图](1920-light-订单管理.jpg) | [图](1440-dark-订单管理.jpg) |
| 任务调度 | [图](module-light-任务调度.jpg) | [图](1366-light-任务调度.jpg) | [图](1920-light-任务调度.jpg) | [图](1440-dark-任务调度.jpg) |
| 审核中心 | [图](module-light-审核中心.jpg) | [图](1366-light-审核中心.jpg) | [图](1920-light-审核中心.jpg) | [图](1440-dark-审核中心.jpg) |
| 机构与人员 | [图](module-light-机构与人员.jpg) | [图](1366-light-机构与人员.jpg) | [图](1920-light-机构与人员.jpg) | [图](1440-dark-机构与人员.jpg) |
| 权限与审批 | [图](module-light-权限与审批.jpg) | [图](1366-light-权限与审批.jpg) | [图](1920-light-权限与审批.jpg) | [图](1440-dark-权限与审批.jpg) |
| 数据资产 | [图](module-light-数据资产.jpg) | [图](1366-light-数据资产.jpg) | [图](1920-light-数据资产.jpg) | [图](1440-dark-数据资产.jpg) |
| 审计日志 | [图](module-light-审计日志.jpg) | [图](1366-light-审计日志.jpg) | [图](1920-light-审计日志.jpg) | [图](1440-dark-审计日志.jpg) |

## 原始测量

- [32份页面观察](visual-matrix.json)
- [最终概览/阶段卡/操作对齐](detail-metrics-final.json)
- [销售阶段卡对照](sales-stage-metrics.json)
- [五卡点击数量](final-stat-clicks.json)
- [附件对照](attachment-comparison.json)
- [受保护范围](scope-check.json)
- [原始资料SHA不变](protected-data-check.json)
