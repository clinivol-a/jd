# V3.1 本地验收（2026-11-16）

## 冻结保护

- V3.0 Commit：`1beeaa6ff126f371550780d6a9918b840e111f5e`。
- Annotated Tag：`a-v3.0-review-baseline-20261116`；备份分支：`backup/a-v3.0-review-20261116`，同指上述Commit。
- ZIP：`/Users/yifei/Downloads/clinivol-A-v3.0-review-baseline-20261116.zip`；压缩完整性通过；从ZIP新目录恢复并使用已安装锁定依赖构建通过。未把此检查称为全新网络安装测试。
- 基线说明：[V3.0_BASELINE_20261116.md](../../releases/V3.0_BASELINE_20261116.md)；独立结果：[冻结验证JSON](../../releases/V3.0_FREEZE_VALIDATION_20261116.json)。用户浏览器与本地认证目录原位保留，没有清空；不是源码包已包含浏览器附件/账号数据。
- 新开发分支：`feature/a-v3.1-business-design`。main/design-handoff及冻结分支/Tag未改变，未推送、未部署。

## 实际技术检查

- `pnpm run build`：通过，已有大分块警告保留。
- `node --experimental-strip-types --test tests/sales*.test.mjs tests/auth*.test.mjs tests/business-v31.test.mjs`：**101/101通过**。
- 其中8项V3.1服务/HTTP测试：报告两图、PACS失败及身份更改、敏感资料加密、成果授权、分享/拒绝/撤销、完成自然月、Excel/导出审核、方法/来源/角色/生产禁用。
- 浏览器：[browser-results.json](browser-results.json)；独立补测：[submission-regression.json](submission-regression.json)。手动、报告、PACS三种订单均通过实际填写/上传/核对/提交进入原订单列表；工程师重建001与CAD007实际显示，未捕获页面脚本错误。
- 局域网：[lan-results.json](lan-results.json)。同一电脑以私网地址、独立移动浏览器上下文访问并验证授权手机号，读取实际批准静态样本；管理接口403，源模型路径404，无横向溢出/脚本错误。**未由实体手机扫码**，不把移动尺寸浏览器当实体手机。
- 源码差异：App.tsx、index.css、CAD/重建/项目业务与运行Design Token均无修改；IntegrationRoot仅新增DEV下成果外部只读页面分发及其样式导入。
- 静态设计检测无报告项；这不是完整人工视觉认证。已阅读React组件检查规则，避免FormItem覆盖富文本受控值，效果清理Blob URL和定时器。

## 24项要求逐项结果

| # | 要求 | 结果及边界 |
|---|---|---|
| 1 | V3.0可恢复 | 通过，ZIP解压/恢复构建 |
| 2 | Tag/SHA已记录 | 通过，冻结报告 |
| 3 | V3.1独立分支 | 通过，未修改冻结引用 |
| 4 | 手动创建订单 | 通过，浏览器实际提交 |
| 5 | 报告路径完整演示 | 通过（隔离适配），真实OCR/医院访问待正式接口 |
| 6 | PACS路径完整演示 | 通过（隔离适配），真实PACS待正式接口 |
| 7 | 自动预填可核对/修改 | 通过，身份改动失效 |
| 8 | 患者/检查/影像关联 | 通过（隔离元数据匹配），真实影像验证待正式接口 |
| 9 | 完成自然月 | 通过，服务测试跨月/跨年；旧订单按真实完成时间投影 |
| 10 | 单条/批量选择 | 通过，TDesign多选及UI选中样本后导出 |
| 11 | .xlsx可打开/嵌图 | 通过，实际UI下载、Artifact Tool打开渲染、openpyxl与ZIP/XML检查 |
| 12 | 证件信息限定授权 | 通过（隔离权限/加密引用），正式身份核验及密钥管理待接口 |
| 13 | 成果Card | 通过，无批准成果时空状态，不造原订单成果 |
| 14 | QR打开 | 通过（私网浏览器），实体手机扫码未实际验证 |
| 15 | 手机验证及授权 | 通过（隔离服务），任意非授权手机号拒绝；正式短信/患者关系待接口 |
| 16 | 只读Viewer | 静态图平移缩放通过；真实只读3D/旋转待正式成果接口 |
| 17 | 销售附件无下载 | UI按钮/自动下载已移除；旧Blob与邀请附件的生产防下载待正式受控渲染接口，不能标为后端全部通过 |
| 18 | 专业源文件不外发 | 新分享/导出接口与私网网关通过，STL请求被拒绝；既有工程师本地资源仍保留，不宣称全平台生产文件服务已完成 |
| 19 | 授权医保下载 | 通过，实际UI下载；旧订单缺少核验或批准图片时明确阻断 |
| 20 | 销售原业务 | 通过现有销售测试及列表/客户页面；未重置原数据 |
| 21 | 工程师原业务 | 通过代码差异、原首页、重建/CAD进入及角色切换；未重新全量手测所有几何命令 |
| 22 | Light/Dark | 通过新增页面桌面截图/移动分享；未逐一重测所有旧弹窗 |
| 23 | TypeScript/Vite | 通过 |
| 24 | 未部署 | 通过，无推送或部署调用 |

未接入的能力与待确认规则：[BUSINESS_DESIGN_V31.md](../../product/BUSINESS_DESIGN_V31.md)。本轮是可操作的本地业务设计，不是正式医院接入、临床算法、生产权限或医保自动报送实现。

## 截图与导出

- [三种入口](entry-dialog.png)、[手动四步](manual.png)。
- [报告核对](report-matched.png)、[身份不一致阻断](report-mismatch.png)、[PACS核对](pacs-matched.png)、[服务需求与提交](import-requirements.png)。
- [成果查看](result-view.png)、[订单分享](result-share.png)、[医保汇总](insurance.png)、[深色汇总](insurance-dark.png)。
- [移动尺寸授权查看](mobile-result.png)、[实际私网地址查看](mobile-lan-result.png)。
- [工程师首页](designer-home.png)、[重建](designer-reconstruction.png)、[CAD](designer-cad.png)。
- [实际UI导出的Excel](insurance-ui-export.xlsx)、[工作簿渲染](workbook-preview.png)、[工作簿检查结果](workbook-validation.json)。身份证列保持文本，完成时间为真实日期单元格，PNG确实嵌入；不含源模型、外链或宏。尚未在桌面Microsoft Excel应用中人工打开。

## 修改文件

- `src/sales/SalesWorkspace.tsx`：Dialog入口/独立导入与医保路由/共用订单保存、对应导航选中。
- `src/sales/OrderPages.tsx`：医保可选资料、来源人工接续、销售下载入口移除、成果Card。
- `src/sales/model.ts`：增量可选字段，既有状态机不变。
- `src/sales/business/`：选择、导入、医保字段、成果分享/静态只读、汇总UI及局部样式。
- `src/auth/IntegrationRoot.tsx`：仅DEV外部成果入口，既有认证流程不变。
- `server/business/`：本地隔离服务、加密保存、授权与来源检查、分享/撤销/审计、私网只读网关、真实XLSX编码及已有原型快照PNG。
- `vite.config.ts`：只注册DEV服务，不安装到生产构建。
- `tests/business-v31.test.mjs`、本目录证据文件。
- `AGENTS.md`、`docs/product/field-dictionary.md`、`docs/product/BUSINESS_DESIGN_V31.md`与冻结验证报告。Token、Icon、组件数值未重定义。
