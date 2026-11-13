# A方案 Preview 专属码线上修复（2026-11-13）

仅 feature/account-auth-integration 分支；未推送 design-handoff，未修改 Production。

## 原因及修复

原公开预览只有账号认证 Function；销售邀请 API 依赖 Vite 开发中间件，且邀请路由与销售同步被 DEV 条件屏蔽。现将同一邀请处理器复用到仅允许 Vercel Preview 的适配器，启用 presentation 构建的邀请页面和同步。

邀请记录、手机号凭证和附件保存在当前预览隔离命名空间的私有 Blob，销售接口继续校验销售会话，医生入口继续校验有效邀请 Token 和手机号凭证。仅 Preview 关联新私有存储，未改生产环境配置。ETag 条件写入使用强值，避免弱 HTTP ETag 导致连续保存失败；错误验证码尝试次数也会保存。

## 实测

- TypeScript / Vite presentation 构建通过。
- 修改前完整 sales 检查 41/41；最终 invitation / proof / v29 定向检查 3/3。
- 云端真实请求：陈屿与李明短信登录、有效会话双向切换通过。
- 未携带演示入口凭证不能访问私有账号/销售接口。
- 专属码生成 HTTPS 链接；无效邀请被拒绝；无需销售登录的有效医生邀请可读取。
- 服务端验证码生成、错误校验、正确校验、上传 PDF、提交、销售读取、重复提交同 ID、附件访问权限通过。
- 上述接口验收资料已从隔离 Blob 清理，不改原有业务记录。
- Chrome：李明客户管理→我的专属码成功显示二维码与按钮；公开邀请页面 Logo 正常；手机号校验后显示共享建档表单。
- Chrome：完整表单可滚动到底部，提交按钮 bottom 931.75 / viewport 956，scrollY 1228。
- 截图：exclusive-code.png / public-invite.png / public-form.png / public-form-bottom.png。

## 演示边界

验证码来自隔离演示服务，未接入真实短信；邀请页直接展示本次演示验证码。仅使用合成资料。上传验收使用小型 PDF；大附件尚未验证，仍受平台 Function 请求大小限制。未将此部署宣称为正式认证、真实资质审批或真实医疗系统。

Preview: https://clinivol-prototype-davidshen561-rdk973qke-wai22.vercel.app

需从提供给用户的完整 /demo-access 链接进入；入口密钥与加密状态密钥只在忽略的本地部署目录和 Function 私有包内，不写入 Git 或静态资源。
