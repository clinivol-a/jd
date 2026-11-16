import { useEffect, useState } from 'react';
import { Alert, Button, Card, DatePicker, Empty, Input, Table, Tag } from 'tdesign-react';
import type { SalesData } from '../model';
import { visibleOrders } from '../model';
import { PageBack } from '../../PageBack';
import { formatDateTime } from '../../dateTime';
import { OrderResults } from './OrderResults';
import { business } from './client';
const currentMonth = () => `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
export function InsuranceSummary({ cancel, data }: {
    cancel: () => void;
    data: SalesData;
}) {
    const [month, setMonth] = useState(currentMonth), [orders, setOrders] = useState<any[]>([]), [ids, setIds] = useState<(string | number)[]>([]), [error, setError] = useState(''), [busy, setBusy] = useState(false), [allowed, setAllowed] = useState(false), [code, setCode] = useState(''), [proof, setProof] = useState(''), [message, setMessage] = useState(''), [retry, setRetry] = useState(0), [showSample, setShowSample] = useState(false);
    const load = () => { setBusy(true); setError(''); void business('projection', { orders: visibleOrders(data).map(o => ({ id: o.id, status: o.status, ownerSalesId: o.ownerSalesId || data.ownerId, hospital: data.hospitals.find(h => h.id === o.hospitalId)?.name, patientName: o.patientName || data.cases.find(c => c.id === o.caseId)?.patientName, completedAt: o.completedAt })) }).then(() => business('export-list?month=' + month)).then(r => setOrders(r.orders)).catch(e => setError(e.message)).finally(() => setBusy(false)); };
    useEffect(() => { void business('capabilities').then(r => setAllowed(r.insuranceExport)).catch(e => setError(e.message)); }, []);
    useEffect(() => { setIds([]); load(); }, [month]);
    useEffect(() => { if (!retry)
        return; const t = setTimeout(() => setRetry(n => n - 1), 1000); return () => clearTimeout(t); }, [retry]);
    const exporting = async () => { setBusy(true); setError(''); try {
        const response = await fetch('/api/business-v31/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ month, ids, proof }) });
        if (!response.ok)
            throw Error((await response.json()).error);
        const url = URL.createObjectURL(await response.blob()), a = document.createElement('a');
        a.href = url;
        a.download = `科立沃医保内部汇总-${month}.xlsx`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setMessage('汇总文件已生成，导出记录已保存。');
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } };
    return <div className="project-page project-detail-page business-insurance"><PageBack label="返回订单管理" onBack={cancel}/><Card bordered={false} className="project-info-card"><h2>医保填报汇总</h2><div className="sales-actions"><DatePicker mode="month" value={month} onChange={v => setMonth(String(v).slice(0, 7))}/><Button theme="default" onClick={() => setMonth(currentMonth())}>本月</Button><Button theme="default" onClick={() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }}>上月</Button></div><Table tableLayout="fixed" loading={busy} rowKey="id" data={orders} selectedRowKeys={ids} onSelectChange={setIds} empty={<Empty description="本月暂无可导出的授权已完成订单"/>} columns={[{ colKey: 'row-select', type: 'multiple', width: 40 }, { colKey: 'id', title: '订单编号', width: 210, ellipsis: true }, { colKey: 'hospital', title: '医院', width: 180, ellipsis: true }, { colKey: 'patientName', title: '患者', width: 90 }, { colKey: 'completedAt', title: '完成时间', width: 180, cell: ({ row }) => formatDateTime(row.completedAt) }, { colKey: 'issues', title: '资料完整性', width: 300, ellipsis: true, cell: ({ row }) => row.issues.length ? <Tag theme="warning">{row.issues.join('、')}</Tag> : <Tag theme="success">完整</Tag> }]}/><p>已选择 {ids.length} 条</p>{message && <p className="field-hint">{message}</p>}<Button theme="primary" disabled={!allowed || !ids.length || orders.some(o => ids.includes(o.id) && o.issues.length)} loading={busy} onClick={() => void exporting()}>生成Excel</Button>{error && <Alert theme="error" message={error}/>}</Card>{false && orders.filter(o => o.dataOrigin === 'isolated-acceptance').map(o => <OrderResults key={o.id} orderId={o.id}/>)}</div>;
}
