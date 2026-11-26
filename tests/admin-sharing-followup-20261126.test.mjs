import test from 'node:test';
import assert from 'node:assert/strict';
import {BusinessService} from '../server/business/service.mjs';
import {projectAdminShares,localShareProvider} from '../server/admin/shareProjection.mjs';
import {linkedShareOrder} from '../server/business/linkedShares.mjs';
import {readFileSync} from 'node:fs';
const user={id:'sales-1',name:'李明',role:'sales',status:'approved',demoBusiness:true};
const catalog={source:'isolated-shared',catalogMode:'linked-only',hospitals:[{id:'h1',name:'安徽省立医院'}],doctors:[{id:'doctor-1',name:'周明哲'}],orders:[{id:'o1',ownerSalesId:user.id,businessNo:'CV-2026-0001',projectId:'p1',hospitalId:'h1',doctorId:'doctor-1',status:'已完成',name:'颌骨修复规划',demoScenario:'linked-business-20261123-v1'}],projects:[{id:'p1',orderId:'o1',taskIds:['t1','t2']}],tasks:[{id:'t1',projectId:'p1',orderId:'o1',stage:0,status:'已完成',demoScenario:'linked-business-20261123-v1',workspace:{assetId:'shared-jaw-demonstration'},approvedModel:{id:'r1',version:'V01',name:'三维重建成果'}},{id:'t2',projectId:'p1',orderId:'o1',stage:1,status:'待审核',demoScenario:'linked-business-20261123-v1',workspace:{assetId:'shared-jaw-demonstration'}}],artifacts:[{id:'r1',version:'V01',orderId:'o1',projectId:'p1',taskId:'t1',reviewStatus:'审核通过',reviewedAt:'2026-11-20T09:00:00Z',synthetic:true}]};
const admin={orders:[{...catalog.orders[0],salesId:user.id}],people:[user],assets:[{...catalog.artifacts[0],name:'三维重建成果',stage:0}]};
function service(){return new BusinessService({sharedCatalog:()=>catalog,demoShareCodes:true,image:Buffer.from('preview'),now:()=>new Date('2026-11-26T08:00:00Z')});}
test('linked sharing projects only exact approved synthetic display resources, never creates approval or changes catalog',async()=>{
 const s=service(),before=JSON.stringify(catalog),o=linkedShareOrder(s,user,'o1');assert.equal(o.businessNo,'CV-2026-0001');assert.equal(o.artifacts.length,1);assert.equal(o.artifacts[0].id,'r1');assert.equal(o.artifacts[0].version,'V01');assert.equal(o.expectedRecipient.id,'doctor-1');
 await s.projection(user,[{id:'o1',ownerSalesId:user.id,status:'已完成'}]);const share=await s.share(user,{orderId:'o1',resultId:'r1',resultVersion:'V01'},'http://local');
 assert.equal(s.state.shares[share.token].orderId,'o1');assert.equal(s.shareRecords.summary(s.state.shares[share.token]).successCount,0);assert.equal(JSON.stringify(catalog),before);
 const records=projectAdminShares(s.state,admin);assert.equal(records.length,1);assert.equal(records[0].initiatorName,'李明');assert.equal(records[0].successCount,0);assert.equal(records[0].visits.length,0);assert(!JSON.stringify(records).includes(share.token));
});
test('sharing fails closed for production, ordinary accounts, real assets, unreviewed tasks and wrong relations',()=>{
 const s=service();assert.equal(linkedShareOrder(s,{...user,id:'other'},'o1'),null);assert.equal(linkedShareOrder(s,{...user,demoBusiness:false},'o1'),null);
 for(const mutate of [c=>c.artifacts[0].synthetic=false,c=>c.tasks[0].status='待审核',c=>c.tasks[0].approvedModel.version='V00',c=>c.projects[0].orderId='wrong',c=>c.artifacts[0].taskId='t2']){const c=structuredClone(catalog);mutate(c);assert.equal(linkedShareOrder({...s,sharedCatalog:()=>c},user,'o1'),null)}
 const env=process.env.NODE_ENV;try{process.env.NODE_ENV='production';assert.equal(linkedShareOrder(s,user,'o1'),null);assert.equal(localShareProvider({mode:'local',demoMode:true})(),null)}finally{if(env)process.env.NODE_ENV=env;else delete process.env.NODE_ENV}
});
test('admin sharing counts exact durable version events; opening records does not invent visits',async()=>{
 const s=service();await s.projection(user,[{id:'o1',ownerSalesId:user.id}]);const {token}=await s.share(user,{orderId:'o1',resultId:'r1',resultVersion:'V01'},'http://local'),share=s.state.shares[token],id=share.id;
 const event={shareId:id,orderId:'o1',resultId:'r1',resultVersion:'V01',at:'2026-11-26T07:00:00Z'};
 s.state.shareEvents.push({...event,id:'v1',type:'viewed',visitorId:'doctor-1',visitorName:'周明哲',visitorRole:'医生'}, {...event,id:'v1',type:'viewed'}, {...event,id:'failed',type:'verification-failed',visitorName:'随意姓名',visitorRole:'医生'}, {...event,id:'wrong',resultVersion:'V00',type:'viewed'}, {...event,id:'copy',type:'copy'}, {...event,id:'open',type:'open'});
 const before=JSON.stringify(s.state);for(let i=0;i<2;i++){const [r]=projectAdminShares(s.state,admin);assert.equal(r.successCount,1);assert.equal(r.lastViewedAt,event.at);assert.equal(r.visits.length,2);assert.equal(r.visits.find(v=>v.id==='v1').name,'周明哲');assert.equal(r.visits.find(v=>v.id==='failed').name,'未确认身份');assert.equal(r.visits.find(v=>v.id==='failed').role,'未确认');assert.equal(r.visits.find(v=>v.id==='failed').outcome,'未通过验证')}
 assert.equal(JSON.stringify(s.state),before);
});
test('admin shares never merge archived orders, wrong owners, missing permissions source or different result versions',async()=>{
 const s=service();await s.projection(user,[{id:'o1',ownerSalesId:user.id}]);const {token}=await s.share(user,{orderId:'o1',resultId:'r1',resultVersion:'V01'},'http://local');
 assert.deepEqual(projectAdminShares(s.state,{...admin,orders:[]}),[]);assert.deepEqual(projectAdminShares(s.state,{...admin,assets:[]}),[]);assert.deepEqual(projectAdminShares(null,admin),[]);
 s.state.shares[token].resultVersion='V00';assert.deepEqual(projectAdminShares(s.state,admin),[]);s.state.shares[token].resultVersion='V01';s.state.shares[token].owner='other';assert.deepEqual(projectAdminShares(s.state,admin),[]);
});
test('audit keyword control and its persisted condition are removed, official requested icons are used',()=>{
 const ui=readFileSync(new URL('../src/admin/DataAuditPanel.tsx',import.meta.url),'utf8').split('export function AuditLogPanel')[1];assert(!ui.includes('关键词'));assert(!ui.includes('query'));const shell=readFileSync(new URL('../src/admin/AdminWorkspace.tsx',import.meta.url),'utf8');assert(shell.includes("['assets','数据资产',DataIcon],['audit','审计日志',FileSafetyIcon]"));
});
