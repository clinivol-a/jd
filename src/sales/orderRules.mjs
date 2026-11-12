// Shared by the browser command model and the authenticated local validation route.
export const designStages = ["三维重建", "CAD设计", "有限元分析", "3D打印"];
export const localDate = (value = new Date()) => {
  const d = new Date(value);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};
export const isImaging = (file) =>
  file.category === "imaging" ||
  /\.(dcm|dicom|nii|nii\.gz|zip)$/i.test(file.name);
export function orderErrors(order, patientName, now = new Date()) {
  const errors = {};
  for (const [field, label] of [
    ["hospitalId", "医院"],
    ["department", "科室"],
    ["doctorId", "需求医生"],
    ["caseId", "病例"],
    ["name", "手术项目名称"],
    ["clinicalRequirements", "临床需求"],
    ["service", "业务服务项目"],
  ]) {
    const value =
      order[field] ||
      (field === "clinicalRequirements" ? order.requirements : "");
    if (!String(value || "").trim()) errors[field] = "请填写" + label;
  }
  if (!String(patientName || "").trim())
    errors.patientName = "病例尚未记录患者姓名，请补充病例资料。";
  if (!Number.isInteger(order.quantity) || order.quantity < 1)
    errors.quantity = "请输入正整数。";
  const due = order.requestedDueDate ?? order.due ?? "";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(due) ||
    !Number.isFinite(Date.parse(due)) ||
    new Date(due).toISOString().slice(0, 10) !== due ||
    due <= localDate(now)
  )
    errors.due = "请选择晚于今天的有效期望完成日期。";
  const chosen = order.plannedStages || [];
  if (
    !chosen.length ||
    chosen.some((s) => !designStages.includes(s)) ||
    new Set(chosen).size !== chosen.length
  )
    errors.plannedStages = "请选择1至4个有效设计阶段。";
  else if (!chosen.includes("三维重建"))
    errors.plannedStages =
      "当前尚无已审核的可复用上游成果，请补选三维重建，或由管理员确认上游成果后再提交。";
  if (
    !(order.materials || []).some(
      (f) => isImaging(f) && f.status === "success" && f.storage,
    )
  )
    errors.materials = "请上传已保存的医学影像资料。";
  return errors;
}

/** Approval accepts the agreed deadline; execution does not introduce another scheduling step. */
export function confirmedDelivery(order) {
  if (["草稿", "待审核", "审核退回"].includes(order.status)) return "";
  const date = ["处理中", "已完成"].includes(order.status)
    ? (order.requestedDueDate || order.due || order.confirmedDeliveryDate)
    : order.confirmedDeliveryDate;
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0,10) === date ? date : "";
}
