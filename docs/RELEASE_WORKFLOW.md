# 交付版本更新与Preview发布

日常修改留在开发分支，本地构建与相关回归通过后给用户确认。未确认的实验不进入design-handoff。确认后用普通merge/fast-forward更新交付分支，禁止force push、覆盖Tag或修改Production分支。重大变更追加CHANGELOG。

## 当前阻碍

没有Git远端或GitHub仓库地址，未能检查分支保护；本机gh不可用。现有A项目团队访问403，停止线上动作。不得凭项目名猜仓库、创建重复项目或改Production配置。Preview地址：尚未生成；线上验收：未执行。

## 授权恢复后的执行顺序

1. 用户提供既有GitHub仓库地址及必要访问；核实仓库现有分支、rulesets/保护、默认分支、Vercel生产分支。若design-handoff恰为Production，立即停下，不推送。
2. 核对现有A Vercel项目prj_ZoiOp3jFxDt6IyPOsBkD9sPPRcnp及team_A5XHIhGRBN6rFwrZN3D5j8fC，确认Git关联、Preview非生产环境、构建pnpm build、输出dist、Root Directory、Node版本、环境变量名称/作用域（不打印值）和访问保护。
3. 确认无远端同名分支冲突后，推送已确认design-handoff分支及本次唯一Tag；不推其他分支，不使用force。优先由既有Git→Vercel自动部署，不再手动建立第二条发布链路。
4. 只读取简短状态；失败再看必要错误。若Git集成尚未配置，报告最简连接方案，获得所需授权后配置，不能擅改生产设置。
5. 验证Preview首页、项目/任务分页、详情、审核、重建与CAD、主题、Logo/照片/STL、刷新hash路由和主要按钮。访问保护需用户授权处理，不绕过。
6. 将实际稳定分支Preview URL、deployment ID/commit SHA和验收结果写入交付记录。不要把既有Production域名当作新Preview，不执行--prod/promote/alias生产域名。

## 可追溯与恢复

设计代码起点见VERSION.json。Tag指向含文档的交付提交；`git rev-parse design-handoff-v1.0-20261104^{commit}`取得完整SHA。文档中的代码SHA与Tag SHA含义不同，不能混称。恢复建议在新worktree检出Tag，不reset/clean现有工作区。以后交付使用递增唯一Tag，写明用户确认与验收状态，不覆盖旧Tag。开发工程师以固定Tag/Commit为需求依据，而不是跟随正在实验的开发分支。
