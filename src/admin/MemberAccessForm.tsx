import {useState} from 'react';
import type {ReactNode} from 'react';
import {Button,Form,Select,Switch} from 'tdesign-react';
import {adminRequest} from './model';
import type {AdminState,Person} from './model';
import {accessRoles,roleText} from '../auth/memberAccess.mjs';

export function MemberAccessForm({person:p,data,canManage,onSaved,renderFields,scopeText,permissionText,statusControl,permissionControls}:{person:Person;data:AdminState;canManage:boolean;onSaved:()=>Promise<void>;renderFields:(items:[string,ReactNode][])=>ReactNode;scopeText:(p:Person)=>string;permissionText:(p:Person)=>string;statusControl:ReactNode;permissionControls:ReactNode}){
 const [job,setJob]=useState(p.positionId||''),[roles,setRoles]=useState(accessRoles(p)),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const internal=data.organizations.find(o=>o.id===p.organizationId)?.kind==='内部组织';
 const toggle=(id:'leader'|'administrator',enabled:boolean)=>{setRoles(previous=>enabled?[...previous,id]:previous.filter(r=>r!==id));setError('')};
 const save=async()=>{if(busy)return;setBusy(true);setError('');try{await adminRequest('command',{action:'member-access-save',id:p.id,version:p.version,accountVersion:p.accountVersion,positionId:job||null,accessRoles:roles});await onSaved()}catch(e){setError((e as Error).message)}finally{setBusy(false)}};
 return <div className="admin-review-sections"><section><h3>基本资料</h3>{renderFields([['姓名',p.name],['岗位',p.role],['角色',p.accessRoleName||roleText(p)],['所属组织',p.organization],['生效范围',scopeText(p)],['具体权限',permissionText(p)],['人员启用状态',statusControl]])}</section>
  <section><h3>管理授权</h3><Form labelAlign="top"><Form.FormItem label="岗位"><><Select aria-label="成员岗位" value={job||undefined} placeholder="选择岗位" disabled={!canManage||busy} options={data.applicationRoles.filter(r=>r.status==='已启用'||r.id===p.positionId).map(r=>({label:r.name,value:r.id,disabled:r.status!=='已启用'}))} onChange={value=>{setJob(String(value));setError('')}}/></></Form.FormItem></Form>
   {([{id:'leader',name:'业务组长'},{id:'administrator',name:'管理员'}] as const).map(r=><div className="admin-permission-row" key={r.id}><span>{r.name}</span><Switch aria-label={'授予'+r.name+'角色'} value={roles.includes(r.id)} disabled={!canManage||!internal||busy||p.status!=='已启用'} onChange={v=>toggle(r.id,Boolean(v))}/></div>)}
   {permissionControls}{error&&<p className="admin-error" role="alert">{error}</p>}<div className="admin-drawer-actions"><Button theme="primary" loading={busy} disabled={!canManage} onClick={()=>void save()}>保存</Button></div>
  </section>
 </div>;
}
