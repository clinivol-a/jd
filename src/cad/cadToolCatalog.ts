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
  tool('rib', '加强筋', '加强筋', '结构与实体特征'),
  tool('linear-pattern', '线性阵列', '线性阵列', '复制与变换'),
  tool('circular-pattern', '圆周阵列', '圆周阵列', '复制与变换'),
  tool('curve-pattern', '曲线阵列', '曲线阵列', '复制与变换'),
  tool('mirror', '镜像', '镜像', '复制与变换'),
  tool('boolean', '布尔', '布尔', '复制与变换'),
  tool('split', '分割', '分割', '复制与变换'),
  tool('translate', '移动', '移动', '复制与变换', '移动', false, '修改设计对象的 X / Y / Z 位置'),
  tool('transform-rotate', '旋转', '对象旋转', '复制与变换', undefined, false, '旋转现有对象的位置与方向，不生成旋转体'),
  tool('transform-scale', '缩放', '对象缩放', '复制与变换', undefined, false, '重新缩放对象几何，不是缩放视角'),
  tool('plane', '平面', '参考几何', '参考几何'),
  tool('axis', '轴', '轴', '参考几何'),
  tool('point', '基准点', '基准点', '参考几何'),
  tool('helix', '螺旋线', '螺旋线', '参考几何'),
  tool('fit-spline', '3D 拟合样条', '3D 拟合样条', '参考几何'),
  tool('projected-curve', '投影曲线', '投影曲线', '参考几何'),
  tool('composite-curve', '复合曲线', '复合曲线', '参考几何'),
  tool('intersection-curve', '交线', '交线', '参考几何'),
  tool('offset-surface', '偏移曲面', '偏移曲面', '曲面工具'),
  tool('boundary-surface', '边界曲面', '边界曲面', '曲面工具'),
  tool('fill', '填充', '填充', '曲面工具'),
  tool('ruled-surface', '直纹曲面', '直纹曲面', '曲面工具'),
  tool('measure', '测量', '测量', '查看与辅助', '测量', true),
  tool('section', '截面', '截面', '查看与辅助', '截面', true),
  tool('geometry-info', '几何信息', '分析', '查看与辅助', '分析', true),
  tool('mesh-info', '网格信息', '网格信息', '查看与辅助', '分析', true),
] as const
export const cadToolById: ReadonlyMap<string, CadToolDefinition> = new Map(cadToolDefinitions.map((definition) => [definition.id, definition]))
export type CadToolbarEntry = { id: string; name: string; icon: string; primary?: string; children?: string[]; priority?: number }
export type CadToolbarGroup = { id: string; name: string; entries: CadToolbarEntry[] }
const entry = (id: string, priority = 0): CadToolbarEntry => {
  const definition = cadToolById.get(id)!
  return { id, name: definition.name, icon: definition.icon, primary: id, priority }
}
export const cadToolbarGroups: CadToolbarGroup[] = [
  { id: 'base', name: '基础建模', entries: [entry('sketch'), entry('extrude'), entry('revolve', 2), entry('sweep', 2), entry('loft', 2)] },
  { id: 'solid', name: '结构与实体特征', entries: [
    { ...entry('fillet'), children: ['fillet', 'face-blend'] }, entry('chamfer', 2), entry('hole'), entry('shell', 3), entry('draft', 3), entry('thicken', 3),
  ] },
  { id: 'transform', name: '复制与变换', entries: [
    { id: 'pattern', name: '阵列', icon: '线性阵列', children: ['linear-pattern', 'circular-pattern', 'curve-pattern'], priority: 2 },
    entry('mirror', 2), entry('boolean', 2), entry('split', 3),
    { id: 'transform', name: '变换', icon: '移动', primary: 'translate', children: ['translate', 'transform-rotate', 'transform-scale'] },
  ] },
  { id: 'reference', name: '参考几何', entries: [{ id: 'reference', name: '参考几何', icon: '参考几何', children: ['plane', 'axis', 'point', 'helix', 'fit-spline', 'projected-curve', 'composite-curve', 'intersection-curve'], priority: 2 }] },
  { id: 'surface', name: '曲面工具', entries: [{ id: 'surface', name: '曲面', icon: '边界曲面', children: ['offset-surface', 'boundary-surface', 'fill', 'ruled-surface'], priority: 3 }] },
  { id: 'inspect', name: '查看与辅助', entries: [entry('measure'), entry('section'), { id: 'analysis', name: '分析', icon: '分析', primary: 'geometry-info', children: ['geometry-info', 'mesh-info'], priority: 1 }] },
]
const entryWidth = (item: CadToolbarEntry) => item.children ? item.primary ? 52 : 44 : 36
const paletteWidth = (groups: CadToolbarGroup[]) => groups.reduce((width, group) => width + group.entries.reduce((sum, item) => sum + entryWidth(item) + 2, 0), 0) + Math.max(0, groups.length - 1) * 13 + 50
export function fitCadToolbar(width: number) {
  const groups = cadToolbarGroups.map((group) => ({ ...group, entries: [...group.entries] }))
  const hidden: CadToolbarEntry[] = []
  const candidates = groups.flatMap((group) => group.entries).filter((item) => item.priority).reverse().sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  while (paletteWidth(groups.filter((group) => group.entries.length)) > width && candidates.length) {
    const item = candidates.shift()!
    groups.forEach((group) => { group.entries = group.entries.filter((entry) => entry.id !== item.id) })
    hidden.push(item)
  }
  return { groups: groups.filter((group) => group.entries.length), hidden }
}
export const cadSketchTools = ['直线', '矩形', '圆', '圆弧', '样条', '尺寸', '约束']
