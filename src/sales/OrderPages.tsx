import { confirmedDelivery } from "./orderRules.mjs";
import { useEffect, useMemo, useState } from "react";
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
  Steps,
  Table,
  Textarea,
  Tooltip,
  MessagePlugin,
} from "tdesign-react";
import type { ReactNode } from "react";
import type { Case, Order, SalesData, Attachment } from "./model";
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
import { ChevronLeftIcon } from "../design-system/tdesign";
import { InfoCircleIcon as OfficialInfoCircleIcon } from "tdesign-icons-react";
import { adaptIcon } from "../design-system/CliniVolIcon";
const InfoCircleIcon = adaptIcon(OfficialInfoCircleIcon);
import { formatDate, formatAuditTime, formatDateTime } from "../dateTime";
import { getFile, openFile } from "./files";

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
  label: string;
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
export function OrderEditor({
  data,
  initial,
  doctorId,
  caseId,
  createCase,
  save,
  cancel,
}: {
  data: SalesData;
  initial?: Order;
  doctorId?: string;
  caseId?: string;
  createCase: (value: Case) => boolean;
  save: (
    order: Order,
    submit: boolean,
    patientName: string,
  ) => Promise<boolean>;
  cancel: () => void;
}) {
  const [o, setOrder] = useState<Order>(() => {
    const c = data.cases.find((x) => x.id === caseId);
    const doctor = data.doctors.find((d) => d.id === (c?.doctorId || doctorId));
    return initial
      ? structuredClone(initial)
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
        };
  });
  const [step, setStep] = useState(0),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [caseOpen, setCaseOpen] = useState(false),
    [caseError, setCaseError] = useState(false);
  const [caseName, setCaseName] = useState(""),
    [caseSummary, setCaseSummary] = useState("");
  const [clinicalType, setClinicalType] = useState("");
  const linkedCase = data.cases.find((c) => c.id === o.caseId);
  const [patientName, setPatientName] = useState(linkedCase?.patientName || "");
  const update = (fields: Partial<Order>) => {
    setOrder((prev) => ({ ...prev, ...fields }));
    setErrors((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([key]) => !(key in fields)),
      ),
    );
  };
  const chooseCase = (value: string) => {
    const c = data.cases.find((x) => x.id === value);
    update({ caseId: value });
    setPatientName(c?.patientName || "");
    setErrors((prev) => {
      const { caseId, patientName, ...rest } = prev;
      return rest;
    });
  };
  const changeDoctor = (value: string) => {
    update({ doctorId: value, caseId: "" });
    setPatientName("");
  };
  const imagingFiles = useMemo(() => o.materials.filter(isImaging), [o.materials]);
  const otherFiles = useMemo(() => o.materials.filter((f) => !isImaging(f)), [o.materials]);
  const uploading = Object.values(busy).some(Boolean);
  const validate = (page: number) => {
    const all = orderErrors(o, patientName);
    const fields =
      page === 0
        ? [
            "hospitalId",
            "department",
            "doctorId",
            "caseId",
            "patientName",
            "name",
            "clinicalRequirements",
          ]
        : page === 1
          ? ["service", "quantity", "plannedStages", "due"]
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
    setSaving(true);
    try {
      await save(o, submit, patientName);
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
      <Button
        variant="text"
        icon={<ChevronLeftIcon size={16} />}
        onClick={cancel}
      >
        返回订单管理
      </Button>
      <Card bordered={false} className="project-info-card">
        <h2>{initial ? "编辑订单" : "新建订单"}</h2>
        <Steps current={step}>
          {["客户与病例", "服务需求", "资料上传", "确认并提交"].map((title) => (
            <Steps.StepItem key={title} title={title} />
          ))}
        </Steps>
        <Form
          className="sales-order-form"
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
                    setPatientName("");
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
                    setPatientName("");
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
              <Field label="病例编号" required error={errors.caseId}>
                <Tooltip content="已存在的病例可被多个订单引用，新增服务无需重复建档。"><span aria-label="病例编号说明"><InfoCircleIcon size={16} /></span></Tooltip>
                <div className="sales-case-choice">
                  <Select
                    aria-label="病例编号"
                    value={o.caseId}
                    placeholder="选择已有病例"
                    options={data.cases
                      .filter((c) => c.doctorId === o.doctorId)
                      .map((c) => ({ value: c.id, label: c.id }))}
                    onChange={(v) => chooseCase(String(v))}
                  />
                  <Button
                    variant="text"
                    theme="primary"
                    disabled={!o.doctorId}
                    onClick={() => {
                      setCaseOpen(true);
                      setCaseError(false);
                    }}
                  >
                    新建病例
                  </Button>
                </div>
              </Field>
              <Field label="患者姓名" required error={errors.patientName}>
                <Input
                  aria-label="患者姓名"
                  value={patientName}
                  readonly={!!linkedCase?.patientName}
                  placeholder={
                    linkedCase
                      ? "填写病例尚未记录的患者姓名"
                      : "请先选择或新建病例"
                  }
                  disabled={!linkedCase}
                  onChange={setPatientName}
                />
              </Field>
              <Field label="手术项目名称" required error={errors.name}>
                <Input
                  aria-label="手术项目名称"
                  value={o.name}
                  onChange={(name) => update({ name })}
                />
              </Field>
              <Field
                label="临床需求"
                required
                error={errors.clinicalRequirements}
              >
                <Textarea
                  aria-label="临床需求"
                  value={o.clinicalRequirements || o.requirements}
                  autosize={{ minRows: 3, maxRows: 8 }}
                  onChange={(value) =>
                    update({ clinicalRequirements: value, requirements: value })
                  }
                />
              </Field>
            </>
          )}
          {step === 1 && (
            <>
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
              <Field label="设计需求或特殊要求">
                <Textarea
                  aria-label="设计需求或特殊要求"
                  value={o.designRequirements || ""}
                  autosize={{ minRows: 3, maxRows: 8 }}
                  onChange={(designRequirements) =>
                    update({ designRequirements })
                  }
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
                  help="支持 DICOM、NIfTI 或 ZIP 影像文件；单文件不超过20MB。"
                  helpTooltip="大体积影像请通过影像服务导入。"
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
                ["病例编号", o.caseId],
                ["患者姓名", patientName],
                ["手术项目名称", o.name],
                ["临床需求", o.clinicalRequirements || o.requirements],
                ["业务服务项目", o.service],
                ["设计阶段", <OrderIcons stages={o.plannedStages || []} />],
                ["设计需求", o.designRequirements || "未填写"],
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
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
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
        </Form>
      </Card>
      <Dialog
        visible={caseOpen}
        header="新建病例"
        confirmBtn="保存病例"
        onClose={() => setCaseOpen(false)}
        onConfirm={() => {
          setCaseError(true);
          if (!caseName.trim() || !caseSummary.trim()) return;
          const clinicalCase: Case = {
            id: "CASE-" + id().slice(0, 8),
            doctorId: o.doctorId,
            hospitalId: o.hospitalId,
            department: o.department,
            patientName: caseName.trim(),
            summary: caseSummary.trim(),
            clinicalType: clinicalType.trim(),
          };
          if (createCase(clinicalCase)) {
            update({ caseId: clinicalCase.id });
            setPatientName(clinicalCase.patientName!);
            setCaseOpen(false);
            setCaseName("");
            setCaseSummary("");
          }
        }}
      >
        <Form labelAlign="top">
          <Field label="所属医院"><Input readonly value={data.hospitals.find(h=>h.id===o.hospitalId)?.name || ""} /></Field>
          <Field label="临床部位或病例类型"><Input aria-label="临床部位或病例类型" value={clinicalType} onChange={setClinicalType} /></Field>
          <Field
            label="患者姓名"
            required
            error={caseError && !caseName.trim() ? "请填写患者姓名" : undefined}
          >
            <Input
              aria-label="新病例患者姓名"
              value={caseName}
              onChange={setCaseName}
            />
          </Field>
          <Field label="医生">
            <Input
              readonly
              value={data.doctors.find((d) => d.id === o.doctorId)?.name || ""}
            />
          </Field>
          <Field
            label="临床背景摘要"
            required
            error={
              caseError && !caseSummary.trim()
                ? "请填写临床背景摘要"
                : undefined
            }
          >
            <Textarea
              aria-label="临床背景摘要"
              value={caseSummary}
              onChange={setCaseSummary}
            />
          </Field>
        </Form>
      </Dialog>
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
      <Button
        variant="text"
        icon={<ChevronLeftIcon size={16} />}
        onClick={onBack}
      >
        返回订单管理
      </Button>
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
          <Info label="订单编号">{order.id}</Info>
          <Info label="手术项目名称">{order.name}</Info>
          <Info label="病例编号">{order.caseId}</Info>
          <Info label="医院">
            {data.hospitals.find((h) => h.id === order.hospitalId)?.name}
          </Info>
          <Info label="科室">{order.department}</Info>
          <Info label="医生">
            {data.doctors.find((d) => d.id === order.doctorId)?.name}
          </Info>
          <Info label="患者姓名">{clinicalCase?.patientName || "未记录"}</Info>
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
          <Info label="临床需求" wide>
            {order.clinicalRequirements || order.requirements || "未记录"}
          </Info>
          <Info label="设计需求" wide>
            {order.designRequirements || "未填写"}
          </Info>
        </dl>
        {order.reason && <p className="sales-error">{order.reason}</p>}
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
              stage?.status === "进行中" && !assigned
                ? "未开始"
                : stage?.status || "未开始";
            const artifact = order.materials.find(
              (f) => f.id === stage?.artifactId && f.status === "success",
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
                <p>
                  负责人：
                  {stage?.owner || (state === "已完成" ? "未记录" : "尚未分配")}
                </p>
                <p>
                  {stage?.description ||
                    (state === "已完成"
                      ? "阶段已完成"
                      : !project
                        ? "等待订单审核受理"
                        : !assigned
                          ? "等待专业任务分配"
                          : state === "未开始"
                            ? "已分配，等待前序成果确认后开始"
                            : state === "待审核"
                              ? "成果已提交，等待审核"
                              : state === "审核退回"
                                ? "审核退回，需根据意见修改"
                                : "任务正在处理中")}
                </p>
                <div className="project-stage-actions" hidden={!artifact}>
                  {artifact && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        void openFile(data.ownerId, artifact).catch((e) =>
                          MessagePlugin.error(e.message),
                        )
                      }
                    >
                      查看成果
                    </Button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
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
            { colKey: "name", title: "文件名", ellipsis: true, width: 220, cell: ({row}) => <Button className="sales-order-link" variant="text" theme="primary" onClick={()=> { if(row.type==="application/pdf" || row.type.startsWith("image/")) void showFile(row); else void openFile(data.ownerId,row).catch(e=>MessagePlugin.error(e.message)); }}>{row.name}</Button> },
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
                    row.type.startsWith("image/")) && (
                    <Button
                      className="sales-order-link" variant="text"
                      theme="primary"
                      onClick={() => void showFile(row)}
                    >
                      预览
                    </Button>
                  )}
                  <Button
                    className="sales-order-link" variant="text"
                    theme="primary"
                    onClick={() =>
                      void openFile(data.ownerId, row).catch((e) =>
                        MessagePlugin.error(e.message),
                      )
                    }
                  >
                    下载
                  </Button>
                </div>
              ),
            },
          ]}
        />
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
              src={preview.url}
              className="sales-order-pdf"
            />
          ))}
      </Dialog>
    </div>
  );
}
