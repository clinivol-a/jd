# V2交付核查（2026-11-23）

## 版本与远端只读检查

- 源代码HEAD caa9947376ad04fa0ddfde92b5e6741f8de2f212，开始时工作区干净；恢复分支codex/backup-before-handoff-v2-20261123。
- GitHub clinivol-a/jd是公开仓库，默认main。账号具有push权限。
- 远端旧design-handoff为3f4911050c6b21e496c20a809730ca70cdfcd8f9；main为071d200c70382d51ed99452b2dd46c4a0e7205d1；原v1 Tag对象170b8d1fad70aa0db44a23eab5236d86d3fcab1a。本轮不推这些refs。
- 远端开始时只有main、design-handoff两分支，均未保护；rulesets列表为空。design-handoff-v2无同名冲突。不改仓库权限或规则。
- Vercel已通过浏览器项目设置核对：团队wai22，项目clinivol-prototype-davidshen561，关联clinivol-a/jd；生产环境“匹配模式”输入框实际值main，Preview为其他未分配分支，无自定义环境，无Deploy Hooks。未保存或修改项目设置。
- 本机旧Vercel CLI凭据只读接口返回403，未重复登录/重试；改用已有登录的浏览器只读设置完成核对。
- 新vercel.json只对design-handoff-v2关闭Git自动部署；依据官方git.deploymentEnabled配置，不改变main、旧交付分支或云端环境变量。[官方定义](https://vercel.com/docs/project-configuration/git-configuration)。本轮不调用部署/推广/关联接口。

## 安装与构建（本轮实际执行）

1. pnpm11.25.0 + Node运行环境，保留现有packageManager与锁文件。
2. 离线锁文件安装因canvas包未缓存失败；随后在.local/handoff-v2-install隔离目录执行 `CI=true pnpm install --frozen-lockfile` 完成156包安装，退出0。未替换正在服务的node_modules，无锁文件变动。
3. `pnpm --config.verify-deps-before-run=false build`退出0，包含tsc -b与Vite，构建8.22秒。关闭的是本机旧node_modules元数据引发的重复安装检查，不是TS或构建检查。普通pnpm build首次被该自动安装预检中断；未隐瞒为成功。
4. 构建保留既有>500KB chunk警告，本轮不以交付之名重构包。

## 回归（本轮实际执行）

75/75通过，0失败/跳过。命令：

```sh
node --experimental-strip-types --test tests/linked-demo-migration.test.mjs tests/linked-demo-http.test.mjs tests/linked-demo-freeze.test.mjs tests/unified-business.test.mjs tests/unified-business-http.test.mjs tests/unified-business-projections.test.mjs tests/admin-http.test.mjs tests/cross-role-tables.test.mjs tests/v38-sales-designer.test.mjs tests/design-demand.test.mjs tests/sales-order-fields.test.mjs tests/auth-service.test.mjs tests/auth-http.test.mjs tests/auth-console.test.mjs tests/sales-invite.test.mjs tests/share-records.test.mjs
```

覆盖账号和HTTP会话/本地控制台、销售邀请、分享审计、统一编号、受理幂等、三端角色范围、20/16迁移、退回重提/受理分配/重启、工程及其他UI冻结、设计需求/字段/分页数据。临时端口及数据库，不清空当前演示数据。

浏览器证据：本轮前同一源代码SHA已实际验证销售20订单、设计师16项目、管理员19正式订单、同号CV-2026-0015详情、重建/CAD与角色切换、两种主题、首页3条摘要及审核去重；记录见../repairs/business-migration-20261123。此次只交付文档/防自动部署配置，没有UI变更，不冒称重新逐页浏览器验收。

未验证：开发团队已实现工程的合并结果、生产真实账号/短信/微信/PACS、全部20条订单逐项修改、每个专业工具、全部屏宽及浏览器。本轮无新在线部署，不能报告新公网演示通过。

## 安全检查

[source-safety.json](source-safety.json)扫描待新增Git历史Blob中的私钥/GitHub/AWS凭据模式，并对比本机已知私有凭据；不记录凭据值。当前受控路径无.env、.local、会话/短信收件箱、node_modules、dist、云绑定或私库。src/server/public/scripts未发现依赖开发者电脑的绝对路径。

合成病例/患者/医生成员和医学展示资源为原型fixture，不是实际临床记录；人工审查及来源确认不能由字符串扫描替代。全部本机数据库、浏览器附件、OTP、私有备份和加密密钥保持在Git外，不交付开发者个人会话。日志及私钥文件后缀追加忽略。

## 本次实际文件

- docs/HANDOFF_20261123_V2.md
- docs/DESIGNER_DELTA_V1_TO_V2.md
- docs/handoff-v2/designer-v1-to-v2.patch、designer-files.txt
- docs/handoff-v2/VERIFICATION.md、source-safety.json
- README.md（仅V2交付入口与未定稿范围提示）
- .gitignore（仅私有凭据与日志忽略）
- vercel.json（仅新交付分支禁自动部署）

应用src、server、public、package.json、锁文件、全局Token均保持源代码SHA逐字不变。原版交付文档保持历史可追溯，由新入口明确替代其过时状态。

## GitHub推送实测

已普通push创建远端design-handoff-v2，未创建PR或合并旧分支。交付版本以 `git rev-parse origin/design-handoff-v2` 和GitHub分支HEAD确认。部署防护随该分支提交；推送后只读检查A项目最新部署仍为原dpl_GnhPAoXqMwzJaVPpiVPwwvZMaiJX，未生成本轮部署。原始Patch的空行上下文包含合法行前空格，保持原始Git Diff，不为通过文档空白检查而改写Patch；其他新文档/配置通过git diff --check。
