# V3.5 成果分享记录｜本地交付及验收

日期：2026-11-17。工作分支：`feature/a-v3.1-business-design`。恢复点：`backup/before-share-records-20261117`（e6a8fdb954a422b4a4c5af68036456ceb5263d17）。修改前37张未提交验收截图原样保留并另存本地归档；未清空业务数据。

本地预览：http://127.0.0.1:5210/?build=20261117-share-records 。复用原服务，实际 HTTP 200；不是公开网址。进入李明订单详情的已完成阶段 → 分享二维码 → 查看分享记录。

## 本轮结果

复制、页面打开、身份验证与实际 Viewer 就绪分为不同事件。记录由服务端持久化，客户端只显示统计投影，不在 Drawer 打开时计数。发起人来自登录会话，预期对象来自订单关联的获授权需求医生。实际访问者独立验证；只有手机号授权时不套用患者/医生姓名。记录接口不返回完整手机号、验证码、原访问证明或分享Token。

Drawer 与二维码 Dialog 顺序切换，避免两个遮罩争抢焦点；关闭 Drawer 回到原二维码弹窗。原设计阶段仍然三行，分享入口仍在第三行右侧。

## 25项逐项验收

| # | 验收项 | 结果 | 实际证据 |
|---|---|---|---|
| 1 | 阶段卡片高度不变 | 通过 | 两张卡均134px、3个直接内容行；卡片源码/CSS与恢复点逐字一致 |
| 2 | 分享仍在第三行右侧 | 通过 | 原 DOM 未变；第二、三行间距12px、底部21px；card-measurements.json |
| 3 | 二维码弹窗原布局 | 通过 | 二维码、说明、两个复制按钮保留，仅增加记录信息行；02、08截图 |
| 4 | 最近查看时间 | 通过 | Viewer就绪前“暂无查看记录”；成功后共享formatDateTime显示完整实际时间；08截图 |
| 5 | 查看记录可点击 | 通过 | 浏览器真实点击打开Drawer |
| 6 | Drawer打开、关闭 | 通过 | 关闭按钮、Escape均可操作，恢复原二维码弹窗；不会双重遮罩阻挡 |
| 7 | Table及Pagination | 通过 | 官方组件；13条隔离验证事件，第二页3条；09截图 |
| 8 | 实际账号发起人 | 通过 | 已验证李明销售会话；元数据及复制事件均取服务端操作人 |
| 9 | 订单医生关联 | 通过 | 当前订单关联医生“周明哲”；记录保存其稳定医生ID及姓名，不取患者姓名 |
| 10 | 重建和CAD独立 | 通过 | CAD成功1次，切换三维重建仍无查看记录；稳定结果/阶段/版本隔离服务测试通过 |
| 11 | 链接复制事件 | 通过 | 浏览器真实Clipboard文本复制成功后记录1次 |
| 12 | 图片复制事件 | 通过 | 浏览器真实Clipboard PNG复制成功后再记录1次，累计复制2次 |
| 13 | 页面打开不算成功 | 通过 | 独立移动浏览器打开后：访问1，成功0 |
| 14 | 验证失败不计成功 | 通过 | 输入错误验证码，失败行保留、身份未确认、成功仍0；04截图 |
| 15 | Viewer就绪才成功 | 通过 | 真实加载只读WebGL模型后：成功1、独立访问1；05、06截图 |
| 16 | 重复访问计算 | 通过 | 服务测试：同一身份新访问成功2、独立1；相同visit/proof回调及浏览器刷新不重复累加 |
| 17 | 刷新后恢复 | 通过 | 销售刷新后最近查看及成功数保留；服务状态重建与分页测试通过 |
| 18 | 销售范围权限 | 通过 | 其他销售、匿名、范围移除均拒绝记录/复制；HTTP及服务测试 |
| 19 | 不下载专业源文件 | 通过（分享链路） | 分享接口仅返回批准预览图/量化展示模型，无STL/CAD源文件接口或下载按钮；撤销/发布检查保留。不将浏览器展示资源宣称为不可复制DRM |
| 20 | Light/Dark | 通过（桌面） | 06/07稳定截图，使用官方表面/文字/边框/状态Token |
| 21 | 李明销售回归 | 通过 | 首页、客户管理、订单管理、订单详情及分享真实浏览器操作，无pageerror |
| 22 | 陈屿工程师回归 | 通过 | 完整首页5张统计、三维重建及CAD Viewer实测；10、11截图；未修改其组件及Token |
| 23 | 管理员规划归档 | 通过 | 补入现有BUSINESS_DESIGN_V31.md统一章节，A/B/C全部标记待管理员端设计阶段实施，无管理员页面 |
| 24 | TypeScript/Vite | 通过 | pnpm run build；82项服务/HTTP/认证回归全过；git diff --check通过 |
| 25 | 不部署 | 通过 | 未调用Vercel发布工具、未push、未更新main/design-handoff/V3.0；仅修改本地开发分支 |

浏览器证据：`browser-results.json`、`regression-results.json`；服务验证：`tests/share-records.test.mjs`、`tests/share-records-http.test.mjs`及原business/auth测试。UI使用原Vite资源与独立真实AuthService/BusinessService HTTP测试实例；验证码及账号由服务端产生/核准，不用静态假响应替代。分页所需的额外行是隔离服务实际生成的失败验证事件，不是真实医院访问记录，也未添加成功查看。测试实例没有覆盖用户原业务库。

## 截图

- [原三行卡片](screenshots/01-stage-cards.png)
- [二维码弹窗：暂无查看](screenshots/02-share-dialog-empty.png)
- [空记录Drawer](screenshots/03-empty-drawer.png)
- [移动验证失败](screenshots/04-verification-failed.png)
- [只读Viewer成功](screenshots/05-viewer-success.png)
- [记录Light](screenshots/06-records-light.png)
- [记录Dark](screenshots/07-records-dark.png)
- [二维码弹窗：最近查看](screenshots/08-share-dialog-recent.png)
- [第二页](screenshots/09-records-page-2.png)
- [工程师三维重建回归](screenshots/10-engineer-regression.png)
- [工程师CAD回归](screenshots/11-cad-regression.png)

## 修改文件

| 文件 | 内容 |
|---|---|
| server/business/shareRecords.mjs | 持久化事件、身份脱敏、统计、分页、去重、权限及Viewer证明关联 |
| server/business/service.mjs | 分享元数据、验证/实际查看分离、交付凭证和订单医生关联 |
| server/business/plugin.mjs | 新记录/复制/打开/Viewer确认路由、访问会话核验及局域网受控白名单 |
| src/sales/business/ShareRecordsDrawer.tsx | 官方Drawer/Table/Pagination/Empty，结果及元数据展示 |
| src/sales/business/OrderResults.tsx | 原二维码弹窗新增轻量记录行，复制完成后记账；公共Viewer实际就绪回调 |
| src/sales/business/shareVisit.ts | 新导航与刷新访问会话的稳定去重 |
| src/sales/business/ReadOnlyModel.tsx | 仅新增可选就绪回调；几何、材质、控制逻辑不改 |
| src/sales/business/projection.ts | 记录订单关联医生作为预期对象，不授予新增访问权限 |
| src/sales/business/business.css | 只增加二维码记录行及Drawer局部Token样式 |
| scripts/presentation/v35/runtime.mjs | 为未来构建识别两个受分享凭证约束的新端点；没有执行部署或更改线上配置 |
| tests/share-records*.test.mjs | 新增权限、去重、失败、身份、持久化、分页及HTTP边界测试 |
| tests/business-v35.test.mjs | 原“验证即已查看”断言改为“验证通过”，成功须另有Viewer事件 |
| docs/product/BUSINESS_DESIGN_V31.md | 当前边界及管理员后续业务需求A/B/C |
| docs/product/field-dictionary.md | 分享/访问/身份与计数的字段语义 |
| design-system/component-rules.md | 记录Drawer、轻量入口及具体时间格式 |

## 仍然存在的产品边界

- 当前是隔离演示授权名单及手机凭证，未新增正式实名身份服务。预期分享对象的记录不自动扩充访问权限；真实医生/患者账号与授权目录仍须正式接入。
- 无可信姓名/自然人角色映射时显示“获授权人员”与脱敏手机号；独立访问数按已验证身份凭证统计，不冒称已经核验自然人唯一性。
- 历史旧审计不删除、不回填为已确认Viewer事件。新记录从实际操作开始积累。
- 本轮没有实体手机扫码或公开站点验收；线上Preview仍为上一交付版本，不能用旧线上地址验收本轮本地新增功能。
- 旧本地简化验证码仍限定隔离环境；本次没有放宽正式认证，也未增加公开审批/验证码查询接口。
