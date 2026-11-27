export type AuthAccount = { id:string; name:string; phone:string; role:'designer'|'sales'|'super_admin'|null; requestedRole:string;roleName?:string;accessRoles?:('leader'|'administrator')[];managementRole?:'leader'|'super_admin'; status:'pending'|'approved'|'rejected'|'disabled'; avatar:string; email:string; employeeId:string; organizationId?:string;organizationName?:string;reviewNote?:string;reviewVersion?:number; department:string; permissions:string[]; hasPassword:boolean; wechatBound:boolean }
export type Session = {user:AuthAccount|null;candidate:AuthAccount|null;accounts:AuthAccount[];locked:boolean;capabilities:{wechat:boolean;sms:boolean;scan:boolean;mode:string;demoUnlock?:boolean;demoScan?:boolean}}
export async function authRequest<T=Session>(action:string,body?:unknown):Promise<T>{
 const response=await fetch(`/api/auth/${action}`,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json','X-CliniVol-Request':'1'},body:body===undefined?undefined:JSON.stringify(body)})
 let result;try{result=await response.json()}catch{throw new Error('认证服务连接失败，请检查网络或联系管理员。')}
 if(!response.ok)throw new Error(result.error||'操作未完成，请稍后重试。')
 return result as T
}
