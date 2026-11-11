export type DoctorStatus = "草稿" | "待审核" | "审核通过" | "审核退回";
export type OrderStatus =
  | "草稿"
  | "待审核"
  | "审核退回"
  | "处理中"
  | "已完成"
  | "已取消";
export type Hospital = {
  id: string;
  name: string;
  region: string;
  departments: string[];
};
export type Attachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  category?: "identity" | "practice" | "other";
  uploadedAt?: string;
  uploadedBy?: string;
  status?: "success";
  storage?: "browser" | "invitation";
};
export type Doctor = {
  id: string;
  name: string;
  phone: string;
  hospitalId: string;
  department: string;
  title: string;
  certificate: string;
  status: DoctorStatus;
  owner: string | null;
  materials: Attachment[];
  reason: string;
  source: string;
  createdBy?: string;
  invitedBy?: string;
  updatedAt?: string;
  phoneVerified?: boolean;
};
export type Case = { id: string; doctorId: string; summary: string };
export type Order = {
  id: string;
  name: string;
  caseId: string;
  doctorId: string;
  hospitalId: string;
  department: string;
  service: string;
  quantity: number;
  requirements: string;
  due: string;
  created: string;
  updated: string;
  businessDate: string;
  status: OrderStatus;
  materials: Attachment[];
  reason: string;
  ownerSalesId?: string;
  projectId?: string;
  taskIds?: string[];
  plannedStages?: string[];
  confirmationRequired?: boolean;
  confirmedAt?: string;
  stages: {
    name: string;
    status: string;
    taskId?: string;
    owner?: string;
    description?: string;
    artifactId?: string;
  }[];
};
export type Event = {
  id: string;
  at: string;
  actor: string;
  target: string;
  title: string;
  detail: string;
  read: boolean;
};
export type Request = {
  id: string;
  kind: "归属变更" | "历史访问" | "建档关联";
  target: string;
  reason: string;
  status: "待审核" | "通过" | "退回";
  at: string;
  expires?: string;
  oldOwner?: string;
  newOwner: string;
  reviewer?: string;
  applicant?: string;
  reviewedAt?: string;
  reviewReason?: string;
};
export type SalesData = {
  schema: 1;
  ownerId: string;
  hospitals: Hospital[];
  doctors: Doctor[];
  cases: Case[];
  orders: Order[];
  events: Event[];
  requests: Request[];
  projects?: {
    id: string;
    orderId: string;
    caseId: string;
    taskIds: string[];
    source: "isolated-sales";
  }[];
  policy: {
    months: 3 | 6;
    basis: "created" | "businessDate";
    managerIds: string[];
  };
};
export const services = [
  "三维重建及数字模型",
  "手术导板设计",
  "支具设计",
  "矫形具设计",
  "模型打印",
];
export const orderStatuses: OrderStatus[] = [
  "草稿",
  "待审核",
  "审核退回",
  "处理中",
  "已完成",
  "已取消",
];
export const id = () => crypto.randomUUID();
export function localMonth(value: string | Date) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0")
    : "";
}
export function seedSales(ownerId: string, now = new Date()): SalesData {
  const at = (days: number) =>
    new Date(now.getTime() - days * 86400000).toISOString();
  const hospitals = [
    {
      id: "H-A",
      name: "江淮协同医院（虚构）",
      region: "安徽区域",
      departments: ["口腔颌面外科", "骨科"],
    },
    {
      id: "H-B",
      name: "皖中康复医院（虚构）",
      region: "安徽区域",
      departments: ["康复医学科", "骨科"],
    },
    {
      id: "H-C",
      name: "新安数字医学中心（虚构）",
      region: "安徽区域",
      departments: ["口腔科", "神经外科"],
    },
  ];
  const doctors: Doctor[] = [
    "林医生",
    "周医生",
    "许医生",
    "方医生",
    "陆医生",
    "徐医生",
  ].map((name, i) => ({
    id: `D-${i + 1}`,
    name,
    hospitalId: hospitals[i % 3].id,
    department: hospitals[i % 3].departments[0],
    phone: "",
    title: i % 2 ? "副主任医师" : "主治医师",
    certificate: `DEMO-QUAL-${i + 1}`,
    status: (
      [
        "审核通过",
        "审核通过",
        "待审核",
        "审核退回",
        "草稿",
        "审核通过",
      ] as DoctorStatus[]
    )[i],
    owner: i === 5 ? "other-sales" : i < 2 ? ownerId : null,
    materials: [],
    reason: i === 3 ? "请补充清晰的执业证书照片。" : "",
    source: "销售建档",
  }));
  const cases = doctors
    .filter((d) => d.owner === ownerId)
    .map((d, i) => ({
      id: `CASE-S-${i + 1}`,
      doctorId: d.id,
      summary: "脱敏设计需求",
    }));
  const states: OrderStatus[] = [
    "处理中",
    "审核退回",
    "处理中",
    "草稿",
    "待审核",
    "已完成",
    "处理中",
    "已完成",
  ];
  const orders: Order[] = states.map((status, i) => {
    const d = doctors[i % 2],
      created = at(i < 6 ? i + 1 : 140 + i);
    return {
      id: `SO-${now.getFullYear()}-${String(i + 1).padStart(4, "0")}`,
      name: ["颌骨修复数字模型", "手术导板需求", "康复支具方案"][i % 3],
      caseId: cases[i % 2].id,
      doctorId: d.id,
      hospitalId: d.hospitalId,
      department: d.department,
      service: services[i % 5],
      quantity: 1,
      requirements: "按临床需求说明整理设计资料。",
      due: at(-7).slice(0, 10),
      created,
      updated: created,
      businessDate: created,
      status,
      materials: [],
      confirmationRequired: i === 2,
      ownerSalesId: ownerId,
      reason: status === "审核退回" ? "请补充临床需求说明。" : "",
      stages:
        status === "处理中" && i !== 2
          ? [{ name: "三维重建", status: "进行中" }]
          : i === 2 || status === "已完成"
            ? [{ name: "三维重建", status: "已完成" }]
            : [],
    };
  });
  return {
    schema: 1,
    ownerId,
    hospitals,
    doctors,
    cases,
    orders,
    events: [],
    requests: [],
    policy: { months: 3, basis: "businessDate", managerIds: [] },
  };
}
export function canReadOrder(data: SalesData, o: Order, now = new Date()) {
  if (
    !data.hospitals.some(
      (h) => h.id === o.hospitalId && h.departments.includes(o.department),
    ) ||
    (o.ownerSalesId || data.ownerId) !== data.ownerId
  )
    return false;
  const cutoff = new Date(now);
  const day = cutoff.getDate();
  cutoff.setDate(1);
  cutoff.setMonth(cutoff.getMonth() - data.policy.months);
  cutoff.setDate(
    Math.min(
      day,
      new Date(cutoff.getFullYear(), cutoff.getMonth() + 1, 0).getDate(),
    ),
  );
  return (
    new Date(o[data.policy.basis]).getTime() >= cutoff.getTime() ||
    data.requests.some(
      (r) =>
        r.kind === "历史访问" &&
        r.target === o.id &&
        r.newOwner === data.ownerId &&
        r.status === "通过" &&
        !!r.expires &&
        new Date(r.expires) > now,
    )
  );
}
export const visibleOrders = (d: SalesData, now = new Date()) =>
  d.orders.filter((o) => canReadOrder(d, o, now));
export function metrics(d: SalesData, now = new Date()) {
  const orders = visibleOrders(d, now),
    month =
      now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  return {
    doctors: d.doctors.filter((x) => x.owner === d.ownerId),
    active: orders.filter(
      (o) => !["草稿", "已完成", "已取消"].includes(o.status),
    ),
    todos: orders.filter((o) => ["草稿", "审核退回"].includes(o.status)),
    newOrders: orders.filter((o) => localMonth(o.created) === month),
    completed: orders.filter(
      (o) => o.status === "已完成" && localMonth(o.updated) === month,
    ),
  };
}
export type SalesActor = { id: string; name?: string; permissions: string[] };
export type Command = {
  type: string;
  target?: string;
  value?: unknown;
  reason?: string;
};
export function transition(
  data: SalesData,
  c: Command,
  authority: boolean | SalesActor = false,
  now = new Date(),
): SalesData {
  const actor =
    typeof authority === "object"
      ? authority
      : { id: data.ownerId, permissions: [] };
  const admin = authority === true;
  const canApprove = (permission: string) =>
    admin || actor.permissions.includes(permission);
  if (!admin && actor.id !== data.ownerId)
    throw new Error("账号与业务数据不匹配。");
  const d = structuredClone(data),
    at = now.toISOString();
  let target = c.target || "",
    title = "",
    detail = c.reason || "";
  const doctor = d.doctors.find((x) => x.id === target),
    order = d.orders.find((x) => x.id === target);
  const fail = (s: string): never => {
    throw new Error(s);
  };
  if (c.type === "doctor-save-submit")
    return transition(
      transition(data, { type: "doctor-save", value: c.value }, authority, now),
      { type: "doctor-submit", target: (c.value as Doctor).id },
      authority,
      now,
    );
  if (c.type === "doctor-save") {
    const v = c.value as Doctor;
    if (
      v.hospitalId &&
      !d.hospitals.some(
        (h) =>
          h.id === v.hospitalId &&
          (!v.department || h.departments.includes(v.department)),
      )
    )
      fail("请选择授权医院与科室。");
    if (
      v.phone &&
      (!/^1[3-9]\d{9}$/.test(v.phone) ||
        d.doctors.some((x) => x.phone === v.phone && x.id !== v.id))
    )
      fail("手机号无效或医生档案已存在。");
    if (!v.name.trim()) fail("请填写真实姓名。");
    const old = d.doctors.find((x) => x.id === v.id);
    if (old?.owner && old.owner !== d.ownerId) fail("不能修改其他销售的医生。");
    if (old && ["待审核", "审核通过"].includes(old.status))
      fail("当前档案不可修改。");
    const safe = {
      ...v,
      owner: old?.owner ?? null,
      createdBy: old?.createdBy || d.ownerId,
      invitedBy: old?.invitedBy || v.invitedBy,
      updatedAt: at,
      status: old?.status || "草稿",
    };
    d.doctors = d.doctors.filter((x) => x.id !== v.id);
    d.doctors.push(safe);
    target = v.id;
    title = "医生档案已保存";
  } else if (c.type === "doctor-submit") {
    if (
      !doctor ||
      (doctor.owner && doctor.owner !== d.ownerId) ||
      !["草稿", "审核退回"].includes(doctor.status)
    )
      fail("档案当前不可提交。");
    if (
      !doctor!.name ||
      !/^1[3-9]\d{9}$/.test(doctor!.phone) ||
      !doctor!.title ||
      !doctor!.certificate ||
      !d.hospitals.some(
        (h) =>
          h.id === doctor!.hospitalId &&
          h.departments.includes(doctor!.department),
      ) ||
      !doctor!.materials.some(
        (f) => f.category === "practice" || !f.category,
      ) ||
      !doctor!.materials.some((f) => f.category === "identity")
    )
      fail("请补齐姓名、证书编号及资质材料。");
    doctor!.status = "待审核";
    title = "医生档案已提交审核";
  } else if (c.type === "doctor-review") {
    if (
      !admin ||
      !doctor ||
      doctor.status !== "待审核" ||
      !["审核通过", "审核退回"].includes(String(c.value))
    )
      fail("仅测试管理员可审核待审档案。");
    if (c.value === "审核退回" && !detail.trim()) fail("请填写退回原因。");
    doctor!.status = c.value as DoctorStatus;
    doctor!.reason = detail;
    if (c.value === "审核通过") {
      if (doctor!.owner && doctor!.owner !== d.ownerId)
        fail("医生已有关联销售，须审批归属变更。");
      doctor!.owner = d.ownerId;
    }
    title = `医生${c.value}`;
  } else if (c.type === "case-create") {
    const v = c.value as Case;
    if (!v.summary.trim()) fail("请填写病例需求摘要。");
    if(d.cases.some(x=>x.id===v.id)) fail("病例编号已存在。");
    if (
      !d.doctors.some(
        (x) =>
          x.id === v.doctorId &&
          x.owner === d.ownerId &&
          x.status === "审核通过",
      )
    )
      fail("只能为本人已关联医生创建病例。");
    d.cases.push(v);
    target = v.id;
    title = "病例已创建";
  } else if (c.type === "order-save") {
    const v = c.value as Order;
    if (!Number.isInteger(v.quantity) || v.quantity < 1)
      fail("需求数量须为正整数。");
    const old = d.orders.find((x) => x.id === v.id),
      doc = d.doctors.find((x) => x.id === v.doctorId);
    if (
      !doc ||
      doc.owner !== d.ownerId ||
      doc.status !== "审核通过" ||
      !d.cases.some((x) => x.id === v.caseId && x.doctorId === doc.id)
    )
      fail("请选择本人授权客户及关联病例。");
    if (
      !d.hospitals.some(
        (h) =>
          h.id === doc!.hospitalId && h.departments.includes(doc!.department),
      )
    )
      fail("医生不在授权医院及科室。");
    if (
      old &&
      (!canReadOrder(d, old, now) || !["草稿", "审核退回"].includes(old.status))
    )
      fail("当前订单不可修改。");
    const safe = {
      ...v,
      hospitalId: doc!.hospitalId,
      department: doc!.department,
      ownerSalesId: old?.ownerSalesId || d.ownerId,
      status: old?.status || "草稿",
      projectId: old?.projectId,
      taskIds: old?.taskIds,
      plannedStages: old?.plannedStages || [
        "三维重建",
        ...(v.service === "模型打印"
          ? ["3D打印"]
          : ["手术导板设计", "支具设计", "矫形具设计"].includes(v.service)
            ? ["CAD设计"]
            : []),
      ],
      confirmationRequired: old?.confirmationRequired ?? true,
      confirmedAt: old?.confirmedAt,
      stages: old?.stages || [],
      created: old?.created || at,
      updated: at,
      businessDate: old?.businessDate || at,
    };
    d.orders = d.orders.filter((x) => x.id !== v.id);
    d.orders.push(safe);
    target = v.id;
    title = "订单草稿已保存";
  } else if (c.type === "order-submit") {
    if (
      !order ||
      !canReadOrder(d, order, now) ||
      !["草稿", "审核退回"].includes(order.status)
    )
      fail("当前订单不可提交。");
    if (
      !order!.name ||
      !order!.requirements ||
      !order!.due ||
      !order!.materials.length
    )
      fail("请补齐订单名称、需求、交付日期及资料。");
    order!.status = "待审核";
    order!.updated = at;
    title = "订单已提交";
  } else if (c.type === "order-stage") {
    if (!admin || !order || order.status !== "处理中")
      fail("仅测试管理员可推进进行中订单。");
    const current = order!.stages.find((x) => x.status === "进行中");
    if (!current) fail("没有可完成的专业阶段。");
    current!.status = "已完成";
    const next = order!.stages.find((x) => x.status === "未开始");
    if (next) next.status = "进行中";
    order!.updated = at;
    title = current!.name + "阶段已完成";
  } else if (c.type === "order-advance") {
    if (!admin || !order || !canReadOrder(d, order, now))
      fail("无测试管理员操作权限。");
    const allowed: Partial<Record<OrderStatus, OrderStatus[]>> = {
      待审核: ["处理中", "审核退回", "已取消"],
      审核退回: ["已取消"],
      处理中: ["已完成", "已取消"],
    };
    if (!allowed[order!.status]?.includes(c.value as OrderStatus))
      fail("不允许跳过业务阶段。");
    if (["审核退回", "已取消"].includes(String(c.value)) && !detail.trim())
      fail("请填写原因。");
    if (
      c.value === "已完成" &&
      (!order!.stages.length ||
        order!.stages.some((x) => x.status !== "已完成") ||
        (order!.confirmationRequired && !order!.confirmedAt))
    )
      fail("请先完成专业阶段及必要的结果确认。");
    order!.status = c.value as OrderStatus;
    order!.reason = detail;
    order!.updated = at;
    if (c.value === "处理中" && !order!.stages.length)
      order!.stages = (order!.plannedStages || ["三维重建"]).map((name, i) => ({
        name,
        status: i === 0 ? "进行中" : "未开始",
      }));
    if (c.value === "处理中" && !order!.projectId) {
      const projectId = "SP-" + order!.id;
      order!.projectId = projectId;
      order!.taskIds = order!.stages.map((stage, i) => {
        const tid = projectId + "-T" + (i + 1);
        stage.taskId = tid;
        return tid;
      });
      (d.projects ||= []).push({
        id: projectId,
        orderId: order!.id,
        caseId: order!.caseId,
        taskIds: order!.taskIds,
        source: "isolated-sales",
      });
    }
    title = c.value === "处理中" ? "订单审核通过并受理" : `订单${c.value}`;
  } else if (c.type === "order-confirm") {
    if (
      !admin ||
      !order ||
      order.status !== "处理中" ||
      order.stages.some((s) => s.status !== "已完成")
    )
      fail("当前不可确认成果。");
    order!.confirmedAt = at;
    title = "结果已确认";
  } else if (c.type === "followup") {
    if (!detail.trim() || (!doctor && !order)) fail("请填写跟进内容。");
    if (order && !canReadOrder(d, order, now)) fail("无订单访问权限。");
    if (doctor?.owner && doctor.owner !== d.ownerId) fail("无医生访问权限。");
    title = "业务跟进";
  } else if (c.type === "request") {
    const v = c.value as Request;
    if (!v.reason.trim()) fail("请填写申请原因。");
    if(!["归属变更","历史访问","建档关联"].includes(v.kind)) fail("申请类型无效。");
    if(v.kind!=="历史访问"&&!d.doctors.some(x=>x.id===v.target&&d.hospitals.some(h=>h.id===x.hospitalId&&h.departments.includes(x.department)))) fail("医生不在授权目录。");
    if (
      v.kind === "历史访问" &&
      !d.orders.some(
        (o) =>
          o.id === v.target &&
          (o.ownerSalesId || d.ownerId) === d.ownerId &&
          d.hospitals.some(
            (h) =>
              h.id === o.hospitalId && h.departments.includes(o.department),
          ),
      )
    )
      fail("订单不存在。");
    if (
      d.requests.some(
        (r) =>
          r.kind === v.kind &&
          r.target === v.target &&
          r.status === "待审核" &&
          r.applicant === d.ownerId,
      )
    )
      fail("该事项已有待审核申请。");
    d.requests.push({
      ...v,
      status: "待审核",
      applicant: d.ownerId,
      oldOwner: d.doctors.find((x) => x.id === v.target)?.owner || undefined,
      newOwner: d.ownerId,
      at,
    });
    target = v.target;
    title = `${v.kind}申请已提交`;
  } else if (c.type === "request-review") {
    const request = d.requests.find((x) => x.id === target);
    if (
      !request ||
      request.status !== "待审核" ||
      !canApprove(
        request.kind === "历史访问"
          ? "order.history.review"
          : "doctor.assignment.review",
      )
    )
      fail("无申请审批权限。");
    if (!["通过", "退回"].includes(String(c.value))) fail("无效审批结果。");
    if (c.value === "退回" && !detail.trim()) fail("请填写退回原因。");
    if (
      request!.reviewer === actor.id ||
      (!admin && request!.applicant === actor.id)
    )
      fail("不能审批本人的申请。");
    request!.status = c.value === "通过" ? "通过" : "退回";
    request!.reviewer = admin ? "管理员（隔离测试）" : actor.id;
    request!.reviewedAt = at;
    request!.reviewReason = detail;
    if (request!.status === "通过") {
      if (request!.kind === "历史访问")
        request!.expires = new Date(now.getTime() + 86400000).toISOString();
      else {
        const doc = d.doctors.find((x) => x.id === request!.target);
        if (!doc || doc.status !== "审核通过") fail("医生资质尚未通过。");
        doc!.owner = request!.newOwner;
      }
    }
    target = request!.target;
    title = `${request!.kind}申请${request!.status}`;
  } else if (c.type === "read") {
    d.events = d.events.map((e) =>
      e.id === target ? { ...e, read: true } : e,
    );
    return d;
  } else fail("未知业务操作。");
  if (doctor && c.type !== "read") doctor.updatedAt = at;
  d.events.unshift({
    id: id(),
    at,
    actor: admin ? "管理员（隔离测试）" : actor.name || actor.id,
    target,
    title,
    detail,
    read: !admin,
  });
  return d;
}
