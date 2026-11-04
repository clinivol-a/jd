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

## 四设计阶段

统一线性自绘几何，24画板、1.5描边、20px运行尺寸，定义于DesignStageIcon。三维重建为梯形重建平面与两条层线，CAD为等轴测立方体线框，有限元为三个圆形节点的分析网络，3D打印为框架、喷头及分层。统一18px光学范围，减少交叠细节以保证20px下可读。列表只显示实际阶段Icon并带完整名称Tooltip；详情可用Icon+名称。

- 三维重建：Cyan。
- CAD设计：Purple。
- 有限元分析：Yellow。
- 3D打印：Pink。

## 检查范围

工作台、项目/任务视角、Header、Sidebar、详情、审核、Dialog、Dropdown、三维重建与CAD使用同一导出层。不要全局覆写所有SVG的stroke/fill；否则会破坏材质、切片和ViewCube。

最新重绘：三维重建设计阶段使用骨性结构Icon；AI主入口为骨头+Sparkle，十项子工具分别为骨、器官、肺血管、支气管、腹部器官、脊柱肋骨、腹部大血管、肺叶、皮肤层和三角网格。统一CliniVolIcon适配，不使用多层灰色叠影；禁用图标和文字同一disabled色，真实算法未实现项继续禁用。

## 本轮语义修订

AI使用骨骼轮廓与独立星形，子工具保持单线轮廓，无opacity叠灰，均使用默认文字色。此规则替代上文AI禁用描述。三维重建采用长骨轮廓，有限元为不规则三角网格加力箭头；视图一级入口改为四窗，分割为剪切，参考平面为网格，四角信息为四角框，新建蒙版为新建文档，区域生长为定位，快速重建为骨骼。其余已正确的CAD/通用图标不随意替换。

## Tag 内图标尺寸例外（2026-11-04）

设计阶段Tag遵循TDesign React 1.18.4的Tag图标尺寸`--td-font-size-body-medium=14px`及4px间距，使用官方icon属性。24px作者画板及1.5px笔画不变；独立设计阶段图标仍20px。此组件内例外替代上文将所有使用位置固定20px的说法。
