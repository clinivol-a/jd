# CliniVol Design System V1.0 — Component Rules

| 组件 | 规则 |
|---|---|
| Button | TDesign原交互，14/22 Regular，中等点击区域；Primary沿用品牌Normal/Hover/Active，不强改灰；实心Primary使用对应主题品牌语义及TDesign Anti前景（Dark官方Anti=#FFF）；禁用仍沿用组件禁用色。图标与文字垂直居中，间距8px。 |
| Tag | 状态语义独立：未开始灰、进行中Info蓝、待审核Warning橙、审核退回Error红、已完成Success绿；不能用品牌绿代替进行中。 |
| Tooltip | 只限定`.t-tooltip--default`，Light容器白底/主要文字/浅边/shadow-1/8px；Dark对应表面/浅字。箭头同表面。 |
| Dropdown/Popover | 保留TDesign机制、完整14/22文案、不裁切；radius-medium8px、shadow-2；不继承Tooltip专用白底覆盖。 |
| Dialog | radius-large12px与shadow-3，标题Medium；保持原关闭/确认/取消及真实权限，不新增假成功。 |
| Table | 全部正文表头14/22 Regular，单行、省略+Tooltip；固定项目编号/医院/名称三列和右操作列，中间横向滚动。首页最多6项目。 |
| Card | 白色或主题表面、8px，无额外常驻描边阴影；设计阶段卡片是既有浅边框例外；宽内容1140起四列、760起两列、否则单列。 |
| GlobalHeader | 固定56px和既有Logo区域，保持现有头像与任务Tabs；四公共操作Icon用主要文字色，Hover灰，无新增分割线/投影。 |
| Sidebar | 原宽度224/64；选中品牌底白字，默认图标主要文字色，Hover灰；底部收起入口保留。 |
| 三维重建工具栏 | 单排58px；AI/视图/图像/分割，分类浅品牌选中，上下文持续工具品牌实底；一次性命令不保持激活。移除文件/插件入口。 |
| CAD工具栏 | 原单排58px纯Icon+Tooltip和下拉分组，现有命令/浮动参数/模型选择/历史不变。 |

## 交互状态

Default沿用默认表面与主要文字；Hover使用对应中性灰Token；Selected/持续Active使用品牌语义；禁用保持准确的Disabled，不执行命令；Focus使用brand-color-focus可见反馈。禁止全局重写所有:hover。列表Hover覆盖完整有效行宽，独立按钮只反馈自身。

## 数据与导航

以A任务/订单ID聚合项目，名称不作主键。首页/完整列表/最近项目/重要通知/Header通知复用新版ProjectDetail；专业工作区仍按任务ID操作。保留A原localStorage键，不读取实验命名空间，不导入E*实验任务，不改写真实审核身份。任务004/005/006/007的状态与上下游关系保留；任务005未解锁不可进入；006成果只读；007绑定唯一已批准模型。

## 医院与原型来源

医院字段来自项目级数据。已知原型订单可使用demoProjectMetadata中两家医院；仅在非production记录中回退到演示映射。真实记录没有医院则显示空值，不用演示映射补造。名称一致不表示真实客户合作。

## AI与统计能力边界

AI十项按用户顺序显示；当前没有对应AI服务或重建Mesh编辑器，因此规范禁用，不执行假分割，也不显示“尚未接入”。原图像/分割工具及其既有原型操作保留。蒙版体积与统计移至视图，因为没有可计算的体素蒙版而禁用。STL属性统计同属视图：只在当前工程明确关联实际展示STL时读取原文件的三角面、包围盒与文件大小；无文件时禁用，读取失败明确报错，不产生医学结果。

## 不改变的领域

CT黑底、3D医学视图白底、方向识别色与红色审核定位、CAD模型原材质/几何、自动保存/提交/退回/解锁机制均保留。当前浏览器原型不等于真实临床算法、服务端鉴权或制造级CAD内核。

## 2026-11-03主题与阴影确认

Light保持最终Figma色彩及#F5F7F9页面背景例外。Dark仅替换品牌绿阶梯，Normal=Brand8、Hover=Brand7、Active=Brand9；其余全部采用TDesign官方Dark。品牌文字与链接随Brand8；Info独立引用官方原品牌蓝，不能随品牌覆盖变绿。三级阴影均为官方默认参数，不给Header或白色卡片新增投影。精确色值与未来Figma映射见tokens.md和figma-variable-mapping.md。本次为规范更新，尚未同步运行CSS/JSON。
