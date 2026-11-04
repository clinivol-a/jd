# CliniVol A 开发交付 v1.0

日期：2026-11-04。唯一正式设计基准为当前React/TypeScript/Vite/TDesign应用；不另行制作HTML，不等待Figma才开始开发。UI源代码冻结于 `7e347c9d18abeb8491e0986bbcb0aebc885b4e0e`。本次交付文档与隔离整理提交由Tag `design-handoff-v1.0-20261104` 锁定，完整SHA见VERSION.json或 `git rev-parse design-handoff-v1.0-20261104^{commit}`。Tag不允许覆盖。

## 开发环境与安装

Node.js 24、pnpm 11.25.0（package.json）。执行 `pnpm install --frozen-lockfile`、`pnpm dev`；生产资源 `pnpm build` 输出dist。开发地址使用终端实际端口；本机现有预览4194。源码没有个人电脑绝对路径依赖。public/assets包含本地Logo、指定照片和演示STL，不能改为会话链接。锁文件是依赖实际版本依据，TDesign React固定1.18.4。

## 架构与页面

App.tsx负责持久化、主题、导航、任务Tabs、账号、通知与审核协调；projects/ProjectPages.tsx复用ProjectTable、StageLabel、ProjectStatus、ProjectEventList；projectModel.ts聚合项目及筛选，routes.ts处理hash路由。专业重建在App.tsx的Workspace/ProfessionalPanel/ViewGrid；CAD懒加载CadWorkspace，CadScene负责Three.js场景，cadProject及useCadHistory负责工程及历史。通用保存/提交展示复用WorkspaceTaskActions，日期统一dateTime.ts，审核列表统一reviewRecords.ts。

逐页入口、数据、行为与源码见SCREEN_INVENTORY。设置是App状态界面，刷新不恢复指定设置Tab；没有独立服务端设置路由。锁屏点击解锁目前直接返回，不验证密码；锁屏/未登录也是App状态，不是安全认证系统。Header账号切换当前禁用；账号管理进入设置，不存在完整医生工作台或管理员授权后台。

## 核心业务规则

- Order/Project稳定ID关联多个Task；任务ID、订单ID、模型ID不能用名称代替。医院读取项目字段；演示医院不代表真实客户或患者。
- 四阶段：三维重建、CAD设计、有限元分析、3D打印。五任务状态：未开始、进行中、待审核、审核退回、已完成。项目状态是关联任务的聚合，不等于一个Task状态；首页五卡统计的是权限/范围一致的专业任务，待处理=进行中+审核退回，允许类别重叠。
- 提交审核冻结当前成果；审核退回在同一问题串修改、回复并逐条标记，统一提交后才进入复核。通过的问题不因其他问题退回而重置，全部问题通过才可整项通过。工程师不能获得医生复核按钮。
- 审核人员未来按任务和授权配置，可为医生、管理员或其他授权人员；不得按设备所有人或业务员身份替代实际审核人。
- 当前CAD解锁由上游任务已完成且approvedModel存在决定。005未解锁，006成果只读，007可进入CAD。正式成果唯一，ID/提交快照和审计版本保留，但不面向工程师突出Vxx版本。其他未来阶段仍需正式后台实现权限与解锁，不能宣称全部后端已具备。
- 多任务Tab按唯一Task ID打开、切换、关闭；关闭只关闭视图。UI面板宽度和选择不能无条件触发工程保存。
- CAD真实工程内容变化防抖持久化；重建真实编辑按已有自动保存机制。保存时间来自成功写入完整时间戳，失败保留错误；无独立保存工程按钮，Ctrl/⌘+S兼容原操作。
- 进入重建自动使用Task关联Patient/Study/Series和前端已保存状态，不要求先下载导入；当前无DICOM后端解析。无真实下载资源时不可生成假DICOM。
- 项目流转只展示已记录事件，不能根据四阶段配置生成未来等待/通过记录；同订单聚合、Task详情再按阶段可见范围过滤。审核表只包含审核事件，分配/开始属于活动。历史人员不追改。演示种子与production来源隔离，不用演示数据回填真实记录。

## 已实现与限制

可运行前端：项目/任务筛选分页、详情导航、状态Tag、通知筛选跳转、主题、设置编辑、锁屏与演示退出、多Tab、侧栏拖拽、视图控制、CAD对象选择/属性/原型命令、审核问题定位回复/状态/提交交互及本地持久化。

演示：任务、医院、患者标识、评论、审核状态、二维图形、专业参数。STL为用户提供的演示资源，不能称为某患者正式医学成果。AI参数入口可演示，未连接服务时不产生真重建；蒙版统计缺体素数据时禁用。CAD是Three.js原型，工具框架和示意几何不是制造级CAD内核，禁用工具不能宣称可用。

待后端：真实账户、RBAC、认证/安全锁屏/登出、密码变更、审计不可篡改、工程云端保存及并发、文件授权下载、DICOM/PACS、算法任务调度、医生复核身份验证和签署、通知投递。浏览器语音识别依赖支持情况、权限及浏览器服务，需用户确认再发送，不保存原始录音。

## 部署状态

本地无Git远端，未提供GitHub仓库，无法核实远端保护规则或推送。现有A关联项目prj_ZoiOp3jFxDt6IyPOsBkD9sPPRcnp、团队team_A5XHIhGRBN6rFwrZN3D5j8fC来自原A绑定；API返回403团队授权不足。Production分支、Git关联、Preview保护及线上环境配置无法读取，未修改。未发布Preview，不把旧线上域名当作本交付版本链接。恢复授权后执行RELEASE_WORKFLOW。

## 规范与验收

先读AGENTS.md及design-system四份规范；运行tokens.css、tokens.json、dateTime.ts为实现依据。日期和Tag组件例外以最新component-rules为准。验收见ACCEPTANCE_CHECKLIST；数据/接口见DATA_AND_API_HANDOFF。
