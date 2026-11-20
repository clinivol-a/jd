import {orderNumber} from './orderNumber.mjs';
const time = value => Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
const month = value => {const d=new Date(value);return Number.isFinite(d.getTime())?`${d.getFullYear()}-${d.getMonth()}`:'';};
/** Input orders must already be filtered through visibleOrders. No state transitions here. */
export function dashboardOrderBuckets(orders, now=new Date(), events=[]) {
 return {pending:orders.filter(o=>['草稿','待审核','审核退回'].includes(o.status)),processing:orders.filter(o=>o.status==='处理中'),new:orders.filter(o=>month(o.created)===month(now)),completed:orders.filter(o=>o.status==='已完成'&&month(o.completedAt||events.filter(e=>e.target===o.id&&e.title==='订单已完成').sort((a,b)=>time(b.at)-time(a.at))[0]?.at)===month(now))};
}
export function salesBusiness(data,orders) {
 const permittedDoctors=data.doctors.filter(d=>((d.status==='草稿'&&!d.hospitalId)||data.hospitals.some(h=>h.id===d.hospitalId&&h.departments.includes(d.department)))&&(d.owner===data.ownerId||(!d.owner&&(d.createdBy===data.ownerId||d.invitedBy===data.ownerId))));
 const items=[];
 for(const [kind,rows] of [['doctor',permittedDoctors],['order',orders]])for(const row of rows){
  if(!['审核退回','草稿'].includes(row.status))continue;
  const required=row.status==='审核退回',at=[row.updatedAt,row.updated,...data.events.filter(e=>e.target===row.id).sort((a,b)=>time(b.at)-time(a.at)).map(e=>e.at)].find(v=>time(v)>0)||'';
  items.push({id:`${kind}:${row.id}`,target:row.id,category:required?'需要处理':'待继续完成',type:kind==='doctor'?'医生档案':'订单',orderNumber:kind==='order'?orderNumber(row):'-',hospital:data.hospitals.find(h=>h.id===row.hospitalId)?.name||'-',hospitalId:row.hospitalId||'',name:row.name,object:row.name,status:row.status,kind,at,route:`${kind==='doctor'?'doctor-new':'order-new'}/${row.id}`});
 }
 const rank={'需要处理':0,'待继续完成':1};items.sort((a,b)=>rank[a.category]-rank[b.category]||time(b.at)-time(a.at)||a.id.localeCompare(b.id));
 const formal=permittedDoctors.filter(d=>d.status==='审核通过'&&d.owner===data.ownerId);
 const hospitals=data.hospitals.map(h=>({...h,departmentCount:h.departments.length,doctorCount:formal.filter(d=>d.hospitalId===h.id).length,processingCount:orders.filter(o=>o.hospitalId===h.id&&o.status==='处理中').length}));
 return {items,hospitals,hospitalCount:hospitals.length,departmentCount:hospitals.reduce((n,h)=>n+h.departmentCount,0),doctorCount:formal.length,requiredCount:items.filter(i=>i.category==='需要处理').length};
}

// Detail tabs use authorized orders only; homepage retains doctor and order todos.
export function orderTodoItems(orders, category) {
  const status = {'需要处理':'审核退回','待继续完成':'草稿'}[category];
  return status ? orders.filter(order => order.status === status)
    .sort((a,b) => time(b.updated)-time(a.updated) || a.id.localeCompare(b.id)) : [];
}
