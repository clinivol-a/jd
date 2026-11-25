# 机构目录、岗位配置及宽表修正验收（2026-11-25）

工作分支：`codex/review-corrections-20261125`。修改前HEAD：`feee628a97251b5abc0cbaaa3d559861155cc8af`。
安全恢复分支：`codex/backup-institutions-roles-20261125-feee628`。私有本地运行数据已独立备份，不加入Git。
本地预览：http://127.0.0.1:5260/ 。未Push、未部署。

## 八项修正

| 要求 | 完成情况与验证 |
| --- | --- |
| 宽表前三列和最后一列固定 | 管理员AdminTable及销售Grid统一按列顺序设置fixed；设计师审核、最近项目/通知列表及销售附件、医保宽表补齐缺失固定配置。项目/任务表原有正确配置保留。只改列固定属性，未重排业务字段。 |
| 申请岗位后台配置 | 新增机构与人员→岗位管理，维护现有三类岗位名称/启停。服务端持久化目录，注册及退回补正共用启用选项；管理员审核前再校验。未新增任意岗位/工作区或放宽授权。 |
| 医院表格、筛选及详情 | 表头为医院/区域/联系电话/当前负责组长/关联医生/当前状态/操作。筛选为医院/区域/当前状态。详情只保留基本资料、科室、关联医生；未删除底层订单或审计。 |
| 医院编辑与按钮层级 | 删除修改原因；浏览器实际保存成功。编辑医院为Primary Base，停用医院为Default Outline；停用仍保留确认及原因。 |
| 科室新增/编辑 | 两个弹窗均不再出现操作原因。浏览器查看两种表单，隔离服务测试实际完成无原因创建及编辑，停用无原因仍拒绝。 |
| 医院名称颜色及对齐 | 名称使用中性正文文本，不套品牌按钮。表头与首行名称的实际文字起点均为272px，正文颜色rgba(0,0,0,0.9)。 |
| 组织目录 | 筛选依次组织名称/组织类型/当前状态，行操作仅编辑。新增组织位于标题行；新增组织申请入口已从管理员目录移除，历史申请数据保留。编辑无修改原因并实际保存成功。 |
| 移除医生管理 | 机构与人员只有组织目录/医院管理/人员管理/岗位管理。审核中心医生档案审核及医院关联医生保留。 |

## 浏览器实测证据

- 管理员订单宽表：实际拖动横向滚动条，scrollLeft由0变为421px。前三列X始终为248、403、603；最后操作列X始终为1562。中间科室列X由803变为382，证明中间列确实滚动。
- 医院列表字段顺序、全部及安徽16市筛选选项、医院详情三个模块、医院/科室/组织编辑弹窗均已在浏览器核对。
- 医院编辑、组织编辑、岗位编辑均已通过界面保存到本地后端；仅保存原有值，不篡改既有业务数据。
- 新增组织弹窗已打开并取消；没有为了验收添加无关正式组织。
- 岗位Light/Dark截图已保留，主题已恢复浅色。默认桌面视口完成点击验收；1156px视口核对过医院表格布局。
- 未逐一对所有业务表执行完整浏览器滚动回归；统一渲染函数、直接列配置与冻结列规则测试已核对。未通过浏览器重走完整新注册密码流程；岗位注册/补正/审核校验及HTTP接口由自动测试覆盖。

## 数据及权限边界

- 历史医院若仅记录“安徽”，保留该值，不猜测具体城市；在对应城市筛选下不会伪造匹配。历史联系电话缺失的保留空值。
- 岗位目录维护现有designer/sales/doctor稳定键的显示名称及启停。岗位名不等于已授予权限；不会因为改名就开通新工作区。医生工作区仍保留既有未接入边界。
- 医院和科室权限继续按稳定ID、当前版本校验，安徽省级管理授权支持省内各市；无其他省份扩权。
- 医院、科室及组织取消原因输入后仍写入操作人、时间、before/after和版本；停用/恢复等原有原因要求未放宽。
- 机构与人员移除医生管理是入口调整，不删除医生档案、审核历史或订单关联。

## 验证

- TypeScript `tsc -b`：通过。
- Vite构建：通过，保留既有大包警告；没有借本轮做打包重构。
- 相关自动测试：118项全部通过，见test-results.txt，覆盖管理员、机构目录、注册/扫码/账号会话、组织补正、岗位配置及HTTP、共享业务、跨角色表格规则、邀请流程。
- 新增6项聚合测试覆盖固定列、区域筛选、省市授权、无原因编辑、审计/停用保护、岗位权限/版本/持久化和注册接口选项。
- main、design-handoff、design-handoff-v2保持原SHA，专业工作区、Header、全局CSS及Token无Diff。设计师端仅补齐表格固定列属性。

## 截图

- [医院列表](hospitals.png)
- [医院详情](hospital-detail.png)
- [医院编辑](hospital-edit.png)
- [新增科室](department-new.png)
- [组织目录](organizations.png)
- [组织编辑](organization-edit.png)
- [岗位管理](roles.png)
- [岗位编辑](role-edit.png)
- [岗位深色模式](roles-dark.png)
- [宽表实际横向滚动](orders-scrolled.png)
- [固定列测量数据](fixed-columns.json)

## 修改文件

- `AGENTS.md`
- `design-system/component-rules.md`
- `design-system/ui-ux-consistency.md`
- `docs/product/field-dictionary.md`
- `server/admin/service.mjs`
- `server/auth/http.mjs`
- `server/auth/organizationDirectory.mjs`
- `server/auth/registrationRevision.mjs`
- `server/auth/registrationSupport.mjs`
- `server/auth/service.mjs`
- `server/unified/institutionDirectory.mjs`
- `src/App.tsx`
- `src/admin/AdminTable.tsx`
- `src/admin/AdminWorkspace.tsx`
- `src/admin/InstitutionForms.tsx`
- `src/admin/OrganizationPanel.tsx`
- `src/admin/approvalDisplay.mjs`
- `src/admin/model.ts`
- `src/auth/AuthPages.tsx`
- `src/projects/DashboardLists.tsx`
- `src/sales/OrderPages.tsx`
- `src/sales/SalesWorkspace.tsx`
- `src/sales/business/InsuranceSummary.tsx`
- `server/auth/roleDirectory.mjs`
- `src/admin/RolePanel.tsx`
- `src/admin/institutionRules.mjs`
- `src/admin/institutionRules.d.mts`
- `src/auth/RoleSelect.tsx`
- `tests/institutions-roles-20261125.test.mjs`

另附本目录验收报告、截图和测试日志。
