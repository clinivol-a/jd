import test from 'node:test';
import assert from 'node:assert/strict';
import {presentAdminState} from '../server/admin/presentation.mjs';
import {AdminService} from '../server/admin/service.mjs';
import {managementPermissions} from '../server/admin/seed.mjs';
import {AuthService} from '../server/auth/service.mjs';
const manager={id:'super-admin',name:'周景明',role:'super_admin',status:'approved',permissions:managementPermissions};
const state=()=>({people:[{id:'leader',name:'赵启明',role:'业务组长'},{id:'employee',name:'陈屿',role:'工程师'}],events:[],doctorHistory:[],approvals:[],organizationRequests:[]});
test('administrator label follows operation role; employees retain names and raw identities remain intact',()=>{
 const s=state();s.events=[
  {id:'a',actorId:manager.id,actor:manager.name,title:'医生档案审核通过',source:'isolated-admin'},
  {id:'b',actorId:'leader',actor:'赵启明',actorRole:'leader',title:'专业任务已分配',source:'isolated-shared'},
  {id:'c',actorId:'employee',actor:'陈屿',role:'designer',title:'成果已提交审核',source:'isolated-shared'},
  {id:'d',actor:'超级管理员',title:'医生档案审核通过',source:'isolated-admin'},
  {id:'e',actorId:manager.id,actor:'周景明',actorRole:'leader',title:'专业任务已分配',source:'isolated-shared'}
 ];const original=structuredClone(s),p=presentAdminState(s,{currentActor:manager});
 assert.deepEqual(p.events.map(e=>e.actor),['管理员','赵启明','陈屿','管理员','周景明']);assert(p.events.every(e=>e.category));assert.deepEqual(s,original);
 assert.equal(p.events[0].actorId,manager.id);assert.equal(p.events[0].recordedActor,manager.name);
});
test('known isolated QA copy is projected without altering real opinions or original audit values',()=>{
 const s=state(),reason='本地停用场景验收，保留全部历史业务关联。';
 s.doctorHistory=[{id:'a',actorId:manager.id,actor:manager.name,reason,basis:'LOCAL-DOCTOR-20261125',source:'isolated-admin'},
  {id:'b',actor:'实际审核人',reason,source:'production'},
  {id:'c',actor:'实际审核人',reason:'请补充清晰的执业证明材料。',source:'isolated-admin'}];
 const original=structuredClone(s),p=presentAdminState(s,{currentActor:manager});
 assert.equal(p.doctorHistory[0].reason,'业务资格复核期间暂停使用。');assert.equal(p.doctorHistory[0].recordedReason,reason);
 assert.equal(p.doctorHistory[0].basis,'');assert.equal(p.doctorHistory[0].recordedBasis,'LOCAL-DOCTOR-20261125');
 assert.equal(p.doctorHistory[1].reason,reason);assert.equal(p.doctorHistory[1].actor,'实际审核人');
 assert.equal(p.doctorHistory[2].reason,'请补充清晰的执业证明材料。');assert.deepEqual(s,original);
});
test('all admin snapshot timelines share one label while persisted review facts remain unchanged',()=>{
 const service=new AdminService({authService:new AuthService({mode:'local',demoMode:true})}),d=service.state.doctors.find(d=>d.id==='ADM-D01');
 service.command(manager,{action:'review-doctor',id:d.id,version:d.version,result:'approved',basis:'LOCAL-DOCTOR-20261125'});
 const raw=service.state.events.at(-1);assert.equal(raw.actor,'周景明');assert.equal(raw.actorRole,'super_admin');
 const before=structuredClone(service.state),view=service.snapshot(manager);
 assert.equal(view.events.find(e=>e.id===raw.id).actor,'管理员');assert.equal(view.doctorHistory.find(e=>e.id===raw.id).actor,'管理员');
 assert.equal(service.audit(manager).find(e=>e.id===raw.id).actor,'周景明');assert.deepEqual(service.state,before);
 assert.deepEqual(service.snapshot(manager).doctorHistory,view.doctorHistory);
});
