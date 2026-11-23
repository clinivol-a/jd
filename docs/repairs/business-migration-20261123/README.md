# 2026-11-23 跨角色关联业务交付记录

## 最终范围与数量

代码基线：b77b92da4ad8db5ac13637b00a04f0a1385be80f。工作分支：codex/a-design-requirements-20261120。

用户随后明确：只要两端有对应关系的数据，无关联的可以删除；两端总量仍需15条以上。本轮据此归档无关联历史，保留原2笔已核实业务，准备14组新关联项目和4条合法受理前/取消订单。不是将旧项目猜配，也不是把旧编号统一替换。

当前本机初始目录：**销售20条、设计师16个项目、管理员19条正式订单**。销售草稿不进入管理正式审核列表；未受理/已取消的4条销售记录不伪造设计师任务。数量未写死，新增可继续增长。

| 订单状态 | 数量 | 项目状态 | 数量 |
| --- | ---: | --- | ---: |
| 草稿 | 1 | 未开始 | 3 |
| 待审核 | 1 | 进行中 | 5 |
| 审核退回 | 1 | 待审核 | 3 |
| 处理中 | 13 | 审核退回 | 2 |
| 已完成 | 3 | 已完成 | 3 |
| 已取消 | 1 | 合计 | 16 |

## 原数据保护和逐笔清单

- [原订单全部逐笔对照](orders-before-after.md)：备份LocalStorage实际含32条，不删除其中任何一条备份记录。原页面当时显示30条；按同权限函数离线核算为31条，缓存差异未通过删记录强行凑数。
- [原15项目逐笔对照](projects-before-after.md)：2个已核实关联保留；13个独立工程没有可靠Order ID、医院目录也不同，按后续授权移出正常列表。
- [现16项目完整ID关系](linked-records.md)：每条均列Order.id、businessNo、Project.id和全部Task ID。
- 旧30条订单和13个工程只归档，未给它们伪造新CV号；原始内部ID、旧号、医院、需求、事件保存在私有快照及legacyArchives中。
- 备份包含浏览器38个原LocalStorage项、认证/管理/共享业务持久化文件、加密业务数据及密钥、邀请数据。另备份当前浏览器实际保存的2个IndexedDB文件，共17,783,330字节。
- 迁移后核对2个原工程任务存储项（prototype/catalog）与备份完全一致。原CAD代码、工程保存函数、公共样式和专业资源未改。

实际私有备份目录（不提交Git、不放public）：

`/Users/yifei/Documents/Codex/2026-10-10/clinivol-a-v38-sales-designer/.local/backups/before-number-migration-20261123/`

其中browser-local-storage.json为原本地存储，browser-after.json为验收后的存储，indexeddb-manifest.json及indexeddb/*.bin为原附件；backup-manifest.json记录文件大小和SHA256。

## 真实关联和新增业务验收

浏览器实际核对的同一业务：CV-2026-0015。

- 销售详情定位Order：`DEMO-LINK-20261123-13`。
- 管理员详情定位同一Order ID，未复制ADM订单。
- 设计师详情定位Project：`PRJ-d930bbec-d381-4ce4-bda3-0f792126bbc6`。
- 三维任务：`TASK-65e45783-6627-4806-9eb0-f26def6e1f53`。
- CAD任务：`TASK-61bccf17-d00d-45e1-b5b0-4aa7be849a07`。
- 两任务的projectId都为该Project，orderId都为同一销售Order；详情医院、患者、手术名称和设计需求相同。机器证据：[browser-chain.json](browser-chain.json)。

隔离HTTP验收实际创建了另一笔新订单，不污染本机演示基线：

`20条销售/16项目 → 新草稿21/16 → 提交待审核21/16 → 管理员退回 → 原号重提 → 受理但未分配21/16 → 分配21/17 → 重启仍21/17`。

[完整新订单关联证据](new-order-chain.json)含业务号、Order、Project、四个Task及负责人，接口使用真实Cookie会话、角色鉴权、Origin校验。重复提交/受理没有重复编号、项目或任务；销售无权冒充管理员，未授权工程师无任务。

## 浏览器实际验收

通过：李明登录后20条订单；陈屿登录后16项目；管理员19正式订单；同号搜索和三端详情；设计师4页共5+5+5+1=16条、编号无重复；任务分别打开三维重建和CAD；CAD模型加载；两种主题切换；管理员→陈屿恢复专业任务Tab；首页最近项目/重要通知各3条；审核记录只读实际事件并以submissionId去重。

未逐项浏览器验证：所有20条订单逐个编辑/删除/提交、所有16个项目的每个专业工具操作、其他浏览器品牌与所有桌面尺寸。自动测试覆盖相关数据规则，不将这些未操作项称为浏览器通过。

本次专业成果、影像及审核为隔离交互演示。新场景复用确定性NII/PDF/PNG附件及既有展示模型；没有接入真实医学算法。原2笔共享测试订单的NII附件元数据完整保留，但当前浏览器没有这2个对应Blob，未编造原文件或篡改历史；新场景已改用可读取的确定性附件。成果公开发布/分享并未因生成已完成状态而自动授权。

## 截图

- [销售迁移前](sales-before.png) / [迁移后](sales-after.png)
- [设计师迁移前](designer-before.png) / [迁移后16条](designer-after.png) / [末页](designer-last-page.png)
- [销售同号详情](sales-linked-detail.png) / [设计师同号详情](designer-linked-detail.png) / [管理员同一Order](admin-linked-detail.png)
- [三维重建入口](reconstruction-associated.png) / [CAD加载结果](cad-associated.png)
- [设计师首页](designer-home.png) / [审核记录](reviews-after.png)

截图记录当时实际UI。销售列表与同号详情截图已在最终资源引用修正后刷新；页面结构及原2笔记录均未改。

构建与38项回归的逐项范围见[TEST_RESULTS.md](TEST_RESULTS.md)，实际修改文件及Diff见[DIFF.md](DIFF.md)。

## 实现与操作

- UnifiedBusinessService仍使用原`.local/unified-business/state.json`及写锁/原子落盘，无第二套同步数据库。
- `linkedDemoMigration.mjs`在副本中完成计划再一次提交；revision和基线hash保证幂等、冲突时不覆盖新写入。
- `scripts/migrate-linked-demo.mjs`默认仅生成副本计划；`--apply`才应用。仅本地隔离环境允许，禁止Production/Vercel。
- 现有角色快照按linked-only模式读取，不混入旧独立数据。浏览器缓存不是权威，错误明确提示。
- 原业务号0001、0002保留。新号服务端首次提交时分配，草稿无号；退回/重提/受理均保号。
- 每条合成事件均标记synthetic/demoScenario/auditOrigin；本轮未增加专业审核管理API或修改认证。

## 安全恢复

代码恢复点：分支`codex/backup-before-number-migration-20261123`，Tag `backup/a-before-number-migration-20261123-b77b92d`，均指向完整b77b92d基线。

恢复时先停止本地集成服务并另存当前数据，切到恢复分支；将私有备份内unified-business/state.json恢复至`.local/unified-business/state.json`。其他持久化文件仅在确需完整时点回退时恢复，避免覆盖迁移后的真实操作。浏览器按browser-local-storage.json逐键恢复本方案账号数据，并移除新增的`unified-linked-designer-v1`缓存键；不要清空整个浏览器。IndexedDB原文件没有删除，如需恢复使用manifest中的原key与bin文件，不改附件ID。

本地服务仍为http://127.0.0.1:5260/，只对这台电脑可用。**未部署、未推送、未修改main/design-handoff/历史Tag/V3.0冻结基线。**
