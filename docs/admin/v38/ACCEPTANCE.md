# V3.8 本地验收记录

日期2026-11-19；浏览器Chromium/Playwright，1440×1000主视口，另测1366/1920；返回滚动在1440×650测量。单次原有全套自动化：155项通过/0失败。新增管理端服务及HTTP测试另行复核。构建为TypeScript + Vite；有既有大chunk告警，没有构建错误。

## 证据与方法

- 管理界面通过实际现有密码登录，后端会话由AuthService产生，未mock角色JSON。
- 本地真实操作：ADM-O001接管→受理→仅建立请求的4阶段任务；三维重建分配给陈屿但仍未开始；ADM-D01有依据审批通过；ADM-H01变更组长且旧订单负责人不变；ADM-Q01书面依据授权；实际事件持久化进入审计。
- 陈屿/李明回归会话通过真实本地短信服务与其生成的验证码建立，随后实际点击原有两级菜单完成三账号切换。测试程序从私密本地outbox读取验证码，不假造前端成功。
- 全部测试仅修改新增隔离工作目录的合成业务数据。原V3.7 accounts、销售邀请与加密业务文件逐字节校验未变；原业务源文件与原HEAD无差异。
- UI复核最终结论：ship，范围仅为已提供的本地桌面管理UI；不是正式后端、临床审核或跨角色集成验收。

## 五张统计卡逐张核对

首次核对发生于审批测试之前；操作后数字按实际集合变化，不维持测试前旧数字。

| 卡片 | 核对时显示 | 点击列表总数 | 结果 |
|---|---:|---:|---|
| 待审核订单 | 5 | 5 | 通过 |
| 待分配任务 | 15 | 15 | 通过 |
| 账号及资质审核 | 5 | 5 | 通过；包含私密复制的现有本地待开通账号 |
| 进行中订单 | 9 | 9 | 通过 |
| 交付风险 | 1 | 1 | 通过；按当前日期与约定交期计算 |

列表操作列在横向溢出时仍可见，搜索/重置与分页使用既有Table。返回测试保持第2页、筛选/模块Tab、滚动位置；打开/关闭Drawer不因rows数组引用变化重置页码。

## A. 版本保护

| 项目 | 结果及依据 |
|---|---|
| 源码备份 | 通过；外部ZIP，含未跟踪截图 |
| SHA-256 | 通过；见HANDOFF与外部SHA256SUMS |
| 冻结Tag/备份分支 | 通过；指向原V3.7 Commit |
| 独立恢复/安装/构建 | 通过；restored-v3.7独立目录 |
| 原项目和本地数据 | 通过；只读哈希校验，未复制LocalStorage或重置原数据 |
| main/design-handoff/历史Tag | 通过；最终引用核对，无push/部署 |

## B. 账号

| 项目 | 结果及依据 |
|---|---|
| 超级管理员密码登录 | 通过；实际登录UI与服务端密码验证 |
| 正确角色路由 | 通过；#home与#admin均进入管理工作台 |
| 退出登录 | 通过；原账户菜单/确认弹窗 |
| 刷新合法会话 | 通过；刷新仍为管理员 |
| 锁屏解锁 | 通过；原Overlay、本地数字演示解锁恢复审计页 |
| 切换后隔离 | 通过；实际菜单陈屿→李明→陈屿→李明→超级管理员 |
| 普通用户不能前端提权 | 通过；HTTP会话/权限检查，伪造角色body仍403 |
| 生产不初始化管理员 | 通过；显式本地入口，Production与非本地环境测试拒绝 |
| 陈屿账号 | 通过；已有账号哈希不变，完整工作台及专业视窗打开 |
| 李明账号 | 通过；已有账号哈希不变，销售导航和业务页打开 |

## C. 管理界面

| 项目 | 结果及依据 |
|---|---|
| 八个一级导航 | 通过；实际浏览八模块，非空白标题页 |
| 首页统计来源 | 通过；同一管理服务快照及集合 |
| 五卡点击筛选 | 通过；见逐卡核对表 |
| 筛选/分页 | 通过；实际搜索与分页；跨页无重复；重置恢复 |
| PageBack/上下文 | 通过；复用PageBack，返回保存筛选/模块Tab/页码/滚动 |
| Dialog/Drawer/按钮 | 通过；实际审批、预览、关闭、权限错误反馈 |
| Sidebar | 通过；展开224px，收起64px |
| Header | 通过；原GlobalHeader，实测56px |
| Light/Dark | 通过；实际Header主题按钮切换及截图 |
| 1366/1440/1920 | 通过；无文档横向溢出，表格内部允许横滚 |

三宽度均测得：Header y=0/h=56；导航x=0/y=56/w=224；主区x=224/y=56；页面内安全边距24px。完整键盘、屏幕阅读器及逐像素对比度审计未实际验证，未按截图推断为无障碍认证通过。

## D. 业务

| 项目 | 结果及依据 |
|---|---|
| 每医院唯一当前组长 | 通过；单一leaderId、服务端合法人员检查 |
| 一组长多医院 | 通过；稳定种子及服务测试 |
| 不固化城市分组 | 通过；关系按医院/人员ID，区域仅属性 |
| 新订单按当前医院关系匹配 | 通过（隔离适配方法测试）；销售提交接入待服务端能力 |
| 同一订单一份审核责任 | 通过；唯一订单+当前责任人+版本检查 |
| 管理员默认监督 | 通过；未经接管提交审核403 |
| 接管/转派留痕 | 通过；实际原因、前后责任人、真实登录人/时间 |
| 订单退回原因 | 通过（服务测试/状态校验）；浏览器未再提交另一张退回订单 |
| 仅请求阶段建任务 | 通过；受理一阶段/四阶段，拒绝重复审核 |
| 分配专业权限/依赖/负载 | 通过；错误专业拒绝，UI显示负载与依赖，分配不开始/解锁 |
| 专业资格与管理权分离 | 通过；无默认专业审核权限，资格关系校验；正式审核写入待服务端能力 |
| 医生通过默认结果 | 通过；实际UI依据审批与system-default记录 |
| 医生退回具体原因 | 通过（服务测试+历史展示）；无原因拒绝，旧记录保留 |
| 开通与书面审批 | 通过；隔离登记与真实本地待开通销售/工程账号分别测试；正式接口待接入 |
| 权限变更依据 | 通过；实际UI批准、范围/批准人/执行人记录；只作用隔离业务人员 |
| 查询/受控导出权限 | 通过；元数据、范围与独立导出权限测试，不导出医学原文件 |
| 管理员查询销售分享与成功查看数据 | 待服务端能力；既有分享服务口径测试通过，但管理员授权查询/撤销未接入，未造记录 |
| 重要操作可追溯 | 通过；实际认证/审批/分配事件、不可变快照、刷新后可恢复 |
| 不伪装跨角色联调 | 通过；readiness与文档声明，未改写销售/工程师独立LocalStorage |

## E. 原功能回归

| 项目 | 结果及依据 |
|---|---|
| 销售工作台 | 通过；源文件未改，实际首页截图 |
| 销售订单创建/详情 | 通过（既有自动测试及浏览器详情）；本轮未再次完整人工创建四步新单 |
| 客户管理/医生详情 | 通过；实际浏览截图 |
| 两种建档来源 | 通过；既有V3.7自动测试及源数据未改 |
| 销售资质只读预览 | 通过（既有受控HTTP/附件测试）；本轮未重跑销售侧全部上传与预览文件 |
| 医保汇总 | 通过（既有导出自动测试）；本轮未实际重跑UI导出操作 |
| 成果分享/访问记录 | 通过（既有分享全套自动测试）；本轮未重跑手机扫码访问闭环 |
| 陈屿工作台 | 通过；完整首页五卡、项目列表实际浏览 |
| 三维重建 | 通过；任务001四视窗与工具栏实际打开；未重新执行医学算法/编辑 |
| CAD页面及保存 | 页面渲染通过；几何修改、撤销重做及随后自动保存未实际验证。本轮CAD源码未改 |
| 原审核/任务状态 | 通过（既有回归与源文件对照）；不改历史/未解锁规则 |
| 账号切换及主题 | 通过；菜单真实切换、主题及Header稳定 |
| 跨账号数据隔离 | 通过；销售无工程Tab、工程师无销售导航，管理接口对普通用户拒绝 |
| 原有自动化 | 通过；155/155 |
| 构建 | 通过；TypeScript/Vite/pnpm build日志另附 |

## 截图清单

均为真实本地浏览器截图，未使用设计图拼接。

| 页面 | 文件 |
|---|---|
| 管理员登录 | [01-admin-login.png](screenshots/01-admin-login.png) |
| 首页Light | [02-home-light.png](screenshots/02-home-light.png) |
| 首页Dark | [03-home-dark.png](screenshots/03-home-dark.png) |
| 订单列表 | [04-order-list.png](screenshots/04-order-list.png) |
| 订单详情 | [05-order-detail.png](screenshots/05-order-detail.png) |
| 任务调度 | [06-task-dispatch.png](screenshots/06-task-dispatch.png) |
| 医生档案审核 | [07-doctor-review.png](screenshots/07-doctor-review.png) |
| 受控资质预览 | [07b-protected-preview.png](screenshots/07b-protected-preview.png) |
| 退回原因 | [07c-doctor-return-reason.png](screenshots/07c-doctor-return-reason.png) |
| 医院及组长 | [08-hospital-leaders.png](screenshots/08-hospital-leaders.png) |
| 医院详情 | [08b-hospital-detail.png](screenshots/08b-hospital-detail.png) |
| 权限/书面依据 | [09-permissions-written-basis.png](screenshots/09-permissions-written-basis.png) |
| 审批详情 | [09b-approval-drawer.png](screenshots/09b-approval-drawer.png) |
| 数据资产 | [10-data-assets.png](screenshots/10-data-assets.png) |
| 审计日志 | [11-audit-log.png](screenshots/11-audit-log.png) |
| 李明销售首页 | [12-li-workbench.png](screenshots/12-li-workbench.png) |
| 李明医生详情 | [12c-li-doctor.png](screenshots/12c-li-doctor.png) |
| 陈屿工程师首页 | [13-chen-workbench.png](screenshots/13-chen-workbench.png) |
| 三维重建 | [13c-reconstruction.png](screenshots/13c-reconstruction.png) |
| CAD | [13d-cad.png](screenshots/13d-cad.png) |

## 修改清单

新增：src/admin/{AdminWorkspace.tsx,AdminTable.tsx,model.ts,admin.css}；server/admin/{seed.mjs,seedAccount.mjs,service.mjs,http.mjs,dev.mjs}；tests/admin-{service,http}.test.mjs；docs/admin/v38及管理端surface brief。

最小接入：src/auth/{client.ts,AccountMenu.tsx,IntegrationRoot.tsx}、server/auth/http.mjs、vite.config.ts、package.json。
规范增量：AGENTS.md、docs/product/{BUSINESS_DESIGN_V31.md,field-dictionary.md}、docs/sales/ADMIN_CUSTOMER_ROADMAP.md。

未修改App.tsx、SalesWorkspace.tsx、原业务/专业组件、全局CSS或Token；全套旧测试生成的XLSX差异另存于外部备份后恢复为已核实原字节，不夹带无关二进制变化。
