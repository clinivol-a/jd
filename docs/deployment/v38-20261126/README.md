# 当前 A方案汇报 Preview

2026-11-26。复用 `wai22/clinivol-prototype-davidshen561`，仅发布 Preview，不更新生产分支、交付分支或历史 Tag。

## 发布适配

- 复用既有 AuthService、AdminService、UnifiedBusinessService、InstitutionDirectory、销售邀请及成果服务。未修改已确认的 UI、Token、权限和专业工作区。
- 独立加密私有 Blob 命名空间保存当前隔离演示快照。保留23笔共享订单、17个主项目，原本地及旧线上命名空间不修改。客户端按已有角色权限读取各自记录。
- 每次请求恢复同一权威数据快照，在临时目录运行原服务，并使用 Blob ETag 条件写入提交，避免不同实例丢失更新。
- 六个已知合成演示账号保留；排除本地手工申请的其他账号及旧设备会话。演示凭据单独交付，不写入 Git 或公共静态资源。
- API须使用完整汇报邀请入口获得受限Cookie；业务还须账号会话与权限。公共扫码、邀请、成果访问仅开放其原有令牌认证流程。
- 禁用开发验证码查询、重置、sample、test-inbox接口。固定演示验证码仍须当前设备已发送且未过期的验证码；公网包禁用任意数字验证码放行。不是正式短信或微信OAuth。
- CAD原文件通过设计师账号接口校验；资质预览为受控衍生图。Linux图片/PDF预览依赖包含在函数包。
- 管理员原有职责边界保持：业务组长工作台尚未实现，不能因部署而将其订单受理/任务分配权交给管理员，也不公开本机组长脚本。

## 发布前检查

- TypeScript/Vite构建通过。发布使用 `VITE_PRESENTATION_DEMO=1`，仅开启既有邀请/成果入口。
- 发布包直接执行27次服务调用：短信成功/错误验证、三账号密码登录、23笔销售订单、设计师29条授权任务、销售授权目录、医保数据、CAD设计师访问及销售拒绝、草稿保存/删除、管理员订单/医院/分享、成果模型、切换账号、跨设备扫码确认和电脑端状态读取。均通过。
- 未把上述接口检查冒充浏览器完整验收。公网结果将在部署完成后补充。
- Vercel 项目已只读核实：原项目/团队、Production Branch=main、生产部署 `dpl_FYQYoyWsGE5VeBGDXiqMC4UvQ4Qo`。现有 Blob 变量仅用于 Preview。

## 执行

1. 以当前确认源码执行 TypeScript 与 presentation Vite build。
2. `node scripts/presentation/v38/build.mjs` 生成忽略目录 `.local/presentation-20261126/deploy/.vercel/output`。
3. 使用已安装 Vercel CLI，显式 `deploy --prebuilt --target preview --scope wai22`；不改域名、不推广生产。
4. 实际HTTPS检查角色、页面、关键数据、邀请、只读成果及隔离边界，记录未验证项目。完整入口和凭据只在私有本地部署记录及交付消息保存。

扫码为跨设备确认加模拟身份；PACS、识别和医学成果仍为既有合成演示服务。不得上传真实患者/证件资料。平台函数单次请求建议小于3MB，未改造大文件上传。
