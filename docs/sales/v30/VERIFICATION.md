# A方案 V3.0 新建订单与输入组件验证

日期：2026-11-13。开发分支：`feature/account-auth-integration`。
安全恢复点：`backup/before-sales-v30-20261113`（基线`3283bdf42ad1cec7277bc7553ba987eada91a8b6`）。
本轮没有部署、推送、更新design-handoff、正式Tag、全局Token或专业工作区源代码。

## 修改及原因

1. `src/index.css`原全局`input:focus-visible`额外增加3px浅绿光环，与TDesign 1.18.4外层Input的官方2px Focus重叠。移除对内部原生Input的重复覆盖，保留TDesign外层及Error、Textarea自身、键盘焦点；普通非TDesign输入保留可见焦点，不全局清除shadow。
2. 注册Steps与表单保持460px内容边界，修正Dot步骤固定140px内容的居中偏移，首标题与表单左起点一致；不改变认证逻辑。新订单保留原数字Steps，四步为客户与患者、服务需求、资料上传、确认并提交。
3. 新订单Steps最大760px；桌面主表单380px；窄桌面按可用宽度扩展。所有控件复用同一容器，不改其他表单。
4. 新订单移除病例Label/Select/Tooltip/新建病例Dialog，患者可手填且必填。近期订单、完整订单表、确认与详情移除病例编号。旧`caseId`保留，新单按授权医生建立内部关联，修改患者不覆盖共享旧Case，不按姓名去重。
5. 临床需求是轻量块式编辑：多段文字、段落级加粗、有序/无序列表、当前位置段落后的图片/视频块。编辑、确认与详情共用安全结构化内容。不是任意HTML编辑器，不含字体/颜色/表格工具。
6. 媒体经类型、大小、签名验证和IndexedDB事务完成后才插入；失败保留独立文件副本用于真实重试，避免TDesign改动内部集合后丢失重试文件。订单只保存元数据及稳定ID；预览临时Object URL不落入订单，卸载撤销。

## 实测布局

| 视口宽 | 表单宽 | Steps宽 | 表单/Steps左起点 | 页面横向溢出 |
|---|---|---|---|---|
| 1920 | 380 | 760 | 272 / 272 | 无 |
| 1440 | 380 | 760 | 272 / 272 | 无 |
| 1024 | 380 | 704 | 272 / 272 | 无 |
| 920 | 600 | 600 | 272 / 272 | 无 |

注册1440视口：Steps与表单均左72、右532，首标题左72。平台既有最小宽度920px保持不变；小于920px手机业务壳未作为本轮支持范围验证，没有擅自重设计Header/Sidebar。

## 测试环境与边界

- 复用本地Vite `http://127.0.0.1:5210/`。浏览器验收采用独立认证测试实例与真实现有销售校验中间件，通过Playwright转接本地API；合成陈屿/李明会话、订单与媒体在隔离浏览器上下文中，未重置当前日常演示账号或订单。
- PNG为项目已有非临床视觉资源，MP4由浏览器Canvas/MediaRecorder生成并真实播放；没有使用患者影像或上传到公开静态资源。
- 媒体当前真实保存在本浏览器IndexedDB（单文件20MB，PNG/JPG/WEBP/MP4）。不支持换设备、清理浏览器后的恢复，不冒充正式云上传；该适配器没有字节级分段上传进度，界面呈现实际保存中/完成/失败，不虚构进度。生产需文件存储、账号授权、内容安全、视频转码/兼容与资源生命周期接口。
- 权限实测覆盖当前隔离适配器的归属检查及跨owner不可读；不声称前端/IndexedDB构成生产鉴权。完整工程师/CAD专业命令、生产跨设备上传未重新全量测试。

## 38项验收

“通过”仅限下述实测范围；证据JSON不含密码、验证码、密钥或媒体Blob。原型资料不是临床或生产数据。

| # | 验收项 | 结果 | 实际证据 |
|---|---|---|---|
| 1 | 登录Input Focus | 通过 | 登录页修复前/后截图，内部shadow none，外层官方2px |
| 2 | 注册Input Focus | 通过 | 注册实际页与同组件矩阵 |
| 3 | Select Focus | 通过 | Light/Dark矩阵、订单医院/科室/医生实际选择 |
| 4 | DatePicker Focus | 通过 | 矩阵；订单实际选日期，含RangePicker |
| 5 | 搜索框Focus | 通过 | 矩阵及工程师我的项目实际聚焦截图 |
| 6 | Textarea/编辑器Focus | 通过 | 矩阵与订单实际编辑，编辑器单一外表面反馈 |
| 7 | 无双层描边 | 通过 | 16个控件检查，TDesign内部Input shadow均none |
| 8 | 键盘Focus可见 | 通过 | Tab/Shift+Tab实际遍历，focus-visible为true |
| 9 | Light/Dark | 通过 | 双主题控件矩阵、订单深色含媒体截图 |
| 10 | 注册Steps对齐 | 通过 | 实测左72/右532与表单相同，首标题左72 |
| 11 | 订单Steps | 通过 | 四步实际切换，边界不超主内容区 |
| 12 | 主要输入宽度缩小 | 通过 | 原760px → 桌面380px |
| 13 | 控件统一宽度 | 通过 | 实际五个主要Input/Select均380px |
| 14 | 窄屏无溢出 | 通过 | 920/1024窄桌面；不包含920以下手机业务壳 |
| 15 | 客户与患者 | 通过 | Steps及第一步截图 |
| 16 | 病例交互移除 | 通过 | 实际第一步无病例控件/新建病例，页面源码Dialog删除 |
| 17 | 患者手填 | 通过 | 实际输入合成患者并保存 |
| 18 | 患者必填 | 通过 | 点击下一步触发字段提示；共享规则测试 |
| 19 | 首页近期订单无病例列 | 通过 | 实际销售首页检查及共享列定义 |
| 20 | 完整订单表无病例列 | 通过 | 实际订单列表截图/断言 |
| 21 | 详情无病例编号 | 通过 | 旧订单、新图文订单详情实际检查 |
| 22 | 历史订单正常 | 通过 | 旧单实际打开；历史关联保留/不覆盖测试 |
| 23 | 文字编辑 | 通过 | 实际输入、段落加粗、增加段落、列表选择 |
| 24 | 插入图片 | 通过 | 实际选择PNG、持久化、内容显示 |
| 25 | 插入视频 | 通过 | 实际生成并选择MP4、持久化、内容显示 |
| 26 | 图片预览 | 通过 | 实际打开预览且等待图片可见 |
| 27 | 视频播放 | 通过 | 实际play成功、paused=false |
| 28 | 失败与重试 | 通过 | 格式内容错误；注入一次IndexedDB写失败后，同文件重试成功，删除媒体成功 |
| 29 | 草稿保存完整 | 通过 | 保存后详情文字、图片与视频均存在 |
| 30 | 刷新恢复 | 通过 | reload后按稳定ID从IndexedDB重新读取媒体 |
| 31 | 确认页内容 | 通过 | 实际第四步含视频/图片，不替代正式影像 |
| 32 | 详情只读 | 通过 | 新旧订单实际展示及截图 |
| 33 | HTML注入防护 | 通过 | HTML载荷被当文字呈现，未执行、未生成img/script；格式校验测试 |
| 34 | 无公共敏感文件链接 | 通过 | 当前媒体仅账号隔离IndexedDB；跨owner读取失败，无public目录媒体。生产权限未接入 |
| 35 | 其他三步 | 通过 | 真实选日期、影像上传、确认、提交成功；状态未改制 |
| 36 | 销售工作台 | 通过 | 首页/列表/旧详情/新单/保存/提交及现有45项销售测试 |
| 37 | 工程师工作台无回退 | 通过（范围内） | 五卡、项目筛选、三维重建001实际进入；工程师/专业源码无差异。CAD完整命令未重跑 |
| 38 | TypeScript/Vite | 通过 | pnpm run build成功，既有大chunk警告保留 |

没有把上述有限回归扩写成“所有业务及生产能力全部验收”。

## 自动检查结果

- 销售测试45/45通过（新增4项：无需手选Case、历史身份隔离、临床需求与正式影像分别校验、内容/媒体归属安全）。
- 账号测试48/48通过，认证业务源码未改。
- 浏览器链路无pageerror；真实保存草稿→刷新→确认→提交成功，见[flow-results.json](flow-results.json)。
- 返回既有详情、真实重试/删除、布局尺寸及工程师检查见[browser-regression.json](browser-regression.json)。
- 16控件双主题与键盘见[focus-results.json](focus-results.json)；安全载荷、格式/大小/归属拒绝见[security-results.json](security-results.json)。
- Impeccable机械扫描只报告原`index.css`既有86项历史建议（含专业视窗网格/旧硬编码）；新编辑器、订单局部CSS、注册CSS无扫描命中。本轮未借扫描整改无关专业页面或Token。
- git diff --check通过；tokens.css、tokens.json、App.tsx及CAD/三维专业实现没有改动。

## 截图索引

- Focus：[修复前](login-focus-before.png)、[修复后](login-focus-after.png)、[浅色矩阵](focus-controls-light.png)、[深色矩阵](focus-controls-dark.png)、[工程师筛选](designer-filter-focus.png)。
- 布局：[注册对齐](register-alignment.png)、[订单第一步](order-step1.png)、[窄桌面](order-compact.png)、[第二步](order-step2.png)。
- 内容：[图文视频编辑](order-rich-media.png)、[预览](media-preview.png)、[失败提示](media-failure.png)、[深色](order-dark.png)、[确认](order-confirm.png)、[详情](order-detail-rich.png)、[提交结果](order-submitted.png)。
- 回归：[订单表无病例编号](orders-no-case.png)、[工程师首页](designer-home.png)。

## 修改文件

- 输入与布局：`src/index.css`、`src/auth/authPages.css`、`src/sales/sales.css`。
- 订单：`src/sales/OrderPages.tsx`、`SalesWorkspace.tsx`、`model.ts`、`orderRules.mjs`。
- 内容及存储：`src/sales/ClinicalEditor.tsx`、`clinicalContent.mjs`、`clinicalContent.d.mts`、`files.ts`；`server/sales-demo.mjs`补充当前会话归属校验。
- 测试：`tests/sales-orders-v30.test.mjs`及本目录验收证据。隔离浏览器执行脚本与临时服务位于忽略目录`.local/v30`，不随交付打包。
- 规范：`AGENTS.md`、`design-system/component-rules.md`、`design-system/ui-ux-consistency.md`、`docs/product/field-dictionary.md`追加V3.0范围。未新增第二套规范，未改颜色/字体/圆角/阴影数值。
