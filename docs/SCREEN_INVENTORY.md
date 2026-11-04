# 页面与交互清单

页面使用hash路由，刷新二级hash由同一个Vite入口恢复；设置、锁屏、通知及弹窗为状态界面，不伪造独立URL。

|页面|模块|入口|组件|主要交互|数据来源|状态/后续|
|---|---|---|---|---|---|---|
|工作台首页|平台|#home|ProjectDashboard|五卡进入任务筛选；项目6行；最近项目3条；通知到项目|Task、Project、Notice、FlowEvent|React前端可用；云端数据待接入|
|我的项目/任务视角|平台|#projects|ProjectList|搜索、日期、阶段/状态筛选、分页、切换视角|projectModel共享筛选|后端分页与权限待接入|
|项目详情|平台|#project/{orderId}|ProjectDetail|基本信息、阶段卡片、成果只读/编辑入口、流转|同订单任务和已发生事件|真实审计接口待接入|
|任务详情兼容入口|平台|#task/{taskId}|TaskDetail/validateRoute|旧路由归属项目；重建/CAD/其他阶段详情组件保留|Task/上游ApprovedModel|不新增中转页面|
|审核记录|平台|#reviews|Reviews/reviewRecords|审核专用投影、详情跳转|Task.review、审核FlowEvent|真实审核身份及查询待接入|
|三维重建工作区|专业|#workspace/{taskId}|Workspace|AI/视图/图像/分割、树、四视图、对象、属性、侧栏|Task.series/ProfessionalObject/localStorage|DICOM与医学算法尚未接入|
|CAD工作区|专业|#cad/{taskId}|CadWorkspace|模型树选择、工具分组、浮动参数、撤销、视角、属性|CadProject/用户演示STL|精密几何内核待接入|
|审核意见|浮层|专业工具栏/审核事件入口|ReviewCommentsPanel|列表/长标题展开、定位、讨论、语音、标记、提交|ReviewComment/replies|医生权限与真实复核服务待接入|
|GlobalHeader/通知中心|全局|所有已登录页面|App GlobalHeader/Drawer|Home/任务Tab/主题/通知/帮助/锁屏/账户|UserProfile/Notice/openTabs|通知投递待接入|
|个人资料|设置|账户→个人资料|SettingsPage|编辑头像/姓名等、保存取消、返回|clinivol-user-profile|真实账号服务待接入|
|账户安全|设置|账户→账户安全|SettingsPage|密码表单校验/验证说明/退出|前端表单与当前会话|不执行真实密码修改或身份认证|
|偏好设置|设置|账户→偏好设置|SettingsPage|主题同步、中文、通知开关|主题/通知偏好存储|其他语言未开放|
|锁屏/解锁|全局状态|Header锁屏|LockScreen/App|账户头像、解锁表单、恢复|当前账户/前端状态|不是系统级安全锁|
|未登录占位|全局状态|退出确认后|App|重新进入演示|authenticated前端状态|不是服务器登出|
|帮助内容|弹窗|Header帮助|HeaderHelp|手册/教程/关于/账号管理；Esc关闭|内置内容|账号切换和许可禁用，资源未接入|
|资料/专业操作/审核/退出弹窗|弹窗|对应页面按钮|App/CadWorkspace/Dialog|元数据、下载不可用、参数校验、确认取消、只读反馈|当前Task/对象/工程|依据实际资源和命令能力启用|

源码：平台/审核/账号为src/App.tsx；项目页面src/projects/ProjectPages.tsx；路由src/projects/routes.ts；CAD src/cad/CadWorkspace.tsx；帮助src/HeaderHelp.tsx。组件共享日期、Icon、Tag及主题Token。空结果不生成假记录；缺失资料不生成假文件；保存失败阻止相应提交；未解锁及只读通过现有状态与依赖守卫处理。
