# 2026-11-25｜审核中心、医生档案与所属组织验收

当前分支：`codex/review-organization-20261125`。基线：`8e7ace214b4eee718c6a85ba5ba6da5ee8e28ad9`；安全恢复分支：`codex/backup-before-review-organization-20261125-8e7ace2`。修改前工作区干净，本地私有运行数据已另外备份至 `/private/tmp/clinivol-before-review-org-20261125-8e7ace2`，未提交账号凭据或短信验证码。

本报告与代码一同提交，完整修复提交可通过本分支 `git log -1 --format=%H` 查询。仅本地隔离服务验收：`http://127.0.0.1:5260/`，不是公开网址。未推送、未部署，未修改 main、design-handoff、V3.0 冻结基线或历史 Tag。

## 结果与修改范围

- 审核中心仅账号注册审核、医生档案审核、权限申请审核三个 Tab，默认账号注册。首页聚合记录按原 ID 进入正确分类；详情关闭会清理直达详情路由，避免刷新数据后重开。
- 三类 Drawer 使用 TDesign 固定 Header、滚动 Body、固定 Footer。同一「基本资料」Section 对齐首字段。医生三 Section 的 Gap 实测 **32px**，使用 `--td-comp-margin-xxxl`。
- 医生撤销退回先回待审核；停用与恢复调用同一目录服务，检查版本、资格有效性、医院及科室。销售医生资质详情仅通过 `showCertificate={false}` 隐藏证书编号，管理员保留；建档表单、原字段、附件及预览不改。
- 账号退回意见由受保护的当前申请人候选会话读取。原手机号重新验证后，同一账号修改资料、重新提交为待审核，不重复建号，不直接授权。管理员纠错与本人补充提交分别留事件。旧版本请求被拒绝。
- 权限当前列表只显示历史订单访问，其他旧申请保留底层；审核更新同一申请及现有有效范围，重复授权被版本检查阻止。示例使用隔离管理登记人员，不冒充正式生产权限服务。
- 注册不再读取静态 `demoOrganizations`，与管理员共用持久组织目录。支持新增、搜索、编辑、更名、启停、相关人员、新增申请核实；稳定 Organization ID 与历史名称快照分别保留。医院只通过显式 hospitalId 关联。
- 用户可见状态适配为审核术语，旧审批状态值、原事件身份和权限判断保留兼容。

## 实际浏览器流程及证据

### 账号审核闭环

浏览器使用明确的隔离账号 `review-account-1`（许安宁，手机号脱敏 `199****4101`）。初始申请由隔离样例初始化；**没有把初始化冒充浏览器新注册**。新账号从 `AuthService.register` 开始的完整闭环另由真实服务集成测试执行。

1. 管理员在浏览器审核退回，填写「请补充所属组织与销售岗位的关联资料。」。
2. 申请人用原测试凭据登录，页面显示该实际原因：[登录审核退回](login-actual-return-reason.png)。
3. 点击修改资料，重新验证原手机号；验证码读取本地后端实际生成记录，未在前端编造。
4. 选择管理员刚创建的组织：[同一目录实时选项](registration-live-organization-options.png)，重新提交后回到[账号审核中](account-resubmitted-pending.png)。
5. 管理员看到[同一申请的新资料](admin-resubmitted-same-account.png)，填写审核依据并通过；[通过详情](account-approved-final.png)没有重复审核按钮。
6. 原账号登录进入[销售工作台](applicant-approved-sales-workspace.png)。同手机号账号数量为 **1**，账号 ID 全程 `review-account-1`。
7. 管理员将组织更名后，[审核列表显示最新名称](organization-renamed-account-projection.png)，账号提交快照仍是更名前名称。来源与完整脱敏事件见 [actual-local-events.json](actual-local-events.json)。

### 医生审核与管理

- [待审核 Drawer](doctor-pending.png)：左右退回/通过操作；仅有已发生创建及提交事件。
- [审核退回 Drawer](doctor-returned-final.png)：显示实际意见及撤销审核退回。
- `ADM-D02` 实际执行退回撤销 → 待审核 → 根据书面依据审核通过，原退回事件与原因保留。
- `ADM-D04` 实际执行恢复 → 审核通过 → 停用，新增恢复/停用事件，不覆盖旧历史：[已停用](doctor-disabled.png)、[恢复后](doctor-restored.png)。
- [管理员已通过档案](doctor-approved-final.png)保留执业证书编号；[销售同一类资料详情](sales-materials-no-certificate.png)不显示该字段，附件与信息保留。
- 真实共享医生服务的销售可见退回意见、纠正历史、停用后新订单不可选、恢复及无效科室阻断，由 `institution-directory.test.mjs` 集成测试覆盖；**没有把隔离 ADM 示例误写成已在销售本地旧资料中同步**。

### 权限与组织

- `REVIEW-HISTORY-3` 浏览器执行重新审核 → 待审核 → 依据核验后通过；[退回](permission-returned.png)、[待审核](permission-pending-final.png)、[通过](permission-approved.png)。
- 被申请人 `ADM-M01` 的当前范围实际新增 `ADM-H02`，权限管理读取同一结果：[有效范围](permission-effective-scope.png)。原意见、重审原因和决定留底。初始已通过合成样例 `REVIEW-HISTORY-2` 使用已有效的 `ADM-H01`，不伪造尚未授予的范围。
- 浏览器新增组织，停用、再启用，然后更名；原账号组织 ID 未变。[组织创建](organization-created.png)、[关联真实测试账号](organization-related-actual-account.png)。
- 申请人提交「新安医学工程研究中心」，先处于[待核实申请](organization-request-pending.png)，管理员填写核实意见后才进入正式目录；未自助批准。
- [审核中心三个 Tab](three-review-tabs-final.png)。[最终账号待审核](account-pending-final.png)、[退回](account-returned-final-1440.png)、[通过](account-approved-final.png)。

## 实测尺寸与视觉检查

| 项目 | 实际结果 |
|---|---|
| 三类审核 Drawer 首字段顶部 | 均 **110px**；共用基本资料标题与字段布局 |
| Drawer Header 高度 | **56px** |
| Drawer Body Padding | **16px**，overflow-y:auto |
| 医生 Section Gap | **32px**，`--td-comp-margin-xxxl`；最初误取 xxl 的24px已修正 |
| 1366×768 Footer | top **703px**、bottom **768px**，Padding16px |
| 实际滚动后 Footer | Body.scrollTop **281px**，Footer仍在703px；末事件bottom687px，在Footer上方 |
| 账号操作列表头/按钮文字左起点 | **1222.4609375 / 1222.4609375px**（同视口） |
| 医生操作列表头/按钮文字左起点 | **1238 / 1238px** |
| 权限操作列表头/按钮文字左起点 | **1229.953125 / 1229.953125px** |
| 1366、1440、1920宽度 | 检查审核列表/代表 Drawer，无页面横向溢出；窄屏表格保留横向滚动 |
| Light / Dark | 实际切换检查，[深色1920截图](account-returned-dark-1920.png)；全局Token未修改 |

实际滚动截图：[短屏固定Footer](doctor-body-scrolled-fixed-footer.png)。关闭详情保留当前审核筛选；首页 `#admin/reviews/doctor/ADM-D05` 直达关闭后恢复 `#admin/reviews`。浏览器中还发现并修复关闭详情后 `isAccountApplication(null)` 报错，复测关闭正常。已重置临时浏览器视口覆盖。

## 32项验收

「通过（服务）」表示实际调用本地业务服务/集成测试，**不是额外宣称浏览器点击通过**。

| # | 验收项 | 结果 | 证据 / 方法 |
|---|---|---|---|
|1|待审核医生按钮正确|通过|ADM-D05 Drawer实点查看，左退回右通过|
|2|医生审核通过状态与历史|通过|ADM-D02纠正后按依据通过；原事件仍在|
|3|退回必填原因且销售可读|通过（服务）|真实目录创建→退回，salesSnapshot读取相同意见；管理员浏览器退回/纠正另已实测|
|4|误退回可撤销且历史保留|通过|ADM-D02浏览器操作；共享目录集成测试另覆盖权限与旧版本冲突|
|5|已通过档案可停用|通过|ADM-D04浏览器恢复后停用|
|6|停用后新订单不可选|通过（服务）|同Doctor ID从orderDoctors排除；原订单数量与关联不变|
|7|有效档案可恢复|通过|浏览器ADM-D04；服务验证无效资质、停用科室不能恢复|
|8|四状态Drawer结构与间距|通过|待审核、退回、通过、停用均查看；统一32px及固定Footer|
|9|注册组织共用目录|通过|管理员新增→申请人搜索选择同ID；服务验证停用不可选|
|10|初次注册后待审核|通过（服务）|调用实际AuthService.register创建新账号后验证pending；本轮未在浏览器新设密码完成首轮注册|
|11|管理员字段识别申请|通过|许安宁待审核、通过、退回详情与表头；组织更名投影|
|12|登录退回显示具体原因|通过|许安宁浏览器登录显示管理员实际意见|
|13|申请人修改并重新提交|通过|原手机号OTP、组织选择、Checkbox、提交后待审核|
|14|重新审核不丢失原关联|通过|同review-account-1，同手机号仅1条；事件导出证明|
|15|通过后正常进入工作台|通过|许安宁原凭据登录销售工作台|
|16|通过后无重复审核按钮|通过|许安宁/沈言通过详情核对|
|17|权限只展示历史订单访问|通过|当前列表与首页聚合过滤同一类型；旧类型底层保留|
|18|全部及状态筛选|通过|浏览器通过→全部切回；真实非空all选项，服务投影测试|
|19|通过后有效范围更新|通过|REVIEW-HISTORY-3通过，ADM-M01范围新增ADM-H02|
|20|退回意见可追溯|通过|Drawer实际原因，重审前后底层保留原意见和纠正事件|
|21|权限管理读取同一结果|通过|有效范围页面实看，不复制第二份申请|
|22|不重复授权或建记录|通过（服务）|版本过期/重复决定409；目标scope仅一份ADM-H02|
|23|三个Tab顺序/无第四Tab|通过|最终截图及首页直达实测；默认账号注册|
|24|表头与详情字段顺序|通过|账号、权限精确7列/6字段，退回才追加意见；医生原8项保留|
|25|Drawer顶部与间距统一|通过|三类首字段110px，Body16px，医生32px Gap实测|
|26|Footer固定Body滚动|通过|1366短屏实际滚动281px后Footer仍703px|
|27|操作列文字左对齐|通过|三表实测表头与按钮文字起点一致，未加位移|
|28|Light/Dark|通过|浏览器实际切换、截图，无全局Token变更|
|29|1366/1440/1920宽度|通过|代表列表/Drawer截图及DOM尺寸，无页面级溢出|
|30|Loading/Disabled/失败/取消/重复|通过（组合）|字段必填浏览器验证、服务器权限/版本/失效组织/重复请求测试；未人工断网测试全部路径|
|31|返回列表筛选分页上下文|通过|关闭Drawer保留原筛选，现有AdminTable不卸载；首页直达关闭清理详情路由|
|32|登录/销售/管理员状态一致|通过（组合）|账号真实浏览器闭环；共享医生销售/管理服务同ID测试；李明详情与陈屿工作台回归|

## 测试与冻结差异

- 120项审核、组织、认证、医生、跨角色业务集成及HTTP测试通过，0失败、0跳过。命令使用锁定本地Node与现有依赖，不重新安装或联网更新依赖。
- TypeScript `tsc -b` 与 Vite build 通过。Vite保留现有较大chunk提示，不代表构建失败；未为消除警告改动无关模块。
- `git diff --check`通过。
- 对比8e7ace2：设计师 `src/App.tsx`、`src/projects`、CAD与其他专业工作区、GlobalHeader、全局tokens及index.css、SalesWorkspace及OrderPages均无Diff。本轮销售仅DoctorCredentials的显示配置，以及受配置控制的DoctorMaterials公共组件。
- 规范更新到 `design-system/ui-ux-consistency.md`、`design-system/component-rules.md`、`docs/product/field-dictionary.md`，修正旧四Tab、审批术语与已处理全部只读的冲突，补充组织ID、状态闭环和演示历史边界。

## 实际修改文件

- 管理端：`src/admin/AdminWorkspace.tsx`、`OrganizationPanel.tsx`、`approvalDisplay.mjs`及类型、`reviewRules.mjs`、`model.ts`、`admin.css`。
- 注册/账号：`src/auth/AuthPages.tsx`、`OrganizationSelect.tsx`、`client.ts`、`passwordPolicy.ts`；`server/auth/organizationDirectory.mjs`、`registrationRevision.mjs`、`registrationSupport.mjs`、`service.mjs`、`http.mjs`。
- 医生：`src/doctors/DoctorDetails.tsx`、`src/sales/DoctorCredentials.tsx`；`server/unified/institutionDirectory.mjs`。
- 服务/样例：`server/admin/service.mjs`、`reviewExamples.mjs`。
- 测试：新增`tests/review-organization-20261125.test.mjs`，扩充`institution-directory.test.mjs`，更新受新确认规则影响的admin-service/admin-review-20261124/auth-targeted/doctor-review-consistency/institution-scope测试。
- 三份规范、此验收目录截图与脱敏事件，以及`diff-summary.txt`。

## 边界与未实际验证

- 全部认证、组织维护、审核与验证码仍为隔离本地服务，不是生产认证/短信/医院主数据接口。本轮未部署或暴露管理接口。
- 医生岗位正式工作台未接通，审批服务会拒绝开通该岗位；不以通过状态冒充已有医生业务能力。
- 原账号如仅有旧department字符串而无可靠organizationId，保留原始事实，不按名称猜测关联。当前目录中存在历史独立同名医院组织，保留各ID，需管理员核实后明确合并/关联，不能自动按名称去重。
- 账号首轮注册UI的新密码设置本轮未手动重新执行；从实际服务注册起的测试通过，浏览器从预置待审核账号开始，完整执行真实退回、登录原因、手机复核、修改重提、核准和登录。
- 没有人工断网穷举每一个Dialog，也没有把全部模块每个像素都声称重新验收。冻结的专业工作区未重做功能压力测试，只核对Diff不变并回归陈屿工作台。
- 未删除任何既有医生/账号/审核历史；合成样例新增拥有独立稳定ID与来源，读操作和重启不重新生成已处理事件。私有密码文件、短信收件箱、设备Token和运行数据均未纳入交付提交。
