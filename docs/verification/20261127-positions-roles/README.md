# 岗位、角色及区域组长配置｜2026-11-27

本地开发分支：`codex/review-corrections-20261125`。
安全分支：`codex/backup-before-roles-regions-20261127`，原HEAD `cc1f946`；阶段安全提交 `5e28f1e`。本地服务数据备份在`.local/backup-roles-regions-20261127/`，不纳入源码提交。

## 已实现

- 岗位目录统一为工程设计师、销售、医生；注册和补正读取同一目录。旧工程岗位安全归并并保留历史ID映射，不改账号密码、历史任务及专业权限。
- 成员表增加角色：普通员工、业务组长、管理员。职业岗位与管理职责分别存储；管理员可保存岗位及角色，保留现有具体权限开关。
- 同一核准内部账号可以增加/撤销管理职责，职业工作台不被替换；有管理角色时可从账户菜单进入管理工作台。
- 服务端校验操作者授权、成员版本、核准状态及组织资格，保护最后一个有效管理员；保存未变化的旧管理角色不会自动扩展原有细项权限。注册传入管理员角色及权限参数无效。
- 医院管理标题行增加区域组长配置。安徽16市使用稳定组长ID映射，前后端均按区域、启用状态和真实管理权限过滤候选。区域配置持久化，不重写既有医院或订单责任人。
- 保留赵启明负责合肥、许文清负责其他安徽城市的既有映射。二人的职业岗位未经确认，显示“-”，没有擅自写成销售。
- 首个生产管理员的受控初始化和身份核验已写入既有产品文档，未新增生产自动派发账号能力。后续管理员通过对已有核准内部账号授权产生。

## 实际验证

| 项目 | 结果与方式 |
|---|---|
| 岗位目录三项及新增入口 | 浏览器通过；[截图](positions.png) |
| 成员表岗位后增加角色、字段顺序 | 浏览器通过；[截图](members.png) |
| 陈屿岗位/普通员工/既有专业权限 | 浏览器通过；[截图](member-access.png) |
| 未更改陈屿角色的保存与刷新恢复 | 浏览器通过；岗位和权限保持原值 |
| 角色授予与撤销、同一账号身份与基础权限保留 | 临时隔离服务端测试通过；未在实际本地成员库授予新管理访问权 |
| 最后管理员保护、越权和版本冲突 | 服务端测试通过 |
| 区域组长配置打开与原配置保存 | 浏览器通过；[截图](region-leaders.png) |
| 未选区域时组长禁用 | 浏览器通过 |
| 合肥仅赵启明、蚌埠仅许文清 | 浏览器通过；[合肥](hospital-hefei-candidate.png)、[蚌埠](hospital-bengbu-candidate.png) |
| 区域变更、清空候选、重载持久化、跨区域拒绝 | 临时服务端测试通过；未改动真实本地医院/订单归属 |
| 表格固定列 | 浏览器计算样式确认姓名/岗位/角色前三列sticky，操作列right:0 sticky |
| Light/Dark | 浏览器通过；[深色](members-dark.png) |
| 原销售/设计师业务与关联 | 所选服务端/HTTP回归通过；本轮未逐页点击所有专业工具 |
| 原专业UI与Token | App、项目、销售、CAD及全局样式/Token路径相对基线Diff为空 |
| 注册表单完整填写及医生登录工作台 | 本轮未做完整浏览器注册；目录/越权参数测试通过。医生工作台沿用原未接通边界 |
| TypeScript / Vite | 通过；Vite保留既有大chunk告警，未为此重构 |
| 回归测试 | 74通过、0失败，见tests.txt；含真实本地HTTP角色/CSRF/业务关联测试 |
| 发布 | 未部署、未Push，未改main/design-handoff/历史Tag或冻结V3.0 |

浏览器地址仅为本机预览：http://127.0.0.1:5260/ 。

## 文件清单

- `AGENTS.md`
- `design-system/ui-ux-consistency.md`
- `docs/product/BUSINESS_DESIGN_V31.md`
- `docs/product/field-dictionary.md`
- `server/admin/http.mjs`
- `server/admin/leaderRegions.mjs`
- `server/admin/localLeader.mjs`
- `server/admin/memberAccess.mjs`
- `server/admin/presentation.mjs`
- `server/admin/service.mjs`
- `server/auth/registrationRevision.mjs`
- `server/auth/roleDirectory.mjs`
- `server/auth/service.mjs`
- `server/unified/directory.mjs`
- `server/unified/institutionDirectory.mjs`
- `src/admin/AdminWorkspace.tsx`
- `src/admin/InstitutionForms.tsx`
- `src/admin/LeaderRegionForm.tsx`
- `src/admin/MemberAccessForm.tsx`
- `src/admin/dataAuditRules.mjs`
- `src/admin/institutionRules.d.mts`
- `src/admin/institutionRules.mjs`
- `src/admin/model.ts`
- `src/auth/AccountMenu.tsx`
- `src/auth/DevConsole.tsx`
- `src/auth/IntegrationRoot.tsx`
- `src/auth/client.ts`
- `src/auth/memberAccess.d.mts`
- `src/auth/memberAccess.mjs`
- `tests/auth-service.test.mjs`
- `tests/roles-regions-20261127.test.mjs`

最终本地服务已在原5260/5261端口重启，页面及岗位目录接口均返回200；重启会使旧本机会话需要重新登录，不清除业务数据。
