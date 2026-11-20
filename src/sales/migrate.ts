import {professionalDesignRequirements} from './orderFixtures.mjs';
import {designDemand} from './clinicalContent.mjs';
import { completeDoctorFixtures, ensureDoctorCreationEvents } from "./doctorFixtures.mjs";
import {migrateDoctorSources} from "./doctorRecordRules.mjs";
import type { SalesData } from "./model";
/** Versioned synthetic fixture migration; never clears user actions or replays transitions. */
export function migrateSales(input: SalesData): SalesData {
  const data = structuredClone(input) as SalesData & {
    fixtureRevision?: number;
  };
  for(const order of data.orders){
    const oldDesign=['导板边缘平滑过渡，固定孔位避让神经管。','保留必要的解剖细节，区分参考结构。'];
    if(order.demoScenario && !order.clinicalContent && order.requirements==='评估缺损范围与邻近结构，提供数字模型供修复方案讨论。' && order.clinicalRequirements==='评估缺损范围与邻近结构，明确修复区域及需要避让的结构，供医生制定方案。' && oldDesign.includes(order.designRequirements||'') && professionalDesignRequirements[order.name]) order.designRequirements=professionalDesignRequirements[order.name];
    order.designRequirementConflicts=designDemand(order).conflicts;
  }
  // Only this isolated sales demo store: fill absent test contacts, never overwrite entered numbers.
  const usedPhones=new Set(data.doctors.map(d=>d.phone).filter(Boolean));
  for(const doctor of data.doctors){
    if(doctor.phone)continue;
    let hash=0;for(const char of doctor.id)hash=(hash*31+char.charCodeAt(0))%100000000;
    let phone=/^D-[1-6]$/.test(doctor.id)&&doctor.certificate===`DEMO-QUAL-${doctor.id.slice(2)}` ? "1990000100"+doctor.id.slice(2) : "199"+String(hash).padStart(8,"0");
    while(usedPhones.has(phone)){hash=(hash+1)%100000000;phone="199"+String(hash).padStart(8,"0");}
    doctor.phone=phone;usedPhones.add(phone);
  }
  migrateDoctorSources(data);
  if (data.fixtureRevision === 12) return data;
  if (data.fixtureRevision === 10 || data.fixtureRevision === 11) {ensureDoctorCreationEvents(data);data.fixtureRevision=12;return data;}
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
  data.doctors.forEach((d)=>{
    const index = Number(d.id.replace("D-","")) - 1;
    if (!d.phone && index>=0 && index<names.length && d.name===names[index] && d.certificate===`DEMO-QUAL-${index+1}`) d.phone="1990000100"+(index+1);
  });
  for (const clinicalCase of data.cases) {
    const doctor = data.doctors.find((d) => d.id === clinicalCase.doctorId);
    clinicalCase.hospitalId ||= doctor?.hospitalId;
    clinicalCase.department ||= doctor?.department;
    if (/^CASE-S-\d+$/.test(clinicalCase.id) && !clinicalCase.patientName)
      clinicalCase.patientName = ["沈嘉宁", "顾清禾"][Number(clinicalCase.id.split("-").at(-1))-1];
    if (/^CASE-S-[12]$/.test(clinicalCase.id) && /^演示患者[12]$/.test(clinicalCase.patientName || "")) clinicalCase.patientName = ["沈嘉宁", "顾清禾"][Number(clinicalCase.id.split("-").at(-1))-1];
    clinicalCase.patientRef ||= "PAT-" + clinicalCase.id;
  }
  for (const order of data.orders) {
    order.requestedDueDate ??= order.due; // Preserve the sales/doctor agreed date.
    if (["处理中", "已完成"].includes(order.status)) order.confirmedDeliveryDate = order.requestedDueDate || order.due || order.confirmedDeliveryDate;
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
    const events = data.events.filter(e=>e.target===order.id);
    const created = events.filter(e=>e.title==="订单已创建" && Number.isFinite(Date.parse(e.at))).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))[0];
    if (!Number.isFinite(Date.parse(order.created)) && created) order.created=created.at;
    const latest = events.filter(e=>Number.isFinite(Date.parse(e.at))).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))[0];
    if (latest && (!Number.isFinite(Date.parse(order.updated)) || Date.parse(order.updated)<Date.parse(latest.at))) order.updated=latest.at;

  }
  // Remove only the isolated scheduling action introduced by the superseded V2.4 test flow.
  data.events = data.events.filter(e => !(e.title === "预计交付时间已确认" && e.actor === "管理员（隔离测试）"));
  completeDoctorFixtures(data);
  migrateDoctorSources(data);
  data.events.sort(
    (a, b) =>
      new Date(b.at).getTime() - new Date(a.at).getTime() ||
      a.id.localeCompare(b.id),
  );
  ensureDoctorCreationEvents(data);
  data.fixtureRevision = 12;
  return data;
}
