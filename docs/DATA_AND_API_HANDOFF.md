# 数据与接口需求对照（非后端API定稿）

本文基础表描述目的、输入输出与前端依赖，不强制生产后端API；末尾新增章节记录当前隔离本地服务的已实现契约。所有病例标识和记录为原型演示，禁止当作真实患者数据导入。

|实体|现有字段/类型|流向/关联|未来接口需求|
|---|---|---|---|
|Account/User|UserProfile: name,employeeId,role,department,avatar,phone,email|账户设置→Header/锁屏；localStorage|查询/更新当前账户；头像文件授权；不得保存明文密码|
|Role/Permission|前端角色、owns、审核只读/解锁判断|当前是前端演示守卫|服务端会话、任务授权、实际审核人权限；返回可用操作|
|Hospital|Project.hospital/dataOrigin/demoProjectMetadata|Order级→所有项目表及详情|真实医院主数据ID/名称，不推断合作关系|
|Project/Order|Order.id/businessNo/projectId；Project.id/orderId/taskIds；历史orderNo兼容|新链路显式ID投影；历史项目保持原聚合|按账户/日期查询项目、稳定ID及医院关联|
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


## 2026-11-20｜本地跨角色统一业务服务

本节记录已经实现的本地契约，不是生产API强制定稿。唯一实现为`server/unified/service.mjs`，在现有`server/admin/http.mjs`与Auth设备会话内接入；前端适配见`src/business`。仅在local + demoMode启用；production返回404，未部署。

### 已实现接口

| 本地入口 | 输入 / 输出目的 | 校验 |
|---|---|---|
| GET /api/admin/business/sales | 当前销售授权Order/Project/实际事件快照 | 当前销售账号、ownerSalesId、医院范围 |
| POST /api/admin/business/save | order、version；保存草稿或修改退回订单 | 可编辑字段白名单、稳定ID、客户/医院/科室范围、并发版本；允许未填完整的草稿 |
| POST /api/admin/business/submit | order、version；校验并首次分配businessNo | 同一事务；patient引用及既有orderErrors；待审核重复请求返回原记录 |
| POST /api/admin/business/delete | 内部id、version | 仅本人未提交草稿；保留实际删除事件 |
| GET /api/admin/state | 管理端原数据加共享订单/任务/事件的授权投影 | 管理角色、orders:read、医院范围；资产/日志分别受权限控制 |
| POST /api/admin/command | 原command契约：takeover/reassign/review-order/assign-task | 共享ID路由至同一服务；实际责任人、审核/分配权限、能力与日期校验 |
| GET /api/admin/business/designer | 当前受让人的Task、项目摘要、实际相关事件 | designer + projects:own；仅assigneeId匹配记录 |
| POST /api/admin/business/task | id、version、start或submit；可附待审核成果ID/版本 | 上游正式成果门禁、任务所属人、状态；不生成审核通过/发布结果 |

所有变更依赖HttpOnly设备会话、同源Origin及X-CliniVol-Request校验，不接受body自报角色。错误使用4xx，不以本地前端成功回退掩盖断线。

### 持久化与身份

- 同一`.local/unified-business/state.json`保存orders/projects/tasks/events/artifacts/年流水；文件和目录受本机私有权限保护，不能提交到Git。
- 写事务使用独占文件锁，重读当前状态，校验唯一及关系约束，fsync临时文件后原子rename；提交失败不消耗号。并发锁冲突409，客户端可重试。多实例可共用同一本地路径。
- 这不是分布式生产数据库。进程崩溃遗留write.lock需确认无活跃写入后人工处理；生产需数据库唯一约束、事务、备份、权限目录及可靠审计存储。
- 业务号只对外显示；内部Order/Project/Task使用独立ID。新Task.orderNo映射内部Project.id，保留原工程关联键。pending成果元数据包含orderId/projectId/taskId/resultId/version，不伪造已审核成果。
- 原ADM数据和旧工程项目不自动关联；仅明确登记的隔离退回fixture允许按原号延续。未知旧号与工程映射需人工确认。

### 尚未接入

1. 生产数据库与可配置医院/医生/销售/工程师权限主数据。当前目录只覆盖明确的隔离测试账号与已核对预置客户；新客户获批后的跨系统主数据写入需接入，不能靠前端自报批准。
2. 销售浏览器私有上传的文件字节→服务端受控影像存储→设计师Series读取。当前保留资料引用，新任务series为空，界面明确提示关联影像不可用。
3. 新共享任务的真实工程快照上传、成果审核决定、发布、下游解锁与销售分享服务。当前仅保留关联和待审元数据契约；新任务缺影像时前端拒绝提交成果。不得宣称全链路临床成果交付已完成。
4. 原工程自动保存仍使用既有按账号/Task ID隔离的工程机制，未借本轮改写；原正式成果与审核历史不迁移、不改身份。

启动现有集成服务：`CV_DEV_PORT=5260 CV_AUTH_PORT=5261 node server/admin/dev.mjs`。不需要新的Vercel项目或部署配置。
