import {randomUUID} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

export class OrganizationFailure extends Error{constructor(message,status=400){super(message);this.status=status}}
const copy=v=>structuredClone(v);
const text=(v,label)=>{if(typeof v!=='string'||!v.trim()||v.length>1000)throw new OrganizationFailure(`请填写${label}。`);return v.trim()};
// Stable IDs preserve the former registration choices. Values become administrator-owned records.
const initial=()=>({schema:1,source:'isolated-organizations',items:[['demo-clinivol','科立沃','内部组织'],['org-ahmu','安徽医科大学','外部机构'],['demo-hospital-01','安徽医科大学第一附属医院','外部机构'],['demo-hospital-02','安徽省立医院','外部机构'],['demo-hospital-03','中国科学技术大学附属第一医院','外部机构'],['demo-hospital-04','合肥市第一人民医院','外部机构']].map(([id,name,kind])=>({id,name,kind,status:'已启用',allowRegistration:true,version:1,source:'isolated-demo'})),requests:[],events:[]});
export class OrganizationDirectory{
 constructor({directory,now=Date.now}={}){this.file=directory?join(directory,'organizations.json'):null;this.now=now;this.state=initial();if(directory)mkdirSync(directory,{recursive:true,mode:0o700});this.reload();if(directory&&!this.state.legacyRequestsImported){const old=join(directory,'organization-requests.json');if(existsSync(old))for(const r of JSON.parse(readFileSync(old,'utf8')))if(!this.state.requests.some(x=>x.id===r.id))this.state.requests.push({...r,version:r.version||1});this.state.legacyRequestsImported=true;this.persist()}if(this.file&&!existsSync(this.file))this.persist()}
 reload(){if(this.file&&existsSync(this.file))this.state=JSON.parse(readFileSync(this.file,'utf8'))}
 persist(){if(this.file){writeFileSync(this.file+'.tmp',JSON.stringify(this.state,null,2),{mode:0o600});renameSync(this.file+'.tmp',this.file)}}
 all(){this.reload();return copy(this.state)}
 options(){return this.all().items.filter(o=>o.status==='已启用'&&o.allowRegistration)}
 find(id){return this.all().items.find(o=>o.id===id)}
 selected(id){const o=this.options().find(o=>o.id===id);if(!o)throw new OrganizationFailure('请选择有效的所属组织。');return o}
 event(actor,title,id,before,after,reason=''){this.state.events.push({id:randomUUID(),objectId:id,actorId:actor.id,actor:actor.name,actorRole:actor.role,at:new Date(this.now()).toISOString(),title,category:'所属组织',before:copy(before),after:copy(after),reason,source:'isolated-organizations',result:'成功'})}
 syncHospitals(hospitals){this.reload();let changed=false;for(const h of hospitals){const id='hospital:'+h.id;if(!this.state.items.some(o=>o.id===id||o.hospitalId===h.id)){this.state.items.push({id,name:h.name,kind:'外部机构',hospitalId:h.id,status:h.status,allowRegistration:h.status==='已启用',version:1,source:'isolated-hospital-link'});changed=true}}if(changed)this.persist()}
 request(device,{name}){this.reload();name=text(name,'组织正式名称');if(name.length>100)throw new OrganizationFailure('组织名称不得超过100字。');if(this.state.requests.filter(r=>r.device===device.id&&r.at>this.now()-3600000).length>=5)throw new OrganizationFailure('申请过于频繁，请稍后重试。',429);if(this.state.requests.some(r=>r.device===device.id&&r.name===name&&r.status==='pending'))throw new OrganizationFailure('该组织已有待审核申请。',409);const r={id:randomUUID(),name,device:device.id,status:'pending',version:1,at:this.now(),source:'isolated-organizations'};this.state.requests.push(r);this.persist();return {id:r.id,name:r.name,status:r.status}}
 command(actor,{action,id,version,...input}){
  if(actor?.role!=='super_admin'||actor.status!=='approved'||!actor.permissions?.includes('people:manage'))throw new OrganizationFailure('无组织目录维护权限。',403);
  this.reload();const backup=copy(this.state);try{
   let o=this.state.items.find(o=>o.id===id);if(action==='organization-request-review'){
    const r=this.state.requests.find(r=>r.id===id);if(!r)throw new OrganizationFailure('组织申请不存在。',404);if(r.version!==version||r.status!=='pending')throw new OrganizationFailure('申请已更新，请刷新。',409);
    const reason=text(input.reason,'核实意见');if(!['approved','returned'].includes(input.result))throw new OrganizationFailure('审核结果无效。');const before=copy(r);
    if(input.result==='approved'){o=input.organizationId?this.state.items.find(o=>o.id===input.organizationId):null;if(input.organizationId&&!o)throw new OrganizationFailure('关联组织不存在。');if(!o){if(this.state.items.some(o=>o.name===r.name))throw new OrganizationFailure('同名组织已存在，请选择关联组织。',409);o={id:'ORG-'+randomUUID(),name:r.name,kind:'外部机构',status:'已启用',allowRegistration:true,version:1,source:'isolated-organizations'};this.state.items.push(o)}r.organizationId=o.id}
    r.status=input.result==='approved'?'approved':'rejected';r.reason=reason;r.version++;r.reviewedBy=actor.id;r.reviewedAt=new Date(this.now()).toISOString();this.event(actor,input.result==='approved'?'新增组织申请审核通过':'新增组织申请审核退回',r.id,before,r,reason);this.persist();return copy(r);
   }
   if(id&&!o)throw new OrganizationFailure('组织不存在。',404);if(o&&o.version!==version)throw new OrganizationFailure('组织已更新，请刷新。',409);const before=o?copy(o):null;
   if(action==='organization-save'){const name=text(input.name,'组织名称');if(name.length>100)throw new OrganizationFailure('组织名称不得超过100字。');if(!['内部组织','外部机构'].includes(input.kind))throw new OrganizationFailure('请选择组织类型。');if(this.state.items.some(r=>r.id!==id&&r.name===name))throw new OrganizationFailure('同名组织已存在，请核对。',409);const reason=String(input.reason||'');o={...(o||{id:'ORG-'+randomUUID(),status:'已启用',source:'isolated-organizations'}),name,kind:input.kind,allowRegistration:input.allowRegistration!==false,version:(o?.version||0)+1};this.state.items=this.state.items.filter(r=>r.id!==o.id);this.state.items.push(o);this.event(actor,before?'组织资料已更新':'组织已创建',o.id,before,o,reason)}
   else if(action==='organization-status'){if(!o)throw new OrganizationFailure('组织不存在。',404);const reason=text(input.reason,'操作原因');o.status=o.status==='已启用'?'已停用':'已启用';o.version++;this.event(actor,o.status==='已启用'?'组织已启用':'组织已停用',o.id,before,o,reason)}
   else throw new OrganizationFailure('不支持此组织操作。',404);
   this.persist();return copy(o);
  }catch(e){this.state=backup;throw e}
 }
}
