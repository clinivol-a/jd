import {useEffect,useState} from 'react';
import {Button,Card,Empty} from 'tdesign-react';
import {PageBack} from '../PageBack';
import {ReadOnlyModel,type PreviewModel} from '../sales/business/ReadOnlyModel';
import {adminRequest,type Asset} from './model';

/** The admin inspects an exact display derivative, never mounts an editable professional workspace. */
export function AssetResultViewer({asset,onBack,backLabel}:{asset:Asset;onBack:()=>void;backLabel:string}){
 const [model,setModel]=useState<PreviewModel|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let active=true;setModel(null);setError('');
  const query=new URLSearchParams({resultId:asset.id,resultVersion:asset.version});
  void adminRequest<{model:PreviewModel}>('result-preview?'+query).then(result=>{if(active)setModel(result.model)}).catch(error=>{if(active)setError(error.message)});
  return()=>{active=false};
 },[asset.id,asset.version,attempt]);
 return <><PageBack label={backLabel} onBack={onBack}/><Card bordered={false} className="project-info-card admin-result-viewer-card"><div className="section-heading"><h2>{asset.name} · {asset.version}</h2></div>{model?<ReadOnlyModel model={model}/>:error?<div className="admin-result-empty"><Empty title={error} description={null}/><Button variant="text" onClick={()=>setAttempt(value=>value+1)}>重新加载</Button></div>:<p role="status">正在读取成果…</p>}</Card></>;
}
