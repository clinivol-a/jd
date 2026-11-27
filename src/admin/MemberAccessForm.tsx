import {useState} from 'react';
import type {ReactNode} from 'react';
import {Button,Form,Select} from 'tdesign-react';
import {adminRequest} from './model';
import type {AdminState,Person} from './model';
import {accessRoles,NO_POSITION} from '../auth/memberAccess.mjs';
import {anhuiCities} from './institutionRules.mjs';

export function MemberAccessForm({person:p,data,canManage,onSaved,renderFields,statusControl,permissionControls}:{person:Person;data:AdminState;canManage:boolean;onSaved:()=>Promise<void>;renderFields:(items:[string,ReactNode][])=>ReactNode;statusControl:ReactNode;permissionControls:ReactNode}){
 const [job,setJob]=useState(p.positionId||NO_POSITION),[roles,setRoles]=useState(accessRoles(p)),[regions,setRegions]=useState(p.regions||[]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const internal=data.organizations.find(o=>o.id===p.organizationId)?.kind==='内部组织',editable=canManage&&!busy&&p.status==='已启用';
 const selectRoles=(next:string[])=>{const added=next.filter(r=>!(roles.length?roles:['employee']).includes(r as typeof roles[number]));const selected=added.includes('employee')?[]:next.filter((r):r is typeof roles[number]=>r==='leader'||r==='administrator');setRoles(selected);if(!selected.includes('leader'))setRegions([]);setError('')};
 const save=async()=>{if(busy)return;setBusy(true);setError('');try{await adminRequest('command',{action:'member-access-save',id:p.id,version:p.version,accountVersion:p.accountVersion,positionId:job,accessRoles:roles,regions,regionConfigurationVersion:data.regionConfiguration.version});await onSaved()}catch(e){setError((e as Error).message)}finally{setBusy(false)}};
 return <div className="admin-review-sections admin-member-sections">
  <section><h3>基本资料</h3>{renderFields([['姓名',p.name],['所属组织',p.organization],['人员启用状态',statusControl]])}</section>
  <section><h3>岗位与角色</h3><Form labelAlign="top">
   <Form.FormItem label="岗位"><><Select aria-label="成员岗位" value={job} placeholder="选择岗位" disabled={!editable} options={[{label:'无专业岗位',value:NO_POSITION},...data.applicationRoles.filter(r=>r.status==='已启用'||r.id===p.positionId).map(r=>({label:r.name,value:r.id,disabled:r.status!=='已启用'}))]} onChange={value=>{setJob(String(value));setError('')}}/></></Form.FormItem>
   <Form.FormItem label="角色"><><Select aria-label="成员角色" multiple value={roles.length?roles:['employee']} disabled={!editable||!internal} options={[{label:'普通员工',value:'employee'},{label:'业务组长',value:'leader'},{label:'管理员',value:'administrator'}]} onChange={value=>selectRoles(value as string[])}/></></Form.FormItem>
  </Form></section>
  {roles.includes('leader')&&<section><h3>管理范围</h3><Form labelAlign="top"><Form.FormItem label="负责区域"><><Select aria-label="成员负责区域" multiple filterable clearable value={regions} placeholder="选择负责区域" disabled={!editable||!internal} options={anhuiCities.map(region=>({label:region,value:region}))} onChange={value=>{setRegions(value as string[]);setError('')}}/></></Form.FormItem></Form></section>}
  <section><h3>功能权限</h3>{permissionControls}</section>
  {error&&<p className="admin-error" role="alert">{error}</p>}<div className="admin-drawer-actions"><Button theme="primary" loading={busy} disabled={!canManage} onClick={()=>void save()}>保存</Button></div>
 </div>;
}
