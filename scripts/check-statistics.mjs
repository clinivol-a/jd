import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const module={exports:{}}
new Function('module','exports',ts.transpileModule(fs.readFileSync('src/projects/projectModel.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText)(module,module.exports)
const m=module.exports,projects=m.withDemoProjects([]),tasks=projects.flatMap(p=>p.tasks),now=new Date('2026-11-03T12:00:00'),range=m.periodRange('month',now)
const counts=m.aDashboardCounts(tasks,[],now)
assert.deepEqual(counts,{待处理:4,进行中:2,待审核:2,审核退回:2,已完成:6})
for(const [status,count] of Object.entries(counts)){
 const rows=m.filterTasks(projects,{...m.defaultFilters(),view:'tasks',source:'a-statistics',period:'month',range,status})
 assert.equal(rows.length,count,status)
 const pages=Array.from({length:Math.ceil(rows.length/6)},(_,i)=>rows.slice(i*6,i*6+6)).flat()
 assert.equal(new Set(pages.map(r=>r.task.id)).size,count)
}
const extra={...tasks[0],id:'PRIVATE',owner:'其他员工'},old={...tasks[0],id:'OCTOBER',updated:'2026-10-20T10:00:00'},eventTask={...tasks[0],id:'EVENT',updated:'刚刚'}
const event={id:'activity',taskId:eventTask.id,orderNo:eventTask.orderNo,at:'2026-11-02T10:00:00Z'}
assert.ok(!m.statisticsTasks([...tasks,extra,old],range).some(t=>['PRIVATE','OCTOBER'].includes(t.id)))
assert.ok(m.statisticsTasks([eventTask],range,[event]).length===1)
assert.equal(m.statisticsTasks([eventTask],range,[{...event,orderNo:'foreign'}]).length,0)
assert.equal(m.statisticsTasks([...tasks,...tasks],range).length,m.statisticsTasks(tasks,range).length)
assert.ok(!fs.readFileSync('src/App.tsx','utf8').includes('当前没有需要处理的系统通知。'))
console.log('PASS: all five card/list counts, monthly range, account access, demo parity, event identity, unique paged tasks and removed placeholder notice',counts)
