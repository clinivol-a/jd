# 本轮Diff摘要

基线b77b92da4ad8db5ac13637b00a04f0a1385be80f。完整Diff可使用`git diff b77b92da4ad8db5ac13637b00a04f0a1385be80f HEAD`查看。

| 文件 | 变更 |
| --- | --- |
| server/unified/service.mjs | linked-only快照标记；受理幂等；正式编号有效性；归档旧ID防回流；成果提交ID；合成资源数据投影 |
| server/unified/linkedDemoMigration.mjs（新增） | 保留2笔可靠关系、私有归档旧数据、受控建立14组完整场景及4条销售状态；副本计划/锁内原子提交/幂等与资源映射 |
| scripts/migrate-linked-demo.mjs（新增） | 本地迁移计划、应用与数量/关联报告；禁止公开环境 |
| server/admin/service.mjs | linked-only时订单、任务及业务资产使用共享快照；不改管理页面 |
| src/business/unifiedClient.ts | linked-only销售投影替换旧业务合并；保留医生事件和已读状态 |
| src/business/useUnifiedDesigner.ts | 授权任务/事件/通知读取同源快照；账号缓存；错误反馈 |
| src/business/linkedCatalog.ts（新增） | 版本化业务缓存读取，原工程数据不清空 |
| src/App.tsx | 数据初始化、缓存保护、移出失效Tab引用；Header起至文件末尾逐字节不变 |
| src/projects/projectModel.ts | linked-only不再追加独立目录；缺失已关联编号不回退内部ID |
| src/sales/SalesWorkspace.tsx | 原轮询遇到错误使用既有反馈，不静默；轮询以下完整UI源码不变 |
| tests/linked-demo-*.test.mjs（新增3份） | 迁移原子/幂等、20/16→21/17完整HTTP流程、冻结源码比对 |
| tests/unified-business.test.mjs | 受理重试从拒绝改为幂等返回同一项目的断言 |
| tests/unified-business-projections.test.mjs | linked-only隔离、医生事件保留、受控资源标记不增加旧目录 |
| docs/product/field-dictionary.md | 当前权威目录、编号/内部身份、归档与演示来源规则 |
| docs/DATA_AND_API_HANDOFF.md | 实际本地接口、事务迁移、权限、缓存和未接入边界 |
| design-system/ui-ux-consistency.md | 同源业务读取、无关联不混入、不借数据改视觉 |
| docs/repairs/business-migration-20261123/* | 逐笔前后表、CSV、关联证据、真实截图、验收与恢复说明 |

没有修改任何CSS、Token、图标、销售/设计师表格JSX、订单详情JSX、管理员页面JSX、登录注册页面或专业软件源码；没有Push、部署、重绑项目、修改main/design-handoff或冻结基线。
