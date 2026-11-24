# CliniVol Design System V1.0 — Icon

## 适配层

`src/design-system/CliniVolIcon.tsx`为唯一图标适配层，catalog适配在`tdesign.tsx`和`lucide.tsx`。原TDesign/Lucide语义名称保持，不改变菜单、Tooltip或命令处理器。CAD专用图标继续由CadIcon提供原有语义路径，但最终通过同一CliniVolIcon输出。TDesign组件内部生成的Icon保留组件行为，其描边通过限定`.t-icon [stroke-width]`归一，不作用于医学影像SVG。

- 作者画板24×24；运行尺寸16、20、24px，旧尺寸按16/20/24向上就近规范化，超大装饰图标不扩展新尺寸。
- 线性描边1.5；round端点与round连接；普通矩形rx=1。没有给SVG容器设置border-radius。
- CAD及四阶段Icon保留专业含义，不用无关通用符号替代几何命令。
- 五张统计卡要求保留的TDesign面性图标沿用原轮廓；面性符号没有可统一为1.5px的轮廓描边，属于明确的原有视觉例外。其尺寸与颜色仍使用适配层。
- 原始路径内非矩形复杂圆角保留作者几何，不能据round join宣称所有转角均精确为1px。若需要数学意义的逐路径1px圆角，需单独确认矢量母版。
- ViewCube立方体面、坐标轴、比例尺、医学CT/模型SVG属于视图几何，不是24px通用Icon，保持原视觉和可交互命中区域。

## 颜色与状态

默认继承text-color-primary；Header主题/通知/帮助/锁屏与Sidebar默认图标明确使用该Token。普通Hover中性容器灰；Selected/Active品牌色；选中侧栏为品牌底与白字白图标；Disabled使用text-color-disabled；Focus保持可见。语义通知、设计阶段、状态图标使用各自语义色，不强行涂成品牌绿。

## 侧栏折叠入口

销售、设计师、超级管理员及未来角色的左下角导航展开/收起统一使用tdesign-icons-react官方ViewListIcon，经tdesign.tsx的CliniVolIcon适配层导出，不手绘替代。两种状态使用同一图标，保留各入口既有16/20/24运行尺寸、按钮位置、颜色、Hover/Focus、Tooltip及动态aria-label；不改Sidebar宽度或动画。

## 四设计阶段

统一线性自绘几何，24画板、1.5描边、20px运行尺寸，定义于DesignStageIcon。三维重建为梯形重建平面与两条层线，CAD为等轴测立方体线框，有限元为三个圆形节点的分析网络，3D打印为框架、喷头及分层。统一18px光学范围，减少交叠细节以保证20px下可读。设计师项目表、任务表及审核记录表只显示共享DesignStageIcon（独立20px，无Tag背景、边框或文字），Tooltip展示完整阶段名称；项目行显示实际阶段集合，任务行与审核行只显示对应单个阶段。详情及其他需要完整名称的区域继续通过StageLabel使用官方Tag的icon属性展示Icon+名称，组件内尺寸见下文Tag例外。只展示实际存在的阶段，不虚构任务。2026-11-20确认的这三类表格Icon-only规则覆盖此前列表统一Tag规定。

- 三维重建：Cyan。
- CAD设计：Purple。
- 有限元分析：Yellow。
- 3D打印：Pink。

## 检查范围

工作台、项目/任务视角、Header、Sidebar、详情、审核、Dialog、Dropdown、三维重建与CAD使用同一导出层。不要全局覆写所有SVG的stroke/fill；否则会破坏材质、切片和ViewCube。

## 专业工具语义与历史说明

设计阶段图标以当前`DesignStageIcon`及上文四阶段定义为准；早期“长骨/骨性结构”“三角网格加力箭头”是已被最终阶段参考替代的历史方向，不用于替换当前阶段路径。AI分类的骨骼语义与设计阶段图标是不同用途。

AI主入口为骨骼轮廓与独立星光；十项子工具分别表达骨骼、器官、肺血管、支气管、腹部器官、脊柱肋骨、腹部大血管、肺叶、皮肤和Mesh。AI入口使用正常文字/图标色并保留现有参数确认，不统一禁用；未接入算法服务不能生成虚假结果。其他工具确实禁用时，文字与图标继承同一disabled色，不叠加opacity或重复灰色路径。

视图一级入口表达多视口，图像表达影像处理，分割表达区域/蒙版操作。参考平面、四角信息、区域生长、布尔、拆分、快速重建等沿用现有语义映射；已准确图标不得借全局审计重新绘制。CAD命令、医学方向标识和通用业务图标分别处理。

## Tag 内图标尺寸例外（2026-11-04）

设计阶段Tag遵循TDesign React 1.18.4的Tag图标尺寸`--td-font-size-body-medium=14px`及4px间距，使用官方icon属性。24px作者画板及1.5px笔画不变；独立设计阶段图标仍20px。此组件内例外替代上文将所有使用位置固定20px的说法。


## 跨角色语义复用（2026-11-13）

本文件是[A方案设计规范](../AGENTS.md)的图标权威入口；颜色引用[tokens.md](tokens.md)，Tag及交互引用[component-rules.md](component-rules.md)，页面一致性见[ui-ux-consistency.md](ui-ux-consistency.md)，业务含义见[field-dictionary.md](../docs/product/field-dictionary.md)。

1. 工程师、销售、未来医生与管理员的相同业务语义复用同一图标；不同语义不得只为颜色顺序而套用无关图形。
2. 四阶段顺序固定为三维重建、CAD设计、有限元分析、3D打印，分别使用Cyan、Purple、Yellow、Pink Token；共用`src/design-system/DesignStageIcon.tsx`及StageLabel，不分别维护角色版本。保留现有路径、Tooltip及组件尺寸例外。
3. Sidebar继续使用既有TDesign Icon及适配层；订单管理等既有菜单图标不因新增角色随意替换。统计卡沿用浅色容器与深色面性图标的已确认例外，不强改线性。
4. 可点击Icon使用实际按钮命中区、可见Focus、正确Hover和可访问名称；必要时Tooltip说明操作。装饰Icon不加假点击反馈。Primary与危险操作遵循自身语义，普通Hover用中性灰；Light/Dark均引用既有语义Token。
5. 禁止重复边界描边、透明叠色和灰色重影；1px微圆角是绘制目标，不是给SVG画板套圆角。不得全局修改SVG或覆盖医学影像、真实模型与ViewCube几何。

本轮仅修正文档中的历史冲突，不修改任何图标路径或运行样式。


### 2026-11-24｜管理员订单More

管理员订单更多操作统一通过CliniVol图标适配层使用TDesign官方`EllipsisIcon`（横向三点），20px显示、既有32px按钮点击区。不得旋转竖向MoreIcon或重新绘制。其他已确认图标与全局Token不变。
