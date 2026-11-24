import {useCallback,useEffect,useState} from 'react';
import {Alert,Button,Dialog} from 'tdesign-react';
import type {Attachment} from '../sales/model';
import {ImagingPreview} from '../sales/business/ImagingPreview';

export function AdminOrderAttachmentPreview({orderId,file,onClose}:{orderId:string;file:Attachment;onClose:()=>void}) {
 const [url,setUrl]=useState(''),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 const imaging=/\.nii$/i.test(file.name);
 const load=useCallback(async()=>{
  const response=await fetch(`/api/admin/order-attachment?orderId=${encodeURIComponent(orderId)}&fileId=${encodeURIComponent(file.id)}`,{credentials:'same-origin'});
  if(!response.ok){const result=await response.json().catch(()=>({}));throw Error(result.error||'文件读取失败，请重试。')}
  return response.blob();
 },[orderId,file.id]);
 useEffect(()=>{
  if(imaging)return;
  let active=true,objectUrl='';setError('');setUrl('');
  void load().then(blob=>{if(active){objectUrl=URL.createObjectURL(blob);setUrl(objectUrl)}}).catch(e=>{if(active)setError(e.message)});
  return()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl)};
 },[load,imaging,attempt]);
 if(imaging)return <ImagingPreview owner="" file={file} load={load} onClose={onClose}/>;
 return <Dialog visible header={file.name} footer={false} width="70%" onClose={onClose} destroyOnClose>
  {error?<><Alert theme="error" message={error}/><Button variant="text" onClick={()=>setAttempt(v=>v+1)}>重试</Button></>:!url?<p role="status">正在读取文件…</p>:file.type.startsWith('image/')?<img className="admin-order-image-preview" src={url} alt={file.name}/>:<iframe className="admin-order-file-preview" src={url+'#toolbar=0'} title={file.name}/>}
 </Dialog>;
}
