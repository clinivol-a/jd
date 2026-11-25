# 2026-11-25 审核中心四项纠正

基线：`82d32cf382fa6d5b9b9dc7ef1b4e8db4763f2041`。
安全分支：`codex/backup-before-review-corrections-20261125-82d32cf`。
工作分支：`codex/review-corrections-20261125`。
本地验收：<http://127.0.0.1:5260/>。未推送、未部署。

## 修正与证据

| 问题 | 实现 | 实际验证 |
| --- | --- | --- |
| 账号退回仍能由管理员重新审核 | 删除退回详情的重审按钮，服务端拒绝 `reopen-account-review`；申请人核验原手机号、修改组织/岗位资料并重新提交后才恢复待审核 | 浏览器打开顾清和的退回申请，重审按钮数量为 0；服务端测试确认管理员重启返回 403，直接通过退回申请返回 409，原身份和审计不变；申请人重提测试通过 |
| 首条已通过医生仅有一条记录 | 修复演示历史初始化错误：不能以 `version === 1` 作为补齐既有建档/提交历史的条件 | 首条周明哲实际显示创建、提交审核、审核通过三条，原实际审核人“超级管理员”及审核时间不变；重启不重复补记录 |
| 旧记录出现“合成审核账号” | 两条已识别隔离种子审核事件改为“管理员”，既存存储按事件 ID、来源和对象 ID 进行一次性修正 | 浏览器核对林致远、张予安旧审核事件，均为“管理员”；私有当前数据的 doctorHistory/events 中该占位审核人均为 0 条；真实审核人周景明、超级管理员等不被替换 |
| 权限申请缺申请事项、退回仍显示重审 | 首列新增“申请事项”，值“历史订单访问”；退回详情仅显示“撤销审核退回”，保留原因、版本校验和历史，不直接授予权限 | 浏览器核对八列表头及退回 Footer；撤销对话框要求操作原因，取消后状态仍为退回；服务端测试撤销恢复待审核且不授予权限，后续审核通过才授权，重复批准被拒绝 |

## 演示历史修复边界

仅处理 `isolated-admin` 环境、已知 ID 和姓名/医院/提交人指纹一致的三条原始医生演示档案。恢复其原始预置建档和提交事件，不为未知用户档案编造历史。两条旧种子事件保留原 ID、时间、意见及原始 actor 元数据，修正当前展示身份；实际审核决定不被覆盖。

## 浏览器截图

- [账号退回，无重审按钮](account-returned.png)
- [首条已通过医生的三条记录](doctor-first-history.png)
- [旧种子审核人修正，真实后续审核人保留](doctor-reviewer.png)
- [权限申请首列](permission-table.png)
- [权限退回仅有撤销按钮](permission-returned.png)
- [深色权限退回详情](permission-returned-dark.png)

浏览器已验证上述页面和撤销确认/取消交互；本轮未用浏览器再次完成申请人注册补正全链路，该链路由实际 AuthService 状态测试验证。

## 构建和测试

- TypeScript：通过。
- Vite 生产构建：通过；保留已有大资源分块提示，本轮不做无关拆包。
- 审核/组织、管理员、机构、医生一致性及认证测试：101 项通过，0 失败。
- 覆盖：账号退回→本人重提→待审核→通过；管理员无法重启退回账号；权限撤销与实际授权分离；已处理种子历史修复、重启幂等及真实审计保护。
- `git diff --check`：通过。

## 修改范围

- `src/admin/AdminWorkspace.tsx`
- `src/admin/approvalDisplay.mjs`
- `server/admin/service.mjs`
- `server/admin/seed.mjs`
- `server/admin/reviewExamples.mjs`
- `tests/review-organization-20261125.test.mjs`
- `design-system/component-rules.md`
- `design-system/ui-ux-consistency.md`
- `docs/product/field-dictionary.md`
- 本报告及截图。

设计师、销售业务页面、登录注册 UI、Header、专业工作区和全局 Token 无修改。main、design-handoff、冻结基线不变。私有测试数据在修改前另存于 `/private/tmp/clinivol-before-review-corrections-20261125-82d32cf`，不提交到 Git。
