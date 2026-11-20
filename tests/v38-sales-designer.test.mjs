import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {seedSales,transition,visibleOrders} from '../src/sales/model.ts';
import {salesBusiness} from '../src/sales/dashboardBusiness.mjs';
import {orderNumber,matchesBusinessKeyword} from '../src/sales/orderNumber.mjs';
const temp=await mkdtemp(tmpdir()+'/cv-v38-targeted-');
async function bundled(source,name){const outfile=temp+'/'+name+'.mjs';await build({entryPoints:[source],bundle:true,platform:'node',format:'esm',outfile});return import(pathToFileURL(outfile));}
const pm=await bundled('src/projects/projectModel.ts','project-model');
const {reviewRecords}=await bundled('src/reviewRecords.ts','reviews');
test.after(()=>rm(temp,{recursive:true,force:true}));
const now=new Date('2026-11-20T10:00:00+08:00'),actor={id:'li',name:'李明',permissions:[]};
test('draft/save/edit/submit/return/resubmit keep stable IDs and historical submitted number',()=>{
 let d=seedSales('li',now);const original=d.orders.find(o=>o.status==='草稿');
 const value={...original,id:'private-draft-record',name:'定向验收订单',patientName:'合成患者',due:'2026-12-20',requestedDueDate:'2026-12-20',clinicalRequirements:'评估骨骼结构',plannedStages:['三维重建'],materials:[{id:'image',name:'ct.zip',size:10,type:'application/zip',category:'imaging',status:'success',storage:'browser'}]};
 d=transition(d,{type:'order-save',value},actor,now);let o=d.orders.find(o=>o.id===value.id);assert.equal(orderNumber(o),'-');const caseId=o.caseId;
 d=transition(d,{type:'order-save',value:{...o,name:'定向验收订单修订'}},actor,now);o=d.orders.find(o=>o.id===value.id);assert.equal(o.caseId,caseId);assert.equal(orderNumber(o),'-');
 const deleted=transition(d,{type:'order-delete',target:o.id},actor,now);assert.ok(!deleted.orders.some(x=>x.id===o.id));assert.ok(deleted.cases.some(c=>c.id===caseId));
 d=transition(d,{type:'order-submit',target:o.id},actor,now);o=d.orders.find(o=>o.id===value.id);assert.equal(o.status,'待审核');assert.equal(orderNumber(o),value.id);
 d=transition(d,{type:'order-advance',target:o.id,value:'审核退回',reason:'请补充临床信息'},true,now);o=d.orders.find(o=>o.id===value.id);assert.equal(orderNumber(o),value.id);
 d=transition(d,{type:'order-save',value:{...o,clinicalRequirements:'补齐临床信息'}},actor,now);assert.equal(orderNumber(d.orders.find(o=>o.id===value.id)),value.id);
 d=transition(d,{type:'order-submit',target:o.id},actor,now);assert.equal(orderNumber(d.orders.find(o=>o.id===value.id)),value.id);assert.equal(d.orders.find(o=>o.id===value.id).caseId,caseId);
 const numbered={id:'internal-id',orderNumber:'SO-CONFIRMED',status:'审核退回'};assert.equal(orderNumber(numbered),'SO-CONFIRMED');assert.equal(orderNumber({...numbered,status:'草稿'}),'-');
});
test('all four todo kinds use stable identity and hospital IDs, not doctor names',()=>{
 const d=seedSales('li',now),base=d.doctors.find(x=>x.owner==='li');
 const [a,b]=d.hospitals;d.doctors=[{...base,id:'same-name-a',name:'同名医生',status:'审核退回',hospitalId:a.id,department:a.departments[0],owner:'li'}, {...base,id:'same-name-b',name:'同名医生',status:'草稿',hospitalId:b.id,department:b.departments[0],owner:'li'}, {...base,id:'blank-draft',status:'草稿',hospitalId:'',createdBy:'li',owner:''}];
 const orders=visibleOrders(d,now);const {items}=salesBusiness(d,orders);
 assert.deepEqual(new Set(items.map(i=>`${i.kind}/${i.status}`)),new Set(['order/草稿','order/审核退回','doctor/草稿','doctor/审核退回']));
 for(const [id,hospital] of [['same-name-a',a.name],['same-name-b',b.name]]){const row=items.find(i=>i.target===id);assert.equal(row.hospital,hospital);assert.equal(row.route,'doctor-new/'+id);assert.equal(row.orderNumber,'-');assert.ok(matchesBusinessKeyword(row,hospital));}
 assert.equal(items.find(i=>i.target==='blank-draft').hospital,'-');
 const draft=items.find(i=>i.kind==='order'&&i.status==='草稿');assert.equal(draft.orderNumber,'-');assert.ok(!matchesBusinessKeyword(draft,draft.target));assert.ok(matchesBusinessKeyword(draft,draft.object));
 const returned=items.find(i=>i.kind==='order'&&i.status==='审核退回');assert.equal(returned.orderNumber,returned.target);assert.ok(matchesBusinessKeyword(returned,returned.orderNumber));
 assert.ok(!items.some(i=>i.target==='D-6'));
});
test('task expansion remains project-grouped/stage-ordered/authorized and project-ID searchable',()=>{
 const projects=pm.withDemoProjects([]);const four=projects.find(p=>p.tasks.length===4);four.tasks.reverse();four.tasks.forEach((t,i)=>{t.updated=`2026-11-${String(20-i).padStart(2,'0')}T10:00:00`;t.deadline='2027-01-01T00:00:00'});
 const f={...pm.defaultFilters(),range:['',''],search:'',stage:'全部',status:'全部'};const rows=pm.filterTasks(projects,f);
 assert.deepEqual(rows.slice(0,4).map(r=>r.task.taskType),pm.stages);assert.ok(rows.slice(0,4).every(r=>r.project.id===four.id));assert.equal(new Set(rows.slice(0,4).map(r=>r.task.id)).size,4);
 assert.ok(rows.slice(0,4).every(r=>r.project.createdAt===four.createdAt&&r.project.agreedDueAt==='2026-11-20'));
 assert.equal(pm.filterTasks(projects,{...f,search:four.name}).length,0);assert.equal(pm.filterProjects(projects,{...f,search:four.name}).length,0);assert.equal(pm.filterTasks(projects,{...f,search:four.id}).length,4);
 assert.deepEqual(pm.filterTasks(projects,{...f,stage:'CAD 设计'}).map(r=>r.task.taskType),projects.flatMap(p=>p.tasks).filter(t=>pm.owns(t)&&t.taskType==='CAD 设计').map(t=>t.taskType));
 four.tasks[0].owner='其他人员';assert.equal(pm.filterTasks(projects,{...f,search:four.id}).length,3);
 const legacy=pm.projectsFor([{...four.tasks[1],orderNo:'legacy',catalogDemo:false}],[],now)[0];assert.equal(legacy.agreedDueAt,undefined); // Never promote a task deadline to a project contract date.
});
test('review submissions do not impersonate reviewers and mirrored event IDs remain traceable',()=>{
 const task={...pm.withDemoProjects([])[0].tasks[0],id:'audit-task',orderNo:'audit-project',catalogDemo:false,review:[{time:'2026-11-02T08:30:00',actor:'陈屿',status:'已提交审核',note:'提交资料'},{time:'2026-11-02T09:00:00',actor:'管理员',reviewerIdentity:{name:'周景明',id:'admin'},status:'审核通过',note:'确认'}]};
 const events=[{id:'submission-event',taskId:task.id,orderNo:task.orderNo,type:'review-submit',name:'提交审核',at:'2026-11-02T08:30:00',actor:'陈屿',role:'工程师',description:'提交资料'}];const before=structuredClone({task,events});const rows=reviewRecords([task],events);
 assert.equal(rows.length,2);assert.equal(rows[0].reviewerName,'周景明');assert.equal(rows[1].reviewerName,'-');assert.equal(rows[1].submitter,'陈屿');assert.equal(rows[1].actor,'陈屿');assert.equal(rows[1].eventId,'submission-event');assert.deepEqual({task,events},before);
});
test('frozen admin/auth/professional/UI sources match restored e973bd7 byte-for-byte',async()=>{
 const {createHash}=await import('node:crypto');const hashes=JSON.parse(await readFile('docs/repairs/v38-sales-designer-20261120/baseline-hashes.json','utf8'));
 const allowed=new Set(['src/App.tsx','src/projects/ProjectPages.tsx','src/projects/projectModel.ts','src/reviewRecords.ts','src/sales/OrderPages.tsx','src/sales/SalesWorkspace.tsx','src/sales/dashboardBusiness.d.mts','src/sales/dashboardBusiness.mjs']);
 for(const [file,hash] of Object.entries(hashes)){if((!file.startsWith('src/')&&!file.startsWith('server/'))||allowed.has(file))continue;assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),hash,file);}
 const {execFileSync}=await import('node:child_process');const baseline=file=>execFileSync('git',['show','e973bd7853b935d782daecc0d297c02f12927c77:'+file],{encoding:'utf8'});
 const maskApp=s=>s.replace("import {patientDisplayName} from './projects/patientDisplay'\n",'').replace('patient: string; patientName?: string;','patient: string;').replace("{ colKey: 'patient', title: '患者', width: 145, cell: ({ row }) => patientDisplayName(row) }","{ colKey: 'patient', title: '患者标识', width: 145 }").replaceAll('patientDisplayName(task)','task.patient').replaceAll('<dt>患者</dt><dd>{task.patient}</dd>','<dt>患者标识</dt><dd>{task.patient}</dd>').replace('label={`患者 · ${task.patient}`}','label={`Patient · ${task.patient}`}').replace(', StageTypeIcon','').replace(/function Reviews\([\s\S]*?(?=\nfunction Workspace\()/,'[review-table]');
 assert.equal(maskApp(await readFile('src/App.tsx','utf8')),maskApp(baseline('src/App.tsx')),'App outside the requested review table and patient name presentation');
 const detail=s=>s.slice(s.indexOf('export function ProjectDashboard(')).replace("<InfoField label=\"患者\">{project.patientName||'—'}</InfoField>",'<InfoField label="患者标识">{project.patient}</InfoField>');assert.equal(detail(await readFile('src/projects/ProjectPages.tsx','utf8')),detail(baseline('src/projects/ProjectPages.tsx')),'Dashboard and project/task details outside patient name presentation');
});
