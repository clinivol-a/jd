# 数据资产导航与成果预览定向修正（2026-11-26）

基线：7766fdfbce2250fed23c559c531646c096ff52ac。
安全分支：codex/backup-asset-preview-20261126-7766fdf。
工作分支：codex/review-corrections-20261125。本地预览：http://127.0.0.1:5260/ 。未部署、未推送。

## 修改

1. 订单/成果视角移至专业成果页签同一行右侧，消除额外一行。浏览器测量页签Y=144、高48，切换组Y=148、高40，垂直中心一致。
2. 专业成果卡片移除01等序号，保留原StageLabel及状态。查看成果改为独立只读图形页面，复用现有ReadOnlyModel，按五项稳定关联查询。管理员不会挂载可编辑工程师工作区。
3. 两种视角的查看详情均进入相同订单成果页，返回可恢复来源视角和筛选。
4. 删除导出弹窗“当前查询全部记录…”说明。用途仍必填，原Excel范围和实际导出审计完整保留。

## 实际验收

|检查|结果|证据|
|---|---|---|
|视角不再独占一行|通过|01-assets.png及DOM中心测量|
|成果视角详情与订单视角相同|通过|分别从CV-2026-0015两种列表进入，同一订单、2张卡片|
|卡片去序号、保留标签与状态|通过|02-order-results.png；CV-2026-0014四卡亦已核对|
|三维重建直接只读预览|通过|03-reconstruction.png；真实WebGL Canvas，未打开Drawer，可旋转、返回|
|CAD直接只读预览|通过|04-cad.png；CAD独立Task/Result及版本|
|资源缺失不显示错误阶段模型|通过|06-unavailable-result.png：有限元资源缺失明确提示|
|删除导出范围句、空用途阻断|通过|05-export.png；仍提示请填写导出用途|
|Light/Dark|通过|07-details-dark.png、08-assets-dark.png；已恢复Light|
|权限、版本、关联及既有锁定/Excel|通过|11项相关自动化测试|
|TypeScript/Vite|通过|现有大chunk提示仍存在，无构建错误|
|视觉检查|通过|Impeccable detector输出[]；已检查React异步卸载保护、稳定key、无后台轮询|
|其他角色业务及专业工作区Diff|通过|仅src/admin、server/admin、相关测试与规则文档改变|
|生产及Preview部署|未执行|无线上操作|

## 资源边界

当前图形为原有隔离专业演示资源的只读衍生，不代表真实患者临床成果。现有命名展示资源只覆盖三维重建和CAD；有限元分析、3D打印尚无对应预览资源，本轮统一跳转机制但不虚构其图形或算法结果。尚未进行真实临床成果接入验收。

## 文件

src/admin/DataAuditPanel.tsx、AssetOrderDetails.tsx、AssetResultViewer.tsx、AdminWorkspace.tsx、admin.css；server/admin/http.mjs、resultPreview.mjs；tests/admin-result-preview-20261126.test.mjs；design-system/ui-ux-consistency.md；本报告及截图。
