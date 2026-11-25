import {randomBytes} from 'node:crypto';
import {join} from 'node:path';
import {existsSync,writeFileSync} from 'node:fs';
// Explicitly synthetic records; never infer or rewrite histories for user-created IDs.
export function completeReviewExamples(state,auth){
 const base='2026-11-18';
 // Only known isolated seed identities may receive their missing seed-origin events.
 // Version increases during review must not suppress these original creation/submission rows.
 const seedDoctors={'ADM-D01':['周明哲','ADM-H01','李明'],'ADM-D02':['林致远','ADM-H02','林致远'],'ADM-D03':['张予安','ADM-H03','张予安']};
 for(const e of state.doctorHistory){
  if(state.source==='isolated-admin'&&['ADM-SEED-D02','ADM-SEED-D03'].includes(e.id)&&e.objectId===e.id.replace('ADM-SEED-','ADM-')&&e.source==='isolated-admin'&&e.actor==='合成审核账号'){
   e.originalActor??=e.actor;e.actor='管理员';e.actorRole='管理员';e.seedCorrection='review-demo-identity-20261125';
  }
 }
 for(const d of state.doctors.filter(d=>state.source==='isolated-admin'&&seedDoctors[d.id]?.every((v,i)=>v===[d.name,d.hospitalId,d.submittedBy][i]))){
  const day=d.id==='ADM-D01'?'18':'17',entries=[['created','医生档案已创建','07:30'],['submitted','医生档案已提交审核','08:00']];
  for(const [key,title,time] of entries){const id=`ADM-SEED-${d.id}-${key}`;if(!state.doctorHistory.some(e=>e.id===id))state.doctorHistory.push({id,objectId:d.id,title,actor:d.submittedBy,actorId:d.submittedBy==='李明'?'li-ming':d.id,at:`2026-11-${day}T${time}:00+08:00`,reason:'',source:'isolated-review-fixture'})}
 }
 if(!state.doctors.some(d=>d.id==='ADM-D04')){
  state.doctors.push({id:'ADM-D04',name:'许承安',hospitalId:'ADM-H02',department:'骨科',title:'主治医师',phone:'199****4104',status:'已停用',source:'销售建档',submittedBy:'李明',salesId:'li-ming',invitedBy:null,materials:[],version:1,qualificationStatus:'valid',seedOrigin:'review-state-examples'});
  for(const [key,title,time,actor] of [['created','医生档案已创建','08:00','李明'],['submitted','医生档案已提交审核','08:10','李明'],['approved','医生档案审核通过','09:00','周景明'],['disabled','医生档案已停用','10:00','周景明']])state.doctorHistory.push({id:'ADM-SEED-D04-'+key,objectId:'ADM-D04',title,actor,actorId:actor==='李明'?'li-ming':'super-admin',at:`${base}T${time}:00+08:00`,reason:key==='disabled'?'业务资格复核期间暂停使用。':'',basis:key==='approved'?'LOCAL-REVIEW-FIXTURE-D04':undefined,noteSource:key==='approved'?'system-default':undefined,source:'isolated-review-fixture'});
 }
 for(const [id,name,phone,status] of [['ADM-D05','沈知衡','199****4105','待审核'],['ADM-D06','顾承远','199****4106','审核退回']]){
  if(state.doctors.some(d=>d.id===id))continue;
  state.doctors.push({id,name,phone,hospitalId:'ADM-H01',department:'口腔颌面外科',title:'主治医师',status,source:'销售建档',submittedBy:'李明',salesId:'li-ming',materials:[],version:1,qualificationStatus:'valid',seedOrigin:'review-state-examples'});
  const rows=[['created','医生档案已创建','07:30','李明'],['submitted','医生档案已提交审核','08:00','李明'],...(status==='审核退回'?[['returned','医生档案审核退回','10:00','周景明']]:[])];
  for(const [key,title,time,actor] of rows)state.doctorHistory.push({id:`ADM-SEED-${id}-${key}`,objectId:id,title,actor,actorId:actor==='李明'?'li-ming':'super-admin',at:`${base}T${time}:00+08:00`,reason:key==='returned'?'请补充清晰的执业证明材料。':'',source:'isolated-review-fixture'});
 }
 for(const [n,status] of [[1,'待审批'],[2,'审批通过'],[3,'审批退回']]){
  const id=`REVIEW-HISTORY-${n}`;const existing=state.approvals.find(a=>a.id===id);if(existing){if(n===2&&existing.source==='isolated-review-fixture'&&existing.version===1&&existing.basis==='LOCAL-HISTORY-2')existing.hospitalIds=['ADM-H01'];continue;}
  state.approvals.push({id,type:'历史订单访问',applicant:n===2?'许文清':'赵启明',applicantId:n===2?'ADM-L02':'ADM-L01',subjectId:'ADM-M01',subjectName:'顾清和',organizationId:'demo-clinivol',organization:'科立沃',requestedRole:'管理员',permissions:['orders:read'],hospitalIds:[n===2?'ADM-H01':'ADM-H02'],basis:'LOCAL-HISTORY-'+n,status,at:`${base}T08:0${n}:00+08:00`,version:1,source:'isolated-review-fixture',...(n>1?{reviewedAt:`${base}T10:0${n}:00+08:00`,approver:'周景明',approverId:'super-admin',reviewNote:n===3?'请补充订单访问的业务用途及授权范围。':''}:{})});
 }
 if(!auth||auth.mode!=='local'||!auth.demoMode)return;
 const credentials={};for(const [n,status,name] of [[1,'pending','许安宁'],[2,'approved','沈言'],[3,'rejected','顾清和']]){
  const id=`review-account-${n}`,phone=`1990000410${n}`;if(auth.accounts.some(a=>a.id===id||a.phone===phone))continue;
  const password=randomBytes(18).toString('base64url')+'8a';const a={id,phone,name,organizationId:'demo-clinivol',organizationNameSnapshot:'科立沃',department:'科立沃',requestedRole:'sales',role:status==='approved'?'sales':null,permissions:status==='approved'?['sales:landing']:[],status,avatar:'/account-auth/avatars/portrait-03.jpg',appliedAt:Date.parse(`${base}T08:0${n}:00+08:00`),reviewVersion:1,source:'isolated-review-fixture',...(status!=='pending'?{reviewedAt:Date.parse(`${base}T10:0${n}:00+08:00`),reviewedBy:'super-admin',reviewBasis:'LOCAL-ACCOUNT-'+n,reviewNote:status==='rejected'?'请补充所属组织与申请岗位的关联资料。':''}:{})};auth.setPassword(a,password);auth.accounts.push(a);credentials[phone]=password;
  auth.audit.push({id:`REVIEW-AUTH-${n}-submitted`,type:'registration',accountId:id,at:a.appliedAt,source:'isolated-review-fixture'});
  if(status!=='pending')auth.audit.push({id:`REVIEW-AUTH-${n}-reviewed`,type:'registration-reviewed',accountId:id,at:a.reviewedAt,reviewerId:'super-admin',result:status==='approved'?'approved':'returned',reason:a.reviewNote,basis:a.reviewBasis,source:'isolated-review-fixture'});
 }
 if(Object.keys(credentials).length){auth.persist();if(auth.directory){writeFileSync(join(auth.directory,'audit.json'),JSON.stringify(auth.audit),{mode:0o600});const file=join(auth.directory,'review-example-credentials.json');if(!existsSync(file))writeFileSync(file,JSON.stringify(credentials),{mode:0o600})}}
}
