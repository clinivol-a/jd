---
version: 1
slug: "src-admin-adminworkspace-tsx"
primary_target: "src/admin/AdminWorkspace.tsx"
related_targets: ["src/admin/AdminTable.tsx","src/admin/admin.css"]
---

# CliniVol A V3.8 管理工作台

## Scope and mode

Operate。面向本地超级管理员，在现有 A 工作台内完成订单监督与受理、专业任务调度、资质/账号审批、医院与人员管理、权限查询、资产追溯和审计检索。以 1366/1440/1920 桌面浏览器为本轮已复核设备范围。

这是已完成实现的增量记录，管理端继承 A 的视觉体系，没有建立新的视觉世界。范围仅为隔离目录中的管理端；不重写 `PRODUCT.md`、`DESIGN.md` 或全局 sidecar，不调整原销售/工程师界面、全局 CSS、Token、Logo 或专业工作区。

## Inherited visual authority

以当前 [AGENTS.md](../../AGENTS.md)、[tokens.md](../../design-system/tokens.md)、[icons.md](../../design-system/icons.md)、[component-rules.md](../../design-system/component-rules.md)、[ui-ux-consistency.md](../../design-system/ui-ux-consistency.md) 和 [field-dictionary.md](../../docs/product/field-dictionary.md) 为六项规范入口；[Figma 映射](../../design-system/figma-variable-mapping.md)继续限定主题来源。`PRODUCT.md`、`DESIGN.md` 的早期范围描述按这些文件已登记的历史边界理解，不由本说明改写。

- 复用 A 的 `GlobalHeader` 和真实 Logo 资源：Header 高 56px，管理端不显示专业任务 Tabs。主题、通知、账号、锁屏和设置继续沿用现有公共入口。
- 复用 TDesign Menu 及原侧栏语法：展开 224px、收起 64px，选中品牌底/反色文字，普通 Hover 中性灰，底部折叠入口保留；收起不改变 Header 和 Logo 尺寸。
- 业务页面流体全宽，继承左右 24px 安全边距及 `.page` 的顶部 24px、底部 46px；没有管理端专属的全局间距体系。
- Card 继承现行 A 的官方 6px 组件例外；其他圆角、阴影及字号继续引用既定 Token。正文和表头 14/22 Regular，模块标题 16/24 Medium，页面标题 24/32 Medium；不缩小文字补空间。
- 默认 Light，保留既有 Dark 偏好。品牌绿、Info 蓝、表面、文字、边框及语义状态全部沿用运行主题；`admin.css` 只补充管理内容布局，不定义新的色阶。

## Implemented composition

首页按“欢迎区 → 五张业务统计卡 → 四组摘要”组织。统计卡和其点击列表来自同一管理快照与集合；卡片保留 A 的统计图标、数字层级和键盘可点击结构。摘要最多三条，不把首页改为完整列表，也不生成空白业务行。

完整列表保持同一主 Card：标题/操作区 → 有可见 Label 的筛选 → TDesign Table → Pagination。订单还提供医院、负责组长与创建时间筛选；跨模块 Tabs 分别保留状态，不共用单一 Tab 值。搜索、状态与其他条件按当前集合组合，重置清空条件并恢复第一页。

`AdminTable` 统一使用 `id` 行键、单行省略、真实 Empty 和行 Hover。长名称由现有 Tooltip 读取完整内容；操作列使用右侧固定列，在表格内部横向滚动时仍可见，操作标题与内容左对齐。完整表当前每页 8 条，无每页数量选择器和跳页输入；首页摘要不分页。页码缓存依据列与稳定行 ID 形成键，不因 Drawer 引起的数组重建回到第一页；账号存储仍按现有认证上下文隔离。

订单与医院详情复用 `PageBack` 和纵向业务 Card。返回文字取实际来源模块；进入详情前保留筛选、模块 Tab、页码及滚动上下文，返回恢复。直接进入详情无来源时回到对应默认列表。按钮 Hover 只反馈自身，列表 Hover 覆盖完整有效行宽。

详情字段复用 `project-info-grid`；设计阶段复用 `StageLabel`；历史记录倒序显示实际事件及审计时间。审批、分配和原因输入沿用 TDesign Dialog；医生、人员、审批、资产及审计详情使用 Drawer。未接入的真实成果预览、专业审核与分享撤销保持明确的能力边界。

## State and professional semantics

- 任务未开始为中性灰、进行中/订单处理中为独立 Info 蓝、待审核/待审批为 Warning、审核退回/停用为 Error、完成/通过/启用为 Success；保留文字状态，不仅依赖颜色。
- 三维重建/CAD 设计/有限元分析/3D 打印继续使用 Cyan/Purple/Yellow/Pink 设计阶段身份，不以阶段色替代状态色。
- 已分配且尚未开始的任务显示“已分配，尚未开始”。分配不等于开始，也不解除上游成果审核依赖；不凭负责人存在就显示“进行中”。
- 日期继续复用 `dateTime.ts`：日期字段、具体日期时间和审计时间按既有场景使用，不另建格式矩阵，不用打开页面时间补造记录。

## Routing and service isolation

`IntegrationRoot` 依据服务端验证的当前会话路由：`super_admin` 进入 `AdminWorkspace`，`designer` 进入原 `App`，其他现有业务角色继续原销售入口。管理页不读取本地角色字符串自行授予权限；管理服务另检查角色、具体权限、医院范围和记录版本。

新增管理 UI 位于 `src/admin/`，服务位于 `server/admin/`。显式本地启动器使用 Vite 5230、认证/管理 5231；状态保存在独立 `.local/admin`，认证使用该目录独立的 `.local/auth`。服务标记 `isolated-admin` / `local-auth`；ADM 合成业务不合并原销售/工程师 LocalStorage、不改写原专业工程。生产或公开认证 Origin 不由本启动器提供管理演示服务。

当前 `readiness` 明确跨角色统一业务、真实专业审核写入及源文件下载尚未接通。已有本地待开通账号审批与隔离业务人员权限登记分别说明来源；管理员职责不自动授予专业成果审核资格。真实患者、附件 ACL、临床影像、销售分享管理与生产事务能力仍以交接文档列出的待接入项为准。

## Finished-build evidence and verdict

文档核对了 `AdminWorkspace.tsx`、`AdminTable.tsx`、`admin.css` 及以下真实本地截图：

| 证据 | 可见结果 |
|---|---|
| [02-home-light.png](../../docs/admin/v38/screenshots/02-home-light.png) | 原 Header/Logo、八项侧栏、五统计卡与四摘要的 Light 结构 |
| [03-home-dark.png](../../docs/admin/v38/screenshots/03-home-dark.png) | 相同布局和既有 Dark 表面、文字、状态与阶段语义 |
| [04-order-list.png](../../docs/admin/v38/screenshots/04-order-list.png) | 同一主 Card 中的可见筛选 Label、表格、底部分页及固定操作列 |
| [06-task-dispatch.png](../../docs/admin/v38/screenshots/06-task-dispatch.png) | 四阶段 Tag、依赖/状态、真实禁用与可见分配入口 |
| [08-hospital-leaders.png](../../docs/admin/v38/screenshots/08-hospital-leaders.png) | 实际医院管理 Tab、当前唯一组长、关联医生及自身文字操作 |

独立 finish reviewer 的最终结论为 **ship，限本地桌面管理 UI**。四项问题已关闭：未开始任务文案、主列表 Card 与可见筛选 Label、溢出表格固定主操作列、稳定分页缓存与详情/Drawer 上下文。对应浏览器回归标记见 [cv38-review-fix-checks.json](../../docs/admin/v38/cv38-review-fix-checks.json)，完整已测/未测边界见 [ACCEPTANCE.md](../../docs/admin/v38/ACCEPTANCE.md)。

截图和 UI 复核不等于正式集成或生产认证。本说明不认证生产鉴权/安全、跨角色持久化、临床审核、成果分享接口或未实测业务；完整键盘、屏幕阅读器与数值对比度验收尚未完成。未部署、未推送；保持 [HANDOFF.md](../../docs/admin/v38/HANDOFF.md) 的隔离服务与待接入边界。
