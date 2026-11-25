# V3.8 医生档案、关联订单与管理员审核验收

日期：2026-11-25。仅本地修改、调试、测试，无 Git Push 或线上部署。

- 基线：`a1a8e1b567685baea586e1c70b72807bca4054ea`。
- 安全分支：`codex/backup-before-doctor-review-20261125-a1a8e1b`。
- 工作分支：`codex/doctor-review-consistency-20261125`。
- 本地入口：<http://127.0.0.1:5260/>。仅本机访问，最终 HTTP 检查为 200。
- 浏览器使用隔离的 `.local/institution-preview-20261124` 数据副本；测试新增资料均为合成资料。未清空既有业务数据。

## 修改前后

| 问题 | 结果 |
| --- | --- |
| 医生详情下方内嵌订单按视口剩余高度变成每页 1 条 | 显式固定 6 条；20 条实测为 6/6/6/2，4 页；小于等于 6 条隐藏页码导航 |
| 进入订单后丢失医生及页码上下文 | 返回原 Doctor ID，实测返回第 4 页；返回文案按来源显示 |
| 医生表头依赖事后排序、归属取当前查看者、更新时间取数组首项 | 共享显式字段配置；正式 salesId 关联；有效时间戳取最大值 |
| 销售与管理医生资料、资质和历史分别渲染 | 共享字段语义、材料组件、两行时间轴；按稳定 Doctor/File/Event ID 关联与去重 |
| 销售退回后重新提交只改本地状态 | 实际调用目录保存与提交接口，保留历史、版本检查及提交 Loading 防重入 |
| 管理员材料预览只有静态提示 | 使用经过授权的栅格预览接口，支持加载、失败重试和多页；不暴露原文件下载入口 |
| 审核按钮在滚动内容尾部 | 使用 TDesign Drawer footer，Header/Footer 固定、Body 独立滚动 |
| 非待审核重复审核、多模块重复审批 | 审核中心统一四类视角；机构管理通过同 ID 入口进入审核；权限管理移除重复审批列表 |
| 专业成果监管混入可执行审批 | 移至数据资产，只读监管，不授予专业审核资格 |

## 实际跨角色链路

以下均为本地浏览器操作，不是截图注入或只改前端状态。

1. 李明新建沈知衡档案，上传两张合成证明图片并提交。
2. Doctor ID：`D-7fa2ee21-dbb9-4da7-b7b7-0988b1747cf3`。医院、科室均采用实际稳定 ID。
3. 周景明在审核中心找到同一档案；空退回原因被阻止，填写「请补充清晰的执业证明照片。」后退回。
4. 李明刷新看到真实退回结果，重新提交；管理端同一档案恢复待审核。
5. 空书面审批依据被阻止；填写本地验收依据后审核通过，不填写可选备注。
6. 销售与管理员均看到同样的 5 条事实：创建、提交、退回、重新提交、通过。默认通过说明没有重复展示，原退回意见保留。
7. 李明使用已通过的沈知衡创建订单，保存草稿、上传合成影像、正式提交。
8. Order ID：`SO-28e6f919`；正式编号：`CV-2026-0022`；状态：待审核；Doctor ID 与上述档案相同。
9. 医生关联订单从 0 变为 1，小于 6 条不显示页码导航。管理员订单列表查到同一编号、医生、医院及手术项目名称。

原始关联证据见 [evidence.json](evidence.json)，不包含认证凭据、验证码或患者证件号。

## 浏览器验收结果

「通过」表示本轮实际浏览器验证；服务端测试和未验证另列，不相互替代。

| 项目 | 结果及证据 |
| --- | --- |
| 医生 20 条关联订单 4 页 | 通过；每页最多 6 条，第 4 页 2 条；[截图](linked-orders-page4.png) |
| 查看订单后返回原医生与页码 | 通过；D-1 第 4 页上下文恢复 |
| 小于等于 6 条隐藏导航 | 通过；新医生 1 条关联订单无页码导航；[截图](new-linked-order.png) |
| 销售医生列表 10 列及顺序 | 通过；[截图](sales-customers.png) |
| 销售基本资料 9 字段、三列布局 | 通过；[截图](sales-doctor-fields.png) |
| 管理员审核列表 9 列及顺序 | 通过；[截图](admin-doctor-table-final.png) |
| 管理员同 ID 的 8 字段及三个标题 | 通过；[截图](admin-pending-drawer.png) |
| 材料同一行、绿色文件名、正文提交信息 | 通过；实际计算色文件名 rgb(13,122,93)，提交信息 rgba(0,0,0,.9)；空附件为普通文案 |
| 销售与管理员文件实际预览 | 通过；[销售](sales-file-preview.png)、[管理员](admin-file-preview.png)，图片实际尺寸 640×360 |
| 两行时间轴、全日期、真实操作者、去重 | 通过；[销售](sales-approved-history.png)、[管理员](admin-approved-history.png)，同 ID 5 条事件 |
| 空退回原因与空书面审批依据校验 | 通过；未提交非法审核，填写后真实更新 |
| 待审核按钮主次、已通过/退回不重复审核 | 通过；待审核退回为次操作、通过为主操作；非待审核审批页无重复按钮 |
| 无审核权限的浏览器账号 | 未实际验证；服务端权限测试通过，前端依据权限不呈现操作 |
| Drawer 矮视口固定 Footer 与底部记录可见 | 通过；1366×640：Header 0–56，Body 56–575，Footer 575–640；Body 滚至 469，Footer 不动；[顶部](admin-short-footer.png)、[底部](admin-scrolled-footer.png) |
| 1366/1440/1920 桌面宽度 | 通过；Drawer 宽 680px，Body 无水平溢出；[1366](admin-1366.png)、[1440](admin-1440.png)、[1920](admin-1920.png) |
| 销售医生详情三个宽度 | 通过；主内容无水平溢出，关联订单 pageSize=6 |
| Light / Dark | 通过；[管理员表格](admin-table-dark.png)、[抽屉](admin-drawer-dark.png)、[销售](sales-doctor-dark.png) |
| 审核中心四个 Tab | 通过；聚合视角、医生、账号、权限入口均存在 |
| 账号/权限审批固定 Footer | 通过；Body 内审批按钮数均为 0，操作位于 Footer；[账号](account-approval-footer.png)、[权限](permission-approval-footer.png)；未执行与本轮医生链路无关的审批决定 |
| 权限管理无重复业务审批 | 通过；当前权限与权限变更记录；[截图](permissions-current.png) |
| 机构医生已通过状态管理 | 通过；管理场景只显示合法停用操作，不呈现重复资质审批 |
| 机构待审核入口跳审核中心同 ID | 未实际点击验证；已实现同 ID 路由定位，未另建审批数据 |
| 人员详情 Drawer | 通过；打开人员信息和权限，未执行无关授予/撤销 |
| 数据资产专业成果监管 | 通过；打开只读详情，未执行专业审核 |
| 管理员医院内嵌表格 | 通过；H-A 的 19 条订单固定 6 条、4 页；[截图](admin-hospital-embedded.png) |
| 销售医院内嵌表格 | 未实际验证；同样显式固定 6 条，当前验收销售账号没有医院目录查看权限，未绕过权限 |
| 分页/筛选/返回/关闭/取消 | 通过；医生页第 4 页返回、管理员编号搜索、抽屉与预览关闭/取消已操作 |
| 操作文字左对齐 | 列配置与局部既有按钮样式已核对，截图无明显错位；未记录表头/按钮文字起点的数值测量，不将数值精确对齐报为已测 |
| 双角色刷新及切换 | 通过；审批各步骤均切换既有账号并重新读取目录，新订单同时可查 |
| 服务重启后持久化、并发与越权 | 服务端自动测试通过；未在最终浏览器会话再次重启以免无必要打断预览 |
| 设计师及专业工作区 | 本轮源代码 Diff 为零；相关业务自动回归通过；未重新做专业工作区全量浏览器验收 |

## 数据保护与实现边界

- 所有新操作使用同一机构目录及其文件、事件记录。未为销售和管理员各制造一份新医生副本。
- 仅补齐 5 个可明确识别的、未编辑的旧合成种子桩：D-1、D-2、D-26-1、D-26-5、D-26-9；资料与历史来自基线已有销售合成数据，不编造实际医生或新的审核动作。预览使用隔离合成文件。
- 名称、版本、手机号或历史显示已被用户修改的记录不强制覆盖；浏览器人工编辑资料也有保护测试。
- 其他仅存在旧浏览器存储且尚未进入共享目录的历史医生，本轮没有自动认定并迁移为正式共享档案。此类数据的可信合并仍需逐笔核对；不能声称全部旧浏览器数据已完全贯通。
- 普通销售和无医院范围的账号，读取其他医生文件会被服务端拒绝；没有仅靠隐藏按钮冒充授权控制。
- 本地目录、授权预览及合成测试不等同于正式实名认证、正式医院系统或生产文件存储。
- 本轮不开发管理员新模块、不改认证、不修改 Token，不清空数据。

## 构建与测试

- TypeScript：`node node_modules/typescript/bin/tsc -b`，通过。
- Vite：`node node_modules/vite/bin/vite.js build`，通过，7.80 秒。现有超过 500kB 的 chunk 提醒仍在；本轮未为消除提醒重构业务包。
- 相关测试 **82 项通过、0 失败、0 跳过**，含医生统一字段/历史、目录审核、文件授权、管理权限、订单联动、销售及认证回归。
- 并发版本冲突、审批依据、真实退回原因、持久化、重复读取不新增事件均有测试。
- `git diff --check` 通过。
- 日志：[tests.log](tests.log)、[build.log](build.log)。

## 修改文件与 Diff 范围

- `src/doctors/doctorDisplay.mjs`、类型声明、`DoctorDetails.tsx`、`doctorDetails.css`：统一字段、材料与时间轴。
- `src/doctors/DoctorMaterialPreview.tsx`：授权栅格预览。
- `src/sales/SalesWorkspace.tsx`、`DoctorCredentials.tsx`、`model.ts`、`sales.css`：医生字段、固定内嵌分页、真实重新提交及共享展示。
- `src/sales/OrderPages.tsx`：仅增加可选返回文案，默认值不变。
- `src/admin/AdminTable.tsx`、`AdminWorkspace.tsx`、`admin.css`、`model.ts`、`reviewRules.mjs` 及类型声明：内嵌分页、统一审批聚合、Drawer、模块职责调整。
- `src/business/unifiedClient.ts`：真实归属映射及保护已人工编辑的本地资料。
- `server/unified/institutionDirectory.mjs`、`doctor-fixture-details.json`、`server/admin/service.mjs`：真实事件、审核依据、授权数据投影及受控合成种子补齐。
- `tests/doctor-review-consistency.test.mjs`、`institution-directory.test.mjs`、`unified-business-http.test.mjs`：直接相关验证。
- `design-system/ui-ux-consistency.md`、`component-rules.md`、`docs/product/field-dictionary.md`：原位修正冲突条款。
- 本目录：截图、关联证据、日志、验收结果及完整补丁。

冻结检查：`src/App.tsx`、`src/auth`、`server/auth`、`src/projects`、`src/cad`、`src/design-system`、`src/index.css`、`src/PageBack.tsx`、`src/WorkspaceTaskActions.tsx` 相对基线无 Diff；没有修改 Header、Sidebar、设计师业务与专业工作区。

`main`、`design-handoff`、`design-handoff-v2` 的引用保持原值；无历史 Tag 改动。实现提交请以本工作分支的提交记录为准，安全恢复点始终是上述基线分支。
