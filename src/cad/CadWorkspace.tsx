/* CAD workspace: extend CliniVol's existing Operate surface. The shared Header
 * stays mounted; a single tool row, compact model tree and contextual inspector
 * frame a real, white WebGL viewport. Selection links all three areas. Confirmed
 * edits persist locally; immutable review snapshots use the existing task flow.
 * The supplied reference fixes this composition; no new visual identity. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Button, Dialog, Dropdown, Input, InputNumber, MessagePlugin, Select, Slider, Tooltip } from 'tdesign-react'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, ListDemandIcon, SearchIcon } from 'tdesign-icons-react'
import WorkspaceTaskActions from '../WorkspaceTaskActions'
import ObjectStateIcon from '../ObjectStateIcon'
import { useCadPanels } from './useCadPanels'
import { useCadHistory } from './useCadHistory'
import CadContextMenu from './CadContextMenu'
import type { CadMenuAction, CadMenuTarget } from './CadContextMenu'
import CadViewControls from './CadViewControls'
import CadWindowZoom from './CadWindowZoom'
import type { CadShading } from './cadViewGeometry'
import type { CadViewState } from './CadScene'
import { CadScene } from './CadScene'
import { transformCadObject } from './cadTransforms'
import { cadAsset, newCadId, readCadProject, saveCadProject, cadProjectContent } from './cadProject'
import CadIcon from './CadIcon'
import CadToolbarTools from './CadToolbarTools'
import type { CadMetrics, CadObject, CadPreview, CadSketch } from './cadProject'
import './cad.css'

type CadTask = { id: string; title: string; patient: string; orderNo: string; status: string; approvedModel?: { id: string; name: string; version: string } }
type ReviewSummary = { id: string; title: string; unread: boolean; position: { x: number; y: number } }
type ReviewBridge = { selectedId: string | null; onSelect: (id: string) => void; onClose: () => void; onSubmit: () => void; syncState: 'synced' | 'syncing' | 'failed'; syncedAt: string; onQueueSync: () => void }
type Props = { task: CadTask; onBack: () => void; onSubmit: () => void; onSubmitSalesperson: () => void; comments: ReviewSummary[]; reviewFocus: { taskId: string; commentId?: string } | null; onReviewFocusConsumed: () => void; renderReviewPanel: (bridge: ReviewBridge) => ReactNode }
const featureTools = new Set(['拉伸', '孔', '圆角', '移动', '旋转对象', '缩放对象', '镜像'])
const formatTime = (at: string | null) => at ? new Date(at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''
function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="cad-field" role="group" aria-label={label}><span>{label}</span><div>{children}</div></div> }
function PropertyGroup({ title, children }: { title: string; children: ReactNode }) { return <details className="cad-property-group" open><summary>{title}<ChevronDownIcon size={15} /></summary><div>{children}</div></details> }
function CadCommandPanel({ title, onCancel, children, actions }: { title: string; onCancel: () => void; children: ReactNode; actions: ReactNode }) {
  return <section className="cad-command-panel" role="dialog" aria-label={`${title}操作`}><header className="cad-panel-header"><h2>{title}</h2><button aria-label={`取消${title}`} onClick={onCancel}><CloseIcon size={16} /></button></header><div className="cad-command-scroll">{children}</div><footer className="cad-tool-footer">{actions}</footer></section>
}

export default function CadWorkspace({ task, onSubmit, onSubmitSalesperson, comments, reviewFocus, onReviewFocusConsumed, renderReviewPanel }: Props) {
  const history = useCadHistory(() => readCadProject(task.id, task.approvedModel!.id, task.approvedModel!.version))
  const project = history.project; const setProject = history.commit
  const [selectedId, setSelectedId] = useState<string | null>(project.selectedId)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [navMode, setNavMode] = useState('旋转')
  const [view, setView] = useState<CadViewState>({ projection: 'orthographic', edges: false, hasPrevious: false, cubeMatrix: 'rotateX(-20deg) rotateY(35deg)', cubeQuaternion: [0,0,0,1], shading: 'shaded', highQuality: false, boundary: false, normalToSketch: true })
  const [viewPrefs, setViewPrefs] = useState<{ objects: Record<string, Partial<Pick<CadObject, 'color' | 'opacity' | 'visible'>>>; planes: boolean; planeVisibility?: Partial<Record<string, boolean>> }>(() => {
    try { const saved = JSON.parse(localStorage.getItem(`clinivol-cad-view-${task.id}`) ?? 'null'); if (saved && saved.objects && typeof saved.planes === 'boolean') return saved } catch { /* Keep project data separate. */ }
    return { objects: {}, planes: false }
  })
  const [windowZoom, setWindowZoom] = useState(false)
  const [context, setContext] = useState<CadMenuTarget | null>(null)
  const [rename, setRename] = useState<{ id: string; value: string } | null>(null)
  const [treeInfo, setTreeInfo] = useState<{ title: string; fields: [string, string][] } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const contextHandlerRef = useRef<(id: string | null, x: number, y: number) => void>(() => {})
  const shortcutRef = useRef<(event: KeyboardEvent) => void>(() => {})
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'failed'>(project.savedAt ? 'saved' : 'saving')
  const [savedAt, setSavedAt] = useState(project.savedAt)
  const panels = useCadPanels(Boolean(selectedId))
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [selectedComment, setSelectedComment] = useState<string | null>(comments[0]?.id ?? null)
  const [sketchDraft, setSketchDraft] = useState<CadSketch | null>(null)
  const [sketchTool, setSketchTool] = useState('矩形')
  const [pendingPoints, setPendingPoints] = useState<[number, number][]>([])
  const [constraint, setConstraint] = useState('水平')
  const [dimension, setDimension] = useState(20)
  const [params, setParams] = useState({ axis: 'Z', factor: 1, spacing: 15, distance: 8, direction: 1, diameter: 2.4, depth: 5, radius: 2, offset: 9, targetId: 'plate', sketchId: '', x: 0, y: 0, z: 0, angle: 90, count: 3 })
  const displayProject = useMemo(() => ({ ...project, objects: project.objects.map((object) => ({ ...(['旋转对象', '缩放对象', '镜像'].includes(activeTool ?? '') && object.id === params.targetId && object.kind !== 'reference' && !object.locked ? transformCadObject(object, activeTool!, params.axis, params.angle, params.factor) : object), ...viewPrefs.objects[object.id] })) }), [project, viewPrefs.objects, activeTool, params.targetId, params.axis, params.angle, params.factor])
  const [sectionOffset, setSectionOffset] = useState(0)
  const [sectionAxis, setSectionAxis] = useState<'X' | 'Y' | 'Z'>('X')
  const [sectionDirection, setSectionDirection] = useState(1)
  const extrudeReturnRef = useRef<typeof params | null>(null)
  const [metrics, setMetrics] = useState<CadMetrics | null>(null)
  const [scaleWidth, setScaleWidth] = useState(100)
  const viewportRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<CadScene | null>(null)
  const projectRef = useRef(project)
  const savedContentRef = useRef(project.savedAt ? cadProjectContent(project) : null)
  const sketchHandlerRef = useRef<(point: [number, number]) => void>(() => {})
  const selectHandlerRef = useRef<(id: string | null) => void>(() => {})
  const cancelHandlerRef = useRef<() => void>(() => {})
  const readOnly = task.status === '待审核' || task.status === '已完成'
  const selected = displayProject.objects.find((object) => object.id === selectedId)
  const editable = !readOnly && selected && !selected.locked && selected.kind !== 'reference'
  const content = cadProjectContent(project)
  useEffect(() => { setTreeInfo(null); if (selectedId && !project.objects.some((object) => object.id === selectedId)) setSelectedId(null) }, [project])
  const modelCommand = Boolean(activeTool && !['测量', '分析', '截面', '视图显示设置'].includes(activeTool))
  projectRef.current = project
  const persist = useCallback(() => {
    if (savedContentRef.current === cadProjectContent(projectRef.current)) return true
    try { const saved = saveCadProject(projectRef.current); savedContentRef.current = cadProjectContent(saved); projectRef.current = saved; setSavedAt(saved.savedAt); setSaveState('saved'); return true }
    catch { setSaveState('failed'); return false }
  }, [])
  useEffect(() => {
    if (content === savedContentRef.current) { setSaveState('saved'); return }
    setSaveState('saving'); const timer = window.setTimeout(persist, 1000); return () => window.clearTimeout(timer)
  }, [content, persist])
  useEffect(() => () => { if (savedContentRef.current !== cadProjectContent(projectRef.current)) { try { saveCadProject(projectRef.current) } catch { /* Preserve the previous successful save. */ } } }, [])
  useEffect(() => { if (readOnly) { setActiveTool(null); setSketchDraft(null); setPendingPoints([]); setContext(null); setRename(null); extrudeReturnRef.current = null; const saved = readCadProject(task.id, task.approvedModel!.id, task.approvedModel!.version); savedContentRef.current = cadProjectContent(saved); history.reset(saved) } }, [readOnly, task.id, task.approvedModel])
  useEffect(() => { if (reviewFocus) { setCommentsOpen(true); setSelectedComment(reviewFocus.commentId ?? comments[0]?.id ?? null); onReviewFocusConsumed() } }, [reviewFocus, comments, onReviewFocusConsumed])
  useEffect(() => {
    if (!viewportRef.current) return
    setLoadState('loading'); setLoadError('')
    if (task.approvedModel?.id !== cadAsset.modelId) { setLoadError('当前任务尚未关联可加载的模型资源，请联系项目负责人。'); setLoadState('error'); return }
    try {
      const scene = new CadScene(viewportRef.current, {
        onLoad: () => { setLoadState('ready'); setScaleWidth(scene.getScale()); setMetrics(scene.metrics(projectRef.current.selectedId ?? 'jaw')) },
        onError: (message) => { setLoadError(message); setLoadState('error') },
        onView: setView, onContext: (id, x, y) => contextHandlerRef.current(id, x, y),
        onSelect: (id) => selectHandlerRef.current(id),
        onSketchPoint: (point) => sketchHandlerRef.current(point),
        onCamera: () => { if (sceneRef.current) setScaleWidth(sceneRef.current.getScale()) },
      })
      sceneRef.current = scene; scene.update(projectRef.current, projectRef.current.selectedId)
      return () => { sceneRef.current = null; scene.dispose() }
    } catch { setLoadError('三维视窗无法启动，请确认浏览器支持 WebGL 后重试。'); setLoadState('error') }
  }, [loadAttempt])
  const preview = useMemo<CadPreview | undefined>(() => {
    const sketch = project.sketches.find((item) => item.id === params.sketchId && item.primitives.some((primitive) => ['矩形', '圆'].includes(primitive.kind)))
    if (!activeTool || !['拉伸', '孔', '圆角'].includes(activeTool) || activeTool === '拉伸' && !sketch) return undefined
    return { tool: activeTool, ...params, sketch }
  }, [activeTool, params, project.sketches])
  useEffect(() => {
    const draft = sketchDraft ? { ...sketchDraft, primitives: [...sketchDraft.primitives, ...(pendingPoints.length ? [{ kind: sketchTool, points: pendingPoints }] : [])] } : undefined
    sceneRef.current?.update(displayProject, selectedId, preview, draft)
    setMetrics(selectedId ? sceneRef.current?.metrics(selectedId) ?? null : null)
  }, [displayProject, selectedId, preview, sketchDraft, pendingPoints, sketchTool, loadState])
  useEffect(() => { sceneRef.current?.setSketchPlane(sketchDraft?.plane ?? null) }, [sketchDraft?.plane])
  useEffect(() => { sceneRef.current?.setSection(activeTool === '截面', sectionOffset, sectionAxis, sectionDirection) }, [activeTool, sectionOffset, sectionAxis, sectionDirection, loadState])
  useEffect(() => {
    if (selected && !selected.locked && (activeTool === '移动' || ['孔', '圆角'].includes(activeTool ?? '') && selected.kind === 'plate')) setParams((value) => value.targetId === selected.id ? value : { ...value, targetId: selected.id, x: selected.position[0], y: selected.position[1], z: selected.position[2] })
  }, [activeTool, selected])
  useEffect(() => {
    const key = (event: KeyboardEvent) => shortcutRef.current(event)
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key)
  }, [])
  useEffect(() => {
    try { localStorage.setItem(`clinivol-cad-view-${task.id}`, JSON.stringify(viewPrefs)) } catch { /* UI settings stay usable in memory. */ }
    sceneRef.current?.setReferencePlanes(viewPrefs.planes, viewPrefs.planeVisibility)
  }, [viewPrefs, task.id, loadState])
  sketchHandlerRef.current = (point) => {
    if (!sketchDraft || ['尺寸', '约束'].includes(sketchTool)) return
    const points = [...pendingPoints, point]; const required = ['圆弧', '样条'].includes(sketchTool) ? 3 : 2
    if (points.length >= required) { setSketchDraft((draft) => draft ? { ...draft, primitives: [...draft.primitives, { kind: sketchTool, points }] } : draft); setPendingPoints([]) } else setPendingPoints(points)
  }
  const selectObject = (id: string | null) => {
    setSelectedId(id); setTreeInfo(null)
    if (!activeTool) panels.autoInspect(Boolean(id))
  }
  selectHandlerRef.current = selectObject
  const changeObject = (id: string, changes: Partial<CadObject>) => {
    const object = project.objects.find((item) => item.id === id)
    if (!object) return
    // Reference appearance and read-only browsing are view preferences, never approved engineering data.
    if (object.kind === 'reference' || readOnly) {
      const display = Object.fromEntries(Object.entries(changes).filter(([key]) => ['color', 'opacity', 'visible'].includes(key)))
      if (Object.keys(display).length) setViewPrefs((current) => ({ ...current, objects: { ...current.objects, [id]: { ...current.objects[id], ...display } } }))
      return
    }
    if (object.locked && Object.keys(changes).some((key) => !['visible', 'locked'].includes(key))) return
    setViewPrefs((current) => { const objects = { ...current.objects }; const display = { ...objects[id] }; for (const key of Object.keys(changes)) delete display[key as keyof typeof display]; if (Object.keys(display).length) objects[id] = display; else delete objects[id]; return { ...current, objects } })
    setProject((current) => ({ ...current, objects: current.objects.map((item) => item.id === id ? { ...item, ...changes } : item) }), Object.keys(changes).every((key) => ['name', 'color', 'opacity'].includes(key)) ? `property:${id}:${Object.keys(changes).join(',')}` : undefined)
  }
  const toggleGroup = (id: string) => setCollapsed((value) => value.includes(id) ? value.filter((item) => item !== id) : [...value, id])
  const cancelTool = () => {
    const resume = extrudeReturnRef.current
    extrudeReturnRef.current = null
    setSketchDraft(null); setPendingPoints([])
    if (resume) { setParams(resume); setActiveTool('拉伸') } else setActiveTool(null)
  }
  cancelHandlerRef.current = cancelTool
  const chooseTool = (tool: string) => {
    if (loadState !== 'ready') return
    if (sketchDraft) { void MessagePlugin.info('请先完成或取消当前草图'); return }
    if (readOnly && !['测量', '分析', '截面'].includes(tool)) return
    if (tool !== '草图') extrudeReturnRef.current = null
    setActiveTool(tool)
    const target = selected && !selected.locked && (['孔', '圆角'].includes(tool) ? selected.kind === 'plate' : selected.kind !== 'reference') ? selected.id : 'plate'
    setParams((value) => ({ ...value, targetId: target, sketchId: project.sketches.find((sketch) => sketch.primitives.some((primitive) => ['矩形', '圆'].includes(primitive.kind)))?.id ?? '', x: selected?.position[0] ?? 0, y: selected?.position[1] ?? 0, z: selected?.position[2] ?? 0 }))
  }
  const finishSketch = () => {
    if (!sketchDraft?.primitives.length) { void MessagePlugin.warning('请先在视窗中绘制草图'); return }
    const sketch = { ...sketchDraft, name: `草图${project.sketches.length + 1}` }
    const resume = extrudeReturnRef.current
    if (resume && !sketch.primitives.some((primitive) => ['矩形', '圆'].includes(primitive.kind))) { void MessagePlugin.warning('请绘制矩形或圆作为拉伸轮廓'); return }
    setProject((current) => ({ ...current, sketches: [...current.sketches, sketch], features: [...current.features, { id: newCadId(), name: sketch.name, tool: '草图', at: new Date().toISOString(), parameters: { plane: sketch.plane }, objectId: sketch.id }] })); cancelTool()
    if (resume) setParams({ ...resume, sketchId: sketch.id })
  }
  const confirmFeature = () => {
    if (readOnly || !activeTool || loadState !== 'ready') return
    const target = project.objects.find((object) => object.id === params.targetId)
    if (activeTool === '拉伸' && !project.sketches.some((sketch) => sketch.id === params.sketchId && sketch.primitives.some((primitive) => ['矩形', '圆'].includes(primitive.kind)))) { void MessagePlugin.warning('请选择包含矩形或圆的闭合草图'); return }
    if (activeTool !== '拉伸' && (!target || target.locked)) { void MessagePlugin.warning('请选择可编辑的设计对象'); return }
    if (target?.kind === 'reference') return
    if (['孔', '圆角'].includes(activeTool) && target?.kind !== 'plate') { void MessagePlugin.warning('请选择修复板对象'); return }
    if (['旋转对象', '缩放对象', '镜像'].includes(activeTool) && target) {
      if (!Number.isFinite(params.angle) || !Number.isFinite(params.factor) || params.factor <= 0) { void MessagePlugin.warning('请输入有效的角度和比例'); return }
      setProject((current) => ({ ...current, objects: current.objects.map((object) => object.id === target.id ? transformCadObject(object, activeTool, params.axis, params.angle, params.factor) : object), features: [...current.features, { id: newCadId(), name: `${activeTool}${current.features.filter((item) => item.tool === activeTool).length + 1}`, tool: activeTool, objectId: target.id, at: new Date().toISOString(), parameters: { axis: params.axis, angle: params.angle, factor: params.factor } }] }))
      cancelTool(); return
    }
    const objectId = activeTool === '拉伸' ? newCadId() : params.targetId
    setProject((current) => ({ ...current, selectedId: objectId,
      objects: activeTool === '拉伸' ? [...current.objects, { id: objectId, name: `拉伸实体${current.objects.filter((object) => object.kind === 'extrusion').length + 1}`, kind: 'extrusion', visible: true, locked: false, color: '#7299ad', opacity: 1, material: '未指定', position: [0, 0, 0], fillet: 0, holes: [], distance: params.distance * params.direction, sketchId: params.sketchId }] : current.objects.map((object) => object.id !== objectId ? object : { ...object, ...(activeTool === '孔' ? { holes: [...object.holes, { diameter: params.diameter, depth: params.depth, offset: params.offset }] } : activeTool === '圆角' ? { fillet: params.radius } : { position: [params.x, params.y, params.z] as [number, number, number] }) }),
      features: [...current.features, { id: newCadId(), name: `${activeTool}${current.features.filter((feature) => feature.tool === activeTool).length + 1}`, tool: activeTool, objectId, at: new Date().toISOString(), parameters: activeTool === '拉伸' ? { distance: params.distance, direction: params.direction } : activeTool === '孔' ? { diameter: params.diameter, depth: params.depth, offset: params.offset } : activeTool === '圆角' ? { radius: params.radius } : { x: params.x, y: params.y, z: params.z } }],
    })); setSelectedId(objectId); cancelTool()
  }
  const requestSubmit = () => {
    if (loadState !== 'ready') { void MessagePlugin.warning('请等待参考模型成功加载'); return }
    if (activeTool) { void MessagePlugin.warning('请先完成或取消当前操作'); return }
    if (!persist()) { void MessagePlugin.error('工程保存失败，请重试后再提交'); return }
    onSubmit()
  }
  const closeContext = useCallback(() => { setContext(null); viewportRef.current?.querySelector('canvas')?.focus() }, [])
  const viewAction = (action: string) => {
    const scene = sceneRef.current; if (!scene) return
    if (action === 'fit') { if (!scene.fit()) void MessagePlugin.info('当前没有可见模型') }
    else if (action === 'previous') scene.previousView()
    else if (action === 'projection') scene.setProjection(view.projection === 'orthographic' ? 'perspective' : 'orthographic')
    else if (action === 'edges') scene.setEdges(!view.edges)
    else if (action.startsWith('shading:')) scene.setShading(action.split(':')[1] as CadShading)
    else if (action === 'quality') scene.setHighQuality(!view.highQuality)
    else if (action === 'boundary') scene.setBoundary(!view.boundary)
    else if (action === 'normal') scene.setNormalToSketch(!view.normalToSketch)
    else if (action === 'window') { if (activeTool) { void MessagePlugin.info('请先完成或取消当前操作'); return } setWindowZoom(true) }
    else if (action === 'settings' || action === 'section') { if (activeTool) { void MessagePlugin.info('请先完成或取消当前操作'); return } if (action === 'settings') setActiveTool('视图显示设置'); else chooseTool('截面') }
    else if (action.startsWith('direction:')) scene.setDirection(action.slice(10).split(',').map(Number) as [number,number,number])
    else if (action.startsWith('turn:')) { const [,direction,degrees] = action.split(':'); scene.rotateView(direction as Parameters<CadScene['rotateView']>[0],Number(degrees)) }
    else if (action === 'reset') scene.resetView()
    else scene.setView(action, true, true)
  }
  const inspectTree = (kind: 'sketch' | 'feature', id: string) => {
    if (activeTool) return
    const sketch = project.sketches.find((item) => item.id === id)
    const feature = project.features.find((item) => item.id === id)
    if (kind === 'sketch' && sketch) setTreeInfo({ title: sketch.name, fields: [['类型', '草图'], ['参考平面', sketch.plane], ['图元数量', String(sketch.primitives.length)]] })
    if (kind === 'feature' && feature) setTreeInfo({ title: feature.name, fields: [['类型', feature.tool], ...Object.entries(feature.parameters).map(([key, value]) => [key, String(value)] as [string, string])] })
    panels.toggle('right', true)
  }
  const openContext = (target: CadMenuTarget) => {
    if (activeTool || loadState !== 'ready') return
    if (target.kind === 'object') { setSelectedId(target.id); setTreeInfo(null) }
    setContext(target)
  }
  contextHandlerRef.current = (id, x, y) => openContext({ id, x, y, kind: id ? 'object' : 'blank', source: 'viewport' })
  const contextObject = displayProject.objects.find((object) => object.id === context?.id)
  const contextEditable = contextObject && contextObject.kind !== 'reference' && !contextObject.locked && !readOnly
  const contextActions: CadMenuAction[] = !context || context.kind === 'blank' ? [
    { id: 'fit', label: '适配全部模型' }, { id: 'reset', label: '恢复默认视角' }, { id: 'previous', label: '上一个视图', disabled: !view.hasPrevious },
    { id: 'projection', label: view.projection === 'orthographic' ? '切换至透视投影' : '切换至正交投影' }, { id: 'showAll', label: '显示所有对象' }, { id: 'settings', label: '视图显示设置' },
  ] : context.kind === 'plane' ? [{ id: 'inspect', label: '查看属性' }, { id: 'planes', label: (viewPrefs.planeVisibility?.[context.id!] ?? viewPrefs.planes) ? '隐藏参考平面' : '显示参考平面' }] : context.kind !== 'object' ? [{ id: 'inspect', label: '查看属性' }] : [
    { id: 'inspect', label: '查看属性' }, { id: 'visibility', label: contextObject?.visible ? '隐藏' : '显示' }, { id: 'isolate', label: '隔离显示' },
    { id: 'transparent', label: '使之透明' }, { id: 'fitSelected', label: '缩放至选中', disabled: !contextObject?.visible }, { id: 'restoreDisplay', label: '恢复显示状态' },
    ...(contextObject?.kind === 'reference' ? [] : [{ id: 'appearance', label: '修改外观', disabled: !contextEditable }, { id: 'rename', label: '重命名', disabled: !contextEditable }, { id: 'delete', label: '删除', disabled: !contextEditable, danger: true }, ...(contextEditable ? [{ id: 'move', label: '移动' }, ...(contextObject.kind === 'plate' ? [{ id: 'hole', label: '孔' }, { id: 'fillet', label: '圆角' }] : [])] : [])]),
  ]
  const deleteObject = (id: string | null) => {
    const object = project.objects.find((item) => item.id === id)
    if (!object || object.kind === 'reference' || object.locked || readOnly || activeTool) return
    setProject((current) => ({ ...current, objects: current.objects.filter((item) => item.id !== id), features: current.features.filter((item) => item.objectId !== id) }))
    if (selectedId === id) { setSelectedId(null); panels.autoInspect(false) }
    setViewPrefs((current) => { const objects = { ...current.objects }; delete objects[id!]; return { ...current, objects } })
  }
  const runContext = (action: string) => {
    if (action === 'inspect' || action === 'appearance') {
      if (context?.kind === 'object' && contextObject) { selectObject(contextObject.id); panels.toggle('right', true) }
      else if (context?.kind === 'sketch' || context?.kind === 'feature') inspectTree(context.kind, context.id!)
      else if (context?.kind === 'plane') { setTreeInfo({ title: `${context.id} 参考平面`, fields: [['类型', '默认参考几何'], ['平面', context.id!]] }); panels.toggle('right', true) }
    } else if (action === 'showAll') setViewPrefs((current) => ({ ...current, objects: Object.fromEntries(project.objects.map((object) => [object.id, { ...current.objects[object.id], visible: true }])) }))
    else if (action === 'planes' && context?.id) setViewPrefs((current) => ({ ...current, planeVisibility: { ...current.planeVisibility, [context.id!]: !(current.planeVisibility?.[context.id!] ?? current.planes) } }))
    else if (action === 'settings') { setActiveTool('视图显示设置') }
    else if (contextObject && action === 'visibility') changeObject(contextObject.id, { visible: !contextObject.visible })
    else if (contextObject && action === 'isolate') setViewPrefs((current) => ({ ...current, objects: Object.fromEntries(project.objects.map((object) => [object.id, { ...current.objects[object.id], visible: object.id === contextObject.id }])) }))
    else if (contextObject && action === 'transparent') changeObject(contextObject.id, { opacity: .3 })
    else if (action === 'restoreDisplay') setViewPrefs((current) => ({ ...current, objects: {} }))
    else if (contextObject && action === 'fitSelected') sceneRef.current?.fit(contextObject.id)
    else if (contextEditable && contextObject && action === 'rename') setRename({ id: contextObject.id, value: contextObject.name })
    else if (action === 'delete') deleteObject(contextObject?.id ?? null)
    else if (action === 'move') chooseTool('移动')
    else if (action === 'hole') chooseTool('孔')
    else if (action === 'fillet') chooseTool('圆角')
    else viewAction(action)
  }
  shortcutRef.current = (event) => {
    if (!rootRef.current?.getClientRects().length || rename || event.defaultPrevented) return
    const target = event.target as HTMLElement | null
    if (target?.closest('input, textarea, select, [contenteditable="true"], [role="combobox"], [role="menu"], .cad-tool-menu') || target?.closest('[role="dialog"]') && !rootRef.current?.contains(target)) return
    const mod = event.ctrlKey || event.metaKey
    if (mod && event.key.toLowerCase() === 's') { event.preventDefault(); persist(); return }
    if (event.key === 'Escape') { if (windowZoom) { setWindowZoom(false); return } if (context) { event.preventDefault(); closeContext() } else cancelTool(); return }
    if (mod && ['z', 'y'].includes(event.key.toLowerCase())) {
      event.preventDefault(); if (readOnly) return
      if (modelCommand) { cancelTool(); return }
      if (event.key.toLowerCase() === 'y' || event.shiftKey) history.redo(); else history.undo()
    } else if (!mod && !event.altKey && event.key.toLowerCase() === 'f') { event.preventDefault(); sceneRef.current?.fit(selectedId ?? undefined) }
    else if (!mod && event.key === 'Delete') { event.preventDefault(); deleteObject(selectedId) }
  }
  const treeRows = (objects: CadObject[]) => objects.filter((object) => !search || object.name.toLowerCase().includes(search.toLowerCase())).map((object) => <div key={object.id} className={`cad-tree-row ${selectedId === object.id ? 'cad-tree-selected' : ''}`} onContextMenu={(event) => { event.preventDefault(); openContext({ id: object.id, kind: 'object', source: 'tree', x: event.clientX, y: event.clientY }) }}>
    <button className="cad-tree-select" onClick={() => selectObject(object.id)}><CadIcon name="立方体" size={17} /><span>{object.name}</span></button>
    <span className="cad-tree-actions"><Tooltip content={object.visible ? '隐藏对象' : '显示对象'}><button className={!object.visible ? 'cad-persistent' : ''} aria-label={`${object.visible ? '隐藏' : '显示'}${object.name}`} onClick={() => changeObject(object.id, { visible: !object.visible })}><ObjectStateIcon kind="visibility" active={object.visible} /></button></Tooltip><Tooltip content={object.kind === 'reference' ? '上游批准模型只读' : object.locked ? '解锁对象' : '锁定对象'}><button className={object.locked ? 'cad-persistent' : ''} aria-label={`${object.locked ? '解锁' : '锁定'}${object.name}`} onClick={() => changeObject(object.id, { locked: !object.locked })} disabled={readOnly || object.kind === 'reference'}><ObjectStateIcon kind="lock" active={object.locked} /></button></Tooltip></span>
  </div>)
  const metricRows = metrics ? <dl className="cad-values"><div><dt>体积</dt><dd>{metrics.volume === null ? '—' : `${metrics.volume.toLocaleString('zh-CN', { maximumFractionDigits: 1 })} mm³`}</dd></div><div><dt>表面积</dt><dd>{metrics.area.toLocaleString('zh-CN', { maximumFractionDigits: 1 })} mm²</dd></div><div><dt>包围盒尺寸</dt><dd>{metrics.bounds.map((value) => value.toFixed(1)).join(' × ')} mm</dd></div><div><dt>三角面</dt><dd>{metrics.triangles.toLocaleString('zh-CN')}</dd></div></dl> : <p className="cad-muted">请选择可见的模型对象</p>
  const commandParameters = <>{activeTool === '草图' ? <PropertyGroup title={sketchDraft ? '草图编辑' : '选择草图平面'}>{!sketchDraft ? <><p className="cad-muted">选择一个参考平面开始绘制</p><div className="cad-plane-options">{(['XY', 'XZ', 'YZ'] as const).map((plane) => <Button key={plane} variant="outline" onClick={() => setSketchDraft({ id: newCadId(), name: '', plane, primitives: [], constraints: [] })}>{plane} 平面</Button>)}</div></> : <><dl className="cad-values"><div><dt>参考平面</dt><dd>{sketchDraft.plane}</dd></div><div><dt>已绘制图元</dt><dd>{sketchDraft.primitives.length}</dd></div></dl>{sketchTool === '尺寸' && <><Field label="尺寸 / mm"><InputNumber min={.1} max={150} value={dimension} onChange={(value) => setDimension(Number(value))} /></Field><Button variant="outline" disabled={!sketchDraft.primitives.length} onClick={() => { setSketchDraft((draft) => draft ? { ...draft, constraints: [...draft.constraints, `尺寸 ${dimension} mm`] } : draft); void MessagePlugin.info('尺寸标注已记录') }}>添加尺寸标注</Button></>}{sketchTool === '约束' && <><Field label="约束类型"><Select value={constraint} onChange={(value) => setConstraint(String(value))} options={['水平', '垂直', '重合'].map((value) => ({ label: value, value }))} /></Field><Button variant="outline" disabled={!sketchDraft.primitives.length} onClick={() => setSketchDraft((draft) => draft ? { ...draft, constraints: [...draft.constraints, constraint] } : draft)}>记录约束</Button></>}{sketchDraft.constraints.map((value, i) => <p className="cad-muted" key={i}>{value}</p>)}<Button variant="text" disabled={!sketchDraft.primitives.length} onClick={() => setSketchDraft((draft) => draft ? { ...draft, primitives: draft.primitives.slice(0, -1) } : draft)}>撤销最后一个图元</Button></>}</PropertyGroup>
          : activeTool === '拉伸' ? <PropertyGroup title="拉伸参数"><Field label="草图轮廓"><Select value={params.sketchId} placeholder="选择闭合草图" options={project.sketches.filter((sketch) => sketch.primitives.some((primitive) => ['矩形', '圆'].includes(primitive.kind))).map((sketch) => ({ label: sketch.name, value: sketch.id }))} onChange={(value) => setParams((p) => ({ ...p, sketchId: String(value) }))} />{!project.sketches.some((sketch) => sketch.primitives.some((primitive) => ['矩形', '圆'].includes(primitive.kind))) && <Button className="cad-profile-action" variant="text" theme="primary" onClick={() => { extrudeReturnRef.current = { ...params }; chooseTool('草图') }}>创建草图</Button>}</Field><Field label="距离 / mm"><InputNumber min={.1} max={80} value={params.distance} onChange={(value) => setParams((p) => ({ ...p, distance: Number(value) }))} /></Field><Field label="方向"><Select value={params.direction} options={[{ label: '正向', value: 1 }, { label: '反向', value: -1 }]} onChange={(value) => setParams((p) => ({ ...p, direction: Number(value) }))} /></Field><p className="cad-muted">绿色半透明几何体为当前参数预览</p></PropertyGroup>
          : activeTool === '孔' || activeTool === '圆角' ? <PropertyGroup title={`${activeTool}参数`}><Field label="目标对象"><Select value={params.targetId} options={project.objects.filter((object) => object.kind === 'plate' && !object.locked).map((object) => ({ label: object.name, value: object.id }))} onChange={(value) => setParams((p) => ({ ...p, targetId: String(value) }))} /></Field>{activeTool === '孔' ? <><Field label="孔径 / mm"><InputNumber min={.5} max={6} step={.1} value={params.diameter} onChange={(value) => setParams((p) => ({ ...p, diameter: Number(value) }))} /></Field><Field label="深度 / mm"><InputNumber min={.5} max={12} step={.5} value={params.depth} onChange={(value) => setParams((p) => ({ ...p, depth: Number(value) }))} /></Field><Field label="位置偏移 / mm"><InputNumber min={-60} max={60} value={params.offset} onChange={(value) => setParams((p) => ({ ...p, offset: Number(value) }))} /></Field><p className="cad-muted">预览在修复板上增加一个孔口；网格示意按贯穿处理</p></> : <><Field label="半径 / mm"><InputNumber min={.3} max={3.6} step={.1} value={params.radius} onChange={(value) => setParams((p) => ({ ...p, radius: Number(value) }))} /></Field><p className="cad-muted">预览修复板端部圆角</p></>}</PropertyGroup>
          : ['旋转对象', '缩放对象', '镜像'].includes(activeTool ?? '') ? <PropertyGroup title={`${activeTool}参数`}><Field label="目标对象"><Select value={params.targetId} options={project.objects.filter((object) => !object.locked && object.kind !== 'reference').map((object) => ({ label: object.name, value: object.id }))} onChange={(value) => setParams((current) => ({ ...current, targetId: String(value) }))} /></Field>{activeTool !== '缩放对象' && <Field label={activeTool === '镜像' ? '镜像法向' : '旋转轴'}><Select value={params.axis} options={['X', 'Y', 'Z'].map((axis) => ({ label: axis, value: axis }))} onChange={(value) => setParams((current) => ({ ...current, axis: String(value) }))} /></Field>}{activeTool === '旋转对象' && <Field label="角度 / °"><InputNumber min={-360} max={360} value={params.angle} onChange={(value) => setParams((current) => ({ ...current, angle: Number(value) }))} /></Field>}{activeTool === '缩放对象' && <Field label="统一比例"><InputNumber min={.1} max={10} step={.1} value={params.factor} onChange={(value) => setParams((current) => ({ ...current, factor: Number(value) }))} /></Field>}<p className="cad-muted">视窗实时预览，确认后写入工程；取消恢复原对象</p></PropertyGroup>
          : activeTool === '移动' ? <PropertyGroup title="移动设计对象"><Field label="目标对象"><Select value={params.targetId} onChange={(value) => setParams((p) => ({ ...p, targetId: String(value) }))} options={project.objects.filter((object) => !object.locked).map((object) => ({ label: object.name, value: object.id }))} /></Field>{(['x', 'y', 'z'] as const).map((axis) => <Field label={`${axis.toUpperCase()} / mm`} key={axis}><InputNumber value={params[axis]} min={-100} max={100} onChange={(value) => setParams((p) => ({ ...p, [axis]: Number(value) }))} /></Field>)}</PropertyGroup>
          : activeTool === '测量' || activeTool === '分析' ? <PropertyGroup title={activeTool === '测量' ? '对象几何测量' : '网格几何信息'}>{metricRows}<p className="cad-muted">由当前网格计算，单位按 mm 解释</p><Button variant="text" onClick={() => setSelectedId(null)}>清除选择</Button></PropertyGroup>
          : activeTool === '视图显示设置' ? <PropertyGroup title="显示选项"><p className="cad-muted">显示偏好仅影响当前视窗，不改变模型或工程数据。</p><div className="cad-view-setting-actions"><Button variant="outline" onClick={() => viewAction('quality')}>{view.highQuality ? '关闭高质量视图' : '启用高质量视图'}</Button><Button variant="outline" onClick={() => viewAction('boundary')}>{view.boundary ? '隐藏开放边界' : '亮显开放边界'}</Button><Button variant="outline" onClick={() => viewAction('projection')}>{view.projection === 'orthographic' ? '切换至透视投影' : '切换至正交投影'}</Button><Button variant="outline" onClick={() => viewAction('edges')}>{view.edges ? '隐藏边线' : '显示边线'}</Button><Button variant="outline" onClick={() => setViewPrefs((current) => ({ ...current, planes: !current.planes, planeVisibility: {} }))}>{viewPrefs.planes ? '隐藏参考平面' : '显示参考平面'}</Button><Button variant="text" onClick={() => setViewPrefs({ objects: {}, planes: false })}>恢复显示偏好</Button></div></PropertyGroup>
          : activeTool === '截面' ? <PropertyGroup title="截面显示"><Field label="剖切平面"><Select value={sectionAxis} options={[{ label: 'YZ（X 轴）', value: 'X' }, { label: 'XZ（Y 轴）', value: 'Y' }, { label: 'XY（Z 轴）', value: 'Z' }]} onChange={(value) => setSectionAxis(value as 'X' | 'Y' | 'Z')} /></Field><Field label="剖切位置"><InputNumber aria-label="剖切位置" min={-100} max={100} value={sectionOffset} onChange={(value) => setSectionOffset(Number(value))} /></Field><Field label="剖切方向"><Select value={sectionDirection} options={[{ label: '正向', value: 1 }, { label: '反向', value: -1 }]} onChange={(value) => setSectionDirection(Number(value))} /></Field><p className="cad-muted">仅影响视图显示，原始模型保持不变</p><Button variant="outline" onClick={() => { setSectionOffset(0); setSectionAxis('X'); setSectionDirection(1) }}>重置截面</Button></PropertyGroup> : null}</>
  const objectProperties = (treeInfo ? <PropertyGroup title={treeInfo.title}><dl className="cad-values">{treeInfo.fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></PropertyGroup> : selected ? <><PropertyGroup title="基本信息"><Field label="名称"><Input value={selected.name} disabled={!editable} onChange={(value) => changeObject(selected.id, { name: String(value) })} /></Field><Field label="类型"><span>{selected.kind === 'reference' ? '参考网格 · 只读' : '设计实体'}</span></Field><Field label="所属组件"><span>{selected.kind === 'reference' ? '参考模型' : '设计模型'}</span></Field><Field label="可见性"><Select value={selected.visible ? 'show' : 'hide'} options={[{ label: '显示', value: 'show' }, { label: '隐藏', value: 'hide' }]} onChange={(value) => changeObject(selected.id, { visible: value === 'show' })} /></Field><Field label="颜色"><span className="cad-color-input"><input aria-label="对象颜色" type="color" value={selected.color} disabled={selected.kind !== 'reference' && !editable} onChange={(event) => changeObject(selected.id, { color: event.target.value })} /><span>{selected.color.toUpperCase()}</span></span></Field><Field label="透明度"><Slider disabled={selected.kind !== 'reference' && !editable} value={Math.round((1 - selected.opacity) * 100)} min={0} max={95} onChange={(value) => changeObject(selected.id, { opacity: 1 - Number(value) / 100 })} /></Field></PropertyGroup><PropertyGroup title="几何信息">{metricRows}{selected.kind === 'reference' && <><p className="cad-muted">{cadAsset.filename}</p><p className="cad-muted">{cadAsset.origin}</p><p className="cad-muted">展示资产映射 · 原始参考只读</p></>}</PropertyGroup><PropertyGroup title="材质"><Field label="材料"><Select value={selected.material} disabled={!editable} onChange={(value) => changeObject(selected.id, { material: String(value) })} options={['未指定', '钛合金（示例）', '树脂（示例）', '原始 STL 网格'].map((value) => ({ label: value, value }))} /></Field><dl className="cad-values"><div><dt>密度</dt><dd>未指定</dd></div><div><dt>表面处理</dt><dd>未指定</dd></div></dl></PropertyGroup><PropertyGroup title="工艺参数"><dl className="cad-values"><div><dt>制造方式</dt><dd>未指定</dd></div><div><dt>最小厚度</dt><dd>未校核</dd></div><div><dt>最小孔径</dt><dd>未校核</dd></div><div><dt>推荐螺钉</dt><dd>未指定</dd></div></dl></PropertyGroup></> : <div className="cad-inspector-empty"><CadIcon name="立方体" size={30} /><p>选择对象以查看属性</p><span>也可从上方工具栏开始操作</span></div>)
  const toolActions = activeTool && <>{featureTools.has(activeTool) ? <><Button variant="outline" onClick={cancelTool}>取消</Button><Button theme="primary" disabled={readOnly || (activeTool === '拉伸' && !params.sketchId)} onClick={confirmFeature}>确认{activeTool}</Button></> : activeTool === '草图' && sketchDraft ? <><Button variant="outline" onClick={cancelTool}>取消</Button><Button theme="primary" onClick={finishSketch}>完成草图</Button></> : <Button block variant="outline" onClick={cancelTool}>{activeTool === '测量' || activeTool === '截面' || activeTool === '分析' ? '退出' : '取消操作'}</Button>}</>
  const selectedReview = comments.find((comment) => comment.id === selectedComment)
  return <div ref={rootRef} className="cad-editor" data-task-id={task.id}>
    <div className="cad-toolbar" aria-label="CAD 专业工具栏">
      <CadToolbarTools ready={loadState === 'ready'} readOnly={readOnly} activeTool={activeTool} sketchMode={Boolean(sketchDraft)} sketchTool={sketchTool} canUndo={!readOnly && history.canUndo && !modelCommand} canRedo={!readOnly && history.canRedo && !modelCommand} onUndo={history.undo} onRedo={history.redo} onChoose={chooseTool} onSketchChoose={(tool) => { setSketchTool(tool); setPendingPoints([]) }} />
      {/* Opening a command is UI state: keep the review button mounted and its business availability stable. requestSubmit guards unfinished commands. */}
      <div className="cad-task-actions">{comments.length > 0 && <Button variant="text" theme="primary" onClick={() => setCommentsOpen((value) => !value)}><ListDemandIcon size={18} />审核意见 {comments.length}{comments.some((comment) => comment.unread) && <i className="cad-unread" />}</Button>}<WorkspaceTaskActions submitButtonTag="button" saveState={saveState} savedAt={formatTime(savedAt)} readOnly={readOnly} disabled={readOnly || loadState !== 'ready' || saveState !== 'saved'} disabledReason={readOnly ? '当前成果已锁定' : saveState === 'failed' ? '工程保存失败，请重试' : ''} onSubmit={requestSubmit} onSubmitSalesperson={onSubmitSalesperson} /></div>
    </div>
    <div ref={panels.bodyRef} className={`cad-body ${commentsOpen ? 'cad-body-review' : ''} ${panels.resizing ? 'cad-body-resizing' : ''}`} style={{ '--cad-left-width': `${panels.leftWidth}px`, '--cad-right-width': `${panels.rightWidth}px` } as CSSProperties}>
      <aside className="cad-tree-panel" hidden={!panels.layout.leftOpen}><header className="cad-panel-header"><h2>模型树</h2><Tooltip content="搜索对象"><button aria-label="搜索模型树" onClick={() => setSearchOpen((value) => !value)}><SearchIcon size={17} /></button></Tooltip><Tooltip content="收起模型树"><button aria-label="收起 CAD 模型树" onClick={() => panels.toggle('left', false)}><ChevronLeftIcon size={17} /></button></Tooltip></header>{searchOpen && <div className="cad-tree-search"><Input value={search} onChange={(value) => setSearch(String(value))} placeholder="搜索模型与特征" clearable /></div>}<div className="cad-tree-scroll"><div className="cad-project-label"><CadIcon name="立方体" size={18} /><strong>{task.title}</strong></div>
        {(['参考几何', '参考模型', '设计模型', '草图', '特征历史'] as const).map((group) => <section className="cad-tree-group" key={group}><button className="cad-tree-group-title" onClick={() => toggleGroup(group)} aria-expanded={!collapsed.includes(group)}>{collapsed.includes(group) ? <ChevronRightIcon size={14} /> : <ChevronDownIcon size={14} />}<CadIcon name={group === '草图' ? '草图' : '立方体'} size={17} /><span>{group}</span></button>{!collapsed.includes(group) && <div className="cad-tree-children">{group === '参考几何' ? <>{(['XY', 'XZ', 'YZ'] as const).filter((plane) => !search || plane.toLowerCase().includes(search.toLowerCase())).map((plane) => <button className="cad-tree-history" key={plane} onClick={() => { setTreeInfo({ title: `${plane} 参考平面`, fields: [['类型', '默认参考几何'], ['平面', plane]] }); panels.toggle('right', true) }} onContextMenu={(event) => { event.preventDefault(); openContext({ id: plane, kind: 'plane', source: 'tree', x: event.clientX, y: event.clientY }) }}><CadIcon name="参考几何" size={16} />{plane} 平面</button>)}</> : group === '参考模型' ? <>{treeRows(displayProject.objects.filter((object) => object.kind === 'reference'))}</> : group === '设计模型' ? treeRows(displayProject.objects.filter((object) => object.kind !== 'reference')) : group === '草图' ? project.sketches.length ? project.sketches.filter((sketch) => !search || sketch.name.toLowerCase().includes(search.toLowerCase())).map((sketch) => <button className="cad-tree-history" key={sketch.id} onClick={() => inspectTree('sketch', sketch.id)} onContextMenu={(event) => { event.preventDefault(); openContext({ id: sketch.id, kind: 'sketch', source: 'tree', x: event.clientX, y: event.clientY }) }}><CadIcon name="草图" size={16} /><span>{sketch.name}</span></button>) : <p className="cad-tree-empty">暂无草图</p> : project.features.length ? project.features.filter((feature) => !search || feature.name.toLowerCase().includes(search.toLowerCase())).map((feature) => <button className="cad-tree-history" key={feature.id} onClick={() => inspectTree('feature', feature.id)} onContextMenu={(event) => { event.preventDefault(); openContext({ id: feature.id, kind: 'feature', source: 'tree', x: event.clientX, y: event.clientY }) }}><em>{project.features.indexOf(feature) + 1}</em><CadIcon name={feature.tool} size={16} /><span>{feature.name}</span></button>) : <p className="cad-tree-empty">尚无建模特征</p>}</div>}</section>)}
      </div></aside>
      <div className="panel-resizer cad-panel-resizer cad-resizer-left" hidden={!panels.layout.leftOpen && panels.resizing !== 'left'} {...panels.resizerProps('left')}><span /></div>
      <section className="cad-viewport" aria-label="CAD 设计视窗" data-projection={view.projection} data-edges={view.edges} data-shading={view.shading} data-quality={view.highQuality} data-boundary={view.boundary}><div className="cad-webgl-host" ref={viewportRef} />
        {activeTool && <CadCommandPanel title={activeTool!} onCancel={cancelTool} actions={toolActions}>{commandParameters}</CadCommandPanel>}
        <div className="cad-view-tools">{['缩放', '平移', '旋转'].map((name) => <Tooltip key={name} content={name === '立方体' ? '等轴视图' : name} placement="right"><button className={navMode === name && ['旋转', '平移', '缩放'].includes(name) ? 'cad-view-active' : ''} aria-label={name === '立方体' ? '等轴视图' : name} onClick={() => { if (name === '立方体') sceneRef.current?.setView('等轴'); else if (name === '适应视窗') sceneRef.current?.fit(); else { setNavMode(name); sceneRef.current?.setNavigation(name) } }}><CadIcon name={name} size={20} /></button></Tooltip>)}</div>
        <CadViewControls view={view} taskId={task.id} onAction={viewAction} onCapture={() => sceneRef.current?.captureView()} onRestore={(camera) => sceneRef.current?.recallView(camera)} />
        {windowZoom && <CadWindowZoom onCancel={() => setWindowZoom(false)} onComplete={(rect) => { sceneRef.current?.zoomWindow(rect); setWindowZoom(false) }} />}
        {loadState === 'loading' && <div className="cad-load-overlay"><div className="cad-loading-spinner" /><strong>正在加载下颌骨模型</strong><span>{cadAsset.filename} · 9.8 MB</span></div>}
        {loadState === 'error' && <div className="cad-load-overlay"><strong>模型加载失败</strong><span>{loadError}</span><Button theme="primary" onClick={() => setLoadAttempt((value) => value + 1)}>重试加载</Button></div>}
        {loadState === 'ready' && <div className="cad-canvas-hint">{readOnly ? '成果已锁定 · 可浏览与测量' : sketchDraft ? `${sketchDraft.plane} 平面 · ${sketchTool} · ${pendingPoints.length ? '选择下一点' : '在视窗中选择起点'}` : activeTool ? `${activeTool} · ${modelCommand ? '请在浮动面板设置参数' : '请在浮动面板查看与操作'}` : '左键旋转 / 选择 · 右键平移 · 滚轮缩放'}</div>}
        {selectedReview && commentsOpen && <button className="cad-review-marker" style={{ left: `${selectedReview.position.x}%`, top: `${selectedReview.position.y}%` }} title={selectedReview.title} onClick={() => setSelectedComment(selectedReview.id)}>{String.fromCharCode(65 + comments.indexOf(selectedReview))}</button>}
        <div className="cad-scale" style={{ width: Math.min(220, Math.max(35, scaleWidth)) }}><span>20 mm</span></div>
        {!panels.layout.leftOpen && <Tooltip content="展开模型树"><button className="cad-inspector-handle cad-tree-handle" aria-label="展开 CAD 模型树" onClick={() => panels.toggle('left', true)}><ChevronRightIcon size={16} /></button></Tooltip>}
        {!panels.layout.rightOpen && <Tooltip content="展开属性面板"><button className="cad-inspector-handle" aria-label="展开 CAD 属性面板" onClick={() => panels.toggle('right', true)}><ChevronLeftIcon size={16} /></button></Tooltip>}
      </section>
      <div className="panel-resizer cad-panel-resizer cad-resizer-right" hidden={!panels.layout.rightOpen && panels.resizing !== 'right'} {...panels.resizerProps('right')}><span /></div>
      <aside className="cad-inspector" hidden={!panels.layout.rightOpen}><header className="cad-panel-header"><h2>{treeInfo?.title ?? selected?.name ?? '属性'}</h2><button aria-label="收起 CAD 属性面板" onClick={() => panels.toggle('right', false)}><ChevronRightIcon size={17} /></button></header><div className="cad-inspector-scroll">{objectProperties}</div></aside>
      {commentsOpen && renderReviewPanel({ selectedId: selectedComment, onSelect: setSelectedComment, onClose: () => setCommentsOpen(false), onSubmit: requestSubmit, syncState: saveState === 'saved' ? 'synced' : saveState === 'saving' ? 'syncing' : 'failed', syncedAt: formatTime(savedAt), onQueueSync: persist })}
    </div>
    {context && <CadContextMenu target={context} actions={contextActions} bounds={(context.source === 'viewport' ? viewportRef.current! : panels.bodyRef.current!).getBoundingClientRect()} onRun={runContext} onClose={closeContext} />}
    <Dialog visible={!!rename} header="重命名对象" confirmBtn="保存" cancelBtn="取消" onClose={() => setRename(null)} onConfirm={() => { if (!rename?.value.trim()) { void MessagePlugin.warning('请输入对象名称'); return } changeObject(rename.id, { name: rename.value.trim() }); setRename(null) }}><Input aria-label="对象名称" value={rename?.value ?? ''} maxlength={80} onChange={(value) => setRename((current) => current ? { ...current, value: String(value) } : current)} /></Dialog>
    <footer className="workspace-status cad-status"><span>{loadState === 'loading' ? '模型加载中' : loadState === 'error' ? '模型未就绪' : activeTool ?? '就绪'}</span><span>已选择 {selected ? 1 : 0} 个对象</span><span /><span>单位：mm</span><span>{view.projection === 'orthographic' ? '正交视图' : '透视视图'}</span></footer>
  </div>
}
