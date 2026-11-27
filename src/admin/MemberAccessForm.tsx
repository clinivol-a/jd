import {useState} from 'react';
import type {ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {Alert,Button,Dialog,Form,Input,MessagePlugin,Select,Switch,Tooltip} from 'tdesign-react';
import {adminRequest} from './model';
import type {AdminState,Person} from './model';
import {NO_POSITION} from '../auth/memberAccess.mjs';
import {anhuiCities} from './institutionRules.mjs';
import {leaderPermissionIds,managementPermissionIds,memberPermissionCatalog,memberPolicyIssues,memberRole,rolePermissions} from './memberPolicy.mjs';
import type {MemberRole} from './memberPolicy.mjs';

export function MemberAccessForm({person:p,data,canManage,onSaved,renderFields,statusControl,footerTarget}:{person:Person;data:AdminState;canManage:boolean;onSaved:()=>Promise<void>;renderFields:(items:[string,ReactNode][])=>ReactNode;statusControl:ReactNode;footerTarget:HTMLElement|null}){
 const initialRole=memberRole(p),issues=memberPolicyIssues(p);
 const [job,setJob]=useState(p.positionId||NO_POSITION),[role,setRole]=useState<MemberRole>(initialRole),[regions,setRegions]=useState(p.regions||[]),[permissions,setPermissions]=useState(()=>rolePermissions(initialRole,p.permissions)),[busy,setBusy]=useState(false),[error,setError]=useState(''),[confirm,setConfirm]=useState(false);
 const internal=data.organizations.find(o=>o.id===p.organizationId)?.kind==='内部组织',editable=canManage&&!busy&&p.status==='已启用';
 const actualManagement=p.permissions.filter(id=>managementPermissionIds.includes(id));
 const changed=role!==initialRole||permissions.length!==actualManagement.length||permissions.some(id=>!actualManagement.includes(id))||JSON.stringify(role==='leader'?regions:[])!==JSON.stringify(p.regions||[])||job!==(p.positionId||NO_POSITION);
 const selectRole=(next:MemberRole)=>{setRole(next);setPermissions(next===initialRole?rolePermissions(next,p.permissions):rolePermissions(next));setRegions(next==='leader'?[...(p.regions||[])]:[]);setError('')};
 const togglePermission=(id:string,enabled:boolean)=>{setPermissions(current=>{const next=enabled?[...new Set([...current,id])]:current.filter(p=>p!==id);if(id==='shares:manage'&&enabled&&!next.includes('assets:read'))next.push('assets:read');return id==='assets:read'&&!enabled?next.filter(p=>p!=='shares:manage'):next});setError('')};
 const save=async()=>{if(busy)return;setBusy(true);setError('');try{await adminRequest('command',{action:'member-access-save',id:p.id,version:p.version,accountVersion:p.accountVersion,positionId:job,accessRoles:role==='employee'?[]:[role],regions:role==='leader'?regions:[],managementPermissions:permissions,regionConfigurationVersion:data.regionConfiguration.version,confirmRoleNormalization:issues.length>0});await onSaved();setConfirm(false);void MessagePlugin.success('成员配置已保存')}catch(e){setError((e as Error).message);setConfirm(false)}finally{setBusy(false)}};
 const requestSave=()=>{setError('');if(job===NO_POSITION&&role==='employee'){setError('无专业岗位的成员须配置业务组长或管理员角色。');return}if(role==='leader'&&!regions.length){setError('请至少选择一个负责区域。');return}if(changed||issues.length)setConfirm(true);else void save()};
 return <><div className="admin-review-sections admin-member-sections">
  <section><h3>基本资料</h3>{renderFields([['姓名',p.name],['所属组织',p.organization],['人员启用状态',statusControl]])}</section>
  <section><h3>岗位与角色</h3><Form labelAlign="top">
   <Form.FormItem label="岗位"><><Select aria-label="成员岗位" value={job} placeholder="选择岗位" disabled={!editable} options={[{label:'无专业岗位',value:NO_POSITION},...data.applicationRoles.filter(r=>r.status==='已启用'||r.id===p.positionId).map(r=>({label:r.name,value:r.id,disabled:r.status!=='已启用'}))]} onChange={value=>{setJob(String(value));setError('')}}/></></Form.FormItem>
   <Form.FormItem label="角色"><><Select aria-label="成员角色" value={role} disabled={!editable||!internal} options={[{label:'普通员工',value:'employee'},{label:'业务组长',value:'leader'},{label:'管理员',value:'administrator'}]} onChange={value=>selectRole(value as MemberRole)}/></></Form.FormItem>
  </Form></section>
  <section><h3>管理范围</h3><Form labelAlign="top"><Form.FormItem label="负责区域"><>{role==='administrator'?<Input value="全部区域" readonly/>:role==='employee'?<Input value="-" disabled/>:<Select aria-label="成员负责区域" multiple filterable clearable value={regions} placeholder="选择负责区域" disabled={!editable||!internal} options={anhuiCities.map(region=>({label:region,value:region}))} onChange={value=>{setRegions(value as string[]);setError('')}}/>}</></Form.FormItem></Form></section>
  <section><h3>功能权限</h3>
   {issues.length>0&&<Alert className="admin-member-policy-notice" theme="warning" message={`${issues.join('；')}。以下为待保存配置，原授权仍有效。`}/>}
   {memberPermissionCatalog.map(permission=>{const enabled=permissions.includes(permission.id),allowed=role==='leader'&&leaderPermissionIds.includes(permission.id),locked=permission.id==='orders:read';const hint=role==='administrator'?'管理员管理权限统一开启':role==='employee'?'普通员工不具有管理权限，职业功能由岗位决定':!allowed?'仅管理员可配置此权限':locked?'管理工作台必须保留订单查看权限':'在负责区域内生效';return <div className="admin-permission-row" key={permission.id}><span>{permission.name}</span><Tooltip content={hint}><span><Switch aria-label={permission.name} value={enabled} disabled={!editable||!internal||!allowed||locked} onChange={value=>togglePermission(permission.id,value)}/></span></Tooltip></div>})}
  </section>
  {footerTarget&&createPortal(<div className="admin-member-footer">{error&&<p className="admin-error" role="alert">{error}</p>}<Button theme="primary" loading={busy} disabled={!editable} onClick={requestSave}>保存</Button></div>,footerTarget)}
 </div><Dialog visible={confirm} header="确认成员配置" confirmBtn={{content:'确认保存',loading:busy}} cancelBtn="取消" onConfirm={()=>void save()} onClose={()=>{if(!busy)setConfirm(false)}}><p>将{p.name}的角色设为{({employee:'普通员工',leader:'业务组长',administrator:'管理员'})[role]}，管理权限{permissions.length}项，负责区域：{role==='administrator'?'全部区域':role==='leader'?regions.join('、'):'-'}。</p><p>保存后生效，并记录授权变更。</p></Dialog></>;
}
