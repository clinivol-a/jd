# 账号认证 V1.0 定向修正与验收（2026-11-06）

基线：03b7057346d42c13558a0f6605a342916f2f202b；恢复Tag：backup/auth-before-targeted-20261106。工作目录clinivol-a-account-integration，分支feature/account-auth-integration。不部署、不推送、不更新design-handoff。

## 发现与修复

1. 新手机号短信验证后自动跳注册：现留页显示手机号字段错误及“立即注册”；用户主动点击才复用设备绑定、30分钟、一次性注册上下文。密码登录统一安全错误及可点击注册链接，不泄露未经验证的手机号存在性。
2. 字段错误聚集表单底部：姓名、岗位、单位与密码/确认密码分别使用TDesign 1.18.4 FormItem的requiredMark、status、tips，保留14/22，表单级异常仍单独处理。没有引入第二套错误颜色或全局Token覆盖。
3. 单位自由输入：改为filterable/clearable Select，服务端独立演示目录提供稳定ID及source:isolated-demo；register只接受有效organizationId、保存解析后的正式名称，不接受任意组织字符串。新增申请持久保存pending，不能直接成为注册选项。科立沃为目录项。
4. 短信只有限流没有风险凭证：统一security/start→按需challenge→security/verify→otp/send。90秒permit绑定设备、手机号、用途且一次性；直接发短信或用其他设备permit返回403。保留5分钟OTP、60秒重发、5次错误、一次性proof、HTTP/IP与手机号频控。控制台可强制挑战；关闭/错误/过期不发短信。
5. 微信未区分可信手机号：本地服务端只有手机确认后才提供测试身份的已验证手机号。李明13800000002自动填充只读，正常进入必填密码步骤；无可信手机号时仍走统一风险及短信验证。此值不是微信官方返回，不用于生产。
6. 企业微信缺失：独立入口、官方TDesign图标、provider=wecom渠道，demoWecomId与demoWechatId分离。企业成员身份只提供凭证，不能改变账号岗位、审核状态或业务权限。已有陈屿账号显式绑定，不重复注册；未注册成员继续统一注册。官方IdentityProviders start/verify契约保留，缺配置返回503。
7. 浏览器追加发现：FormItem自动接管子控件value导致服务端预填手机号没有显示，已用受控控件组保留应用value；提示原absolute位置与大号Input存在重叠风险，改为仅认证字段内正常流布局。重置李明后旧ScanLogin绑定页残留，已按resetKey重新挂载；重置命名空间仅作用微信李明场景，企业微信陈屿及无关注册上下文保留。

## 实测 TDesign 参数

依赖tdesign-react固定1.18.4。使用真实FormItem/Input/Select/Checkbox/Dialog，官方图标LogoWechatStrokeIcon、LogoWecomIcon，不改图标系统或原A全局Header。

安装CSS的.t-input__extra为绝对定位；默认FormItem依赖外部间距容纳提示。认证字段采用受控组件组+FormItem status/tips，并仅将其提示移入正常文档流以避免重叠。没有猜测4px/8px：浏览器测量姓名、岗位、单位和密码字段的提示盒顶边与控件底边差值均为**0px**；文字行高22px、字号14px。字形可见留白由22px行盒自身产生。Light错误色实测rgb(213,73,65)，来源--td-error-color。

字段原有20px外间距保留；错误出现后自然占22px，不裁切或压入控件。姓名/岗位/单位必填星号由FormItem生成。日期、模型、页面和其他组件样式未改变。

## 测试说明

自动测试使用独立内存账号/测试HTTP端口，不写当前账号库。旧OTP底层套件显式riskEnforced:false、demoTrustedPhones:{}以独立覆盖原验证语义；新增定向套件使用默认强制风险校验及可信测试手机号，并测试HTTP绕过拒绝，不以旧fixture的免风险设置证明新边界。

浏览器使用实际DOM操作和截图。跨设备演示通过电脑localhost与LAN确认页的独立Cookie验证，不冒称手机微信官方实机认证。密码由用户本人填写，代理未代填或存档聊天中的密码。未提交当前个人手机号的资料申请；字段验收完成后保持未提交状态。李明场景重置前已在忽略的.local/auth-backups中备份本地测试库，未改其他账号、患者、任务或工程。

正式短信、微信/企业微信官方认证、真实单位管理/审批与生产风险服务均未连接，所以这些官方能力标记“因缺少官方接口而未验证”。本地数学题挑战只用于演示前后端凭证链，不能视为生产级CAPTCHA或反AI能力。

## 34项验收结果

“通过”均限定右列记录的本地层级，不等于真实微信、企业微信、运营商短信或实体手机官方验收。服务端测试是真实运行独立AuthService及HTTP监听，不以代码存在代替执行。

| # | 场景 | 本轮结果 | 实际验证层级 |
|---|---|---|---|
| 1 | 新手机号短信登录留页提示 | 通过 | 浏览器输入服务端OTP后留在原登录页，手机号下红字与立即注册 |
| 2 | 主动注册才进入步骤 | 通过 | 浏览器点击立即注册，复用proof到密码步骤 |
| 3 | 密码登录安全引导 | 通过 | 服务端错误不区分未注册/错密码；UI字段tips提供注册链接；未代填用户密码 |
| 4 | 姓名空字段错误 | 通过 | 浏览器FormItem提示+实际基本资料验证函数测试 |
| 5 | 岗位空字段错误 | 通过 | 同上，选择其他字段后岗位错误独立保留 |
| 6 | 单位空字段错误 | 通过 | 同上，服务端拒绝未知单位ID |
| 7 | 多字段独立错误 | 通过 | 浏览器三字段同时显示各自提示，不合并底部红字 |
| 8 | 单位搜索选择 | 通过 | 浏览器搜索“安徽”，显示两个匹配项并选择 |
| 9 | 保存单位ID | 通过 | 服务端注册测试保存organizationId，目录解析department；非任意字符串 |
| 10 | 新增单位申请 | 通过 | 浏览器可见入口，服务端提交pending、不可立即作为正式选项 |
| 11 | 按需安全验证弹窗 | 通过 | 浏览器控制台强制开关→获取验证码→TDesign安全Dialog |
| 12 | 失败/关闭不发短信 | 通过 | 浏览器取消后无验证码；服务端错误/过期/重放/错设备测试 |
| 13 | 所有OTP用途统一风险链 | 通过 | 登录、注册、重设、补设、绑定、换手机号、解锁七用途严格校验测试 |
| 14 | 密码步骤不重复挑战 | 通过 | 用户完成密码步骤进入基本资料，无短信挑战；register只核对有效proof |
| 15 | 密码错误紧贴字段 | 通过 | 浏览器实际错误截图，提示与输入框盒边差0px，14/22 |
| 16 | 确认密码不一致 | 通过 | 实际客户端passwordFieldErrors测试，不一致只返回confirm错误；该字段的空错误位置已浏览器测量 |
| 17 | 李明首扫自动填13800000002 | 通过 | 双浏览器域的真实确认链，桌面自动进入密码步骤 |
| 18 | 手机号只读及验证证明 | 通过 | 浏览器读取value=13800000002、readOnly=true；服务端确认后才签发有限期proof |
| 19 | 李明密码必填 | 通过 | 服务端缺密码拒绝，前端密码/确认必填；未在当前用户库代设密码 |
| 20 | 注册pending | 通过 | 独立服务实例注册返回pending、role=null、permissions=[] |
| 21 | 李明批准后短信登录 | 通过 | 默认风险机制下验证OTP并登录原销售ID |
| 22 | 李明批准后密码登录 | 通过 | 相同账号密码哈希验证成功，未新增账号 |
| 23 | 李明再次扫码 | 通过 | 同模拟手机身份再次确认返回同一销售账号，pending/disabled不放行；服务端实测 |
| 24 | 已有手机号只绑定 | 通过 | 企业微信浏览器显示陈屿候选并等待显式确认；服务端确认后身份/岗位/账号数不变 |
| 25 | 无可信手机号短信分支 | 通过 | 独立fixture无可信claim，resolve必须OTP证明，新注册仍pending |
| 26 | 企业微信入口 | 通过 | 桌面与窄屏截图，普通微信/企业微信分组与官方图标 |
| 27 | 企业微信双端确认 | 通过（模拟） | localhost电脑、LAN独立Cookie确认页，桌面从waiting变已有账号绑定候选；非实体手机官方微信 |
| 28 | 企业微信首登注册或绑定 | 通过（模拟） | 可信陈屿候选浏览器；无可信新用户注册分支服务端测试 |
| 29 | 已绑定企业微信登录 | 通过（服务端模拟） | 同身份重复scan返回原陈屿账号；未在当前用户库代绑定新认证凭证 |
| 30 | 成员身份不绕审核 | 通过 | 新用户pending无权限；绑定候选不会直接登录；禁用账号拒绝 |
| 31 | 原A完整工作台及专业入口 | 通过（入口烟测） | 浏览器陈屿SMS登录→五卡首页→项目详情→001重建→P301-2 CAD→多任务标签。未重复执行全部专业算法和审核操作；业务源文件零diff |
| 32 | Light/Dark和窄屏 | 通过 | 1366×768和390×844截图；窄屏scrollWidth380≤viewport390；保留TD状态色 |
| 33 | TS/Vite及测试 | 通过 | 构建成功，48项自动测试通过，diff检查无误；仍有原有大分块提醒 |
| 34 | 测试与生产隔离 | 通过 | NODE_ENV=production禁止初始化local适配器；demo/管理接口分层限制、官方未配置503、其他账号及A业务未改 |

### 因缺少官方接口而未验证

- 微信开放平台真实授权、openid/unionid及真实手机号获取。
- 企业微信真实企业成员扫码授权、回调与成员/手机号可信声明。
- 运营商短信真实投递与商用风控/验证码提供方。
- 管理员正式单位目录、单位核实、平台岗位审批、实名资质与自然人唯一性。

本轮实际浏览器验证的是跨域独立Cookie的扫码确认演示，不声称上述官方能力通过。实体手机本轮未重新参与；同Wi-Fi入口可用于后续现场测试。

## 截图

- [最新登录页](targeted-20261106/login.png)
- [未注册手机号提示](targeted-20261106/unregistered-login.png)
- [资料字段错误](targeted-20261106/basic-field-errors.png)
- [单位搜索](targeted-20261106/organization-search.png)
- [安全验证弹窗](targeted-20261106/security-challenge.png)
- [密码未出错初始态](targeted-20261106/password-normal.png)
- [密码字段错误](targeted-20261106/password-errors.png)
- [微信李明手机号自动填充只读](targeted-20261106/wechat-li-readonly.png)
- [企业微信二维码入口](targeted-20261106/wecom-qr.png)
- [企业微信独立设备确认](targeted-20261106/wecom-mobile-confirmed.png)
- [桌面已有账号候选](targeted-20261106/wecom-existing-account.png)
- [Dark登录页](targeted-20261106/login-dark.png)
- [窄屏Dark](targeted-20261106/login-narrow-dark.png)
- [陈屿原A首页](targeted-20261106/chen-dashboard.png)
- [陈屿CAD及任务标签](targeted-20261106/chen-cad.png)

密码正确后进入资料页由用户本人操作验证，未截图保存任何密码。只有字段正常说明和错误状态截图，不伪造一张填过密码的截图。真实手机原生扫码及官方授权结果截图仍待真实服务接入与现场复测。

## 文件与运行

代码：src/auth/AuthPages.tsx、AccountSecurity.tsx、DevConsole.tsx、OrganizationSelect.tsx、passwordPolicy.ts、authPages.css；server/auth/service.mjs、demoScan.mjs、http.mjs、registrationSupport.mjs、identityProviders.mjs。

测试：tests/auth-targeted.test.mjs及原service/http/console/demo-scan套件（旧fixture明确隔离），package.json追加测试文件。

文档：AGENTS.md、docs/DEVELOPER_HANDOFF.md、docs/DATA_AND_API_HANDOFF.md、docs/auth/ACCOUNT_INTEGRATION.md、FIRST_SCAN_REGISTRATION.md、历史AUTH_V1_AUDIT.md的新版入口声明，以及本报告/截图/测试输出。

原A的App.tsx、index.css、IntegrationRoot.tsx（含锁屏）、projects、cad、src/design-system与design-system Token目录相对基线零修改。design-handoff仍为3f4911050c6b21e496c20a809730ca70cdfcd8f9。

本地预览：http://127.0.0.1:5210/#auth/sms 。局域网确认页：http://192.168.2.116:5212/ 。服务端已更新；重启后临时会话/二维码/OTP需重新获取，账号与A业务存储保留。没有部署Vercel、更新生产或交付分支。

本轮恢复Tag为backup/auth-before-targeted-20261106；最终提交通过git log -1核对。
