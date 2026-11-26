import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {AuthService} from '../server/auth/service.mjs';
import {AdminService} from '../server/admin/service.mjs';
import {managementPermissions} from '../server/admin/seed.mjs';
import {hospitalFixtures,migrateAnhuiDemo} from '../server/unified/anhuiDemoDirectory.mjs';
import {memberMatches,roleMatches} from '../src/admin/institutionRules.mjs';
const actor={id:'super-admin',name:'管理员',role:'super_admin',status:'approved',permissions:managementPermissions};
function setup(t){const root=mkdtempSync(join(tmpdir(),'cv-anhui-members-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const auth=new AuthService({directory:join(root,'auth'),mode:'local',demoMode:true});auth.seedLocal();const admin=new AdminService({directory:join(root,'admin'),authService:auth});return {root,auth,admin}}
test('hospital fixtures have sourced names and complete telephone numbers',()=>{
 assert.equal(Object.keys(hospitalFixtures).length,7);
 for(const h of Object.values(hospitalFixtures)){assert.match(h.contact,/^0\d{2,3}-\d{7,8}$/);assert(h.contactSource.startsWith('https://'));assert(!h.name.includes('数字医学中心'));}
});
test('directory migration preserves stable IDs, relationships, audit events and later user edits',t=>{
 const {auth,admin}=setup(t),state=admin.institutions.state;
 const before=structuredClone(state);const business=structuredClone(admin.shared.state);
 for(const h of state.hospitals){const spec=hospitalFixtures[h.id];if(spec){assert.equal(h.name,spec.name);assert.equal(h.contact,spec.contact)}}
 const doctorIds=state.doctors.map(d=>[d.id,d.hospitalId,d.salesId]);
 state.hospitals.push({id:'CUSTOM-USER-HOSPITAL',name:'用户维护医院',region:'合肥',contact:'0551-12345678',version:2});
 const hospital=state.hospitals.find(h=>h.id==='H-A');hospital.name='已人工维护的名称';hospital.contact='0551-87654321';
 migrateAnhuiDemo(auth,admin.state,admin.institutions);
 assert.equal(hospital.name,'已人工维护的名称');assert.equal(hospital.contact,'0551-87654321');
 assert.equal(state.hospitals.at(-1).name,'用户维护医院');
 assert.deepEqual(state.doctors.map(d=>[d.id,d.hospitalId,d.salesId]),doctorIds);
 assert.deepEqual(state.events,before.events);assert.deepEqual(admin.shared.state,business);
 assert.equal(state.catalogMigrations.filter(m=>m.id==='anhui-hospitals-20261126').length,1);
});
test('production authentication mode does not migrate hospital catalog',t=>{
 const {admin}=setup(t),h=admin.institutions.state.hospitals.find(h=>h.id==='H-A');h.name=hospitalFixtures['H-A'].old;h.contact='保留原资料';
 migrateAnhuiDemo({mode:'production',demoMode:true},admin.state,admin.institutions);
 assert.equal(h.name,hospitalFixtures['H-A'].old);assert.equal(h.contact,'保留原资料');
});
test('member organizations resolve stable directory IDs; all seeded organizations are company or Anhui hospitals',t=>{
 const {auth,admin}=setup(t),snapshot=admin.snapshot(actor);
 assert(snapshot.organizations.length>=15);
 assert(snapshot.organizations.every(o=>o.name==='科立沃'||o.name.includes('医院')));
 for(const p of snapshot.people){assert.equal(p.organization,auth.organizationDirectory.find(p.organizationId)?.name||'-');assert(!/数字工程中心|设计中心|平台管理中心|销售中心/.test(p.organization));}
 const member=snapshot.people.find(p=>p.id==='chen-yu');assert.equal(member.organization,'科立沃');
});
test('member and role filters combine exact role, organization ID and status with visible name search',()=>{
 const member={name:'陈屿',role:'工程师',organizationId:'hospital:stable',status:'已启用'};
 assert(memberMatches(member,{name:' 陈 ',role:'工程师',organizationId:'hospital:stable',status:'已启用'}));
 assert(!memberMatches(member,{organizationId:'same-name-different-id'}));assert(!memberMatches(member,{role:'销售'}));assert(!memberMatches(member,{status:'已停用'}));
 assert(roleMatches({name:'三维重建设计师',status:'已启用'},{name:'重建',status:'已启用'}));assert(!roleMatches({name:'销售',status:'已停用'},{status:'已启用'}));
});
test('master hospital names and contacts are shared by admin and sales projections without new business records',t=>{
 const {admin}=setup(t),a=admin.snapshot(actor),sales={id:'li-ming',name:'李明',role:'sales',status:'approved',permissions:['sales:landing']},s=admin.institutions.salesSnapshot(sales);
 for(const h of s.hospitals){const shared=a.hospitals.find(x=>x.id===h.id);assert(shared);assert.equal(shared.name,h.name);assert.equal(shared.contact,h.contact)}
});
