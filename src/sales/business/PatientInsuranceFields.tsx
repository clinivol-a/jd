import { Form, Input, Select } from 'tdesign-react';
import { validIdentity } from '../patientRules.mjs';
import type { Order } from '../model';
export function PatientInsuranceFields({ value, onChange, identity, onIdentity, errors }: {
    value: Order;
    onChange: (v: Partial<Order>) => void;
    identity: string;
    onIdentity: (v: string) => void;
    errors?: {
        sex?: string;
        identity?: string;
    };
    verified: boolean;
    onVerified: (v: boolean) => void;
}) { return <><Form.FormItem label="性别" requiredMark status={errors?.sex ? 'error' : undefined} tips={errors?.sex}><div style={{ width: '100%' }}><Select aria-label="患者性别" value={value.patientSex || ''} options={['男', '女'].map(value => ({ value, label: value }))} onChange={v => onChange({ patientSex: String(v) })}/></div></Form.FormItem><Form.FormItem label="身份证号" requiredMark status={errors?.identity || identity && !validIdentity(identity) ? 'error' : undefined} tips={errors?.identity || (identity && !validIdentity(identity) ? '请输入有效的18位居民身份证号码。' : undefined)}><div style={{ width: '100%' }}><Input aria-label="患者身份证号" type="password" value={identity} onChange={onIdentity} placeholder={value.patientIdentityRef ? '已保存，修改时重新填写' : '填写18位居民身份证号码'}/></div></Form.FormItem></>; }
