import {doctorSource,doctorEvent} from '../sales/doctorRecordRules.mjs';
import {auditActorLabel} from '../audit/actorLabel.mjs';
export const doctorFields=[['name','医生'],['phone','联系电话'],['hospitalId','医院'],['department','科室'],['title','职称'],['status','资质审核状态'],['source','建档来源'],['sales','负责销售'],['updated','最近更新时间']];
export function doctorSales(doctor,people=[]){
 const id=doctor.salesId!==undefined?doctor.salesId:doctor.owner;
 if(!id)return '待关联';
 return people.find(p=>p.id===id)?.name||doctor.salesName||'未记录';
}
export function doctorUpdated(doctor,events=[]){
 return [doctor.updatedAt,doctor.createdAt,...events.filter(e=>(e.objectId??e.target)===doctor.id).map(e=>e.at)].filter(v=>typeof v==='string'&&Number.isFinite(Date.parse(v))).sort((a,b)=>Date.parse(b)-Date.parse(a))[0]||'';
}
export function doctorHistory(events,id){
 const byId=new Map();
 for(const event of events){if(!event.id||(event.objectId??event.target)!==id)continue;byId.set(event.id,event);}
 return [...byId.values()].sort((a,b)=>(Date.parse(b.at)||0)-(Date.parse(a.at)||0)||a.id.localeCompare(b.id)).map(event=>{
  const mapped=doctorEvent({...event,detail:event.reason||event.note||event.detail||'',reviewNoteSource:event.noteSource||event.reviewNoteSource});
  return {...event,actor:auditActorLabel(event),title:mapped.title,detail:mapped.noteSource==='system-default'?'':mapped.detail.replace(/^退回原因：/,'' )};
 });
}
export {doctorSource};
