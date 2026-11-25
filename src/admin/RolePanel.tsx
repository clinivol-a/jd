import {useState} from 'react';
import {Button,Dialog,Form,Input,Select,Tag} from 'tdesign-react';
import {AdminTable,FullText} from './AdminTable';
import {adminRequest} from './model';
import type {ApplicationRole} from './model';
export function RolePanel({items,canManage,onSaved}:{items:ApplicationRole[];canManage:boolean;onSaved:()=>Promise<void>}){
 const [edit,setEdit]=useState<ApplicationRole|null>(null),[name,setName]=useState(''),[status,setStatus]=useState('已启用'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const save=async()=>{if(!edit||busy)return;if(!name.trim()){setError('请填写岗位名称。');return}setBusy(true);setError('');try{await adminRequest('command',{action:'role-save',id:edit.id,version:edit.version,name,status});await onSaved();setEdit(null)}catch(e){setError((e as Error).message)}finally{setBusy(false)}};
 return <><AdminTable rows={items} columns={[{key:'name',label:'岗位名称',width:240,render:r=><FullText>{r.name}</FullText>},{key:'status',label:'当前状态',width:140,render:r=><Tag variant="light" theme={r.status==='已启用'?'success':'default'}>{r.status}</Tag>},{key:'actions',label:'操作',width:110,render:r=><Button theme="primary" variant="text" disabled={!canManage} onClick={()=>{setEdit(r);setName(r.name);setStatus(r.status);setError('')}}>编辑</Button>}]}/><Dialog header="编辑岗位" visible={!!edit} confirmBtn={{content:'保存',loading:busy}} onConfirm={()=>void save()} onClose={()=>{if(!busy)setEdit(null)}} destroyOnClose><Form labelAlign="top"><Form.FormItem label="岗位名称" requiredMark status={error?'error':undefined} tips={error}><><Input value={name} onChange={setName} maxlength={30}/></></Form.FormItem><Form.FormItem label="当前状态" requiredMark><><Select value={status} onChange={v=>setStatus(String(v))} options={['已启用','已停用'].map(label=>({label,value:label}))}/></></Form.FormItem></Form></Dialog></>;
}
