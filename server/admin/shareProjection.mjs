import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {BusinessService} from '../business/service.mjs';
/** Same encrypted store used by sales; read-only and never enabled implicitly in production. */
export function localShareProvider(auth){
 return ()=>{
  if(process.env.NODE_ENV==='production'||!auth||auth.mode!=='local'||!auth.demoMode)return null;
  const dir=new URL('../../.local/business-v31/',import.meta.url),file=new URL('records.enc',dir);
  if(!existsSync(file))return null;
  try{const service=new BusinessService({key:readFileSync(new URL('key',dir))});const state=service.unseal(readFileSync(file,'utf8'));return {shares:state.shares,shareEvents:state.shareEvents,orders:state.orders}}catch{const e=Error('成果分享记录读取失败，请刷新重试。');e.status=503;throw e}
 };
}
export function projectAdminShares(source,state){
 const orders=new Map(state.orders.map(o=>[o.id,o])),assets=new Map(state.assets.map(a=>[JSON.stringify([a.id,a.version]),a]));
 return Object.values(source?.shares||{}).flatMap(share=>{
  const order=orders.get(share.orderId),asset=assets.get(JSON.stringify([share.resultId,share.resultVersion])),storedOrder=source.orders?.[share.orderId];
  if(!order||!asset||asset.orderId!==order.id||asset.version!==share.resultVersion||share.owner!==(order.ownerSalesId||order.salesId)||storedOrder?.owner!==share.owner)return [];
  const id=share.id||'legacy-'+createHash('sha256').update(share.token).digest('hex').slice(0,32);
  const eventMap=new Map();for(const e of source.shareEvents||[])if(e.shareId===id&&e.orderId===order.id&&e.resultId===asset.id&&e.resultVersion===asset.version&&!eventMap.has(e.id))eventMap.set(e.id,e);const events=[...eventMap.values()];
  const successes=events.filter(e=>e.type==='viewed'),visits=events.filter(e=>['viewed','verification-failed','access-denied'].includes(e.type)).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)||a.id.localeCompare(b.id)).map(e=>{
   const known=!!e.visitorId&&['医生','患者'].includes(e.visitorRole)&&!!e.visitorName&&!/模拟|测试|演示|访客|未确认|\*|^\d+$/.test(e.visitorName);
   return {id:e.id,name:known?e.visitorName:'未确认身份',role:known?e.visitorRole:'未确认',at:e.at,outcome:e.type==='viewed'?'查看成功':'未通过验证'};
  });
  return [{id,orderId:order.id,resultId:asset.id,stage:asset.stage,resultVersion:asset.version,name:asset.name,initiatorName:share.initiatorName||state.people.find(p=>p.id===share.owner)?.name||'',createdAt:share.createdAt,status:share.revoked?'已撤销':'有效',successCount:successes.length,lastViewedAt:successes.map(e=>e.at).filter(at=>Number.isFinite(Date.parse(at))).sort((a,b)=>Date.parse(b)-Date.parse(a))[0],visits}];
 }).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||a.id.localeCompare(b.id));
}
