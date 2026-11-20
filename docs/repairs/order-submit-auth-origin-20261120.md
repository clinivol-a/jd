# 销售订单提交地址错误修复（2026-11-20）

恢复点：fdfa28ae74facfa2fbf1fe9737f8e365f323143c。

## 原因与最小修复

Vite配置调用salesDemoPlugin({authOrigin})，而现有插件第一个参数是地址字符串。提交标准订单时前端请求/api/sales-demo/order-validate，插件拼接/api/auth/session，导致对象被转成[object Object]，返回400及Failed to parse URL错误。该问题与订单必填校验、患者姓名或设计阶段文案修改无关。

仅将vite.config.ts中的调用改为salesDemoPlugin(authOrigin)。没有修改登录、权限、订单状态机、数据或UI。运行中的5260服务由Vite自动重载，认证服务5261保持。

## 实际验证

- 修改前：直接访问运行中的5260校验接口复现HTTP400及完全相同错误。
- 新增tests/sales-vite-wiring.test.mjs，加载真实vite.config.ts并使用其中创建的销售插件，防止只测单独工厂而遗漏实际配置。修改前该测试复现400，修改后通过。
- 隔离HTTP测试：有效销售会话及有效订单200；未登录/非销售/锁定/不同owner均403；缺手术项目名称422；通过校验后正常状态转换为待审核。
- 修改后运行中的5260匿名请求正确返回403“请使用已登录销售账号”，不再产生非法URL。
- TypeScript与Vite构建通过（仅既有大chunk提示）；git diff --check通过。
- 未在浏览器提交、删除或审批用户已有订单；完整真实表单提交本轮未实际验证。已保存业务数据未动。
- 未推送、未部署，不更改任何线上环境。若使用其他公网链接，需要先核实链接及部署版本，不能将本地修复声称为线上已发布。
