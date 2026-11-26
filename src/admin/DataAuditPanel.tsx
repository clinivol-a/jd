import {useEffect,useRef,useState} from 'react';
import {Button,Card,DateRangePicker,Input,Select,Tabs,Tag} from 'tdesign-react';
import {AdminTable,FullText} from './AdminTable';
import type {Column} from './AdminTable';
import type {AdminState,Asset,AuditEvent,Share} from './model';
import {StageTypeIcon} from '../projects/ProjectPages';
import {formatAuditTime as auditTime} from '../dateTime';
import {dataAuditTheme,assetFieldKeys,assetMatches,auditMatches,auditObjectName,businessLabel,chronologicalRecords} from './dataAuditRules.mjs';
import {useWorkspaceStorage} from '../auth/AuthContext';
const formatAuditTime=(value:string|undefined)=>{const text=auditTime(value);return text==='—'?'-':text};
function useAuditFilters<T extends object>(key:string,defaults:T){
 const storage=useWorkspaceStorage();
 const [value,setValue]=useState<T>(()=>{try{const saved=JSON.parse(storage.getItem(key)||'null');return saved&&typeof saved==='object'?Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,(Array.isArray(v)?Array.isArray(saved[k]):typeof saved[k]===typeof v)?saved[k]:v])) as T:defaults}catch{return defaults}});
 useEffect(()=>{storage.setItem(key,JSON.stringify(value))},[key,storage,value]);
 const previous=useRef(JSON.stringify(value));useEffect(()=>{const next=JSON.stringify(value);if(previous.current!==next){window.dispatchEvent(new Event('clinivol-admin-reset-pages'));previous.current=next}},[value]);
 return [value,setValue] as const;
}
const stages=['三维重建','CAD 设计','有限元分析','3D 打印'] as const;
export function DataAuditStatus({value}:{value:string}){return <Tag variant="light" theme={dataAuditTheme(value)}>{businessLabel(value||'-')}</Tag>}
const options=(values:string[])=>[{label:'全部',value:''},...values.filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).map(label=>({label:businessLabel(label),value:label}))];
export function DataAssetPanel({data,canExport,tab,onTab,onOrder,onAsset,onShare,onExport}:{data:AdminState;canExport:boolean;tab:string;onTab:(tab:string)=>void;onOrder:(id:string)=>void;onAsset:(a:Asset)=>void;onShare:(s:Share)=>void;onExport:(ids:string[])=>void}){
 const [filters,setFilters]=useAuditFilters('admin-assets-filters',{query:'',hospitalId:'',stage:'',status:'',publishStatus:''});
 const {query,hospitalId,stage,status,publishStatus}=filters;
 const update=(key:keyof typeof filters)=>(value:string)=>setFilters(previous=>({...previous,[key]:value}));
 const setQuery=update('query'),setHospital=update('hospitalId'),setStage=update('stage'),setStatus=update('status'),setPublish=update('publishStatus');
 const active=tab==='shares'?'shares':'results';

 const reset=()=>{setQuery('');setHospital('');setStage('');setStatus('');setPublish('');window.dispatchEvent(new Event('clinivol-admin-reset-pages'))};
 const order=(id:string)=>data.orders.find(o=>o.id===id),hospital=(id:string)=>data.hospitals.find(h=>h.id===order(id)?.hospitalId)?.name||'-';
 const orderLink=(id:string)=><Button className="admin-business-number" theme="default" variant="text" onClick={()=>onOrder(id)}>{order(id)?.businessNo||'-'}</Button>;
 const rows=chronologicalRecords(data.assets.filter(a=>assetMatches(a,data,{query,hospitalId,stage,status,publishStatus})));
 const allFields:Column<Asset>[]=[{key:'order',label:'订单编号',width:155,render:r=>orderLink(r.orderId)},{key:'name',label:'成果名称',width:180,render:r=><FullText>{r.name}</FullText>},{key:'hospital',label:'医院',width:220,render:r=><FullText>{hospital(r.orderId)}</FullText>},{key:'stage',label:'设计阶段',width:110,render:r=>r.stage===null?'-':<StageTypeIcon stage={stages[r.stage]}/>},{key:'version',label:'成果版本',width:100,render:r=>r.version},{key:'review',label:'审核状态',width:110,render:r=><DataAuditStatus value={r.reviewStatus}/>},{key:'publish',label:'发布状态',width:110,render:r=><DataAuditStatus value={r.publishStatus}/>},{key:'submitter',label:'提交人',width:110,render:r=>r.submittedByName||'-'},{key:'submitted',label:'提交时间',width:155,render:r=>formatAuditTime(r.submittedAt)}];
 allFields.push({key:'reviewer',label:'审核人',width:110,render:r=>r.reviewerName||'-'},{key:'reviewed',label:'审核时间',width:155,render:r=>formatAuditTime(r.reviewedAt)});
 const fields=assetFieldKeys(active).map(key=>allFields.find(c=>c.key===key)!).filter(Boolean);
 fields.push({key:'action',label:'操作',width:110,render:r=><Button theme="primary" variant="text" onClick={()=>onAsset(r)}>查看详情</Button>});
 const shares=data.shares.filter(s=>(!query||[s.name,order(s.orderId)?.businessNo,s.initiatorName,hospital(s.orderId)].some(v=>String(v||'').toLowerCase().includes(query.trim().toLowerCase())))&&(!hospitalId||order(s.orderId)?.hospitalId===hospitalId));
 return <Card bordered={false} className="project-list-card admin-data-audit-card"><div className="project-page-heading"><h1>数据资产</h1>{active!=='shares'&&<Button theme="primary" disabled={!canExport||!rows.length} onClick={()=>onExport(rows.map(a=>a.id))}>导出资产信息</Button>}</div><Tabs value={active} onChange={value=>{onTab(String(value));reset()}}><Tabs.TabPanel value="results" label="专业成果"/><Tabs.TabPanel value="shares" label="成果分享管理"/></Tabs>
 <div className="project-filters admin-filters"><label><span>关键词</span><Input aria-label="资产关键词" value={query} clearable placeholder={active==='shares'?'搜索订单编号、成果或发起人':'搜索订单编号、成果或手术项目'} onChange={setQuery}/></label><label><span>医院</span><Select aria-label="资产医院" filterable value={hospitalId} options={options(data.hospitals.map(h=>h.id)).map(o=>({...o,label:o.value?data.hospitals.find(h=>h.id===o.value)!.name:'全部'}))} onChange={v=>setHospital(String(v))}/></label>{active!=='shares'&&<><label><span>设计阶段</span><Select aria-label="资产设计阶段" value={stage} options={[{label:'全部',value:''},...stages.map((label,index)=>({label:label.replace(/ /g,''),value:String(index)}))]} onChange={v=>setStage(String(v))}/></label>{active==='results'&&<><label><span>审核状态</span><Select aria-label="成果审核状态" value={status} options={options(data.assets.map(a=>a.reviewStatus))} onChange={v=>setStatus(String(v))}/></label><label><span>发布状态</span><Select aria-label="成果发布状态" value={publishStatus} options={options(data.assets.map(a=>a.publishStatus))} onChange={v=>setPublish(String(v))}/></label></>}</>}<Button variant="outline" onClick={reset}>重置筛选</Button></div>
 {active==='shares'?<AdminTable rows={shares} columns={[{key:'order',label:'订单编号',width:155,render:r=>orderLink(r.orderId)},{key:'name',label:'成果名称',width:200,render:r=><FullText>{r.name}</FullText>},{key:'hospital',label:'医院',width:220,render:r=><FullText>{hospital(r.orderId)}</FullText>},{key:'stage',label:'设计阶段',width:100,render:r=>r.stage===undefined||r.stage===null?'-':<StageTypeIcon stage={stages[r.stage]}/>},{key:'version',label:'成果版本',width:100,render:r=>r.resultVersion||'-'},{key:'initiator',label:'分享发起人',width:110,render:r=>r.initiatorName||'-'},{key:'views',label:'成功查看次数',width:130,render:r=>r.successCount},{key:'recent',label:'最近查看时间',width:155,render:r=>formatAuditTime(r.lastViewedAt)},{key:'action',label:'操作',width:110,render:r=><Button theme="primary" variant="text" onClick={()=>onShare(r)}>查看详情</Button>}]}/>:<AdminTable rows={rows} columns={fields}/>}
 </Card>;
}
export function AuditLogPanel({data,onInspect}:{data:AdminState;onInspect:(e:AuditEvent)=>void}){
 const [filters,setFilters]=useAuditFilters('admin-audit-filters',{category:'',result:'',range:[] as string[]});
 const {category,result,range}=filters;const setCategory=(category:string)=>setFilters(v=>({...v,category})),setResult=(result:string)=>setFilters(v=>({...v,result})),setRange=(range:string[])=>setFilters(v=>({...v,range}));
 const rows=chronologicalRecords(data.events).filter(e=>auditMatches(e,data,{category,result,range}));
 return <Card bordered={false} className="project-list-card admin-data-audit-card"><div className="project-page-heading"><h1>审计日志</h1></div><div className="project-filters admin-filters"><label><span>业务类型</span><Select aria-label="审计业务类型" value={category} options={options(data.events.map(e=>businessLabel(e.category)))} onChange={v=>setCategory(String(v))}/></label><label><span>操作结果</span><Select aria-label="审计操作结果" value={result} options={options(data.events.map(e=>e.result))} onChange={v=>setResult(String(v))}/></label><label><span>操作时间</span><DateRangePicker aria-label="审计操作时间" value={range} clearable onChange={v=>setRange(v as string[])}/></label><Button variant="outline" onClick={()=>{setCategory('');setResult('');setRange([]);window.dispatchEvent(new Event('clinivol-admin-reset-pages'))}}>重置筛选</Button></div><AdminTable rows={rows} columns={[{key:'title',label:'事件',width:210,render:r=><FullText>{businessLabel(r.title)}</FullText>},{key:'category',label:'业务类型',width:130,render:r=>businessLabel(r.category)},{key:'object',label:'业务对象',width:180,render:r=><FullText>{auditObjectName(r,data)}</FullText>},{key:'actor',label:'操作人',width:110,render:r=>r.actor||'-'},{key:'time',label:'操作时间',width:155,render:r=>formatAuditTime(r.at)},{key:'result',label:'操作结果',width:110,render:r=><DataAuditStatus value={r.result}/>},{key:'reason',label:'操作说明',width:250,render:r=><FullText>{[r.reason,r.basis&&`审核依据：${r.basis}`].filter(Boolean).join('；')||'-'}</FullText>},{key:'action',label:'操作',width:110,render:r=><Button theme="primary" variant="text" onClick={()=>onInspect(r)}>查看详情</Button>}]}/></Card>;
}
