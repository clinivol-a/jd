const administratorRoles=new Set(['admin','super_admin','管理员','超级管理员']);
// Display role labels without changing the underlying account identity or audit record.
export function auditActorLabel(event,identity){
 const role=event.actorRole||event.role||identity?.role;
 return administratorRoles.has(role)||(!role&&event.actorId==='super-admin')||administratorRoles.has(event.actor)?'管理员':event.actor;
}
