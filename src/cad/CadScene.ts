import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js'
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
export type CadSceneOptions = {
  onLoad: (metrics: CadMetrics) => void; onError: (message: string) => void
  onSelect: (id: string | null) => void; onSketchPoint: (point: [number, number]) => void; onCamera: (camera: CadCamera) => void
}
export class CadScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera(-100, 100, 75, -75, .1, 3000)
  private controls: OrbitControls
  private reference = new THREE.Group()
  private designs = new THREE.Group()
  private sketches = new THREE.Group()
  private raycaster = new THREE.Raycaster()
  private resizeObserver: ResizeObserver
  private clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)
  private down: [number, number] = [0, 0]
  private frame = 0
  private disposed = false
  private sketchPlane: CadSketch['plane'] | null = null
  private jaw?: THREE.Mesh
  private project?: CadProject
  private frustumHeight = 150
  constructor(private host: HTMLElement, private options: CadSceneOptions) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75)); this.renderer.setClearColor(0xffffff)
    this.renderer.localClippingEnabled = true; this.renderer.shadowMap.enabled = false
    this.renderer.domElement.setAttribute('aria-label', 'CAD 三维模型视窗'); this.renderer.domElement.setAttribute('tabindex', '0')
    this.host.appendChild(this.renderer.domElement)
    this.scene.add(this.reference, this.designs, this.sketches)
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dfe2, 2.1))
    const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(80, 140, 120)
    this.scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 1.2); fill.position.set(-100, 60, -100); this.scene.add(fill)
    this.camera.position.set(150, 75, 165)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement); this.controls.enableDamping = true; this.controls.dampingFactor = .09; this.controls.minZoom = .25; this.controls.maxZoom = 8
    this.controls.addEventListener('end', this.cameraChanged)
    this.renderer.domElement.addEventListener('pointerdown', this.pointerDown)
    this.renderer.domElement.addEventListener('pointerup', this.pointerUp)
    this.renderer.domElement.addEventListener('contextmenu', this.preventContext)
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(host); this.resize()
    const animate = () => { if (this.disposed) return; this.controls.update(); this.renderer.render(this.scene, this.camera); this.frame = requestAnimationFrame(animate) }; animate()
    void loadJaw().then((geometry) => {
      if (this.disposed) return
      const material = new THREE.MeshStandardMaterial({ color: '#dfd1b7', roughness: .85, metalness: 0, side: THREE.DoubleSide })
      this.jaw = new THREE.Mesh(geometry.clone(), material); this.jaw.userData.objectId = 'jaw'; this.reference.add(this.jaw)
      if (this.project) this.update(this.project, this.project.selectedId)
      this.fit(); if (this.project?.camera) this.restoreCamera(this.project.camera)
      this.options.onLoad(meshMetrics(geometry))
    }).catch(() => { if (!this.disposed) this.options.onError('下颌骨模型加载失败，请检查连接后重试。') })
  }
  private preventContext = (event: Event) => event.preventDefault()
  private cameraChanged = () => this.options.onCamera({ position: this.camera.position.toArray() as [number, number, number], target: this.controls.target.toArray() as [number, number, number], zoom: this.camera.zoom })
  private pointerDown = (event: PointerEvent) => { this.down = [event.clientX, event.clientY] }
  private pointerUp = (event: PointerEvent) => {
    if (event.button !== 0 || Math.hypot(event.clientX - this.down[0], event.clientY - this.down[1]) > 5) return
    const bounds = this.host.getBoundingClientRect(); this.raycaster.setFromCamera(new THREE.Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1), this.camera)
    if (this.sketchPlane) {
      const normal = this.sketchPlane === 'XZ' ? new THREE.Vector3(0, 1, 0) : this.sketchPlane === 'YZ' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1)
      const plane = new THREE.Plane(normal, this.sketchPlane === 'XY' ? -45 : 0); const point = this.raycaster.ray.intersectPlane(plane, new THREE.Vector3())
      if (point) this.options.onSketchPoint(this.sketchPlane === 'XZ' ? [point.x, point.z] : this.sketchPlane === 'YZ' ? [point.y, point.z] : [point.x, point.y])
      return
    }
    const hit = this.raycaster.intersectObjects([...this.reference.children, ...this.designs.children], true).find((intersection) => intersection.object.visible && intersection.object.parent?.visible && intersection.object.userData.objectId)
    this.options.onSelect(hit?.object.userData.objectId ?? null)
  }
  private resize() {
    const w = this.host.clientWidth; const h = this.host.clientHeight; if (!w || !h) return
    const aspect = w / h; this.camera.left = -this.frustumHeight * aspect / 2; this.camera.right = this.frustumHeight * aspect / 2; this.camera.top = this.frustumHeight / 2; this.camera.bottom = -this.frustumHeight / 2; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h)
  }
  update(project: CadProject, selected: string | null, preview?: CadPreview, draft?: CadSketch) {
    this.project = project
    const jaw = project.objects.find((object) => object.id === 'jaw')
    if (this.jaw && jaw) { this.jaw.visible = jaw.visible; const material = this.jaw.material as THREE.MeshStandardMaterial; material.color.set(jaw.color); material.emissive.set(selected === 'jaw' ? '#0b3024' : '#000000'); material.opacity = jaw.opacity; material.transparent = jaw.opacity < 1 }
    this.designs.children.slice().forEach((object) => { this.designs.remove(object); disposeObject(object) })
    project.objects.filter((object) => object.kind !== 'reference').forEach((object) => {
      const activePreview = preview?.targetId === object.id ? preview : undefined
      const material = new THREE.MeshStandardMaterial({ color: object.color, metalness: object.kind === 'guide' ? 0 : .12, roughness: .7, transparent: object.opacity < 1 || Boolean(activePreview), opacity: activePreview ? .72 : object.opacity, side: THREE.DoubleSide, emissive: selected === object.id ? '#102c25' : '#000000' })
      const group = new THREE.Group(); group.visible = object.visible; group.position.set(...object.position)
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
  }
  setSketchPlane(plane: CadSketch['plane'] | null) { this.sketchPlane = plane; this.controls.enableRotate = !plane; if (plane) this.setView(plane === 'XY' ? '前' : plane === 'XZ' ? '上' : '右') }
  setNavigation(mode: string) {
    this.controls.mouseButtons.LEFT = mode === '平移' ? THREE.MOUSE.PAN : mode === '缩放' ? THREE.MOUSE.DOLLY : THREE.MOUSE.ROTATE
    this.renderer.domElement.style.cursor = mode === '平移' ? 'grab' : mode === '缩放' ? 'zoom-in' : 'default'
  }
  setSection(enabled: boolean, offset: number) { this.clipPlane.constant = offset; this.renderer.clippingPlanes = enabled ? [this.clipPlane] : [] }
  setView(view: string) {
    const vectors: Record<string, [number, number, number]> = { 前: [0, 0, 220], 后: [0, 0, -220], 上: [0, 220, .01], 下: [0, -220, .01], 左: [-220, 0, 0], 右: [220, 0, 0], 等轴: [150, 75, 165] }
    this.camera.position.set(...(vectors[view] ?? vectors.等轴)); this.controls.target.set(0, 0, 0); this.controls.update(); this.cameraChanged()
  }
  fit() { const size = this.jaw?.geometry.boundingBox?.getSize(new THREE.Vector3()) ?? new THREE.Vector3(110, 65, 95); this.frustumHeight = Math.max(size.y * 1.35, size.x / Math.max(.5, this.host.clientWidth / this.host.clientHeight) * 1.25, 105); this.camera.zoom = 1; this.controls.target.set(0, 0, 0); this.resize(); this.controls.update() }
  restoreCamera(camera: CadCamera) { this.camera.position.set(...camera.position); this.camera.zoom = camera.zoom; this.controls.target.set(...camera.target); this.camera.updateProjectionMatrix(); this.controls.update() }
  metrics(id: string): CadMetrics | null {
    if (id === 'jaw') return this.jaw ? meshMetrics(this.jaw.geometry) : null
    const group = this.designs.children.find((item) => item.children.some((child) => child.userData.objectId === id)); if (!group) return null
    const bounds = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3()); let area = 0; let volume = 0; let triangles = 0
    group.traverse((object) => { if (object instanceof THREE.Mesh) { const metrics = meshMetrics(object.geometry); area += metrics.area; volume += metrics.volume ?? 0; triangles += metrics.triangles } })
    return { bounds: bounds.toArray() as [number, number, number], area, volume, triangles }
  }
  getScale() { return 20 * this.host.clientHeight / this.frustumHeight * this.camera.zoom }
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.frame); this.resizeObserver.disconnect(); this.controls.removeEventListener('end', this.cameraChanged); this.controls.dispose()
    this.renderer.domElement.removeEventListener('pointerdown', this.pointerDown); this.renderer.domElement.removeEventListener('pointerup', this.pointerUp); this.renderer.domElement.removeEventListener('contextmenu', this.preventContext)
    disposeObject(this.scene); this.renderer.dispose(); this.renderer.domElement.remove()
  }
}
