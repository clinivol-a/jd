import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {UnifiedBusinessService} from '../server/unified/service.mjs';
import {AdminService} from '../server/admin/service.mjs';
import {orderNumber} from '../src/sales/orderNumber.mjs';

const now=Date.parse('2026-11-20T10:00:00+08:00');
const seller={id:'sales-a',name:'李明',role:'sales',status:'approved',permissions:['sales:landing']};
const admin={id:'admin-a',name:'负责组长',role:'leader',hospitalIds:['H-A'],status:'approved',permissions:['orders:read','orders:review','tasks:assign','audit:read']};
const designer={id:'engineer-a',name:'工程账号',role:'designer',status:'approved',permissions:['projects:own']};
const directory={hospitals:[{id:'H-A',name:'江淮协同医院',departments:['骨科'],leaderId:admin.id}],doctors:[{id:'doctor-a',name:'周明哲',hospitalId:'H-A',department:'骨科',salesId:seller.id,status:'审核通过'}],salesScopes:{'sales-a':['H-A'],'sales-b':['H-A']},engineers:[{id:designer.id,name:designer.name,stages:[0,1,2,3],status:'已启用'}],people:[]};
function setup(t){const path=mkdtempSync(join(tmpdir(),'cv-unified-'));t.after(()=>rmSync(path,{recursive:true,force:true}));const service=new UnifiedBusinessService({directory:path,directoryProvider:()=>directory,now:()=>now});return{service,path}}
function draft(id='order-a'){return{id,name:'颌面修复规划',hospitalId:'H-A',doctorId:'doctor-a',department:'骨科',caseId:'case-a',quantity:1,patientName:'沈嘉宁',patientSex:'女',patientIdentityRef:'protected-patient-reference',service:'三维重建及数字模型',requirements:'术前结构评估',clinicalRequirements:'术前结构评估',requestedDueDate:'2026-12-10',plannedStages:['三维重建','CAD设计','有限元分析','3D打印'],materials:[{id:'protected-file-reference',name:'影像.nii',category:'imaging',storage:'browser',status:'success'}]}}
function approve(service,o){service.manage(admin,{action:'review-order',id:o.id,version:o.version,result:'approved',confirmedDeliveryDate:'2026-12-10'});return service.salesSnapshot(seller).orders.find(r=>r.id===o.id)}
test('draft is visible only to its sales owner; every management role sees it only after actual submission',t=>{
 const{service:s}=setup(t);let o=s.save(seller,{order:draft('private-draft')});
 assert(s.salesSnapshot(seller).orders.some(row=>row.id===o.id));assert(!s.salesSnapshot({...seller,id:'sales-b'}).orders.some(row=>row.id===o.id));
 for(const role of ['super_admin','admin','leader']){const actor={...admin,role};assert.equal(s.adminSnapshot(actor).orders.length,0);assert.throws(()=>s.order(actor,o.id),e=>e.status===404)}
 o=s.save(seller,{order:o,version:o.version},{submit:true});assert.equal(o.status,'待审核');assert.equal(s.adminSnapshot(admin).orders[0].id,o.id);assert.equal(s.adminSnapshot(admin).orders[0].businessNo,o.businessNo);
});

test('draft save, first submit, retries, return/resubmit, acceptance and four assigned tasks use one record',t=>{
 const{service,path}=setup(t);
 let o=service.save(seller,{order:draft()});assert.equal(orderNumber(o),'-');assert.equal(o.businessNo,null);assert.equal(service.state.projects.length,0);assert.equal(service.state.tasks.length,0);
 const restored=new UnifiedBusinessService({directory:path,directoryProvider:()=>directory,now:()=>now});assert.equal(restored.salesSnapshot(seller).orders[0].id,o.id);
 o=service.save(seller,{order:{...o,name:'修改后的规划'},version:o.version});assert.equal(o.id,'order-a');assert.equal(orderNumber(o),'-');
 o=service.save(seller,{order:o,version:o.version},{submit:true});const number=o.businessNo;assert.equal(number,'CV-2026-0001');assert.equal(o.status,'待审核');
 const retry=service.save(seller,{order:o,version:1},{submit:true});assert.equal(retry.businessNo,number);assert.equal(service.state.orders.length,1);assert.equal(service.state.sequences[2026],1);
 const adminService=new AdminService({shared:service,now:()=>now});assert.equal(adminService.snapshot(admin).orders.find(r=>r.id===o.id).businessNo,number);
 adminService.command(admin,{action:'review-order',id:o.id,version:o.version,result:'returned',reason:'补充定位范围'});
 o=service.salesSnapshot(seller).orders[0];assert.equal(o.status,'审核退回');assert.equal(o.businessNo,number);
 o=service.save(seller,{order:{...o,requirements:'已补充定位范围',clinicalRequirements:'已补充定位范围'},version:o.version},{submit:true});assert.equal(o.businessNo,number);
 o=approve(service,o);assert.equal(service.state.projects.length,1);const project=service.state.projects[0];assert.equal(project.orderId,o.id);assert.equal(o.projectId,project.id);
 const eventCount=service.state.events.length;assert.equal(approve(service,o).projectId,project.id);assert.equal(service.state.events.length,eventCount);assert.equal(service.state.projects.length,1);
 assert.equal(new Set(project.taskIds).size,4);
 for(const task of service.state.tasks)service.manage(admin,{action:'assign-task',id:task.id,version:task.version,assignee:designer.id,plannedDate:'2026-12-09'});
 const result=service.designerSnapshot(designer);assert.equal(result.tasks.length,4);assert.deepEqual(result.tasks.map(t=>t.taskType),['三维重建','CAD 设计','有限元分析','3D 打印']);
 for(const task of result.tasks){assert.equal(task.businessNo,number);assert.equal(task.orderId,o.id);assert.equal(task.projectId,project.id);assert.equal(task.orderNo,project.id);assert.equal(task.status,'未开始')}
 const again=new UnifiedBusinessService({directory:path,directoryProvider:()=>directory,now:()=>now});assert.deepEqual(again.designerSnapshot(designer),result);assert.equal(again.adminSnapshot(admin).orders[0].id,again.salesSnapshot(seller).orders[0].id);
 assert.equal(service.state.events.filter(e=>e.type==='order-submit').length,2);assert.ok(service.state.events.every(e=>e.orderId===o.id&&e.actorId));
});
test('validation and atomic failure never consume a number, and stale versions cannot overwrite state',t=>{
 const{service,path}=setup(t);assert.throws(()=>service.save(seller,{order:{...draft(),materials:[]}},{submit:true}),/上传/);assert.equal(service.state.orders.length,0);assert.deepEqual(service.state.sequences,{});
 let o=service.save(seller,{order:draft()});const saved=readFileSync(join(path,'state.json'),'utf8');
 writeFileSync(join(path,'write.lock'),'held');assert.throws(()=>service.save(seller,{order:o,version:o.version},{submit:true}),/正在更新/);assert.equal(readFileSync(join(path,'state.json'),'utf8'),saved);rmSync(join(path,'write.lock'));
 service.save(seller,{order:{...o,name:'较新草稿'},version:o.version});assert.throws(()=>service.save(seller,{order:o,version:o.version}),/记录已更新/);
});
test('unrelated accounts, unsupported capabilities and cross-hospital users are denied',t=>{
 const{service}=setup(t);const o=service.save(seller,{order:draft()},{submit:true});
 assert.equal(service.salesSnapshot({...seller,id:'sales-b'}).orders.length,0);
 assert.throws(()=>service.save({...seller,id:'sales-b'},{order:o,version:o.version}),/权限/);
 assert.equal(service.adminSnapshot({...admin,role:'leader',hospitalIds:[]}).orders.length,0);
 assert.throws(()=>service.manage({...admin,role:'leader',hospitalIds:[]},{action:'review-order',id:o.id,version:o.version,result:'approved'}),/权限/);
 const accepted=approve(service,o),task=service.state.tasks[0];assert.equal(service.designerSnapshot({...designer,id:'other'}).tasks.length,0);
 assert.throws(()=>service.taskCommand({...designer,id:'other'},{id:task.id,action:'start',version:1}),/权限/);
 assert.throws(()=>service.manage(admin,{action:'assign-task',id:task.id,version:task.version,assignee:'not-an-engineer',plannedDate:accepted.confirmedDeliveryDate}),/专业能力/);
});
test('task entry, dependency gates and submissions keep order/project/task/result/event identity',t=>{
 const{service}=setup(t);const o=approve(service,service.save(seller,{order:draft()},{submit:true}));for(const t of service.state.tasks)service.manage(admin,{action:'assign-task',id:t.id,version:t.version,assignee:designer.id,plannedDate:'2026-12-09'});
 let [first,second]=service.state.tasks;assert.throws(()=>service.taskCommand(designer,{id:second.id,action:'start',version:second.version}),/上游/);
 service.taskCommand(designer,{id:first.id,action:'start',version:first.version});first=service.state.tasks.find(t=>t.id===first.id);assert.equal(first.status,'进行中');
 service.taskCommand(designer,{id:first.id,action:'submit',version:first.version,artifact:{id:'result-a',version:'submission-1'}});first=service.state.tasks.find(t=>t.id===first.id);assert.equal(first.status,'待审核');
 const artifact=service.state.artifacts[0],event=service.state.events.find(e=>e.resultId===artifact.id);for(const r of [artifact,event]){assert.equal(r.orderId,o.id);assert.equal(r.projectId,o.projectId);assert.equal(r.taskId,first.id)}
 assert.equal(service.designerSnapshot(designer).tasks[1].upstreamApproved,false);assert.ok(!service.state.events.some(e=>e.type==='review-pass'));
});
test('independent service instances share a unique monotonic allocator',t=>{
 const{service,path}=setup(t),second=new UnifiedBusinessService({directory:path,directoryProvider:()=>directory,now:()=>now});
 const a=service.save(seller,{order:draft('a')},{submit:true}),b=second.save(seller,{order:draft('b')},{submit:true});assert.notEqual(a.businessNo,b.businessNo);assert.equal(service.salesSnapshot(seller).orders.length,2);
});

test('partial drafts persist without a formal number and deletion preserves their identity audit',t=>{
 const{service}=setup(t);const o=service.save(seller,{order:{id:'empty-draft',name:'',quantity:1,plannedStages:[],materials:[]}});
 assert.equal(o.businessNo,null);assert.equal(service.salesSnapshot(seller).orders[0].id,o.id);
 assert.throws(()=>service.save(seller,{order:o,version:o.version},{submit:true}),/授权医院/);
 service.remove(seller,{id:o.id,version:o.version});assert.equal(service.state.orders.length,0);assert.equal(service.state.sequences[2026],undefined);
 const e=service.state.events.at(-1);assert.equal(e.before.id,o.id);assert.equal(e.after,null);
});
test('verified isolated legacy return preserves original number; unknown history is never renumbered',t=>{
 const{service}=setup(t);const legacy={...draft('old-return'),status:'审核退回',demoScenario:'known-fixture',created:'2026-11-01T08:00:00Z',reason:'原退回意见'};
 service.directoryProvider=()=>({...directory,legacyOrders:[{id:legacy.id,businessNo:'SO-HISTORY-001',ownerSalesId:seller.id,doctorId:legacy.doctorId,hospitalId:legacy.hospitalId,demoScenario:'known-fixture'}]});
 const saved=service.save(seller,{order:legacy,legacy:true});assert.equal(saved.businessNo,'SO-HISTORY-001');assert.equal(saved.reason,legacy.reason);assert.equal(saved.created,legacy.created);
 const submitted=service.save(seller,{order:saved,version:saved.version},{submit:true});assert.equal(submitted.businessNo,'SO-HISTORY-001');assert.equal(service.state.sequences[2026],undefined);
 assert.equal(service.state.events[0].legacyImport,true);assert.equal(service.state.events[0].at,new Date(now).toISOString()); // No backdated invented reviewer.
 assert.throws(()=>service.save(seller,{order:{...legacy,id:'unknown-return'},legacy:true}),/核实原编号/);
 assert.equal(service.state.orders.length,1);
});
test('server project status includes other assignees without leaking their tasks or granting audit access',t=>{
 const{service}=setup(t);const o=approve(service,service.save(seller,{order:draft()},{submit:true}));const first=service.state.tasks[0];
 service.manage(admin,{action:'assign-task',id:first.id,version:first.version,assignee:designer.id,plannedDate:'2026-12-09'});
 // Existing completed milestone supplied in a temporary fixture; never written into live audit.
 first.status='已完成';
 const view=service.designerSnapshot(designer);assert.equal(view.tasks.length,1);assert.equal(view.tasks[0].projectStatus,'未开始');
 const limited=service.adminSnapshot({...admin,permissions:['orders:read']});assert.deepEqual(limited.events,[]);assert.deepEqual(limited.assets,[]);
 assert.throws(()=>service.adminSnapshot(seller),/权限/);
 const audited=service.state.events.find(e=>e.type==='order-review');assert.equal(audited.before.status,'待审核');assert.equal(audited.after.status,'处理中');assert.equal(audited.after.projectId,o.projectId);
});
