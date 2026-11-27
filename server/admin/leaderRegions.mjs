import {isBusinessLeader} from '../../src/auth/memberAccess.mjs';
import {anhuiCities} from '../../src/admin/institutionRules.mjs';

export function regionConfiguration(state) {
 return {version:state.regionConfigurationVersion||1,assignments:anhuiCities.map(region=>({region,leaderIds:state.people.filter(p=>isBusinessLeader(p)&&p.regions?.includes(region)).map(p=>p.id)}))};
}

export function saveLeaderRegions(service,actor,{version,assignments,leaderVersions}) {
 service.authorize(actor,'people:manage');
 const fail=(message,status=400)=>{const e=new Error(message);e.status=status;throw e};
 if(actor.role!=='super_admin')fail('区域组长配置须由管理员维护。',403);
 if(version!==(service.state.regionConfigurationVersion||1))fail('区域组长配置已更新，请刷新后重试。',409);
 const leaders=service.state.people.filter(p=>isBusinessLeader(p));
 if(!leaderVersions||leaders.some(p=>leaderVersions[p.id]!==p.version))fail('组长资料已更新，请刷新后重试。',409);
 if(!Array.isArray(assignments)||assignments.length!==anhuiCities.length||new Set(assignments.map(a=>a.region)).size!==anhuiCities.length||assignments.some(a=>!anhuiCities.includes(a.region)||!Array.isArray(a.leaderIds)||new Set(a.leaderIds).size!==a.leaderIds.length))fail('请提供完整且不重复的区域组长配置。');
 for(const a of assignments)for(const id of a.leaderIds){
  const p=leaders.find(p=>p.id===id),unchanged=p?.regions?.includes(a.region);
  if(!p||!unchanged&&(p.status!=='已启用'||!['orders:read','orders:review','tasks:assign'].every(v=>p.permissions.includes(v))))fail('请选择已启用且具备订单审核与任务分配资格的组长。');
 }
 const before=structuredClone(service.state);
 try{
  for(const p of leaders){const regions=assignments.filter(a=>a.leaderIds.includes(p.id)).map(a=>a.region);if(JSON.stringify(regions)===JSON.stringify(p.regions||[]))continue;const old=structuredClone(p);p.regions=regions;p.version++;service.event(actor,'组长负责区域已更新','机构与成员',p.id,old,p,'');}
  service.state.regionConfigurationVersion=(service.state.regionConfigurationVersion||1)+1;
  service.persist();return regionConfiguration(service.state);
 }catch(e){service.state=before;throw e}
}
