# 注册末步与锁屏定向修正

恢复点：backup/auth-before-layout-fix-20261106（6f0ae3a）。分支feature/account-auth-integration。未部署、未修改design-handoff或Production。

## 实际布局值

| 项目 | 浏览器测量 |
| --- | --- |
| 身份标题至资料 | 16px |
| 姓名/手机号、岗位、说明行间 | 8px |
| 资料至确认区 | 24px |
| Checkbox间距 | 12px |
| 确认区至按钮 | 20px |
| 锁屏头像至标题 | 16px |

岗位读取当前role，姓名及手机号读取当前注册数据；非硬编码销售。仅注册标题下的说明删除；进度条和前三步处理器未改。

## 与原A锁屏对照

以交付基线3f491105的src/App.tsx LockScreen及src/index.css第716–721、867–872行为依据。原A没有新增退出按钮，本轮删除接入层退出操作，保留唯一解锁主操作。恢复原锁定状态说明。

| 参数 | 原A源码 | 本轮 |
| --- | --- | --- |
| 卡片宽 | 380px | 继承380px |
| 卡片内边距 | 32px 38px 30px | 保留原规则 |
| Logo | 左上20px，119×38px | 一致 |
| 头像 | 58px，原照片 | TDesign Avatar 58px，同一照片 |
| 圆角/阴影 | cv-radius-medium / td-shadow-3 | 继承，不改Token |
| 头像标题 | 旧结构同移位，具有留白 | 独立身份组，实测16px |
| 输入错误 | 需在输入下方 | 官方Input status/tips，独立占位 |

不把本轮接入层截图冒充原A原始截图：上表为源码对照；lock-before.png为此前接入版本修正前证据。

## 验证

浏览器实际从陈屿首页进入三维重建001，锁屏后空值显示输入下方错误，输入0/123成功解锁，仍在workspace/001，原CAD及重建标签保留。Light/Dark均检查。锁屏DOM中退出按钮数量为0。没有更改后端解锁规则：本地演示允许数字，默认非演示接口仍校验密码。

TypeScript/Vite构建通过（保留既有bundle体积提示）；26项账号测试通过；A集成回归检查通过。src/App.tsx、src/index.css、src/projects、src/cad及设计Token无差异。未提交本次用于布局查看的注册表单，未修改现有李明或其他申请状态。

修改代码仅src/auth/AuthPages.tsx、src/auth/IntegrationRoot.tsx、src/auth/authPages.css。

## 截图

[注册修改前](layout-final/registration-before.png) / [注册修改后](layout-final/registration-after.png)

[接入锁屏修改前](layout-final/lock-before.png) / [修正后Light](layout-final/lock-light.png) / [Dark](layout-final/lock-dark.png) / [空值报错](layout-final/lock-error.png)
