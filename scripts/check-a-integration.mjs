import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'
const text=fs.readFileSync('src/App.tsx','utf8')
const parse=text=>ts.createSourceFile('App.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
const ast=parse(text)
const baselineText=execFileSync('git',['show','backup/a-before-project-dashboard-20261103:src/App.tsx'],{encoding:'utf8'})
const baseline=parse(baselineText)
function variable(ast,name){for(const node of ast.statements)if(ts.isVariableStatement(node))for(const d of node.declarationList.declarations)if(d.name.getText(ast)===name)return d.initializer.getText(ast);throw new Error(name)}
const base=new Function(`return (${variable(baseline,'initialTasks')})`)(),tasks=new Function(`return (${variable(ast,'originalTasks')})`)()
assert.deepEqual(tasks,base,'original task data must survive integration byte-for-byte at object level')
assert.equal(tasks.length,7);assert.ok(tasks.every(t=>!t.id.startsWith('E')))
const model={exports:{}}
new Function('module','exports',ts.transpileModule(fs.readFileSync('src/projects/projectModel.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText)(model,model.exports)
const m=model.exports
const functionText=name=>ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text===name).getText(ast)
const compiled=ts.transpileModule(`const seedDates=${variable(ast,'seedDates')};const eventTime=${variable(ast,'eventTime')};${functionText('initialFlowEvents')}\n${functionText('isCadTaskUnlocked')}\n${functionText('synchronizeCadTasks')}\n${functionText('getStoredBaseTasks')}`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
const storage=new Map(),localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}
const functions=new Function('originalTasks','initialTasks','localStorage',compiled+';return {initialFlowEvents,getStoredTasks:getStoredBaseTasks,isCadTaskUnlocked}')(tasks,tasks,localStorage)
const events=functions.initialFlowEvents(),projects=m.projectsFor(tasks,events)
assert.equal(projects.length,5);assert.equal(new Set(projects.map(p=>p.id)).size,5)
assert.deepEqual(m.aDashboardCounts(tasks,events,new Date('2026-10-23T12:00:00')),{待处理:3,进行中:2,待审核:2,审核退回:1,已完成:1})
assert.equal(m.canEnter(tasks.find(t=>t.id==='005'),tasks),false)
assert.equal(m.canEnter(tasks.find(t=>t.id==='007'),tasks),true)
assert.deepEqual(tasks.filter(t=>['004','005','006','007'].includes(t.id)).map(t=>[t.id,t.status]),[['004','待审核'],['005','未开始'],['006','已完成'],['007','进行中']])
const saved=structuredClone(tasks);saved[0].status='待审核';saved[0].patient='PERSISTED-PATIENT';saved[0].review.push({time:'11 月 3 日 10:00',actor:'实际审核人',reviewerIdentity:{id:'reviewer-account',name:'实际审核人',role:'管理员'},status:'已提交审核',note:'保存中的实际意见'})
localStorage.setItem('clinivol-prototype-tasks',JSON.stringify(saved))
const recovered=functions.getStoredTasks()
assert.equal(recovered[0].status,'待审核');assert.equal(recovered[0].patient,'PERSISTED-PATIENT');assert.deepEqual(recovered[0].review,saved[0].review)
assert.ok(!text.includes('labStorage')&&!text.includes('experimentalTasks')&&!text.includes('normalizeExperimentTask'))
for(const file of ['cadProject.ts','CadScene.ts','cadCommands.ts','useCadHistory.ts','useCadPanels.ts'])assert.equal(fs.readFileSync('src/cad/'+file,'utf8'),execFileSync('git',['show','backup/a-before-project-dashboard-20261103:src/cad/'+file],{encoding:'utf8'}),`${file} business/geometry/persistence remains intact`)
for(const p of projects){assert.ok(p.hospital!=='—');assert.equal(p.dataOrigin,'demo');assert.equal(m.projectsFor(tasks.filter(t=>t.orderNo===p.id),events)[0].hospital,p.hospital)}
const production=tasks.map(t=>({...t,dataOrigin:'production'}));assert.ok(m.projectsFor(production,events).every(p=>p.hospital==='—'),'demo hospitals never fill missing production fields')
const withHospital=production.map(t=>({...t,hospital:'已确认医院字段'}));assert.ok(m.projectsFor(withHospital,events).every(p=>p.hospital==='已确认医院字段'))
const recent=m.recentProjects(projects,events);assert.equal(recent.length,3);assert.equal(new Set(recent.map(r=>r.project.id)).size,3)
assert.equal(m.recentProjects(projects.filter(p=>p.id==='CV261020-0226'),events).length,1)
for(let i=1;i<recent.length;i++)assert.ok(new Date(recent[i-1].at)>=new Date(recent[i].at))
const sameName=projects.map(p=>({...p,name:'相同项目名称'}));assert.equal(new Set(m.recentProjects(sameName,events,9).map(r=>r.project.id)).size,5)
for(const id of ['001','002','007']){const task=tasks.find(t=>t.id===id),event=events.find(e=>e.taskId===id&&e.type===(id==='001'?'assigned':id==='002'?'review-1':'model-linked'));assert.equal(m.noticeProjectTarget({taskId:id,eventId:event.id},projects,events).projectId,task.orderNo)}
assert.equal(m.noticeProjectTarget({taskId:'007',projectId:'CV260910-0184'},projects,events),null)
assert.equal(m.noticeProjectTarget({title:'任务 007',detail:'同名项目'},projects,events),null)
assert.equal(m.noticeProjectTarget({taskId:'missing'},projects,events),null)
const flow=functionText('TaskFlow'),beforeReturn=flow.slice(flow.indexOf('  const orderTasks'),flow.indexOf('  return <InfoSection'))
const visible=new Function('task','tasks','events','taskStageOrder',ts.transpileModule(beforeReturn,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText+';return visible')
const order={三维重建:0,'CAD 设计':1,有限元分析:2,'3D 打印':3}
const flow006=visible(tasks.find(t=>t.id==='006'),tasks,events,order),flow007=visible(tasks.find(t=>t.id==='007'),tasks,events,order)
assert.ok(flow006.some(e=>e.taskId==='007'&&e.type==='created'));assert.ok(flow006.some(e=>e.taskId==='007'&&e.type==='assigned'))
assert.ok(!flow006.some(e=>e.taskId==='007'&&['started','model-linked'].includes(e.type)))
assert.ok(flow007.some(e=>e.taskId==='007'&&e.type==='started'));assert.ok(flow007.some(e=>e.taskId==='007'&&e.type==='model-linked'))
assert.equal(m.formatRecent('2026-10-23T10:08:00'),'10-23 10:08')
const clock=new Date('2026-11-03T10:30:00');assert.equal(m.formatNoticeTime('2026-11-03T10:29:50',clock),'刚刚');assert.equal(m.formatNoticeTime('2026-11-03T10:25:00',clock),'10:25');assert.equal(m.formatNoticeTime('2026-11-03T08:40:00',clock),'08:40');assert.equal(m.formatNoticeTime('2026-11-02T09:00:00',clock),'11-02 09:00')
console.log('PASS: A task identities/states/persistence, unchanged CAD geometry/data/history, hospital provenance, statistics, project aggregation, notice identities and stage-gated task events')
