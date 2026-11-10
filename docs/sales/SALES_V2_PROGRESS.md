# 销售 V2 对照与实施记录

2026-11-10，恢复点 backup/before-sales-v2-20261110。

## 基准
已用现有合法会话打开线上工程师首页，并访问项目列表、项目详情、审核记录、重建和CAD路由，保存首批截图。路由访问不等于完成页面内全部交互验收；Hover/Focus、任务视角、日期、通知、账号菜单及深色逐项走查尚未完成。

代码基准：App.tsx PlatformShell / HomeDashboard / TaskTable，index.css 的 platform-shell、business-nav、nav-collapse、dashboard-welcome、stat-grid、stat-card、dashboard-grid、section-heading、app-table。Header56px；导航224/64；收起38px；正文14/22；Card6px；统计间距16、内边距18/20/16，欢迎区副标题间距4px。

## 本批已实施
- 销售导航改为工作台、订单管理、客户管理；复用platform-shell与business-nav，移除独立宽度/选中/边线规则；收起使用nav-collapse及Tooltip。
- 首页问候及日期、五张官方Card统计、通栏近期六订单无分页、底部待办/动态双栏；复用既有样式，未改工程师DOM或Token。
- 统计改为订单核心，新增pending/processing/confirming目标集合，保留自然月新增及完成查询。
- 销售Table复用app-table与既有行高/字体；分页可按首页关闭。

## 尚未完成
列表主Card内部结构、客户Tab独立筛选恢复、表单字段级错误、详情返回与信息网格、医生完整姓名及演示文案迁移、Header通知浮层、空动态数据的业务呈现、全量Light/Dark及52项交互验收。不得把首批修改视为V2全部完成。

截图：/Users/yifei/Downloads/clinivol-sales-v2-20261110/。当前仅原始截图，尚未形成最终并排对照。

本批TS/Vite构建通过；现有销售模型与邀请传输测试9项通过。未部署；未更新design-handoff；未修改工程师专业页面。
