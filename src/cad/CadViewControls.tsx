import { useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { Button, Dialog, Input, MessagePlugin, Tooltip } from 'tdesign-react'
import { CheckIcon, SettingIcon, DeleteIcon } from '../design-system/tdesign'
import * as THREE from 'three'
import CadIcon from './CadIcon'
import CadToolDropdown from './CadToolDropdown'
import type { CadViewState } from './CadScene'
import type { CadCamera } from './cadProject'

type Vector = [number, number, number]
type NamedView = { name: string; camera: CadCamera }
const faces: { name: string; normal: Vector; u: Vector; v: Vector }[] = [
  { name: '前', normal: [0,0,1], u: [1,0,0], v: [0,1,0] }, { name: '后', normal: [0,0,-1], u: [-1,0,0], v: [0,1,0] },
  { name: '右', normal: [1,0,0], u: [0,0,-1], v: [0,1,0] }, { name: '左', normal: [-1,0,0], u: [0,0,1], v: [0,1,0] },
  { name: '上', normal: [0,1,0], u: [1,0,0], v: [0,0,-1] }, { name: '下', normal: [0,-1,0], u: [1,0,0], v: [0,0,1] },
]
const octagon = [[-19,-27],[19,-27],[27,-19],[27,19],[19,27],[-19,27],[-27,19],[-27,-19]]
function keyActivate(event: KeyboardEvent<SVGGElement>, activate: () => void) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate() } }
function validCamera(value: unknown): value is CadCamera {
  const camera = value as CadCamera | undefined
  return Boolean(camera && [camera.position, camera.target].every((vector) => Array.isArray(vector) && vector.length === 3 && vector.every(Number.isFinite)) && Number.isFinite(camera.zoom) && camera.zoom > 0)
}
export default function CadViewControls({ view, taskId, onAction, onCapture, onRestore }: {
  view: CadViewState; taskId: string; onAction: (action: string) => void; onCapture: () => CadCamera | undefined; onRestore: (camera: CadCamera) => void
}) {
  const [namedOpen, setNamedOpen] = useState(false)
  const [name, setName] = useState('')
  const [named, setNamed] = useState<NamedView[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem(`clinivol-cad-named-views-${taskId}`) ?? '[]'); return Array.isArray(saved) ? saved.filter((item) => typeof item?.name === 'string' && validCamera(item.camera)).slice(0,20) : [] } catch { return [] }
  })
  const saveNamed = () => {
    const camera = onCapture(); const trimmed = name.trim()
    if (!trimmed || !camera) return
    if (named.some((item) => item.name === trimmed)) { void MessagePlugin.warning('该视角名称已存在，请使用其他名称'); return }
    const next = [...named, { name: trimmed, camera }].slice(-20)
    try { localStorage.setItem(`clinivol-cad-named-views-${taskId}`, JSON.stringify(next)); setNamed(next); setName(''); void MessagePlugin.success('视角已保存到本机') } catch { void MessagePlugin.error('视角保存失败，请检查本地存储空间') }
  }
  const deleteNamed = (name: string) => {
    const next = named.filter((item) => item.name !== name)
    try { localStorage.setItem(`clinivol-cad-named-views-${taskId}`, JSON.stringify(next)); setNamed(next) } catch { void MessagePlugin.error('视角删除失败，请重试') }
  }
  const action = (id: string) => { if (id === 'named') { setNamedOpen(true); return } onAction(id) }
  const label = (text: string, checked = false, settings = false) => <span className="cad-view-menu-label"><span className="cad-menu-check">{checked ? <CheckIcon size={16} /> : settings ? <SettingIcon size={16} /> : null}</span><span>{text}</span></span>
  const shadingLabels = { edges: '带边着色', shaded: '不带边着色', wireframe: '不着色', translucent: '半透明' }
  const options = [
    { value: '等轴', content: label('等轴测') }, { value: '二等轴', content: label('正二等轴测') }, { value: '三轴', content: label('正三轴测'), divider: true },
    { value: 'settings', content: label('图形首选项…', false, true) }, { value: 'named', content: label('命名视图…') }, { value: 'previous', content: label('上一个视图'), disabled: !view.hasPrevious, divider: true },
    { value: 'fit', content: label('缩放到合适大小') }, { value: 'window', content: label('放大所选窗口'), divider: true },
    { value: 'projection', content: label('透视视图', view.projection === 'perspective'), active: view.projection === 'perspective' },
    { value: 'normal', content: label('编辑时使法向方向垂直于草图', view.normalToSketch), active: view.normalToSketch },
    { value: 'shading', content: label(shadingLabels[view.shading], true), children: Object.entries(shadingLabels).map(([value, text]) => ({ value: `shading:${value}`, content: label(text, view.shading === value), active: view.shading === value })) },
    { value: 'quality', content: label('启用高质量视图', view.highQuality), active: view.highQuality },
    { value: 'boundary', content: label('亮显边界边', view.boundary), active: view.boundary },
    { value: 'section', content: label('剖视图…'), divider: false },
  ]
  const inverse = new THREE.Quaternion(...view.cubeQuaternion)
  const rotate = (vector: Vector) => new THREE.Vector3(...vector).applyQuaternion(inverse)
  const project = (point: THREE.Vector3): [number, number] => { const p = point.clone().applyQuaternion(inverse); return [76 + p.x, 78 - p.y] }
  const polygon = (points: THREE.Vector3[]) => points.map((p) => project(p).join(',')).join(' ')
  const directionAction = (normal: Vector) => onAction(`direction:${normal.join(',')}`)
  const parts: { key: string; title: string; normal: Vector; points: THREE.Vector3[]; text?: { x: number; y: number; angle: number; name: string }; depth: number }[] = []
  for (const face of faces) {
    const normal = rotate(face.normal); if (normal.z < .01) continue
    const n = new THREE.Vector3(...face.normal); const u = new THREE.Vector3(...face.u); const v = new THREE.Vector3(...face.v)
    const center = project(n.clone().multiplyScalar(27)); const screenU = rotate(face.u)
    parts.push({ key: face.name, title: `${face.name}视图`, normal: face.normal, depth: normal.z, points: octagon.map(([x,y]) => n.clone().multiplyScalar(27).addScaledVector(u,x).addScaledVector(v,y)), text: { x: center[0], y: center[1], angle: THREE.MathUtils.radToDeg(Math.atan2(-screenU.y, screenU.x)), name: face.name } })
  }
  for (let axis = 0; axis < 3; axis++) for (const a of [-1,1]) for (const b of [-1,1]) {
    const other = [0,1,2].filter((i) => i !== axis); const normal: Vector = [0,0,0]; normal[other[0]] = a; normal[other[1]] = b
    const rotated = rotate(normal); if (rotated.z < .01) continue
    const points = [[27,19,-19],[27,19,19],[19,27,19],[19,27,-19]].map(([x,y,z]) => { const point = new THREE.Vector3(); point.setComponent(other[0], a*x); point.setComponent(other[1], b*y); point.setComponent(axis,z); return point })
    parts.push({ key: `edge-${axis}-${a}-${b}`, title: `棱视角 ${normal.join(' ')}`, normal, points, depth: rotated.z })
  }
  for (const x of [-1,1]) for (const y of [-1,1]) for (const z of [-1,1]) {
    const normal: Vector = [x,y,z]; const rotated = rotate(normal); if (rotated.z < .01) continue
    parts.push({ key: `corner-${normal.join()}`, title: `角视角 ${normal.join(' ')}`, normal, depth: rotated.z, points: [[27,19,19],[19,27,19],[19,19,27]].map(([a,b,c]) => new THREE.Vector3(a*x,b*y,c*z)) })
  }
  const turn = (direction: string, event: MouseEvent) => onAction(`turn:${direction}:${event.shiftKey ? 90 : event.ctrlKey || event.metaKey ? 5 : 15}`)
  return <>
    <div className="cad-view-cube" aria-label="视图方向">
      <div className="cad-cube-navigation">
        <svg className="cad-cube-shape" viewBox="0 0 152 152" role="group" aria-label="方向立方体">
          {parts.sort((a,b) => a.depth-b.depth).map((part) => <g key={part.key} role="button" tabIndex={0} aria-label={part.title} className={`cad-cube-hit ${part.text ? 'cad-cube-face' : 'cad-cube-bevel'}`} onClick={() => directionAction(part.normal)} onKeyDown={(event) => keyActivate(event, () => directionAction(part.normal))}><polygon points={polygon(part.points)} />{part.text && <text x={part.text.x} y={part.text.y} transform={`rotate(${part.text.angle},${part.text.x},${part.text.y})`} dominantBaseline="middle" textAnchor="middle">{part.text.name}</text>}</g>)}
          {(['X','Y','Z'] as const).map((axis, i) => { const vector: Vector = [0,0,0]; vector[i] = 39; const p = rotate(vector); return <g key={axis} className={`cad-axis cad-axis-${axis.toLowerCase()}`}><line x1="37" y1="116" x2={37+p.x} y2={116-p.y} /><text x={37+p.x+(p.x >= 0 ? 5 : -5)} y={116-p.y+(p.y >= 0 ? -5 : 10)} textAnchor="middle">{axis}</text></g> })}
        </svg>
        {['up','left','right','down'].map((direction) => <Tooltip key={direction} content={`${{ up:'向上', left:'向左', right:'向右', down:'向下' }[direction]}旋转 15°（Shift 90° / Ctrl 5°）`}><button className={`cad-cube-turn cad-cube-turn-${direction}`} aria-label={`${{ up:'向上', left:'向左', right:'向右', down:'向下' }[direction]}旋转视角`} onClick={(event) => turn(direction,event)}><svg viewBox="0 0 18 18"><path d="m9 4 7 10H2Z" /></svg></button></Tooltip>)}
        {['left','right'].map((direction) => <Tooltip key={direction} content={`${direction === 'left' ? '逆时针' : '顺时针'}旋转视角 15°（Shift 90°）`}><button className={`cad-cube-roll cad-cube-roll-${direction}`} aria-label={`${direction === 'left' ? '逆时针' : '顺时针'}旋转视角`} onClick={(event) => turn(`roll-${direction}`,event)}><svg viewBox="0 0 48 24"><path d="M43 4C26 6 13 11 5 20" /><path d="m5 12-1 9 9-2" /></svg></button></Tooltip>)}
      </div>
      <CadToolDropdown label="视图选项" icon={<CadIcon name="立方体" size={18} />} options={options} onChoose={action} placement="bottom-right" minWidth={292} />
    </div>
    <Dialog visible={namedOpen} header="命名视图" width={400} confirmBtn={{ content: '保存当前视角', disabled: !name.trim() }} cancelBtn="关闭" onConfirm={saveNamed} onClose={() => setNamedOpen(false)} onCancel={() => setNamedOpen(false)}><div className="cad-named-views"><Input value={name} onChange={setName} maxlength={30} placeholder="输入视角名称" aria-label="视角名称" />{named.length ? named.map((item) => <div key={item.name}><span>{item.name}</span><Button variant="text" onClick={() => { onRestore(item.camera); setNamedOpen(false) }}>调用</Button><Button variant="text" shape="square" aria-label={`删除视角 ${item.name}`} icon={<DeleteIcon size={16} />} onClick={() => deleteNamed(item.name)} /></div>) : <p>尚无命名视图。保存后可在本机再次调用。</p>}</div></Dialog>
  </>
}
