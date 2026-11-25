import type { SalesData, Order, Doctor, Hospital } from '../sales/model';
import type { Task, FlowEvent } from '../App';
export async function unifiedRequest<T>(action: string, body?: unknown): Promise<T> {
    const response = await fetch(`/api/admin/business/${action}`, { credentials: 'same-origin', method: body === undefined ? 'GET' : 'POST', headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-CliniVol-Request': '1' }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!response.headers.get('content-type')?.includes('application/json'))
        throw new Error('业务服务未连接，请使用当前本地集成服务。');
    const result = await response.json();
    if (!response.ok)
        throw new Error(result.error || '业务记录保存失败，请重试。');
    return result;
}
export type SharedSales = {
    catalogMode?: 'linked-only';
    orders: Order[];
    projects: NonNullable<SalesData['projects']>;
    events: SalesData['events'];
};
export type SharedDesigner = {
    catalogMode?: 'linked-only';
    tasks: Task[];
    events: FlowEvent[];
};
export type SalesDirectory={hospitals:Hospital[];orderDoctors:Doctor[];ownDoctors:(Doctor&{salesId?:string})[];events?:{id:string;objectId:string;at:string;actor:string;title:string;reason?:string;note?:string;noteSource?:'system-default'|'reviewer'}[]};
export function mergeSalesDirectory(current:SalesData,directory:SalesDirectory):SalesData{
 const doctors=[...current.doctors];
 for(const row of directory.ownDoctors){const index=doctors.findIndex(d=>d.id===row.id);const editedLocalFixture=row.seedOrigin==='existing-sales-synthetic-fixtures'&&row.version===1&&index>=0&&current.events.some(e=>e.target===row.id&&!e.id.startsWith('doctor-fixture:')&&e.source!=='institution-directory');if(editedLocalFixture)continue;if(index>=0)doctors[index]={...doctors[index],...row,owner:row.salesId||null};else if(row.phone)doctors.push({...row,owner:row.salesId||null});}
 const events=(directory.events||[]).map(e=>({id:e.id,target:e.objectId,at:e.at,actor:e.actor,title:e.title,detail:e.reason||e.note||'',read:current.events.find(old=>old.id===e.id)?.read??false,source:'institution-directory',reviewNoteSource:e.noteSource}));
 return {...current,hospitals:directory.hospitals,orderDoctors:directory.orderDoctors,doctors,events:[...current.events.filter(e=>!events.some(row=>row.id===e.id)),...events]};
}
export function mergeSharedSales(current: SalesData, shared: SharedSales): SalesData {
    if(shared.catalogMode==='linked-only'){const oldOrderTargets=new Set([...(current.orders||[]).map(o=>o.id),...(current.projects||[]).map(p=>p.id)]);return {...current,presentationRevision:28,orders:shared.orders,projects:shared.projects,events:[...current.events.filter(e=>!oldOrderTargets.has(e.target)&&e.source!=='isolated-shared'),...shared.events.map(e=>({...e,read:current.events.find(old=>old.id===e.id)?.read??e.read}))]};}
    const ids = new Set(shared.orders.map(o => o.id)), projectIds = new Set(shared.projects.map(p => p.id)), eventIds = new Set(shared.events.map(e => e.id));
    return { ...current, orders: [...current.orders.filter(o => o.source !== 'isolated-shared' && !ids.has(o.id)), ...shared.orders], projects: [...(current.projects || []).filter(p => p.source !== 'isolated-shared' && !projectIds.has(p.id)), ...shared.projects], events: [...current.events.filter(e => e.source !== 'isolated-shared' && !eventIds.has(e.id)), ...shared.events.map(event => ({ ...event, read: current.events.find(old => old.id === event.id)?.read ?? event.read }))] };
}
