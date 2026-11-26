import {anhuiCities,eligibleHospitalLeaders,eligibleHospitalSales} from './institutionRules.mjs';
import { useState } from 'react';
import { Dialog, Form, Input, Select } from 'tdesign-react';
import { adminRequest } from './model';
import type { AdminState, Department, Hospital } from './model';
export function HospitalForm({ initial, data, onClose, onSaved }: {
    initial: Hospital | null;
    data: AdminState;
    onClose: () => void;
    onSaved: () => Promise<void>;
}) {
    const [value, setValue] = useState({ name: initial?.name || '', region: initial?.region || '', contact: initial?.contact || '', leaderId: eligibleHospitalLeaders(data.people, initial || {}).some(p => p.id === initial?.leaderId) ? initial!.leaderId : '', salesIds: Object.entries(data.salesAssignments || {}).filter(([, ids]) => initial && ids.includes(initial.id)).map(([id]) => id) });
    const [errors, setErrors] = useState<Record<string, string>>({}), [busy, setBusy] = useState(false);
    const update = (key: keyof typeof value, next: unknown) => { setValue(v => ({ ...v, [key]: next })); setErrors(e => ({ ...e, [key]: '' })); };
    const leaders = eligibleHospitalLeaders(data.people, { id: initial?.id, region: value.region, leaderId: initial?.leaderId });
    const leaderHint = !value.region ? '请先选择区域。' : !leaders.length ? '该区域暂无具备管理资格的组长，请先在成员管理中维护授权。' : initial?.leaderId && !value.leaderId ? '请重新选择具备管理资格的组长。' : undefined;
    const save = async () => { if (busy)
        return; const e: Record<string, string> = {}; for (const key of ['name', 'region', 'leaderId'] as const)
        if (!value[key].trim())
            e[key] = (key === 'name' ? '请填写' : '请选择') + ({ name: '医院名称', region: '区域', leaderId: '负责组长' })[key] + '。'; if (value.leaderId && !leaders.some(p => p.id === value.leaderId)) e.leaderId = '该组长的管理资格已变化，请重新选择。'; setErrors(e); if (Object.keys(e).length)
        return; setBusy(true); try {
        await adminRequest('command', { action: 'hospital-save', id: initial?.id, version: initial?.version, ...value });
        await onSaved();
        onClose();
    }
    catch (error) {
        setErrors({ submit: (error as Error).message });
    }
    finally {
        setBusy(false);
    } };
    return <Dialog visible header={initial ? '编辑医院' : '新建医院'} confirmBtn={{ content: '保存', loading: busy }} cancelBtn="取消" onConfirm={() => void save()} onClose={() => { if (!busy)
        onClose(); }} destroyOnClose><Form labelAlign="top" onSubmit={() => void save()}>
  <Form.FormItem label="医院名称" requiredMark status={errors.name ? 'error' : undefined} tips={errors.name}><><Input value={value.name} onChange={v => update('name', v)} placeholder="填写医院名称"/></></Form.FormItem>
  <Form.FormItem label="区域" requiredMark status={errors.region ? 'error' : undefined} tips={errors.region}><><Select value={value.region||undefined} options={[...anhuiCities,...(value.region&&!anhuiCities.includes(value.region)?[value.region]:[])].map(label=>({label,value:label}))} onChange={v => { update('region', String(v)); update('leaderId', ''); }} placeholder="选择区域"/></></Form.FormItem>
  <Form.FormItem label="联系电话"><><Input value={value.contact} onChange={v => update('contact', v)} placeholder="填写联系电话"/></></Form.FormItem>
  <Form.FormItem label="负责组长" requiredMark status={errors.leaderId ? 'error' : undefined} tips={errors.leaderId || leaderHint}><><Select aria-label="负责组长" disabled={!value.region} value={value.leaderId || undefined} filterable empty="暂无符合条件的组长" options={leaders.map(p => ({ value: p.id, label: p.name }))} onChange={v => update('leaderId', String(v))} placeholder={!value.region ? "请先选择区域" : "选择负责组长"}/></></Form.FormItem>
  <Form.FormItem label="授权销售"><><Select aria-label="授权销售" value={value.salesIds} multiple filterable empty="暂无可授权的销售" options={eligibleHospitalSales(data.people.filter(p=>data.hospitalSalesIds?.includes(p.id))).map(p => ({ value: p.id, label: p.name }))} onChange={v => update('salesIds', v)} placeholder="选择可服务该医院的销售"/></></Form.FormItem>
  {errors.submit && <p className="admin-error" role="alert">{errors.submit}</p>}
 </Form></Dialog>;
}
export function DepartmentForm({ hospital, initial, onClose, onSaved }: {
    hospital: Hospital;
    initial?: Department;
    onClose: () => void;
    onSaved: () => Promise<void>;
}) {
    const [name, setName] = useState(initial?.name || ''), [errors, setErrors] = useState<Record<string, string>>({}), [busy, setBusy] = useState(false);
    const save = async () => {
        if (busy)
            return;
        const next: Record<string, string> = {};
        if (!name.trim())
            next.name = '请填写科室名称。';
        setErrors(next);
        if (Object.keys(next).length)
            return;
        setBusy(true);
        try {
            await adminRequest('command', { action: 'department-save', id: hospital.id, departmentId: initial?.id, version: initial?.version || hospital.version, name });
            await onSaved();
            onClose();
        }
        catch (e) {
            setErrors({ submit: (e as Error).message });
        }
        finally {
            setBusy(false);
        }
    };
    return <Dialog visible header={initial ? '编辑科室' : '新增科室'} confirmBtn={{ content: '保存', loading: busy }} cancelBtn="取消" onConfirm={() => void save()} onClose={() => { if (!busy)
        onClose(); }} destroyOnClose>
  <Form labelAlign="top" onSubmit={() => void save()}>
   <Form.FormItem label="所属医院"><><Input value={hospital.name} readonly/></></Form.FormItem>
   <Form.FormItem label="科室名称" requiredMark status={errors.name ? 'error' : undefined} tips={errors.name}><><Input value={name} onChange={v => { setName(v); setErrors(e => ({ ...e, name: '' })); }} placeholder="填写科室名称"/></></Form.FormItem>
   {errors.submit && <p className="admin-error" role="alert">{errors.submit}</p>}
  </Form>
 </Dialog>;
}
