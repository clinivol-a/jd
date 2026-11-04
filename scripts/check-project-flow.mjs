import { loadTs } from './load-ts.mjs'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const m=loadTs('src/projects/projectModel.ts'),projects=m.withDemoProjects([])
for(const p of projects){
 const before=JSON.stringify(p),rows=m.projectEvents(p,[])
 assert.ok(rows.length>0,p.id)
 assert.equal(new Set(rows.map(e=>e.id)).size,rows.length)
 assert.ok(rows.every(e=>e.orderNo===p.id&&p.tasks.some(t=>t.id===e.taskId)))
 assert.ok(rows.every((e,i)=>i===0||rows[i-1].at>=e.at))
 assert.ok(!rows.some(e=>e.type==='waiting'||e.name==='等待解锁'))
 for(const t of p.tasks){
  const events=rows.filter(e=>e.taskId===t.id),types=events.map(e=>e.type)
  assert.ok(types.includes('assigned'))
  if(t.status==='未开始')assert.deepEqual(types,['assigned'])
  else assert.ok(types.includes('started'))
  if(t.status==='进行中')assert.ok(!types.some(k=>['review-submit','review-pass','review-return','completed'].includes(k)))
  if(t.status==='待审核')assert.ok(types.includes('review-submit')&&!types.some(k=>['review-pass','review-return','completed'].includes(k)))
  if(t.status==='审核退回')assert.ok(types.includes('review-return')&&types.includes('review-submit')&&!types.includes('completed'))
  if(t.status==='已完成')assert.ok(types.includes('review-pass')&&types.includes('completed'))
  const get=type=>events.find(e=>e.type===type)
  if(get('review-submit'))assert.ok(get('started').at<get('review-submit').at)
  if(get('review-pass'))assert.ok(get('review-submit').at<get('review-pass').at)
  if(get('completed'))assert.ok(get('review-pass').at<get('completed').at)
  if(get('linked')){const upstream=rows.find(e=>e.taskId===t.upstreamTaskId&&e.type==='completed');assert.ok(upstream&&upstream.at<get('linked').at);assert.ok(get('linked').at<get('started').at)}
 }
 assert.equal(JSON.stringify(p),before)
 // Current-state changes and adding planned stages never manufacture audit history.
 const changed=structuredClone(p);changed.tasks.forEach(t=>t.status='已完成')
 changed.tasks.push({...changed.tasks[0],id:'FUTURE',taskType:'3D 打印'})
 assert.deepEqual(m.projectEvents(changed,[]),rows)
}
const combo=projects.find(p=>p.tasks.length===4),rows=m.projectEvents(combo,[])
assert.equal(rows[0].taskId,'P301-2');assert.equal(rows[0].type,'started')
const actual={id:'real-later-event',orderNo:combo.id,taskId:'P301-4',type:'comment',name:'审核讨论',at:'2026-11-03T10:00:00Z',actor:'实际审核人',role:'授权审核人',description:'保留已发生的操作'}
const merged=m.projectEvents(combo,[actual,actual,{...actual,id:'foreign',orderNo:'another-order'}])
assert.equal(merged.filter(e=>e.id===actual.id).length,1);assert.deepEqual(merged[0],actual)
assert.ok(!merged.some(e=>e.id==='foreign'))
assert.deepEqual(m.projectEvents({...combo,dataOrigin:'production'},[actual]),[actual])
assert.deepEqual(m.demoFlowEvents({...combo,id:'unknown-demo'}),[])
console.log('PASS: all 8 demo projects, stage states/dependencies/chronology, four-stage latest CAD start, no future inference, unique scoped events and untouched actual audit records')
