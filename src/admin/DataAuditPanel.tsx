import {useEffect,useRef,useState} from 'react';
import {Button,Card,DateRangePicker,Input,Select,Tabs,Tag} from 'tdesign-react';
import {AdminTable,FullText} from './AdminTable';
import type {Column} from './AdminTable';
import type {AdminState,AuditEvent,Share} from './model';
import {StageTypeIcon} from '../projects/ProjectPages';
import {formatAuditTime as auditTime} from '../dateTime';
import {dataAuditTheme,auditMatches,auditObjectName,businessLabel,chronologicalRecords} from './dataAuditRules.mjs';
import {useWorkspaceStorage} from '../auth/AuthContext';
import {orderAssetRows,assetProgressText,assetExportSelection} from './assetRules.mjs';
import type {AssetExportScope,AssetOrderRow} from './assetRules.mjs';
const formatAuditTime=(value:string|undefined)=>{const text=auditTime(value);return text==='—'?'-':text};
function useAuditFilters<T extends object>(key:string,defaults:T){
 const storage=useWorkspaceStorage();
 const [value,setValue]=useState<T>(()=>{try{const saved=JSON.parse(storage.getItem(key)||'null');return saved&&typeof saved==='object'?Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,(Array.isArray(v)?Array.isArray(saved[k]):typeof saved[k]===typeof v)?saved[k]:v])) as T:defaults}catch{return defaults}});
 useEffect(()=>{storage.setItem(key,JSON.stringify(value))},[key,storage,value]);
 const previous=useRef(JSON.stringify(value));useEffect(()=>{const next=JSON.stringify(value);if(previous.current!==next){window.dispatchEvent(new Event('clinivol-admin-reset-pages'));previous.current=next}},[value]);
 return [value,setValue] as const;
}
const stages=['三维重建','CAD 设计','有限元分析','3D 打印'] as const;
export function DataAuditStatus({value}:{value:string}){const progress=['进行中','处理中'].includes(value);return <Tag variant="light" theme={progress?'primary':value==='已完成'?'success':dataAuditTheme(value)} className={progress?'status-in-progress':undefined}>{businessLabel(value||'-')}</Tag>}
const options=(values:string[])=>[{label:'全部',value:''},...values.filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).map(label=>({label:businessLabel(label),value:label}))];
export function DataAssetPanel({data,canExport,tab,onTab,onOrder,onOrderResults,onShare,onExport}:{data:AdminState;canExport:boolean;tab:string;onTab:(tab:string)=>void;onOrder:(id:string)=>void;onOrderResults:(id:string)=>void;onShare:(s:Share)=>void;onExport:(scope:AssetExportScope)=>void}){
 const [filters,setFilters]=useAuditFilters('admin-assets-results-v2',{orderNo:'',hospitalId:'',stage:'',completion:''});
 const [shareFilters,setShareFilters]=useAuditFilters('admin-assets-shares-v2',{orderNo:'',hospitalId:''});
 const active=tab==='shares'?'shares':'results';
 const scope:AssetExportScope={view:'orders',filters:{orderNo:filters.orderNo,hospitalId:filters.hospitalId,stage:filters.stage,completion:filters.completion}};
 const selection=assetExportSelection(data,scope),orders=orderAssetRows(data,scope.filters);
 const change=(key:keyof typeof filters,value:string)=>setFilters(previous=>({...previous,[key]:value}));
 const reset=()=>active==='shares'?setShareFilters({orderNo:'',hospitalId:''}):setFilters(previous=>({...previous,orderNo:'',hospitalId:'',stage:'',completion:''}));
 const order=(id:string)=>data.orders.find(o=>o.id===id),hospital=(id:string)=>data.hospitals.find(h=>h.id===order(id)?.hospitalId)?.name||'-';
 const orderLink=(id:string)=><Button className="admin-business-number" theme="default" variant="text" onClick={()=>onOrder(id)}>{order(id)?.businessNo||'-'}</Button>;
 const hospitalOptions=[{label:'全部',value:''},...data.hospitals.map(h=>({label:h.name,value:h.id}))];
 const orderFields:Column<AssetOrderRow>[]=[
  {key:'order',label:'订单编号',width:155,render:r=>orderLink(r.id)},
  {key:'surgery',label:'手术项目名称',width:220,render:r=><FullText>{r.order.name}</FullText>},
  {key:'hospital',label:'医院',width:220,render:r=><FullText>{hospital(r.id)}</FullText>},
  {key:'stage',label:'设计阶段',width:150,render:r=><div className="project-stage-tags">{r.stages.map(s=><StageTypeIcon key={s} stage={stages[s]}/>)}</div>},
  {key:'progress',label:'成果进度',width:180,render:assetProgressText},
  {key:'updated',label:'最近更新时间',width:155,render:r=>formatAuditTime(r.updatedAt||undefined)},
  {key:'action',label:'操作',width:110,render:r=><Button theme="primary" variant="text" onClick={()=>onOrderResults(r.id)}>查看详情</Button>}
 ];
 const shares=data.shares.filter(s=>(!shareFilters.orderNo||String(order(s.orderId)?.businessNo||'').toLowerCase().includes(shareFilters.orderNo.trim().toLowerCase()))&&(!shareFilters.hospitalId||order(s.orderId)?.hospitalId===shareFilters.hospitalId));
 return <Card bordered={false} className="project-list-card admin-data-audit-card">
  <div className="project-page-heading"><h1>数据资产</h1>{active!=='shares'&&<Button theme="primary" disabled={!canExport||!selection.orders.length} onClick={()=>onExport(scope)}>导出资产信息</Button>}</div>
  <Tabs value={active} onChange={value=>{onTab(String(value));window.dispatchEvent(new Event('clinivol-admin-reset-pages'))}}><Tabs.TabPanel value="results" label="专业成果"/><Tabs.TabPanel value="shares" label="成果分享管理"/></Tabs>
  <div className="project-filters admin-filters">
   {active==='shares'?<label><span>订单编号</span><Input aria-label="分享订单编号" value={shareFilters.orderNo} clearable placeholder="搜索订单编号" onChange={orderNo=>setShareFilters(v=>({...v,orderNo}))}/></label>:<label><span>订单编号</span><Input aria-label="成果订单编号" value={filters.orderNo} clearable placeholder="搜索订单编号" onChange={v=>change('orderNo',v)}/></label>}
   <label><span>医院</span><Select aria-label="资产医院" filterable value={active==='shares'?shareFilters.hospitalId:filters.hospitalId} options={hospitalOptions} onChange={v=>active==='shares'?setShareFilters(p=>({...p,hospitalId:String(v)})):change('hospitalId',String(v))}/></label>
   {active!=='shares'&&<><label><span>设计阶段</span><Select aria-label="资产设计阶段" value={filters.stage} options={[{label:'全部',value:''},...stages.map((label,index)=>({label:label.replace(/ /g,''),value:String(index)}))]} onChange={v=>change('stage',String(v))}/></label><label><span>成果进度</span><Select aria-label="成果进度" value={filters.completion} options={[{label:'全部',value:''},{label:'尚无阶段通过',value:'none'},{label:'部分阶段通过',value:'partial'},{label:'全部阶段通过',value:'complete'}]} onChange={v=>change('completion',String(v))}/></label></>}
   <Button variant="outline" onClick={reset}>重置筛选</Button>
  </div>
  {active==='shares'?<AdminTable rows={shares} columns={[{key:'order',label:'订单编号',width:155,render:r=>orderLink(r.orderId)},{key:'name',label:'成果名称',width:200,render:r=><FullText>{r.name}</FullText>},{key:'hospital',label:'医院',width:220,render:r=><FullText>{hospital(r.orderId)}</FullText>},{key:'stage',label:'设计阶段',width:100,render:r=>r.stage===undefined||r.stage===null?'-':<StageTypeIcon stage={stages[r.stage]}/>},{key:'version',label:'成果版本',width:100,render:r=>r.resultVersion||'-'},{key:'initiator',label:'分享发起人',width:110,render:r=>r.initiatorName||'-'},{key:'views',label:'成功查看次数',width:130,render:r=>r.successCount},{key:'recent',label:'最近查看时间',width:155,render:r=>formatAuditTime(r.lastViewedAt)},{key:'action',label:'操作',width:110,render:r=><Button theme="primary" variant="text" onClick={()=>onShare(r)}>查看详情</Button>}]}/>:<AdminTable rows={orders} columns={orderFields}/>}
 </Card>;
}
export function AuditLogPanel({data,onInspect}:{data:AdminState;onInspect:(e:AuditEvent)=>void}){
 const [filters,setFilters]=useAuditFilters('admin-audit-filters',{category:'',result:'',range:[] as string[]});
 const {category,result,range}=filters;const setCategory=(category:string)=>setFilters(v=>({...v,category})),setResult=(result:string)=>setFilters(v=>({...v,result})),setRange=(range:string[])=>setFilters(v=>({...v,range}));
 const rows=chronologicalRecords(data.events).filter(e=>auditMatches(e,data,{category,result,range}));
 return <Card bordered={false} className="project-list-card admin-data-audit-card"><div className="project-page-heading"><h1>审计日志</h1></div><div className="project-filters admin-filters"><label><span>业务类型</span><Select aria-label="审计业务类型" value={category} options={options(data.events.map(e=>businessLabel(e.category)))} onChange={v=>setCategory(String(v))}/></label><label><span>操作结果</span><Select aria-label="审计操作结果" value={result} options={options(data.events.map(e=>e.result))} onChange={v=>setResult(String(v))}/></label><label><span>操作时间</span><DateRangePicker aria-label="审计操作时间" value={range} clearable onChange={v=>setRange(v as string[])}/></label><Button variant="outline" onClick={()=>{setCategory('');setResult('');setRange([]);window.dispatchEvent(new Event('clinivol-admin-reset-pages'))}}>重置筛选</Button></div><AdminTable rows={rows} columns={[{key:'title',label:'事件',width:210,render:r=><FullText>{businessLabel(r.title)}</FullText>},{key:'category',label:'业务类型',width:130,render:r=>businessLabel(r.category)},{key:'object',label:'业务对象',width:180,render:r=><FullText>{auditObjectName(r,data)}</FullText>},{key:'actor',label:'操作人',width:110,render:r=>r.actor||'-'},{key:'time',label:'操作时间',width:155,render:r=>formatAuditTime(r.at)},{key:'result',label:'操作结果',width:110,render:r=><DataAuditStatus value={r.result}/>},{key:'reason',label:'操作说明',width:250,render:r=><FullText>{[r.reason,r.basis&&`审核依据：${r.basis}`].filter(Boolean).join('；')||'-'}</FullText>},{key:'action',label:'操作',width:110,render:r=><Button theme="primary" variant="text" onClick={()=>onInspect(r)}>查看详情</Button>}]}/></Card>;
}
