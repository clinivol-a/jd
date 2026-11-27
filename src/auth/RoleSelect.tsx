import {useEffect,useState} from 'react';
import {Select} from 'tdesign-react';
import {authRequest} from './client';
export function useApplicationRoles(){
 const [items,setItems]=useState<{id:string;name:string}[]>([]),[error,setError]=useState('');
 useEffect(()=>{let active=true;void authRequest<{items:{id:string;name:string}[];registrationOptions?:{id:string;name:string}[]}>('roles').then(r=>{if(active)setItems(r.registrationOptions||r.items)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[]);
 return {items,error};
}
export function RoleSelect({value,onChange,items}:{value:string;onChange:(value:string)=>void;items:{id:string;name:string}[]}){
 return <Select size="large" value={value||undefined} clearable placeholder="请选择申请岗位" onChange={v=>onChange(String(v||''))} options={items.map(r=>({value:r.id,label:r.name}))}/>;
}
