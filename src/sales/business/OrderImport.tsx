import { useState } from 'react';
import { Alert, Button, Checkbox, Form, Input, Select, Table, Upload } from 'tdesign-react';
import { ScanIcon as TDScanIcon } from 'tdesign-icons-react';
import { adaptIcon } from '../../design-system/CliniVolIcon';
import { OrderEditor } from '../OrderPages';
import { business } from './client';
import { saveFile } from '../files';
import { id, services } from '../model';
import type { Order, SalesData } from '../model';
const ScanIcon = adaptIcon(TDScanIcon);
type ImportValues = {
    patientName: string;
    sex: string;
    identityNumber: string;
    hospitalId: string;
    examNo: string;
    examDate: string;
    bodyPart: string;
    modality: string;
    series: string[];
};
type Photo = {
    name: string;
    size: number;
    type: string;
    content: string;
};
export function OrderImport({ mode, data, save, cancel }: {
    mode: 'report' | 'pacs';
    data: SalesData;
    save: React.ComponentProps<typeof OrderEditor>["save"];
    cancel: () => void;
}) {
    const [step, setStep] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState(''), [photos, setPhotos] = useState<Photo[]>([]), [hospital, setHospital] = useState(data.hospitals[0]?.id || ''), [query, setQuery] = useState(''), [records, setRecords] = useState<ImportValues[]>([]), [selected, setSelected] = useState(false), [importId, setImportId] = useState(''), [values, setValues] = useState<ImportValues | null>(null), [series, setSeries] = useState<string[]>([]), [consent, setConsent] = useState(false), [acquired, setAcquired] = useState(false), [matched, setMatched] = useState(false);
    const [prefill, setPrefill] = useState<Order>();
    const [applied, setApplied] = useState(false);
    const perform = async (fn: () => Promise<void>) => {
        if (busy)
            return;
        setBusy(true);
        setError('');
        try {
            await fn();
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    };
    const start = () => perform(async () => {
        const r = await business('start', { mode, photos, hospital });
        setApplied(false);
        setImportId(r.id);
        setValues(r.value);
        setSeries([r.value.series[0]]);
        setMatched(false);
        setAcquired(false);
        setSelected(false);
        if (mode === 'pacs')
            setRecords(!query || r.value.patientName.includes(query) || r.value.examNo.includes(query) ? [r.value] : []);
        else
            setStep(1);
    });
    const update = (key: keyof ImportValues, value: string) => { setValues(prev => prev ? { ...prev, [key]: value } : prev); setMatched(false); setAcquired(false); setApplied(false); };
    const matching = () => perform(async () => {
        await business('update', { id: importId, values, authorized: consent });
        if (!acquired) {
            await business('update', { id: importId, acquire: true, series });
            setAcquired(true);
        }
        const r = await business('update', { id: importId, match: true });
        setMatched(r.matched);
    });
    const proceed = () => perform(async () => {
        if (!matched || !values)
            throw Error('请先核对患者与影像信息。');
        const receipt = await business('receipt', { id: importId }), response = await fetch('/api/business-v31/imaging?id=' + encodeURIComponent(importId));
        if (!response.ok)
            throw Error('影像获取失败，请重试。');
        const imaging = { ...await saveFile(data.ownerId, new File([await response.blob()], `${values.examNo}.nii`, { type: 'application/octet-stream' })), category: 'imaging' as const };
        const attachments = await Promise.all(photos.map(async (p) => ({ ...await saveFile(data.ownerId, new File([await (await fetch(p.content)).blob()], p.name, { type: p.type })), category: 'order-other' as const })));
        const patient = await business('patient', { sex: values.sex, identityNumber: values.identityNumber });
        const now = new Date().toISOString();
        setApplied(true);
        setPrefill(previous => ({ id: previous?.id || 'SO-' + id().slice(0, 8), name: '', caseId: '', doctorId: '', department: '', hospitalId: values.hospitalId, patientName: values.patientName, ...patient, service: services[0], quantity: 1, requirements: '', due: '', created: now, updated: now, businessDate: now, status: '草稿', materials: [imaging, ...attachments], reason: '', stages: [], plannedStages: ['三维重建'], importReceipt: receipt.receipt, importSource: receipt.source }));
    });
    const content = <Form labelAlign="top" className="business-import-form" onSubmit={() => { }}>
 {step === 0 && <><BusinessField label="医院"><Select value={hospital} options={data.hospitals.map(h => ({ value: h.id, label: h.name }))} onChange={v => { setHospital(String(v)); setValues(previous => previous ? { ...previous, hospitalId: String(v) } : previous); setRecords([]); setSelected(false); setApplied(false); setMatched(false); setAcquired(false); }}/></BusinessField>{mode === 'report' ? <BusinessField label="影像报告单与患者信息照片" requiredMark tips="依次上传影像报告单和患者信息页面，共两张。"><Upload theme="image" accept="image/png,image/jpeg,image/webp" multiple max={2} files={photos.map(f => ({ name: f.name, status: 'success', url: f.content }))} requestMethod={async (file) => {
                    const f = (Array.isArray(file) ? file[0] : file).raw!;
                    if (f.size > 20 * 1024 * 1024)
                        return { status: 'fail', error: '图片过大。', response: {} };
                    const content = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(f); });
                    setPhotos(p => [...p, { name: f.name, size: f.size, type: f.type, content }].slice(0, 2));
                    return { status: 'success', response: { url: content } };
                }} onRemove={({ index }) => setPhotos(p => p.filter((_, i) => i !== index))}/></BusinessField> : <><BusinessField label="患者姓名或检查编号"><Input value={query} onChange={setQuery}/></BusinessField>{records.length > 0 && <Table rowKey="examNo" data={records} columns={[{ colKey: 'patientName', title: '患者姓名' }, { colKey: 'examNo', title: '检查编号', ellipsis: true }, { colKey: 'examDate', title: '检查日期' }, { colKey: 'bodyPart', title: '检查部位' }, { colKey: 'modality', title: '检查类型' }, { colKey: 'select', title: '操作', cell: () => <Button theme="primary" variant="text" onClick={() => setSelected(true)}>{selected ? '已选择' : '选择检查'}</Button> }]}/>}</>}
 <div className="business-import-actions">{mode === 'report' ? <Button theme="primary" disabled={photos.length !== 2} loading={busy} icon={<ScanIcon />} onClick={start}>开始识别</Button> : <><Button theme={selected ? "default" : "primary"} loading={busy} onClick={start}>查询检查</Button><Button theme="primary" disabled={!selected || busy} onClick={() => setStep(1)}>导入数据</Button></>}</div></>}
 {step === 1 && values && <><div className="business-field-grid"><BusinessField label="医院"><Select value={values.hospitalId} options={data.hospitals.map(h => ({ value: h.id, label: h.name }))} onChange={v => update('hospitalId', String(v))}/></BusinessField>{([['patientName', '患者姓名'], ['sex', '性别'], ['identityNumber', '身份证号'], ['examNo', '检查编号'], ['examDate', '检查时间'], ['bodyPart', '检查部位']] as const).map(([key, label]) => <BusinessField label={label} key={key}><Input type={key === 'identityNumber' ? 'password' : 'text'} value={values[key]} onChange={v => update(key, v)}/></BusinessField>)}</div><BusinessField label="CT/MR影像序列"><Checkbox.Group value={series} options={values.series} onChange={v => { setSeries(v.map(String)); setAcquired(false); setMatched(false); setApplied(false); }}/></BusinessField><Checkbox checked={consent} onChange={setConsent}>已取得医院影像访问授权</Checkbox><p className="field-hint">{matched ? '患者与检查信息一致，影像已导入。' : acquired ? '影像已获取，请核对患者与检查信息。' : '关键身份或检查信息修改后需重新核对。'}</p><div className="business-import-actions"><Button theme="default" onClick={() => setStep(0)}>上一步</Button><Button theme="default" disabled={!consent || !series.length} loading={busy} onClick={matching}>{matched ? '重新核对' : '获取影像并核对'}</Button><Button theme="primary" disabled={!matched} loading={busy} onClick={proceed}>进入新建订单</Button></div></>}{error && <Alert theme="error" message={error}/>}</Form>;
    return <OrderEditor data={data} prefill={prefill} save={save} cancel={cancel} entry={{ title: mode === 'report' ? '报告识别导入' : 'PACS导入', label: mode === 'report' ? '上传与识别' : '查询与选择', content, ready: applied && matched, unlocked: !!prefill, busy, onIdentityChange: fields => { setValues(prev => prev ? { ...prev, ...fields } : prev); setMatched(false); setAcquired(false); setApplied(false); } }}/>;
}
function BusinessField({ children, ...props }: Omit<React.ComponentProps<typeof Form.FormItem>, 'children'> & {
    children?: React.ReactNode;
}) { return <Form.FormItem {...props}><div style={{ width: '100%', minWidth: 0 }}>{children}</div></Form.FormItem>; }
