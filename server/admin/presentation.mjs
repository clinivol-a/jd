// Administrator read model only. Persisted identities, opinions and audit facts stay intact.
import {auditActorLabel} from '../../src/audit/actorLabel.mjs';
const adminRoles=new Set(['admin','super_admin','管理员','超级管理员']);
const demoReasons=new Map([
 ['本地停用场景验收，保留全部历史业务关联。','业务资格复核期间暂停使用。'],
 ['已核对本地合成档案的资质和医院科室关系，恢复使用。','已核对资质及医院、科室关系，恢复使用。'],
 ['本地验证医院责任人变更','医院负责组长调整。'],
 ['负责人休假，进行本地验收接管','负责人休假，调整订单负责组长。'],
 ['已核对本地组织申请资料，建立独立外部机构记录。','已核对组织申请资料，建立外部机构档案。'],
 ['本地核对组织更名后当前账号投影更新、原提交快照保留。','组织名称已变更，相关人员信息同步更新。'],
 ['本地验证停用后不可作为新增注册选项。','组织暂停接收新的账号注册申请。'],
 ['负责本笔跨角色关联验收订单审核。','负责本订单的需求审核及任务协调。']
]);
const isolated=source=>typeof source==='string'&&/^(isolated-|local-auth$)/.test(source);

export function presentAdminState(state,{accounts=[],currentActor}={}){
 const identities=new Map([...state.people,...accounts,...(currentActor?[currentActor]:[])].map(p=>[p.id,p]));
 const actorLabel=e=>auditActorLabel(e,identities.get(e.actorId));
 const event=e=>{
  const next={...e,actor:actorLabel(e),category:e.category||'业务操作'};
  if(next.actor!==e.actor)next.recordedActor=e.actor;
  if(isolated(e.source)){
   for(const key of ['reason','note'])if(demoReasons.has(e[key])){next['recorded'+key[0].toUpperCase()+key.slice(1)]=e[key];next[key]=demoReasons.get(e[key])}
   // Fixture identifiers are technical provenance, not a written business review opinion.
   if(typeof e.basis==='string'&&/^LOCAL-[A-Z0-9-]+$/.test(e.basis)){next.recordedBasis=e.basis;next.basis=''}
   if(e.title==='本地管理员初始化')next.title='管理员账号已初始化';
  }
  return next;
 };
 return {...state,
  events:state.events.map(event),doctorHistory:state.doctorHistory.map(event),
  people:state.people.map(p=>({...p,role:adminRoles.has(p.role)?'管理员':p.role})),
  organizationRequests:state.organizationRequests?.map(r=>({...r,reason:isolated(r.source)&&demoReasons.has(r.reason)?demoReasons.get(r.reason):r.reason})),
  approvals:state.approvals.map(a=>({...a,approver:a.approver?actorLabel({actor:a.approver,actorId:a.approverId,actorRole:a.approverRole}):a.approver,...(isolated(a.source)&&/^LOCAL-[A-Z0-9-]+$/.test(a.basis||'')?{basis:'',recordedBasis:a.basis}:{})}))
 };
}
