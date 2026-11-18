# V3.7 医生档案详情及资质记录｜本地交付与验收

日期：2026-11-18。工作分支：`feature/a-v3.1-business-design`。安全恢复点：`backup/before-doctor-v37-20261118` → `e895e88caf5dca3f092bedcd4a00d3891077f83e`。原有未跟踪截图保持原样，未清空业务数据。

本地预览：http://127.0.0.1:5210/?build=20261118-doctor-v37 。李明 → 客户管理 → 医生详情。不是公开地址；本轮没有部署、推送或更新交付分支。

## 实施结果

### 来源与安全迁移

基本资料只显示“销售建档”“医生自主建档”。历史原始来源、邀请码、邀请销售仍保留底层；新增邀请导入分开保存`submissionMode/submittedBy/invitationCode/invitedBy`，不把邀请当正式销售归属。

隔离预置记录：

| 顺序 | 稳定ID | 姓名 | 医院 | 电话展示 | 建档来源 |
|---|---|---|---|---|---|
| 1 | D-1 | 林致远 | 江淮协同医院 | 199****1001 | 销售建档 |
| 2 | D-2 | 周明哲 | 皖中康复医院 | 199****1002 | 医生自主建档 |

只迁移D-2的完整合成指纹（ID、姓名、手机号、医院、DEMO证书），且不得有任何非fixture用户事件。只修正对应合成来源、提交身份及已标记的合成文件元数据；不改已有真实资料或上传文件。已有编辑记录或不匹配时跳过，用户数据优先，不强求每个已编辑浏览器仍展示此预置组合。迁移重复运行不继续改变数据。原有已审核的正式归属不受来源改变影响；实际邀请测试档案仍为“待关联”。

### 资质材料与预览

身份证明、执业证明材料、其他附件复用基本资料的`project-info-grid`，实测Label→Value **5px**，字段组垂直Gap **20px**，正文 **14px/22px**。文件名为品牌色普通span；提交信息4px后紧凑排列，预览操作紧邻信息、8px间距，中性正文色、Pointer、键盘Focus；无下载、无文件名Hover按钮底色。其他附件为空显示正常正文色“暂无附件”，无大型Empty。

新增只读资质组件，PDF按页渲染为PNG，图片/文本也可只读预览；服务端邀请文件使用拥有者授权的`file-preview`接口，原`file`接口对销售返回403；预览不返回原PDF，不嵌入带下载工具栏的PDF iframe。`.local`路径由开发中间件拒绝直接访问。新增`pdfjs-dist`与`@napi-rs/canvas`用于浏览器/服务端PDF渲染，锁文件同步；仅在需要预览时加载PDF浏览器模块。当前锁定PDF依赖要求Node >=22.13.0或Node24，本轮在Node24环境验证；未来部署须先核对运行时，本轮未修改任何线上运行时设置。

**权限边界/遗留问题：** 邀请服务端文件的原始下载已阻断并验证；销售此前自行上传的文件仍保存在本机IndexedDB，浏览器持有原始Blob，不能声称服务端已控制这一部分。UI不提供下载，但本机开发者工具仍可能取出原数据。正式上线前，须把这些文件迁移到服务端私有文件存储，并以真实医生档案权限/归属校验、衍生预览和原文件下载ACL统一管理。当前预览可截图/保存衍生图片，不承诺DRM。既有公开演示未更新，原有在线环境不自动获得本轮接口限制。

### 审核记录

显式事件名称：医生档案已提交审核、医生档案审核通过、医生档案审核退回、医生档案已重新提交审核。历史事件仅做展示映射，不改真实ID、操作人、原始时间及原文。

通过无备注：系统记录“审核通过”，`reviewNoteSource=system-default`；真实填写备注为`reviewer`，保留实际文本。旧合成预置默认内容不冒充人工意见。退回非空原因继续强制校验，显示“退回原因：实际内容”；历史缺失原因显示“退回原因未记录”，不补造。重新提交形成新事件，旧退回保留。医生操作记录用具体完整日期时间，最新在上；订单等其他记录保持原逻辑。

管理员规划在现有`docs/product/BUSINESS_DESIGN_V31.md`的“管理员工作台｜后续业务需求”下追加D节，十项资质审核规则全部标为“待管理员端设计阶段实施”，保留原A/B/C、停用恢复、归属变更、历史访问、分享审计、数据资产/授权导出及日志规划。没有新增管理员页面或正式审批API。

## 32项验收

| # | 项目 | 结果 | 证据/边界 |
|---|---|---|---|
| 1 | 建档来源仅两种规范名 | 通过 | 来源共享映射及浏览器D-1/D-2 |
| 2 | 前两条预置来源不同 | 通过 | fresh隔离账号前两行稳定、两详情截图；用户编辑过的指纹不强改 |
| 3 | 自主建档邀请来源正确 | 通过 | invitedBy与submissionMode保留；服务端邀请记录导入显示自主建档 |
| 4 | 来源不覆盖正式归属 | 通过 | D-2原owner保留；实际邀请档案显示待关联；单元测试 |
| 5 | 身份证明Label/Value间距 | 通过 | 实测5px，与基本资料相同 |
| 6 | 执业证明Label/Value间距 | 通过 | 实测5px |
| 7 | 其他附件Label/Value间距 | 通过 | 实测5px |
| 8 | 三组组间距一致 | 通过 | 同一grid row-gap20px |
| 9 | 文件名绿色普通文本 | 通过 | span、brand色、无按钮交互 |
| 10 | 文件名Hover不变化 | 通过 | 前后矩形/颜色/背景/Padding快照相同，cursor default |
| 11 | 提交信息简洁真实 | 通过 | 文件元数据“李明/周明哲 · 11-09 08:00 提交”；缺项不补造 |
| 12 | 文件及信息左对齐 | 通过 | 同一dd自然文档流，预览紧邻信息；截图核对 |
| 13 | 资质附件下载UI移除 | 通过 | 三类详情只读组件，页面无下载按钮 |
| 14 | 普通销售不能从原下载接口取文件 | 待服务端能力 | 邀请服务端原file接口403、他人预览404、未登录403已通过；浏览器IndexedDB旧文件尚无服务端ACL，见权限边界 |
| 15 | 预览正常 | 通过 | 本地PDF、服务端PDF、服务端图片及其他附件实际打开；PNG衍生结果非原PDF |
| 16 | 预览Pointer/Focus无多余Hover | 通过 | 中性文字、背景透明、Hover无位移，键盘可见outline |
| 17 | 无其他附件黑色文字 | 通过 | 实测与基本资料Value同色rgba(0,0,0,.9) |
| 18 | 无附件不使用大型Empty | 通过 | 资质组件内无t-empty |
| 19 | 审核通过事件正确 | 通过 | 实际显示医生档案审核通过 |
| 20 | 审核退回事件正确 | 通过 | 实际显示医生档案审核退回及原原因 |
| 21 | 无备注系统默认结果 | 通过 | 通过事件内容审核通过、data-note-source/system-default与单测 |
| 22 | 有备注保留原文 | 通过 | 真实记录展示映射及测试审批非空备注原文断言 |
| 23 | 退回原因必填 | 通过 | 既有隔离审批transition拒绝空原因；普通销售审批被拒。正式管理员服务仍待后续实施 |
| 24 | 最新事件在上 | 通过 | 重新提交→原退回→首次提交→创建，按原始时间戳排序 |
| 25 | 重提保留旧历史 | 通过 | 实际点击重新提交后旧退回仍存在；原事件deepEqual |
| 26 | 管理员规划补充 | 通过 | 现有规划D节追加，旧A/B/C未覆盖 |
| 27 | 关联订单Card未改 | 通过 | 与恢复点关联订单Card源码逐字一致 |
| 28 | 销售其他功能无回退 | 通过 | 销售首页/订单入口烟测及51项销售相关测试；不是所有销售流程重新全量验收 |
| 29 | 陈屿工程师无回退 | 通过 | 切换账号、五统计卡、三维重建与CAD Canvas入口；工程师业务源码未改 |
| 30 | Light/Dark | 通过 | 两主题实际截图，使用现有Token |
| 31 | TypeScript/Vite | 通过 | tsc -b + vite build，保留既有大chunk警告 |
| 32 | 未部署 | 通过 | 无部署或push；main/design-handoff/V3.0引用未变 |

本次未验证真实医疗机构资质审核服务、正式私有对象存储、真实管理员审批后台、公开网站或手机移动网络；这些不在本轮开发范围，不报为生产能力。

## 验证与截图

51项相关Node测试通过；包括来源迁移、已编辑资料保护、退回强制原因、默认/人工备注、原审计保留、PDF栅格化、原下载拒绝及他人/未登录访问拒绝。浏览器为实际Vite UI + 隔离AuthService、邀请及业务HTTP服务，不使用假成功响应。账号及演示文件全部为受控合成数据，没有操作用户现存浏览器资料。

- [客户管理前两条](screenshots/01-first-two-doctors.png)
- [第一条销售建档基本资料](screenshots/02-sales-source-basic.png)
- [第二条自主建档基本资料](screenshots/07-self-source-basic.png)
- [资质材料排版](screenshots/03-qualification-fields.png)
- [无其他附件](screenshots/04-no-other-attachment.png)
- [本地PDF只读预览](screenshots/05-local-pdf-preview.png)
- [服务端授权PDF预览](screenshots/10-server-pdf-preview.png)
- [通过默认结果](screenshots/06-approval-default.png)
- [审核退回及原因](screenshots/08-return-reason.png)
- [重新提交保留历史](screenshots/09-resubmit-history.png)
- [深色资质材料](screenshots/11-dark-credentials.png)
- [浏览器逐项断言及实际间距](browser-results.json)

## 修改文件

- `src/sales/SalesWorkspace.tsx`：来源展示、邀请原始来源字段独立保存、资质组件接入、医生事件展示。
- `src/sales/DoctorCredentials.tsx`、`doctorPreview.ts`：只读字段排版和图片/PDF预览。
- `src/sales/doctorRecordRules.mjs/.d.mts`：来源、事件名称/意见映射及指纹保护迁移。
- `src/sales/doctorFixtures.mjs`、`migrate.ts`：仅隔离预置来源/提交身份、安全迁移入口。
- `src/sales/model.ts`：附件/来源/备注来源字段及明确审核事件，保留既有权限和历史。
- `src/sales/files.ts`、`SalesAttachments.tsx`：合成文件存储身份与实际提交人分离、邀请文件预览适配、资质下载防护；外部邀请自有文件预览仍用既有load，不改邀请注册流程。
- `src/sales/sales.css`：仅医生资质作用域样式。
- `server/doctor-preview.mjs`、`server/sales-demo.mjs`：衍生预览、原文件下载拒绝与本地存储路径保护。
- `package.json`、`pnpm-lock.yaml`：PDF与Canvas渲染依赖。
- `tests/doctor-v37.test.mjs`、`tests/sales-invite.test.mjs`：新增规则/权限测试，旧原文件可下载断言按新规则改为403。
- `design-system/ui-ux-consistency.md`、`docs/product/field-dictionary.md`、`docs/product/BUSINESS_DESIGN_V31.md`：本轮规则及未来管理员要求。
- 本目录：验收结果及截图。

## 同日补充确认：两处展示精简

以上为V3.7首次交付的历史验收；以下补充规则替代首次版本的独立“预览”操作和第三行审核意见展示，其余数据、权限及迁移规则不变：

- 文件名与提交人/时间放在同一行，只有文件名为品牌绿；文件名是可键盘操作的文字按钮，Pointer、点击后打开原只读预览，不另放“预览”文字。
- 操作记录固定为标题与时间/操作人两行。系统默认“审核通过”不再重复显示；退回原因紧接第二行操作人，不显示“退回原因：”前缀。实际人工备注仍保留，数据中的意见、默认结果及来源标记不删除。
- 浏览器实测：同行布局、仅文件名绿色及Pointer、点击PDF预览、通过两行、退回原因同行均通过。TypeScript/Vite构建通过，未部署。
- [文件与提交信息同行](screenshots/12-inline-qualification.png)、[通过两行](screenshots/13-approval-two-lines.png)、[退回两行](screenshots/14-return-two-lines.png)、[断言结果](compact-results.json)。
