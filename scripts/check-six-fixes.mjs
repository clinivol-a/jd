import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
import { loadTs } from './load-ts.mjs'
const d=loadTs('src/dateTime.ts'),m=loadTs('src/projects/projectModel.ts'),r=loadTs('src/reviewRecords.ts')
const now=new Date('2026-11-04T10:30:00')
assert.equal(d.formatDate('2026-11-02'),'2026-11-02')
assert.equal(d.formatDate('2026-02-30'),'—')
const dynamic=[['2026-11-04T10:29:40','刚刚'],['2026-11-04T10:25:00','5分钟前'],['2026-11-04T09:31:00','59分钟前'],['2026-11-04T09:30:00','09:30'],['2026-11-04T08:40:00','08:40'],['2026-11-03T23:59:40','11-03 23:59'],['2025-11-02T10:21:00','2025-11-02 10:21'],['2027-01-01T00:00:00','2027-01-01 00:00'],['2026-11-04T10:35:00','11-04 10:35'],['bad',''],['','']]
for(const [at,expected] of dynamic)assert.equal(d.formatDynamicTime(at,now),expected,at)
assert.equal(d.formatDynamicTime('2026-11-03T23:59:50',new Date('2026-11-04T00:00:10')),'11-03 23:59')
assert.equal(d.formatDynamicTime('2025-12-31T23:59:50',new Date('2026-01-01T00:00:10')),'2025-12-31 23:59')
assert.equal(d.formatDynamicTime('2026-10-31T23:59:50',new Date('2026-11-01T00:00:10')),'10-31 23:59')
assert.equal(d.formatAuditTime('2026-11-04T10:25:00',now),'11-04 10:25')
assert.equal(d.formatAuditTime('2025-11-02T10:21:00',now),'2025-11-02 10:21')
assert.equal(d.formatOperation('2026-11-04T14:32:00','陈屿',now),'14:32 · 陈屿')
assert.equal(d.formatOperation('2026-11-02T14:32:00','陈屿',now),'11-02 14:32 · 陈屿')
assert.equal(d.formatOperation('2025-11-02T14:32:00','陈屿',now),'2025-11-02 14:32 · 陈屿')
assert.equal(d.formatOperation('14:32','陈屿',now),'14:32 · 陈屿')
assert.equal(d.formatSavedTime('2026-11-04T14:32:00',now),'14:32')
assert.equal(d.formatSavedTime('2026-11-01T10:20:00',now),'11-01 10:20')
assert.equal(d.formatSavedTime('2025-11-02T14:32:00',now),'2025-11-02 14:32')
assert.equal(d.formatSavedTime('14:32',now),'')
for(const at of ['2026-02-30T10:00:00','2026-11-04T25:00:00','2026-11-04T10:61:00','bogus'])assert.equal(d.parseTimestamp(at),null)
const utc='2026-11-04T01:30:00Z',offset='2026-11-04T09:30:00+08:00'
assert.equal(d.timestamp(utc),d.timestamp(offset))
assert.equal(d.formatAuditTime(utc,now),d.formatAuditTime(offset,now))
assert.equal(d.legacyTimestamp('10 月 10 日 08:42'),'2026-10-10T08:42:00')
assert.equal(d.legacyTimestamp('invalid'),'')
assert.equal(d.legacyTimestamp('今天 14:32'),'')
assert.equal(m.formatRecent('2026-11-04T10:25:00',now),'5分钟前')
assert.equal(m.formatNoticeTime('2026-11-04T10:25:00',now),'5分钟前')
const projects=m.withDemoProjects([]),tasks=projects.flatMap(p=>p.tasks),before=JSON.stringify(tasks)
assert.equal(m.projectsFor([{...tasks[0],deadline:'2026-11-20'}],[])[0].dueAt,'2026-11-20')
const task={...tasks[0],id:'ACTUAL',catalogDemo:false,orderNo:'ORDER',dataOrigin:'production',review:[
 {time:'2026-11-04T09:00:00',actor:'系统',status:'已分配',note:'分配'},
 {time:'2026-11-04T09:10:00',actor:'本人',status:'任务已开始',note:'开始'},
 {time:'2026-11-04T09:20:00',actor:'实际工程师',status:'已提交审核',note:'提交',submissionId:'SUB'},
 {time:'2026-11-04T09:30:00',actor:'实际审核人',status:'审核退回',note:'保留原文',reviewerIdentity:{id:'REVIEWER',name:'实际审核人',role:'管理员'}},
]}
const event={id:'ACTUAL-SUB',taskId:'ACTUAL',orderNo:'ORDER',type:'review-submit',name:'已提交审核',at:'2026-11-04T09:20:00',actor:'实际工程师',role:'工程师',description:'提交',submissionId:'SUB'}
const actualBefore=JSON.stringify(task)
const rows=r.reviewRecords([...tasks,task],[event])
assert.ok(rows.every(row=>r.isReviewStatus(row.status)))
assert.ok(!rows.some(row=>/已分配|任务已开始/.test(row.status)))
assert.equal(rows.filter(row=>row.task.id==='ACTUAL').length,2)
assert.equal(rows.find(row=>row.actor==='实际审核人').note,'保留原文')
assert.equal(rows.find(row=>row.actor==='实际审核人').reviewerIdentity.id,'REVIEWER')
for(const p of projects){const expected=m.projectEvents(p,[]).filter(e=>/^review-(submit|pass|return)$/.test(e.type));assert.equal(rows.filter(row=>row.task.orderNo===p.id).length,expected.length,p.id)}
assert.equal(JSON.stringify(tasks),before);assert.equal(JSON.stringify(task),actualBefore)
// Separate actual events remain separate even when sharing title, actor and minute.
assert.equal(r.reviewRecords([{...task,review:[]}],[event,{...event,id:'distinct',at:'2026-11-04T09:20:20',submissionId:'SECOND'}]).length,2)
assert.ok(rows.every((row,index)=>!index||d.timestamp(rows[index-1].at)>=d.timestamp(row.at)))
const css=fs.readFileSync('src/design-system/tokens.css','utf8')
assert.equal((css.match(/project-stage-label[^}]*gap:/g)||[]).length,1)
assert.ok(css.includes('gap: var(--td-comp-margin-xs)'))
assert.ok(css.includes('rgba(255,255,255,0.90)'))
// Persist succeeds before publishing a saved timestamp; failed writes preserve the old state.
const app=fs.readFileSync('src/App.tsx','utf8'),ast=ts.createSourceFile('App.tsx',app,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
let saveSource
function find(node){if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='saveTask')saveSource=node.initializer.getText(ast);ts.forEachChild(node,find)}
find(ast)
const saveCode=ts.transpileModule('const saveTask='+saveSource,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
let savedState={'001':'2025-11-02T10:00:00'},taskState=[{id:'001',updated:'original'}],writes=[],shouldFail=false
const save=new Function('localStorage','savedAt','workspaceMode','activeSeries','setDirty','setSavedAt','setTasks','MessagePlugin',saveCode+';return saveTask')(
 {setItem:(key,value)=>{if(shouldFail)throw new Error('quota');writes.push([key,JSON.parse(value)])}},savedState,{}, {},()=>{},update=>{savedState=update(savedState)},update=>{taskState=update(taskState)},{success:()=>{}})
const started=Date.now();assert.equal(save('001',false),true)
assert.ok(d.timestamp(savedState['001'])>=started&&d.timestamp(savedState['001'])<=Date.now())
assert.equal(writes[0][1].savedAt['001'],savedState['001']);assert.equal(taskState[0].updated,savedState['001'])
const successful=savedState['001'];shouldFail=true;assert.equal(save('001',false),false);assert.equal(savedState['001'],successful);assert.equal(writes.length,1)
console.log('PASS: date/dynamic/audit/operation/save formats; day/month/year boundaries; timezone offsets; invalid/future/legacy dates; all demo and actual review events; actor identity, deduplication and unmodified activity; single Tag spacing and unchanged anti Token. TZ='+Intl.DateTimeFormat().resolvedOptions().timeZone)
