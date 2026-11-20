import {useEffect,useRef,useState} from 'react';
import {Button,Dialog,MessagePlugin,Textarea,Upload} from 'tdesign-react';
import type {UploadFile} from 'tdesign-react';
import type {UploadRef} from 'tdesign-react/es/upload/interface';
import {UploadIcon,DeleteIcon,AddIcon} from 'tdesign-icons-react';
import type {ClinicalBlock,ClinicalContent} from './clinicalContent.mjs';
import {clinicalContentError} from './clinicalContent.mjs';
import type {Attachment} from './model';
import {getFile,saveClinicalMedia} from './files';
const paragraph=():ClinicalBlock=>({id:crypto.randomUUID(),type:'paragraph',text:'',bold:false});
export function initialClinicalContent(text:string):ClinicalContent {return {version:1,blocks:[{id:crypto.randomUUID(),type:'paragraph',text,bold:false}]};}
function Media({owner,file,preview=false}:{owner:string;file:Attachment;preview?:boolean}) {
 const [url,setUrl]=useState(''),[error,setError]=useState('');
 useEffect(()=>{let active=true,objectUrl='';setUrl('');setError('');
  if(file.uploadedBy!==owner || file.storage!=='browser'){setError('媒体不可用或无访问权限。');return;}
  void getFile(owner,file).then(blob=>{if(active){objectUrl=URL.createObjectURL(blob);setUrl(objectUrl);}}).catch(()=>{if(active)setError('媒体读取失败，请重新上传。');});
  return()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[owner,file.id,file.uploadedBy,file.storage]);
 if(error)return <p role="alert" className="sales-error">{error}</p>;
 if(!url)return <p>正在读取媒体…</p>;
 return file.type==='video/mp4'?<video aria-label={file.name} src={url} controls preload="metadata" className={preview?'clinical-preview-media':undefined}/>:<img alt={file.name} src={url} className={preview?'clinical-preview-media':undefined}/>;
}
export function ClinicalReadOnly({owner,value,fallback='未记录'}:{owner:string;value?:ClinicalContent;fallback?:string}) {
 if(!value)return <span className="clinical-plain">{fallback}</span>;
 if(clinicalContentError(value,owner))return <p className="sales-error">设计需求内容不可读取。</p>;
 return <div className="clinical-readonly">{value.blocks.map(b=>'file'in b?<figure key={b.id}><Media owner={owner} file={b.file}/><figcaption>{b.file.name}</figcaption></figure>:b.type==='paragraph'?<p key={b.id} className={b.bold?'clinical-bold':undefined}>{b.text}</p>:b.type==='ol'?<ol key={b.id}>{b.text.split('\n').map((t,i)=><li key={i} className={b.bold?'clinical-bold':undefined}>{t}</li>)}</ol>:<ul key={b.id}>{b.text.split('\n').map((t,i)=><li key={i} className={b.bold?'clinical-bold':undefined}>{t}</li>)}</ul>)}</div>;
}
export function ClinicalEditor({owner,value,onChange,onBusyChange,error}:{owner:string;value:ClinicalContent;onChange:(v:ClinicalContent)=>void;onBusyChange:(v:boolean)=>void;error?:string}) {
 const latest=useRef(value);latest.current=value;
 const [active,setActive]=useState(value.blocks.find(b=>!('file'in b))?.id||'');
 const [files,setFiles]=useState<UploadFile[]>([]),[preview,setPreview]=useState<Attachment>();
 const upload=useRef<UploadRef>(null),pending=useRef(0),failedFiles=useRef<UploadFile[]>([]);
 const [failure,setFailure]=useState('');
 const update=(id:string,fields:object)=>onChange({...latest.current,blocks:latest.current.blocks.map(b=>b.id===id?{...b,...fields}:b)} as ClinicalContent);
 const removeMedia=(id:string)=>{onChange({version:1,blocks:latest.current.blocks.filter(b=>!('file'in b)||b.file.id!==id)});setFiles(prev=>prev.filter(f=>f.id!==id));};
 const current=value.blocks.find(b=>b.id===active);
 const format=(type:'paragraph'|'ol'|'ul')=>{if(current&&!('file'in current))update(current.id,{type});};
 const persist=async(file:UploadFile|UploadFile[])=>{
  pending.current++;onBusyChange(true);setFailure('');
  try{
   const raw=(Array.isArray(file)?file[0]:file).raw;if(!raw)throw Error('无法读取所选文件。');
   const saved=await saveClinicalMedia(owner,raw);
   const b:ClinicalBlock={id:crypto.randomUUID(),type:saved.type==='video/mp4'?'video':'image',file:saved};
   const blocks=[...latest.current.blocks],index=blocks.findIndex(x=>x.id===active);blocks.splice(index<0?blocks.length:index+1,0,b);
   onChange({version:1,blocks});
   return {status:'success' as const,response:{files:[saved]}};
  }catch(e){const message=(e as Error).message;failedFiles.current=(Array.isArray(file)?file:[file]).map(f=>({...f}));setFailure(message);void MessagePlugin.error(message);return{status:'fail' as const,error:message,response:{error:message}};}
  finally{pending.current--;onBusyChange(pending.current>0);}
 };
 return <div className={'clinical-editor'+(error?' clinical-editor-error':'')}>
  <div className="clinical-toolbar" role="toolbar" aria-label="设计需求编辑工具">
   <Button size="small" variant="text" aria-pressed={!!current&&'bold'in current&&current.bold} disabled={!current||'file'in current} onClick={()=>current&&'bold'in current&&update(current.id,{bold:!current.bold})}>加粗</Button>
   <Button size="small" variant="text" onClick={()=>format('paragraph')}>正文</Button><Button size="small" variant="text" onClick={()=>format('ul')}>无序列表</Button><Button size="small" variant="text" onClick={()=>format('ol')}>有序列表</Button>
   <Button size="small" variant="text" icon={<AddIcon size={16}/>} onClick={()=>{const b=paragraph();onChange({version:1,blocks:[...value.blocks,b]});setActive(b.id);}}>段落</Button>
  </div>
  <div className="clinical-blocks">{value.blocks.map((b,i)=>'file'in b?<figure key={b.id}><Media owner={owner} file={b.file}/><figcaption><span>{b.file.name}</span><Button size="small" variant="text" onClick={()=>setPreview(b.file)}>预览</Button><Button size="small" variant="text" theme="danger" icon={<DeleteIcon size={16}/>} onClick={()=>removeMedia(b.file.id)}>删除</Button></figcaption></figure>:<div key={b.id} className={'clinical-text-block'+(b.bold?' clinical-bold':'')}><span className="clinical-block-prefix" aria-hidden>{b.type==='ol'?'1.':b.type==='ul'?'•':''}</span><Textarea aria-label={`设计需求文字${i+1}`} value={b.text} placeholder="填写设计需求" autosize={{minRows:2,maxRows:12}} onFocus={()=>setActive(b.id)} onChange={text=>update(b.id,{text})}/>{value.blocks.length>1&&<Button size="small" variant="text" aria-label="删除段落" onClick={()=>onChange({version:1,blocks:value.blocks.filter(x=>x.id!==b.id)})}><DeleteIcon size={16}/></Button>}</div>)}</div>
  <div className="clinical-upload"><Upload ref={upload} theme="file" multiple accept="image/png,image/jpeg,image/webp,video/mp4" files={files} onChange={setFiles} onRemove={({file})=>{if(file?.id)removeMedia(String(file.id));}} requestMethod={persist} showUploadProgress useMockProgress={false}><Button size="small" variant="outline" icon={<UploadIcon size={16}/>}>插入图片 / 视频</Button></Upload>{failure&&<div role="alert" className="sales-error">{failure}<Button size="small" variant="text" onClick={()=>upload.current?.uploadFiles(failedFiles.current)}>重新上传</Button></div>}</div>
  <Dialog visible={!!preview} header="设计需求媒体预览" footer={false} onClose={()=>setPreview(undefined)}>{preview&&<Media owner={owner} file={preview} preview/>}</Dialog>
 </div>;
}
