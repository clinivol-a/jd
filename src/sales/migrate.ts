import type { SalesData } from "./model";
/** Versioned synthetic fixture migration; never clears user actions or replays transitions. */
export function migrateSales(input: SalesData): SalesData {
  const data = structuredClone(input) as SalesData & {
    fixtureRevision?: number;
  };
  if (data.fixtureRevision === 4) return data;
  const names = ["林致远", "周明哲", "许文博", "方景行", "陆承安", "徐嘉宁"];
  const legacy = ["林医生", "周医生", "许医生", "方医生", "陆医生", "徐医生"];
  data.hospitals.forEach((h) => {
    h.name = h.name.replace(/（虚构）$/, "");
  });
  data.doctors.forEach((d) => {
    const i = legacy.indexOf(d.name);
    if (i >= 0 && d.id === "D-" + (i + 1)) d.name = names[i];
  });
  data.projects ||= [];
  for (const doctor of data.doctors) {
    if (!doctor.createdBy && (!doctor.owner || doctor.owner === data.ownerId))
      doctor.createdBy = data.ownerId;
    doctor.updatedAt ||= data.events.find((e) => e.target === doctor.id)?.at;
  }
  for (const clinicalCase of data.cases) {
    const doctor = data.doctors.find((d) => d.id === clinicalCase.doctorId);
    clinicalCase.hospitalId ||= doctor?.hospitalId;
    clinicalCase.department ||= doctor?.department;
    if (/^CASE-S-\d+$/.test(clinicalCase.id) && !clinicalCase.patientName)
      clinicalCase.patientName = "演示患者" + clinicalCase.id.split("-").at(-1);
  }
  for (const order of data.orders) {
    order.clinicalRequirements ??= order.requirements;
    order.designRequirements ??= "";
    if (
      /^SO-\d{4}-\d{4}$/.test(order.id) &&
      order.clinicalRequirements === "按临床需求说明整理设计资料。"
    )
      order.clinicalRequirements =
        "评估目标部位的骨性结构和缺损范围，提供数字模型用于医生制定修复方案。";
    const previous = String(order.status);
    if (previous === "待受理") order.status = "待审核";
    if (previous === "待补资料") order.status = "审核退回";
    if (previous === "待客户确认") {
      order.status = "处理中";
      order.confirmationRequired = true;
    }
    order.ownerSalesId ||= data.ownerId;
    order.plannedStages ||= order.stages.length
      ? order.stages.map((s) => s.name)
      : [
          "三维重建",
          ...(["手术导板设计", "支具设计", "矫形具设计"].includes(order.service)
            ? ["CAD设计"]
            : order.service === "模型打印"
              ? ["3D打印"]
              : []),
        ];
    if (order.stages.length && !order.projectId) {
      order.projectId = "SP-" + order.id;
      order.taskIds = order.stages.map((stage, i) => {
        stage.taskId ||= order.projectId + "-T" + (i + 1);
        return stage.taskId;
      });
      if (!data.projects.some((p) => p.id === order.projectId))
        data.projects.push({
          id: order.projectId,
          orderId: order.id,
          caseId: order.caseId,
          taskIds: order.taskIds,
          source: "isolated-sales",
        });
    }

    if (
      !/^SO-\d{4}-\d{4}$/.test(order.id) ||
      data.events.some((e) => e.target === order.id)
    )
      continue;
    data.events.push({
      id: "sales-fixture-created:" + order.id,
      at: order.created,
      actor: "业务资料导入",
      target: order.id,
      title: "订单已创建",
      detail: order.name,
      read: true,
    });
    if (order.status !== "草稿")
      data.events.push({
        id: "sales-fixture-state:" + order.id,
        at: order.updated,
        actor: "业务资料导入",
        target: order.id,
        title: "订单" + order.status,
        detail: order.name,
        read: false,
      });
  }
  data.events.sort(
    (a, b) =>
      new Date(b.at).getTime() - new Date(a.at).getTime() ||
      a.id.localeCompare(b.id),
  );
  data.fixtureRevision = 4;
  return data;
}
