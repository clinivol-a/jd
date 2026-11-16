import { useState } from 'react';
import { Alert, Button, Card, Checkbox, DatePicker, Form, Input, Select, Steps, Table, Upload, MessagePlugin } from 'tdesign-react';
import { UploadIcon as TDIcon } from 'tdesign-icons-react';
import { adaptIcon } from '../../design-system/CliniVolIcon';
const UploadIcon = adaptIcon(TDIcon);
import { PageBack } from '../../PageBack';
import { business } from './client';
import { PatientInsuranceFields } from './PatientInsuranceFields';
import { ClinicalEditor, initialClinicalContent } from '../ClinicalEditor';
import { clinicalText } from '../clinicalContent.mjs';
import { saveFile } from '../files';
import { services, id } from '../model';
import { designStages, orderErrors } from '../orderRules.mjs';
import type { Order, SalesData } from '../model';
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
export function OrderImport({ mode, data, save, cancel }: {
    mode: 'report' | 'pacs';
    data: SalesData;
    save: (o: Order, submit: boolean, name: string) => Promise<boolean>;
    cancel: () => void;
}) {
    const [step, setStep] = useState(0), [busy, setBusy] = useState(false), [uploadBusy, setUploadBusy] = useState(false), [error, setError] = useState(''), [photos, setPhotos] = useState<{
        name: string;
        size: number;
        type: string;
        content: string;
    }[]>([]), [hospital, setHospital] = useState(data.hospitals[0]?.id || ''), [query, setQuery] = useState(''), [records, setRecords] = useState<ImportValues[]>([]), [selected, setSelected] = useState(false), [importId, setImportId] = useState(''), [values, setValues] = useState<ImportValues | null>(null), [series, setSeries] = useState<string[]>([]), [consent, setConsent] = useState(false), [acquired, setAcquired] = useState(false), [matched, setMatched] = useState(false), [failNext, setFailNext] = useState(false), [identity, setIdentity] = useState(''), [verified, setVerified] = useState(false);
    const [order, setOrder] = useState<Order>(() => ({ id: 'SO-' + id().slice(0, 8), name: '', caseId: '', hospitalId: hospital, department: '', doctorId: '', patientName: '', service: services[0], quantity: 1, requirements: '', clinicalContent: initialClinicalContent(''), due: '', created: new Date().toISOString(), updated: new Date().toISOString(), businessDate: new Date().toISOString(), status: '草稿', materials: [], reason: '', stages: [], plannedStages: ['三维重建'] }));
    const perform = async (fn: () => Promise<void>) => { if (busy)
        return; setBusy(true); setError(''); try {
        await fn();
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
        setFailNext(false);
    } };
    const start = () => perform(async () => { const result = await business('start', { mode, photos, hospital, fail: failNext }); setFailNext(false); setImportId(result.id); setValues(result.value);setIdentity(result.value.identityNumber||''); setOrder(o => ({ ...o, patientName: result.value.patientName, patientSex: result.value.sex, hospitalId: result.value.hospitalId })); setSeries([result.value.series[0]]); if (mode === 'pacs')
        setRecords([result.value]);
    else
        setStep(1); });
    const update = (key: keyof ImportValues, value: string) => { setValues(prev => prev ? { ...prev, [key]: value } : prev); setMatched(false); setAcquired(false); };
    const matching = () => perform(async () => { await business('update', { id: importId, values, authorized: consent }); if (!acquired) {
        await business('update', { id: importId, acquire: true, series, fail: failNext });
        setAcquired(true);
    } const result = await business('update', { id: importId, match: true }); setMatched(result.matched); setFailNext(false); });
    const submit = () => perform(async () => { if (!matched)
        throw Error('请先核对影像与患者检查信息。'); const receipt = await business('receipt', { id: importId }); const r = await fetch('/api/business-v31/imaging?id=' + encodeURIComponent(importId)); if (!r.ok)
        throw Error('影像获取失败。'); const imaging = { ...await saveFile(data.ownerId, new File([await r.blob()], '隔离影像.nii', { type: 'application/octet-stream' })), category: 'imaging' as const }; let sensitive = {}; if (true)
        sensitive = await business('patient', { sex: order.patientSex, identityNumber: identity, consent: true, verified: true }); const complete = { ...order, ...sensitive, patientName: values!.patientName, hospitalId: values!.hospitalId, clinicalRequirements: clinicalText(order.clinicalContent), materials: [imaging], importReceipt: receipt.receipt, importSource: receipt.source }; const errors = orderErrors(complete, complete.patientName); if (Object.keys(errors).length)
        throw Error(Object.values(errors).join(' ')); await business('validate-order', { order: complete }); await save(complete, true, complete.patientName); });
    return <div className="project-page project-detail-page sales-order-page business-import-page"><PageBack label="返回订单管理" onBack={cancel}/><Card bordered={false} className="project-info-card"><h2>{mode === 'report' ? '报告识别导入' : 'PACS导入'}</h2><Alert theme="info" message="当前连接隔离演示适配器，识别字段与影像为合成验收资料，不连接真实医院。"/><Steps current={step}>{[mode === 'report' ? '上传两张照片' : '选择检查', '授权与影像核对', '补充订单需求'].map(title => <Steps.StepItem key={title} title={title}/>)}</Steps><Form labelAlign="top" className="business-import-form" onSubmit={() => { }}>
 {step === 0 && <><BusinessField label="医院"><Select value={hospital} onChange={v => { setHospital(String(v)); setRecords([]); setSelected(false); }} options={[...data.hospitals.map(h => ({ value: h.id, label: h.name })), { value: 'unconnected', label: '未建立连接的医院' }]}/></BusinessField>{mode === 'report' ? <BusinessField label="报告照片与患者信息照片" requiredMark tips="依次上传报告单（含二维码）、患者资料页面，共两张。"><Upload theme="image" accept="image/png,image/jpeg,image/webp" multiple max={2} files={photos.map(f => ({ name: f.name, status: 'success', url: f.content }))} requestMethod={async (file) => { const f = (Array.isArray(file) ? file[0] : file).raw!; if (f.size > 20 * 1024 * 1024)
        return { status: 'fail', error: '图片过大。', response: {} }; const content = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(f); }); setPhotos(prev => [...prev, { name: f.name, size: f.size, type: f.type, content }].slice(0, 2)); return { status: 'success', response: { url: content } }; }} onRemove={({ index }) => setPhotos(prev => prev.filter((_, i) => i !== index))}/></BusinessField> : <><BusinessField label="患者姓名或检查编号"><Input value={query} onChange={setQuery}/></BusinessField><Button theme="default" loading={busy} onClick={start}>查询检查</Button>{records.length > 0 && <Table rowKey="examNo" data={records.filter(r => !query || r.patientName.includes(query) || r.examNo.includes(query))} columns={[{ colKey: 'patientName', title: '患者' }, { colKey: 'examNo', title: '检查编号' }, { colKey: 'examDate', title: '检查日期' }, { colKey: 'bodyPart', title: '部位' }, { colKey: 'modality', title: '类型' }, { colKey: 'actions', title: '操作', cell: () => <Button theme="primary" variant="text" onClick={() => setSelected(true)}>{selected ? '已选择' : '选择检查'}</Button> }]}/>}</>}{mode === 'report' ? <Button theme="primary" loading={busy} disabled={photos.length !== 2} icon={<UploadIcon />} onClick={start}>识别资料</Button> : <Button theme="primary" disabled={!selected} onClick={() => setStep(1)}>核对检查与序列</Button>}</>}
 {step === 1 && values && <><div className="business-field-grid"><BusinessField label="医院"><Select value={values.hospitalId} onChange={v=>update('hospitalId',String(v))} options={data.hospitals.map(h=>({value:h.id,label:h.name}))}/></BusinessField>{([['patientName', '患者姓名'], ['sex', '性别'], ['examNo', '检查编号'], ['examDate', '检查日期'], ['bodyPart', '检查部位']] as const).map(([key, label]) => <BusinessField label={label} key={key}><Input value={values[key]} onChange={v => update(key, v)}/></BusinessField>)}<BusinessField label="影像来源"><Input readonly value={mode === 'report' ? '报告二维码 · 隔离医院影像入口' : 'PACS授权连接 · 隔离适配器'}/></BusinessField></div><BusinessField label="影像序列"><Checkbox.Group value={series} options={values.series} onChange={v => { setSeries(v.map(String)); setMatched(false); setAcquired(false); }}/></BusinessField><Checkbox checked={consent} onChange={setConsent}>已取得医院影像访问授权</Checkbox><div className="sales-actions"><Button theme="default" loading={busy} onClick={matching}>{matched ? '已核对一致' : acquired ? '重新核对' : '获取影像并核对'}</Button><Button theme="primary" disabled={!matched} onClick={() => setStep(2)}>补充订单需求</Button></div><p className="field-hint">{matched ? '患者与检查一致，导入凭证有效。' : '关键身份或检查字段变化后，必须重新核对。'}</p></>}
 {step === 2 && <><BusinessField label="科室" requiredMark><Select value={order.department} onChange={v => setOrder(o => ({ ...o, department: String(v), doctorId: '' }))} options={(data.hospitals.find(h => h.id === values?.hospitalId)?.departments || []).map(value => ({ value, label: value }))}/></BusinessField><BusinessField label="医生" requiredMark><Select value={order.doctorId} onChange={v => setOrder(o => ({ ...o, doctorId: String(v) }))} options={data.doctors.filter(d => d.owner === data.ownerId && d.status === '审核通过' && d.hospitalId === values?.hospitalId && d.department === order.department).map(d => ({ value: d.id, label: d.name }))}/></BusinessField><PatientInsuranceFields value={order} onChange={v => setOrder(o => ({ ...o, ...v }))} identity={identity} onIdentity={v=>{setIdentity(v);update('identityNumber',v)}} verified={verified} onVerified={setVerified}/><BusinessField label="手术项目名称" requiredMark><Input value={order.name} onChange={name => setOrder(o => ({ ...o, name }))}/></BusinessField><BusinessField label="临床需求" requiredMark><ClinicalEditor owner={data.ownerId} value={order.clinicalContent!} onBusyChange={setUploadBusy} onChange={clinicalContent => setOrder(o => ({ ...o, clinicalContent }))}/></BusinessField><BusinessField label="服务项目"><Select value={order.service} options={services.map(value => ({ value, label: value }))} onChange={v => setOrder(o => ({ ...o, service: String(v) }))}/></BusinessField><BusinessField label="设计阶段"><Checkbox.Group value={order.plannedStages} options={designStages} onChange={v => setOrder(o => ({ ...o, plannedStages: v.map(String) }))}/></BusinessField><BusinessField label="期望完成时间" requiredMark><DatePicker value={order.due} onChange={v => setOrder(o => ({ ...o, due: String(v) }))}/></BusinessField><div className="sales-actions"><Button theme="default" onClick={() => setStep(1)}>返回核对</Button><Button theme="primary" loading={busy} disabled={uploadBusy} onClick={submit}>确认并提交订单</Button></div></>}
 {error && <Alert theme="error" message={error}/>}<details className="business-test-options"><summary>隔离连接验收</summary><Checkbox checked={failNext} onChange={setFailNext}>下次请求返回连接失败</Checkbox><Button theme="default" variant="text" onClick={() => { MessagePlugin.info('已保留当前核对信息，请在手动录入中补充授权影像。'); sessionStorage.setItem('v31-manual:' + data.ownerId, JSON.stringify({ patientName: values?.patientName, hospitalId: values?.hospitalId })); location.hash = 'sales/order-new'; }}>转人工录入</Button></details>
 </Form></Card></div>;
}
function BusinessField({ children, ...props }: Omit<React.ComponentProps<typeof Form.FormItem>, 'children'> & {
    children?: React.ReactNode;
}) { return <Form.FormItem {...props}><div style={{ width: '100%', minWidth: 0 }}>{children}</div></Form.FormItem>; }
