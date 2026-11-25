# 管理员订单草稿可见性修复

2026-11-25；基线 `8474daee5c5e8d1c563aea9d61f7f953d0a27e6a`。
安全恢复分支：`codex/backup-before-admin-draft-20261125-8474dae`。

规则：销售订单草稿只由所属销售本人查看。只有正式提交后才进入管理员的订单管理范围。销售草稿本身不删除，保存、编辑、删除及提交逻辑不变。

- 管理员订单状态筛选删除「草稿」。
- 管理员旧数据读取与关联任务、成果、分享投影排除草稿订单；当前草稿事件不混入管理业务审计投影。
- 共享服务同时检查非草稿状态及正式编号；管理员、超级管理员、组长直接读取草稿均拒绝，订单附件读取同样受限。
- 字段字典在既有订单状态规则中同步可见性边界。
- 本地浏览器重新登录管理员，实际打开订单管理及状态下拉：只有全部、待审核、审核退回、处理中、已完成、已取消，不存在草稿。截图见 [status-options.png](status-options.png)。
- 25 项相关服务端/HTTP回归测试全部通过：新增验证所有管理角色不可读取销售草稿、销售本人仍可读取、其他销售不可读取、正式提交后同 ID/编号进入管理员列表。
- TypeScript 与 Vite 构建通过。保留现有大包提醒，未做无关打包重构。
- 销售业务界面、设计师、专业工作区、Header、Sidebar、Token 无修改。未 Push、未部署。

修改文件：`src/admin/AdminWorkspace.tsx`、`server/admin/service.mjs`、`server/unified/service.mjs`、`docs/product/field-dictionary.md`、`tests/admin-service.test.mjs`、`tests/unified-business.test.mjs`，以及本验收目录。

本地预览：<http://127.0.0.1:5260/>，已恢复原端口并在浏览器实际打开。
