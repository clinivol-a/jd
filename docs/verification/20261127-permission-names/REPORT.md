# 管理权限名称对齐

2026-11-27，范围仅为管理员端权限展示文案。

| 权限 ID（保持不变） | 显示名称 | 对照功能 |
|---|---|---|
| orders:read | 订单管理 | 侧栏订单管理 |
| orders:review | 订单审核 | 订单审核受理、审核退回 |
| tasks:assign | 任务分配 | 分配任务、调整任务分配 |
| doctors:review | 医生档案审核 | 审核中心同名 Tab |
| people:manage | 机构与成员 | 侧栏同名功能 |
| accounts:approve | 账号注册审核 | 审核中心同名 Tab |
| permissions:grant | 成员授权与权限申请审核 | 成员与权限配置、审核中心权限申请审核；同一既有权限涵盖两处，保留完整含义 |
| assets:read | 专业成果查看 | 数据资产的专业成果 Tab |
| assets:export-metadata | 导出资产信息 | 同名导出按钮 |
| audit:read | 审计日志 | 侧栏同名功能 |
| shares:manage | 成果分享管理 | 数据资产同名 Tab |

成员侧栏开关、列表具体权限、审计变更明细共用 memberPolicy.mjs 中的名称表；依赖提示同步更新。没有调整权限 ID、角色、启用状态、授权范围或持久化数据。

浏览器实际核对成员表格与赵启明侧栏，11 项显示与对照一致，截图 permissions.jpg。未保存任何成员变更。TypeScript、Vite 构建通过；原有包体积提示保留。未部署。本机预览 http://127.0.0.1:5260/ 。

既有测试 member-policy-20261127 与 admin-data-audit-20261126 共 19 项通过。首次运行因沙箱不允许绑定测试端口而受阻，授权执行环境下重新运行后全部通过。
