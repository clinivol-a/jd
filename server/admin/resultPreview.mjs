import {previewModel} from '../business/previewModel.mjs';
const fail=(message,status)=>{const error=Error(message);error.status=status;throw error};
/** Uses the same isolated professional display asset; no sharing token, approval or visit event is minted. */
export function adminResultPreview(admin,actor,resultId,resultVersion,{modelProvider=previewModel}={}){
 admin.authorize(actor,'assets:read');
 const snapshot=admin.snapshot(actor),visible=snapshot.assets.find(a=>a.id===resultId&&a.version===resultVersion);
 if(!visible)fail('成果不存在或无访问权限。',403);
 const catalog=admin.shared.state,order=catalog.orders.find(o=>o.id===visible.orderId),project=catalog.projects.find(p=>p.id===visible.projectId&&p.orderId===order?.id),task=catalog.tasks.find(t=>t.id===visible.taskId&&t.projectId===project?.id&&t.orderId===order?.id&&project.taskIds.includes(t.id)),artifact=catalog.artifacts.find(a=>a.id===resultId&&a.version===resultVersion&&a.orderId===order?.id&&a.projectId===project?.id&&a.taskId===task?.id);
 if(!order||!project||!task||!artifact)fail('成果关联记录不完整，暂无法预览。',404);
 // Only the existing named reconstruction/CAD demo resources have display derivatives.
 if(!artifact.synthetic||task.workspace?.assetId!=='shared-jaw-demonstration'||![0,1].includes(task.stage))fail('当前成果尚无可用预览资源。',404);
 const key=JSON.stringify([order.id,project.id,task.id,artifact.id,artifact.version])+'-'+(task.stage+1),model=modelProvider(key);
 if(!model?.positions?.length||!model?.indices?.length)fail('当前成果尚无可用预览资源。',404);
 return {orderId:order.id,projectId:project.id,taskId:task.id,resultId:artifact.id,resultVersion:artifact.version,model};
}
