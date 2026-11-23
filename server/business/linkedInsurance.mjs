import {validIdentity} from '../../src/sales/patientRules.mjs';
/** Read-only insurance projection. The catalog must come from a trusted server provider, never the posted sales snapshot. */
export function linkedInsuranceRows(service,user) {
 const catalog=service.sharedCatalog?.(user);
 if(!catalog||catalog.catalogMode!=='linked-only')return null;
 service.permitted(user);
 return catalog.orders.filter(o=>o.ownerSalesId===user.id&&o.status==='已完成').map(o=>{
  const project=catalog.projects.find(p=>p.id===o.projectId&&p.orderId===o.id);
  const tasks=project?catalog.tasks.filter(t=>project.taskIds.includes(t.id)&&t.projectId===project.id&&t.orderId===o.id):[];
  const approved=tasks.filter(t=>t.status==='已完成').sort((a,b)=>a.stage-b.stage).flatMap(t=>catalog.artifacts.filter(a=>a.id===t.approvedModel?.id&&a.version===t.approvedModel?.version&&a.orderId===o.id&&a.projectId===project.id&&a.taskId===t.id&&a.reviewStatus==='审核通过'&&a.reviewedAt).map(a=>({a,t})));
  // The existing display model is an explicit isolated synthetic resource, never a clinical result fallback.
  const result=approved.find(({a,t})=>user.demoBusiness&&catalog.source==='isolated-shared'&&o.demoScenario==='linked-business-20261123-v1'&&t.demoScenario===o.demoScenario&&a.synthetic===true&&t.workspace?.assetId==='shared-jaw-demonstration');
  const patient=service.state.patients[o.patientIdentityRef];let identity='',sex=['男','女'].includes(o.patientSex)?o.patientSex:'';
  if(patient?.owner===user.id){try{const v=service.unseal(patient.record);if(v.sex===o.patientSex&&validIdentity(v.identityNumber)){identity=v.identityNumber;sex=v.sex}}catch{}}
  const image=result?service.linkedResultImage?.({order:o,task:result.t,artifact:result.a}):null;
  const issues=[...(!o.businessNo?['订单编号']:[]),...(!o.name?['手术项目名称']:[]),...(!sex?['患者性别']:[]),...(!identity?['身份证号']:[]),...(!image?.length?['已审核成果图片']:[])];
  return {id:o.id,businessNo:o.businessNo||'-',owner:user.id,status:o.status,hospital:catalog.hospitals?.find(h=>h.id===o.hospitalId)?.name||'',patientName:o.patientName,surgery:o.name||'',sex,identityNumber:identity,completedAt:o.completedAt,projectId:project?.id,resultId:result?.a.id,resultVersion:result?.a.version,taskId:result?.t.id,image,issues,dataOrigin:'isolated-shared-insurance'};
 });
}
