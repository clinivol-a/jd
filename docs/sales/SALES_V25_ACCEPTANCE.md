# 销售客户管理 V2.5 验收记录

日期：2026-11-12。分支：feature/account-auth-integration。

修改前基线：`2a3779985c1b651543d0d6a715c0da8de795b971`。
安全恢复 Tag：`backup/before-sales-v25-20261112`。
本地预览：http://127.0.0.1:5213/ （仅本机地址，不是公网演示）。

## 实际改动

- 客户筛选复用 `project-filters`，字段名独立显示。医院、科室、状态均提供真正的「全部」选项。关键词沿用防抖、条件 AND、变更回第一页和重置。订单仅同步「全部」选项及默认显示值。
- 医生列表改称「医生」，复用订单列表 Card 和分页机制。行高实测 60px。移除文字按钮横向透明边框带来的 1px 偏差；三种桌面宽度下表头和操作文字起点一致。
- 初始六份可识别的合成医生档案补稳定电话号码；迁移仅填这些档案的缺失电话，不覆盖任何已填写号码。现存用户建档中仍有一份缺失电话，保留「未提供」，未擅自编造。
- 专属码只展示真实二维码、简短说明及两项操作，不展示原始 URL、邀请码或计数。复制仍使用二维码同一 URL。桌面协助入口保留当前来源，服务器核对负责销售会话并记录实际销售操作人。
- 建档表单三个 Section、官方 FormItem、官方 Upload Icon。图片采用 TDesign file-flow + showThumbnail，PDF/其他采用文件列表。缩略图来源为实际保存文件，不伪造上传进度。
- 文件类别由上传区域确定，其他 PDF 不再自动算作执业证明；另设执业证明 PDF 区域。分类、预览、失败、重试及草稿/提交均已检查。
- 医生详情取消 Tabs，复用 `project-info-card` 为五张纵向卡片；内边距实测 24px、卡片间距 20px。基本资料三列、状态仅一处、操作集中标题右侧。关联订单按 doctorId 过滤，仅保留查看详情；跟进及审核只展示实际记录，日志按原时间戳倒序。

## 38 项验收

| # | 项目 | 结果 | 证据 / 边界 |
|---|---|---|---|
|1|搜索独立 Label|通过|浏览器显示医生姓名 / 手机号|
|2|医院真正全部选项|通过|下拉截图 filter-hospitals|
|3|科室真正全部选项|通过|下拉截图 filter-departments|
|4|审核状态全部选项|通过|下拉截图 filter-status|
|5|默认全部|通过|三个客户 Select 实际选中全部|
|6|即时筛选|通过|医院 + 审核通过 + 林，AND 结果为林致远一条；关键词防抖沿用|
|7|重置筛选|通过|重置后恢复完整可见记录；没有应用按钮|
|8|订单全部文案|通过|四个 Select 最终显示全部，医院选项检查；业务筛选规则保持|
|9|列名医生|通过|客户表头已核对|
|10|演示电话完整稳定|通过|初始六份档案固定合成号码；已填电话及权限脱敏保留；未知用户缺失值不伪造|
|11|操作左对齐|通过|1366:1198/1198，1440:1272/1272，1920:1701.39/1701.39（表头/文字 X）|
|12|Card 高度策略一致|通过|同类 sales-order-list-card；1920 下两者 976px；60px 行高，分页 Card 内底部|
|13|专属码无原始 URL|通过|invite-dialog 截图|
|14|手机实际扫码|未实际验证|真实 SVG QR、同一 URL 的桌面入口有效；本轮没有手机扫描证据，局域网可达性取决于手机网络|
|15|复制链接|通过|实际剪贴板包含邀请 URL，TDesign Message 提示成功|
|16|打开邀请入口|通过|新标签显示实际医生建档表单，销售李明|
|17|无 Wi-Fi 提示和计数|通过|专属码弹窗核对|
|18|表单三组间距|通过|Section 上距24px，标题下距16px，前组末字段下距24px + 后组上距24px，分组总间隔大于字段间隔|
|19|FormItem 间距|通过|官方组件，字段 margin-bottom 实测24px；未改全局 Form|
|20|官方上传 Icon|通过|tdesign-icons-react UploadIcon + 官方 Upload、选择文件|
|21|图片预览|通过|合成 PNG 实际上传、缩略图数量1、实际预览 Dialog|
|22|PDF 查看|通过|实际 Blob PDF iframe 预览，pdf-preview|
|23|其他 PDF 分类|通过|仅 other PDF 时提交被执业证明字段校验阻止；practice 区上传后通过；回归用例通过|
|24|保存草稿|通过|顾景川合成档案实际保存，详情显示草稿和三类附件|
|25|提交和验证|通过|空表单字段级错误；普通 PDF 不满足 practice；补充后实际进入待审核并生成真实提交事件|
|26|详情无 Tabs|通过|医生详情 DOM 未出现 Tabs；医院详情原有 Tabs 未动|
|27|五张纵向 Card|通过|基本资料/资质材料/关联订单/业务跟进/审核记录|
|28|状态在基本资料标题|通过|doctor-detail-top|
|29|状态无重复|通过|仅标题一个 Tag，待审核使用只读文字|
|30|操作不混排|通过|编辑、提交在基本资料标题右侧；跟进入口在跟进标题右侧|
|31|真实关联订单|通过|林致远详情有其关联订单；新档案无关联订单显示 Empty，未创建假订单|
|32|真实业务跟进|通过|按 target 和业务跟进事件过滤，无记录显示 Empty；未虚构跟进|
|33|审核倒序|通过|按原始时间降序；实际提交后显示李明提交事件；不改历史操作人|
|34|Light|通过|客户列表、邀请、建档、详情截图|
|35|Dark|通过|医生详情实际切换主题，doctor-detail-dark；不改变全局 Token|
|36|李明账号|通过|实际销售会话可访问筛选、上传、草稿与提交；协助入口权限接口测试通过|
|37|陈屿工程师工作台|未实际验证|本轮未重新登录陈屿做浏览器全流程；工程师/CAD/Header/认证源码零改动，check-a-integration通过|
|38|TypeScript/Vite|通过|最终构建通过；31项销售测试通过；集成脚本通过|

共：36 项通过，0 项失败，2 项未实际验证。没有把构建作为手机或工程师浏览器验收的替代证据。

## 截图

证据目录：[v25](v25/)。

- 客户完整列表：[1366](v25/customers-1366.jpg)、[1440](v25/customers-1440.jpg)、[1920](v25/customers-1920.jpg)。
- 筛选：[医院](v25/filter-hospitals.jpg)、[科室](v25/filter-departments.jpg)、[状态](v25/filter-status.jpg)。
- [专属码](v25/invite-dialog.jpg)、[实际邀请入口](v25/invite-entry.jpg)。
- [建档表单](v25/doctor-form.jpg)、[缩略图](v25/upload-thumbnail.jpg)、[失败/重试](v25/upload-failure.jpg)、[图片预览](v25/image-preview.jpg)、[PDF预览](v25/pdf-preview.jpg)、[分类校验](v25/other-pdf-validation.jpg)。
- 医生详情内部滚动，分别记录[上部](v25/doctor-detail-top.jpg)、[下部](v25/doctor-detail-bottom.jpg)、[深色](v25/doctor-detail-dark.jpg)。
- 与工程师项目详情采用同一 `project-info-card`、`project-info-grid`、`section-heading`、`timeline`；本轮未取得工程师浏览器对照截图，不宣称已完成该截图验收。

## 修改文件

`src/sales/SalesWorkspace.tsx`、`SalesInvite.tsx`、`SalesAttachments.tsx`、`sales.css`、`model.ts`、`migrate.ts`；`server/sales-demo.mjs`；销售邀请、迁移及模型测试；本验收文档和截图。

## 验证与限制

- `pnpm run build` 通过；已有 chunk 大于500kB的非阻断提示保持，不借此拆包重构。
- `node --experimental-strip-types --test tests/sales*.test.mjs`：31/31。
- `node scripts/check-a-integration.mjs`：通过，原任务、状态、持久化、CAD几何/历史及关联约束保留。
- 实际上传中状态来自组件异步请求（已观察上传中0%），useMockProgress=false。没有人为延时或假进度。21MB失败、重试保持失败、移除失败队列已操作。
- 手机扫码、手机网络可达性仍需实际手机复核。复制和桌面建档入口不是公网部署。
- 邀请协助者身份、未授权403、已验证手机号不重复建档有服务端回归用例；本轮未在浏览器完整走一遍邀请手机验证提交。
- 合成验收档案顾景川/QA-V25-QUAL-01保留在本地待审核，未删除任何原订单/医生。已有用户自建档案缺失电话未编造补入。
- 未部署、未推送、未更新design-handoff、未改正式Tag、未修改全局Header/Token或工程师专业界面。
