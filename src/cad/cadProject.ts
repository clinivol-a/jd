export type CadObjectKind = 'reference' | 'plate' | 'screws' | 'guide' | 'extrusion'
export type CadObject = {
  id: string; name: string; kind: CadObjectKind; visible: boolean; locked: boolean
  color: string; opacity: number; material: string; position: [number, number, number]
  fillet: number; holes: { diameter: number; depth: number; offset: number }[]; distance?: number; sketchId?: string
}
export type SketchPrimitive = { kind: string; points: [number, number][] }
export type CadSketch = { id: string; name: string; plane: 'XY' | 'XZ' | 'YZ'; primitives: SketchPrimitive[]; constraints: string[] }
export type CadFeature = { id: string; name: string; tool: string; objectId?: string; at: string; parameters: Record<string, string | number> }
export type CadCamera = { position: [number, number, number]; target: [number, number, number]; zoom: number }
export type CadProject = {
  schema: 1; taskId: string; upstreamModelId: string; upstreamVersion: string; version: string
  objects: CadObject[]; sketches: CadSketch[]; features: CadFeature[]; camera?: CadCamera; selectedId: string | null; savedAt: string | null
}
export type CadSnapshot = { id: string; version: string; at: string; reason: 'submitted'; project: CadProject }
export const cadAsset = { modelId: 'MODEL-006-V05', url: '/assets/cad/HumanSkull_Jaw.stl', filename: 'HumanSkull_Jaw.stl', origin: '用户提供的 3Demon STL 展示资源', triangles: 204768 }
const projectKey = (id: string) => `clinivol-cad-project-${id}`
const snapshotKey = (id: string) => `clinivol-cad-snapshots-${id}`
export function newCadId() { return crypto.randomUUID?.() ?? `cad-${Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) => value.toString(16).padStart(2, '0')).join('')}` }
export function initialCadProject(taskId: string, modelId: string, upstreamVersion: string): CadProject {
  const object = (id: string, name: string, kind: CadObjectKind, color: string, visible = true): CadObject => ({ id, name, kind, color, visible, locked: false, opacity: 1, material: '未指定', position: [0, 0, 0], fillet: 2, holes: [] })
  return { schema: 1, taskId, upstreamModelId: modelId, upstreamVersion, version: 'V01', savedAt: null, selectedId: 'plate', sketches: [], features: [], objects: [
    { ...object('jaw', '下颌骨', 'reference', '#dfd1b7'), locked: true, material: '原始 STL 网格' },
    { ...object('plate', '修复板', 'plate', '#688fa9'), material: '钛合金（示例）' },
    { ...object('screws', '螺钉', 'screws', '#99afbf'), material: '钛合金（示例）' },
    { ...object('guide', '导向模板', 'guide', '#d9a35d', false), opacity: .5, material: '树脂（示例）' },
  ] }
}
export function readCadProject(taskId: string, modelId: string, upstreamVersion: string): CadProject {
  try {
    const value = JSON.parse(localStorage.getItem(projectKey(taskId)) ?? 'null') as CadProject | null
    if (value?.schema === 1 && value.taskId === taskId && value.upstreamModelId === modelId && Array.isArray(value.objects) && Array.isArray(value.features) && Array.isArray(value.sketches)) return value
  } catch { /* Keep the stored value intact if it cannot be read. */ }
  return initialCadProject(taskId, modelId, upstreamVersion)
}
export function saveCadProject(project: CadProject): CadProject {
  const previous = localStorage.getItem(projectKey(project.taskId))
  if (previous) {
    const saved = JSON.parse(previous) as CadProject
    if (saved.schema === 1 && saved.savedAt && cadProjectContent(saved) === cadProjectContent(project)) return saved
  }
  const saved = { ...project, savedAt: new Date().toISOString() }
  localStorage.setItem(projectKey(project.taskId), JSON.stringify(saved))
  return saved
}
export function cadProjectContent(project: CadProject) {
  return JSON.stringify({ taskId: project.taskId, upstreamModelId: project.upstreamModelId, objects: project.objects, sketches: project.sketches, features: project.features })
}
export function readCadSnapshots(taskId: string): CadSnapshot[] {
  try { const value = JSON.parse(localStorage.getItem(snapshotKey(taskId)) ?? '[]'); return Array.isArray(value) ? value : [] } catch { return [] }
}
export function nextCadVersion(taskId: string) { return `V${String(readCadSnapshots(taskId).length + 1).padStart(2, '0')}` }
export function snapshotCadSubmission(taskId: string): string {
  const project = JSON.parse(localStorage.getItem(projectKey(taskId)) ?? 'null') as CadProject | null
  if (!project?.savedAt) throw new Error('CAD 工程尚未保存，请返回工作区重试。')
  const snapshots = readCadSnapshots(taskId)
  const version = nextCadVersion(taskId)
  const frozen = { ...project, version }
  const snapshot: CadSnapshot = { id: newCadId(), version, at: new Date().toISOString(), reason: 'submitted', project: frozen }
  // Store the immutable snapshot before updating the current project pointer.
  localStorage.setItem(snapshotKey(taskId), JSON.stringify([...snapshots, snapshot]))
  try { localStorage.setItem(projectKey(taskId), JSON.stringify(frozen)) } catch (error) {
    localStorage.setItem(snapshotKey(taskId), JSON.stringify(snapshots)); throw error
  }
  return version
}
export function restoreCadSnapshot(snapshot: CadSnapshot, current: CadProject) {
  return saveCadProject({ ...structuredClone(snapshot.project), version: current.version })
}
export const cadTools = ['草图', '拉伸', '旋转', '扫掠', '放样', '孔', '圆角', '倒角', '布尔', '阵列', '镜像', '移动', '参考几何', '测量', '截面', '分析', '更多工具'] as const
export type CadTool = typeof cadTools[number]
export type CadMetrics = { bounds: [number, number, number]; area: number; volume: number | null; triangles: number }
export type CadPreview = { tool: string; targetId: string; distance: number; diameter: number; depth: number; radius: number; direction: number; offset: number; sketch?: CadSketch }
