import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {AuthService} from '../server/auth/service.mjs';
import {AdminService} from '../server/admin/service.mjs';
import {seedSuperAdmin} from '../server/admin/seedAccount.mjs';
import {managementActor} from '../server/admin/memberAccess.mjs';
import {eligibleHospitalLeaders} from '../src/admin/institutionRules.mjs';
function setup(t){const root=mkdtempSync(join(tmpdir(),'cv-member-layers-')),outbox=[];t.after(()=>rmSync(root,{recursive:true,force:true}));const auth=new AuthService({directory:join(root,'auth'),mode:'local',demoMode:true,riskEnforced:false,smsProvider:async(phone,code,purpose)=>outbox.push({phone,code,purpose})});auth.seedLocal();seedSuperAdmin(auth,{enabled:true});const admin=new AdminService({directory:join(root,'admin'),authService:auth}),actor=auth.accounts.find(a=>a.id==='super-admin');return {auth,admin,actor,outbox,root}}
const draft=(admin,actor,id,patch={})=>{const s=admin.snapshot(actor),p=s.people.find(p=>p.id===id);return {action:'member-access-save',id,version:p.version,accountVersion:p.accountVersion,positionId:p.positionId||'none',accessRoles:p.accessRoles,regions:p.regions||[],regionConfigurationVersion:s.regionConfiguration.version,...patch}};
test('no-professional-position registration remains pending and approved identity has no automatic workbench access',async t=>{
 const {auth,admin,actor,outbox}=setup(t),d=auth.device('new-internal-member'),phone='13800008888';
 assert.deepEqual(auth.applicationRoles().items.map(r=>r.id),['designer','sales','doctor']);assert(auth.applicationRoles().registrationOptions.some(r=>r.id==='none'&&r.name==='无专业岗位'));
 await auth.sendCode(d,{phone,purpose:'register'});const proof=auth.verifyCode(d,{phone,code:outbox.at(-1).code,purpose:'register'}).proof;
 const result=auth.register(d,{proof,name:'内部管理申请人',organizationId:'demo-clinivol',requestedRole:'none',identityMaterials:true,accepted:true,password:'IsolatedMember2026',accessRoles:['leader','administrator'],permissions:['permissions:grant']});
 assert.equal(result.candidate.status,'pending');assert.equal(result.user,null);assert.deepEqual(result.candidate.accessRoles,[]);
 const account=auth.accounts.find(a=>a.phone===phone);assert.throws(()=>auth.require(d));
 admin.command(actor,{action:'review-account',id:'AUTH-'+account.id,version:1,result:'approved',basis:'本地隔离账号开通验证'});
 const approved=auth.continueStatus(d);assert.equal(approved.user.role,'member');assert.equal(approved.user.managementRole,undefined);assert.deepEqual(approved.user.permissions,[]);
 assert.throws(()=>admin.snapshot(account),e=>e.status===403);assert.throws(()=>admin.shared.salesSnapshot(account),e=>e.status===403);assert.throws(()=>admin.shared.designerSnapshot(account),e=>e.status===403);
 admin.command(actor,draft(admin,actor,account.id,{positionId:'none',accessRoles:['leader'],regions:['合肥']}));
 assert.equal(auth.session(d).user.managementRole,'leader');assert.equal(account.role,'member');assert(!account.permissions.includes('cad'));assert(!account.permissions.includes('sales:landing'));
 assert.equal(admin.snapshot(actor).people.find(p=>p.id===account.id).accessRoleName,'业务组长');
 const scoped=managementActor(admin,account);assert.equal(scoped.role,'leader');assert(scoped.hospitalIds.includes(admin.institutions.snapshot().hospitals.find(h=>h.region==='合肥').id));
});
test('no-professional-position cannot register under a hospital or masquerade as a management role',async t=>{
 const {auth,outbox}=setup(t),d=auth.device('invalid-position'),phone='13800008889';await auth.sendCode(d,{phone,purpose:'register'});const proof=auth.verifyCode(d,{phone,code:outbox.at(-1).code,purpose:'register'}).proof;
 const input={proof,name:'内部管理申请人',organizationId:'demo-clinivol',requestedRole:'none',identityMaterials:true,accepted:true,password:'IsolatedMember2026'};
 for(const role of ['leader','administrator','super_admin'])assert.throws(()=>auth.register(d,{...input,requestedRole:role}),/申请岗位/);
 const hospital=auth.organizationDirectory.options().find(o=>o.kind!=='内部组织');assert(hospital);assert.throws(()=>auth.register(d,{...input,organizationId:hospital.id}),/仅适用于内部/);
 assert.equal(auth.register(d,input).candidate.requestedRole,'none');
});
test('member regions persist, constrain future hospital candidates and reject stale global changes',t=>{
 const {admin,auth,actor,root}=setup(t),orders=structuredClone(admin.state.orders),hospitals=structuredClone(admin.institutions.snapshot().hospitals);
 assert.equal(admin.snapshot(actor).people.find(p=>p.id==='ADM-L01').role,'无专业岗位');assert.equal(admin.snapshot(actor).people.find(p=>p.id==='ADM-L02').role,'无专业岗位');
 const command=draft(admin,actor,'ADM-L01',{positionId:'none',regions:['合肥','芜湖']});admin.command(actor,command);
 assert.equal(admin.state.people.find(p=>p.id==='ADM-L01').positionId,null);assert.equal(admin.snapshot(actor).people.find(p=>p.id==='ADM-L01').role,'无专业岗位');assert(eligibleHospitalLeaders(admin.institutions.snapshot().people,{region:'芜湖'}).some(p=>p.id==='ADM-L01'));
 assert.deepEqual(admin.state.orders,orders);assert.deepEqual(admin.institutions.snapshot().hospitals,hospitals);
 const reloaded=new AdminService({directory:join(root,'admin'),authService:auth});assert(reloaded.snapshot(actor).regionConfiguration.assignments.find(a=>a.region==='芜湖').leaderIds.includes('ADM-L01'));
 const before=structuredClone(admin.state);assert.throws(()=>admin.command(actor,{...command,version:admin.state.people.find(p=>p.id==='ADM-L01').version,regions:['合肥']}),e=>e.status===409);assert.deepEqual(admin.state,before);
 assert.throws(()=>admin.command(actor,draft(admin,actor,'ADM-L01',{regions:['其他地区']})),/有效/);
 assert.throws(()=>admin.command(actor,draft(admin,actor,'ADM-L01',{accessRoles:[],regions:[],positionId:'none'})),/须配置/);
});
test('explicitly removing a professional position keeps identity and tasks, but never leaves professional edit permissions',t=>{
 const {admin,auth,actor}=setup(t),account=auth.accounts.find(a=>a.id==='chen-yu'),tasks=structuredClone(admin.state.tasks),hash=account.passwordHash;
 admin.command(actor,draft(admin,actor,account.id,{positionId:'none',accessRoles:['leader'],regions:['合肥']}));
 assert.equal(account.role,'member');assert.equal(account.positionId,null);assert.equal(account.passwordHash,hash);assert(!account.permissions.includes('reconstruction'));assert(!account.permissions.includes('cad'));assert.deepEqual(admin.state.tasks,tasks);
 const a=auth.publicAccount(account);assert.equal(a.managementRole,'leader');assert.equal(a.id,'chen-yu');
});
test('real HTTP session gains only the saved management role and regional scope, never a sales or designer workspace',async t=>{
 const {auth,admin,root,actor}=setup(t),{createAuthServer}=await import('../server/auth/http.mjs'),{adminHandler}=await import('../server/admin/http.mjs'),{once}=await import('node:events'),{readFileSync}=await import('node:fs');
 const account={id:'qa-no-position-http',name:'内部管理成员',phone:'13800008887',requestedRole:'none',role:'member',positionId:null,accessRoles:[],organizationId:'demo-clinivol',status:'approved',permissions:[]};auth.setPassword(account,'IsolatedMember2026');auth.accounts.push(account);auth.persist();
 const origin='http://localhost:5350',server=createAuthServer(auth,{origin,adminHandler:adminHandler(auth,admin,{origin})});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());const base=`http://127.0.0.1:${server.address().port}`,cookies={admin:'',member:''};
 const request=async(who,path,body)=>{const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Cookie:cookies[who],Origin:origin,'X-CliniVol-Request':'1','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const cookie=r.headers.get('set-cookie');if(cookie)cookies[who]=cookie.split(';')[0];return {status:r.status,body:await r.json()}};
 const credentials=JSON.parse(readFileSync(join(root,'auth/admin-credentials.json'),'utf8'));
 assert.equal((await request('admin','/api/auth/login/password',{...credentials,accepted:true})).status,200);
 assert.equal((await request('member','/api/auth/login/password',{phone:account.phone,password:'IsolatedMember2026',accepted:true})).body.user.managementRole,undefined);
 for(const path of ['/api/admin/state','/api/admin/business/sales','/api/admin/business/designer'])assert.equal((await request('member',path)).status,403);
 const c=draft(admin,actor,account.id,{positionId:'none',accessRoles:['leader'],regions:['合肥']});assert.equal((await request('admin','/api/admin/command',c)).status,200);
 const user=(await request('member','/api/auth/session')).body.user;assert.equal(user.role,'member');assert.equal(user.managementRole,'leader');
 const view=await request('member','/api/admin/state');assert.equal(view.status,200);assert(view.body.hospitals.length);assert(view.body.hospitals.every(h=>h.region==='合肥'));
 for(const path of ['/api/admin/business/sales','/api/admin/business/designer'])assert.equal((await request('member',path)).status,403);
 assert.equal((await request('admin','/api/admin/command',c)).status,409);
});
