import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'
import * as THREE from 'three'
const root = process.cwd(), require = createRequire(path.join(root, 'package.json')), cache = new Map()
function load(file) {
  const resolved = path.resolve(root, file)
  if (cache.has(resolved)) return cache.get(resolved)
  const code = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const module = { exports: {} }; cache.set(resolved, module.exports)
  new Function('require', 'module', 'exports', code)((name) => name.startsWith('.') ? load(path.resolve(path.dirname(resolved), name + '.ts')) : name === 'three' ? THREE : require(name), module, module.exports)
  return module.exports
}
const { cadHistoryReducer: reduce } = load('src/cad/useCadHistory.ts')
const { initialCadProject, cadProjectContent, saveCadProject } = load('src/cad/cadProject.ts')
const { transformCadObject } = load('src/cad/cadTransforms.ts')
const initial = initialCadProject('CAD-UNIT-TEST', 'MODEL-006-V05', 'V05')
let state = { present: initial, past: [], future: [] }
const reference = JSON.stringify(initial.objects[0])
const rename = (name) => (project) => ({ ...project, objects: project.objects.map((object) => object.id === 'plate' ? { ...object, name } : object) })
state = reduce(state, { type: 'commit', update: rename('修复板一'), mergeKey: 'name:plate', at: 1000 })
state = reduce(state, { type: 'commit', update: rename('修复板二'), mergeKey: 'name:plate', at: 1100 })
assert.equal(state.past.length, 1, 'continuous property input must merge into one undo step')
state = reduce(state, { type: 'undo' }); assert.equal(cadProjectContent(state.present), cadProjectContent(initial))
state = reduce(state, { type: 'redo' }); assert.equal(state.present.objects[1].name, '修复板二')
state = reduce(state, { type: 'undo' }); state = reduce(state, { type: 'commit', update: rename('新分支'), at: 3000 })
assert.equal(state.future.length, 0, 'new edit clears stale redo branch')
let mergeBack = { present: initial, past: [], future: [] }; mergeBack = reduce(mergeBack, { type: 'commit', update: rename('临时名称'), mergeKey: 'name:plate', at: 1000 }); mergeBack = reduce(mergeBack, { type: 'commit', update: rename('修复板'), mergeKey: 'name:plate', at: 1100 }); assert.equal(mergeBack.past.length, 0, 'continuous input returning to its original value leaves no empty undo step')
const unchanged = state; state = reduce(state, { type: 'commit', update: (project) => ({ ...project, savedAt: 'metadata-only' }), at: 3001 }); assert.equal(state, unchanged)
state = reduce(state, { type: 'commit', update: (project) => ({ ...project, objects: project.objects.filter((object) => object.id !== 'plate') }), at: 4000 })
assert.equal(state.present.objects.some((object) => object.id === 'plate'), false)
state = reduce(state, { type: 'undo' }); assert.equal(state.present.objects[1].name, '新分支')
assert.equal(JSON.stringify(state.present.objects[0]), reference, 'approved reference never changes')
for (let i = 0; i < 60; i++) state = reduce(state, { type: 'commit', update: rename(String(i)), at: 5000 + i * 1000 })
assert.equal(state.past.length, 50)
state = reduce(state, { type: 'reset', project: initial }); assert.equal(state.past.length, 0); assert.equal(state.future.length, 0)
const plate = initial.objects[1], jaw = initial.objects[0]
assert.deepEqual(transformCadObject(plate, '旋转对象', 'Z', 90, 1).rotation, [0,0,90])
assert.deepEqual(transformCadObject(plate, '缩放对象', 'X', 0, 2).scale, [2,2,2])
assert.deepEqual(transformCadObject(plate, '镜像', 'X', 0, 1).scale, [-1,1,1])
assert.equal(transformCadObject(jaw, '缩放对象', 'X', 0, 2), jaw)
assert.equal(transformCadObject({ ...plate, locked: true }, '旋转对象', 'X', 90, 1).rotation, undefined)
const storage = new Map(); globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }
const first = saveCadProject(initial); assert.equal(saveCadProject(initial).savedAt, first.savedAt)
const edited = saveCadProject(rename('真实编辑')(initial)); assert.equal(edited.objects[1].name, '真实编辑')
const restored = saveCadProject(initial); assert.equal(restored.objects[1].name, '修复板')
globalThis.localStorage.setItem = () => { throw new Error('storage failure') }
assert.throws(() => saveCadProject(rename('保存失败')(initial)), /storage failure/)
const { CadScene, isCadPointerClick } = load('src/cad/CadScene.ts')
assert.equal(isCadPointerClick([10,10], [11,12]), true)
assert.equal(isCadPointerClick([10,10], [50,10]), false, 'right drag must not open a click menu')
const scene = Object.create(CadScene.prototype)
scene.camera = new THREE.OrthographicCamera(-100,100,75,-75,.1,3000); scene.camera.position.set(150,75,165); scene.camera.lookAt(0,0,0)
scene.controls = { target: new THREE.Vector3(), update() { scene.camera.lookAt(this.target) } }; scene.views = []; scene.frustumHeight = 150; scene.host = { clientWidth:1000, clientHeight:700 }; scene.renderer = { setSize() {} }; scene.options = { onCamera() {}, onView() {} }; scene.edges = false; scene.cameraChanged = () => {}
scene.setView('前'); scene.setView('右'); assert.ok(scene.camera.position.x > 0); scene.previousView(); assert.ok(scene.camera.position.z > 0 && Math.abs(scene.camera.position.x) < .001, 'previous view restores the prior camera')
console.log('PASS: CAD undo/redo, merged edits, branching, deletion restore, history bounds, reset, reference locks, transforms persistence failure, right-click drag threshold and camera history')
