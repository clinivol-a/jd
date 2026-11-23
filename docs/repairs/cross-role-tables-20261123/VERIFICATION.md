# V3.8 跨角色表格、分页与筛选验收

日期：2026-11-23。基线：`dcbab47b5005bd28d6f98c02b1d18e1688616ccd`。

工作分支：`codex/a-design-requirements-20261120`。修改前安全分支：`codex/backup-before-cross-role-tables-20261123`，指向上述基线。

本地地址：http://127.0.0.1:5260/ 。只完成本地修改、验证和提交；未推送、未部署，未修改 main、design-handoff、V3.0 冻结版本。

## 实现与范围

- 首页摘要改为最多7条真实数据，数据不足时保留真实数量，不加分页或填充记录。
- 完整列表共用 `useViewportPagination`：测量视口、滚动容器、表格起点、Card内边距、表头、实际数据行及分页区；保持原有行密度。短窗口至少一行并允许页面滚动；末页和稀疏结果自然收缩。窗口变化保留原首条所在分页范围，筛选变化回第一页。
- 修复分页出现/隐藏时的尺寸反馈风险：缓存实测分页区高度，不在两种不同保留高度间循环计算。ResizeObserver与窗口事件合并到requestAnimationFrame，卸载时清理。
- 审核记录改为指定10列及三个AND筛选。通过Task ID到Project再到已有Order关联取得业务身份，保留Record ID、Task ID、原审核人、原意见及原始时间。提交事件审核人仍为 `-`，时间完整显示 `YYYY-MM-DD HH:mm`。
- 销售医生筛选只改Label，保留姓名/手机号匹配；订单筛选只匹配展示的正式编号，草稿内部ID不参与。医保列顺序调整，原多选、脱敏、预览及导出请求不变。
- 三角色Sidebar仅替换为官方ViewListIcon，保留原位置、尺寸、状态语义与行为。操作列以单元格和文字按钮配置对齐，不使用位移补偿。
- 指定五份规范原位修正旧规则；未修改Token值、业务状态机、编号分配、业务记录或专业工作区。

历史独立演示项目保留既有项目编号，不为其伪造Order关联。本轮没有再次迁移、隔离或删除旧演示数据；共享业务沿用已有正式businessNo和内部ID关系。

## 浏览器实测数据

浏览器：Codex内置Chromium；三账号均使用已有本地隔离测试会话。常规对比视口1440px宽，650px与1080px高；另检查1920×1080审核记录及医保字段。测试结束恢复默认1280×720视口。

| 完整列表 | 650px高第一页 | 1080px高第一页 | 结果 |
|---|---:|---:|---|
| 设计师项目视角 | 4 | 11 | 通过 |
| 设计师任务视角 | 4 | 11 | 通过 |
| 设计师审核记录 | 5 | 12 | 通过 |
| 销售订单 | 4 | 11 | 通过 |
| 销售医生 | 4 | 12 | 通过 |
| 销售我的待办 | 2 | 9 | 通过 |
| 管理员订单 | 4 | 11 | 通过 |

高窗口分页区/Card底部实测：项目1050px、审核1050px、销售订单1042px、销售医生1054px、管理员订单1032.5px，均接近1080px视口底部且保留正常页面安全间距。具体观测见 [measurements.json](measurements.json)。其中标记为 `designer-projects-short/tall` 的早期观测停在末页，不代表容量；容量以 `designer-projects-first-short/tall` 为准。

| 首页摘要 | 实际行数（每张表独立计数） | 结果 |
|---|---|---|
| 设计师我的项目 / 最近项目 / 重要通知 | 7 / 7 / 4 | 通过 |
| 销售近期订单 / 我的待办 / 我的业务范围 | 7 / 7 / 3 | 通过 |
| 管理员订单审核 / 任务调度 / 风险 / 账号资质 | 6 / 4 / 7 / 1 | 通过 |

没有为不足7条的表格新增数据。销售首页三个表合计17行不代表单表超限。

### 分页、搜索与操作证据

- 医生列表两页12+2=14条，合并后14条唯一内容，无重复或遗漏。末页Card/分页底部454px，自然收缩。
- 审核记录两页12+12=24条，合并后24条唯一内容。改变高度后原首条仍处于调整后的页面范围，未强制返回第一页。
- 销售正式编号 `CV-2026` 搜索得到2条，无分页，Card底部430px；搜索手术名称“颌骨”得到0条。已等待现有250ms防抖完成后核对。
- 医生姓名“林致远”和手机号后缀“1002”分别得到1条，对应医生正确。
- 审核AND条件“CV261102-0301 + 三维重建 + 审核通过”得到1条，意见及审核人为原记录。查看任务进入 `#project/CV261102-0301?taskId=P301-1`，浏览器返回保留筛选。重置和无结果Empty均实际验证。
- 管理员审计日志在第2页输入“陈屿”回第1页，再到第2页后清空搜索仍回第1页；未恢复之前缓存的旧页码。
- 项目、任务、审核、管理员订单四表的操作表头与首项按钮文字X起点分别为1310.984375、1232、1306、1332px；同一表内两者相同。保持固定右列与横向滚动配置。
- 医保页面实际选择1条、打开成果预览并关闭、点击生成Excel后浏览器收到下载。导出请求仍是原月份和选中ID，未改服务端字段映射。当前月份只有2条，未新增已完成记录来制造多页。

## 验收矩阵

| 项目 | 结果 | 证据与边界 |
|---|---|---|
| A：审核10列、名称、语义、顺序 | 通过 | DOM和宽屏截图逐列核对 |
| A：业务身份关联及同名不合并 | 通过 | 稳定ID代码检查；同名两项目自动测试独立 |
| A：三筛选、AND、重置、先过滤后分页 | 通过 | 实际组合筛选1条及空结果 |
| A：原审核状态、意见、审核人、完整时间 | 通过 | 原始事件测试及浏览器内容核对；未改审计数据 |
| A：阶段Icon-only及原Tooltip组件 | 通过 | 表格无阶段Tag，复用StageTypeIcon；未重画图标 |
| A：查看任务与返回上下文 | 通过 | P301-1真实Task ID及返回后筛选保留 |
| A：操作列真实左对齐 | 通过 | 浏览器测量文字起点相等 |
| B：首页每表最多7条 | 通过 | 三角色实际计数见上表 |
| B：项目/任务/审核/订单/客户/待办高低窗口容量 | 通过 | 上表实测 |
| B：管理员各完整列表共用动态分页 | 通过 | 订单、任务调度、审核中心、机构与人员、权限与审批、资产、审计默认列表均打开核对；任务12行、审计11行（1080px） |
| B：管理员每一个子Tab分别进行高低窗口对比 | 未实际验证 | 全部复用同一AdminTable；本轮未逐个子Tab做双尺寸遍历 |
| B：医保多页动态容量 | 未实际验证 | 已接入相同测量机制，当前真实演示数据仅2条，无伪造填充 |
| B：少量数据、末页自然收缩，不加空白行 | 通过 | 2条正式编号结果与医生末页实际测量 |
| B：翻页、容量变化、有效页码 | 通过 | 14医生/24审核完整遍历；resize索引自动测试；浏览器高度变化 |
| B：筛选与分页协同 | 通过 | 三端筛选及管理员缓存页码回归 |
| B：极矮窗口、全部浏览器引擎 | 未实际验证 | 实测最矮650px；未声明Safari/Firefox通过 |
| C：销售医生Label及双匹配 | 通过 | 姓名/手机号各1条 |
| C：订单编号Label/Placeholder/仅编号匹配 | 通过 | CV-2026两条，颌骨0条；草稿显示规则测试 |
| C：医保8列、多选、脱敏、预览、Excel导出 | 通过 | 实际浏览器预览及下载；原导出映射未变 |
| D：三角色官方view-list、收起与展开 | 通过 | SVG类为t-icon-view-list；三个角色均点击收起/展开 |
| D：Sidebar位置/尺寸/颜色/规则保持 | 通过 | 仅替换官方适配图标；原按钮及类不变 |
| D：三端逐个键盘Focus及Hover截图 | 未实际验证 | 原Tooltip、Focus和Hover样式未改；未逐一截图 |
| E：AGENTS及四份指定规范更新、旧分页/字段冲突修正 | 通过 | 原位改写而非仅末尾追加；旧条数仅保留禁止说明 |
| E：Token、Header、专业工作区、认证及数据链路冻结 | 通过 | Diff范围检查及冻结测试；GlobalHeader与Workspace之后字节比较一致 |
| E：Light/Dark | 通过 | 销售客户及管理员列表实测切换；未逐一截图每个子Tab双主题 |
| F：TypeScript、Vite、必要自动回归 | 通过 | tsc -b；Vite构建成功；19项测试全通过 |
| F：本地交付、无部署 | 通过 | 只本地分支提交，无Push/Vercel操作 |

本轮无已知阻断问题。Vite仍提示既有大资源包超过500kB；构建成功，本轮未进行未经授权的拆包重构。

## 关键截图

- [审核10列宽屏](25-reviews-fullpage.jpg)、[审核1080px高](27-review-1080.jpg)、[审核650px高](28-review-650.jpg)、[AND筛选](03-reviews-and-filter.png)。表格保留正常横向滚动和固定操作列，窄屏不强行压缩字号。
- [设计师首页](29-designer-home.jpg)、[销售首页](32-sales-home-full.jpg)、[管理员首页](31-admin-home-full.jpg)。
- [销售订单1080px高](33-sales-orders-1080.jpg)、[650px高](34-sales-orders-650.jpg)、[只有2条结果](10-sales-sparse-results.png)、[医生末页2条](19-doctors-last-page.jpg)。
- [医保8列](35-insurance-full.jpg)、[销售Dark](13-doctors-dark.png)、[管理员Dark](17-admin-dark.png)。
- Sidebar图标见三角色首页截图；[管理员Sidebar](30-admin-sidebar-full.jpg)。

部分早期普通截图只捕获浏览器可见面板宽度，完整逻辑视口截图以标有fullpage及上述27–35编号的JPEG为准。

## 修改文件与Diff摘要

| 文件 | 变化 |
|---|---|
| `src/tables/useViewportPagination.ts`、`viewportTables.css` | 新增可用高度测量、resize位置保留、局部操作列对齐 |
| `src/App.tsx`、`src/reviewRecords.ts` | 审核10列、稳定ID关联、三筛选与上下文、完整时间、设计师Sidebar图标 |
| `src/projects/ProjectPages.tsx` | 双视角动态分页、首页最多7条、共同字段相对顺序 |
| `src/sales/SalesWorkspace.tsx`、`sales.css` | 完整Grid动态分页、首页7条、筛选文案/匹配、取消稀疏订单Card强制撑高、Sidebar图标 |
| `src/sales/business/InsuranceSummary.tsx` | 医保8列及动态分页，保留原导出/选择/预览 |
| `src/admin/AdminTable.tsx`、`AdminWorkspace.tsx` | 通用列表动态分页、筛选回首页、Dashboard7条、相对字段命名/顺序、Sidebar图标 |
| `src/design-system/tdesign.tsx` | 导出官方ViewListIcon的既有适配器 |
| `AGENTS.md`、四份指定设计/字段规范 | 更新首页、分页、审核、图标与字段规则，移除冲突旧规则 |
| `tests/cross-role-tables.test.mjs`、`tests/v38-sales-designer.test.mjs` | 容量与位置、同名身份、审核人/原始意见、表头/适配覆盖、冻结边界回归 |
| 当前验收目录 | 截图、实测JSON与本报告 |

自动验证命令：

```sh
node --experimental-strip-types --test tests/cross-role-tables.test.mjs tests/v38-sales-designer.test.mjs tests/design-demand.test.mjs tests/sales-order-fields.test.mjs
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build
git diff --check
```
