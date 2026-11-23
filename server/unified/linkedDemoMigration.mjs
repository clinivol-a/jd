import {randomUUID,createHash} from 'node:crypto';
import {UnifiedBusinessService} from './service.mjs';
import {fixtureAttachments} from '../../src/sales/orderFixtures.mjs';
import {designStages} from '../../src/sales/orderRules.mjs';

export const linkedDemoRevision='linked-business-20261123-v1';
const copy=value=>structuredClone(value);
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
/** Explicitly synthetic, local-only scenario construction. It never imports guessed legacy joins. */
function buildOnStaged(service,{inventory,seller,admin,engineerId='chen-yu',now=Date.now()}) {
 if(process.env.NODE_ENV==='production'||process.env.VERCEL||process.env.AUTH_PUBLIC_ORIGIN)throw Error('Local isolated migration only');
 service.actor(admin,'super_admin','orders:review');service.sales(seller);service.reload();
 const prior=service.state.migrations?.find(m=>m.revision===linkedDemoRevision);
 if(prior)return copy(prior);
 if(inventory.sales.ownerId!==seller.id)throw Error('Sales owner mismatch');
 const retained=service.state.orders.map(o=>o.id),retainedProjects=service.state.projects.map(p=>p.id);
 const legacyOrders=inventory.sales.orders.filter(o=>!retained.includes(o.id));
 const legacyProjects=inventory.projects.filter(p=>!retainedProjects.includes(p.id));
 const original=copy(service.state),clock=service.now;
 let at=now-14*86400000;service.now=()=>at+=60000;
 const scenarioId=linkedDemoRevision,created=[];
 const log=(actor,o,title,type,extra={})=>service.event(actor,o,title,type,{...extra,synthetic:true,demoScenario:scenarioId,auditOrigin:'isolated-scenario'});
 try {
  // Archive first; IDs, materials and histories are copied verbatim. No local storage is cleared.
  service.transaction(()=>{service.state.legacyArchives||=[];service.state.legacyArchives.push({revision:scenarioId,at:new Date(now).toISOString(),inventoryHash:hash(inventory),orders:copy(legacyOrders),projects:copy(legacyProjects),tasks:copy(inventory.tasks.filter(t=>legacyProjects.some(p=>p.tasks.some(r=>r.id===t.id)))),events:copy(inventory.events)});return true});
  const template=original.orders.find(o=>o.ownerSalesId===seller.id&&o.status==='处理中');
  if(!template)throw Error('An existing verified linked order is required');
  const workspace=inventory.tasks.find(t=>t.id==='001');
  const specs=[
   ['颅颌面结构重建','未开始',4],['下颌骨修复设计','未开始',2],['眶颧结构重建','未开始',1],
   ['颌面缺损修复规划','进行中',4],['个体化定位导板','进行中',2],['上颌骨数字模型','进行中',1],
   ['颅骨修复体设计','待审核',4],['下颌骨定位导板','待审核',2],['颌骨边界重建','待审核',1],
   ['颌面结构修复','审核退回',4],['骨缺损数字模型','审核退回',1],
   ['颅骨缺损修复规划','已完成',4],['颌面导板设计','已完成',2],['术前骨性结构模型','已完成',1],
  ];
  function input(i,name,count){return {id:`DEMO-LINK-20261123-${String(i+1).padStart(2,'0')}`,name,quantity:1,hospitalId:template.hospitalId,doctorId:template.doctorId,department:template.department,caseId:template.caseId,patientName:template.patientName,patientSex:template.patientSex,patientIdentityRef:template.patientIdentityRef,service:template.service,clinicalRequirements:template.clinicalRequirements,designRequirements:template.designRequirements||template.clinicalRequirements,requirements:template.requirements,requestedDueDate:new Date(now+28*86400000).toISOString().slice(0,10),plannedStages:designStages.slice(0,count),materials:fixtureAttachments(seller.id,`DEMO-LINK-20261123-${String(i+1).padStart(2,'0')}`,new Date(at).toISOString())};}
  function accepted(i,name,count){let o=service.save(seller,{order:input(i,name,count)});o=service.save(seller,{order:o,version:o.version},{submit:true});service.manage(admin,{action:'takeover',id:o.id,version:o.version,reason:'核对需求资料及设计阶段分配。'});o=service.state.orders.find(r=>r.id===o.id);service.manage(admin,{action:'review-order',id:o.id,version:o.version,result:'approved',reason:'资料齐全，按约定交付时间受理。',confirmedDeliveryDate:o.requestedDueDate});return service.state.orders.find(r=>r.id===o.id);}
  function reviewFixture(t,result){service.transaction(()=>{t=service.state.tasks.find(r=>r.id===t.id);const o=service.state.orders.find(r=>r.id===t.orderId),artifact=service.state.artifacts.find(a=>a.id===t.review.at(-1).submissionId),stamp=new Date(service.now()).toISOString(),note=result==='approved'?'审核通过':'请复核缺损边界连续性及定位区域。';artifact.reviewStatus=result==='approved'?'审核通过':'审核退回';artifact.reviewedAt=stamp;artifact.reviewerId=admin.id;artifact.synthetic=true;t.status=result==='approved'?'已完成':'审核退回';t.review.push({time:stamp,actor:admin.name,status:result==='approved'?'审核通过':'审核退回',note,version:artifact.version,reviewerIdentity:{id:admin.id,name:admin.name,role:admin.role},submissionId:artifact.id,synthetic:true});if(result==='approved')t.approvedModel={id:artifact.id,name:`${designStages[t.stage]}成果`,version:artifact.version,approvedAt:stamp,approvedBy:admin.name};t.version++;t.updatedAt=stamp;log(admin,o,result==='approved'?'审核通过':'审核退回',result==='approved'?'review-pass':'review-return',{taskId:t.id,resultId:artifact.id,resultVersion:artifact.version,submissionId:artifact.id,version:artifact.version,at:stamp,reason:note});if(result==='approved')log(admin,o,'任务已完成','completed',{taskId:t.id});return true});}
  for(const [index,[name,status,count]] of specs.entries()){
   at=now-(14-index)*86400000;
   const o=accepted(index,name,count),p=service.state.projects.find(p=>p.id===o.projectId);
   for(const id of p.taskIds){const t=service.state.tasks.find(t=>t.id===id),person=service.directoryProvider().engineers.find(e=>e.stages.includes(t.stage)&&e.status==='已启用'&&(t.stage<2?e.id===engineerId:true));if(!person)throw Error('No authorized stage assignee');service.manage(admin,{action:'assign-task',id:t.id,version:t.version,assignee:person.id,plannedDate:o.confirmedDeliveryDate});service.transaction(()=>{const task=service.state.tasks.find(r=>r.id===id);task.workspace={assetId:'shared-jaw-demonstration',series:task.stage===0?copy(workspace?.series||[]):[]};task.demoScenario=scenarioId;return true});}
   if(status!=='未开始'){
    const all=service.state.tasks.filter(t=>t.projectId===p.id),activeIndex=status==='进行中'&&count>=2?1:0;
    for(const [i,t] of all.entries()){
     if(status!=='已完成'&&i>activeIndex)break;
     const actor={id:t.assignee,name:service.directoryProvider().engineers.find(e=>e.id===t.assignee).name,role:'designer',status:'approved',permissions:['projects:own']};
     service.taskCommand(actor,{id:t.id,action:'start',version:service.state.tasks.find(r=>r.id===t.id).version});
     if(status==='进行中'&&i===activeIndex)break;
     const current=service.state.tasks.find(r=>r.id===t.id);service.taskCommand(actor,{id:t.id,action:'submit',version:current.version,artifact:{id:`RESULT-${randomUUID()}`,version:'V01'}});
     if(status==='待审核')break;
     reviewFixture(t,status==='审核退回'?'returned':'approved');
    }
   }
   service.transaction(()=>{const row=service.state.orders.find(r=>r.id===o.id);row.demoScenario=scenarioId;if(status==='已完成'){if(service.state.tasks.some(t=>t.orderId===row.id&&t.status!=='已完成'))throw Error('Incomplete required task');row.status='已完成';row.completedAt=row.updated=new Date(service.now()).toISOString();row.version++;log(admin,row,'订单已完成','order-completed')}return true});created.push({orderId:o.id,businessNo:o.businessNo,projectId:p.id,status,taskIds:p.taskIds});
  }
  // Sales-only pre-acceptance states are intentionally not exposed as designer projects.
  for(const [offset,name,status] of [[14,'骨性结构重建申请','草稿'],[15,'个体化修复体申请','待审核'],[16,'定位导板需求复核','审核退回'],[17,'矫形方案取消申请','已取消']]){
   at=now-3600000;
   let o=service.save(seller,{order:input(offset,name,2)});
   if(status!=='草稿')o=service.save(seller,{order:o,version:o.version},{submit:true});
   if(status==='审核退回'){service.manage(admin,{action:'takeover',id:o.id,version:o.version,reason:'核对需求资料及设计阶段分配。'});o=service.state.orders.find(r=>r.id===o.id);service.manage(admin,{action:'review-order',id:o.id,version:o.version,result:'returned',reason:'请补充定位区域及固定孔位要求。'});}
   if(status==='已取消')service.transaction(()=>{const row=service.state.orders.find(r=>r.id===o.id);row.status='已取消';row.reason='需求方确认暂缓本次服务。';row.updated=new Date(service.now()).toISOString();row.version++;log(admin,row,'订单已取消','order-cancelled',{reason:row.reason});return true});
   service.transaction(()=>{service.state.orders.find(r=>r.id===o.id).demoScenario=scenarioId;return true});
  }
  return service.transaction(()=>{service.state.catalogMode='linked-only';for(const event of service.state.events)if(!retained.includes(event.orderId)){event.synthetic=true;event.demoScenario=scenarioId;event.auditOrigin='isolated-scenario'}const record={revision:scenarioId,at:new Date(now).toISOString(),retainedOrders:retained,retainedProjects,archivedOrderIds:legacyOrders.map(o=>o.id),archivedProjectIds:legacyProjects.map(p=>p.id),created,inventoryHash:hash(inventory)};(service.state.migrations||=[]).push(record);return record});
 }catch(error){service.state=original;throw error;}finally{service.now=clock;}
}

/** Plan the entire migration off-disk, then commit once under the existing database lock. */
export function buildLinkedDemo(service,options) {
 service.reload();const before=hash(service.state);
 const staged=new UnifiedBusinessService({directoryProvider:service.directoryProvider,now:service.now});staged.state=copy(service.state);
 const result=buildOnStaged(staged,options);
 // One-time resource/active-CAD fixture upgrade, only for this migration's untouched synthetic records.
 if(!result.assetRevision){
  for(const t of staged.state.tasks.filter(t=>t.demoScenario===linkedDemoRevision))t.workspace={...t.workspace,assetId:'shared-jaw-demonstration'};
  for(const orderId of ['DEMO-LINK-20261123-04','DEMO-LINK-20261123-05']){
   const o=staged.state.orders.find(o=>o.id===orderId),tasks=staged.state.tasks.filter(t=>t.orderId===orderId).sort((a,b)=>a.stage-b.stage),first=tasks[0],second=tasks[1];
   if(o?.demoScenario===linkedDemoRevision&&first?.status==='进行中'&&!first.review.length&&second?.status==='未开始'){
    const actor={id:first.assignee,name:staged.directoryProvider().engineers.find(e=>e.id===first.assignee).name,role:'designer',status:'approved',permissions:['projects:own']},artifactId=`RESULT-${randomUUID()}`;
    staged.taskCommand(actor,{id:first.id,version:first.version,action:'submit',artifact:{id:artifactId,version:'V01'}});
    staged.transaction(()=>{const t=staged.state.tasks.find(t=>t.id===first.id),a=staged.state.artifacts.find(a=>a.id===artifactId),at=new Date(staged.now()).toISOString();a.reviewStatus='审核通过';a.synthetic=true;t.status='已完成';t.version++;t.updatedAt=at;t.approvedModel={id:a.id,name:'三维重建成果',version:a.version,approvedAt:at,approvedBy:options.admin.name};t.review.push({time:at,actor:options.admin.name,status:'审核通过',note:'审核通过',version:a.version,submissionId:a.id,reviewerIdentity:{id:options.admin.id,name:options.admin.name,role:options.admin.role},synthetic:true});staged.event(options.admin,o,'审核通过','review-pass',{taskId:t.id,resultId:a.id,resultVersion:a.version,submissionId:a.id,version:a.version,at,synthetic:true,demoScenario:linkedDemoRevision,auditOrigin:'isolated-scenario'});return true});
    staged.taskCommand(actor,{id:second.id,version:second.version,action:'start'});
   }
  }
  staged.state.migrations.find(m=>m.revision===linkedDemoRevision).assetRevision=1;result.assetRevision=1;
 }


 if(!result.materialsRevision){
  for(const o of staged.state.orders.filter(o=>o.demoScenario===linkedDemoRevision)){
   if(o.materials?.every(f=>originalMaterialIds(options.inventory).has(f.id))){o.materials=fixtureAttachments(options.seller.id,o.id,new Date(staged.now()).toISOString());o.version++;staged.event(options.seller,o,'资料附件已关联','materials-linked',{synthetic:true,demoScenario:linkedDemoRevision,auditOrigin:'isolated-scenario'});}
  }
  staged.state.migrations.find(m=>m.revision===linkedDemoRevision).materialsRevision=1;result.materialsRevision=1;
 }
 for(const o of staged.state.orders.filter(o=>o.demoScenario===linkedDemoRevision)){const linked=staged.state.events.filter(e=>e.orderId===o.id&&e.type==='materials-linked').map(e=>e.at).sort().at(-1);if(linked&&linked>o.updated)o.updated=linked;}
 for(const t of staged.state.tasks.filter(t=>t.demoScenario===linkedDemoRevision))t.catalogDemo=true;
 for(const e of staged.state.events.filter(e=>e.demoScenario===linkedDemoRevision||(!result.retainedOrders.includes(e.orderId)&&staged.state.orders.some(o=>o.id===e.orderId&&o.demoScenario===linkedDemoRevision)))){
  e.synthetic=true;e.demoScenario=linkedDemoRevision;e.auditOrigin='isolated-scenario';
  if(e.resultId&&['review-submit','review-pass','review-return'].includes(e.type)){e.submissionId=e.resultId;e.version=e.resultVersion;}
  if(e.reason==='本地合成业务场景审核')e.reason='核对需求资料及设计阶段分配。';
  if(e.reason==='隔离演示资料核对通过')e.reason='资料齐全，按约定交付时间受理。';
 }
 if(hash(staged.state)===before)return result;
 return service.transaction(()=>{if(hash(service.state)!==before)throw Error('Business data changed during migration; retry from a fresh inventory');service.state=copy(staged.state);return result});
}

function originalMaterialIds(inventory){return new Set(inventory.sales.orders.flatMap(o=>(o.materials||[]).map(f=>f.id)))}
