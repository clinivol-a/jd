import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {AuthService} from '../server/auth/service.mjs';
import {RoleDirectory} from '../server/auth/roleDirectory.mjs';
import {AdminService} from '../server/admin/service.mjs';
import {managementActor} from '../server/admin/memberAccess.mjs';
import {seedSuperAdmin} from '../server/admin/seedAccount.mjs';
import {isBusinessLeader} from '../src/auth/memberAccess.mjs';
import {managementPermissions} from '../server/admin/seed.mjs';
import {anhuiCities,eligibleHospitalLeaders} from '../src/admin/institutionRules.mjs';
const actor={id:'super-admin',name:'管理员',role:'super_admin',status:'approved',permissions:managementPermissions};
function setup(t){const root=mkdtempSync(join(tmpdir(),'cv-roles-regions-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const auth=new AuthService({directory:join(root,'auth'),mode:'local',demoMode:true});auth.seedLocal();const admin=new AdminService({directory:join(root,'admin'),authService:auth});return {root,auth,admin}}
function command(admin){const snapshot=admin.snapshot(actor);return {action:'leader-regions-save',version:snapshot.regionConfiguration.version,leaderVersions:Object.fromEntries(snapshot.people.filter(p=>isBusinessLeader(p)).map(p=>[p.id,p.version])),assignments:structuredClone(snapshot.regionConfiguration.assignments)}}
test('old engineering labels consolidate with traceable IDs and no account permission changes',t=>{
 const {root,auth}=setup(t),file=join(root,'auth/application-roles.json'),account=structuredClone(auth.accounts[0]);
 writeFileSync(file,JSON.stringify({items:[{id:'designer',name:'三维重建设计师',status:'已启用',version:2},{id:'ROLE-old-medical',name:'医学工程师',status:'已启用',version:1},{id:'sales',name:'销售',status:'已启用',version:1},{id:'doctor',name:'医生',status:'已启用',version:1}],events:[{id:'original-event'}]}));
 const roles=new RoleDirectory({directory:join(root,'auth')});assert.deepEqual(roles.options().map(r=>r.name),['工程设计师','销售','医生']);assert.equal(roles.find('ROLE-old-medical').id,'designer');assert.equal(roles.selected('ROLE-old-medical').name,'工程设计师');
 const stored=JSON.parse(readFileSync(file));assert.equal(stored.retiredItems[0].id,'ROLE-old-medical');assert.deepEqual(stored.events,[{id:'original-event'}]);assert.deepEqual(auth.accounts[0],account);
 assert.equal(new RoleDirectory({directory:join(root,'auth')}).all().migrationHistory.length,1);
});
test('member and registration role names use the configured catalog while stable permission keys remain',t=>{
 const {admin,auth}=setup(t),before=structuredClone(auth.accounts[0]);
 assert.equal(auth.applicationRoles().items.find(r=>r.id==='designer').name,'工程设计师');assert.equal(auth.publicAccount(auth.accounts[0]).roleName,'工程设计师');
 const member=admin.snapshot(actor).people.find(p=>p.id==='chen-yu');assert.equal(member.role,'工程设计师');assert.equal(member.roleKey,'工程师');assert.deepEqual(auth.accounts[0],before);
 const r=auth.roleDirectory.find('designer');admin.command(actor,{action:'role-save',...r,name:'工程设计岗位'});assert.equal(auth.publicAccount(auth.accounts[0]).roleName,'工程设计岗位');assert.equal(admin.snapshot(actor).people.find(p=>p.id==='chen-yu').role,'工程设计岗位');
});
test('regional mappings are editable, durable and constrain both browser options and direct hospital saves',t=>{
 const {admin,auth,root}=setup(t);const before=structuredClone(admin.state),hospitals=admin.institutions.snapshot().hospitals;
 const c=command(admin);assert.deepEqual(c.assignments.find(a=>a.region==='合肥').leaderIds,['ADM-L01']);assert.deepEqual(c.assignments.find(a=>a.region==='蚌埠').leaderIds,['ADM-L02']);
 c.assignments.find(a=>a.region==='蚌埠').leaderIds=['ADM-L01'];admin.command(actor,c);
 const people=admin.institutions.snapshot().people;assert.deepEqual(eligibleHospitalLeaders(people,{region:'蚌埠'}).map(p=>p.id),['ADM-L01']);
 assert.throws(()=>admin.command(actor,{action:'hospital-save',name:'区域配置核验医院',region:'蚌埠',contact:'0552-12345678',leaderId:'ADM-L02',salesIds:[]}),/区域/);
 const h=admin.command(actor,{action:'hospital-save',name:'区域配置核验医院',region:'蚌埠',contact:'0552-12345678',leaderId:'ADM-L01',salesIds:[]});assert.equal(h.leaderId,'ADM-L01');
 const reloaded=new AdminService({directory:join(root,'admin'),authService:auth});assert.deepEqual(reloaded.snapshot(actor).regionConfiguration.assignments.find(a=>a.region==='蚌埠').leaderIds,['ADM-L01']);
 assert.deepEqual(admin.state.orders,before.orders);assert.deepEqual(admin.institutions.snapshot().hospitals.filter(x=>x.id!==h.id),hospitals);
 assert.deepEqual(admin.state.people.map(p=>p.permissions),before.people.map(p=>p.permissions));assert(admin.state.events.some(e=>e.title==='组长负责区域已更新'&&e.actorId===actor.id));
 assert.throws(()=>admin.command(actor,c),e=>e.status===409);
});
test('clearing regions removes eligibility; invalid, unauthorized and stale changes cannot alter configuration',t=>{
 const {admin}=setup(t),c=command(admin),before=structuredClone(admin.state);
 assert.equal(c.assignments.length,anhuiCities.length);
 assert.throws(()=>admin.command({...actor,role:'sales'},c),e=>e.status===403);
 assert.throws(()=>admin.command({...actor,permissions:['orders:read']},c),e=>e.status===403);
 assert.throws(()=>admin.command(actor,{...c,assignments:c.assignments.slice(1)}),e=>e.status===400);
 const invalid=structuredClone(c);invalid.assignments[0].leaderIds=['chen-yu'];assert.throws(()=>admin.command(actor,invalid),e=>e.status===400);assert.deepEqual(admin.state,before);
 for(const a of c.assignments)a.leaderIds=a.leaderIds.filter(id=>id!=='ADM-L01');admin.command(actor,c);
 assert.equal(eligibleHospitalLeaders(admin.institutions.snapshot().people,{id:'H-A',region:'合肥',leaderId:'ADM-L01'}).length,0);
 assert.throws(()=>admin.command(actor,{action:'hospital-save',name:'无区域核验医院',region:'合肥',leaderId:'ADM-L01',salesIds:[]}),/区域/);
});
test('an engineer can receive and lose a management role without losing the same account or professional permissions',t=>{
 const {admin,auth,root}=setup(t),engineer=auth.accounts.find(a=>a.id==='chen-yu'),old=structuredClone(engineer),p=admin.snapshot(actor).people.find(p=>p.id===engineer.id);
 const c={action:'member-access-save',id:p.id,version:p.version,accountVersion:p.accountVersion,positionId:'designer',accessRoles:['leader']};
 assert.throws(()=>admin.command(engineer,c),e=>e.status===403);admin.command(actor,c);
 assert.equal(engineer.id,old.id);assert.equal(engineer.phone,old.phone);assert.equal(engineer.passwordHash,old.passwordHash);assert.equal(engineer.role,'designer');assert.deepEqual(engineer.accessRoles,['leader']);assert(old.permissions.every(permission=>engineer.permissions.includes(permission)));
 let s=admin.snapshot(actor),member=s.people.find(p=>p.id===engineer.id);assert.equal(member.role,'工程设计师');assert.equal(member.accessRoleName,'业务组长');assert.equal(auth.publicAccount(engineer).managementRole,'leader');
 const regions=command(admin);regions.assignments.find(a=>a.region==='芜湖').leaderIds=[engineer.id];admin.command(actor,regions);
 const managed=managementActor(admin,engineer);assert.equal(managed.role,'leader');
 const hospital=admin.command(actor,{action:'hospital-save',name:'专业组长配置核验医院',region:'芜湖',leaderId:engineer.id,salesIds:[]});assert(managementActor(admin,engineer).hospitalIds.includes(hospital.id));
 member=admin.snapshot(actor).people.find(p=>p.id===engineer.id);admin.command(actor,{...c,version:member.version,accountVersion:member.accountVersion,accessRoles:[]});
 assert.deepEqual(engineer.permissions,old.permissions);assert.equal(auth.publicAccount(engineer).managementRole,undefined);assert.equal(admin.snapshot(actor).people.find(p=>p.id===engineer.id).accessRoleName,'普通员工');assert.equal(eligibleHospitalLeaders(admin.institutions.snapshot().people,{region:'芜湖'}).some(p=>p.id===engineer.id),false);
 const reloaded=new AuthService({directory:join(root,'auth'),mode:'local',demoMode:true});assert.deepEqual(reloaded.accounts.find(a=>a.id===engineer.id).accessRoles,[]);
});
test('administrator role cannot be self-applied, cannot be granted by sales and the last administrator is protected',t=>{
 const {admin,auth}=setup(t);seedSuperAdmin(auth,{enabled:true,password:'LocalExample2026'});const administrator=auth.accounts.find(a=>a.id==='super-admin');
 const p=admin.snapshot(administrator).people.find(p=>p.id==='super-admin');assert.equal(p.role,'-');assert.equal(p.accessRoleName,'管理员');
 assert.throws(()=>admin.command(administrator,{action:'member-access-save',id:p.id,version:p.version,accountVersion:p.accountVersion,positionId:'sales',accessRoles:[]}),/最后一个/);
 assert.deepEqual(auth.applicationRoles().items.map(r=>r.id),['designer','sales','doctor']);
 const engineer=admin.snapshot(administrator).people.find(p=>p.id==='chen-yu');admin.command(administrator,{action:'member-access-save',id:engineer.id,version:engineer.version,accountVersion:engineer.accountVersion,positionId:'designer',accessRoles:['administrator']});
 const a=auth.accounts.find(a=>a.id===engineer.id);assert.equal(a.role,'designer');assert.equal(auth.publicAccount(a).managementRole,'super_admin');assert(admin.snapshot(a).people.length>0);
 assert.throws(()=>admin.command({...administrator,permissions:['orders:read','people:manage']},{action:'member-access-save',id:engineer.id,version:engineer.version,accountVersion:engineer.accountVersion,positionId:'sales',accessRoles:['administrator']}),e=>e.status===403);
});

test('saving an unchanged legacy management role never broadens its existing granular permissions',t=>{
 const {admin}=setup(t),p=admin.snapshot(actor).people.find(p=>p.id==='ADM-M01'),before=[...p.permissions];
 admin.command(actor,{action:'member-access-save',id:p.id,version:p.version,positionId:null,accessRoles:['administrator']});
 assert.deepEqual(admin.state.people.find(row=>row.id===p.id).permissions,before);
});
