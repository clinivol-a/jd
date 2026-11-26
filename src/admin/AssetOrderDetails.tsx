import type {ReactNode} from 'react';
import {Button,Card,Empty} from 'tdesign-react';
import {PageBack} from '../PageBack';
import {StageLabel} from '../projects/ProjectPages';
import {formatAuditTime} from '../dateTime';
import {AdminTable} from './AdminTable';
import {DataAuditStatus} from './DataAuditPanel';
import {assetKey,assetProgressText,assetUpdatedAt,isFormalAsset,orderAssetRows,requestedStages} from './assetRules.mjs';
import {assetFieldKeys} from './dataAuditRules.mjs';
import type {AdminState,Asset,AuditEvent,Order} from './model';
const stageNames=['三维重建','CAD 设计','有限元分析','3D 打印'] as const;
const at=(value:string|undefined|null)=>formatAuditTime(value)==='—'?'-':formatAuditTime(value);
function AssetFields({items}:{items:[string,ReactNode][]}){return <dl className="project-info-grid">{items.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value===undefined||value===null||value===''?'-':value}</dd></div>)}</dl>}
export function assetEvents(asset:Asset,data:AdminState){return data.events.filter(e=>e.resultId===asset.id&&(e.resultVersion===asset.version||!e.resultVersion&&(e.after as {version?:string})?.version===asset.version));}
function stageAssets(data:AdminState,orderId:string,stage:number){return data.assets.filter(a=>a.orderId===orderId&&a.stage===stage).sort((a,b)=>(Date.parse(b.submittedAt||'')||0)-(Date.parse(a.submittedAt||'')||0)||(Date.parse(assetUpdatedAt(b)||'')||0)-(Date.parse(assetUpdatedAt(a)||'')||0)||assetKey(a).localeCompare(assetKey(b)));}
function resultDescription(a:Asset|undefined,data:AdminState){
 if(!a)return '暂无成果';
 if(a.reviewStatus==='审核退回')return assetEvents(a,data).find(e=>e.type==='review-return')?.reason||'审核退回';
 if(a.reviewStatus==='待审核')return '成果已提交，等待审核';
 return a.locked?'正式成果已锁定':a.reviewStatus;
}
export function AssetOrderDetails({data,order,onAsset,onBack,backLabel}:{data:AdminState;order:Order;onAsset:(a:Asset)=>void;onBack:()=>void;backLabel:string}){
 const row=orderAssetRows(data).find(r=>r.id===order.id),stages=requestedStages(order);
 return <><PageBack label={backLabel} onBack={onBack}/>
  <Card bordered={false} className="project-info-card"><h2>订单信息</h2><AssetFields items={[
   ['订单编号',order.businessNo||'-'],['手术项目名称',order.name],['医院',data.hospitals.find(h=>h.id===order.hospitalId)?.name||'-'],
   ['患者',order.patientName||'-'],['设计阶段',<div className="project-stage-tags">{stages.map(s=><StageLabel key={s} stage={stageNames[s]}/>)}</div>],['订单状态',<DataAuditStatus value={order.status}/>],['成果进度',row?assetProgressText(row):'-']
  ]}/></Card>
  <Card bordered={false} className="project-stages-card"><div className="section-heading"><h2>专业成果</h2></div>{stages.length?<div className="project-stages">{stages.map(stage=>{
   const records=stageAssets(data,order.id,stage),current=records[0],formal=records.find(a=>isFormalAsset(a,data)),task=data.tasks.find(t=>t.orderId===order.id&&t.stage===stage);
   return <section className="project-stage admin-result-stage" key={stage}><div className="project-stage-title"><h3><StageLabel stage={stageNames[stage]}/></h3><DataAuditStatus value={task?.status||'未开始'}/></div>
    <AssetFields items={[
     ['当前成果审核状态',current?<DataAuditStatus value={current.reviewStatus}/>:'-'],
     ...(current&&(!formal||assetKey(current)!==assetKey(formal))?[["当前成果版本",current.version] as [string,ReactNode]]:[]),
     ['正式成果版本',formal?`${formal.version} · 已锁定`:'-'],
     ['审核人',current?.reviewerName||'-'],['审核时间',at(current?.reviewedAt)],['当前成果说明',resultDescription(current,data)]
    ]}/>
    {current&&<div className="admin-result-stage-action"><Button theme="primary" variant="text" onClick={()=>onAsset(current)}>查看成果</Button></div>}
   </section>;
  })}</div>:<div className="admin-result-empty"><Empty title="暂无数据" description={null}/></div>}</Card>
 </>;
}
export function AssetVersionDetail({asset,data,onAsset,renderHistory}:{asset:Asset;data:AdminState;onAsset:(a:Asset)=>void;renderHistory:(events:AuditEvent[])=>ReactNode}){
 const order=data.orders.find(o=>o.id===asset.orderId),versions=data.assets.filter(a=>a.orderId===asset.orderId&&a.projectId===asset.projectId&&a.taskId===asset.taskId).sort((a,b)=>(Date.parse(b.submittedAt||'')||0)-(Date.parse(a.submittedAt||'')||0)||assetKey(a).localeCompare(assetKey(b)));
 const fields:Record<string,[string,ReactNode]>={order:['订单编号',order?.businessNo||'-'],surgery:['手术项目名称',order?.name||'-'],hospital:['医院',data.hospitals.find(h=>h.id===order?.hospitalId)?.name||'-'],stage:['设计阶段',asset.stage===null?'-':<StageLabel stage={stageNames[asset.stage]}/>],name:['成果名称',asset.name],version:['成果版本',asset.version],review:['审核状态',<DataAuditStatus value={asset.reviewStatus}/>],submitted:['提交时间',at(asset.submittedAt)]};
 return <div className="admin-review-sections"><section><h3>基本资料</h3><AssetFields items={[...assetFieldKeys('results').map(k=>fields[k]),['正式成果锁定',asset.locked?'已锁定':'未锁定'],['提交人',asset.submittedByName||'-'],['审核人',asset.reviewerName||'-'],['审核时间',at(asset.reviewedAt)]]}/></section>
  <section><h3>历史版本</h3><AdminTable rows={versions.map(a=>({id:assetKey(a),asset:a}))} columns={[
   {key:'version',label:'成果版本',width:100,render:({asset:a})=>a.version},
   {key:'review',label:'审核状态',width:110,render:({asset:a})=><DataAuditStatus value={a.reviewStatus}/>},
   {key:'locked',label:'正式成果锁定',width:120,render:({asset:a})=>a.locked?'已锁定':'未锁定'},
   {key:'submitted',label:'提交时间',width:155,render:({asset:a})=>at(a.submittedAt)},
   {key:'action',label:'操作',width:100,render:({asset:a})=><Button theme="primary" variant="text" onClick={()=>onAsset(a)}>查看详情</Button>}
  ]}/></section>
  <section><h3>审核记录</h3>{renderHistory(assetEvents(asset,data))}</section>
 </div>;
}
