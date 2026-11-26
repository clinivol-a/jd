# 三条测试注册数据清理与首页按钮统一

- 基线：01e76d4d4c4d61986f85c7f9e0fa4f2e7c012e17。
- 安全分支：codex/backup-remove-three-registrations-20261126-01e76d4。
- 只移除用户截图确认的三条待审核测试账号：haoren、离您最近、得到的；按姓名和手机号精确匹配，并确认均无有效岗位和业务记录引用。
- 当前隔离预览认证库 9 → 6；本地基础认证库 6 → 3。原始账号和迁移清单完整保存在忽略目录 `.local/backups/remove-three-registrations-20261126-105310`，不提交凭据。其他历史测试副本及原审计文件保留，不参与当前账号列表。手机号可按原唯一性规则重新注册。
- 首页待审核事项直接复用订单管理的 TDesign Primary Text Button 和 16px ChevronRightIcon；跳转和审核筛选不变。只有 AdminWorkspace.tsx 这一处 UI 修改，无全局样式改动。

## 实际验证

- 浏览器演示数据控制台显示其余六条账号，不再显示目标三条；截图 accounts.png。
- 本地真实接口：目标账号 0 条，关联审核申请 0 条，陈屿/李明/管理员保留；管理员数据仍有 22 条正式订单、43 条任务。
- 待审核事项按钮与订单管理使用相同组件配置及箭头；本次未重新执行管理员首页的按钮点击浏览器验收。
- TypeScript 与 Vite 构建通过（9.42 秒），仅原有大包提示；git diff --check 通过。
- 无部署、推送或 main/design-handoff 变更。
