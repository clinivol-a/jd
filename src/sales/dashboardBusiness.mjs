const time = value => Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
const month = value => {const d=new Date(value);return Number.isFinite(d.getTime())?`${d.getFullYear()}-${d.getMonth()}`:'';};
/** Input orders must already be filtered through visibleOrders. No state transitions here. */
export function dashboardOrderBuckets(orders, now=new Date(), events=[]) {
 return {pending:orders.filter(o=>['草稿','待审核','审核退回'].includes(o.status)),processing:orders.filter(o=>o.status==='处理中'),new:orders.filter(o=>month(o.created)===month(now)),completed:orders.filter(o=>o.status==='已完成'&&month(o.completedAt||events.filter(e=>e.target===o.id&&e.title==='订单已完成').sort((a,b)=>time(b.at)-time(a.at))[0]?.at)===month(now))};
}
export function salesBusiness(data,orders) {
 const permittedDoctors=data.doctors.filter(d=>data.hospitals.some(h=>h.id===d.hospitalId&&h.departments.includes(d.department))&&(d.owner===data.ownerId||(!d.owner&&(d.createdBy===data.ownerId||d.invitedBy===data.ownerId))));
 const items=[];
 for(const [kind,rows] of [['doctor',permittedDoctors],['order',orders]])for(const row of rows){
  if(!['审核退回','草稿'].includes(row.status))continue;
  const required=row.status==='审核退回',at=row.updatedAt||row.updated||data.events.filter(e=>e.target===row.id).sort((a,b)=>time(b.at)-time(a.at))[0]?.at||'';
  items.push({id:`${kind}:${row.id}`,target:row.id,category:required?'需要处理':'待继续完成',type:kind==='doctor'?(required?'医生资质补件':'医生档案草稿'):(required?'订单审核退回':'订单草稿'),name:row.name+(required?(kind==='doctor'?'资质资料待补充':'需修改后重新提交'):(kind==='doctor'?'档案待继续填写':'待继续填写')),object:row.name,status:row.status,kind,at,route:`${kind==='doctor'?'doctor-new':'order-new'}/${row.id}`});
 }
 const doctors=new Set(permittedDoctors.map(d=>d.id)),allowedOrders=new Set(orders.map(o=>o.id));
 for(const e of data.events){
  if(!doctors.has(e.target)&&!allowedOrders.has(e.target))continue;
  if(!/审核通过|进入.*设计|任务已开始|阶段已完成|任务已完成|订单已完成/.test(e.title)||/待客户确认|待确认/.test(e.title))continue;
  const row=permittedDoctors.find(d=>d.id===e.target)||orders.find(o=>o.id===e.target);
  items.push({id:`event:${e.id}`,target:e.target,category:'业务动态',type:doctors.has(e.target)?'医生动态':'订单动态',name:e.title,object:row.name,status:row.status,kind:doctors.has(e.target)?'doctor':'order',at:e.at,route:`${doctors.has(e.target)?'doctor':'order'}/${e.target}`});
 }
 const rank={'需要处理':0,'待继续完成':1,'业务动态':2};items.sort((a,b)=>rank[a.category]-rank[b.category]||time(b.at)-time(a.at)||a.id.localeCompare(b.id));
 const formal=permittedDoctors.filter(d=>d.status==='审核通过'&&d.owner===data.ownerId);
 const hospitals=data.hospitals.map(h=>({...h,departmentCount:h.departments.length,doctorCount:formal.filter(d=>d.hospitalId===h.id).length,processingCount:orders.filter(o=>o.hospitalId===h.id&&o.status==='处理中').length}));
 return {items,hospitals,hospitalCount:hospitals.length,departmentCount:hospitals.reduce((n,h)=>n+h.departmentCount,0),doctorCount:formal.length,requiredCount:items.filter(i=>i.category==='需要处理').length};
}
