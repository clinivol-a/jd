import { useState } from 'react';
import { Checkbox, Form, Input, Select } from 'tdesign-react';
import type { Order } from '../model';
export function PatientInsuranceFields({ value, onChange, identity, onIdentity, verified, onVerified }: {
    value: Order;
    onChange: (v: Partial<Order>) => void;
    identity: string;
    onIdentity: (v: string) => void;
    verified: boolean;
    onVerified: (v: boolean) => void;
}) { const [enabled, setEnabled] = useState(!!value.insuranceConsent); return <><BusinessField><Checkbox checked={enabled} onChange={v => { setEnabled(v); if (!v) {
    onIdentity('');
    onVerified(false);
    onChange({ insuranceConsent: false, patientIdentityRef: undefined });
} }}>需要医保填报资料</Checkbox></BusinessField>{enabled && <><BusinessField label="性别" requiredMark><Select aria-label="患者性别" value={value.patientSex || ''} options={['男', '女', '未知'].map(value => ({ value, label: value }))} onChange={v => onChange({ patientSex: String(v) })}/></BusinessField><BusinessField label="身份证号" requiredMark><Input aria-label="患者身份证号" type="password" value={identity} onChange={v => { onIdentity(v); onVerified(false); }} placeholder={value.patientIdentityRef ? '已受控保存，修改时重新填写' : '仅在授权医保用途下采集'}/></BusinessField><BusinessField><Checkbox checked={!!value.insuranceConsent} onChange={v => onChange({ insuranceConsent: v })}>已取得患者资料采集授权</Checkbox></BusinessField><BusinessField><Checkbox checked={verified} onChange={v => onVerified(v)}>已核对授权资料与患者身份</Checkbox></BusinessField></>}</>; }
function BusinessField({ children, ...props }: Omit<React.ComponentProps<typeof Form.FormItem>, 'children'> & {
    children?: React.ReactNode;
}) { return <Form.FormItem {...props}><div style={{ width: '100%', minWidth: 0 }}>{children}</div></Form.FormItem>; }
