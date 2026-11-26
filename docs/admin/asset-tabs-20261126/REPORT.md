# 数据资产页签统一及订单表格固定（2026-11-26）

基线6a05fc4，安全分支codex/backup-asset-tabs-20261126-6a05fc4。

- 移除额外的页签Flex包装，直接使用机构与成员同一TDesign Tabs结构及现有选择器。
- 删除订单视角/成果视角切换及成果表格UI分支。专业成果固定订单粒度，导出固定订单查询范围；旧持久化view/reviewStatus不再读取，订单筛选继续保留。
- 成果分享管理、订单详情及只读成果入口保持原样。未改变服务端业务数据、审核、分享、预览、全局Token或其他端口。
- 规范同步至design-system/ui-ux-consistency.md。

浏览器实测：数据资产与机构与成员Tabs均为Card左侧24px、Card顶部72px、高48px、margin 16px 24px 0px。见measurements.json及两张截图。
分享管理切换正常；返回专业成果并刷新仍为订单表头，共22笔订单，无视角按钮。
TypeScript与Vite构建通过，保留既有chunk体积提示；视觉扫描输出[]。未部署、未推送。
