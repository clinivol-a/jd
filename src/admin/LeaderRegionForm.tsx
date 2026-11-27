import {useState} from 'react';
import {Dialog,Form,Select} from 'tdesign-react';
import {adminRequest} from './model';
import type {AdminState} from './model';

export function LeaderRegionForm({data,onSaved,onClose}:{data:AdminState;onSaved:()=>Promise<void>;onClose:()=>void}){
 const [assignments,setAssignments]=useState(()=>data.regionConfiguration.assignments.map(a=>({...a,leaderIds:[...a.leaderIds]})));
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const leaders=data.people.filter(p=>p.role==='业务组长');
 const save=async()=>{
  if(busy)return;
  setBusy(true);setError('');
  try{await adminRequest('command',{action:'leader-regions-save',version:data.regionConfiguration.version,leaderVersions:Object.fromEntries(leaders.map(p=>[p.id,p.version])),assignments});await onSaved();onClose()}
  catch(e){setError((e as Error).message)}finally{setBusy(false)}
 };
 return <Dialog visible header="区域组长配置" confirmBtn={{content:'保存',loading:busy}} cancelBtn="取消" onConfirm={()=>void save()} onClose={()=>{if(!busy)onClose()}} destroyOnClose>
  <Form labelAlign="top">{assignments.map(a=><Form.FormItem key={a.region} label={a.region}><><Select aria-label={a.region+'负责组长'} multiple filterable clearable value={a.leaderIds} placeholder="选择负责组长" empty="暂无符合条件的组长" options={leaders.map(p=>({value:p.id,label:p.name,disabled:p.status!=='已启用'||!['orders:read','orders:review','tasks:assign'].every(v=>p.permissions.includes(v))}))} onChange={value=>{setAssignments(previous=>previous.map(row=>row.region===a.region?{...row,leaderIds:value as string[]}:row));setError('')}}/></></Form.FormItem>)}</Form>
  {error&&<p className="admin-error" role="alert">{error}</p>}
 </Dialog>;
}
