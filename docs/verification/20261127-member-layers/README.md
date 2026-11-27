# 成员配置四层分组与无专业岗位验收

日期：2026-11-27。工作分支：`codex/review-corrections-20261125`。

修改基线：`c8faa20ed3d0559b38233cfb8635ef0375b0bf60`。安全恢复分支：`codex/backup-before-member-layers-20261127`。本地隔离数据备份在 `.local/backup-member-layers-20261127/`，不提交账号或认证数据。

## 本轮结果

- 成员Drawer明确分为基本资料、岗位与角色、管理范围、功能权限四层。岗位与角色用独立选择器；具体功能仍使用原权限开关及申请、审核、撤销流程。
- 职业岗位保持工程设计师、销售、医生；没有专业岗位的管理成员明确显示“无专业岗位”，不猜定赵启明、许文清的职业。
- 角色为普通员工、业务组长、管理员。普通员工不能保存为无专业岗位；无岗位管理成员可以保留业务组长或管理员角色，不因此获得销售、三维重建或CAD能力。
- 区域组长配置移到成员管理标题行，医院管理不再重复展示入口。成员Drawer可维护负责区域，和原区域组长配置同源；保存校验成员与区域配置版本。
- 内部成员注册新增明确“无专业岗位”选项，仍需账号审核。审核通过但未授权管理角色时显示等待权限配置；服务端拒绝销售、设计师及管理业务访问。后续由有授权权限的管理员配置角色和范围。
- 外部组织不能使用无专业岗位申请来获取内部身份；管理角色不能通过注册参数自行申请。
- 既有岗位ID映射、账号ID、任务、工程及历史审计保留。现有组长登记没有被补写为已完成注册的真实账号；未来须绑定核准的真实成员账号。

## 实际浏览器检查

使用 Chrome、实际本地地址 `http://127.0.0.1:5260/`，不是公开地址。

| 项目 | 结果 | 证据 |
|---|---|---|
| 医院管理无区域组长配置按钮 | 通过 | 实际切换医院管理，标题行仅新建医院 |
| 成员管理显示区域组长配置 | 通过 | 按钮可打开原区域配置Dialog |
| 四层分组及岗位/角色/权限分离 | 通过 | [浅色Drawer](member-light.png)、[角色选项](role-options.png) |
| 无专业岗位和三个职业岗位选项 | 通过 | [岗位选项](position-options.png) |
| 赵启明无专业岗位、业务组长、合肥 | 通过 | 同角色、同区域保存成功，刷新后重开仍一致；未扩大访问权限 |
| 许文清无专业岗位、业务组长 | 通过 | 表格实际读取；区域Dialog保持其他15市配置 |
| 全局区域配置从成员管理打开 | 通过 | [区域配置](region-configuration.png)；取消关闭，未改历史分配 |
| 陈屿工程设计师、普通员工、本人专业权限 | 通过 | [陈屿成员Drawer](professional-member.png)，没有改动其配置 |
| Light/Dark当前成员Drawer | 通过 | [深色Drawer](member-dark.png)，完成后恢复浅色 |
| 无专业岗位从注册到批准、授权、进入工作台的全浏览器流程 | 未实际验证 | 完整服务层和真实HTTP测试通过，未在当前浏览器新建注册账号或设置密码 |
| 销售/工程师全部业务页面逐按钮回归 | 未实际验证 | 当前轮业务服务回归通过，相关UI目录Diff为空；不以此冒充全量浏览器验收 |

## 自动化验证

- TypeScript：`tsc -b` 通过。
- Vite：生产构建通过（8.30秒）；仍有既有大包警告，本轮未扩展为分包重构。
- 81项相关回归测试全部通过，0失败、0跳过；见 [测试结果](tests.txt)。
- 新增5项实质测试覆盖：无岗位注册及审核、外部组织/自报角色拒绝、区域持久化及冲突、显式移除岗位不残留专业权限、真实HTTP会话授权与越权拒绝。
- 初次回归有1项旧测试仍期待“-”，按本轮明确“无专业岗位”规则更新断言后，重新运行81项全部通过。
- HTTP测试使用临时目录与回环端口，实际校验未授权403、过期版本409、授权后区域范围及原会话权限更新，测试后清理临时数据。
- `git diff --check` 通过。
- React复核：新结果组件在模块顶层定义；角色/区域状态在成员版本更新后重置；提交有busy和版本保护；不引入轮询或全局CSS覆盖；入口显示不代替服务端权限校验。

## 修改文件

界面与数据契约：

- `src/admin/MemberAccessForm.tsx`
- `src/admin/AdminWorkspace.tsx`
- `src/admin/InstitutionForms.tsx`
- `src/admin/dataAuditRules.mjs`
- `src/auth/memberAccess.mjs`、`src/auth/memberAccess.d.mts`
- `src/auth/RoleSelect.tsx`
- `src/auth/AccountMenu.tsx`
- `src/auth/AuthPages.tsx`
- `src/auth/IntegrationRoot.tsx`
- `src/auth/client.ts`

服务端：

- `server/admin/memberAccess.mjs`
- `server/admin/presentation.mjs`
- `server/admin/service.mjs`
- `server/auth/roleDirectory.mjs`
- `server/auth/registrationSupport.mjs`
- `server/auth/registrationRevision.mjs`
- `server/auth/service.mjs`

规范与验证：

- `AGENTS.md`
- `design-system/ui-ux-consistency.md`
- `docs/product/field-dictionary.md`
- `docs/product/BUSINESS_DESIGN_V31.md`
- `tests/member-layers-20261127.test.mjs`
- `tests/roles-regions-20261127.test.mjs`（既有岗位显示断言同步）
- 本目录截图及测试、构建结果。

## 保护与边界

`src/App.tsx`、`src/projects/`、`src/cad/`、`src/sales/`、`src/index.css`、`src/design-system/` Diff均为空。Header、Sidebar和全局Token没有修改。

未执行部署、推送、合并；未修改main、design-handoff、冻结基线或历史Tag。正式首个管理员初始化、真实员工核验及企业认证仍属上线接入事项；本轮没有自动生成生产管理员账号。
