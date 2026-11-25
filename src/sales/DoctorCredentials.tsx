import {useEffect,useRef,useState} from 'react';
import {Button,Dialog,MessagePlugin} from 'tdesign-react';
import {DoctorMaterials} from '../doctors/DoctorDetails';
import {doctorPreview} from './doctorPreview';
import type {Attachment,Doctor} from './model';
export function DoctorCredentials({doctor,owner,ownerName}:{doctor:Doctor;owner:string;ownerName:string}){
  const [preview,setPreview]=useState<{file:Attachment;url:string;page:number;pages:number}|null>(null),[busy,setBusy]=useState(false);const request=useRef(0),url=useRef('');
  useEffect(()=>()=>{request.current++;if(url.current)URL.revokeObjectURL(url.current)},[]);
  const open=async(file:Attachment,page=1)=>{if(doctor.owner&&doctor.owner!==owner)return;const current=++request.current;setBusy(true);try{const result=await doctorPreview(owner,file,page);if(current!==request.current)return;if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(result.blob);setPreview({file,url:url.current,page,pages:result.pages});}catch(e){if(current===request.current)void MessagePlugin.error((e as Error).message)}finally{if(current===request.current)setBusy(false)}};
  const close=()=>{request.current++;if(url.current)URL.revokeObjectURL(url.current);url.current='';setPreview(null);setBusy(false)};
  if(doctor.owner&&doctor.owner!==owner)return <p>无资质附件访问权限</p>;
  return <><DoctorMaterials certificate={doctor.certificate} files={doctor.materials.map(file=>({id:file.id,name:file.name,category:file.category||'other',submittedBy:file.uploadedByName||(file.uploadedBy===owner?ownerName:/^[\p{Script=Han}·]{2,20}$/u.test(file.uploadedBy||'')?file.uploadedBy:undefined),at:file.uploadedAt}))} busy={busy} onPreview={id=>{const file=doctor.materials.find(f=>f.id===id);if(file)void open(file)}}/><Dialog visible={!!preview} header="资料预览" footer={false} onClose={close} width="min(800px, 90vw)">{preview&&<div className="doctor-credential-viewer"><img className="sales-attachment-preview" src={preview.url} alt={preview.file.name}/>{preview.pages>1&&<div className="sales-actions"><Button theme="default" variant="outline" disabled={busy||preview.page===1} onClick={()=>void open(preview.file,preview.page-1)}>上一页</Button><span>{preview.page} / {preview.pages}</span><Button theme="default" variant="outline" disabled={busy||preview.page===preview.pages} onClick={()=>void open(preview.file,preview.page+1)}>下一页</Button></div>}</div>}</Dialog></>;
}
