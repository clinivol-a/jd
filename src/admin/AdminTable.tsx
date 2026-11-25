import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {useViewportPagination} from '../tables/useViewportPagination';
import {useWorkspaceStorage} from '../auth/AuthContext';
import type {ReactNode} from 'react';
import {Empty,Pagination,Table,Tooltip} from 'tdesign-react';
export type Column<T>={key:string;label:string;width?:number;render:(row:T)=>ReactNode};
export function AdminTable<T extends {id:string}>({rows,columns,paginate=true,fixedPageSize}:{rows:T[];columns:Column<T>[];paginate?:boolean;fixedPageSize?:number}){
 const storage=useWorkspaceStorage();
 const identity=location.hash+columns.map(c=>c.key).join('|');
 const key='admin-table-page:'+Array.from(identity).reduce((h,c)=>Math.imul(h,31)+c.charCodeAt(0)|0,0);
 const readPage=()=>Math.max(1,Number(storage.getItem(key))||1);
 const initialPage=useRef({key,page:readPage()});
 const [page,setPage]=useState(readPage),total=rows.length;
 const paging=useViewportPagination(total,key,{enabled:paginate&&!fixedPageSize,page,onChange:value=>{setPage(value);storage.setItem(key,String(value))}}),size=fixedPageSize||paging.pageSize;
 useEffect(()=>{const reset=()=>{storage.setItem(key,'1');setPage(1)};window.addEventListener('clinivol-admin-reset-pages',reset);return()=>window.removeEventListener('clinivol-admin-reset-pages',reset)},[key,storage]);
 useLayoutEffect(()=>{const saved=initialPage.current.key===key?initialPage.current.page:readPage();initialPage.current={key,page:saved};const frame=requestAnimationFrame(()=>{setPage(saved);storage.setItem(key,String(saved))});return()=>cancelAnimationFrame(frame)},[key]);
 const safePage=Math.min(page,Math.max(1,Math.ceil(total/size))),visible=paginate?rows.slice((safePage-1)*size,safePage*size):rows;
 return <div className={`admin-data-table viewport-table ${paginate&&!fixedPageSize?'admin-full-table':'admin-embedded-table'}`} ref={paging.ref} data-total={total} data-page-size={size}><Table<T> rowKey="id" data={visible} columns={columns.map(c=>({colKey:c.key,title:c.label,width:c.width||(['action','actions'].includes(c.key)?110:undefined),fixed:['action','actions'].includes(c.key)?'right' as const:undefined,align:'left' as const,className:['action','actions'].includes(c.key)?'business-action-cell admin-action-cell':undefined,ellipsis:true,cell:({row}:{row:T})=>c.render(row)}))} tableLayout="fixed" hover bordered={false} className="app-table" empty={<Empty title="暂无数据" description={null}/>}/>{(fixedPageSize?paginate&&total>size:paging.showPagination)&&<div className="table-pagination" data-viewport-pagination><Pagination current={safePage} pageSize={size} total={total} showPageSize={false} showJumper={false} onCurrentChange={value=>{setPage(value);storage.setItem(key,String(value))}}/></div>}</div>
}
export function FullText({children}:{children:string}){return <Tooltip content={children}><span className="admin-ellipsis">{children}</span></Tooltip>}
