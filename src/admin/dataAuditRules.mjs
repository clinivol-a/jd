import {managementPermissionNames} from './memberPolicy.mjs';
// Read-only presentation and filtering. Stable IDs resolve relations; raw records stay intact.
export const businessLabel=value=>String(value??'').replaceAll('审批','审核').replaceAll('机构与人员','机构与成员');
const orderNo=(state,id)=>state.orders.find(o=>o.id===id)?.businessNo||'-';
export function auditOrderId(event,state){
 const candidates=[event.orderId,event.objectId,state.tasks.find(t=>t.id===event.objectId)?.orderId,state.assets.find(a=>a.id===event.objectId||a.projectId===event.objectId)?.orderId];
 return candidates.find(id=>state.orders.some(o=>o.id===id))||null;
}
export function auditObjectName(event,state){
 const orderId=auditOrderId(event,state);if(orderId)return orderNo(state,orderId);
 for(const rows of [state.doctors,state.people,state.hospitals,state.organizations,state.applicationRoles]){const row=rows?.find(r=>r.id===event.objectId);if(row)return row.name;}
 return event.objectName||state.auditObjects?.find(r=>r.id===event.objectId)?.name||(event.objectId==='认证服务'?'账号服务':event.objectId==='metadata'?'资产信息':'-');
}
export const dataAuditTheme=value=>/退回|失败|拒绝|未通过|无访问权限/.test(value)?'danger':/待审核/.test(value)?'warning':/通过|成功|已发布/.test(value)?'success':'default';
export const assetFieldKeys=()=>['order','surgery','hospital','stage','name','version','review','submitted'];
export function assetMatches(asset,state,filters={}){
 const order=state.orders.find(o=>o.id===asset.orderId),hospital=state.hospitals.find(h=>h.id===order?.hospitalId),q=(filters.query||'').trim().toLowerCase();
 return (!q||[asset.name,order?.businessNo,order?.name,hospital?.name].some(v=>String(v||'').toLowerCase().includes(q)))&&(!filters.hospitalId||order?.hospitalId===filters.hospitalId)&&(!filters.stage||String(asset.stage)===filters.stage)&&(!filters.status||asset.reviewStatus===filters.status)&&(!filters.publishStatus||asset.publishStatus===filters.publishStatus);
}
export function auditMatches(event,state,filters={}){
 const q=(filters.query||'').trim().toLowerCase(),at=new Date(event.at),date=Number.isFinite(at.getTime())?[at.getFullYear(),String(at.getMonth()+1).padStart(2,'0'),String(at.getDate()).padStart(2,'0')].join('-'):'';
 return (!q||[businessLabel(event.title),businessLabel(event.category),auditObjectName(event,state),event.actor,event.reason,event.basis].some(v=>String(v||'').toLowerCase().includes(q)))&&(!filters.category||businessLabel(event.category)===filters.category)&&(!filters.result||event.result===filters.result)&&(!filters.range?.[0]||!!date&&date>=filters.range[0])&&(!filters.range?.[1]||!!date&&date<=filters.range[1]);
}
export const chronologicalRecords=rows=>[...new Map(rows.map(r=>[r.id,r])).values()].sort((a,b)=>(Date.parse(b.at||b.submittedAt)||0)-(Date.parse(a.at||a.submittedAt)||0)||a.id.localeCompare(b.id));
const fields={name:'名称',status:'当前状态',role:'岗位',positionId:'岗位',accessRoles:'角色',positionPermissions:'岗位基础权限',requestedRole:'申请岗位',organizationId:'所属组织',hospitalId:'医院',doctorId:'医生',leaderId:'负责组长',assignee:'任务负责人',permissions:'具体权限',scope:'生效范围',regions:'区域',region:'区域',contact:'联系电话',phone:'联系电话',quantity:'需求数量',plannedDate:'计划时间',requestedDueDate:'预计交付时间',confirmedDeliveryDate:'预计交付时间',reviewStatus:'审核状态',publishStatus:'发布状态',count:'记录条数',reviewNote:'审核意见'};
const roles={super_admin:'管理员',admin:'管理员',administrator:'管理员',employee:'普通员工',none:'无专业岗位',member:'无专业岗位',sales:'销售',doctor:'医生',designer:'工程设计师',leader:'业务组长'};
const permissions={...managementPermissionNames,'sales:landing':'销售工作台','projects:own':'本人专业任务'};
export function auditChanges(event,state){
 const resolve=(key,value)=>{
  if(value===undefined||value===null||value==='')return '-';
  if(Array.isArray(value))return value.map(v=>resolve(key,v)).join('、')||'-';
  if(typeof value==='object')return '-';
  if(['status','reviewStatus','publishStatus'].includes(key))return ({pending:'待审核',approved:'审核通过',returned:'审核退回',disabled:'已停用',enabled:'已启用',active:'已启用',rejected:'审核退回'})[value]||businessLabel(value);
  if(['permissions','positionPermissions'].includes(key))return permissions[value]||({reconstruction:'三维重建',cad:'CAD设计'})[value]||'其他授权权限';
  if(['role','requestedRole','positionId','accessRoles'].includes(key))return roles[value]||state.applicationRoles?.find(r=>r.id===value)?.name||businessLabel(value);
  if(key==='organizationId')return state.organizations?.find(r=>r.id===value)?.name||'-';
  if(['hospitalId','scope'].includes(key))return state.hospitals.find(r=>r.id===value)?.name||'-';
  if(key==='doctorId')return state.doctors.find(r=>r.id===value)?.name||'-';
  if(['leaderId','assignee'].includes(key))return state.people.find(r=>r.id===value)?.name||'-';
  if(key==='phone')return String(value).replace(/^(\d{3})\d{4}(\d{4})$/,'$1****$2');
  return businessLabel(value);
 };
 const before=event.before&&typeof event.before==='object'?event.before:{},after=event.after&&typeof event.after==='object'?event.after:{};
 return Object.entries(fields).filter(([key])=>(Object.hasOwn(before,key)||Object.hasOwn(after,key))&&JSON.stringify(before[key])!==JSON.stringify(after[key])).map(([key,label])=>({id:key,label,before:resolve(key,before[key]),after:resolve(key,after[key])}));
}
// Snapshots in audit responses must never carry credentials, source bytes or unmasked identifiers.
export function auditSafeValue(value){
 if(Array.isArray(value))return value.map(auditSafeValue);
 if(!value||typeof value!=='object')return value;
 const result={};for(const [key,v] of Object.entries(value)){
  if(/password|salt|token|secret|proof|identity|idcard|credential|content|bytes|avatar|materials|download|previewKey/i.test(key))continue;
  result[key]=key==='phone'&&typeof v==='string'?v.replace(/^(\d{3})\d{4}(\d{4})$/,'$1****$2'):auditSafeValue(v);
 }return result;
}
