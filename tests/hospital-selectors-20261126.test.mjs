import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {AuthService} from '../server/auth/service.mjs';
import {AdminService} from '../server/admin/service.mjs';
import {managementPermissions} from '../server/admin/seed.mjs';
import {anhuiCities,coversRegion,eligibleHospitalLeaders,eligibleHospitalSales} from '../src/admin/institutionRules.mjs';
const permissions=['orders:read','orders:review','tasks:assign'];
const leader={id:'qualified',name:'负责组长',role:'业务组长',status:'已启用',permissions,scope:[],regions:['安徽']};
test('hospital leaders require a chosen area, regional mandate and real enabled permissions',()=>{
 const people=[leader,{...leader,id:'disabled',status:'已停用'},{...leader,id:'missing',permissions:['orders:review','tasks:assign']},{...leader,id:'other',regions:['上海']}];
 assert.deepEqual(eligibleHospitalLeaders(people),[]);
 for(const region of anhuiCities)assert.deepEqual(eligibleHospitalLeaders(people,{region}).map(p=>p.id),['qualified']);
 assert(coversRegion(['合肥市'],'合肥'));assert(coversRegion(['合肥'],'合肥市'));assert(!coversRegion(['安徽'],''));
});
test('hospital-specific and incumbent mandate is retained only with valid permissions',()=>{
 const scoped={...leader,id:'scoped',regions:[],scope:['H-1']},current={...leader,id:'current',regions:[]};
 assert.deepEqual(eligibleHospitalLeaders([scoped,current],{id:'H-1',region:'合肥',leaderId:'current'}).map(p=>p.id),['scoped','current']);
 assert.deepEqual(eligibleHospitalLeaders([scoped,current],{id:'H-2',region:'合肥'}),[]);
 assert.deepEqual(eligibleHospitalLeaders([{...current,permissions:[]}],{id:'H-1',leaderId:'current'}),[]);
});
test('enabled sales without an existing hospital assignment remain eligible; disabled or non-sales do not',()=>{
 const fresh={id:'new-sales',role:'销售',status:'已启用'};
 assert.deepEqual(eligibleHospitalSales([fresh,{...fresh,id:'off',status:'已停用'},leader]),[fresh]);
});
test('displayed hospital choices agree with service validation, including a newly approved sales account',t=>{
 const root=mkdtempSync(join(tmpdir(),'cv-hospital-selectors-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const auth=new AuthService({directory:join(root,'auth'),mode:'local',demoMode:true});auth.seedLocal();
 const admin=new AdminService({directory:join(root,'admin'),authService:auth});
 const actor={id:'super-admin',name:'管理员',role:'super_admin',status:'approved',permissions:managementPermissions};
 auth.accounts.push({id:'new-approved-sales',name:'新销售',role:'sales',status:'approved',phone:'19900008888',permissions:['sales:landing']});
 const snapshot=admin.snapshot(actor),sales=eligibleHospitalSales(snapshot.people.filter(p=>snapshot.hospitalSalesIds.includes(p.id)));assert(sales.some(p=>p.id==='new-approved-sales'));
 assert(!Object.hasOwn(snapshot.salesAssignments,'new-approved-sales'));
 const candidate=eligibleHospitalLeaders(snapshot.people,{region:'合肥'})[0];assert(candidate);
 const saved=admin.institutions.command(actor,{action:'hospital-save',name:'区域授权验证医院',region:'合肥',contact:'0551-12345678',leaderId:candidate.id,salesIds:['new-approved-sales']});
 assert.equal(saved.leaderId,candidate.id);assert(admin.institutions.salesSnapshot(auth.accounts.at(-1)).hospitals.some(h=>h.id===saved.id));
 const before=admin.institutions.snapshot().hospitals.length;
 assert.throws(()=>admin.institutions.command(actor,{action:'hospital-save',name:'不应创建',region:'上海',leaderId:candidate.id,salesIds:[]}),/管理资格/);
 assert.equal(admin.institutions.snapshot().hospitals.length,before);
});

test('confirmed two-leader regions cannot be bypassed by old hospital ownership and survive reload without overwriting later edits',t=>{
 const root=mkdtempSync(join(tmpdir(),'cv-leader-regions-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const auth=new AuthService({directory:join(root,'auth'),mode:'local',demoMode:true});auth.seedLocal();
 let admin=new AdminService({directory:join(root,'admin'),authService:auth});
 let people=admin.institutions.snapshot().people;
 for(const region of anhuiCities)assert.deepEqual(eligibleHospitalLeaders(people,{region}).map(p=>p.id),[region==='合肥'?'ADM-L01':'ADM-L02']);
 assert(!admin.institutions.validLeader('ADM-L01','ADM-H03','蚌埠'));
 assert(!admin.institutions.validLeader('ADM-L02','ADM-H02','合肥'));
 for(const h of admin.institutions.snapshot().hospitals)assert.equal(h.leaderId,h.region==='合肥'?'ADM-L01':'ADM-L02');
 const ledger=admin.state.catalogMigrations.find(m=>m.id==='leader-regions-20261126');assert(ledger.changes.some(c=>c.kind==='person'&&c.before&&c.after));
 const ids=admin.shared.state.orders.map(o=>[o.id,o.leaderId,o.projectId]);
 admin.state.people.find(p=>p.id==='ADM-L01').permissions=['orders:review','tasks:assign'];admin.persist();
 admin=new AdminService({directory:join(root,'admin'),authService:auth});people=admin.institutions.snapshot().people;
 assert.deepEqual(eligibleHospitalLeaders(people,{region:'合肥'}),[],'subsequent permission revocation must remain effective');
 assert.equal(admin.state.catalogMigrations.filter(m=>m.id==='leader-regions-20261126').length,1);
 assert.deepEqual(admin.shared.state.orders.map(o=>[o.id,o.leaderId,o.projectId]),ids);
});
