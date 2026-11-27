export const NO_POSITION='none';
// Career position, management responsibility and professional ability are separate facts.
export const memberRoles=[{id:'employee',name:'普通员工'},{id:'leader',name:'业务组长'},{id:'administrator',name:'管理员'}];
export function accessRoles(person){
 if(Array.isArray(person?.accessRoles))return person.accessRoles.filter(r=>['leader','administrator'].includes(r));
 return ['super_admin','admin','管理员','超级管理员'].includes(person?.role)?['administrator']:['leader','业务组长'].includes(person?.role)?['leader']:[];
}
export const isBusinessLeader=p=>accessRoles(p).includes('leader');
export const isAdministrator=p=>accessRoles(p).includes('administrator');
export function positionId(person){
 if(person&&Object.hasOwn(person,'positionId'))return person.positionId||null;
 return ({designer:'designer','工程师':'designer','工程设计师':'designer','三维重建设计师':'designer','医学工程师':'designer',sales:'sales','销售':'sales',doctor:'doctor','医生':'doctor'})[person?.roleKey||person?.role]||null;
}
export const roleText=p=>accessRoles(p).map(id=>memberRoles.find(r=>r.id===id).name).join('、')||'普通员工';
