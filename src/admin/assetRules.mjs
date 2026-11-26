export const assetKey=a=>JSON.stringify([a.id,a.version]);
export const assetStages=['三维重建','CAD设计','有限元分析','3D打印'];
const timestamp=value=>{const n=Date.parse(value);return Number.isFinite(n)?n:null};
export const assetUpdatedAt=a=>[a.updatedAt,a.reviewedAt,a.submittedAt].filter(v=>timestamp(v)!==null).sort((a,b)=>timestamp(b)-timestamp(a))[0]||null;
export const assetProgressText=row=>`${row.passed} / ${row.stages.length} 阶段已通过`;
export const requestedStages=order=>[...new Set(order.requestedStages||[])].filter(s=>Number.isInteger(s)&&s>=0&&s<4).sort((a,b)=>a-b);
export function isFormalAsset(asset,data){
 const t=data.tasks.find(t=>t.id===asset.taskId&&t.orderId===asset.orderId&&t.projectId===asset.projectId&&t.stage===asset.stage);
 return asset.locked===true&&asset.reviewStatus==='审核通过'&&Number.isFinite(Date.parse(asset.lockedAt))&&t?.approvedModel?.id===asset.id&&t.approvedModel.version===asset.version;
}
export function resultAssets(data,filters={}){
 const q=String(filters.orderNo||'').trim().toLowerCase();
 return data.assets.filter(a=>{const o=data.orders.find(o=>o.id===a.orderId);return o&&(!q||String(o.businessNo||'').toLowerCase().includes(q))&&(!filters.hospitalId||o.hospitalId===filters.hospitalId)&&(!filters.stage||String(a.stage)===filters.stage)&&(!filters.reviewStatus||a.reviewStatus===filters.reviewStatus)}).sort((a,b)=>(timestamp(assetUpdatedAt(b))??-Infinity)-(timestamp(assetUpdatedAt(a))??-Infinity)||assetKey(a).localeCompare(assetKey(b)));
}
export function orderAssetRows(data,filters={}){
 const q=String(filters.orderNo||'').trim().toLowerCase();
 return data.orders.filter(o=>o.status!=='草稿'&&(!q||String(o.businessNo||'').toLowerCase().includes(q))&&(!filters.hospitalId||o.hospitalId===filters.hospitalId)&&(!filters.stage||requestedStages(o).includes(Number(filters.stage)))).map(order=>{
  const stages=requestedStages(order),assets=data.assets.filter(a=>a.orderId===order.id),passed=stages.filter(s=>assets.some(a=>a.stage===s&&isFormalAsset(a,data))).length;
  const updatedAt=assets.map(assetUpdatedAt).filter(Boolean).sort((a,b)=>timestamp(b)-timestamp(a))[0]||null;
  return {id:order.id,order,stages,passed,updatedAt,assetCount:assets.length};
 }).filter(r=>!filters.completion||filters.completion==='none'&&r.passed===0||filters.completion==='partial'&&r.passed>0&&r.passed<r.stages.length||filters.completion==='complete'&&r.stages.length>0&&r.passed===r.stages.length).sort((a,b)=>(timestamp(b.updatedAt)??-Infinity)-(timestamp(a.updatedAt)??-Infinity)||a.id.localeCompare(b.id));
}
export function assetExportSelection(data,{view='orders',filters={}}={}){
 if(view==='results'){const assets=resultAssets(data,filters),ids=new Set(assets.map(a=>a.orderId));return {orders:orderAssetRows(data).filter(r=>ids.has(r.id)),assets}}
 const orders=orderAssetRows(data,filters),ids=new Set(orders.map(r=>r.id));return {orders,assets:resultAssets(data).filter(a=>ids.has(a.orderId))};
}
