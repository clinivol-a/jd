# V3.0 表单局部补充修正

2026-11-13；基线`8fca18e00be24dd1632ecc7a7f4959eaf98718fb`；恢复点`backup/before-v30-form-followup-20261113`。

## 三项修改

1. 医学影像帮助文字只保留“支持 DICOM、NIfTI 或 ZIP 影像文件。”，移除20MB说明与Info Tooltip。实际大小校验保留。第三步资料上传区域最大宽度760px，文件大小、状态、操作列不换行；其他步骤文本区域仍为380px。
2. 第一步只保留医院、科室、医生、患者姓名；手术项目名称及临床需求移到第二步，对应必填校验同步迁移。删除“设计需求或特殊要求”输入，新单确认不展示空的设计需求；历史字段及详情仍保留，不清空旧数据。
3. 销售新建/编辑医生档案的基本资料、执业信息输入区域统一380px，窄桌面随可用宽度扩展。证明材料上传、外部邀请表单保持原宽度。

## 验证

- TypeScript/Vite构建通过；仍只有既有大chunk警告。
- 45项销售自动测试通过。
- 使用当前OrderEditor、DoctorFields和真实TDesign组件的隔离浏览器组件验收：第一步无需填写名称/需求即可在客户患者信息完整后继续；第二步空名称/需求分别报错；返回后患者值保留。
- 实际将合成ZIP附件写入浏览器存储并显示上传成功：上传表单宽760px，状态与删除均为nowrap；各单元格同为47px高，无状态拆字。
- 六个医生Input/Select桌面实测均380px；920px隔离容器下输入随可用区域扩展，无页面横向溢出。
- 本轮没有重新全量测试订单审批、正式云上传或专业工作区。没有改动其代码、数据、Token或部署。

结果：[results.json](results.json)。截图：[第一步](step1.png)、[第二步](step2.png)、[上传](upload.png)、[医生表单](doctor.png)。截图为复用组件局部验收，不是另一套产品页面。

## 文件

- `src/sales/OrderPages.tsx`：字段分组、校验分步、移除重复输入及提示、上传步骤宽度类。
- `src/sales/DoctorFields.tsx`：对基本/执业输入分组增加作用域类，不改变共享字段及上传行为。
- `src/sales/sales.css`：上传宽度/单行状态、销售医生输入宽度。
- `design-system/component-rules.md`、`design-system/ui-ux-consistency.md`：同步本次确认规则。

不部署、不推送、不更新design-handoff，其他未跟踪截图保留。
