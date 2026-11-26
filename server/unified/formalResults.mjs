const validTime=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const same=(a,b)=>a.id===b.id&&a.version===b.version;
export function taskArtifact(state,task,ref){
 return ref&&state.artifacts.find(a=>same(a,ref)&&a.taskId===task.id&&a.projectId===task.projectId&&a.orderId===task.orderId&&(a.stage===undefined||a.stage===task.stage));
}
function approvalEvidence(state,task,a){
 const review=state.events.find(e=>e.type==='review-pass'&&e.taskId===task.id&&e.orderId===a.orderId&&e.resultId===a.id&&e.resultVersion===a.version&&validTime(e.at));
 const at=a.reviewedAt||review?.at||task.approvedModel?.approvedAt;
 return validTime(at)&&a.reviewStatus==='审核通过'?{at,by:a.reviewerId||review?.actorId||null}:null;
}
/** Freeze only an existing, exactly related official selection with approval evidence.
 * This compatibility step does not create or rewrite any review/lock audit event. */
export function restoreFormalLocks(state){
 let changed=false;
 for(const task of state.tasks){const a=taskArtifact(state,task,task.approvedModel),e=a&&approvalEvidence(state,task,a);if(!a||!e||a.locked===true)continue;
  if(a.locked===false||a.lockedAt)continue;
  a.locked=true;a.lockedAt=e.at;a.lockedBy=e.by;a.lockOrigin='existing-approved-selection';changed=true;
 }return changed;
}
export function formalArtifact(state,task){
 const a=task&&taskArtifact(state,task,task.approvedModel);
 return a?.locked===true&&a.reviewStatus==='审核通过'&&validTime(a.lockedAt)?a:null;
}
export function guardFormalVersions(before,after){
 for(const a of before.artifacts.filter(a=>a.locked===true)){
  const next=after.artifacts.find(r=>same(r,a));
  if(!next||JSON.stringify(next)!==JSON.stringify(a))throw Object.assign(Error('正式锁定成果不可覆盖或删除，请提交新版本。'),{status:409});
 }
}
export const formalReference=a=>({id:a.id,version:a.version,taskId:a.taskId,projectId:a.projectId,orderId:a.orderId});
