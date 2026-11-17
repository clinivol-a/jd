# A方案 V3.5 汇报 Preview

本次仅复用 `wai22/clinivol-prototype-davidshen561` 的 Preview，Production Branch 为 main。Production、main、design-handoff、V3.0冻结Tag不更改。

## 必要部署适配

- 复用既有AuthService、销售邀请及BusinessService，通过Preview-only函数适配；不改变业务界面、Token或核心业务服务。
- 登录会话与扫码状态保存在当前演示命名空间的加密私有Blob，使用ETag条件写入和冲突重试；手机确认可被电脑实际收到，不依赖Mac或临时隧道。
- 演示入口使用不可猜测的邀请能力及HttpOnly Cookie。普通业务API需要演示入口及有效角色会话；手机邀请/成果/扫码入口仅开放对应限时凭证操作。
- 公开部署不提供dev/state、审批、重置或验证码查询接口。短信演示使用单独提供的固定演示凭证，经服务端当前设备/手机号/用途/有效期校验；没有发送仍不能验证。注册后保持待审核，不开放公开审批。
- 真实微信OAuth、真实短信与医院PACS未接入，不能称为正式认证/医院服务；只使用合成账号和资料。
- 所有图片、上传及身份凭证保存在受限接口和加密私有存储；公共静态包无服务密钥。原STL通过设计师会话授权接口读取并进行无损Brotli传输，不作为公共静态文件发布。分享端仅返回批准的展示衍生数据。
- 仅在presentation构建开放成果公共入口；本地和正式生产认证规则不放宽。发布包的Local适配器副本仅允许VERCEL_ENV=preview，production直接404。

## 部署过程

1. 读取现有Vercel项目、Production Branch和Production目标并保存私有快照。
2. `VITE_PRESENTATION_DEMO=1 pnpm run build`。
3. `node scripts/presentation/v35/build.mjs`，输出至忽略目录`.local/presentation-20261117/deploy/.vercel/output`；复用原项目绑定及仅Preview的私有Blob变量，不创建项目或更改生产变量。
4. `vercel deploy --prebuilt --target preview --scope wai22 --cwd .local/presentation-20261117/deploy`。当前演示沿用既有独立Build Output发布链路，未推送Git生产/交付分支。
5. 使用真实HTTPS地址做登录、跨设备扫码、邀请上传建档、双角色、三种录单、成果分享与医保验收。

## 验证边界

实际公网验收结果及截图在同目录后续验收记录中。实体手机移动网络无法由自动化工具代替，未现场操作的项目必须标为未验证。

Vercel Function请求体存在约4.5MB限制，本次演示上传建议单次小于3MB；本轮不改造正式大文件上传。当前上传是隔离演示，不接收真实患者或执业证明。
