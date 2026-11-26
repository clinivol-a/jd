const stageNames=['三维重建','CAD设计','有限元分析','3D打印'];
/** Local display-resource scenario only. Never publishes or rewrites a clinical catalog artifact. */
export function linkedShareOrder(service,user,id){
 if(process.env.NODE_ENV==='production'||!service.demoShareCodes||!user.demoBusiness)return null;
 const c=service.sharedCatalog?.(user);if(c?.source!=='isolated-shared'||c.catalogMode!=='linked-only')return null;
 const o=c.orders.find(o=>o.id===id&&o.ownerSalesId===user.id&&o.demoScenario==='linked-business-20261123-v1');if(!o||!['处理中','已完成'].includes(o.status))return null;
 const project=c.projects.find(p=>p.id===o.projectId&&p.orderId===o.id);if(!project)return null;
 const artifacts=c.tasks.filter(t=>t.orderId===o.id&&t.projectId===project.id&&project.taskIds.includes(t.id)&&t.status==='已完成'&&t.workspace?.assetId==='shared-jaw-demonstration'&&t.demoScenario===o.demoScenario).flatMap(t=>c.artifacts.filter(a=>a.id===t.approvedModel?.id&&a.version===t.approvedModel?.version&&a.orderId===o.id&&a.taskId===t.id&&a.projectId===project.id&&a.reviewStatus==='审核通过'&&a.reviewedAt&&a.synthetic===true).map(a=>({id:a.id,orderId:o.id,projectId:project.id,taskId:t.id,stage:stageNames[t.stage],version:a.version,name:t.approvedModel.name||stageNames[t.stage]+'成果',status:'审核通过',reviewStatus:'approved',publishStatus:'published',kind:'image',dataOrigin:'isolated-linked-share'})));
 if(!artifacts.length)return null;
 const doctor=c.doctors?.find(d=>d.id===o.doctorId);
 return {id:o.id,businessNo:o.businessNo,owner:user.id,projectId:project.id,status:o.status,surgery:o.name,hospital:c.hospitals?.find(h=>h.id===o.hospitalId)?.name||'',expectedRecipient:doctor?{id:doctor.id,name:doctor.name}:null,published:true,imageApproved:true,allowedPhones:['13900000001'],artifacts,dataOrigin:'isolated-linked-share'};
}
