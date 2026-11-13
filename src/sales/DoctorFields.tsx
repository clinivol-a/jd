import {Form,Input,Select} from 'tdesign-react';
import type {Doctor,Hospital} from './model';
import type {ComponentProps,ReactNode} from 'react';
import {SalesAttachments} from './SalesAttachments';
type Props={phoneReadonly?:boolean;d:Doctor;set:(d:Doctor)=>void;hospitals:Hospital[];owner:string;errors:Record<string,string>;onBusyChange:(slot:string,busy:boolean)=>void;save?:ComponentProps<typeof SalesAttachments>['save'];load?:ComponentProps<typeof SalesAttachments>['load']};
function Field({label,error,requiredMark,children}:{label:string;error?:string;requiredMark?:boolean;children:ReactNode}){return <Form.FormItem label={label} requiredMark={requiredMark} status={error?'error':undefined} tips={error}>{children}</Form.FormItem>}
export function DoctorFields({d,set,hospitals,owner,errors,phoneReadonly,onBusyChange:setUploadBusy,save,load}:Props){
  const field = (
    key: "name" | "phone" | "title" | "certificate",
    label: string,
  ) => (
    <Field label={label} requiredMark error={errors[key]}>
      <Input readonly={key==="phone"&&phoneReadonly} value={d[key]} onChange={(v) => set({ ...d, [key]: v })} />
    </Field>
  );
return <>
          <section className="sales-doctor-section"><h3>基本资料</h3>
          {field("name", "真实姓名")}
          {field("phone", "联系手机号")}
          </section><section className="sales-doctor-section"><h3>执业信息</h3>
          <Field label="所属医院" requiredMark error={errors.hospitalId}>
            <Select
              value={d.hospitalId}
              options={hospitals.map((h) => ({
                value: h.id,
                label: h.name,
              }))}
              onChange={(v) =>
                set({ ...d, hospitalId: String(v), department: "" })
              }
            />
          </Field>
          <Field label="所属科室" requiredMark error={errors.department}>
            <Select
              value={d.department}
              options={(
                hospitals.find((h) => h.id === d.hospitalId)
                  ?.departments || []
              ).map((value) => ({ value, label: value }))}
              onChange={(v) => set({ ...d, department: String(v) })}
            />
          </Field>
          {field("title", "职称")}
          {field("certificate", "执业证书编号")}
          </section><section className="sales-doctor-section"><h3>证明材料</h3>
          <Field label="身份证明照片" requiredMark error={errors.identity}>
            <SalesAttachments
              owner={owner} save={save} load={load}
              value={d.materials}
              category="identity"
              images
              onBusyChange={(value) => setUploadBusy("identity", value)}
              onChange={(materials) => set({ ...d, materials })}
            />
          </Field>
          <Field label="医师执业证明照片" error={errors.practice}>
            <SalesAttachments
              owner={owner} save={save} load={load}
              value={d.materials}
              category="practice"
              images
              onBusyChange={(value) => setUploadBusy("practice", value)}
              onChange={(materials) => set({ ...d, materials })}
            />
          </Field>
          <Field label="执业证明PDF">
            <SalesAttachments owner={owner} save={save} load={load} value={d.materials} category="practice" images={false} accept="application/pdf" onBusyChange={value=>setUploadBusy("practice-pdf",value)} onChange={materials=>set({...d,materials})}/>
          </Field>
          <Field label="PDF及其他证明文件">
            <SalesAttachments
              owner={owner} save={save} load={load}
              value={d.materials}
              category="other"
              onBusyChange={(value) => setUploadBusy("other", value)}
              onChange={(materials) => set({ ...d, materials })}
            />
          </Field>
          </section>

</>;
}
