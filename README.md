# CliniVol Web UX Prototype

面向专业工程师的 CliniVol A 桌面交互原型。平台层使用 TDesign React；新版首页聚合手术项目，三维重建和 CAD 保持独立任务身份。默认亮色，保留已有深色偏好；设计基准见 design-system/。

## 本地运行

```bash
pnpm install
pnpm dev
```

浏览器打开终端显示的 Local URL。生产构建：

```bash
pnpm build
```

## 核心验证路径

1. 首页「我的项目」按项目编号进入详情；日期筛选只影响项目表。
2. 任务006已完成，可只读查看重建成果；任务007可继续CAD设计。
3. 任务004待审核，任务005因上游未通过而不可进入。
4. 通知、最近项目和完整项目列表进入同一项目详情，再由设计阶段进入专业工作区。
5. 专业工作区真实编辑继续走既有自动保存与提交审核；审核退回后在同一意见串处理。
6. 任务Tab关闭只关闭工作区视图，不删除任务或工程。

## 组件边界

- TDesign：平台卡片、项目/任务表格、导航、按钮、标签、表单、通知抽屉和弹窗。
- 自主专业布局：固定单排工具栏、Patient/Study/Series、四视图、对象属性、CAD参数面板与模型树。
- 统一基础：src/design-system/ 的Token、图标适配与规范文档。

## 说明

- 所有患者、订单与审核信息均为模拟数据。
- 原型不解析 DICOM，也不执行真实分割、重建或医学计算。
- 四视图中的灰阶图形、交叉线、模型、测量数据与性能信息均为演示效果。
- 浏览器状态使用 `localStorage` 保存；如需恢复初始数据，可清除当前站点的本地存储。

## A正式升级集成（2026-11-03）

本集成以A的`9d9f7f300952c1630059dfcf8abf562a5f4fc873`为基底，只迁入确认的项目页面、路由、日期及只读适配。没有导入E*扩展任务、实验存储、实验Vercel绑定或部署配置；CAD工程/快照与A原localStorage键保留。

- 备份Tag：`backup/a-before-project-dashboard-20261103`。
- 原目录与分支保持不变：`clinivol3d-v2-web-ux-clinivol3d-v2` / `codex/clinivol-a-cad-view-controls`。
- 集成worktree：`clinivol-a-dashboard-design-system-v1`。
- 集成分支：`codex/a-dashboard-design-system-v1`。
- 项目页面：`#home`、`#projects`、`#project/订单ID`；专业工作区继续使用`#workspace/任务ID`和`#cad/任务ID`。
- `#task/任务ID`旧入口兼容转向所属项目；底层任务身份不删除。
- 浅色/深色与字体、Icon等规范以`design-system/`四份Markdown为准；先读AGENTS。
- 首页五卡仍为原A七任务＋历史完成汇总12：3/2/2/1/13。历史完成12没有逐条明细，不补造任务。
- 医院为本原型已知订单的demo元数据，不代表真实客户合作；production记录无医院时显示空值。

### 安全恢复（不覆盖或删除当前工作）

原A目录和分支仍可直接运行，不需reset。若要额外恢复一份干净备份：

```bash
git show --no-patch backup/a-before-project-dashboard-20261103
git worktree add -b codex/a-restored-20261103 ../clinivol-a-restored-20261103 backup/a-before-project-dashboard-20261103
```

该命令建立另一可运行目录，不改当前集成分支、不丢弃未提交文件。不要执行reset --hard或clean -fd。

### 验证与本地预览

```bash
node scripts/check-a-integration.mjs
node scripts/check-design-system.mjs
node scripts/check-cad-history.mjs
pnpm run build
pnpm exec vite preview --host 127.0.0.1 --port 4194 --strictPort
```

本地集成地址：http://127.0.0.1:4194/。4192原A和4193实验服务保持隔离；本轮没有线上部署授权，不调用发布工具。

### 能力边界

- AI十项名称完整，但无真实AI重建服务/重建Mesh编辑器，规范禁用；不会生成医学结果。
- 蒙版体积与统计已移至视图，缺体素蒙版而禁用。
- STL属性统计已移至视图；任务006关联现有真实STL资源时可读取三角面、包围盒与文件大小；没有实际文件的任务禁用。没有伪造体积数据。
- 医学DICOM、原有分割及CAD仍是此前确认的交互原型能力；不新增专业几何算法或宣称临床/制造可用。
- Dark品牌绿、官方Dark非品牌值、独立Info双主题蓝阶及官方三级阴影已于2026-11-03确认，见design-system/tokens.md及figma-variable-mapping.md。本次只更新规范，CSS/JSON运行快照尚未同步这些新增确认；未修改Figma。面性统计Icon不伪装成线性，复杂路径不伪称精确1px转角。

4194与4192是不同浏览器Origin，本地验收不会自动复制原A浏览器存储。兼容性脚本验证原A任务记录、患者字段和审核记录可用原键恢复；原A端口的数据、工程与提交快照保持不动。后续正式同源发布时继续使用原键，本轮不执行线上替换或跨Origin数据搬运。
