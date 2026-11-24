import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {UnifiedBusinessService} from '../server/unified/service.mjs';
const temp=await mkdtemp(tmpdir()+'/cv-unified-projections-');
async function bundle(path,name){const outfile=temp+'/'+name+'.mjs';await build({entryPoints:[path],bundle:true,platform:'node',format:'esm',outfile});return import(pathToFileURL(outfile));}
const pm=await bundle('src/projects/projectModel.ts','projects'),client=await bundle('src/business/unifiedClient.ts','client');
test.after(()=>rm(temp,{recursive:true,force:true}));

test('a shared project expands to four independent task rows and searches only its visible business number',()=>{
 const actor={id:'sales',name:'李明',role:'sales',status:'approved',permissions:['sales:landing']},admin={id:'admin',name:'负责组长',role:'leader',hospitalIds:['H'],status:'approved',permissions:['orders:read','orders:review','tasks:assign']},engineer={id:'engineer',name:'已授权工程师',role:'designer',status:'approved',permissions:['projects:own']};
 const service=new UnifiedBusinessService({directoryProvider:()=>({salesScopes:{sales:['H']},hospitals:[{id:'H',name:'江淮协同医院',departments:['骨科'],leaderId:admin.id}],doctors:[{id:'D',hospitalId:'H',department:'骨科',salesId:actor.id,status:'审核通过'}],engineers:[{id:engineer.id,name:engineer.name,stages:[0,1,2,3],status:'已启用'}]})});
 const o=service.save(actor,{order:{id:'internal-order',name:'颌面业务',hospitalId:'H',department:'骨科',doctorId:'D',quantity:1,patientName:'合成身份',patientSex:'女',patientIdentityRef:'private-ref',service:'数字模型',clinicalRequirements:'术前结构评估',due:'2027-12-31',plannedStages:['3D打印','CAD设计','有限元分析','三维重建'],materials:[{name:'影像.nii',category:'imaging',status:'success',storage:'browser'}]}},{submit:true});
 service.manage(admin,{action:'review-order',id:o.id,version:o.version,result:'approved',confirmedDeliveryDate:'2027-12-31'});
 for(const task of service.state.tasks)service.manage(admin,{action:'assign-task',id:task.id,version:task.version,assignee:engineer.id,plannedDate:'2027-12-30'});
 const snapshot=service.designerSnapshot(engineer),projects=pm.projectsFor(snapshot.tasks,snapshot.events),f={...pm.defaultFilters(),range:['','']};
 assert.equal(projects.length,1);assert.equal(pm.projectNumber(projects[0]),o.businessNo);assert.notEqual(projects[0].id,o.id);assert.notEqual(projects[0].id,o.businessNo);
 const rows=pm.filterTasks(projects,f);assert.deepEqual(rows.map(r=>r.task.taskType),pm.stages);assert.equal(new Set(rows.map(r=>r.task.id)).size,4);assert.equal(new Set(rows.map(r=>pm.projectNumber(r.project))).size,1);
 assert.equal(pm.filterTasks(projects,{...f,search:o.businessNo}).length,4);assert.equal(pm.filterProjects(projects,{...f,search:o.businessNo}).length,1);assert.equal(pm.filterTasks(projects,{...f,search:projects[0].id}).length,0);
 assert.ok(pm.canEnter(rows[0].task,snapshot.tasks));assert.equal(pm.canEnter(rows[1].task,snapshot.tasks),false);
 assert.equal(pm.projectEvents(projects[0],snapshot.events).length,snapshot.events.length);assert.ok(snapshot.events.every(e=>e.orderId===o.id&&e.orderNo===projects[0].id));assert.ok(snapshot.events.some(e=>e.type==='order-submit'&&e.projectId===null));
});
test('sales cache replaces only authoritative shared records and preserves local history and read state',()=>{
 const current={orders:[{id:'old',status:'已完成'},{id:'shared',source:'isolated-shared',status:'草稿'},{id:'removed',source:'isolated-shared'}],projects:[],events:[{id:'history',title:'旧历史'},{id:'event',source:'isolated-shared',read:true}]};
 const shared={orders:[{id:'shared',source:'isolated-shared',businessNo:'CV-2026-0001',status:'待审核'}],projects:[],events:[{id:'event',source:'isolated-shared',read:false}]};
 const merged=client.mergeSharedSales(current,shared);assert.deepEqual(merged.orders.map(o=>o.id),['old','shared']);assert.equal(merged.orders[1].businessNo,'CV-2026-0001');assert.equal(merged.events[0].id,'history');assert.equal(merged.events[1].read,true);assert.equal(current.orders[1].status,'草稿');
});

test('linked-only projections exclude archived business while preserving doctor activity and read state',()=>{
 const current={orders:[{id:'archived'},{id:'live',source:'isolated-shared'}],projects:[{id:'archived-project'}],events:[{id:'old-order',target:'archived'},{id:'doctor',target:'doctor-1'},{id:'live-event',target:'live',source:'isolated-shared',read:true}]};
 const shared={catalogMode:'linked-only',orders:[{id:'live',source:'isolated-shared',businessNo:'CV-2026-0001'}],projects:[{id:'project-1',orderId:'live'}],events:[{id:'live-event',target:'live',source:'isolated-shared',read:false}]};
 const next=client.mergeSharedSales(current,shared);assert.deepEqual(next.orders.map(o=>o.id),['live']);assert.deepEqual(next.events.map(e=>e.id),['doctor','live-event']);assert.equal(next.events[1].read,true);assert.equal(current.orders.length,2);assert.equal(next.presentationRevision,28);
 const tasks=[{id:'task',sharedBusiness:true,accessible:true,assigneeId:'engineer',catalogDemo:true,projectId:'project-1',orderId:'live',orderNo:'project-1',businessNo:'CV-2026-0001',title:'联合修复',owner:'陈屿',taskType:'三维重建',status:'未开始',patient:'ref',series:[],review:[],projectCreatedAt:'2026-11-23',agreedDueAt:'2026-12-21'}];assert.equal(pm.withDemoProjects(pm.projectsFor(tasks,[])).length,1);
});
