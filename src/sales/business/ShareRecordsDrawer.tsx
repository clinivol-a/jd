import {useEffect,useState} from 'react';
import {Alert,Drawer,Empty,Pagination,Table,Tag} from 'tdesign-react';
import {formatDateTime} from '../../dateTime';
import {presentShareVisitor,presentShareOutcome} from './shareRecordPresentation';
import {business} from './client';
export type ShareStats={copyCount:number;accessCount:number;successCount:number;uniqueViewerCount:number;lastViewedAt:string|null};
type VisitRow={id:string;visitorId:string|null;visitorName:string;visitorRole:string;maskedPhone:string;at:string;outcome:string};
type Records={share:{resultName:string;orderId:string;initiatorName:string;recipientName:string;resultVersion:string;createdAt:string};stats:ShareStats;rows:VisitRow[];page:number;pageSize:number;total:number};
export function ShareRecordsDrawer({visible,token,onClose,onStats}:{visible:boolean;token:string;onClose:()=>void;onStats:(stats:ShareStats)=>void}){
  const [data,setData]=useState<Records|null>(null),[page,setPage]=useState(1),[loading,setLoading]=useState(false),[error,setError]=useState('');
  const [tableRegion,setTableRegion]=useState<HTMLDivElement|null>(null),[tableHeight,setTableHeight]=useState(520);
  useEffect(()=>{if(!visible||!tableRegion)return;const observer=new ResizeObserver(([entry])=>setTableHeight(Math.floor(entry.contentRect.height)));observer.observe(tableRegion);return()=>observer.disconnect()},[visible,tableRegion]);
  useEffect(()=>{setPage(1);setData(null)},[token,visible]);
  useEffect(()=>{if(!visible||!token)return;let active=true;const load=async(initial=false)=>{if(initial)setLoading(true);try{const value=await business<Records>(`share-records?token=${encodeURIComponent(token)}&page=${page}&pageSize=12`);if(active){setData(value);onStats(value.stats);setError('')}}catch(e){if(active)setError((e as Error).message)}finally{if(active&&initial)setLoading(false)}};void load(true);const timer=setInterval(()=>void load(),5000);return()=>{active=false;clearInterval(timer)}},[visible,token,page,onStats]);
  return <Drawer className="share-records-drawer" visible={visible} header="成果分享记录" placement="right" size="min(720px, 100vw)" footer={false} closeOnEscKeydown closeOnOverlayClick onClose={onClose}>
    <div className="share-records">
      {data&&<dl className="share-record-meta">
        <div><dt>成果名称</dt><dd>{data.share.resultName}</dd></div><div><dt>所属订单</dt><dd>{data.share.orderId}</dd></div>
        <div><dt>分享发起人</dt><dd>{data.share.initiatorName||'未记录'}</dd></div>
        <div><dt>累计成功查看次数</dt><dd>{data.stats.successCount}</dd></div><div><dt>最近查看时间</dt><dd>{data.stats.lastViewedAt?formatDateTime(data.stats.lastViewedAt):'暂无查看记录'}</dd></div>
      </dl>}
      {error&&<Alert theme="error" message={error}/>}
      <div className="share-record-table" ref={setTableRegion}><Table<VisitRow> maxHeight={tableHeight} rowKey="id" tableLayout="fixed" loading={loading} data={data?.rows||[]} empty={<Empty title="暂无查看记录"/>} columns={[
        {colKey:'visitorName',title:'访问者',width:150,ellipsis:true,cell:({row})=>presentShareVisitor(row).name},
        {colKey:'visitorRole',title:'访问身份',width:100,ellipsis:true,cell:({row})=>presentShareVisitor(row).role},
        {colKey:'at',title:'访问时间',width:165,cell:({row})=>formatDateTime(row.at)},
        {colKey:'outcome',title:'访问结果',width:110,cell:({row})=><Tag theme={row.outcome==='查看成功'?'success':'danger'} variant="light">{presentShareOutcome(row.outcome)}</Tag>}
      ]}/></div>
      <div className="project-pagination"><Pagination current={data?.page||page} pageSize={12} total={data?.total||0} showPageSize={false} showJumper={false} onCurrentChange={setPage}/></div>
    </div>
  </Drawer>;
}
