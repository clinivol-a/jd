import {OrderSteps} from './OrderSteps';
import {ImagingPreview} from './business/ImagingPreview';
import {validIdentity} from './patientRules.mjs';
import {PatientInsuranceFields} from './business/PatientInsuranceFields';
import {business} from './business/client';
import {StageShare} from './business/OrderResults';
import {ClinicalEditor,ClinicalReadOnly,initialClinicalContent} from "./ClinicalEditor";
import {clinicalText,designDemand} from "./clinicalContent.mjs";
import {orderNumber} from './orderNumber.mjs';
import {PageBack} from '../PageBack';
import { confirmedDelivery } from "./orderRules.mjs";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Dialog,
  Empty,
  Form,
  Input,
  InputNumber,
  Select,
  Table,
  Tooltip,
  MessagePlugin,
} from "tdesign-react";
import type { ReactNode } from "react";
import type { Order, SalesData, Attachment } from "./model";
import type { TaskType } from "../App";
import { id, services } from "./model";
import {
  designStages,
  isImaging,
  localDate,
  orderErrors,
} from "./orderRules.mjs";
import { SalesAttachments } from "./SalesAttachments";
import { DesignStageIcon } from "../design-system/DesignStageIcon";
import { ProjectStatus } from "../projects/ProjectPages";
import { formatDate, formatAuditTime, formatDateTime } from "../dateTime";
import { getFile } from "./files";

export function OrderIcons({ stages }: { stages: string[] }) {
  return (
    <div className="project-stage-tags">
      {designStages
        .filter((s) => stages.includes(s))
        .map((stage, index) => {
          const type = (
            stage === "CAD设计"
              ? "CAD 设计"
              : stage === "3D打印"
                ? "3D 打印"
                : stage
          ) as TaskType;
          return (
            <Tooltip key={stage} content={stage}>
              <span
                className={
                  "design-stage-icon stage-" +
                  ["cyan", "purple", "yellow", "pink"][
                    designStages.indexOf(stage)
                  ]
                }
                aria-label={stage}
              >
                <DesignStageIcon stage={type} />
              </span>
            </Tooltip>
          );
        })}
    </div>
  );
}
function Field({
  label,
  error,
  required,
  children,
}: {
  label: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <Form.FormItem
      label={label}
      requiredMark={required}
      status={error ? "error" : undefined}
      tips={error}
    >
      <div className="sales-order-control">{children}</div>
    </Form.FormItem>
  );
}
function mergeImportedOrder(current:Order, incoming:Order, previous:Set<string>):Order {
  return {...current,...(current.hospitalId!==incoming.hospitalId?{department:"",doctorId:"",caseId:""}:{}),id:incoming.id,patientName:incoming.patientName,patientSex:incoming.patientSex,patientIdentityRef:incoming.patientIdentityRef,insuranceConsent:incoming.insuranceConsent,hospitalId:incoming.hospitalId,importSource:incoming.importSource,importReceipt:incoming.importReceipt,materials:[...current.materials.filter(f=>!previous.has(f.id)),...incoming.materials]};
}
export function OrderEditor({
  data,
  initial,
  prefill,
  entry,
  doctorId,
  caseId,
  save,
  cancel,
}: {
  data: SalesData;
  initial?: Order;
  prefill?: Order;
  entry?: {title:string;label:string;content:ReactNode|((saveDraft:(incoming:Order)=>Promise<void>)=>ReactNode);ready:boolean;unlocked:boolean;busy:boolean;onOpen?:()=>void;onIdentityChange:(fields:Record<string,string>)=>void};
  doctorId?: string;
  caseId?: string;
  save: (
    order: Order,
    submit: boolean,
    patientName: string,
  ) => Promise<boolean>;
  cancel: () => void;
}) {
  const [o, setOrder] = useState<Order>(() => {
    let manualPrefill:Partial<Order>={};try{manualPrefill=JSON.parse(sessionStorage.getItem('v31-manual:'+data.ownerId)||'{}')}catch{}
    const c = data.cases.find((x) => x.id === caseId);
    const doctor = data.doctors.find((d) => d.id === (c?.doctorId || doctorId));
    const source=initial||prefill;
    return source
      ? {...structuredClone(source),clinicalContent:designDemand(source).content||initialClinicalContent(designDemand(source).text)}
      : {
          id: "SO-" + id().slice(0, 8),
          name: "",
          caseId: c?.id || "",
          doctorId: doctor?.id || "",
          hospitalId: doctor?.hospitalId || "",
          department: doctor?.department || "",
          service: services[0],
          quantity: 1,
          requirements: "",
          clinicalRequirements: "",
          clinicalContent:initialClinicalContent(""),
          designRequirements: "",
          plannedStages: ["三维重建"],
          due: "",
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          businessDate: new Date().toISOString(),
          status: "草稿",
          materials: [],
          reason: "",
          stages: [],
          ...manualPrefill,
        };
  });
  useEffect(()=>{if(!initial)sessionStorage.removeItem('v31-manual:'+data.ownerId)},[]);
  const [step, setStep] = useState(0),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [saving, setSaving] = useState(false);
  const [identity,setIdentity]=useState(''),[identityVerified,setIdentityVerified]=useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const linkedCase = data.cases.find((c) => c.id === o.caseId);
  const [patientName, setPatientName] = useState(o.patientName ?? linkedCase?.patientName ?? "");
  const hasEntry=!!entry;
  const [showEntry,setShowEntry]=useState(hasEntry);
  const importedFiles=useRef(new Set<string>());
  useEffect(()=>{
    if(!hasEntry||!prefill)return;
    const previous=importedFiles.current;
    setOrder(current=>mergeImportedOrder(current,prefill,previous));
    importedFiles.current=new Set([...previous,...prefill.materials.map(f=>f.id)]);
    setPatientName(prefill.patientName||'');setIdentity('');setErrors(previous=>{const{patientIdentity,patientSex,import:importError,...rest}=previous;return rest});setStep(0);setShowEntry(false);
  },[prefill,hasEntry]);
  const update = (fields: Partial<Order>) => {
    const changed=Object.fromEntries(Object.entries(fields).filter(([key,value])=>['hospitalId','patientSex'].includes(key)&&value!==o[key as keyof Order]));
    if(Object.keys(changed).length)entry?.onIdentityChange(Object.fromEntries(Object.entries(changed).map(([key,value])=>[key==='patientSex'?'sex':key,String(value)])));
    setOrder((prev) => ({ ...prev, ...fields }));
    setErrors((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([key]) => !(key in fields)),
      ),
    );
  };
  const changeDoctor = (value:string) => update({doctorId:value,caseId:initial?.caseId||""});
  const imagingFiles = useMemo(() => o.materials.filter(isImaging), [o.materials]);
  const otherFiles = useMemo(() => o.materials.filter((f) => !isImaging(f)), [o.materials]);
  const uploading = Object.values(busy).some(Boolean);
  const validate = (page: number) => {
    const all = orderErrors(o, patientName);
    if(!o.patientSex)all.patientSex='请选择性别。';
    if(identity&&!validIdentity(identity)||!o.patientIdentityRef&&!validIdentity(identity))all.patientIdentity='请输入有效的18位居民身份证号码。';
    const fields =
      page === 0
        ? [
            "hospitalId",
            "department",
            "doctorId",
            "patientName","patientSex","patientIdentity",
          ]
        : page === 1
          ? ["name", "clinicalRequirements", "service", "quantity", "plannedStages", "due"]
          : page === 2
            ? ["materials"]
            : Object.keys(all);
    const selected = Object.fromEntries(
      Object.entries(all).filter(([key]) => fields.includes(key)),
    );
    setErrors(selected);
    return !Object.keys(selected).length;
  };
  const saveOrder = async (submit: boolean) => {
    if (saving || uploading) return;
    if (submit && !validate(3)) return;
    if(submit&&entry&&!entry.ready){setErrors(prev=>({...prev,import:'患者或检查资料已修改，请返回'+entry.label+'重新核对并应用资料。'}));return;}
    setSaving(true);
    try {
      let sensitive:Partial<Order>={};
      if(identity||submit&&!o.patientIdentityRef){
        try{sensitive=await business('patient',{sex:o.patientSex,identityNumber:identity,consent:o.insuranceConsent,verified:true});setOrder(prev=>({...prev,...sensitive}));setIdentity('');}catch(e){setErrors(prev=>({...prev,patientIdentity:(e as Error).message}));return;}
      }
      await save({...o,...sensitive,patientName}, submit, patientName);
    } finally {
      setSaving(false);
    }
  };
  const updateFiles = (
    category: "imaging" | "order-other",
    materials: Attachment[],
  ) => {
    setErrors((prev) => {
      const { materials, ...rest } = prev;
      return rest;
    });
    setOrder((prev) => ({
      ...prev,
      materials: [
        ...prev.materials.filter(
          (f) => (isImaging(f) ? "imaging" : "order-other") !== category,
        ),
        ...materials.filter(
          (f) => (isImaging(f) ? "imaging" : "order-other") === category,
        ),
      ],
    }));
  };
  return (
    <div className="project-page project-detail-page sales-order-page">
      <PageBack label="返回订单管理" onBack={cancel}/>
      <Card bordered={false} className="project-info-card">
        <h2>{entry?.title||(initial ? "编辑订单" : "新建订单")}</h2>
        <div className={"sales-order-content"+(entry?" sales-order-content-import":"")}>
        <OrderSteps current={entry?(showEntry?0:step+1):step} entryLabel={entry?.label} entryReady={entry?.unlocked} busy={entry?.busy||uploading||saving} onChange={index=>{if(entry){if(index===0){entry.onOpen?.();setShowEntry(true);}else if(entry.unlocked){setShowEntry(false);setStep(index-1)}}else setStep(index)}}/>
        {showEntry&&entry?(typeof entry.content==='function'?entry.content(async incoming=>{
          const merged=mergeImportedOrder(o,incoming,importedFiles.current);
          if(!merged.doctorId){setErrors({doctorId:'请填写需求医生'});setStep(0);setShowEntry(false);return;}
          await save({...merged,patientName:incoming.patientName},false,incoming.patientName||'');
        }):entry.content):<>
        <Form
          className={"sales-order-form"+(step===2?" sales-order-form-upload":"")}
          labelAlign="top"
          onSubmit={() => { if (step < 3) { if (validate(step)) setStep(step + 1); } else void saveOrder(true); }}
        >
          {step === 0 && (
            <>
              <Field label="医院" required error={errors.hospitalId}>
                <Select
                  aria-label="医院"
                  value={o.hospitalId}
                  placeholder="选择医院"
                  options={data.hospitals.map((h) => ({
                    value: h.id,
                    label: h.name,
                  }))}
                  onChange={(v) => {
                    update({
                      hospitalId: String(v),
                      department: "",
                      doctorId: "",
                      caseId: "",
                    });
                  }}
                />
              </Field>
              <Field label="科室" required error={errors.department}>
                <Select
                  aria-label="科室"
                  value={o.department}
                  placeholder="选择科室"
                  options={(
                    data.hospitals.find((h) => h.id === o.hospitalId)
                      ?.departments || []
                  ).map((value) => ({ value, label: value }))}
                  onChange={(v) => {
                    update({ department: String(v), doctorId: "", caseId: "" });
                  }}
                />
              </Field>
              <Field label="医生" required error={errors.doctorId}>
                <Select
                  aria-label="医生"
                  value={o.doctorId}
                  placeholder="选择医生"
                  options={data.doctors
                    .filter(
                      (d) =>
                        d.owner === data.ownerId &&
                        d.status === "审核通过" &&
                        d.hospitalId === o.hospitalId &&
                        d.department === o.department,
                    )
                    .map((d) => ({ value: d.id, label: d.name }))}
                  onChange={(v) => changeDoctor(String(v))}
                />
              </Field>
              <Field label="患者姓名" required error={errors.patientName}>
                <Input
                  aria-label="患者姓名"
                  value={patientName}
                  placeholder="填写患者姓名"
                  onChange={value=>{setPatientName(value);if(value!==patientName)entry?.onIdentityChange({patientName:value});setErrors(prev=>({...prev,patientName:""}));}}
                />
              </Field>
              <PatientInsuranceFields value={o} onChange={update} identity={identity} onIdentity={value=>{setIdentity(value);setErrors(prev=>({...prev,patientIdentity:''}));if(value!==identity)entry?.onIdentityChange({identityNumber:value})}} errors={{sex:errors.patientSex,identity:errors.patientIdentity}} verified={identityVerified} onVerified={setIdentityVerified}/>
            </>
          )}
          {step === 1 && (
            <>
              <Field label="手术项目名称" required error={errors.name}>
                <Input
                  aria-label="手术项目名称"
                  value={o.name}
                  onChange={(name) => update({ name })}
                />
              </Field>
              <Field
                label="设计需求"
                required
                error={errors.clinicalRequirements}
              >
                <ClinicalEditor owner={data.ownerId} value={o.clinicalContent!} error={errors.clinicalRequirements} onBusyChange={value=>setBusy(prev=>({...prev,clinical:value}))} onChange={content=>update({clinicalContent:content,designRequirements:clinicalText(content),clinicalRequirements:clinicalText(content),requirements:clinicalText(content)})}/>
              </Field>
              <Field label="业务服务项目" required error={errors.service}>
                <Select
                  aria-label="业务服务项目"
                  value={o.service}
                  options={services.map((value) => ({ value, label: value }))}
                  onChange={(v) => update({ service: String(v) })}
                />
              </Field>
              <Field label="设计阶段" required error={errors.plannedStages}>
                <Select
                  aria-label="设计阶段"
                  multiple
                  value={o.plannedStages || []}
                  options={designStages.map((value) => ({
                    value,
                    label: value,
                  }))}
                  onChange={(v) =>
                    update({
                      plannedStages: designStages.filter((s) =>
                        (v as string[]).includes(s),
                      ),
                    })
                  }
                />
              </Field>
              <Field label="需求数量" required error={errors.quantity}>
                <InputNumber
                  aria-label="需求数量"
                  min={1}
                  decimalPlaces={0}
                  value={o.quantity}
                  onChange={(v) => update({ quantity: Number(v) })}
                />
              </Field>
              <Field label="期望完成时间" required error={errors.due}>
                <DatePicker
                  value={o.requestedDueDate ?? o.due}
                  inputProps={{ placeholder: "选择期望完成时间" }}
                  disableDate={(date) =>
                    localDate(new Date(date)) <= localDate()
                  }
                  onChange={(value) => update({ requestedDueDate: String(value), due: String(value) })}
                />
              </Field>
            </>
          )}
          {step === 2 && (
            <>
              <Field label="医学影像" required error={errors.materials}>
                <SalesAttachments
                  owner={data.ownerId}
                  value={imagingFiles}
                  category="imaging"
                  help="支持 DICOM、NIfTI 或 ZIP 影像文件。"
                  accept=".dcm,.dicom,.nii,.nii.gz,.zip"
                  validate={(file) =>
                    /\.(dcm|dicom|nii|nii\.gz|zip)$/i.test(file.name)
                      ? ""
                      : "请选择DICOM、NIfTI或影像ZIP文件。"
                  }
                  onChange={(v) => updateFiles("imaging", v)}
                  onBusyChange={(value) =>
                    setBusy((prev) => ({ ...prev, imaging: value }))
                  }
                />
              </Field>
              <Field label="其他附件">
                <SalesAttachments
                  owner={data.ownerId}
                  value={otherFiles}
                  category="order-other"
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                  validate={(file) =>
                    /\.(pdf|png|jpe?g|txt)$/i.test(file.name)
                      ? ""
                      : "请选择PDF、图片或文本附件。"
                  }
                  onChange={(v) => updateFiles("order-other", v)}
                  onBusyChange={(value) =>
                    setBusy((prev) => ({ ...prev, other: value }))
                  }
                />
              </Field>
            </>
          )}
          {step === 3 && (
            <dl className="project-info-grid sales-order-confirm">
              {[
                [
                  "医院",
                  data.hospitals.find((h) => h.id === o.hospitalId)?.name,
                ],
                ["科室", o.department],
                [
                  "医生",
                  data.doctors.find((d) => d.id === o.doctorId)?.name,
                ],
                ["患者姓名", patientName],
                ["手术项目名称", o.name],
                ["设计需求", <ClinicalReadOnly owner={data.ownerId} value={designDemand(o).content} fallback={designDemand(o).text||"—"}/>],
                ["业务服务项目", o.service],
                ["设计阶段", <OrderIcons stages={o.plannedStages || []} />],
                ["需求数量", String(o.quantity)],
                ["期望完成时间", o.requestedDueDate ?? o.due],
                [
                  "医学影像",
                  o.materials
                    .filter(isImaging)
                    .map((f) => f.name)
                    .join("、"),
                ],
                [
                  "其他附件",
                  o.materials
                    .filter((f) => !isImaging(f))
                    .map((f) => f.name)
                    .join("、") || "未上传",
                ],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {step === 3 &&
            Object.values(errors).map((error) => (
              <p role="alert" className="sales-error" key={error}>
                {error}
              </p>
            ))}
          <div className="sales-actions">
            {(step > 0 || entry) && (
              <Button variant="outline" onClick={() => {if(step===0&&entry){entry.onOpen?.();setShowEntry(true);}else setStep(step-1)}}>
                上一步
              </Button>
            )}
            <Button
              variant="outline"
              disabled={uploading || saving}
              onClick={() => void saveOrder(false)}
            >
              保存草稿
            </Button>
            {step < 3 ? (
              <Button
                theme="primary"
                disabled={uploading || saving}
                onClick={() => {
                  if (validate(step)) setStep(step + 1);
                }}
              >
                下一步
              </Button>
            ) : (
              <Button
                theme="primary"
                loading={saving}
                disabled={uploading}
                onClick={() => void saveOrder(true)}
              >
                提交订单
              </Button>
            )}
          </div>
        </Form></>}</div>
      </Card>
    </div>
  );
}

export function OrderDetail({
  order,
  data,
  ownerName,
  onBack,
  onEdit,
  status,
}: {
  order: Order;
  data: SalesData;
  ownerName: string;
  onBack: () => void;
  onEdit: () => void;
  status: ReactNode;
}) {
  const [imaging,setImaging]=useState<Attachment|null>(null);
  const clinicalCase = data.cases.find((c) => c.id === order.caseId);
  const project = data.projects?.find(p=>p.id===order.projectId && p.orderId===order.id);
  const events = data.events
    .filter((e) => e.target === order.id)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const [preview, setPreview] = useState<{
    url: string;
    image: boolean;
  } | null>(null);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );
  const showFile = async (file: Attachment) => {
    try {
      if(isImaging(file)){setImaging(file);return;}
      const blob = await getFile(data.ownerId, file);
      setPreview({
        url: URL.createObjectURL(blob),
        image: file.type.startsWith("image/"),
      });
    } catch (e) {
      void MessagePlugin.error((e as Error).message);
    }
  };
  const stages = designStages.filter((s) =>
    (order.plannedStages || order.stages.map((s) => s.name)).includes(s),
  );
  const Info = ({
    label,
    children,
    wide = false,
  }: {
    label: string;
    children: ReactNode;
    wide?: boolean;
  }) => (
    <div className={wide ? "project-info-wide" : undefined}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
  return (
    <div className="project-page project-detail-page sales-order-page">
      <PageBack label="返回订单管理" onBack={onBack}/>
      <Card bordered={false} className="project-info-card">
        <div className="project-page-heading">
          <h2>订单概览</h2>
          {["草稿", "审核退回"].includes(order.status) && (
            <Button theme="primary" onClick={onEdit}>
              {order.status === "草稿" ? "继续编辑" : "修改后重新提交"}
            </Button>
          )}
        </div>
        <dl className="project-info-grid">
          <Info label="订单编号">{orderNumber(order)}</Info>
          <Info label="手术项目名称">{order.name}</Info>
          <Info label="医院">
            {data.hospitals.find((h) => h.id === order.hospitalId)?.name}
          </Info>
          <Info label="科室">{order.department}</Info>
          <Info label="医生">
            {data.doctors.find((d) => d.id === order.doctorId)?.name}
          </Info>
          <Info label="患者姓名">{order.patientName ?? clinicalCase?.patientName ?? "未记录"}</Info>
          <Info label="订单状态">{status}</Info>
          <Info label="设计阶段">
            <OrderIcons stages={stages} />
          </Info>
          <Info label="业务服务项目">{order.service}</Info>
          <Info label="预计交付时间">{confirmedDelivery(order) ? formatDate(confirmedDelivery(order)) : "待排期"}</Info>
          <Info label="创建时间">{formatDateTime(order.created)}</Info>
          <Info label="最近更新时间">{formatDateTime(order.updated)}</Info>
          <Info label="需求数量">{order.quantity}</Info>
          <Info label="报价">待核定</Info>
          <Info label="设计需求" wide>
            <ClinicalReadOnly owner={data.ownerId} value={designDemand(order).content} fallback={designDemand(order).text||"—"}/>
          </Info>
        </dl>
        {order.reason && <p className="sales-error">{order.reason}</p>}
      </Card>
      <Card bordered={false} className="project-info-card">
        <h2>资料附件</h2>
        <Table
          className="app-table sales-order-file-table"
          rowKey="id"
          data={order.materials}
          tableLayout="fixed"
          empty="暂无已上传附件"
          columns={[
            { colKey: "name", title: "文件名", ellipsis: true, width: 220, cell: ({row}) => <Button className="sales-order-link sales-order-file-name" variant="text" theme="primary" onClick={()=> { if(isImaging(row)||row.type==="application/pdf" || row.type.startsWith("image/")) void showFile(row); else void MessagePlugin.info("此类型仅可在获授权的专业影像视窗查看。"); }}>{row.name}</Button> },
            {
              colKey: "category",
              title: "类别",
              width: 110,
              cell: ({ row }) => (isImaging(row) ? "医学影像" : "其他附件"),
            },
            {
              colKey: "type",
              title: "类型",
              width: 85,
              cell: ({ row }) => row.name.split(".").at(-1)?.toUpperCase(),
            },
            {
              colKey: "size",
              title: "大小",
              width: 90,
              cell: ({ row }) => (row.size / 1024).toFixed(1) + " KB",
            },
            {
              colKey: "uploadedBy",
              title: "上传人",
              width: 110,
              cell: ({ row }) =>
                row.uploadedBy === data.ownerId
                  ? ownerName
                  : row.uploadedBy || "未记录",
            },
            {
              colKey: "uploadedAt",
              title: "上传时间",
              width: 150,
              cell: ({ row }) =>
                row.uploadedAt ? formatDateTime(row.uploadedAt) : "未记录",
            },
            {
              colKey: "status",
              title: "状态",
              width: 90,
              cell: ({ row }) =>
                row.status === "success" ? "已上传" : "旧记录待核验",
            },
            {
              colKey: "actions",
              title: "操作",
              width: 160,
              cell: ({ row }) => (
                <div className="sales-actions-inline">
                  {(row.type === "application/pdf" ||
                    row.type.startsWith("image/") || isImaging(row)) && (
                    <Button
                      className="sales-order-link" variant="text"
                      theme="primary"
                      onClick={() => void showFile(row)}
                    >
                      预览
                    </Button>
                  )}

                </div>
              ),
            },
          ]}
        />
      </Card>
      <Card bordered={false} className="project-stages-card">
        <div className="section-heading">
          <h2>设计阶段</h2>
        </div>
        <div className="project-stages">
          {stages.map((name, index) => {
            const stage = order.stages.find((s) => s.name === name);
            const assigned = !!stage?.owner;
            const state =
              stage?.status || "未开始";
            const artifact = order.materials.find(
              (f) => stage?.status === "已完成" && f.id === stage?.artifactId && f.status === "success" && (f.type.startsWith("image/") || f.type === "application/pdf"),
            );
            return (
              <section className="project-stage sales-design-stage" key={name}>
                <div className="project-stage-title">
                  <h3>
                    {String(index + 1).padStart(2, "0")} {name}
                  </h3>
                  <ProjectStatus
                    status={
                      state as Parameters<typeof ProjectStatus>[0]["status"]
                    }
                  />
                </div>
                <p>负责人：{stage?.owner || (state==="进行中"?"待核实":"待分配")}</p>
                <div className="sales-stage-progress"><Tooltip content={stageProgress(state,index)}><span>{stageProgress(state,index)}</span></Tooltip><StageShare orderId={order.id} stage={name} completed={state==="已完成"} data={data}/></div>
              </section>
            );
          })}
        </div>
      </Card>

      <Card bordered={false} className="project-flow-card">
        <h2>操作记录</h2>
        <div className="timeline">
          {events.length ? (
            events.map((event) => (
              <div className="timeline-item" key={event.id}>
                <i />
                <div>
                  <strong>
                    {event.title}
                    {event.stage && (
                      <span className="flow-source">{event.stage}</span>
                    )}
                  </strong>
                  <p>
                    <span className="timeline-meta">
                      {formatDateTime(event.at)} ·{" "}
                      {event.actor === data.ownerId
                        ? ownerName
                        : event.actor.replace("（隔离测试）", "")}
                    </span>
                    <span className="timeline-note">{event.detail}</span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <Empty description="暂无已发生的操作记录" />
          )}
        </div>
      </Card>
      {imaging&&<ImagingPreview owner={data.ownerId} file={imaging} onClose={()=>setImaging(null)}/>}
      <Dialog
        visible={!!preview}
        header="资料预览"
        footer={false}
        width="80%"
        onClose={() => setPreview(null)}
      >
        {preview &&
          (preview.image ? (
            <img
              alt="订单附件预览"
              src={preview.url}
              className="sales-order-preview"
            />
          ) : (
            <iframe
              title="订单PDF附件"
              src={preview.url+"#toolbar=0&navpanes=0"}
              className="sales-order-pdf"
            />
          ))}
      </Dialog>
    </div>
  );
}

export function stageProgress(state:string,index:number){return state==="已完成"?"设计成果已审核通过":state==="待审核"?"设计成果已提交审核":state==="审核退回"?"审核意见已反馈，待修改":state==="进行中"?"专业任务正在处理中":index?"等待前置阶段完成":"等待任务开始"}
