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
    const [value, setValue] = useState({ name: initial?.name || '', region: initial?.region || '', contact: initial?.contact || '', leaderId: data.people.some(p => p.id === initial?.leaderId && p.role === '业务组长' && p.status === '已启用' && ['orders:read', 'orders:review', 'tasks:assign'].every(permission => p.permissions.includes(permission))) ? initial!.leaderId : '', salesIds: Object.entries(data.salesAssignments || {}).filter(([, ids]) => initial && ids.includes(initial.id)).map(([id]) => id), reason: '' });
    const [errors, setErrors] = useState<Record<string, string>>({}), [busy, setBusy] = useState(false);
    const update = (key: keyof typeof value, next: unknown) => { setValue(v => ({ ...v, [key]: next })); setErrors(e => ({ ...e, [key]: '' })); };
    const leaders = data.people.filter(p => p.role === '业务组长' && p.status === '已启用' && ['orders:read', 'orders:review', 'tasks:assign'].every(permission => p.permissions.includes(permission)) && (p.regions?.includes(value.region) || initial && (p.scope.includes(initial.id) || p.id === initial.leaderId)));
    const save = async () => { if (busy)
        return; const e: Record<string, string> = {}; for (const key of ['name', 'region', 'leaderId'] as const)
        if (!value[key].trim())
            e[key] = '请填写' + ({ name: '医院名称', region: '所属区域', leaderId: '负责组长' })[key]; if (initial && !value.reason.trim())
        e.reason = '请填写修改原因'; setErrors(e); if (Object.keys(e).length)
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
  <Form.FormItem label="所属区域" requiredMark status={errors.region ? 'error' : undefined} tips={errors.region}><><Input value={value.region} onChange={v => { update('region', v); update('leaderId', ''); }} placeholder="填写所属区域"/></></Form.FormItem>
  <Form.FormItem label="联系信息"><><Input value={value.contact} onChange={v => update('contact', v)} placeholder="填写联系信息"/></></Form.FormItem>
  <Form.FormItem label="负责组长" requiredMark status={errors.leaderId ? 'error' : undefined} tips={errors.leaderId}><><Select value={value.leaderId} filterable options={leaders.map(p => ({ value: p.id, label: p.name }))} onChange={v => update('leaderId', String(v))} placeholder="选择具备区域或医院资格的组长"/></></Form.FormItem>
  <Form.FormItem label="授权销售"><><Select value={value.salesIds} multiple filterable options={data.people.filter(p => p.role === '销售' && p.status === '已启用' && Object.prototype.hasOwnProperty.call(data.salesAssignments || {}, p.id)).map(p => ({ value: p.id, label: p.name }))} onChange={v => update('salesIds', v)} placeholder="选择可服务该医院的销售"/></></Form.FormItem>
  {initial && <Form.FormItem label="修改原因" requiredMark status={errors.reason ? 'error' : undefined} tips={errors.reason}><><Input value={value.reason} onChange={v => update('reason', v)}/></></Form.FormItem>}
  {errors.submit && <p className="admin-error" role="alert">{errors.submit}</p>}
 </Form></Dialog>;
}
export function DepartmentForm({ hospital, initial, onClose, onSaved }: {
    hospital: Hospital;
    initial?: Department;
    onClose: () => void;
    onSaved: () => Promise<void>;
}) {
    const [name, setName] = useState(initial?.name || ''), [reason, setReason] = useState(''), [errors, setErrors] = useState<Record<string, string>>({}), [busy, setBusy] = useState(false);
    const save = async () => {
        if (busy)
            return;
        const next: Record<string, string> = {};
        if (!name.trim())
            next.name = '请填写科室名称。';
        if (!reason.trim())
            next.reason = '请填写操作原因。';
        setErrors(next);
        if (Object.keys(next).length)
            return;
        setBusy(true);
        try {
            await adminRequest('command', { action: 'department-save', id: hospital.id, departmentId: initial?.id, version: initial?.version || hospital.version, name, reason });
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
   <Form.FormItem label="操作原因" requiredMark status={errors.reason ? 'error' : undefined} tips={errors.reason}><><Input value={reason} onChange={v => { setReason(v); setErrors(e => ({ ...e, reason: '' })); }}/></></Form.FormItem>
   {errors.submit && <p className="admin-error" role="alert">{errors.submit}</p>}
  </Form>
 </Dialog>;
}
