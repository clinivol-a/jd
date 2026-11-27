# CliniVol A V3.8 全模块开发交付

日期：2026-11-27。本文件是本次交付入口，优先于 11 月 4 日 V1、11 月 23 日 V2 文档中的范围和状态说明。旧版本、旧分支和历史文档保留。

## 版本与获取

- 仓库：<https://github.com/clinivol-a/jd>
- 本次分支：`codex/developer-handoff-20261127`
- 固定版本：`dev-handoff-20261127`。用 `git rev-parse dev-handoff-20261127^{commit}` 获取完整交付 SHA。
- 功能源码起点：`35befca0959dda1e62f8dec29b8c8e95907760e1`。本次提交只整理交付说明与本分支禁止自动部署的配置，没有重新实现业务。
- 开发以固定 Tag 为参照；不要用整个原型覆盖已经开发的业务系统，应按模块评估并合并。

```sh
git clone --branch codex/developer-handoff-20261127 https://github.com/clinivol-a/jd.git
cd jd
git switch --detach dev-handoff-20261127
```

GitHub Release 同时提供带顶层目录的源码 ZIP 和 SHA-256 校验文件。ZIP 包含当前所有受 Git 管理的源码、配置、锁文件、规范、测试、演示资源与验证记录；不包含 `.git` 历史、node_modules、dist、`.local`、`.env*`、本机账号凭据、会话和私有附件。

## 启动

使用 Node.js 24、package.json 声明的 pnpm 11.25.0、TDesign React 1.18.4 和仓库锁文件。

```sh
pnpm install --frozen-lockfile
CV_DEV_PORT=5260 CV_AUTH_PORT=5261 pnpm admin:dev
```

访问 <http://127.0.0.1:5260/>。该命令同时启动本地认证、管理及共享业务服务和 Vite，设计师、销售、管理员共用此服务。请使用空闲端口，不启动两份进程写同一 `.local` 数据目录。Windows 可在 PowerShell 中分别设置 `$env:CV_DEV_PORT='5260'`、`$env:CV_AUTH_PORT='5261'`，再运行 `pnpm admin:dev`。

`pnpm dev` 仅启动 Vite，不能代替完整服务。`pnpm build` 生成静态 dist；单独托管 dist 不能提供完整认证、账号审核、上传及共享业务接口。

首次启动会生成隔离本地数据。管理员测试手机号为 `13800000003`，随机凭据写入本机 `.local/auth/admin-credentials.json`，开发人员在自己电脑读取；本次不上传原机凭据。设计师本地种子手机号为 `13800000001`。短信登录请先点击获取验证码，再从本地“演示数据”控制台读取当前设备生成的有效验证码，不使用固定 `246810`。销售可通过本地注册及账号注册审核建立。

新电脑不会自动得到原机已有的所有订单、项目、登录状态和附件。批量业务样例通过测试隔离 fixture 生成；不要直接运行依赖原机 inventory 的历史迁移脚本，也不要把合成数据写进生产库。

## 本次全部功能与源码

| 模块 | 当前交付内容 | 主要入口 |
|---|---|---|
| 设计师端 | 工作台、项目/任务列表、项目详情、审核记录、通知、最近项目、任务 Tabs、设置 | `src/App.tsx`、`src/projects`、`src/reviewRecords.ts` |
| 专业工作区 | 三维重建界面、CAD 交互、视图和对象控制、自动保存、提交/退回、上游通过后解锁、只读成果 | `src/App.tsx`、`src/cad`、`src/WorkspaceTaskActions.tsx` |
| 销售端 | 首页、订单列表及详情、手工/报告/PACS 三种录单入口、客户与医生档案、邀请建档、成果分享记录、医保汇总 | `src/sales`、`server/sales-demo.mjs` |
| 账号 | 登录、注册及岗位/组织选择、审核状态及退回补正、找回/修改密码、扫码确认、账号切换、锁屏、个人资料与偏好 | `src/auth`、`server/auth` |
| 管理工作台及订单 | 首页摘要、筛选分页、订单详情/附件预览、阶段卡片、操作记录、责任及范围校验 | `src/admin/AdminWorkspace.tsx`、`server/admin` |
| 审核中心 | 账号注册审核、医生档案审核、权限申请审核；退回补正/重提及允许的撤销流程 | `src/admin/reviewRules.mjs`、`src/doctors`、`server/admin` |
| 机构与成员 | 组织管理、医院/科室管理、岗位管理、成员管理、岗位与角色分离、区域范围、十四项管理权限 | `src/admin/MemberAccessForm.tsx`、`src/admin/memberPolicy.mjs`、`server/admin/memberAccess.mjs`、组织/岗位/机构目录服务 |
| 数据资产 | 按订单展示专业成果、阶段卡片进入对应成果、正式版本与只读查看、成果分享管理、访问记录、资产信息导出 | `src/admin/DataAuditPanel.tsx` 等、`src/admin/assetRules.mjs`、`server/admin` |
| 审计日志 | 分类/结果/时间筛选、详情与变更明细、业务对象和权限名称投影 | `src/admin/DataAuditPanel.tsx`、`src/admin/dataAuditRules.mjs` |
| 共享业务 | 稳定 Order/Project/Task/Result ID、业务编号、跨角色授权投影、版本校验、共享机构与医生资料 | `server/unified`、`server/admin`、`src/sales/business` |
| 规范与资源 | 现有 Logo、品牌/主题 Token、图标、组件及页面规则、字段字典、演示模型与验证截图 | `AGENTS.md`、`design-system`、`docs/product`、`public` |

完整目录请结合 [数据与 API 交付](DATA_AND_API_HANDOFF.md)、[设计规范入口](../AGENTS.md)、[管理端历史及增量记录](admin/v38/HANDOFF.md) 阅读。旧文档中的“管理员 UI 未定稿、不交付”不再作为本次源码排除条件：管理员当前全部界面和服务已纳入本次交付，但待实现能力仍按下文保留。

## 当前关键规则

1. Order、Project、Task、Result、Hospital、Member 通过稳定 ID 关联，不按名称/姓名猜配。销售草稿仅本人可见，管理员订单列表不展示草稿。
2. 管理员负责机构、成员、账号/档案/访问申请审核及查看监管；订单受理/退回和专业任务分配由当前负责组长执行。管理员不能借“最高权限”绕过负责组长约束。
3. 组长正式工作台入口与完整操作流程尚未完成。现有受理/分配业务服务及仅本地的组长适配器在源码中，不能把服务逻辑已有解释为组长端全部 UI 已实现。此前讨论的下一阶段工作仍保留。
4. 成员角色单选：普通员工、业务组长、管理员；岗位与角色独立。“无专业岗位”仅适用于核准内部成员，不能自行申请管理角色。管理员初始化与后续授予管理角色不是自动派发生产账号。
5. 十四项管理权限依次为：订单管理、订单审核、任务分配、账号注册审核、医生档案审核、权限申请审核、组织管理、医院管理、岗位管理、成员管理、专业成果查看、成果分享管理、导出资产信息、审计日志。机构四项独立校验，具体目录与联动以 `memberPolicy.mjs` 为准。
6. 订单管理是查看订单列表、详情和任务进度；订单审核是组长受理/退回；任务分配是组长配置专业任务负责人和计划时间。职业编辑与专业审核资格不由管理角色自动赋予。
7. 表格前三列与末列冻结，长文本按宽度省略。管理员表格仅实际溢出时显示一层 Tooltip，浮层不被滚动容器裁切。关闭开关浅色底统一；侧栏保存固定在底部。当前 Token 与本轮规范优先于旧截图。
8. 本地演示的医院、账号及医学资料不代表生产客户、患者或正式审核；历史原始审计身份和业务 ID 不因展示名称修订而改写。

## 能力边界

- 当前交付是完整设计/交互源码及隔离本地服务原型，不是生产系统认证。JSON 存储、单进程版本保护不能代替生产数据库事务、并发、备份、租户隔离和不可篡改审计。
- 正式短信、微信/企业微信 OAuth、实名、电子签署、生产权限目录和会话安全需后端集成；扫码确认及本地演示凭据不冒充正式第三方身份。
- 真实医院 PACS/DICOM、OCR、医学分割/重建、制造级 CAD 内核、有限元及打印计算没有因为交付源码而接通。UI 可点击或演示模型可查看不代表真实临床计算成功。
- 正式大文件上传、受控对象存储、附件 ACL、工程云端持久化、完整专业审核与最终交付需生产服务实现。原机只有附件元数据但缺字节的记录不能伪造预览。
- 医生完整独立工作台、业务组长完整独立工作台不在已完成清单内。

## 验证与开发待办

构建已通过；最近管理员/机构/成员相关回归 112 项通过。额外运行现有全部 `tests/*.test.mjs`：共 309 项，298 项通过、11 项未通过。详情见 [本次验证记录](handoff/20261127/VALIDATION.md)。未通过项原样保留，没有为交付删除测试、跳过断言或放宽业务权限。

```sh
pnpm build
node --experimental-strip-types --test tests/*.test.mjs
```

开发接入时应先核对失败清单与当前规则，再决定更新历史测试 fixture/冻结基线，或修复真实兼容问题。不能把“源码已上传”解释为全套测试通过或生产能力完成。

## 发布边界

本次只上传本分支、固定版本及源码 ZIP。main、旧 design-handoff、design-handoff-v2、历史 Tag、线上域名和生产环境保持原状。`vercel.json` 对本交付分支设置 `deploymentEnabled=false`，防止上传代码自动发布。本次没有部署授权，不执行任何 Vercel 发布。
