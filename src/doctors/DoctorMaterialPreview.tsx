import {useEffect,useState} from 'react';
import {Button,Dialog,Empty,Loading} from 'tdesign-react';
/** Authorized raster previews only; no source URL or download action is exposed. */
export function DoctorMaterialPreview({id,onClose}:{id:string;onClose:()=>void}){
 const [page,setPage]=useState(1),[pages,setPages]=useState(1),[url,setUrl]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{setPage(1)},[id]);
 useEffect(()=>{
  if(!id)return;
  const abort=new AbortController();let objectUrl='';setBusy(true);setError('');setUrl('');
  void (async()=>{try{const response=await fetch(`/api/admin/preview/${encodeURIComponent(id)}?page=${page}`,{credentials:'same-origin',signal:abort.signal});if(!response.ok)throw Error('资料不可用或无预览权限。');const blob=await response.blob();if(abort.signal.aborted)return;objectUrl=URL.createObjectURL(blob);setUrl(objectUrl);setPages(Math.max(1,Number(response.headers.get('X-Preview-Pages'))||1));}catch(e){if(!abort.signal.aborted)setError((e as Error).message)}finally{if(!abort.signal.aborted)setBusy(false)}})();
  return()=>{abort.abort();if(objectUrl)URL.revokeObjectURL(objectUrl)};
 },[id,page,retry]);
 return <Dialog visible={!!id} header="资质资料预览" footer={false} width="min(800px, 90vw)" onClose={onClose} destroyOnClose><Loading loading={busy}><div className="doctor-credential-viewer">{error?<><Empty title="资料暂不可预览" description={error}/><Button variant="outline" onClick={()=>setRetry(v=>v+1)}>重试</Button></>:url?<img className="admin-preview" src={url} alt="资质资料授权预览"/>:null}{!error&&pages>1&&<div className="doctor-preview-pages"><Button variant="outline" disabled={busy||page<=1} onClick={()=>setPage(v=>v-1)}>上一页</Button><span>{page} / {pages}</span><Button variant="outline" disabled={busy||page>=pages} onClick={()=>setPage(v=>v+1)}>下一页</Button></div>}</div></Loading></Dialog>;
}
