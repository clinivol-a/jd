// Read-only administrator projections: do not mutate orders, identities or audit history.
export function orderMatches(order, filters, localDay) {
 const created=localDay(order.createdAt);
 return (!filters.query||(order.businessNo||'').toLowerCase().includes(filters.query.trim().toLowerCase()))
  &&(!filters.status||order.status===filters.status)
  &&(!filters.hospitalId||order.hospitalId===filters.hospitalId)
  &&(!filters.department||order.department===filters.department)
  &&(filters.stage===''||filters.stage===undefined||order.requestedStages.includes(Number(filters.stage)))
  &&(!filters.leaderId||order.leaderId===filters.leaderId)
  &&(!filters.range?.[0]||created!=='-'&&created!=='—'&&created>=filters.range[0])
  &&(!filters.range?.[1]||created!=='-'&&created!=='—'&&created<=filters.range[1]);
}
export function recentOrders(orders, range, localDay) {
 return orders.filter(o=>orderMatches(o,{range},localDay)).slice().sort((a,b)=>(Date.parse(b.updated)||0)-(Date.parse(a.updated)||0)||a.id.localeCompare(b.id)).slice(0,7);
}
export function orderActions(order, account) {
 const actions=[];
 if(account.permissions.includes('people:manage')&&['super_admin','admin'].includes(account.role)&&['待审核','审核退回'].includes(order.status))actions.push(order.leaderId?'change-leader':'assign-leader');
 if(account.role==='leader'&&account.permissions.includes('orders:review')&&order.leaderId===account.id&&order.status==='待审核')actions.push('accept','return');
 return actions;
}
export function historyEvents(events) {
 return [...new Map(events.map(e=>[e.id,e])).values()].sort((a,b)=>(Date.parse(b.at)||0)-(Date.parse(a.at)||0)||a.id.localeCompare(b.id));
}
export function fileFormat(file) {
 const ext=file.name.split('.').pop();
 return ext&&ext!==file.name?ext.toUpperCase():({'application/pdf':'PDF','image/png':'PNG','image/jpeg':'JPG','application/dicom':'DICOM'}[file.type]||'-');
}
export function fileCategory(file) { return file.category==='imaging'||/\.(dcm|dicom|nii|nii.gz|zip)$/i.test(file.name)?'医学影像':'其他附件'; }
export const fileSize=file=>Number.isFinite(file.size)?(file.size/1024).toFixed(1)+' KB':'-';
