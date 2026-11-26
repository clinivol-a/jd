# 两端成果分享记录抽屉定向调整（2026-11-26）

基线8c54504，安全恢复分支codex/backup-share-drawers-20261126-8c54504。

销售抽屉：基本资料 → 订单编号、手术项目名称、成果名称、医院、设计阶段、分享发起人、成果查看次数、最近查看时间 → 访问记录及既有四列表格。
管理员抽屉：标题成果分享记录；同样两节，基本资料在设计阶段后追加成果版本，共9项；移除未要求的当前状态。

销售查询接口补充获授权订单自身的businessNo、手术项目名称、医院和精确分享成果的阶段。内部orderId继续保留用于关联，不作为订单编号展示；无值显示短横线。设计阶段复用StageLabel。未改变访问记录、权限、去重、成功事件定义和二维码弹窗交互。

## 浏览器实测

- CV-2026-0016：两端均显示术前骨性结构模型、三维重建成果、安徽医科大学第一附属医院、李明、0次；管理员版本V01。
- 两端字段DOM顺序均与本次要求一致，标题正确。
- 两端访问表格为空，分别测得t-table__empty padding-top=120px，Empty组件顶部相对单元格顶部=120px。
- 截图：admin-empty.png、sales-empty.png。
- 本轮有数据状态的分页与Light/Dark未重新进行浏览器验收；表格和分页配置保留。

## 验证

TypeScript与Vite构建通过，保留既有大chunk提示；视觉扫描输出[]。
16项分享记录相关测试通过，覆盖新增订单资料字段、权限、真实事件统计、去重、跨成果隔离、重启保留及HTTP访问保护。HTTP测试初次受沙盒监听限制，获本机监听执行权限后通过。
未修改登录、订单业务、工程师专业工作区或全局Token。未推送、未部署。

## 修改文件

src/sales/business/ShareRecordsDrawer.tsx、business.css；server/business/shareRecords.mjs；src/admin/AdminWorkspace.tsx、admin.css；tests/share-records.test.mjs；design-system/ui-ux-consistency.md；本报告及两端截图。
