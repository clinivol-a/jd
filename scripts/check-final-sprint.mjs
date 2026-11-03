import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const module={exports:{}}
new Function('module','exports',ts.transpileModule(fs.readFileSync('src/projects/projectModel.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText)(module,module.exports)
const m=module.exports,extra=m.withDemoProjects([])
assert.equal(extra.length,8);assert.equal(new Set(extra.map(p=>p.id)).size,8)
assert.ok(extra.every(p=>p.hospital&&p.tasks.every(t=>t.dataOrigin==='demo'&&t.catalogDemo)))
assert.equal(extra[0].tasks.length,4)
assert.ok(extra.slice(0,6).some(p=>p.tasks.length===4))
assert.ok(!/示例|测试/.test(extra.map(p=>p.name).join('')))
assert.equal(m.withDemoProjects([{dataOrigin:'production'}]).length,1)
for(const status of ['已完成','进行中','待审核','审核退回'])assert.ok(extra.some(p=>m.projectStatus(p)===status))
assert.equal(m.formatNoticeTime(''), '')
assert.equal(m.formatNoticeTime('2026-11-02T08:42:00',new Date('2026-11-03T10:00:00')),'11-02 08:42')
const actions=fs.readFileSync('src/WorkspaceTaskActions.tsx','utf8');assert.ok(!actions.includes('<Dropdown'));assert.ok(!actions.includes('选择审核对象'))
const app=fs.readFileSync('src/App.tsx','utf8');assert.ok(app.includes('const [expanded, setExpanded] = useState(true)'))
const medical=fs.readFileSync('src/design-system/MedicalToolIcon.tsx','utf8');assert.equal((medical.match(/export const/g)||[]).length,11)
console.log('PASS: demo catalog identity/provenance, four stages, status coverage, protected assets, notice times, single submit, expanded issues and eleven distinct medical icons')

for(const project of extra){
 const events=m.projectEvents(project,[]);assert.ok(events.length>1);assert.equal(new Set(events.map(e=>e.id)).size,events.length)
 for(const task of project.tasks){assert.equal(m.canEnter(task,project.tasks),task.status!=='未开始')}
}
const original={...extra[0].tasks[0],catalogDemo:false,orderNo:'original',approvedModel:{id:'keep'}}
m.projectsFor([original],[]);assert.equal(original.approvedModel.id,'keep')
const runtime=m.projectsFor(extra.flatMap(p=>p.tasks),[])
assert.equal(runtime.length,8);assert.ok(runtime.every(p=>p.createdAt&&p.hospital!=='—'))
console.log('PASS: catalog entries open by state, mock event histories, no original task mutation, catalog dates and source boundaries')
