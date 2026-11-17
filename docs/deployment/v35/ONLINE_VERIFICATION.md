# A方案 V3.5 汇报演示公网验收

日期：2026-11-17（Asia/Shanghai）。

- 环境：现有 A 项目的独立 Preview；未创建重复项目。
- 网站：https://clinivol-prototype-davidshen561-cqz2wpq3r-wai22.vercel.app
- 部署 ID：dpl_GnhPAoXqMwzJaVPpiVPwwvZMaiJX；状态 READY；environment=preview；productionUrl=null。
- 部署源码 Commit：`4d966189810c51fd4955db75744a6ba759ab8280`。
- 工作分支：`feature/a-v3.1-business-design`。
- 修改前恢复点：`backup/before-report-preview-20261117` → `3e2d9741f2c70588ac2b822caf6e0d339c45dec4`。
- 完整演示邀请入口和合成账号凭证单独交付，不写入仓库。首次须使用完整入口取得受限演示 Cookie；普通业务还须有效账号会话。

## 实际 HTTPS 验收

使用真实部署地址，Playwright Chromium 桌面 1440×1050 及独立移动浏览器 390×844，无请求代理、无 route.fulfill、无 localhost API 替代。

| 项目 | 结果与证据 |
| --- | --- |
| 登录页、Logo、背景、协议、验证码字段错误 | 通过。实际获取验证码，错误码反馈后使用单独交付的演示凭证登录；01-login、02-code-error |
| 密码登录、角色 | 陈屿/李明均通过服务端密码验证，进入对应完整工作台；https-api-results.json |
| 注册 | 未注册手机号经服务端验证码验证后提交申请，返回 pending，user=null；继续操作仍保持待审核，无销售权限；invitation-registration-results.json |
| 陈屿完整 A 方案 | 五张统计卡片、我的项目、审核记录、项目详情、三维重建、CAD 均通过；03 至 08 截图 |
| CAD 模型与刷新 | 原 STL 解压后字节与原文件一致，实际模型显示；刷新保持 CAD 路由；08、09 截图 |
| 李明销售页 | 首页、客户、订单、订单详情、三种创建入口及医保汇总通过；10 至 17 截图 |
| 我的专属码 | 弹窗及复制有效 HTTPS 邀请链接通过；18-exclusive-code |
| 跨设备邀请 | 无演示登录 Cookie 的独立移动浏览器打开邀请页，手机号验证、填写资料、上传两份合成证明并提交成功；19 至 22 截图 |
| 销售回查/去重 | 李明可搜索到新档案；相同手机号重复提交后云端仍仅一条记录；23 截图、invitation-registration-results.json |
| 邀请来源和审批 | 档案保留邀请销售和提交来源；不自动授予正式医生关联或审批权限 |
| 成果分享 | 有效分享 URL 在独立移动浏览器验证手机号后显示只读 CAD 成果，无源文件下载按钮；24-readonly-result |
| 两账号切换 | 李明→陈屿→李明→陈屿通过菜单实际操作，Header、导航和原账号工作空间恢复；25-restored-chen、browser-results.json |
| 角色隔离 | 销售和匿名读取设计师原始 STL 均 403；设计师 200。邀请/成果接口仍校验对应凭证 |
| 扫码登录 | 二维码指向 HTTPS；独立移动浏览器打开并确认，电脑轮询实际收到；既有账号绑定后第二次确认直接进入李明；26 至 30 截图、scan-browser-results.json |
| 手动录单 | 填写客户患者、服务、上传真实合成 NIfTI、提交待审核通过；31、32 截图、manual-results.json |
| 报告识别 | 上传两张合成图、识别核对、保存草稿、再次编辑并提交通过；forms-online-results.json |
| PACS 导入 | 隔离医院适配器查询、选择、导入、核对、提交通过；forms-online-results.json |
| 医保汇总 | 实际加载两条已完成演示订单，选中后成功下载 XLSX；33-insurance-loaded、insurance-results.json |
| Light/Dark | 工程师 CAD 两种主题实际显示，模型正常；08、09 截图 |
| Hash 和二级路径 | CAD 刷新保持工作区；/sales-invite 和 /order-results 独立匿名浏览器直接打开正常 |
| 并发 | 6 个独立客户端同时登录全部 HTTP 200，未丢失写入；concurrency-results.json |
| 脚本异常 | 最终全流程 browser-results.json 无 pageerror |
| 实体手机移动网络 | 用户选择第一项，确认移动网络能够打开邀请医生建档页。实体相机扫一扫及手机现场完整提交未现场验证；不能由模拟视口代替 |

## 已修复的部署阻断

1. 为既有认证、销售邀请及 V3.x 业务服务增加 Preview-only 适配，跨设备状态使用加密私有 Blob，避免以前每浏览器 Cookie 状态互不相通。
2. 初次恢复已登录会话时保留当前有效 Hash 路由，修正刷新 CAD 被带回首页。
3. Blob 条件写入冲突按 SDK 错误类及明确的 concurrent-operation 冲突识别，重新读取后退避重试；真实公网并发复测通过。
4. 专业源 STL 不再公开静态分发，改为设计师会话校验及无损 Brotli 传输；没有修改几何。
5. 演示包开放已有只读成果页面；关闭开发验证码查询、审批、重置接口。验证码反馈不再指向不可用的本机控制台。

未修改页面设计、Design Token、三维/CAD业务工具、审核业务数据规则。

## 构建与回归

- TypeScript + Vite 构建通过（保留现有大包体积警告）。
- 61 项既有账号/业务/邀请回归通过。
- 5 项 Preview 存储和传输测试通过，覆盖实际 SDK Error.name 行为、条件写入及 concurrent-operation 冲突。
- 7 项生成云端 Runtime 检查通过，包括生产环境适配器拒绝运行。
- 公网 API、浏览器、扫码、三种录单、分享、医保导出结果 JSON 均在同目录。

## 公开演示边界

- 微信是跨设备真实确认加隔离模拟身份，未接正式微信 OAuth；短信采用单独提供的演示凭证，不发送真实短信；PACS和识别使用既有合成适配器。
- 新注册账号保留待审核；公开站点没有管理员审批/重置或验证码收件箱。陈屿和李明是两个预置已核准的合成账号。
- 订单/工程等既有原型数据继续按账号保存在当前浏览器 LocalStorage/IndexedDB；认证、扫码、邀请档案、证明附件及业务凭证使用本次隔离私有云状态，不是正式全量业务数据库。
- 函数请求体受平台限制；本次演示建议单次证明上传小于 3MB。没有改造正式大文件上传。
- 不接收真实患者、身份证或执业证明。仅使用项目合成资料。
- 对测试期间产生的合成扫码身份只清理了 QA 绑定，不影响账号、工程、订单或其他部署。

## 保护核对

Production 部署仍为 `dpl_FYQYoyWsGE5VeBGDXiqMC4UvQ4Qo`，生产域名和 Git 绑定未变。

- main：`40325227135e20c0b7cbabee7080bcacedb264e8`
- design-handoff：`3f4911050c6b21e496c20a809730ca70cdfcd8f9`
- V3.0 冻结 Tag 解引用：`1beeaa6ff126f371550780d6a9918b840e111f5e`

未推送、未改历史 Tag、未部署 B 方案、未推广 Production。完整保护证据见 production-check.json。
