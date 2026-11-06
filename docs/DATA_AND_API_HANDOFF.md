# 数据与接口需求对照（非后端API定稿）

本文件只描述目的、输入输出与前端依赖，不规定URL/HTTP方法或数据库结构，不创建服务。所有病例标识和记录为原型演示，禁止当作真实患者数据导入。

|实体|现有字段/类型|流向/关联|未来接口需求|
|---|---|---|---|
|Account/User|UserProfile: name,employeeId,role,department,avatar,phone,email|账户设置→Header/锁屏；localStorage|查询/更新当前账户；头像文件授权；不得保存明文密码|
|Role/Permission|前端角色、owns、审核只读/解锁判断|当前是前端演示守卫|服务端会话、任务授权、实际审核人权限；返回可用操作|
|Hospital|Project.hospital/dataOrigin/demoProjectMetadata|Order级→所有项目表及详情|真实医院主数据ID/名称，不推断合作关系|
|Project/Order|id=orderNo,name,patient,createdAt,dueAt,tasks|projectsFor按订单聚合|按账户/日期查询项目、稳定ID及医院关联|
|Professional Task|id,title,taskType,status,owner,updated,deadline,upstreamTaskId|四阶段/五状态；项目→工作区|任务查询、权限、状态转换；服务端解锁判断|
|Patient Identifier|Task.patient|标识展示，不是完整患者病历|最小必要脱敏标识与访问控制|
|Medical Imaging Series|series.id,name,modality,format,slices,thickness,studyId,studyDate,downloadUrl|Task→Patient/Study/Series|检查/序列元数据、授权影像流与下载、加载错误|
|Engineering Project|CadProject: taskId,upstreamModelId,objects,sketches,features,camera,savedAt|cadProject/localStorage；重建workspace state|读取工程、增量或完整保存、保存成功戳、并发版本/错误|
|Design Result/Artifact|ApprovedModel id,name,version,format,approvedAt,approvedBy,approver；submission snapshot|通过→唯一正式成果→下游只读参考|成果上传下载、提交快照、锁定模型；版本审计保留|
|Review/Approval|Task.review；ReviewerIdentity；ReviewComment定位/状态/replies/submitted|提交→逐条处理→统一复核→整体通过|实际审核人ID/角色/结果/时间/意见/Task/Artifact；授权审核及签署|
|Activity/Audit Event|FlowEvent id,orderNo,taskId,type,name,at,actor,role,description,submissionId,modelId|projectEvents聚合；TaskFlow按阶段可见；reviewRecords审核投影|真实事件查询、唯一ID、时间戳、不可篡改/幂等；不生成未来事件|
|Notification|id,title,detail,createdAt,eventId,taskId,projectId,tone,unread,dismissed|Header和首页→同一ProjectTarget|列表/已读/关闭、真实收到时间、通知订阅与投递|

## 存储与迁移

clinivol-prototype-tasks是原任务，clinivol-catalog-tasks是隔离目录演示任务；clinivol-task-flow-events、clinivol-review-comments、clinivol-workspace-state、clinivol-upstream-feedback、clinivol-user-profile、clinivol-notification-preferences、clinivol-theme-preference沿用原键；CAD按任务保存工程/快照，见cadProject.ts。面板、视角、筛选等UI偏好与工程数据分开，不能因拖拽布局伪造工程保存。

后端接入前明确鉴权、数据来源demo/production、时区、并发与幂等、文件授权、错误结构、审计保留。审核意见position/slice/view/seriesId/camera必须能恢复空间定位。事件时间用完整ISO，显示按dateTime.ts，不把相对时间存成审计时间。实际操作人和审核角色必须由可信会话与权限得出，不能相信客户端填值。前端Owner名称映射不是正式权限系统。

浏览器语音识别仅辅助输入；真实语音服务另评估隐私及权限，不自动发送评论。电子签署、实名认证及管理员权限配置本次未开发。


## 账号集成开发分支 V1.0 补充（2026-11-06）
本节仅说明隔离账号集成分支，不改变原设计交付Tag或已发布基线。注册必须手机验证、必填密码及确认、资料、管理员审核；批准前没有业务会话。批准后同账号支持短信与密码登录，扫码绑定增加凭证、不重复审核。原A工作区通过服务端会话门控最小包裹接入，业务数据仍为原前端演示数据。

新增 `GET /api/auth/registration/context`：读取当前设备的限时注册验证上下文（已验证手机号、一次性proof），仅用于衔接未注册短信登录/首次扫码，非业务授权。`POST register` 服务端强制密码格式，使用scrypt；publicAccount只返回hasPassword，不返回hash/salt。会话内部区分credentials与scan来源；解绑撤销scan来源会话、候选授权及未完成扫码，保留独立验证的其他凭证会话。

真实短信投递、微信官方身份、生产会话与权限存储、管理员审批接口和自然人唯一身份核验仍需后端接入。当前本地审批控制台服务于销售测试场景，不能视为真实管理员认证；医生等工作台未在此分支扩展。详见 `docs/auth/AUTH_V1_AUDIT.md` 的逐项证据及边界。


### 2026-11-06账号定向修正补充
未注册短信登录返回registrationRequired但前端必须留页提示，用户点击立即注册才读取限时context。注册提交改为organizationId，服务端目录解析名称，未知/待核实单位不可注册为正式单位。GET organizations返回source:isolated-demo目录；POST organizations/request持久保存pending申请，不直接创建单位。正式目录接口由未来管理员后端实现。

所有otp/send均需security/start或security/verify签发的设备、手机号、用途绑定permit，90秒一次性；验证码5分钟、60秒重发、5次校验，手机号及IP频控。当前挑战为隔离本地服务端计算校验，不等于正式反机器人服务。

scan/create增加provider=wechat|wecom；未绑定且本地可信fixture有手机号时返回注册context或显式绑定候选，否则短信验证。渠道凭证独立，业务账号复用。official IdentityProviders的start/verify契约保留，但尚未连接官方配置/回调流程，缺服务返回503。provider成员身份绝不直接赋平台权限。当前交付分支及原A页面不变；详见docs/auth/TARGETED_AUTH_20261106.md。
