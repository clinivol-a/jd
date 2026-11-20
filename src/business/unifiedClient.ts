import type { SalesData, Order } from '../sales/model';
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
    orders: Order[];
    projects: NonNullable<SalesData['projects']>;
    events: SalesData['events'];
};
export type SharedDesigner = {
    tasks: Task[];
    events: FlowEvent[];
};
export function mergeSharedSales(current: SalesData, shared: SharedSales): SalesData {
    const ids = new Set(shared.orders.map(o => o.id)), projectIds = new Set(shared.projects.map(p => p.id)), eventIds = new Set(shared.events.map(e => e.id));
    return { ...current, orders: [...current.orders.filter(o => o.source !== 'isolated-shared' && !ids.has(o.id)), ...shared.orders], projects: [...(current.projects || []).filter(p => p.source !== 'isolated-shared' && !projectIds.has(p.id)), ...shared.projects], events: [...current.events.filter(e => e.source !== 'isolated-shared' && !eventIds.has(e.id)), ...shared.events.map(event => ({ ...event, read: current.events.find(old => old.id === event.id)?.read ?? event.read }))] };
}
