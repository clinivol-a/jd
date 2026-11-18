/** Canonical sales display, without mutating source/audit provenance. */
export function doctorSource(doctor){
  const raw=String(doctor.source||'');
  if(doctor.submissionMode==='sales-assisted'||/销售|协助/.test(raw))return '销售建档';
  if(doctor.submissionMode==='invite'||doctor.invitedBy||/邀请|自主|CV-SALES-/.test(raw))return '医生自主建档';
  return '销售建档';
}
export const doctorEventTitles={submitted:'医生档案已提交审核',approved:'医生档案审核通过',returned:'医生档案审核退回',resubmitted:'医生档案已重新提交审核'};
const legacyTitles={'医生审核未通过':'returned','医生档案审核未通过':'returned','审核未通过':'returned','医生审核通过':'approved','医生审核退回':'returned','医生档案审核通过':'approved','医生档案审核退回':'returned','医生档案已提交审核':'submitted','医生档案已重新提交审核':'resubmitted'};
export function doctorEvent(event){
  const kind=event.doctorEvent||legacyTitles[event.title];
  const fixtureDefault=event.id?.startsWith('doctor-fixture:')&&event.title==='医生审核通过'&&event.detail==='资料审核通过。';
  const detail=fixtureDefault?'':String(event.detail||'');
  return {title:doctorEventTitles[kind]||event.title,detail:kind==='approved'?(detail.trim()?detail:'审核通过'):kind==='returned'?(detail.trim()?(detail.startsWith('退回原因：')?detail:'退回原因：'+detail):'退回原因未记录'):detail,noteSource:event.reviewNoteSource||(kind==='approved'&&!detail.trim()?'system-default':'recorded')};
}
/** Only untouched, fingerprinted synthetic fixtures may change provenance. Never user documents. */
export function migrateDoctorSources(data){
  const doctor=data.doctors.find(d=>d.id==='D-2'&&d.certificate==='DEMO-QUAL-2'&&d.name==='周明哲'&&d.phone==='19900001002'&&d.hospitalId==='H-B');
  if(!doctor||doctor.source!=='销售建档'||data.events.some(e=>e.target===doctor.id&&!e.id.startsWith('doctor-fixture:')))return data;
  doctor.source='医生自主建档';doctor.invitedBy=data.ownerId;doctor.submissionMode='invite';doctor.submittedBy=doctor.name;
  for(const file of doctor.materials){if(file.storage==='demo-fixture'&&file.id.startsWith('doctor-fixture:')){file.storageOwner=data.ownerId;file.uploadedBy=doctor.id;file.uploadedByName=doctor.name;}}
  for(const event of data.events){if(event.target===doctor.id&&event.id.startsWith('doctor-fixture:')&&['医生档案已创建','医生档案已提交审核'].includes(event.title))event.actor=doctor.name;}
  return data;
}
