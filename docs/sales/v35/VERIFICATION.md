# A方案 V3.5 定向修改验收

日期：2026-11-17。工作分支：`feature/a-v3.1-business-design`。
修改前提交：`8a476a1711c53e0fab66302cb8c3f54df74e6057`。
安全恢复分支：`backup/before-v35-20261117`。
本轮未部署、未推送、未修改main/design-handoff、冻结V3.0、工程师工作区或全局Token。

## 16项验收结果

| # | 项目 | 结果 | 实际检查 |
|---|---|---|---|
| 1 | 删除上传区重复说明 | 通过 | DOM不再包含“依次上传影像报告单和患者信息页面，共两张。” |
| 2 | 开始识别图文间距 | 通过 | 移除局部叠加gap，只保留官方间距；实际8px，按钮高32px。 |
| 3 | 上传区至识别按钮间距 | 通过 | 上传完成状态实际24px，删除最后表单项多余底部间距。 |
| 4 | 两张缩略图分组 | 通过 | 每张官方卡片110px宽，组间8px；长文件名不再撑宽LI。 |
| 5 | 文件名省略和Hover | 通过 | 两个长文件名均单行省略、等高，Tooltip显示完整名称。 |
| 6 | 删除核对页两条说明 | 通过 | 无授权Checkbox文案及“关键身份…”说明；后台匹配仍执行。 |
| 7 | 核对页保存草稿/下一步 | 通过 | 左Outline、右Primary，同32px高度、12px间距。草稿保存、重新编辑、正式提交实际通过。 |
| 8 | 删除重复总括校验 | 通过 | 性别/身份证使用各自FormItem；实际输入无效身份证只出现字段提示。 |
| 9 | PACS按钮主次和位置 | 通过 | 保留左Outline查询检查，右Primary导入数据；未选中禁用导入，选中后可继续。导入后核对页为保存草稿/下一步。 |
| 10 | 阶段第二/三行间距 | 通过 | 实测12px，与工程师端一致；第三行22px，不再因32px容器产生额外空白。 |
| 11 | 五种阶段状态 | 通过 | 未开始、进行中、待审核、审核退回、已完成分别渲染测量：12px行间距，20px底部内边距，三行自然高度134px。 |
| 12 | 分享页任意数字演示验证 | 通过 | 隔离服务发送后输入“7”可查看只读CAD成果；0、1位、多位数字服务测试通过。仍验证手机号授权、分享Token、有效期、批准与发布状态。 |
| 13 | 验证码反馈位置 | 通过 | 官方FormItem成功/错误提示互斥；距验证码输入组8px、距主操作20px，成功为Success Token。 |
| 14 | 只读成果访问 | 通过 | 独立390×844浏览器完成发送、错误提示、任意数字验证和模型展示；无源文件下载按钮。 |
| 15 | 构建 | 通过 | TypeScript/Vite生产构建通过；26项相关服务测试通过，0失败。保留既有大chunk警告。 |
| 16 | 未部署 | 通过 | 仅本地代码、规范及验收证据，无Vercel/GitHub发布操作。 |

## 实现边界

- “任意数字”仅用于显式启用`demoShareCodes`的隔离开发服务。默认BusinessService保持严格OTP；NODE_ENV=production即使传true也不会启用，生产防误用测试通过。
- 发送步骤和服务端限时记录保留；不能跳过发送、使用过期验证码、访问未授权手机号或已撤销分享。登录/注册、医生邀请和真实认证的验证码规则没有改变。
- 演示不代表真实短信或手机号身份验证。真实OCR/PACS、生产认证与成果服务仍需正式接口，本轮没有伪称接入。
- “保存草稿”复用原订单保存与授权客户规则。核对后如果尚未选择需求医生，会进入对应字段补齐，不虚报成功或绕过客户权限；已有业务字段和已导入资料保留。选择客户后，从核对页保存草稿并重新编辑、提交已实际验证。
- 报告/PACS首步仍包含内部核对；点击首步标题可返回上传/查询区，照片与输入状态保留。后四步导航和最终完整校验保留。
- 只读分享页已检查390px宽度，局部解除原桌面920px最小宽度；普通销售工作台和工程师端最小宽度未修改。
- 五种卡片状态使用独立浏览器存储中的布局夹具测量，未改动现有用户业务数据或构造正式审核记录。另保留原始销售订单与工程师卡片对照。
- 本轮没有使用实体手机摄像头扫码；使用真实分享URL在独立移动尺寸浏览器打开并走服务端验证。手机实体网络连通性未实际验证。

## 截图

- [上传前](report-empty.png) / [上传两张长文件名后](report-uploaded.png) / [完整文件名Tooltip](report-filename-tooltip.png)。
- [修改前上传状态](report-before-uploaded.png) / [修改前未上传状态](report-before-empty.png)。
- [识别核对页](report-review.png) / [身份证字段错误](identity-field-error.png) / [实际保存的订单草稿](report-saved-draft.png)。
- [PACS初始主次](pacs-initial.png) / [选中检查后](pacs-selected.png)。
- [已完成真实订单阶段卡片](stages-completed.png) / [进行中原有订单四阶段](stages-progress-real.png) / [工程师端对照](engineer-comparison.png) / [阶段Dark](stages-completed-dark.png)。
- [分享验证码成功](share-code-success.png) / [同位置错误](share-code-error.png) / [Dark](share-code-dark.png) / [授权后的只读模型](share-readonly.png)。
- [报告1024px Dark](report-dark-1024.png) / [PACS1024px Dark](pacs-dark-1024.png)。

## 测试证据

- `form-results.json`：上传、Tooltip、实际间距、字段错误、草稿及PACS/报告提交。
- `share-results.json`：五状态测量、分享字段反馈、移动尺寸只读访问、Light/Dark及页面入口冒烟；均无pageerror。
- `tests/business-v35.test.mjs`：新增5项验证码边界测试。另运行business-v31、business-v33、sales-orders-v30、sales-invite-proof，共26项通过。
- `BUILD_AND_TEST.txt`：构建及服务测试摘要。
- 首页五张工程师统计卡、销售订单管理、客户管理、医保汇总入口冒烟通过；未将无关模块的全部业务流程标为全量回归通过。

## 修改文件

- `src/sales/OrderPages.tsx`：字段级校验、导入草稿合并和返回入口。
- `src/sales/business/OrderImport.tsx`：报告上传结果、核对按钮、内部匹配及草稿保存、PACS按钮层级。
- `src/sales/business/PatientInsuranceFields.tsx`：性别/身份证FormItem提示。
- `src/sales/business/OrderResults.tsx`：只读分享页Form及成功/错误反馈位置。
- `src/sales/business/business.css`：局部上传/按钮/卡片节奏、分享页响应式和提示间距。
- `server/business/service.mjs`：隔离演示分享验证码选项，默认和生产保持严格OTP。
- `server/business/plugin.mjs`：仅本地开发插件启用该选项。
- `tests/business-v35.test.mjs`：演示/严格模式、数字/非数字、有效期、权限和生产防误用测试。
- `design-system/component-rules.md`：同步本轮局部组件规则及演示边界。
- 本目录截图、验收表与原始结果。

## 本地验收入口

http://127.0.0.1:5210/?build=20261117-v35

已核实HTTP200，仅本机地址。原账号及原业务数据保留。分享演示测试使用订单SO-2026-0006对应已授权手机号13900000001，点击获取验证码后输入任意非空数字。
