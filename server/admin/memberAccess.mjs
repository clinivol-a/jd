import {accessRoles,isAdministrator,isBusinessLeader,positionId,NO_POSITION} from '../../src/auth/memberAccess.mjs';
import {coversRegion,anhuiCities} from '../../src/admin/institutionRules.mjs';
import {managementPermissions} from './seed.mjs';
const rolePermissions={leader:['orders:read','orders:review','tasks:assign','assets:read'],administrator:managementPermissions};
const positionPermissions={designer:['projects:own','reconstruction','cad'],sales:['sales:landing'],doctor:[]};
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};

export function managementActor(service,account,action){
 const p=service.state.people.find(p=>p.id===account.id),person={...p,...account,regions:p?.regions??account.regions};
 const roles=accessRoles(account.accessRoles===undefined&&p?{...account,accessRoles:accessRoles(p)}:account);
 const leader=roles.includes('leader')&&(!roles.includes('administrator')||['review-order','assign-task'].includes(action));
 // Preserve explicit legacy management scope; modern roles never expand a caller's supplied scope.
 const legacy=account.accessRoles===undefined&&p?.accessRoles===undefined&&['super_admin','admin','leader'].includes(account.role);
 const role=legacy?account.role:leader?'leader':roles.includes('administrator')?'super_admin':account.role;
 const hospitalIds=account.hospitalIds!==undefined?account.hospitalIds:role==='leader'?[...new Set([...(person.scope||[]),...service.institutions.snapshot().hospitals.filter(h=>coversRegion(person.regions,h.region)).map(h=>h.id)])]:undefined;
 return {...account,role,hospitalIds};
}

export function saveMemberAccess(service,actor,{id,version,accountVersion,positionId:nextPosition,accessRoles:roles,regions,regionConfigurationVersion}){
 service.authorize(actor,'people:manage');
 if(!isAdministrator(actor)||!actor.permissions.includes('permissions:grant'))fail('成员岗位与角色须由具备授权权限的管理员维护。',403);
 const auth=service.authService,p=service.state.people.find(p=>p.id===id),a=auth.accounts.find(a=>a.id===id);
 if(!p&&!a)fail('成员不存在。',404);
 if(p&&p.version!==version||a&&(a.authorizationVersion||1)!==accountVersion)fail('成员资料已更新，请刷新后重试。',409);
 if(a&&a.status!=='approved')fail('请先完成账号注册审核。',409);
 if(p&&p.status!=='已启用')fail('请先启用该成员。',409);
 if(!Array.isArray(roles)||roles.some(r=>!['leader','administrator'].includes(r))||new Set(roles).size!==roles.length)fail('请选择有效角色。');
 const orgId=a?.organizationId||p?.organizationId||(['ADM-L01','ADM-L02','ADM-M01','super-admin','chen-yu','ADM-E02','li-ming'].includes(id)?'demo-clinivol':undefined);
 if(roles.length&&auth.organizationDirectory.find(orgId)?.kind!=='内部组织')fail('管理角色仅可授予已核准的内部成员。',403);
 const selected=nextPosition&&nextPosition!==NO_POSITION?auth.roleDirectory.selected(nextPosition):null;
 if(!selected&&!roles.length)fail('无专业岗位的成员须配置业务组长或管理员角色。');
 if(regions!==undefined&&(!Array.isArray(regions)||regions.some(r=>!anhuiCities.includes(r))||new Set(regions).size!==regions.length))fail('请选择有效且不重复的负责区域。');
 if(regions?.length&&!roles.includes('leader'))fail('负责区域须分配给业务组长。');
 if(regions!==undefined&&regionConfigurationVersion!==(service.state.regionConfigurationVersion||1))fail('区域配置已更新，请刷新后重试。',409);
 if(a&&selected&&!['designer','sales'].includes(selected.id))fail('该岗位工作台尚未接入，不能变更现有登录账号的岗位。',409);
 if(isAdministrator(a||p)&&!roles.includes('administrator')){
  const others=auth.accounts.filter(x=>x.id!==id&&x.status==='approved'&&isAdministrator(x)&&x.permissions.includes('permissions:grant'));
  if(!others.length)fail('不能撤销最后一个有效管理员的角色。',409);
 }
 const beforeState=structuredClone(service.state),beforeAccounts=structuredClone(auth.accounts);
 try{
  let row=p;if(!row){row={id,name:a.name,role:a.role,organizationId:orgId,status:'已启用',permissions:[...a.permissions],scope:[],stages:[],version:1};service.state.people.push(row)}
  const before=structuredClone(row),oldPosition=positionId(a||row),oldRoles=accessRoles(a||row);
  const base=(a||row).positionPermissions||((a||row).permissions||[]).filter(permission=>!oldRoles.some(r=>rolePermissions[r].includes(permission)));
  const positionBase=!selected?[]:selected.id!==oldPosition?[...(positionPermissions[selected.id]||[])]:base;
  const currentPermissions=(a||row).permissions||[];
  const permissions=[...new Set([...positionBase,...roles.flatMap(r=>oldRoles.includes(r)?currentPermissions.filter(permission=>rolePermissions[r].includes(permission)):rolePermissions[r])])];
  row.positionId=selected?.id||null;row.accessRoles=[...roles];row.positionPermissions=[...positionBase];row.permissions=permissions;row.organizationId=orgId;row.version++;
  if(!selected)row.role='member';else row.role=({designer:'工程师',sales:'销售',doctor:'医生'})[selected.id]||selected.id;
  if(a){a.positionId=row.positionId;a.accessRoles=[...roles];a.positionPermissions=[...positionBase];a.permissions=[...permissions];a.authorizationVersion=(a.authorizationVersion||1)+1;if(a.role!=='super_admin')a.role=selected?.id||'member';auth.persist()}
  if(regions!==undefined){const previous=before.regions||[];row.regions=[...regions];if(JSON.stringify(previous)!==JSON.stringify(regions))service.state.regionConfigurationVersion=(service.state.regionConfigurationVersion||1)+1;}
  service.event(actor,'成员岗位、角色与范围已更新','机构与成员',id,before,row,'');service.persist();return {ok:true};
 }catch(e){service.state=beforeState;auth.accounts=beforeAccounts;auth.persist();service.persist();throw e}
}
