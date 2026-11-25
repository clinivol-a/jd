# 新增岗位及空值占位修正

- 分支：codex/review-corrections-20261125。
- 修改前基线：e45986f39267473bb8bd9d903c552eb09144d537。
- 安全恢复分支：codex/backup-role-create-20261125-e45986f。
- 未Push、未部署，不修改main、design-handoff或冻结基线。

## 结果

1. 岗位管理标题行增加「新增岗位」主按钮，与新建医院复用相同标题区。实测两按钮同为x=2104、y=104、宽88、高32（同一浏览器视口）。
2. 新增及编辑共用原岗位弹窗。服务端生成稳定ROLE-ID，校验必填、名称唯一、管理员权限，保存状态及审计。注册及补正接受服务端启用目录项，不再仅允许写死的三个岗位键。
3. 新建岗位不自动授予业务权限。未配置工作区映射的岗位可提交申请，但管理员审核开通仍由原后端保护，本轮没有创建新角色工作台。
4. 管理端空字段使用半角`-`，修正列表、详情、附件信息与缺失日期的展示，0值保留；兼容旧长横线数据，不重写历史事实。未修改其他端口、全局日期Token或专业工作区。

## 实际验收

- 浏览器：新增弹窗打开、空名称必填提示、新增「医学工程师」保存、刷新保留，通过。
- HTTP：本地`/api/auth/roles`返回新增的稳定ID及名称，通过。
- 医院表格：三个缺失联系电话单元格均为U+002D字符`-`，无长横线，通过。
- TypeScript与Vite构建通过；保留既有大包警告，未扩展打包改造。
- 104项相关测试通过，含新增岗位持久化、重名拒绝、越权拒绝、注册待审核、不得自动授予工作区权限。完整结果见test-results.txt。
- 未通过浏览器重走注册设置密码及全部业务页面；岗位注册状态由隔离服务测试覆盖。

## 主要修改文件

- src/admin/AdminWorkspace.tsx、RolePanel.tsx：新增入口及表单。
- server/auth/roleDirectory.mjs、service.mjs、registrationRevision.mjs：创建、持久化及注册校验。
- src/admin/AdminTable.tsx、approvalDisplay.mjs、orderRules.mjs：管理端空值展示。
- AGENTS.md、design-system/ui-ux-consistency.md、docs/product/field-dictionary.md：规范同步。
- tests/institutions-roles-20261125.test.mjs、tests/admin-orders-20261124.test.mjs：新增及更新相关验证。

截图：role-created.png、hospital-empty-values.png。按钮实测数据：button-measurements.json。
本地预览：http://127.0.0.1:5260/。
