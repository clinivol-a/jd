# 构建与回归结果

2026-11-23，本地集成分支；未执行部署。

| 检查 | 结果 | 证据/范围 |
| --- | --- | --- |
| TypeScript `tsc -b` | 通过 | 当前完整项目编译 |
| Vite生产构建 | 通过 | 5554模块；仅已有的500KB分包体积提示，无构建错误 |
| 相关自动回归 | 38/38通过 | 以下11个测试文件 |
| 数据迁移原子性/幂等性 | 通过 | 失败时持久化文件逐字节不变；重跑不增加记录 |
| 三角色HTTP完整链路 | 通过 | 真Cookie、Origin、角色权限、退回保号、受理幂等、分配、重启 |
| 本机演示库数量 | 通过 | 20销售/16设计师/19管理正式订单；临时测试不污染基线 |
| 新增数量非上限 | 通过 | 隔离测试20/16→21/17 |
| 原已核实2笔关联 | 通过 | 原Order/Project/Task/Event对象保持；0001、0002保号 |
| 旧无关联数据 | 通过 | 30订单/13工程归档清单，未强行配号/配关系 |
| 业务编号 | 通过 | 草稿无号；其他19条格式CV-2026-NNNN且唯一 |
| 两端状态覆盖 | 通过 | 6种销售/5种项目，按实际任务聚合 |
| 浏览器项目分页 | 通过 | 4页5+5+5+1=16，无重复，全部CV编号 |
| 三端同号详情 | 通过 | CV-2026-0015，Order和Project/Task证据JSON及截图 |
| 三维重建入口 | 通过 | 对应独立Task ID，2组序列显示，四视窗 |
| CAD入口 | 通过 | 对应另一Task ID，展示资源加载完成，只读锁定 |
| 新合成附件读取 | 通过/限定范围 | 浏览器打开CV-0015的PDF预览；未逐个测试全部附件 |
| 账号切换与服务重启 | 通过 | 最终重启后李明、周景明、陈屿均重新登录，原角色页面恢复 |
| Light/Dark | 通过/限定范围 | 浏览器在关联三维界面实际切换，并恢复Light；未穷举全部页 |
| 冻结UI及专业源码 | 通过 | linked-demo-freeze测试与b77b92d逐字节比较 |
| 原工程存储 | 通过/限定范围 | 实际备份中的2项prototype/catalog键迁移后逐字节相同；未重置LS/IDB |
| 原上传文件备份 | 通过 | IDB2个Blob，17,783,330字节；私有manifest记录SHA |
| 原两笔共享NII原件 | 遗留 | 当前浏览器缺少原Blob，元数据和原关系保留，未伪造原文件 |
| 全部工具/所有浏览器尺寸逐项交互 | 未实际验证 | 本轮只针对数据关联，不把源码冻结测试当成完整UI操作 |

最终自动测试文件：

- tests/linked-demo-migration.test.mjs
- tests/linked-demo-http.test.mjs
- tests/linked-demo-freeze.test.mjs
- tests/unified-business.test.mjs
- tests/unified-business-http.test.mjs
- tests/unified-business-projections.test.mjs
- tests/admin-http.test.mjs
- tests/cross-role-tables.test.mjs
- tests/v38-sales-designer.test.mjs
- tests/design-demand.test.mjs
- tests/sales-order-fields.test.mjs

运行Node需使用当前已安装运行时，HTTP测试需要本机临时端口监听权限。无需公网、Vercel或真实短信。`CV_EVIDENCE_FILE`可指定保存新增订单的关联证据。
