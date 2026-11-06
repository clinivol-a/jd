# 登录接入定向修正 · 2026-11-06

工作分支 `feature/account-auth-integration`，恢复点 `backup/auth-before-scan-polish-20261106`（基于4e2b893）。未部署、未推送或更新design-handoff。

## 页面修正

- 身份核验移除橙色内部服务说明。两确认项作为一组，实际计算间距12px；保留原四步注册与后端待审核状态。
- 返回组使用官方text Button，Icon gap4px，组间gap24px，普通与Hover padding均0。实际拖动鼠标到返回按钮后：hover=true，x=64.3125、width=90，均与普通态一致。
- 审核通过采用成功图标→标题→姓名/脱敏手机号→岗位→操作。两行说明均为次级文字色，无重复Tag。
- 仅接入锁屏增加独立作用域类，移除旧CSS位移对其标题/说明的影响；官方Input的status/tips承载字段错误，不把文字覆盖到输入框内。浏览器实际空值提交显示下方错误，输入123解锁成功。
- 任意非空数字解锁仅在显式本地 `AUTH_DEMO_MODE=1` 且非production模式启用；原有默认服务的密码解锁验证仍由测试覆盖，未被删除。

## 真实可扫的本地流程

`pnpm auth:dev` 启动隔离测试服务，并自动选择私有局域网IPv4。电脑入口仍为 http://127.0.0.1:5210/#auth/wechat 。本次手机地址为 http://192.168.2.116:5212/ ，同一Wi-Fi下访问；网络地址改变需重启服务并刷新二维码。手机入口只提供dist资源及认证API，绝不携带开发控制台能力密钥。原5211服务及本机Vite代理继续提供受限本地控制台。

二维码含短期随机会话，手机真实打开确认网页，主动确认后服务端状态变化，电脑轮询消费。首次确认后进入手机号验证/绑定；手机号未注册可转注册，待审核仍不授业务权限。已登录手机号账号扫码时绑定目标锁定为该账号，不能绑定另一手机号。已有绑定的同一手机浏览器再次确认可直接登录对应账号。取消、超时、一次性消费、账号状态、身份冲突、手机验证码及权限规则仍有效。

这是用户授权的扫码交互演示：身份由服务端为手机的HttpOnly设备Cookie派生，保存为独立的demoWechatId；不写入真实wechatId、不调用微信OAuth，不代表已认证微信身份。手机清除Cookie或更换浏览器属于新的演示扫码身份。登录页扫码名称是交互设计名称，不是正式微信接入声明。生产默认不启用此模式。

### 实际验收

- 用户已两次回复确认：手机能打开局域网入口；第一次手机确认后电脑出现绑定页；首次绑定后再次用同一手机确认，电脑直接进入陈屿账号。
- 浏览器实际观察桌面绑定页，用后端生成的测试验证码绑定陈屿，进入原A首页；再次扫码后首页及原任务标签仍在。
- 手机确认页截图为同一真实LAN服务的390px浏览器预览，不冒充从实体手机采集的屏幕照片。
- 手机号先登录再绑定当前账号的服务端路径、未注册扫码后注册审核路径均通过新增测试；本轮未单独采集第二个实体手机身份绑定当前账号的截图。
- 24项认证/HTTP/隔离/控制台/扫码测试通过；TypeScript/Vite构建通过（仅原有大bundle提示）。A集成与Design System检查通过。
- src/App.tsx、src/projects、src/cad、src/index.css及原设计Token无本轮差异，业务布局、任务、审核与专业模型逻辑未改动。

## 截图

- [身份核验](screenshots-20261106/registration-verification.png)
- [审核通过顺序](screenshots-20261106/approval-order.png)
- [返回普通态](screenshots-20261106/back-normal.png) / [返回Hover](screenshots-20261106/back-hover.png)
- [锁屏](screenshots-20261106/lock-layout.png) / [Input错误](screenshots-20261106/lock-input-error.png)
- [二维码](screenshots-20261106/scan-qr.png) / [手机确认预览](screenshots-20261106/mobile-confirm-390.png)
- [手机确认后的电脑](screenshots-20261106/desktop-after-phone-confirm.png)
- [首次手机号绑定](screenshots-20261106/first-scan-phone-binding.png)
- [再次扫码直接登录](screenshots-20261106/repeat-scan-login.png)

主要改动：src/auth/AuthPages.tsx、IntegrationRoot.tsx、authPages.css、client.ts；server/auth/service.mjs、http.mjs、demoScan.mjs、local-dev.mjs；package.json及tests/auth-demo-scan.test.mjs。
