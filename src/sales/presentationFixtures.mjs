import {orderFixtures} from './orderFixtures.mjs';
/** Versioned additive fixtures for the isolated sales prototype, never a production importer. */
export function ensurePresentationOrders(input,now=new Date()) {
 if(input.presentationRevision===28)return input;
 const d=structuredClone(input);
 const doctors=d.doctors.filter(doc=>doc.owner===d.ownerId&&doc.status==='审核通过'&&d.hospitals.some(h=>h.id===doc.hospitalId&&h.departments.includes(doc.department)));
 if(!doctors.length)return d;
 for(let batch=0;batch<3;batch++){
  const chosen=doctors.slice(0,2);
  const cases=chosen.map((doc,i)=>{
   const existing=d.cases.find(c=>c.doctorId===doc.id&&c.hospitalId===doc.hospitalId&&c.department===doc.department);
   if(existing)return existing;
   const c={id:`CASE-V28-${doc.id}`,doctorId:doc.id,hospitalId:doc.hospitalId,department:doc.department,patientName:['沈嘉宁','顾清禾'][i],patientRef:`PAT-V28-${doc.id}`,clinicalType:'骨性结构修复',summary:'评估骨性结构缺损范围及邻近重要组织。'};
   d.cases.push(c);return c;
  });
  const date=new Date(now.getTime()-[2,25,50][batch]*86400000);
  const fixtures=orderFixtures(d.ownerId,chosen,cases,date,`SO-V28-${batch+1}`,true);
  for(const order of fixtures.orders){
   if(d.orders.some(o=>o.id===order.id))continue;
   order.requestedDueDate=order.due;
   if(['处理中','已完成'].includes(order.status)){
    order.confirmedDeliveryDate=new Date(date.getTime()+21*86400000).toISOString().slice(0,10);
    order.deliveryConfirmedAt=order.reviewedAt;order.deliveryConfirmedBy='管理员';
   }
   d.orders.push(order);d.events.push(...fixtures.events.filter(e=>e.target===order.id&&!d.events.some(old=>old.id===e.id)));
   (d.projects||=[]).push(...fixtures.projects.filter(p=>p.orderId===order.id&&!d.projects.some(old=>old.id===p.id)));
  }
 }
 d.presentationRevision=28;return d;
}
