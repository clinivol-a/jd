import {NO_POSITION} from '../../src/auth/memberAccess.mjs';
import {randomUUID} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
export class RoleFailure extends Error{constructor(message,status=400){super(message);this.status=status}}
const clone=v=>structuredClone(v);
// Registration choices are configurable; their stable permission/workspace keys are not editable.
export class RoleDirectory{
 constructor({directory,now=Date.now}={}){this.file=directory?join(directory,'application-roles.json'):null;this.now=now;this.state={items:[['designer','工程设计师'],['sales','销售'],['doctor','医生']].map(([id,name])=>({id,name,status:'已启用',version:1})),events:[]};if(directory)mkdirSync(directory,{recursive:true,mode:0o700});this.reload();this.consolidateDesignerRole();if(this.file&&!existsSync(this.file))this.persist()}
 consolidateDesignerRole(){
  if(this.state.migrations?.includes('engineering-designer-20261127'))return;
  const before=clone(this.state.items),designer=this.state.items.find(r=>r.id==='designer');
  if(!designer)return;
  if(['三维重建设计师','医学工程师','工程师'].includes(designer.name)){designer.name='工程设计师';designer.version++}
  this.state.aliases||={};this.state.retiredItems||=[];
  for(const r of before)if(r.id!=='designer'&&['三维重建设计师','医学工程师'].includes(r.name)){this.state.aliases[r.id]='designer';this.state.retiredItems.push(r);this.state.items=this.state.items.filter(item=>item.id!==r.id)}
  this.state.migrations=[...(this.state.migrations||[]),'engineering-designer-20261127'];
  this.state.migrationHistory=[...(this.state.migrationHistory||[]),{id:'engineering-designer-20261127',before,after:clone(this.state.items)}];this.persist();
 }
 reload(){if(this.file&&existsSync(this.file))this.state=JSON.parse(readFileSync(this.file,'utf8'))}
 persist(){if(this.file){writeFileSync(this.file+'.tmp',JSON.stringify(this.state),{mode:0o600});renameSync(this.file+'.tmp',this.file)}}
 all(){this.reload();return clone(this.state)}
 find(id){if(id===NO_POSITION)return {id:NO_POSITION,name:'无专业岗位',status:'已启用',version:1};const state=this.all();return state.items.find(r=>r.id===(state.aliases?.[id]||id))}
 options(){return this.all().items.filter(r=>r.status==='已启用')}
 selected(id){const r=this.find(id);if(!r||r.status!=='已启用')throw new RoleFailure('请选择有效的申请岗位。');return r}
 save(actor,{id,name,status,version}){
  if(actor?.role!=='super_admin'||actor.status!=='approved'||!actor.permissions?.includes('people:manage'))throw new RoleFailure('无岗位配置权限。',403);
  this.reload();let r=id?this.state.items.find(r=>r.id===id):null;if(id&&!r)throw new RoleFailure('岗位不存在。',404);if(r&&r.version!==version)throw new RoleFailure('岗位已更新，请刷新。',409);
  if(typeof name!=='string'||!name.trim()||name.trim().length>30)throw new RoleFailure('请填写30字以内的岗位名称。');if(!['已启用','已停用'].includes(status))throw new RoleFailure('请选择有效的当前状态。');
  if(this.state.items.some(x=>x.id!==id&&x.name===name.trim()))throw new RoleFailure('岗位名称已存在。',409);
  const before=r?clone(r):null;if(!r){r={id:'ROLE-'+randomUUID(),name:name.trim(),status,version:1};this.state.items.push(r)}else{r.name=name.trim();r.status=status;r.version++}this.state.events.push({id:randomUUID(),objectId:r.id,title:before?'申请岗位配置已更新':'申请岗位已创建',category:'岗位配置',actorId:actor.id,actor:actor.name,actorRole:actor.role,at:new Date(this.now()).toISOString(),before,after:clone(r),reason:'',result:'成功',source:'isolated-roles'});this.persist();return clone(r);
 }
}
