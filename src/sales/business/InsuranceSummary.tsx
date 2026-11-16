import { useEffect, useState } from 'react';
import { Alert, Button, Card, DatePicker, Empty, ImageViewer, Table, Pagination, MessagePlugin } from 'tdesign-react';
import type { SalesData } from '../model';
import { PageBack } from '../../PageBack';
import { formatDateTime } from '../../dateTime';
import { business } from './client';
import { syncOrders } from './projection';
const currentMonth = () => `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
export function InsuranceSummary({ cancel, data }: {
    cancel: () => void;
    data: SalesData;
}) {
    const [month, setMonth] = useState(currentMonth), [orders, setOrders] = useState<any[]>([]), [ids, setIds] = useState<(string | number)[]>([]), [error, setError] = useState(''), [busy, setBusy] = useState(false), [allowed, setAllowed] = useState(false), [page, setPage] = useState(1), [preview, setPreview] = useState('');
    useEffect(() => { void business('capabilities').then(r => setAllowed(r.insuranceExport)).catch(e => setError(e.message)); }, []);
    useEffect(() => {
        let active = true;
        setIds([]);
        setPage(1);
        setBusy(true);
        setError('');
        void syncOrders(data).then(() => business('export-list?month=' + month)).then(r => {
            if (active)
                setOrders(r.orders);
        }).catch(e => {
            if (active)
                setError(e.message);
        }).finally(() => {
            if (active)
                setBusy(false);
        });
        return () => { active = false; };
    }, [month, data]);
    const exporting = async () => {
        setBusy(true);
        setError('');
        try {
            const selected = orders.filter(o => ids.includes(o.id)), incomplete = selected.find(o => o.issues.length);
            if (incomplete)
                throw Error(`订单${incomplete.id}缺少：${incomplete.issues.join('、')}。`);
            const response = await fetch('/api/business-v31/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ month, ids }) });
            if (!response.ok)
                throw Error((await response.json()).error);
            const url = URL.createObjectURL(await response.blob()), a = document.createElement('a');
            a.href = url;
            a.download = `科立沃医保填报汇总-${month}.xlsx`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            void MessagePlugin.success('汇总文件已生成。');
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    };
    return <div className="project-page project-detail-page business-insurance"><PageBack label="返回订单管理" onBack={cancel}/><Card bordered={false} className="project-info-card"><div className="project-page-heading"><h2>医保填报汇总</h2><Button theme="primary" disabled={!allowed || !ids.length} loading={busy} onClick={() => void exporting()}>生成Excel</Button></div><div className="sales-actions business-month-filter"><DatePicker mode="month" value={month} onChange={v => setMonth(String(v).slice(0, 7))}/><Button theme="default" onClick={() => setMonth(currentMonth())}>本月</Button><Button theme="default" onClick={() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }}>上月</Button></div><Table tableLayout="fixed" loading={busy} rowKey="id" data={orders.slice((page - 1) * 12, page * 12)} selectedRowKeys={ids} onSelectChange={setIds} empty={<Empty description="本月暂无已完成订单"/>} columns={[{ colKey: 'row-select', type: 'multiple', width: 40 }, { colKey: 'id', title: '订单编号', width: 145, ellipsis: true }, { colKey: 'hospital', title: '医院', width: 165, ellipsis: true }, { colKey: 'patientName', title: '患者姓名', width: 95 }, { colKey: 'sex', title: '性别', width: 55, cell: ({ row }) => row.sex || '—' }, { colKey: 'maskedIdentity', title: '身份证号', width: 175, cell: ({ row }) => row.maskedIdentity || '—' }, { colKey: 'surgery', title: '手术项目名称', width: 160, ellipsis: true, cell: ({ row }) => row.surgery || '—' }, { colKey: 'image', title: '审核设计成果', width: 110, cell: ({ row }) => row.image ? <button className="business-result-thumb" aria-label={'预览' + row.id + '成果'} onClick={() => setPreview(row.image)}><img src={row.image} alt={row.id + '审核设计成果'}/></button> : '—' }, { colKey: 'completedAt', title: '完成时间', width: 160, cell: ({ row }) => formatDateTime(row.completedAt) }]}/><div className="project-pagination business-insurance-pagination"><span>已选择 {ids.length} 条</span><Pagination current={page} pageSize={12} total={orders.length} showPageSize={false} showJumper={false} onCurrentChange={setPage}/></div>{error && <Alert theme="error" message={error}/>}</Card><ImageViewer visible={!!preview} images={preview ? [preview] : []} onClose={() => setPreview('')}/></div>;
}
