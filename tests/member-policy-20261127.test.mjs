import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {AuthService} from '../server/auth/service.mjs';
import {AdminService} from '../server/admin/service.mjs';
import {seedSuperAdmin} from '../server/admin/seedAccount.mjs';
import {managementActor} from '../server/admin/memberAccess.mjs';
import {memberRole,rolePermissions,memberPolicyIssues,managementPermissionIds as all,leaderPermissionIds} from '../src/admin/memberPolicy.mjs';
function setup(t){const root=mkdtempSync(join(tmpdir(),'cv-single-role-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const auth=new AuthService({directory:join(root,'auth'),mode:'local',demoMode:true,riskEnforced:false});auth.seedLocal();seedSuperAdmin(auth,{enabled:true});const admin=new AdminService({directory:join(root,'admin'),authService:auth}),actor=auth.accounts.find(a=>a.id==='super-admin');return {auth,admin,actor,root}}
function draft(admin,actor,id,patch={}){const s=admin.snapshot(actor),p=s.people.find(p=>p.id===id),role=memberRole(p);return {action:'member-access-save',id,version:p.version,accountVersion:p.accountVersion,positionId:p.positionId||'none',accessRoles:role==='employee'?[]:[role],regions:role==='leader'?p.regions||[]:[],managementPermissions:rolePermissions(role,p.permissions),regionConfigurationVersion:s.regionConfiguration.version,...patch}}
test('one shared catalog gives all three roles the same eleven management rows, without professional rights',()=>{
 assert.equal(all.length,11);assert.equal(new Set(all).size,11);assert.deepEqual(rolePermissions('employee',['cad','orders:read']),[]);assert.deepEqual(rolePermissions('administrator'),all);
 assert(rolePermissions('leader',[]).includes('orders:read'));assert(rolePermissions('leader',['shares:manage']).includes('assets:read'));assert(rolePermissions('leader',['people:manage','cad']).every(p=>leaderPermissionIds.includes(p)));
 const legacy={role:'管理员',permissions:['orders:read']},before=structuredClone(legacy);assert(memberPolicyIssues(legacy).length);assert.deepEqual(legacy,before);
 assert(memberPolicyIssues({accessRoles:['leader','administrator'],permissions:all,regions:['合肥']}).length);
});
test('server rejects conflicting roles, employee grants, out-of-bounds leader rights and incomplete administrator rights',t=>{
 const {admin,actor}=setup(t),base=draft(admin,actor,'chen-yu'),before=structuredClone(admin.state);
 for(const patch of [
  {accessRoles:['leader','administrator'],regions:['合肥'],managementPermissions:all},
  {accessRoles:[],managementPermissions:['orders:read']},
  {accessRoles:['leader'],regions:[],managementPermissions:['orders:read']},
  {accessRoles:['leader'],regions:['合肥'],managementPermissions:['orders:read','people:manage']},
  {accessRoles:['leader'],regions:['合肥'],managementPermissions:['tasks:assign']},
  {accessRoles:['leader'],regions:['合肥'],managementPermissions:['orders:read','shares:manage']},
  {accessRoles:['administrator'],managementPermissions:['orders:read']},
  {accessRoles:['administrator'],managementPermissions:[...all,'professional:review']},
 ])assert.throws(()=>admin.command(actor,{...base,...patch}));
 assert.deepEqual(admin.state,before);
});
test('saved leader scope is authoritative, durable and narrowed regions never retain legacy hospital access',t=>{
 const {admin,actor,auth,root}=setup(t),id='ADM-L01',original=admin.snapshot(actor).people.find(p=>p.id===id),orders=structuredClone(admin.state.orders),tasks=structuredClone(admin.state.tasks),hospitals=structuredClone(admin.institutions.snapshot().hospitals);
 admin.command(actor,draft(admin,actor,id,{regions:['芜湖'],managementPermissions:['orders:read','orders:review','tasks:assign']}));
 const p=admin.state.people.find(p=>p.id===id),a={...p,status:'approved'};assert.equal(p.rolePolicyVersion,1);assert(original.scope.length>0);
 const scoped=managementActor(admin,a),expected=admin.institutions.snapshot().hospitals.filter(h=>h.region==='芜湖').map(h=>h.id);assert.deepEqual(scoped.hospitalIds,expected);assert(admin.snapshot(a).hospitals.every(h=>h.region==='芜湖'));
 assert.deepEqual(admin.state.orders,orders);assert.deepEqual(admin.state.tasks,tasks);assert.deepEqual(admin.institutions.snapshot().hospitals,hospitals);
 const reloaded=new AdminService({directory:join(root,'admin'),authService:auth});assert.deepEqual(reloaded.state.people.find(p=>p.id===id).regions,['芜湖']);assert.equal(reloaded.state.people.find(p=>p.id===id).rolePolicyVersion,1);
 assert.throws(()=>admin.command(actor,{...draft(admin,actor,id),managementPermissions:undefined}),/完整/);
});
test('role transitions preserve account identity, professional capability and all unrelated business data',t=>{
 const {admin,actor,auth}=setup(t),account=auth.accounts.find(a=>a.id==='chen-yu'),before=structuredClone(account),tasks=structuredClone(admin.state.tasks);
 admin.command(actor,draft(admin,actor,account.id,{accessRoles:['administrator'],managementPermissions:all}));
 assert.equal(memberRole(account),'administrator');assert(all.every(p=>account.permissions.includes(p)));assert(before.permissions.every(p=>account.permissions.includes(p)));assert(!account.permissions.includes('professional:review'));
 admin.command(actor,draft(admin,actor,account.id,{accessRoles:['leader'],regions:['合肥'],managementPermissions:['orders:read','assets:read','shares:manage']}));
 assert.equal(memberRole(account),'leader');assert(!account.permissions.includes('permissions:grant'));assert(account.permissions.includes('cad'));
 const c=draft(admin,actor,account.id,{accessRoles:[],regions:[],managementPermissions:[]});admin.command(actor,c);
 assert.equal(memberRole(account),'employee');assert.deepEqual(account.permissions,before.permissions);assert.equal(account.phone,before.phone);assert.equal(account.passwordHash,before.passwordHash);assert.deepEqual(admin.state.tasks,tasks);assert.throws(()=>admin.command(actor,c),e=>e.status===409);
 assert(admin.state.events.some(e=>e.objectId===account.id&&e.before&&e.after&&e.actorId===actor.id));
});
test('legacy partial administrator is never expanded by reading, and normalization respects the pending application',t=>{
 const {admin,actor}=setup(t),id='ADM-M01',before=structuredClone(admin.state.people.find(p=>p.id===id));admin.snapshot(actor);assert.deepEqual(admin.state.people.find(p=>p.id===id),before);
 assert.throws(()=>admin.command(actor,draft(admin,actor,id)),/核对/);
 assert.throws(()=>admin.command(actor,draft(admin,actor,id,{confirmRoleNormalization:true})),/待审核的权限申请/);
 const pending=admin.state.approvals.find(a=>a.subjectId===id&&a.type==='权限变更'&&a.status==='待审批');assert(pending);
 admin.command(actor,{action:'approve-permission',id:pending.id,version:pending.version,result:'returned',reason:'由成员配置统一核定管理职责。'});
 admin.command(actor,draft(admin,actor,id,{confirmRoleNormalization:true}));assert.deepEqual(admin.state.people.find(p=>p.id===id).permissions,all);assert.equal(admin.state.approvals.find(a=>a.id===pending.id).status,'审批退回');
});
test('legacy permission endpoints cannot bypass a normalized role configuration',t=>{
 const {admin,actor}=setup(t),id='ADM-L01';admin.command(actor,draft(admin,actor,id));const p=admin.state.people.find(p=>p.id===id),before=structuredClone(p);
 for(const action of ['request-permission','revoke-permission'])assert.throws(()=>admin.command(actor,{action,id,version:p.version,permission:action==='request-permission'?'people:manage':'orders:read',basis:'授权核对',reason:'职责调整'}),e=>e.status===403);
 const row={id:'qa-legacy-permission',type:'权限变更',subjectId:id,status:'待审批',version:1,permissions:['people:manage'],hospitalIds:[]};admin.state.approvals.push(row);
 assert.throws(()=>admin.command(actor,{action:'approve-permission',id:row.id,version:1,result:'approved',basis:'授权核对'}),e=>e.status===403);assert.deepEqual(admin.state.people.find(p=>p.id===id),before);
});
test('normalized leaders cannot lose all regions through the legacy regional endpoint',t=>{
 const {admin,actor}=setup(t);admin.command(actor,draft(admin,actor,'ADM-L01'));
 const snapshot=admin.snapshot(actor),assignments=structuredClone(snapshot.regionConfiguration.assignments);
 for(const a of assignments)a.leaderIds=a.leaderIds.filter(id=>id!=='ADM-L01');
 const before=structuredClone(admin.state);
 assert.throws(()=>admin.command(actor,{action:'leader-regions-save',version:snapshot.regionConfiguration.version,leaderVersions:Object.fromEntries(snapshot.people.filter(p=>p.accessRoles.includes('leader')).map(p=>[p.id,p.version])),assignments}),/至少一个/);
 assert.deepEqual(admin.state,before);
});
test('HTTP persisted member configuration changes actual sessions and enforces role and scope, with stale saves rejected',async t=>{
 const {auth,admin,actor,root}=setup(t),{createAuthServer}=await import('../server/auth/http.mjs'),{adminHandler}=await import('../server/admin/http.mjs'),{once}=await import('node:events');
 const account={id:'qa-single-role-http',name:'内部业务成员',phone:'13800008886',requestedRole:'none',role:'member',positionId:null,accessRoles:[],organizationId:'demo-clinivol',status:'approved',permissions:[]};auth.setPassword(account,'IsolatedMember2026');auth.accounts.push(account);auth.persist();
 const origin='http://localhost:5350',server=createAuthServer(auth,{origin,adminHandler:adminHandler(auth,admin,{origin})});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());const base=`http://127.0.0.1:${server.address().port}`,cookies={admin:'',member:''};
 async function request(who,path,body){const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Cookie:cookies[who],Origin:origin,'X-CliniVol-Request':'1','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const cookie=r.headers.get('set-cookie');if(cookie)cookies[who]=cookie.split(';')[0];return {status:r.status,body:await r.json()}}
 const credentials=JSON.parse(readFileSync(join(root,'auth/admin-credentials.json'),'utf8'));assert.equal((await request('admin','/api/auth/login/password',{...credentials,accepted:true})).status,200);
 assert.equal((await request('member','/api/auth/login/password',{phone:account.phone,password:'IsolatedMember2026',accepted:true})).status,200);assert.equal((await request('member','/api/admin/state')).status,403);
 const c=draft(admin,actor,account.id,{accessRoles:['leader'],regions:['合肥'],managementPermissions:['orders:read','orders:review','tasks:assign']});assert.equal((await request('admin','/api/admin/command',c)).status,200);
 const user=(await request('member','/api/auth/session')).body.user;assert.equal(user.managementRole,'leader');assert.equal(user.role,'member');assert(!user.permissions.includes('cad'));assert(!user.permissions.includes('sales:landing'));
 const snapshot=await request('member','/api/admin/state');assert.equal(snapshot.status,200);assert(snapshot.body.hospitals.length>0);assert(snapshot.body.hospitals.every(h=>h.region==='合肥'));assert.equal((await request('member','/api/admin/command',c)).status,403);assert.equal((await request('admin','/api/admin/command',c)).status,409);
 for(const path of ['/api/admin/business/sales','/api/admin/business/designer'])assert.equal((await request('member',path)).status,403);
 const reloaded=new AuthService({directory:join(root,'auth'),mode:'local',demoMode:true});assert.equal(reloaded.accounts.find(a=>a.id===account.id).rolePolicyVersion,1);
});
