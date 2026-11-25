# 2026-11-25 管理端圆角、操作人及业务文案定向修正

修改前基线：`164b5d0daf478d73df2ece18f21bc91542861721`。
安全引用：`codex/backup-admin-copy-corners-20261125-164b5d0`。
本地预览：<http://127.0.0.1:5260/>。未推送、未部署。

## 结果

| 用户问题 | 修改与验证 |
| --- | --- |
| 账号注册审核Card底部直角 | 原Card已有官方6px圆角，但内部不透明表格背景越出边界。仅给审核中心Card加作用域裁切，保持原Token和布局。浏览器实测Light/Dark左下、右下均6px、overflow为hidden，筛选弹层及退回详情仍可正常打开。 |
| 管理员署名混用姓名和角色 | 管理端读取模型统一根据操作时角色、账号ID输出“管理员”；员工保持真实姓名。Header/账户菜单中的岗位称呼改为“管理员”，内部super_admin权限键不变。浏览器核对林致远审核/撤销、许承安启停及审计列表均显示管理员；许文清专业任务分配显示姓名。医生共用记录格式同样读取角色展示，保证销售/管理查看相同医生时不混用称呼。 |
| 管理端出现本地验收/合成意见 | 为8条已确认隔离验收措辞建立精确业务展示映射；不对任意真实意见做关键词替换。停用显示“业务资格复核期间暂停使用。”，恢复显示“已核对资质及医院、科室关系，恢复使用。”。LOCAL技术依据编号不冒充书面审核意见；数据来源及尚不可用能力改成业务语气，保留真实功能边界。 |

管理员实际姓名、账号ID、操作角色、事件ID、时间及意见保存在原始服务数据中。显示映射不保存回原始记录；需要变更展示的字段同时保留recordedActor/recordedReason/recordedNote/recordedBasis。现有用户填写的姓名、组织和真实意见不编造、不替换。合成资质文件自身的演示标记保留，避免冒充有效证件。

检查审计页时另发现已有部分共享事件未提供业务分类，导致分类筛选调用replaceAll报错、整页空白。读取模型对缺失分类使用“业务操作”，原始事件不变。浏览器重登后已确认审计列表正常、员工分配搜索正常。

## 截图

- [账号审核Card底角](account-card-corners.png)
- [Dark底角](account-card-corners-dark.png)
- [管理员审核署名](doctor-admin-labels.png)
- [启停记录业务文案](doctor-business-copy.png)
- [审计列表管理员署名](audit-admin-labels.png)
- [员工分配任务保留姓名](employee-assignment-names.png)

## 验证

- 通过：TypeScript、Vite构建、`git diff --check`。
- 通过：104项认证、管理、机构、医生记录一致性及新增展示规则测试。
- 通过：展示不修改原始审计；操作时角色优先于当前角色；正常员工姓名保留；未知实际审核人不被改名；真实审核意见不替换；重复读取不产生事件。
- 通过：浏览器账号审核卡片、筛选与退回详情，医生审核/启停记录、审计页面、分配搜索，Light/Dark圆角。
- 未逐页浏览器验证：其余管理模块全部操作流程；其静态文案及共用记录数据映射已代码检查。本轮未扩大为全平台功能回归。
- 构建保留已有大分块提示，不做无关拆包。
- Impeccable机械检测：无命中。React检查未引入新Effect、请求循环或可变UI状态；仅局部Card类及文案变更。

## 文件范围

- 管理端：`src/admin/AdminWorkspace.tsx`、`src/admin/admin.css`、`server/admin/service.mjs`、`server/admin/presentation.mjs`。
- 共用署名展示：`src/audit/actorLabel.mjs`、`src/doctors/doctorDisplay.mjs`。
- 仅岗位称呼：`src/auth/AccountMenu.tsx`、`src/auth/DevConsole.tsx`；认证流程、权限不变。
- 仅新增审计角色元数据：`server/auth/organizationDirectory.mjs`、`server/unified/institutionDirectory.mjs`。
- 规范：`AGENTS.md`、`design-system/ui-ux-consistency.md`、`docs/product/field-dictionary.md`。
- 测试：`tests/admin-presentation-20261125.test.mjs`。
- 本报告及截图。

设计师工作台、销售订单布局、专业工作区、Header布局及全局Token无修改。main、design-handoff和冻结基线未改动。
