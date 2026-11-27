# 成员Drawer固定底栏与可见文字间距核对

2026-11-27，基线`87e8802`，安全恢复分支`codex/backup-before-member-footer-20261127`。

## 本轮局部修改

- 成员管理移除“区域组长配置”按钮和对应弹窗挂载。区域在成员Drawer内维护，底层区域资格、医院候选和服务端校验保持原样。
- 上一轮只测量标题到容器的距离；实际TDesign表单Label仍为32px行高、基本资料为22px，导致可见文字差异。本轮仅在成员Drawer将表单Label行高改为正文22px，去掉32px最小高度，并保留Label到控件8px。
- 保存按钮移至与医生档案审核共用的TDesign Drawer原生footer。使用React Portal保留原表单的保存、busy及error状态，正文滚动不移动底栏，没有另造悬浮覆盖层。
- 注册逻辑未改。已有“无专业岗位”选项仅允许内部组织成员提交；账号审核不等于管理授权，后续授予业务组长角色及区域。现有预置成员不伪造注册历史。

## 真实浏览器验收

| 项目 | 实际结果 |
|---|---|
| 成员管理区域组长配置按钮 | 数量0 |
| 基本资料标题到首行文字 | 13px |
| 岗位与角色标题到首行文字 | 13px |
| 管理范围标题到首行文字 | 13px |
| 功能权限标题到首行文字 | 13.1875px，开关行居中产生不足1px的子像素差异 |
| 所有Label行高 | 22px |
| 保存按钮固定 | 正文scrollTop由0到209.5px；footer top始终947px，bottom始终1012px |
| 固定底栏保存 | 原角色、原区域保存并重开，仍为无专业岗位/业务组长/合肥；没有增加权限 |
| 校验失败 | 未保存的普通员工+无专业岗位提交被拒绝，错误在底栏显示；关闭重开后原角色和区域仍在 |
| Light/Dark | 两种主题实际检查，最后恢复浅色 |
| TypeScript / Vite | 通过；Vite 8.68秒；既有大包警告未扩展处理 |
| Diff空白检查 | 通过 |
| 部署/推送 | 均未执行 |

截图：[顶部及固定保存](top.png)、[正文滚动后](scrolled.png)、[校验失败](validation.png)、[深色](dark.png)。[测量数据](measurements.json)。

修改文件：`src/admin/MemberAccessForm.tsx`、`src/admin/AdminWorkspace.tsx`、`src/admin/admin.css`、`AGENTS.md`、`design-system/ui-ux-consistency.md`。

本轮没有修改服务端、登录注册、销售/设计师业务、Header/Sidebar、全局Token、main/design-handoff或冻结基线。没有对无关业务执行全量浏览器验收，也不以构建通过代替该类验收。
