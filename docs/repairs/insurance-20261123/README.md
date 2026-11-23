# 医保汇总关联修复 · 2026-11-23

## 问题与修复

统一业务数据迁移后，医保汇总仍依赖旧 SO 成果演示目录；新共享订单进入缺少字段的兜底投影，且表格和 Excel 错把内部 Order.id 显示为订单编号。

- 表格和 Excel 使用 Order.businessNo，内部 ID 仅作为关联与选择键。
- 手术项目名称、性别、患者及完成时间读取服务端共享订单。
- 医院通过同一医院目录的 hospitalId 关联。
- 身份证号读取当前销售拥有的已存加密患者凭证；网页脱敏，仅具备原有导出权限的销售可以在导出文件中获得完整字段。
- 成果核对 Order → Project → Task → approvedModel → Artifact 的稳定 ID 和版本，检查已完成、审核通过及审核时间。
- 列表、预览接口和 Excel 均重查销售身份、导出权限、所属订单与指定成果版本。缺少必需资料或有效成果时禁止导出。

## 演示资源边界

当前三笔已完成订单 CV-2026-0014、0015、0016 是隔离演示记录，患者资料沿用既有合成资料，没有新造姓名或身份证号。它们的工作区明确关联同一 shared-jaw-demonstration 演示模型。

本次预览是上述既有演示模型的静态衍生图，严格受隔离场景与 synthetic 成果标记限制；不是三位真实患者的临床成果，不创建新的审核通过记录，不发布成果或增加分享权限。真实业务成果需接入实际获批成果快照存储；未接入时继续显示缺失并阻止导出，不能借用演示图替代。

## 实际验证

- 浏览器医保汇总：三笔订单的 CV 编号、项目名称、医院、患者、性别、脱敏证件及完成时间已显示。
- 浏览器点击成果预览：模型图片实际加载（preview.png）。
- 浏览器勾选三笔并生成 Excel：下载成功，361180 bytes；检查包内包含三笔 CV 编号、三种项目名称、三行完整证件字段及三张 PNG，不包含 DEMO-LINK 内部编号。
- 31 项服务测试通过：linked-insurance、business-v31、business-v33、share-records。
- TypeScript / Vite 构建通过；存在原有大 chunk 提示。
- 共享业务 JSON 与修复前私有备份逐字节一致：20 条订单、16 个项目、41 条任务。未删除或重新编号。
- 本轮未修改其他角色界面、专业工作区、全局样式或 Token；未部署、未推送 GitHub、未更新交付分支。
- Dark / 其他窗口尺寸本轮未额外浏览器验证；本次没有改动 CSS 或布局。

## 文件

- src/sales/business/InsuranceSummary.tsx
- server/business/plugin.mjs
- server/business/service.mjs
- server/business/xlsx.mjs
- server/business/linkedInsurance.mjs
- server/business/linkedPreview.mjs
- tests/linked-insurance.test.mjs

截图：table.png（汇总表）、preview.png（预览）。完整证件导出只保存在本机下载目录，不纳入源码交付。
