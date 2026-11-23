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
test('all known designer demo projects have project delivery dates, independent of task deadlines and without overriding confirmed orders',()=>{
 const legacy=Object.keys(pm.demoProjectMetadata).map((orderNo,i)=>({id:`legacy-${i}`,orderNo,title:'旧演示项目',owner:'陈屿',patient:'synthetic',taskType:'三维重建',status:'进行中',deadline:'2027-12-31T18:00:00',series:[],review:[]}));
 const tasks=[...legacy,...pm.withDemoProjects([]).flatMap(p=>p.tasks)],before=structuredClone(tasks);
 const projects=pm.projectsFor(tasks,[],now);assert.equal(projects.length,13);assert.ok(projects.every(p=>/^2026-\d{2}-\d{2}$/.test(p.agreedDueAt)));
 const rows=pm.filterTasks(projects,{...pm.defaultFilters(),range:['',''],stage:'全部',status:'全部'});assert.ok(rows.every(r=>r.project.agreedDueAt));assert.deepEqual(tasks,before);
 for(const task of legacy){const first=projects.find(p=>p.id===task.orderNo);const changed=pm.projectsFor([{...task,deadline:'2028-01-01T00:00:00'}],[],now)[0];assert.equal(changed.agreedDueAt,first.agreedDueAt);}
 const known=legacy[0];assert.equal(pm.projectsFor([{...known,dataOrigin:'production'}],[],now)[0].agreedDueAt,undefined);
 const shared={...known,sharedBusiness:true,accessible:true,agreedDueAt:'2026-12-18',projectCreatedAt:'2026-11-20',assigneeId:'chen-yu'};assert.equal(pm.projectsFor([shared],[],now)[0].agreedDueAt,'2026-12-18');
});
test('review submissions do not impersonate reviewers and mirrored event IDs remain traceable',()=>{
 const task={...pm.withDemoProjects([])[0].tasks[0],id:'audit-task',orderNo:'audit-project',catalogDemo:false,review:[{time:'2026-11-02T08:30:00',actor:'陈屿',status:'已提交审核',note:'提交资料'},{time:'2026-11-02T09:00:00',actor:'管理员',reviewerIdentity:{name:'周景明',id:'admin'},status:'审核通过',note:'确认'}]};
 const events=[{id:'submission-event',taskId:task.id,orderNo:task.orderNo,type:'review-submit',name:'提交审核',at:'2026-11-02T08:30:00',actor:'陈屿',role:'工程师',description:'提交资料'}];const before=structuredClone({task,events});const rows=reviewRecords([task],events);
 assert.equal(rows.length,2);assert.equal(rows[0].reviewerName,'周景明');assert.equal(rows[1].reviewerName,'-');assert.equal(rows[1].submitter,'陈屿');assert.equal(rows[1].actor,'陈屿');assert.equal(rows[1].eventId,'submission-event');assert.deepEqual({task,events},before);
});
test('current numbering authorization preserves all non-adapter UI, auth, CAD and tokens',async()=>{
 const {createHash}=await import('node:crypto');const hashes=JSON.parse(await readFile('docs/repairs/v38-sales-designer-20261120/baseline-hashes.json','utf8'));
 const allowed=new Set(['src/admin/AdminTable.tsx','src/sales/business/InsuranceSummary.tsx','src/design-system/tdesign.tsx','src/sales/sales.css','src/projects/projectPages.css','src/sales/ClinicalEditor.tsx','src/sales/clinicalContent.mjs','src/sales/clinicalContent.d.mts','src/sales/orderRules.mjs','src/sales/orderFixtures.mjs','src/sales/orderFixtures.d.mts','src/sales/migrate.ts','src/App.tsx','src/projects/ProjectPages.tsx','src/projects/projectModel.ts','src/reviewRecords.ts','src/sales/OrderPages.tsx','src/sales/SalesWorkspace.tsx','src/sales/dashboardBusiness.d.mts','src/sales/dashboardBusiness.mjs','src/sales/model.ts','src/sales/orderNumber.mjs','src/sales/orderNumber.d.mts','src/admin/AdminWorkspace.tsx','src/admin/model.ts','server/admin/dev.mjs','server/admin/http.mjs','server/admin/service.mjs']);
 for(const [file,hash] of Object.entries(hashes)){if((!file.startsWith('src/')&&!file.startsWith('server/'))||allowed.has(file))continue;assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),hash,file);}
 const {execFileSync}=await import('node:child_process');const baseline=file=>execFileSync('git',['show','2cef945f91353752fe0c2f682f5303ab00ffb0af:'+file],{encoding:'utf8'});
 const current=await readFile('src/App.tsx','utf8'),prior=execFileSync('git',['show','dcbab47:src/App.tsx'],{encoding:'utf8'});
 const header=x=>x.slice(x.indexOf('export function GlobalHeader('),x.indexOf('function PlatformShell('));assert.equal(header(current),header(prior),'Header remains unchanged');
 const professional=x=>x.slice(x.indexOf('function Workspace('));assert.equal(professional(current),professional(prior),'Professional workspaces remain unchanged');
});
