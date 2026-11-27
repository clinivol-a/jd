# 开关外观统一检查

日期：2026-11-27。范围：交互方案 A；仅修改开关样式，不部署。

## 实现

- 全局引入 `src/design-system/components.css`，覆盖所有 TDesign Switch 的浅色可操作关闭态。
- 正常关闭背景使用 `--td-bg-color-component`（#E7E7E7），Hover 使用 `--td-bg-color-component-hover`（#DCDCDC）。未修改全局 Token。
- 开启、禁用、loading 和 Dark 保留现有 TDesign 规则；禁用关闭仍为 #EEEEEE，保留禁用光标及无手柄阴影。
- 不调整角色、授权、业务数据，也不将 Checkbox 或导航切换控件改作 Switch。

## 覆盖范围

源码核对：成员功能权限、成员启用状态、销售/设计师/管理员共用偏好设置、隔离演示控制台的安全验证开关，均使用 TDesign Switch，由同一全局规则覆盖。控制台仅核对样式接入，没有更改安全设置。

## 浏览器验证

- 成员侧栏实测浅色可操作关闭背景 #E7E7E7、Hover #DCDCDC、禁用关闭 #EEEEEE；开启 #0D7A5D、禁用开启 #9BD9C4。
- Dark 实测关闭 #4B4B4B、禁用关闭 #2C2C2C、开启 #45A986、禁用开启 #164235，均保持原主题。
- 管理员偏好设置实测关闭背景 #E7E7E7；任务分配通知已恢复原开启状态。三端共用同一个 SettingsPage，没有分别登录重复验证。
- 成员权限试切换仅停留在未保存表单，已关闭取消；未保存授权变更。主题恢复浅色。
- 截图：`member-switch-light.jpg`、`member-switch-dark.jpg`、`preferences-switch-light.jpg`；测量数据见 `browser-evidence.json`。

## 检查结果

TypeScript 构建与 Vite 生产构建通过；仅有现有大包体积提示。`git diff --check` 通过。
本地预览实际访问验证： http://127.0.0.1:5260/ 。该地址仅供本机使用。
