/* CAD workspace: extend CliniVol's existing Operate surface. The shared Header
 * stays mounted; a single tool row, compact model tree and contextual inspector
 * frame a real, white WebGL viewport. Selection links all three areas. Confirmed
 * edits persist locally; immutable review snapshots use the existing task flow.
 * The supplied reference fixes this composition; no new visual identity. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Button, Dropdown, Input, InputNumber, MessagePlugin, Select, Slider, Tooltip } from 'tdesign-react'
import { BrowseIcon, BrowseOffIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, ListDemandIcon, LockOnIcon, SearchIcon } from 'tdesign-icons-react'
import WorkspaceTaskActions from '../WorkspaceTaskActions'
import { CadScene } from './CadScene'
import { cadAsset, newCadId, readCadProject, saveCadProject, cadProjectContent } from './cadProject'
import CadIcon from './CadIcon'
import CadToolbarTools from './CadToolbarTools'
import type { CadMetrics, CadObject, CadPreview, CadSketch } from './cadProject'
import './cad.css'

type CadTask = { id: string; title: string; patient: string; orderNo: string; status: string; approvedModel?: { id: string; name: string; version: string } }
type ReviewSummary = { id: string; title: string; unread: boolean; position: { x: number; y: number } }
type ReviewBridge = { selectedId: string | null; onSelect: (id: string) => void; onClose: () => void; onSubmit: () => void; syncState: 'synced' | 'syncing' | 'failed'; syncedAt: string; onQueueSync: () => void }
type Props = { task: CadTask; onBack: () => void; onSubmit: () => void; onSubmitSalesperson: () => void; comments: ReviewSummary[]; reviewFocus: { taskId: string; commentId?: string } | null; onReviewFocusConsumed: () => void; renderReviewPanel: (bridge: ReviewBridge) => ReactNode }
const featureTools = new Set(['拉伸', '孔', '圆角', '移动'])
const formatTime = (at: string | null) => at ? new Date(at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="cad-field"><span>{label}</span><div>{children}</div></label> }
function PropertyGroup({ title, children }: { title: string; children: ReactNode }) { return <details className="cad-property-group" open><summary>{title}<ChevronDownIcon size={15} /></summary><div>{children}</div></details> }
function CadCommandPanel({ title, onCancel, children, actions }: { title: string; onCancel: () => void; children: ReactNode; actions: ReactNode }) {
  return <section className="cad-command-panel" role="dialog" aria-label={`${title}操作`}><header className="cad-panel-header"><h2>{title}</h2><button aria-label={`取消${title}`} onClick={onCancel}><CloseIcon size={16} /></button></header><div className="cad-command-scroll">{children}</div><footer className="cad-tool-footer">{actions}</footer></section>
}

export default function CadWorkspace({ task, onBack, onSubmit, onSubmitSalesperson, comments, reviewFocus, onReviewFocusConsumed, renderReviewPanel }: Props) {
  const [project, setProject] = useState(() => readCadProject(task.id, task.approvedModel!.id, task.approvedModel!.version))
  const [selectedId, setSelectedId] = useState<string | null>(project.selectedId)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [navMode, setNavMode] = useState('旋转')
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'failed'>(project.savedAt ? 'saved' : 'saving')
  const [savedAt, setSavedAt] = useState(project.savedAt)
  const [panelOpen, setPanelOpen] = useState(true)
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
  const [params, setParams] = useState({ distance: 8, direction: 1, diameter: 2.4, depth: 5, radius: 2, offset: 9, targetId: 'plate', sketchId: '', x: 0, y: 0, z: 0, angle: 90, count: 3 })
  const [sectionOffset, setSectionOffset] = useState(0)
  const [metrics, setMetrics] = useState<CadMetrics | null>(null)
  const [scaleWidth, setScaleWidth] = useState(100)
  const viewportRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<CadScene | null>(null)
  const projectRef = useRef(project)
  const savedContentRef = useRef(project.savedAt ? cadProjectContent(project) : null)
  const sketchHandlerRef = useRef<(point: [number, number]) => void>(() => {})
  const readOnly = task.status === '待审核' || task.status === '已完成'
  const selected = project.objects.find((object) => object.id === selectedId)
  const editable = !readOnly && selected && !selected.locked
  const content = cadProjectContent(project)
  const resultTool = activeTool && ['测量', '分析', '截面'].includes(activeTool)
  const modelCommand = activeTool && !resultTool
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
  useEffect(() => { if (readOnly) { const saved = readCadProject(task.id, task.approvedModel!.id, task.approvedModel!.version); savedContentRef.current = cadProjectContent(saved); setProject(saved) } }, [readOnly, task.id, task.approvedModel])
  useEffect(() => { if (reviewFocus) { setCommentsOpen(true); setSelectedComment(reviewFocus.commentId ?? comments[0]?.id ?? null); onReviewFocusConsumed() } }, [reviewFocus, comments, onReviewFocusConsumed])
  useEffect(() => {
    if (!viewportRef.current) return
    setLoadState('loading'); setLoadError('')
    if (task.approvedModel?.id !== cadAsset.modelId) { setLoadError('当前任务尚未关联可加载的模型资源，请联系项目负责人。'); setLoadState('error'); return }
    try {
      const scene = new CadScene(viewportRef.current, {
        onLoad: () => { setLoadState('ready'); setScaleWidth(scene.getScale()); setMetrics(scene.metrics(projectRef.current.selectedId ?? 'jaw')) },
        onError: (message) => { setLoadError(message); setLoadState('error') },
        onSelect: (id) => { setSelectedId(id); if (id) setPanelOpen(true) },
        onSketchPoint: (point) => sketchHandlerRef.current(point),
        onCamera: () => { setScaleWidth(scene.getScale()) },
      })
      sceneRef.current = scene; scene.update(projectRef.current, projectRef.current.selectedId)
      return () => { sceneRef.current = null; scene.dispose() }
    } catch { setLoadError('三维视窗无法启动，请确认浏览器支持 WebGL 后重试。'); setLoadState('error') }
  }, [loadAttempt])
  const preview = useMemo<CadPreview | undefined>(() => activeTool && ['拉伸', '孔', '圆角'].includes(activeTool) ? { tool: activeTool, ...params, sketch: project.sketches.find((sketch) => sketch.id === params.sketchId) } : undefined, [activeTool, params, project.sketches])
  useEffect(() => {
    const draft = sketchDraft ? { ...sketchDraft, primitives: [...sketchDraft.primitives, ...(pendingPoints.length ? [{ kind: sketchTool, points: pendingPoints }] : [])] } : undefined
    sceneRef.current?.update(project, selectedId, preview, draft)
    setMetrics(selectedId ? sceneRef.current?.metrics(selectedId) ?? null : null)
  }, [project, selectedId, preview, sketchDraft, pendingPoints, sketchTool, loadState])
  useEffect(() => { sceneRef.current?.setSketchPlane(sketchDraft?.plane ?? null) }, [sketchDraft?.plane])
  useEffect(() => { sceneRef.current?.setSection(activeTool === '截面', sectionOffset) }, [activeTool, sectionOffset])
  useEffect(() => {
    if (['孔', '圆角'].includes(activeTool ?? '') && selected?.kind === 'plate' && !selected.locked) setParams((value) => value.targetId === selected.id ? value : { ...value, targetId: selected.id })
  }, [activeTool, selected])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); persist() }
      if (event.key === 'Escape') { setActiveTool(null); setSketchDraft(null); setPendingPoints([]) }
    }
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key)
  }, [persist])
  sketchHandlerRef.current = (point) => {
    if (!sketchDraft || ['尺寸', '约束'].includes(sketchTool)) return
    const points = [...pendingPoints, point]; const required = ['圆弧', '样条'].includes(sketchTool) ? 3 : 2
    if (points.length >= required) { setSketchDraft((draft) => draft ? { ...draft, primitives: [...draft.primitives, { kind: sketchTool, points }] } : draft); setPendingPoints([]) } else setPendingPoints(points)
  }
  const selectObject = (id: string) => { setSelectedId(id); setPanelOpen(true) }
  const changeObject = (id: string, changes: Partial<CadObject>) => {
    if (readOnly) return
    setProject((current) => ({ ...current, objects: current.objects.map((object) => object.id === id && (changes.visible !== undefined || changes.locked !== undefined && object.kind !== 'reference' || !object.locked) ? { ...object, ...changes } : object) }))
  }
  const toggleGroup = (id: string) => setCollapsed((value) => value.includes(id) ? value.filter((item) => item !== id) : [...value, id])
  const cancelTool = () => { setActiveTool(null); setSketchDraft(null); setPendingPoints([]) }
  const chooseTool = (tool: string) => {
    if (loadState !== 'ready') return
    if (sketchDraft) { void MessagePlugin.info('请先完成或取消当前草图'); return }
    setActiveTool(tool); setPanelOpen(true)
    const target = selected && !selected.locked && (['孔', '圆角'].includes(tool) ? selected.kind === 'plate' : selected.kind !== 'reference') ? selected.id : 'plate'
    setParams((value) => ({ ...value, targetId: target, sketchId: project.sketches.find((sketch) => sketch.primitives.some((primitive) => ['矩形', '圆'].includes(primitive.kind)))?.id ?? '', x: selected?.position[0] ?? 0, y: selected?.position[1] ?? 0, z: selected?.position[2] ?? 0 }))
  }
  const finishSketch = () => {
    if (!sketchDraft?.primitives.length) { void MessagePlugin.warning('请先在视窗中绘制草图'); return }
    const sketch = { ...sketchDraft, name: `草图${project.sketches.length + 1}` }
    setProject((current) => ({ ...current, sketches: [...current.sketches, sketch], features: [...current.features, { id: newCadId(), name: sketch.name, tool: '草图', at: new Date().toISOString(), parameters: { plane: sketch.plane }, objectId: sketch.id }] })); cancelTool()
  }
  const confirmFeature = () => {
    if (readOnly || !activeTool || loadState !== 'ready') return
    const target = project.objects.find((object) => object.id === params.targetId)
    if (activeTool === '拉伸' && !project.sketches.some((sketch) => sketch.id === params.sketchId && sketch.primitives.some((primitive) => ['矩形', '圆'].includes(primitive.kind)))) { void MessagePlugin.warning('请选择包含矩形或圆的闭合草图'); return }
    if (activeTool !== '拉伸' && (!target || target.locked)) { void MessagePlugin.warning('请选择可编辑的设计对象'); return }
    if (['孔', '圆角'].includes(activeTool) && target?.kind !== 'plate') { void MessagePlugin.warning('请选择修复板对象'); return }
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
  const treeRows = (objects: CadObject[]) => objects.filter((object) => !search || object.name.includes(search)).map((object) => <div key={object.id} className={`cad-tree-row ${selectedId === object.id ? 'cad-tree-selected' : ''}`}>
    <button className="cad-tree-select" onClick={() => selectObject(object.id)}><CadIcon name="立方体" size={17} /><span>{object.name}</span></button>
    <span className="cad-tree-actions"><Tooltip content={object.visible ? '隐藏对象' : '显示对象'}><button className={!object.visible ? 'cad-persistent' : ''} aria-label={`${object.visible ? '隐藏' : '显示'}${object.name}`} onClick={() => changeObject(object.id, { visible: !object.visible })} disabled={readOnly}>{object.visible ? <BrowseIcon size={16} /> : <BrowseOffIcon size={16} />}</button></Tooltip><Tooltip content={object.kind === 'reference' ? '上游批准模型只读' : object.locked ? '解锁对象' : '锁定对象'}><button className={object.locked ? 'cad-persistent' : ''} aria-label={`${object.locked ? '解锁' : '锁定'}${object.name}`} onClick={() => changeObject(object.id, { locked: !object.locked })} disabled={readOnly || object.kind === 'reference'}><LockOnIcon size={15} /></button></Tooltip></span>
  </div>)
  const metricRows = metrics ? <dl className="cad-values"><div><dt>体积</dt><dd>{metrics.volume === null ? '—' : `${metrics.volume.toLocaleString('zh-CN', { maximumFractionDigits: 1 })} mm³`}</dd></div><div><dt>表面积</dt><dd>{metrics.area.toLocaleString('zh-CN', { maximumFractionDigits: 1 })} mm²</dd></div><div><dt>包围盒尺寸</dt><dd>{metrics.bounds.map((value) => value.toFixed(1)).join(' × ')} mm</dd></div><div><dt>三角面</dt><dd>{metrics.triangles.toLocaleString('zh-CN')}</dd></div></dl> : <p className="cad-muted">请选择可见的模型对象</p>
  const commandParameters = <>{activeTool === '草图' ? <PropertyGroup title={sketchDraft ? '草图编辑' : '选择草图平面'}>{!sketchDraft ? <><p className="cad-muted">选择一个参考平面开始绘制</p><div className="cad-plane-options">{(['XY', 'XZ', 'YZ'] as const).map((plane) => <Button key={plane} variant="outline" onClick={() => setSketchDraft({ id: newCadId(), name: '', plane, primitives: [], constraints: [] })}>{plane} 平面</Button>)}</div></> : <><dl className="cad-values"><div><dt>参考平面</dt><dd>{sketchDraft.plane}</dd></div><div><dt>已绘制图元</dt><dd>{sketchDraft.primitives.length}</dd></div></dl>{sketchTool === '尺寸' && <><Field label="尺寸 / mm"><InputNumber min={.1} max={150} value={dimension} onChange={(value) => setDimension(Number(value))} /></Field><Button variant="outline" disabled={!sketchDraft.primitives.length} onClick={() => { setSketchDraft((draft) => draft ? { ...draft, constraints: [...draft.constraints, `尺寸 ${dimension} mm`] } : draft); void MessagePlugin.info('尺寸标注已记录；本阶段不进行约束求解') }}>添加尺寸标注</Button></>}{sketchTool === '约束' && <><Field label="约束类型"><Select value={constraint} onChange={(value) => setConstraint(String(value))} options={['水平', '垂直', '重合'].map((value) => ({ label: value, value }))} /></Field><Button variant="outline" disabled={!sketchDraft.primitives.length} onClick={() => setSketchDraft((draft) => draft ? { ...draft, constraints: [...draft.constraints, constraint] } : draft)}>记录约束</Button></>}{sketchDraft.constraints.map((value, i) => <p className="cad-muted" key={i}>{value}</p>)}<Button variant="text" disabled={!sketchDraft.primitives.length} onClick={() => setSketchDraft((draft) => draft ? { ...draft, primitives: draft.primitives.slice(0, -1) } : draft)}>撤销最后一个图元</Button></>}</PropertyGroup>
          : activeTool === '拉伸' ? <PropertyGroup title="拉伸参数"><Field label="草图轮廓"><Select value={params.sketchId} placeholder="选择闭合草图" options={project.sketches.filter((sketch) => sketch.primitives.some((primitive) => ['矩形', '圆'].includes(primitive.kind))).map((sketch) => ({ label: sketch.name, value: sketch.id }))} onChange={(value) => setParams((p) => ({ ...p, sketchId: String(value) }))} /></Field>{!project.sketches.length && <Button variant="text" theme="primary" onClick={() => chooseTool('草图')}>创建草图</Button>}<Field label="距离 / mm"><InputNumber min={.1} max={80} value={params.distance} onChange={(value) => setParams((p) => ({ ...p, distance: Number(value) }))} /></Field><Field label="方向"><Select value={params.direction} options={[{ label: '正向', value: 1 }, { label: '反向', value: -1 }]} onChange={(value) => setParams((p) => ({ ...p, direction: Number(value) }))} /></Field><p className="cad-muted">绿色半透明几何体为当前参数预览</p></PropertyGroup>
          : activeTool === '孔' || activeTool === '圆角' ? <PropertyGroup title={`${activeTool}参数`}><Field label="目标对象"><Select value={params.targetId} options={project.objects.filter((object) => object.kind === 'plate' && !object.locked).map((object) => ({ label: object.name, value: object.id }))} onChange={(value) => setParams((p) => ({ ...p, targetId: String(value) }))} /></Field>{activeTool === '孔' ? <><Field label="孔径 / mm"><InputNumber min={.5} max={6} step={.1} value={params.diameter} onChange={(value) => setParams((p) => ({ ...p, diameter: Number(value) }))} /></Field><Field label="深度 / mm"><InputNumber min={.5} max={12} step={.5} value={params.depth} onChange={(value) => setParams((p) => ({ ...p, depth: Number(value) }))} /></Field><Field label="位置偏移 / mm"><InputNumber min={-60} max={60} value={params.offset} onChange={(value) => setParams((p) => ({ ...p, offset: Number(value) }))} /></Field><p className="cad-muted">预览在修复板上增加一个孔口；网格示意按贯穿处理</p></> : <><Field label="半径 / mm"><InputNumber min={.3} max={3.6} step={.1} value={params.radius} onChange={(value) => setParams((p) => ({ ...p, radius: Number(value) }))} /></Field><p className="cad-muted">预览修复板端部圆角</p></>}</PropertyGroup>
          : activeTool === '移动' ? <PropertyGroup title="移动设计对象"><Field label="目标对象"><Select value={params.targetId} onChange={(value) => setParams((p) => ({ ...p, targetId: String(value) }))} options={project.objects.filter((object) => !object.locked).map((object) => ({ label: object.name, value: object.id }))} /></Field>{(['x', 'y', 'z'] as const).map((axis) => <Field label={`${axis.toUpperCase()} / mm`} key={axis}><InputNumber value={params[axis]} min={-100} max={100} onChange={(value) => setParams((p) => ({ ...p, [axis]: Number(value) }))} /></Field>)}</PropertyGroup>
          : activeTool === '测量' || activeTool === '分析' ? <PropertyGroup title={activeTool === '测量' ? '对象几何测量' : '网格几何信息'}>{metricRows}<p className="cad-muted">由当前网格计算，单位按 mm 解释</p><Button variant="text" onClick={() => setSelectedId(null)}>清除选择</Button></PropertyGroup>
          : activeTool === '截面' ? <PropertyGroup title="截面显示"><Field label="剖切位置"><Slider min={-60} max={60} value={sectionOffset} onChange={(value) => setSectionOffset(Number(value))} /></Field><dl className="cad-values"><div><dt>X 平面</dt><dd>{sectionOffset} mm</dd></div></dl><p className="cad-muted">仅影响视图显示，原始模型保持不变</p><Button variant="outline" onClick={() => setSectionOffset(0)}>重置截面</Button></PropertyGroup>
          : activeTool ? <PropertyGroup title={`${activeTool}参数`}><Field label="目标对象"><Select value={params.targetId} onChange={(value) => setParams((p) => ({ ...p, targetId: String(value) }))} options={project.objects.filter((object) => !object.locked).map((object) => ({ label: object.name, value: object.id }))} /></Field>{['旋转', '镜像', '阵列'].includes(activeTool) && <Field label={activeTool === '阵列' ? '数量' : '角度 / °'}><InputNumber value={activeTool === '阵列' ? params.count : params.angle} min={1} max={360} onChange={(value) => setParams((p) => ({ ...p, [activeTool === '阵列' ? 'count' : 'angle']: Number(value) }))} /></Field>}<p className="cad-muted">此操作尚未开放，当前设计保持不变</p></PropertyGroup> : null}</>
  const objectProperties = (selected ? <><PropertyGroup title="基本信息"><Field label="名称"><Input value={selected.name} disabled={!editable} onChange={(value) => changeObject(selected.id, { name: String(value) })} /></Field><Field label="类型"><span>{selected.kind === 'reference' ? '参考网格 · 只读' : '设计实体'}</span></Field><Field label="所属组件"><span>{selected.kind === 'reference' ? '参考模型' : '设计模型'}</span></Field><Field label="可见性"><Select value={selected.visible ? 'show' : 'hide'} disabled={readOnly} options={[{ label: '显示', value: 'show' }, { label: '隐藏', value: 'hide' }]} onChange={(value) => changeObject(selected.id, { visible: value === 'show' })} /></Field><Field label="颜色"><span className="cad-color-input"><input aria-label="对象颜色" type="color" value={selected.color} disabled={!editable} onChange={(event) => changeObject(selected.id, { color: event.target.value })} /><span>{selected.color.toUpperCase()}</span></span></Field><Field label="透明度"><Slider disabled={!editable} value={Math.round((1 - selected.opacity) * 100)} min={0} max={95} onChange={(value) => changeObject(selected.id, { opacity: 1 - Number(value) / 100 })} /></Field></PropertyGroup><PropertyGroup title="几何信息">{metricRows}{selected.kind === 'reference' && <><p className="cad-muted">{cadAsset.filename}</p><p className="cad-muted">展示资产映射 · 原始参考只读</p></>}</PropertyGroup><PropertyGroup title="材质"><Field label="材料"><Select value={selected.material} disabled={!editable} onChange={(value) => changeObject(selected.id, { material: String(value) })} options={['未指定', '钛合金（示例）', '树脂（示例）', '原始 STL 网格'].map((value) => ({ label: value, value }))} /></Field><dl className="cad-values"><div><dt>密度</dt><dd>未指定</dd></div><div><dt>表面处理</dt><dd>未指定</dd></div></dl></PropertyGroup><PropertyGroup title="工艺参数"><dl className="cad-values"><div><dt>制造方式</dt><dd>未指定</dd></div><div><dt>最小厚度</dt><dd>未校核</dd></div><div><dt>最小孔径</dt><dd>未校核</dd></div><div><dt>推荐螺钉</dt><dd>未指定</dd></div></dl></PropertyGroup></> : <div className="cad-inspector-empty"><CadIcon name="立方体" size={30} /><p>选择对象以查看属性</p><span>也可从上方工具栏开始操作</span></div>)
  const toolActions = activeTool && <>{featureTools.has(activeTool) ? <><Button variant="outline" onClick={cancelTool}>取消</Button><Button theme="primary" disabled={readOnly || (activeTool === '拉伸' && !params.sketchId)} onClick={confirmFeature}>确认{activeTool}</Button></> : activeTool === '草图' && sketchDraft ? <><Button variant="outline" onClick={cancelTool}>取消</Button><Button theme="primary" onClick={finishSketch}>完成草图</Button></> : <Button block variant="outline" onClick={cancelTool}>{activeTool === '测量' || activeTool === '截面' || activeTool === '分析' ? '退出' : '取消操作'}</Button>}</>
  const selectedReview = comments.find((comment) => comment.id === selectedComment)
  return <div className="cad-editor" data-task-id={task.id}>
    <div className="cad-toolbar" aria-label="CAD 专业工具栏">
      <CadToolbarTools ready={loadState === 'ready'} readOnly={readOnly} activeTool={activeTool} sketchMode={Boolean(sketchDraft)} sketchTool={sketchTool} onChoose={chooseTool} onSketchChoose={(tool) => { setSketchTool(tool); setPendingPoints([]) }} onBack={onBack} />
      <div className="cad-task-actions">{comments.length > 0 && <Button variant="text" theme="primary" onClick={() => setCommentsOpen((value) => !value)}><ListDemandIcon size={18} />审核意见 {comments.length}{comments.some((comment) => comment.unread) && <i className="cad-unread" />}</Button>}<WorkspaceTaskActions saveState={saveState} savedAt={formatTime(savedAt)} readOnly={readOnly} disabled={readOnly || loadState !== 'ready' || saveState !== 'saved' || Boolean(activeTool)} disabledReason={readOnly ? '当前成果已锁定' : saveState === 'failed' ? '工程保存失败，请重试' : ''} onSubmit={requestSubmit} onSubmitSalesperson={onSubmitSalesperson} /></div>
    </div>
    <div className={`cad-body ${!panelOpen ? 'cad-body-no-inspector' : ''} ${commentsOpen ? 'cad-body-review' : ''}`}>
      <aside className="cad-tree-panel"><header className="cad-panel-header"><h2>模型树</h2><Tooltip content="搜索对象"><button aria-label="搜索模型树" onClick={() => setSearchOpen((value) => !value)}><SearchIcon size={17} /></button></Tooltip></header>{searchOpen && <div className="cad-tree-search"><Input value={search} onChange={(value) => setSearch(String(value))} placeholder="搜索对象" clearable /></div>}<div className="cad-tree-scroll"><div className="cad-project-label"><CadIcon name="立方体" size={18} /><strong>{task.title}</strong></div>
        {(['参考模型', '设计模型', '草图', '特征历史'] as const).map((group) => <section className="cad-tree-group" key={group}><button className="cad-tree-group-title" onClick={() => toggleGroup(group)} aria-expanded={!collapsed.includes(group)}>{collapsed.includes(group) ? <ChevronRightIcon size={14} /> : <ChevronDownIcon size={14} />}<CadIcon name={group === '草图' ? '草图' : '立方体'} size={17} /><span>{group}</span></button>{!collapsed.includes(group) && <div className="cad-tree-children">{group === '参考模型' ? <>{treeRows(project.objects.filter((object) => object.kind === 'reference'))}</> : group === '设计模型' ? treeRows(project.objects.filter((object) => object.kind !== 'reference')) : group === '草图' ? project.sketches.length ? project.sketches.map((sketch) => <button className="cad-tree-history" key={sketch.id} onClick={() => { setSelectedId(null); setPanelOpen(true); void MessagePlugin.info(`${sketch.name} · ${sketch.plane} 平面 · ${sketch.primitives.length} 个图元`) }}><CadIcon name="草图" size={16} /><span>{sketch.name}</span></button>) : <p className="cad-tree-empty">暂无草图</p> : project.features.length ? project.features.map((feature, index) => <button className="cad-tree-history" key={feature.id} onClick={() => { if (feature.objectId && project.objects.some((object) => object.id === feature.objectId)) selectObject(feature.objectId) }}><em>{index + 1}</em><CadIcon name={feature.tool} size={16} /><span>{feature.name}</span></button>) : <p className="cad-tree-empty">尚无建模特征</p>}</div>}</section>)}
      </div></aside>
      <section className="cad-viewport" aria-label="CAD 设计视窗"><div className="cad-webgl-host" ref={viewportRef} />
        {modelCommand && <CadCommandPanel title={activeTool!} onCancel={cancelTool} actions={toolActions}>{commandParameters}</CadCommandPanel>}
        <div className="cad-view-tools">{['立方体', '适应视窗', '缩放', '平移', '旋转'].map((name) => <Tooltip key={name} content={name === '立方体' ? '等轴视图' : name} placement="right"><button className={navMode === name && ['旋转', '平移', '缩放'].includes(name) ? 'cad-view-active' : ''} aria-label={name === '立方体' ? '等轴视图' : name} onClick={() => { if (name === '立方体') sceneRef.current?.setView('等轴'); else if (name === '适应视窗') sceneRef.current?.fit(); else { setNavMode(name); sceneRef.current?.setNavigation(name) } }}><CadIcon name={name} size={20} /></button></Tooltip>)}</div>
        <div className="cad-view-cube" aria-label="视图方向"><div className="cad-cube-shape">{['前', '上', '右'].map((view, i) => <button className={`cad-cube-face cad-cube-face-${i}`} key={view} onClick={() => sceneRef.current?.setView(view)} aria-label={`${view}视图`}>{view}</button>)}</div><div className="cad-cube-other">{['左', '后', '等轴'].map((view) => <button key={view} onClick={() => sceneRef.current?.setView(view)} aria-label={`${view}视图`}>{view}</button>)}</div><span><i>X</i><i>Y</i><i>Z</i></span></div>
        {loadState === 'loading' && <div className="cad-load-overlay"><div className="cad-loading-spinner" /><strong>正在加载下颌骨模型</strong><span>{cadAsset.filename} · 9.8 MB</span></div>}
        {loadState === 'error' && <div className="cad-load-overlay"><strong>模型加载失败</strong><span>{loadError}</span><Button theme="primary" onClick={() => setLoadAttempt((value) => value + 1)}>重试加载</Button></div>}
        {loadState === 'ready' && <div className="cad-canvas-hint">{readOnly ? '成果已锁定 · 可浏览与测量' : sketchDraft ? `${sketchDraft.plane} 平面 · ${sketchTool} · ${pendingPoints.length ? '选择下一点' : '在视窗中选择起点'}` : activeTool ? `${activeTool} · ${modelCommand ? '请在浮动面板设置参数' : '请在右侧查看结果'}` : '左键旋转 / 选择 · 右键平移 · 滚轮缩放'}</div>}
        {selectedReview && commentsOpen && <button className="cad-review-marker" style={{ left: `${selectedReview.position.x}%`, top: `${selectedReview.position.y}%` }} title={selectedReview.title} onClick={() => setSelectedComment(selectedReview.id)}>{String.fromCharCode(65 + comments.indexOf(selectedReview))}</button>}
        <div className="cad-scale" style={{ width: Math.min(220, Math.max(35, scaleWidth)) }}><span>20 mm</span></div>
        {!panelOpen && <Tooltip content="展开属性面板"><button className="cad-inspector-handle" aria-label="展开 CAD 属性面板" onClick={() => setPanelOpen(true)}><ChevronLeftIcon size={16} /></button></Tooltip>}
      </section>
      {panelOpen && <aside className="cad-inspector"><header className="cad-panel-header"><h2>{resultTool ? activeTool : selected?.name ?? '属性'}</h2><button aria-label="收起 CAD 属性面板" onClick={() => setPanelOpen(false)}><ChevronRightIcon size={17} /></button></header><div className="cad-inspector-scroll">{resultTool ? commandParameters : objectProperties}</div>{resultTool && <footer className="cad-tool-footer">{toolActions}</footer>}</aside>}
      {commentsOpen && renderReviewPanel({ selectedId: selectedComment, onSelect: setSelectedComment, onClose: () => setCommentsOpen(false), onSubmit: requestSubmit, syncState: saveState === 'saved' ? 'synced' : saveState === 'saving' ? 'syncing' : 'failed', syncedAt: formatTime(savedAt), onQueueSync: persist })}
    </div>
    <footer className="workspace-status cad-status"><span>{loadState === 'loading' ? '模型加载中' : loadState === 'error' ? '模型未就绪' : activeTool ?? '就绪'}</span><span>已选择 {selected ? 1 : 0} 个对象</span><span /><span>单位：mm</span><span>正交视图</span></footer>
  </div>
}
