import {pendingApprovals} from './reviewRules.mjs';
import type {ClinicalContent} from '../sales/clinicalContent.mjs';
import type {Attachment} from '../sales/model';
export const STAGES=['三维重建','CAD设计','有限元分析','3D打印'];
export type Department={id:string;hospitalId:string;name:string;status:string;version:number};
export type Hospital={managementEditable?:boolean;id:string;name:string;region:string;contact:string;departments:string[];departmentRecords?:Department[];leaderId:string;status:string;version:number};
export type Person={id:string;name:string;role:string;organization:string;status:string;stages:number[];permissions:string[];scope:string[];regions?:string[];version:number;managementEditable?:boolean};
export type Doctor={salesName?:string;certificate?:string;updatedAt?:string;createdAt?:string;submissionMode?:string;managementEditable?:boolean;id:string;name:string;hospitalId:string;department:string;title:string;phone:string;status:string;source:string;submittedBy:string;salesId:string|null;invitedBy:string|null;materials:string[];version:number};
export type Order={id:string;businessNo?:string;projectId?:string;name:string;hospitalId:string;doctorId:string;salesId:string;leaderId:string;status:string;requestedStages:number[];createdAt:string;requestedDueDate:string;confirmedDeliveryDate:string|null;clinicalRequirements:string;patientRef:string;quantity?:number;reason?:string;patientName?:string;department?:string;clinicalContent?:ClinicalContent;designRequirements?:string;requirements?:string;materials?:Attachment[];ownerSalesId?:string;updated?:string;version:number};
export type Task={id:string;orderId:string;stage:number;upstreamId:string|null;status:string;assignee:string|null;plannedDate:string;version:number};
export type Asset={id:string;orderId:string;projectId:string;taskId:string;stage:number|null;name:string;version:string;reviewStatus:string;publishStatus:string;type:string;source:string;sourceFileAvailable:boolean;revision:number;reviewerId?:string};
export type Approval={id:string;type:string;applicant:string;subjectId:string;subjectName:string;organization?:string;requestedRole?:string;permissions:string[];hospitalIds:string[];basis:string;status:string;at:string;version:number;source?:string;approver?:string;reviewedAt?:string;reviewNote?:string};
export type AuditEvent={id:string;title:string;category:string;objectId:string;actor:string;actorId:string;at:string;result:string;reason:string;basis?:string;before?:unknown;after?:unknown;source:string;note?:string;noteSource?:string};
export type Material={id:string;doctorId:string;name:string;category:string;submittedBy:string;at:string};
export type Share={id:string;orderId:string;resultId:string;name:string;initiatorName:string;successCount:number;lastViewedAt?:string};
export type AdminState={salesAssignments?:Record<string,string[]>;source:string;hospitals:Hospital[];people:Person[];doctors:Doctor[];orders:Order[];tasks:Task[];assets:Asset[];approvals:Approval[];events:AuditEvent[];doctorHistory:AuditEvent[];materials:Material[];shares:Share[];readiness:{mode:string;crossRoleBusiness:boolean;professionalReviewWrite:boolean;sourceDownload:boolean}};
export async function adminRequest<T>(action='state',body?:unknown):Promise<T>{
 let response:Response;
 try{response=await fetch(`/api/admin/${action}`,{credentials:'same-origin',method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json','X-CliniVol-Request':'1'},body:body===undefined?undefined:JSON.stringify(body)})}
 catch{throw new Error('网络连接中断，请确认服务可用后重试。')}
 let result;try{result=await response.json()}catch{throw new Error('管理服务响应异常，请重试。')}
 if(!response.ok)throw Object.assign(new Error(result.error||'操作未完成，请重试。'),{status:response.status});return result;
}
export function dashboardBuckets(state:AdminState,now=new Date(),permissions?:string[]){
 const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
 return {orders:state.orders.filter(o=>o.status==='待审核'),tasks:state.tasks.filter(t=>!t.assignee&&t.status==='未开始'),reviews:pendingApprovals(state,permissions),processing:state.orders.filter(o=>o.status==='处理中'),risks:state.orders.filter(o=>o.status==='处理中'&&!!o.confirmedDeliveryDate&&o.confirmedDeliveryDate<today)};
}
