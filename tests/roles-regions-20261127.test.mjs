import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {AuthService} from '../server/auth/service.mjs';
import {RoleDirectory} from '../server/auth/roleDirectory.mjs';
import {AdminService} from '../server/admin/service.mjs';
import {managementPermissions} from '../server/admin/seed.mjs';
import {anhuiCities,eligibleHospitalLeaders} from '../src/admin/institutionRules.mjs';
const actor={id:'super-admin',name:'管理员',role:'super_admin',status:'approved',permissions:managementPermissions};
function setup(t){const root=mkdtempSync(join(tmpdir(),'cv-roles-regions-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const auth=new AuthService({directory:join(root,'auth'),mode:'local',demoMode:true});auth.seedLocal();const admin=new AdminService({directory:join(root,'admin'),authService:auth});return {root,auth,admin}}
function command(admin){const snapshot=admin.snapshot(actor);return {action:'leader-regions-save',version:snapshot.regionConfiguration.version,leaderVersions:Object.fromEntries(snapshot.people.filter(p=>p.role==='业务组长').map(p=>[p.id,p.version])),assignments:structuredClone(snapshot.regionConfiguration.assignments)}}
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
