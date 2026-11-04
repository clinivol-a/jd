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
