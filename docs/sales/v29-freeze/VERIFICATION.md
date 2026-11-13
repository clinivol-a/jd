# V2.9 建档整页无响应修复

日期：2026-11-13。分支：feature/account-auth-integration。

## 复现

原 Preview 登录李明→客户管理→新建医生档案后，URL 已改变，但旧列表停留、全页无法点击；Chrome 弹出“1 个页面无响应”。Chrome / 内置浏览器均捕获到此路径无响应；进程采样显示渲染进程持续运行 V8 微任务，CPU 超过单核。

## 原因和范围

DoctorFields 中的无 name FormItem 直接包裹受控 Input、Select、SalesAttachments。当前安装的 TDesign 1.18.4 FormItem 会 cloneElement 并以内部 formValue 覆盖 value。附件值因此变为 undefined，SalesAttachments 的参数默认值 [] 每次渲染都会生成新引用，文件读取 effect 依赖 value，又异步 setFiles，形成不断重新渲染与微任务执行，主线程无法处理点击。

修复仅涉及两文件：共享 Field 用 Fragment 保留草稿对象的控制权（与既有其他字段包装一致）；附件的缺省空数组改为模块级稳定引用。未改 CSS、Token、字段、审核规则及上传接口。

## 验证

- 本地隔离组件页：姓名输入保留，连续点击 6 次计数正确，无控制台错误。
- TypeScript / Vite presentation 构建通过（19.66s，仍有原有大包提示）。
- sales-invite、sales-invite-proof、sales-doctor-v29 三项定向测试通过。
- 最终 Preview：李明验证码登录→客户管理→新建医生档案成功（旧版卡死入口）。
- 姓名输入保持；提交不完整表单显示字段校验，没有生成无效档案。
- 连续三轮返回客户管理→新建医生正常；Light/Dark 按钮可用。
- 专属码弹窗正常生成二维码，打开邀请入口与复制按钮可见。
- 云端认证请求验证陈屿/李明登录及双向切换通过。
- 未声称已经覆盖所有可能的性能问题；本次确认修复上述实际复现的主线程死循环。

仅更新本次演示 Preview，未修改 Production、design-handoff 或 B 方案。安全恢复 Tag：backup/before-freeze-fix-20261113。

Preview：https://clinivol-prototype-davidshen561-fvvqusa3g-wai22.vercel.app
完整演示访问凭证保留于忽略的本地部署目录，不写入 Git。
