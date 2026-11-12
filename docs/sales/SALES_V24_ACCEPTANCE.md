# 销售工作台 V2.4 验收记录

日期2026-11-12；分支feature/account-auth-integration。
安全Tag：backup/before-sales-v24-20261112。
基线：2fb44feeebd21a9af38794284e8c4fb2ee117071。
仅本地开发，不推送、不部署、不更新design-handoff。

## 修改前后及字段规则

- 筛选placeholder改为真实全部选项；即时AND筛选、重置及分页恢复，医院变化清除无效科室。
- 公共app-table规则覆盖危险色和按钮padding，改为销售订单局部匹配共享规则；操作同起点、Danger红、透明背景，不改工程师表格。
- 需求医生改医生，最近更新改最近更新时间，预计交付改预计交付时间；完整列表时间顺序为最近更新时间→创建时间→预计交付时间。
- 首页空状态仅原生Empty图标及暂无数据，240px最小高度；有数据六行不变。
- 两个侧栏图标使用官方TaskIcon/UserBusinessIcon，沿用既有适配器和菜单大小。
- requestedDueDate为销售期望，confirmedDeliveryDate为公司确认日期，附deliveryConfirmedAt/By。旧due仅迁移期望，不凭订单状态认定排期；无确认统一待排期。普通销售保存不能注入确认字段。
- 隔离测试控制台仅对处理中订单允许确认排期，记录真实操作时间和审计；已确认日期在取消/完成后保留，不开放普通销售排期。
- 概览移除工程项目UI，保留模型关联；报价无新输入或金额，保持待核定。
- 阶段三行通过12px gap排布，20px内边距、16px卡片间距；隐藏无内容的成果操作区。
- 附件普通字段正文色、表头/单元格同起点，真实文件名及预览/下载保持可操作。
- 复用GlobalHeader增加showTaskTabs（默认true），仅销售传false；陈屿Home/专业标签不变。
- 挂载/开发热更新迁移前读取最新存储，避免旧标签把较新排期覆盖；确认后已实际刷新复测。

工程师与销售共享字段：医院、手术项目名称、设计阶段、预计交付时间、操作。销售特有：订单编号、病例编号、医生、订单状态；不将订单编号混作工程师项目编号。时间仍为YYYY-MM-DD HH:mm，纯日期YYYY-MM-DD。

## 38项验收

36项通过、2项未验证（10真实Hover、21折叠Tooltip）。第5项的无效科室清理浏览器分支另列未实操，不以构建成功代替。

|#|验收项|结果|证据/范围|
|---|---|---|---|
|1|医院筛选有真正的全部医院选项。|通过|filter-hospitals.jpg；实际可选全部医院和授权医院。|
|2|科室筛选有全部科室。|通过|filter-departments.jpg；实际可选全部科室。|
|3|设计阶段筛选有全部阶段。|通过|filter-stages.jpg；全部阶段及四阶段。|
|4|订单状态筛选有全部状态。|通过|filter-statuses.jpg；全部状态及六种状态。|
|5|筛选条件立即生效。|通过|医院16条→叠加有限元1条→草稿0条，AND即时生效。无效科室自动清理已实现，但医院切换清理分支未完整浏览器实测。|
|6|重置筛选正确。|通过|重置恢复22条、全部默认选项、第一页。|
|7|操作表头与查看详情左对齐。|通过|实测表头X1508+16px=查看详情X1524；首页/完整列表两页使用相同布局。|
|8|查看详情与删除左对齐。|通过|同行inline-flex、gap16px、按钮padding0，基线一致。|
|9|删除默认红色。|通过|实测rgb(213,73,65)，TDesign Error；actions-danger.jpg。|
|10|删除Hover颜色符合Danger规范。|未验证|Error Hover/Active Token已实现；本轮未单独实测鼠标Hover画面。|
|11|非草稿订单不显示删除。|通过|实际草稿有删除，待审/退回/处理/完成/取消均无；不改删除业务。|
|12|预计交付时间字段名称正确。|通过|首页、列表、概览统一预计交付时间。|
|13|最近更新时间位于创建时间之前。|通过|表头实际为最近更新时间→创建时间→预计交付时间。|
|14|需求医生已经改为医生。|通过|首页、列表、概览及订单创建确认统一医生。|
|15|共享字段名称与工程师端一致。|通过|医院/名称/设计阶段/预计交付时间/操作沿用工程师；订单和病例ID不混作项目ID。|
|16|首页空状态没有重复解释文字。|通过|筛选11-12至11-12仅暂无数据，原生TDesign Empty。|
|17|首页空状态上下有合理留白。|通过|实际空状态240px高、padding72px，recent-empty.jpg。|
|18|有数据时近期订单正常恢复。|通过|切回近三个月恢复六行，含表头共7行。|
|19|订单管理图标使用TDesign task。|通过|依赖运行核实TaskIcon存在，经既有CliniVolIcon适配。|
|20|客户管理图标使用TDesign user-business。|通过|依赖运行核实UserBusinessIcon存在，同尺寸和适配语言。|
|21|侧栏折叠和Tooltip正常。|未验证|收起/恢复实际正常，sidebar-collapsed.jpg；Tooltip真实Hover未单独验证。|
|22|草稿不展示虚构预计交付时间。|通过|SO-V23-01待排期；旧2026-11-25只保留为期望日期。|
|23|待审核和审核退回未确认排期显示待排期。|通过|SO-V23-02/03待审和退回均待排期。|
|24|处理中订单展示有依据的确认排期。|通过|SO-V23-04仅在隔离控制台确认2026-11-25后显示，刷新保留；delivery-persisted.jpg。|
|25|报价未擅自新增输入和虚构金额。|通过|无报价输入及新增金额，保持待核定。|
|26|订单概览移除了关联工程项目展示。|通过|概览不显示工程项目及Info；projectId/taskIds保留。|
|27|设计阶段卡片上下留白均衡。|通过|复用原阶段卡片：padding20px、三行gap12px；无成果时隐藏空操作区。|
|28|四张阶段卡片一致。|通过|四卡片实测均134px，stages-light.jpg。|
|29|资料附件分类文字为正文色。|通过|分类/类型普通正文，Light实测rgba(0,0,0,.9)，cursor:auto。|
|30|文件名称与操作列对齐。|通过|附件表头/单元格均24px内边距；X272+24=文件名X296，按钮padding0。|
|31|非链接文字不显示点击手型和品牌绿。|通过|仅真实预览/下载为品牌色；普通字段无点击手型或Hover变绿。|
|32|可点击附件仍能正常预览。|通过|需求说明.pdf点击后真实Blob预览，attachment-preview.jpg。|
|33|销售Header不再展示Home胶囊。|通过|销售DOM无Home/nav；Header高度56px、右侧仍原位置。|
|34|陈屿Header仍保留Home和任务Tab。|通过|实际陈屿Home、P301-1/P301-2保留；engineer-header.jpg。|
|35|两账号切换正常。|通过|实际两级菜单陈屿切李明，销售不泄露工程师标签。|
|36|Light/Dark正常。|通过|Light和Dark空状态、阶段、首页已实测，不改Token。|
|37|原订单创建、列表和详情业务无回退。|通过|实际旧草稿进入四步至确认，病例/需求/期望日期/附件保留；创建提交状态由模型回归覆盖，未提交用户草稿。|
|38|TypeScript/Vite构建通过。|通过|最终tsc/Vite通过，仅原大包提示。|

## 检查与截图

销售测试30/30通过；新增4项覆盖期望与排期分离、迁移保留、越权注入拒绝、取消保留排期。V2.2日期用例改为修改requestedDueDate，保留原校验断言。
check-a-integration通过；git diff --check通过。最终TypeScript/Vite构建通过，仅原有大包警告。
未修改认证、CAD、工程师工作区、全局CSS和Token。App.tsx仅修改GlobalHeader可选展示参数。
本地预览：http://127.0.0.1:5213/ （本机，非公开地址）。

截图目录：/Users/yifei/Downloads/clinivol-sales-v24-20261112/
筛选：filter-hospitals.jpg、filter-departments.jpg、filter-stages.jpg、filter-statuses.jpg。
操作：actions-danger.jpg、order-page2.jpg。
空状态：recent-empty.jpg、recent-empty-dark.jpg。
日期：requested-date.jpg、draft-delivery.jpg、delivery-persisted.jpg。
阶段/附件：stages-light.jpg、stages-dark.jpg、attachments.jpg、attachment-preview.jpg。
Header/Icon：sales-home-final.jpg、engineer-header.jpg、sidebar-collapsed.jpg。

## 文件清单

- src/sales/SalesWorkspace.tsx：筛选/字段/Empty/图标/排期控制台/Header展示参数及存储保护。
- src/sales/OrderPages.tsx：期望日期、概览、阶段和附件局部样式。
- src/sales/model.ts、migrate.ts、orderRules.mjs、orderRules.d.mts：日期语义、保守迁移与排期确认。
- src/sales/sales.css：销售订单局部规则。
- src/App.tsx：GlobalHeader showTaskTabs可选参数，默认保留工程师标签。
- src/design-system/tdesign.tsx：核实后增加官方UserBusinessIcon适配导出。
- tests/sales-orders-v24.test.mjs、tests/sales-orders-v22.test.mjs：日期逻辑回归。
- docs/sales/SALES_V24_ACCEPTANCE.md：本记录。

本轮不删除订单，原22条订单保留；SO-V23-04执行授权的隔离管理员确认排期，不给其他订单凭空填日期。正式业务后端、管理员排期权限、报价机制仍需后续接入，隔离测试不等于生产能力。
