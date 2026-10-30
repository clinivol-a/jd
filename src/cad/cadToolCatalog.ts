// Presentation only: command strings route to the existing CAD workspace handlers.
// No geometry implementation is implied by an entry in this catalogue.
export type CadToolDefinition = {
  id: string; name: string; icon: string; group: string; command?: string
  available: boolean; readOnlySafe?: boolean; description?: string
}
const tool = (id: string, name: string, icon: string, group: string, command?: string, readOnlySafe = false, description?: string): CadToolDefinition => ({ id, name, icon, group, command, available: Boolean(command), readOnlySafe, description })
export const cadToolDefinitions = [
  tool('sketch', '草图', '草图', '基础建模', '草图'),
  tool('extrude', '拉伸', '拉伸', '基础建模', '拉伸'),
  tool('revolve', '旋转', '旋转体', '基础建模', undefined, false, '围绕轴线生成旋转体（Revolve）'),
  tool('sweep', '扫掠', '扫掠', '基础建模'),
  tool('loft', '放样', '放样', '基础建模'),
  tool('fillet', '圆角', '圆角', '结构与实体特征', '圆角'),
  tool('face-blend', '面混合', '面混合', '结构与实体特征'),
  tool('chamfer', '倒角', '倒角', '结构与实体特征'),
  tool('hole', '孔', '孔', '结构与实体特征', '孔'),
  tool('shell', '抽壳', '抽壳', '结构与实体特征'),
  tool('draft', '拔模', '拔模', '结构与实体特征'),
  tool('thicken', '加厚', '加厚', '结构与实体特征'),
  tool('rib', '筋', '加强筋', '结构与实体特征'),
  tool('linear-pattern', '线性阵列', '线性阵列', '复制与变换'),
  tool('circular-pattern', '环形阵列', '圆周阵列', '复制与变换'),
  tool('curve-pattern', '曲线阵列', '曲线阵列', '复制与变换'),
  tool('mirror', '镜像', '镜像', '复制与变换', '镜像'),
  tool('boolean', '布尔运算', '布尔', '复制与变换'),
  tool('split', '分割', '分割', '复制与变换'),
  tool('translate', '变换', '移动', '复制与变换', '移动', false, '修改设计对象的 X / Y / Z 位置'),
  tool('transform-rotate', '旋转', '对象旋转', '复制与变换', '旋转对象', false, '旋转现有对象的位置与方向，不生成旋转体'),
  tool('transform-scale', '缩放', '对象缩放', '复制与变换', '缩放对象', false, '重新缩放对象几何，不是缩放视角'),
  tool('move-face', '移动面', '移动面', '复制与变换'),
  tool('delete-face', '删除面', '删除面', '复制与变换'),
  tool('replace-face', '替换面', '替换面', '复制与变换'),
  tool('plane', '平面', '参考几何', '参考几何'),
  tool('axis', '轴', '轴', '参考几何'),
  tool('point', '基准点', '基准点', '参考几何'),
  tool('helix', '螺旋', '螺旋线', '参考几何'),
  tool('fit-spline', '3D 拟合样条', '3D 拟合样条', '参考几何'),
  tool('projected-curve', '投影曲线', '投影曲线', '参考几何'),
  tool('composite-curve', '复合曲线', '复合曲线', '参考几何'),
  tool('intersection-curve', '交点曲线', '交线', '参考几何'),
  tool('offset-surface', '偏移曲面', '偏移曲面', '曲面工具'),
  tool('boundary-surface', '边界曲面', '边界曲面', '曲面工具'),
  tool('fill', '填充', '填充', '曲面工具'),
  tool('ruled-surface', '直纹曲面', '直纹曲面', '曲面工具'),
  tool('measure', '测量', '测量', '查看与辅助', '测量', true),
  tool('section', '截面', '截面', '查看与辅助', '截面', true),
  tool('geometry-info', '几何信息', '分析', '查看与辅助', '分析', true),
  tool('mesh-info', '网格信息', '网格信息', '查看与辅助', '分析', true),
  tool('enclose', '封闭', '封闭', '基础建模'),
  tool('body-draft', '主体拔模', '主体拔模', '结构与实体特征'),
  tool('external-thread', '外部螺纹', '外部螺纹', '结构与实体特征'),
  tool('wrap', '包覆', '包覆', '复制与变换'),
  tool('decal', '印花', '印花', '复制与变换'),
  tool('delete-part', '删除零件', '删除零件', '复制与变换'),
  tool('modify-fillet', '修改圆角', '修改圆角', '直接编辑'),
  tool('move-boundary', '移动边界', '移动边界', '曲面工具'),
  tool('mutual-trim', '相互修剪', '相互修剪', '曲面工具'),
  tool('constrained-surface', '约束曲面', '约束曲面', '曲面工具'),
  tool('bridging-curve', '桥接曲线', '桥接曲线', '参考几何'),
  tool('trim-curve', '修剪曲线', '修剪曲线', '参考几何'),
  tool('isocline', '等斜线', '等斜线', '参考几何'),
  tool('offset-curve', '偏移曲线', '偏移曲线', '参考几何'),
  tool('isoparametric-curve', '等参曲线', '等参曲线', '参考几何'),
  tool('edit-curve', '编辑曲线', '编辑曲线', '参考几何'),
  tool('routing-curve', '路线曲线', '路线曲线', '参考几何'),
  tool('mate-connector', '配合连接器', '配合连接器', '参考几何'),
  tool('derived', '派生', '派生', '参考几何'),
  tool('variable', '变量', '变量', '参考几何'),
  tool('query-variable', '查询变量', '查询变量', '参考几何'),
  tool('composite-part', '复合零件', '复合零件', '参考几何'),
  tool('tag', '标记', '标记', '参考几何'),
  tool('frame', '框架', '框架', '框架'),
  tool('frame-trim', '框架修剪', '框架修剪', '框架'),
  tool('gusset', '角撑板', '角撑板', '框架'),
  tool('end-cap', '端盖', '端盖', '框架'),
  tool('cut-list', '切割清单', '切割清单', '框架'),
  tool('sheet-metal', '钣金模型', '钣金模型', '钣金'),
  tool('flange', '法兰', '法兰', '钣金'),
  tool('hem', '卷边', '卷边', '钣金'),
  tool('tab', '薄片', '薄片', '钣金'),
  tool('bend', '折弯', '折弯', '钣金'),
  tool('jog', 'SMJog', 'SMJog', '钣金'),
  tool('form', '成型', '成型', '钣金'),
  tool('sheet-loft', '钣金放样', '钣金放样', '钣金'),
  tool('joint', '制作接头', '制作接头', '钣金'),
  tool('corner', '角点', '角点', '钣金'),
  tool('bend-relief', '折弯止裂槽', '折弯止裂槽', '钣金'),
  tool('corner-break', '尖角倒钝', '尖角倒钝', '钣金'),
  tool('finish-sheet', '结束钣金模型', '结束钣金模型', '钣金'),
] as const
export const cadToolById: ReadonlyMap<string, CadToolDefinition> = new Map(cadToolDefinitions.map((definition) => [definition.id, definition]))
export type CadToolbarEntry = { id: string; name: string; icon: string; primary?: string; children?: string[]; priority?: number }
export type CadToolbarGroup = { id: string; name: string; entries: CadToolbarEntry[] }
const entry = (id: string, priority = 0): CadToolbarEntry => {
  const definition = cadToolById.get(id)!
  return { id, name: definition.name, icon: definition.icon, primary: id, priority }
}
// Order and dropdown membership checked against the supplied Onshape document,
// recording, and official Feature toolbar. Unsupported commands remain disabled.
const dropdown = (id: string, children: string[], name?: string): CadToolbarEntry => ({ ...entry(id), name: name ?? cadToolById.get(id)!.name, children })
export const cadToolbarGroups: CadToolbarGroup[] = [
  { id: 'sketch', name: '草图', entries: [entry('sketch')] },
  { id: 'base', name: '基础建模', entries: [entry('extrude'), entry('revolve'), entry('sweep'), entry('loft'), dropdown('thicken', ['thicken', 'enclose'])] },
  { id: 'solid', name: '结构与实体特征', entries: [dropdown('fillet', ['fillet','face-blend']), entry('chamfer'), dropdown('draft', ['draft','body-draft']), entry('rib'), entry('shell'), entry('hole'), entry('external-thread')] },
  { id: 'pattern', name: '阵列与镜像', entries: [dropdown('linear-pattern', ['linear-pattern','circular-pattern','curve-pattern'], '阵列'), entry('mirror')] },
  { id: 'transform', name: '实体操作', entries: [entry('boolean'), entry('split'), dropdown('translate', ['translate','transform-rotate','transform-scale','wrap','decal'], '变换'), entry('delete-part')] },
  { id: 'direct', name: '直接编辑', entries: [entry('modify-fillet'), entry('delete-face'), entry('move-face'), entry('replace-face')] },
  { id: 'reference', name: '参考几何与曲线', entries: [dropdown('plane', ['plane','axis','point'], '参考几何'), dropdown('offset-surface', ['offset-surface','boundary-surface','fill','move-boundary','ruled-surface','mutual-trim','constrained-surface'], '曲面'), dropdown('helix', ['helix','fit-spline','projected-curve','bridging-curve','composite-curve','intersection-curve','trim-curve','isocline','offset-curve','isoparametric-curve','edit-curve','routing-curve'], '曲线'), entry('mate-connector'), entry('derived'), dropdown('variable', ['variable','query-variable']), entry('composite-part'), entry('tag')] },
  { id: 'frame', name: '框架', entries: [dropdown('frame', ['frame','frame-trim','gusset','end-cap','cut-list'])] },
  { id: 'sheet', name: '钣金', entries: [dropdown('sheet-metal', ['sheet-metal','flange','hem','tab','bend','jog','form','sheet-loft','joint','corner','bend-relief','corner-break','finish-sheet'])] },
  { id: 'inspect', name: '查看与辅助', entries: [entry('measure'), entry('section'), dropdown('geometry-info', ['geometry-info','mesh-info'], '分析')] },
]
export const cadEntryWidth = (item: CadToolbarEntry) => item.children ? 48 : 34
export function cadPaletteWidth(groups: CadToolbarGroup[]) { return groups.reduce((width, group) => width + group.entries.reduce((sum, item) => sum + cadEntryWidth(item), 0), 0) + Math.max(0, groups.length - 1) * 9 }
export function fitCadToolbar(width: number) {
  const groups = cadToolbarGroups.map((group) => ({ ...group, entries: [...group.entries] }))
  const hidden: CadToolbarEntry[] = []
  // Only remove a contiguous tail when the actual available width is exhausted.
  // 48px is reserved for overflow only if overflow really exists.
  if (cadPaletteWidth(groups) > width) {
    while (cadPaletteWidth(groups.filter((group) => group.entries.length)) + 48 > width) {
      const group = [...groups].reverse().find((item) => item.entries.length)
      if (!group) break
      hidden.unshift(group.entries.pop()!)
    }
  }
  return { groups: groups.filter((group) => group.entries.length), hidden }
}
export const cadSketchTools = ['直线', '矩形', '圆', '圆弧', '样条', '尺寸', '约束']
