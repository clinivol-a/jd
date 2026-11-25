import {AuthFailure} from './service.mjs';
export function installRegistrationRevision(s){
 s.candidateAccount=function(d){return this.accounts.find(a=>a.id===d.candidateId&&d.candidateExpires>this.now())};
 // Review opinions are not part of publicAccount or scan identity previews.
 s.candidateResult=function(d){const a=this.candidateAccount(d);return a?{...this.publicAccount(a),reviewNote:a.status==='rejected'?a.reviewNote||'':undefined,reviewVersion:a.reviewVersion||1}:null};
 s.registrationAmendment=function(d){this.assertEnabled();const a=this.candidateAccount(d);if(!a||a.status!=='rejected')throw new AuthFailure('请重新登录以核对可修改的申请。',401);return {id:a.id,name:a.name,phone:this.publicAccount(a).phone,organizationId:a.organizationId,requestedRole:a.requestedRole,version:a.reviewVersion||1}};
 s.resubmitRegistration=function(d,{proof,name,organizationId,requestedRole,version,accepted,identityMaterials}){
  this.assertEnabled();const a=this.candidateAccount(d);if(!a||a.status!=='rejected')throw new AuthFailure('申请状态已更新，请刷新后重新操作。',409);if((a.reviewVersion||1)!==version)throw new AuthFailure('申请已更新，请刷新后重新操作。',409);
  if(!accepted||!identityMaterials)throw new AuthFailure('请确认申请资料和服务协议。');if(!name?.trim()||name.length>30||!['designer','sales','doctor'].includes(requestedRole))throw new AuthFailure('请完整填写申请资料。');const organization=this.organizationDirectory.selected(organizationId);
  const p=this.takeProof(d,proof,'register');if(p.phone!==a.phone)throw new AuthFailure('请验证当前申请绑定的手机号。',403);
  const before={name:a.name,organizationId:a.organizationId,requestedRole:a.requestedRole,status:a.status,reviewVersion:a.reviewVersion||1};
  a.firstAppliedAt??=a.appliedAt;a.name=name.trim();a.organizationId=organization.id;a.organizationNameSnapshot=organization.name;a.department=organization.name;a.requestedRole=requestedRole;a.status='pending';a.role=null;a.permissions=[];a.appliedAt=this.now();a.reviewVersion=(a.reviewVersion||1)+1;
  // Retain previous reviewer, opinion and decision in audit; current pending result hides old feedback.
  this.persist();this.record('registration-resubmitted',a.id,{before,after:{name:a.name,organizationId:a.organizationId,requestedRole,status:a.status,reviewVersion:a.reviewVersion}});d.candidateExpires=this.now()+30*60000;return this.session(d);
 };
}
