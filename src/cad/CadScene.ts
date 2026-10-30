import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js'
import { cadBoundaryGeometry } from './cadViewGeometry'
import type { CadShading } from './cadViewGeometry'
import { cadAsset } from './cadProject'
import type { CadCamera, CadMetrics, CadObject, CadPreview, CadProject, CadSketch, SketchPrimitive } from './cadProject'

let jawPromise: Promise<THREE.BufferGeometry> | undefined
function loadJaw() {
  if (!jawPromise) jawPromise = new STLLoader().loadAsync(cadAsset.url).then((raw) => {
    raw.deleteAttribute('normal')
    const geometry = mergeVertices(raw, .001)
    raw.dispose(); geometry.rotateX(-Math.PI / 2); geometry.center(); geometry.computeVertexNormals(); geometry.computeBoundingBox()
    return geometry
  }).catch((error) => { jawPromise = undefined; throw error })
  return jawPromise
}
export function meshMetrics(geometry: THREE.BufferGeometry): CadMetrics {
  geometry.computeBoundingBox()
  const size = geometry.boundingBox!.getSize(new THREE.Vector3())
  const position = geometry.getAttribute('position'); const index = geometry.index
  let area = 0; let volume = 0
  const a = new THREE.Vector3(); const b = new THREE.Vector3(); const c = new THREE.Vector3(); const ab = new THREE.Vector3(); const ac = new THREE.Vector3()
  const count = index?.count ?? position.count
  for (let i = 0; i < count; i += 3) {
    a.fromBufferAttribute(position, index ? index.getX(i) : i); b.fromBufferAttribute(position, index ? index.getX(i + 1) : i + 1); c.fromBufferAttribute(position, index ? index.getX(i + 2) : i + 2)
    area += ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() / 2
    volume += a.dot(ab.crossVectors(b, c)) / 6
  }
  return { bounds: size.toArray() as [number, number, number], area, volume: Math.abs(volume), triangles: count / 3 }
}
function roundedRect(width: number, height: number, radius: number) {
  const shape = new THREE.Shape(); const x = -width / 2; const y = -height / 2; const r = Math.min(radius, width / 2, height / 2)
  shape.moveTo(x + r, y); shape.lineTo(x + width - r, y); shape.quadraticCurveTo(x + width, y, x + width, y + r)
  shape.lineTo(x + width, y + height - r); shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  shape.lineTo(x + r, y + height); shape.quadraticCurveTo(x, y + height, x, y + height - r)
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y); return shape
}
function plateGeometry(object: CadObject, preview?: CadPreview) {
  const radius = preview?.tool === '圆角' ? preview.radius : object.fillet
  const shape = roundedRect(136, 7.4, radius)
  const holes = [...[-53, -36, -18, 0, 18, 36, 53].map((offset) => ({ diameter: 3.4, offset })), ...object.holes]
  if (preview?.tool === '孔') holes.push({ diameter: preview.diameter, offset: preview.offset })
  holes.forEach((hole) => { const path = new THREE.Path(); path.absarc(hole.offset, 0, hole.diameter / 2, 0, Math.PI * 2, true); shape.holes.push(path) })
  const source = new THREE.ExtrudeGeometry(shape, { depth: 2.1, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .35, bevelThickness: .35, curveSegments: 16 })
  // Subdivide the strip before bending: long cap triangles would bridge the jaw.
  const geometry = new TessellateModifier(3, 7).modify(source); source.dispose()
  const p = geometry.getAttribute('position')
  for (let i = 0; i < p.count; i++) {
    const point = platePoint(p.getX(i), p.getZ(i)); point.y += p.getY(i)
    p.setXYZ(i, point.x, point.y, point.z)
  }
  geometry.computeVertexNormals(); return geometry
}
function platePoint(offset: number, depth: number) {
  const x = offset * .65; const normal = new THREE.Vector3(.048 * x, 0, 1).normalize()
  return new THREE.Vector3(x, -23 + 12 * Math.pow(Math.abs(x) / 44.2, 3), 47 - .024 * x * x).addScaledVector(normal, depth)
}
function primitivePoints(primitive: SketchPrimitive): THREE.Vector2[] {
  const [a, b, c] = primitive.points
  if (!a || !b) return primitive.points.map((p) => new THREE.Vector2(...p))
  if (primitive.kind === '矩形') return [a, [b[0], a[1]], b, [a[0], b[1]], a].map((p) => new THREE.Vector2(...p as [number, number]))
  if (primitive.kind === '圆') {
    const radius = Math.hypot(b[0] - a[0], b[1] - a[1])
    return new THREE.EllipseCurve(...a, radius, radius, 0, Math.PI * 2, false, 0).getPoints(64)
  }
  if (primitive.kind === '圆弧' && c) return new THREE.QuadraticBezierCurve(new THREE.Vector2(...a), new THREE.Vector2(...b), new THREE.Vector2(...c)).getPoints(40)
  if (primitive.kind === '样条' && c) return new THREE.SplineCurve(primitive.points.map((p) => new THREE.Vector2(...p))).getPoints(48)
  return primitive.points.map((p) => new THREE.Vector2(...p))
}
function sketchPosition(point: THREE.Vector2, plane: CadSketch['plane']) {
  return plane === 'XZ' ? new THREE.Vector3(point.x, 0, point.y) : plane === 'YZ' ? new THREE.Vector3(0, point.x, point.y) : new THREE.Vector3(point.x, point.y, 45)
}
function extrusionGeometry(sketch: CadSketch | undefined, distance: number) {
  const contour = sketch?.primitives.find((primitive) => primitive.kind === '矩形' || primitive.kind === '圆')
  const points = contour ? primitivePoints(contour) : []
  const shape = points.length > 2 ? new THREE.Shape(points) : roundedRect(26, 12, 2)
  return new THREE.ExtrudeGeometry(shape, { depth: Math.abs(distance), bevelEnabled: false, curveSegments: 32 })
}
function placeExtrusion(mesh: THREE.Mesh, sketch: CadSketch | undefined, direction: number) {
  if (sketch?.plane === 'XZ') mesh.rotation.x = Math.PI / 2
  else if (sketch?.plane === 'YZ') mesh.setRotationFromMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)))
  else mesh.position.z = 45
  if (direction < 0) mesh.scale.z = -1
}
function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => { const mesh = child as THREE.Mesh; mesh.geometry?.dispose(); const materials = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : []; materials.forEach((material) => material.dispose()) })
}
export function isCadPointerClick(from: [number, number], to: [number, number]) { return Math.hypot(to[0] - from[0], to[1] - from[1]) <= 5 }
export type CadViewState = { projection: 'orthographic' | 'perspective'; edges: boolean; hasPrevious: boolean; cubeMatrix: string; cubeQuaternion: [number, number, number, number]; shading: CadShading; highQuality: boolean; boundary: boolean; normalToSketch: boolean }
export type CadSceneOptions = {
  onLoad: (metrics: CadMetrics) => void; onError: (message: string) => void
  onContext: (id: string | null, x: number, y: number) => void; onView: (state: CadViewState) => void;
  onSelect: (id: string | null) => void; onSketchPoint: (point: [number, number]) => void; onCamera: (camera: CadCamera) => void
}
export class CadScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.OrthographicCamera | THREE.PerspectiveCamera = new THREE.OrthographicCamera(-100, 100, 75, -75, .1, 3000)
  private controls: OrbitControls
  private reference = new THREE.Group()
  private designs = new THREE.Group()
  private sketches = new THREE.Group()
  private raycaster = new THREE.Raycaster()
  private resizeObserver: ResizeObserver
  private themeObserver: MutationObserver
  private clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)
  private down: [number, number] = [0, 0]
  private navigation = '旋转'
  private views: CadCamera[] = []
  private gestureStart?: CadCamera
  private lastViewTick = 0
  private edges = false
  private shading: CadShading = 'shaded'
  private highQuality = false
  private boundary = false
  private normalToSketch = true
  private transition?: { from: THREE.Quaternion; to: THREE.Quaternion; started: number; target: THREE.Vector3; distance: number }

  private planes = new THREE.Group()
  private frame = 0
  private disposed = false
  private sketchPlane: CadSketch['plane'] | null = null
  private jaw?: THREE.Mesh
  private project?: CadProject
  private frustumHeight = 150
  constructor(private host: HTMLElement, private options: CadSceneOptions) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75)); this.syncTheme()
    this.themeObserver = new MutationObserver(this.syncTheme)
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    this.renderer.localClippingEnabled = true; this.renderer.shadowMap.enabled = false
    this.renderer.domElement.setAttribute('aria-label', 'CAD 三维模型视窗'); this.renderer.domElement.setAttribute('tabindex', '0')
    this.host.appendChild(this.renderer.domElement)
    this.scene.add(this.reference, this.designs, this.sketches, this.planes)
    ;(['XY', 'XZ', 'YZ'] as const).forEach((name) => {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshBasicMaterial({ color: '#638cb0', transparent: true, opacity: .10, side: THREE.DoubleSide, depthWrite: false }))
      if (name === 'XY') plane.position.z = 45
      if (name === 'XZ') plane.rotation.x = -Math.PI / 2
      if (name === 'YZ') plane.rotation.y = Math.PI / 2
      const outline = new THREE.LineSegments(new THREE.EdgesGeometry(plane.geometry), new THREE.LineBasicMaterial({ color: '#8baac5', transparent: true, opacity: .7 })); plane.add(outline); plane.name = name; plane.visible = false; this.planes.add(plane)
    })
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dfe2, 2.1))
    const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(80, 140, 120)
    this.scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 1.2); fill.position.set(-100, 60, -100); this.scene.add(fill)
    this.camera.position.set(150, 75, 165)
    this.controls = this.createControls()
    this.renderer.domElement.addEventListener('pointerdown', this.pointerDown)
    this.renderer.domElement.addEventListener('pointerup', this.pointerUp)
    this.renderer.domElement.addEventListener('contextmenu', this.preventContext)
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(host); this.resize()
    const animate = () => { if (this.disposed) return; this.advanceView(); this.controls.update(); this.renderer.render(this.scene, this.camera); this.frame = requestAnimationFrame(animate) }; animate()
    void loadJaw().then((geometry) => {
      if (this.disposed) return
      const material = new THREE.MeshStandardMaterial({ color: '#dfd1b7', roughness: .85, metalness: 0, side: THREE.DoubleSide })
      this.jaw = new THREE.Mesh(geometry.clone(), material); this.jaw.userData.objectId = 'jaw'; this.reference.add(this.jaw)
      if (this.project) this.update(this.project, this.project.selectedId)
      this.fit(undefined, false); if (this.project?.camera) this.restoreCamera(this.project.camera)
      this.options.onLoad(meshMetrics(geometry))
    }).catch(() => { if (!this.disposed) this.options.onError('下颌骨模型加载失败，请检查连接后重试。') })
  }
  private syncTheme = () => { this.renderer.setClearColor(getComputedStyle(this.host).getPropertyValue('--cad-viewport-bg').trim() || '#ffffff'); if (this.edges || this.boundary) this.applyEdges() }
  private createControls() {
    const controls = new OrbitControls(this.camera, this.renderer.domElement)
    controls.enableDamping = true; controls.dampingFactor = .09; controls.minZoom = .25; controls.maxZoom = 8
    controls.enableRotate = !this.sketchPlane
    controls.mouseButtons.LEFT = this.navigation === '平移' ? THREE.MOUSE.PAN : this.navigation === '缩放' ? THREE.MOUSE.DOLLY : THREE.MOUSE.ROTATE
    controls.addEventListener('change', this.cameraChanged); controls.addEventListener('start', this.cameraStart); controls.addEventListener('end', this.cameraEnd)
    return controls
  }
  private removeControls() {
    this.controls.removeEventListener('change', this.cameraChanged); this.controls.removeEventListener('start', this.cameraStart); this.controls.removeEventListener('end', this.cameraEnd); this.controls.dispose()
  }
  private pose(): CadCamera { return { position: this.camera.position.toArray() as [number, number, number], target: this.controls.target.toArray() as [number, number, number], zoom: this.camera.zoom, frustumHeight: this.frustumHeight, projection: this.camera instanceof THREE.PerspectiveCamera ? 'perspective' : 'orthographic', up: this.camera.up.toArray() as [number, number, number] } }
  private sameView(a: CadCamera, b: CadCamera) { return (a.projection ?? 'orthographic') === (b.projection ?? 'orthographic') && Math.abs(a.zoom - b.zoom) < 1e-6 && Math.abs((a.frustumHeight ?? 150) - (b.frustumHeight ?? 150)) < 1e-5 && [...a.position, ...a.target, ...(a.up ?? [0,1,0])].every((value, index) => Math.abs(value - [...b.position, ...b.target, ...(b.up ?? [0,1,0])][index]) < 1e-5) }
  private remember() { const pose = this.pose(); if (!this.views.length || !this.sameView(this.views[this.views.length - 1], pose)) this.views.push(pose); if (this.views.length > 20) this.views.shift() }
  private cameraStart = () => { this.transition = undefined; this.gestureStart = this.pose() }
  private cameraEnd = () => {
    if (this.gestureStart && !this.sameView(this.gestureStart, this.pose())) { this.views.push(this.gestureStart); if (this.views.length > 20) this.views.shift() }
    this.gestureStart = undefined; this.lastViewTick = 0; this.cameraChanged()
  }
  private preventContext = (event: Event) => event.preventDefault()
  private cameraChanged = () => {
    if (performance.now() - this.lastViewTick < 32) return
    this.lastViewTick = performance.now()
    this.options.onCamera(this.pose())
    const flip = new THREE.Matrix4().makeScale(1, -1, 1)
    const orientation = flip.clone().multiply(new THREE.Matrix4().makeRotationFromQuaternion(this.camera.quaternion.clone().invert())).multiply(flip)
    this.options.onView({ projection: this.camera instanceof THREE.PerspectiveCamera ? 'perspective' : 'orthographic', edges: this.edges, hasPrevious: this.views.length > 0, cubeMatrix: `matrix3d(${orientation.elements.join(',')})`, cubeQuaternion: this.camera.quaternion.clone().invert().toArray() as [number, number, number, number], shading: this.shading, highQuality: this.highQuality, boundary: this.boundary, normalToSketch: this.normalToSketch })
  }
  private pick(clientX: number, clientY: number) {
    const bounds = this.host.getBoundingClientRect()
    this.raycaster.setFromCamera(new THREE.Vector2((clientX - bounds.left) / bounds.width * 2 - 1, -(clientY - bounds.top) / bounds.height * 2 + 1), this.camera)
    const hit = this.raycaster.intersectObjects([...this.reference.children, ...this.designs.children], true).find((intersection) => intersection.object instanceof THREE.Mesh && intersection.object.visible && intersection.object.parent?.visible && intersection.object.userData.objectId && (!this.renderer.clippingPlanes.length || this.clipPlane.distanceToPoint(intersection.point) >= 0))
    return hit?.object.userData.objectId as string | undefined
  }
  private pointerDown = (event: PointerEvent) => { this.down = [event.clientX, event.clientY] }
  private pointerUp = (event: PointerEvent) => {
    if (!isCadPointerClick(this.down, [event.clientX, event.clientY])) return
    if (event.button === 2) { this.options.onContext(this.pick(event.clientX, event.clientY) ?? null, event.clientX, event.clientY); return }
    if (event.button !== 0) return
    const bounds = this.host.getBoundingClientRect(); this.raycaster.setFromCamera(new THREE.Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1), this.camera)
    if (this.sketchPlane) {
      const normal = this.sketchPlane === 'XZ' ? new THREE.Vector3(0, 1, 0) : this.sketchPlane === 'YZ' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1)
      const plane = new THREE.Plane(normal, this.sketchPlane === 'XY' ? -45 : 0); const point = this.raycaster.ray.intersectPlane(plane, new THREE.Vector3())
      if (point) this.options.onSketchPoint(this.sketchPlane === 'XZ' ? [point.x, point.z] : this.sketchPlane === 'YZ' ? [point.y, point.z] : [point.x, point.y])
      return
    }
    this.options.onSelect(this.pick(event.clientX, event.clientY) ?? null)
  }
  private resize() {
    const w = this.host.clientWidth; const h = this.host.clientHeight; if (!w || !h) return
    const aspect = w / h
    if (this.camera instanceof THREE.OrthographicCamera) { this.camera.left = -this.frustumHeight * aspect / 2; this.camera.right = this.frustumHeight * aspect / 2; this.camera.top = this.frustumHeight / 2; this.camera.bottom = -this.frustumHeight / 2 } else this.camera.aspect = aspect
    this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h); this.lastViewTick = 0; this.cameraChanged()
  }
  update(project: CadProject, selected: string | null, preview?: CadPreview, draft?: CadSketch) {
    this.project = project
    const jaw = project.objects.find((object) => object.id === 'jaw')
    if (this.jaw && jaw) { this.jaw.visible = jaw.visible; const material = this.jaw.material as THREE.MeshStandardMaterial; material.color.set(jaw.color); material.emissive.set(selected === 'jaw' ? '#0b3024' : '#000000'); material.opacity = jaw.opacity; material.userData.displayOpacity = jaw.opacity; material.transparent = jaw.opacity < 1 }
    this.designs.children.slice().forEach((object) => { this.designs.remove(object); disposeObject(object) })
    project.objects.filter((object) => object.kind !== 'reference').forEach((object) => {
      const activePreview = preview?.targetId === object.id ? preview : undefined
      const material = new THREE.MeshStandardMaterial({ color: object.color, metalness: object.kind === 'guide' ? 0 : .12, roughness: .7, transparent: object.opacity < 1 || Boolean(activePreview), opacity: activePreview ? .72 : object.opacity, side: THREE.DoubleSide, emissive: selected === object.id ? '#102c25' : '#000000' })
      const group = new THREE.Group(); group.visible = object.visible; group.position.set(...object.position); if (object.rotation) group.rotation.set(...object.rotation.map((angle) => THREE.MathUtils.degToRad(angle)) as [number, number, number]); if (object.scale) group.scale.set(...object.scale)
      if (object.kind === 'plate') group.add(new THREE.Mesh(plateGeometry(object, activePreview), material))
      if (object.kind === 'guide') { const geometry = new THREE.TorusGeometry(30, 4, 12, 64, Math.PI); const mesh = new THREE.Mesh(geometry, material); mesh.rotation.x = Math.PI / 2; mesh.position.set(0, 0, 8); group.add(mesh) }
      if (object.kind === 'screws') [-53, -36, -18, 18, 36, 53].forEach((offset) => {
        const normal = new THREE.Vector3(.048 * offset * .65, 0, 1).normalize(); const screw = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.2, 3.8, 24), material); screw.position.copy(platePoint(offset, 3.2)); screw.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal); group.add(screw)
        const slot = new THREE.Mesh(new THREE.BoxGeometry(2.9, .35, .5), new THREE.MeshStandardMaterial({ color: '#344d60' })); slot.position.copy(screw.position).addScaledVector(normal, 2); slot.rotation.y = Math.atan2(normal.x, normal.z); group.add(slot)
      })
      if (object.kind === 'extrusion') { const sketch = project.sketches.find((item) => item.id === object.sketchId); const geometry = extrusionGeometry(sketch, object.distance ?? 8); const mesh = new THREE.Mesh(geometry, material); placeExtrusion(mesh, sketch, object.distance ?? 8); group.add(mesh) }
      group.traverse((child) => { if (child instanceof THREE.Mesh) child.userData.objectId = object.id }); this.designs.add(group)
    })
    if (preview?.tool === '拉伸') {
      const mesh = new THREE.Mesh(extrusionGeometry(preview.sketch, preview.distance), new THREE.MeshStandardMaterial({ color: '#2f9d78', transparent: true, opacity: .45, side: THREE.DoubleSide })); placeExtrusion(mesh, preview.sketch, preview.direction); this.designs.add(mesh)
    }
    this.sketches.children.slice().forEach((object) => { this.sketches.remove(object); disposeObject(object) })
    ;[...project.sketches, ...(draft ? [draft] : [])].forEach((sketch) => sketch.primitives.forEach((primitive) => {
      const points = primitivePoints(primitive).map((point) => sketchPosition(point, sketch.plane))
      if (!points.length) return
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: draft?.id === sketch.id ? '#087f60' : '#287eb8', depthTest: false })); line.renderOrder = 3; this.sketches.add(line)
      if (points.length === 1) { const dot = new THREE.Mesh(new THREE.SphereGeometry(.7), new THREE.MeshBasicMaterial({ color: '#087f60', depthTest: false })); dot.position.copy(points[0]); this.sketches.add(dot) }
    }))
    this.applyEdges()
  }
  setSketchPlane(plane: CadSketch['plane'] | null) { this.sketchPlane = plane; this.controls.enableRotate = !plane; if (plane && this.normalToSketch) this.setView(plane === 'XY' ? '前' : plane === 'XZ' ? '上' : '右') }
  setNavigation(mode: string) {
    this.navigation = mode
    this.controls.mouseButtons.LEFT = mode === '平移' ? THREE.MOUSE.PAN : mode === '缩放' ? THREE.MOUSE.DOLLY : THREE.MOUSE.ROTATE
    this.renderer.domElement.style.cursor = mode === '平移' ? 'grab' : mode === '缩放' ? 'zoom-in' : 'default'
  }
  setSection(enabled: boolean, offset: number, axis: 'X' | 'Y' | 'Z' = 'X', direction = 1) {
    this.clipPlane.normal.set(axis === 'X' ? -direction : 0, axis === 'Y' ? -direction : 0, axis === 'Z' ? -direction : 0)
    this.clipPlane.constant = offset * direction
    this.renderer.clippingPlanes = enabled ? [this.clipPlane] : []
  }
  setView(view: string, remember = true, smooth = false) {
    const vectors: Record<string, [number, number, number]> = { 前: [0, 0, 1], 后: [0, 0, -1], 上: [0, 1, .0001], 下: [0, -1, .0001], 左: [-1, 0, 0], 右: [1, 0, 0], 等轴: [1, 1, 1], 二等轴: [1, .55, 1], 三轴: [1, .65, 1.35] }
    const direction = vectors[view]
    if (direction) this.setDirection(direction, remember, smooth)
  }
  setDirection(direction: [number, number, number], remember = true, smooth = true, up = new THREE.Vector3(0, 1, 0)) {
    if (remember) this.remember()
    const normal = new THREE.Vector3(...direction).normalize()
    if (!normal.lengthSq()) return
    if (Math.abs(normal.dot(up)) > .9999) up = new THREE.Vector3(0, 0, normal.y > 0 ? -1 : 1)
    const target = this.controls.target.clone(); const distance = Math.max(10, this.camera.position.distanceTo(target))
    const to = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(normal, new THREE.Vector3(), up))
    if (smooth && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) this.transition = { from: this.camera.quaternion.clone(), to, started: performance.now(), target, distance }
    else { this.transition = undefined; this.camera.up.copy(up); this.camera.position.copy(target).addScaledVector(normal, distance); this.controls.update(); this.lastViewTick = 0; this.cameraChanged() }
  }
  private advanceView() {
    const transition = this.transition; if (!transition) return
    const t = Math.min(1, (performance.now() - transition.started) / 240)
    const rotation = transition.from.clone().slerp(transition.to, t * t * (3 - 2 * t))
    this.camera.position.copy(transition.target).add(new THREE.Vector3(0,0,transition.distance).applyQuaternion(rotation))
    this.camera.up.set(0,1,0).applyQuaternion(rotation); this.controls.target.copy(transition.target)
    if (t === 1) this.transition = undefined
  }
  rotateView(axis: 'left' | 'right' | 'up' | 'down' | 'roll-left' | 'roll-right', degrees = 15) {
    const normal = this.camera.position.clone().sub(this.controls.target).normalize()
    const rotationAxis = axis.startsWith('roll') ? normal : axis === 'left' || axis === 'right' ? this.camera.up.clone() : new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion)
    const sign = axis === 'right' || axis === 'down' || axis === 'roll-right' ? -1 : 1
    const rotation = new THREE.Quaternion().setFromAxisAngle(rotationAxis, THREE.MathUtils.degToRad(degrees * sign))
    const up = this.camera.up.clone().applyQuaternion(rotation)
    this.setDirection(normal.applyQuaternion(rotation).toArray() as [number, number, number], true, true, up)
  }
  captureView() { return this.pose() }
  recallView(camera: CadCamera) { this.remember(); this.restoreCamera(camera) }
  zoomWindow(rect: { x: number; y: number; width: number; height: number }) {
    if (rect.width < 8 || rect.height < 8) return false
    this.remember()
    const width = this.host.clientWidth; const height = this.host.clientHeight
    const center = new THREE.Vector2((rect.x + rect.width / 2) / width * 2 - 1, 1 - (rect.y + rect.height / 2) / height * 2)
    this.camera.updateMatrixWorld(true); this.raycaster.setFromCamera(center, this.camera)
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(new THREE.Vector3()), this.controls.target)
    const point = this.raycaster.ray.intersectPlane(plane, new THREE.Vector3()); if (!point) return false
    const offset = this.camera.position.clone().sub(this.controls.target)
    const factor = Math.max(rect.width / width, rect.height / height, .025)
    this.controls.target.copy(point)
    if (this.camera instanceof THREE.PerspectiveCamera) this.camera.position.copy(point).add(offset.multiplyScalar(factor))
    else { this.camera.position.copy(point).add(offset); this.camera.zoom = Math.min(30, this.camera.zoom / factor) }
    this.controls.update(); this.resize(); return true
  }
  previousView() { let pose = this.views.pop(); while (pose && this.sameView(pose, this.pose())) pose = this.views.pop(); if (pose) this.restoreCamera(pose); else { this.lastViewTick = 0; this.cameraChanged() } }
  resetView() { this.remember(); this.setView('等轴', false); this.fit(undefined, false) }
  setProjection(projection: 'orthographic' | 'perspective', remember = true) {
    if ((this.camera instanceof THREE.PerspectiveCamera) === (projection === 'perspective')) return
    if (remember) this.remember()
    const target = this.controls.target.clone(); const direction = this.camera.position.clone().sub(target).normalize(); const up = this.camera.up.clone()
    const height = this.visibleHeight(); this.removeControls()
    if (projection === 'perspective') { this.camera = new THREE.PerspectiveCamera(40, this.host.clientWidth / this.host.clientHeight, .1, 3000); this.camera.position.copy(target).addScaledVector(direction, height / (2 * Math.tan(THREE.MathUtils.degToRad(20)))) }
    else { this.frustumHeight = height; this.camera = new THREE.OrthographicCamera(-100,100,75,-75,.1,3000); this.camera.position.copy(target).addScaledVector(direction, Math.max(height * 2, 220)) }
    this.camera.up.copy(up); this.controls = this.createControls(); this.controls.target.copy(target); this.controls.update(); this.resize()
  }
  private visibleHeight() { return this.camera instanceof THREE.PerspectiveCamera ? 2 * this.camera.position.distanceTo(this.controls.target) * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) / this.camera.zoom : this.frustumHeight / this.camera.zoom }
  private objectBox(id?: string) {
    const box = new THREE.Box3()
    this.scene.updateMatrixWorld(true)
    const objects = [...this.reference.children, ...this.designs.children]
    objects.forEach((object) => {
      const objectId = object.userData.objectId ?? object.children.find((child) => child.userData.objectId)?.userData.objectId
      if (object.visible && objectId && (!id || objectId === id)) box.union(new THREE.Box3().setFromObject(object))
    })
    return box
  }
  fit(id?: string, remember = true) {
    this.transition = undefined
    const box = this.objectBox(id); if (box.isEmpty()) return false
    if (remember) this.remember()
    const center = box.getCenter(new THREE.Vector3())
    const inverse = this.camera.quaternion.clone().invert(); const projected = new THREE.Box3()
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) projected.expandByPoint(new THREE.Vector3(x,y,z).sub(center).applyQuaternion(inverse))
    const size = projected.getSize(new THREE.Vector3())
    const height = Math.max(10, size.y, size.x / Math.max(.3, this.host.clientWidth / this.host.clientHeight)) * 1.25
    const direction = this.camera.position.clone().sub(this.controls.target).normalize()
    this.controls.target.copy(center); this.camera.zoom = 1
    if (this.camera instanceof THREE.PerspectiveCamera) this.camera.position.copy(center).addScaledVector(direction, height / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) + size.z / 2)
    else { this.frustumHeight = height; this.camera.position.copy(center).addScaledVector(direction, Math.max(220, height * 2)) }
    this.controls.update(); this.resize(); return true
  }
  restoreCamera(camera: CadCamera) {
    this.transition = undefined
    this.setProjection(camera.projection ?? 'orthographic', false)
    if (camera.frustumHeight) this.frustumHeight = camera.frustumHeight
    this.camera.position.set(...camera.position); this.camera.up.set(...(camera.up ?? [0,1,0])); this.camera.zoom = camera.zoom; this.controls.target.set(...camera.target); this.camera.updateProjectionMatrix(); this.controls.update(); this.resize(); this.lastViewTick = 0; this.cameraChanged()
  }
  setReferencePlanes(visible: boolean, overrides: Partial<Record<string, boolean>> = {}) { this.planes.children.forEach((plane) => { plane.visible = overrides[plane.name] ?? visible }) }
  setEdges(enabled: boolean) { this.setShading(enabled ? 'edges' : 'shaded') }
  setShading(mode: CadShading) { this.shading = mode; this.edges = mode === 'edges'; this.applyEdges(); this.lastViewTick = 0; this.cameraChanged() }
  setHighQuality(enabled: boolean) { this.highQuality = enabled; this.renderer.setPixelRatio(enabled ? Math.min(window.devicePixelRatio * 1.5, 3) : Math.min(window.devicePixelRatio, 1.75)); this.resize() }
  setBoundary(enabled: boolean) { this.boundary = enabled; this.applyEdges(); this.lastViewTick = 0; this.cameraChanged() }
  setNormalToSketch(enabled: boolean) { this.normalToSketch = enabled; if (enabled && this.sketchPlane) this.setView(this.sketchPlane === 'XY' ? '前' : this.sketchPlane === 'XZ' ? '上' : '右'); this.lastViewTick = 0; this.cameraChanged() }

  private applyEdges() {
    const color = getComputedStyle(this.host).getPropertyValue('--cad-control-fg').trim() || '#52606b'
    ;[this.reference, this.designs].forEach((group) => group.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const material = object.material as THREE.MeshStandardMaterial
      if (material.userData.displayOpacity === undefined) material.userData.displayOpacity = material.opacity
      material.wireframe = this.shading === 'wireframe'
      material.opacity = this.shading === 'translucent' ? Math.min(.28, material.userData.displayOpacity) : material.userData.displayOpacity
      material.transparent = material.opacity < 1; material.depthWrite = !material.transparent
      let boundary = object.children.find((child) => child.userData.cadBoundary) as THREE.LineSegments | undefined
      if (!boundary && this.boundary) { boundary = new THREE.LineSegments(cadBoundaryGeometry(object.geometry), new THREE.LineBasicMaterial({ color: '#d58335', depthTest: true })); boundary.userData.cadBoundary = true; object.add(boundary) }
      if (boundary) boundary.visible = this.boundary
      let lines = object.children.find((child) => child.userData.cadEdges) as THREE.LineSegments | undefined
      if (!lines && this.edges) { lines = new THREE.LineSegments(new THREE.EdgesGeometry(object.geometry, 30), new THREE.LineBasicMaterial({ color, transparent: true, opacity: .65 })); lines.userData.cadEdges = true; object.add(lines) }
      if (lines) { lines.visible = this.edges; (lines.material as THREE.LineBasicMaterial).color.set(color) }
    }))
  }
  metrics(id: string): CadMetrics | null {
    this.scene.updateMatrixWorld(true)
    if (id === 'jaw') return this.jaw ? meshMetrics(this.jaw.geometry) : null
    const group = this.designs.children.find((item) => item.children.some((child) => child.userData.objectId === id)); if (!group) return null
    const bounds = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3()); let area = 0; let volume = 0; let triangles = 0
    group.traverse((object) => { if (object instanceof THREE.Mesh) { const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld); const metrics = meshMetrics(geometry); geometry.dispose(); area += metrics.area; volume += metrics.volume ?? 0; triangles += metrics.triangles } })
    return { bounds: bounds.toArray() as [number, number, number], area, volume, triangles }
  }
  getScale() { return 20 * this.host.clientHeight / this.visibleHeight() }
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.frame); this.resizeObserver.disconnect(); this.themeObserver.disconnect(); this.removeControls()
    this.renderer.domElement.removeEventListener('pointerdown', this.pointerDown); this.renderer.domElement.removeEventListener('pointerup', this.pointerUp); this.renderer.domElement.removeEventListener('contextmenu', this.preventContext)
    disposeObject(this.scene); this.renderer.dispose(); this.renderer.domElement.remove()
  }
}
