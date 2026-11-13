import test from 'node:test';import assert from 'node:assert/strict';
import {seedSales,visibleOrders,transition} from '../src/sales/model.ts';import {migrateSales} from '../src/sales/migrate.ts';
import {ensurePresentationOrders} from '../src/sales/presentationFixtures.mjs';import {confirmedDelivery} from '../src/sales/orderRules.mjs';import {salesBusiness} from '../src/sales/dashboardBusiness.mjs';
const now=new Date('2026-11-13T10:00:00+08:00');
const setup=()=>ensurePresentationOrders(migrateSales(seedSales('li',now)),now);
test('V28 additive initialization provides 20+ authorized recent records and preserves edits and deletion',()=>{
 const base=migrateSales(seedSales('li',now)),old=structuredClone(base);const d=ensurePresentationOrders(base,now),visible=visibleOrders(d,now);
 assert.ok(visible.length>=20);assert.equal(new Set(visible.map(o=>o.id)).size,visible.length);
 assert.deepEqual(d.orders.filter(o=>old.orders.some(x=>x.id===o.id)),old.orders);
 assert.deepEqual(d.events.filter(e=>old.events.some(x=>x.id===e.id)),old.events);
 assert.deepEqual(ensurePresentationOrders(d,new Date('2026-11-14')),d);
 d.orders[0].name='用户自存内容';d.orders.splice(d.orders.findIndex(o=>o.id==='SO-V28-1-01'),1);
 assert.deepEqual(ensurePresentationOrders(d),d);
 for(const o of visible){assert.ok(d.doctors.some(x=>x.id===o.doctorId&&x.hospitalId===o.hospitalId));assert.ok(d.cases.some(x=>x.id===o.caseId&&x.doctorId===o.doctorId));assert.ok(Date.parse(o.updated)<=now.getTime());}
 for(const o of d.orders.filter(o=>o.demoScenario?.startsWith('SO-V28'))){const events=d.events.filter(e=>e.target===o.id);assert.ok(events.some(e=>e.title==='订单已创建'));if(o.status==='草稿')assert.ok(!events.some(e=>/审核通过|提交审核/.test(e.title)));if(['处理中','已完成'].includes(o.status)){assert.ok(o.confirmedDeliveryDate);assert.equal(confirmedDelivery(o),o.confirmedDeliveryDate);assert.notEqual(o.requestedDueDate,o.confirmedDeliveryDate);assert.ok(events.some(e=>e.title==='订单审核通过'));assert.ok(o.taskIds.length)}if(o.status==='已完成')assert.ok(o.stages.every(s=>s.status==='已完成'));if(o.status==='审核退回')assert.ok(o.reason&&events.some(e=>e.title==='订单审核退回'));}
});
test('V28 one todo source preserves object/state/time/route identity and ranked order',()=>{
 const d=setup(),items=salesBusiness(d,visibleOrders(d,now)).items;
 assert.ok(items.length>12);assert.ok(items.some(i=>i.kind==='doctor'));assert.ok(items.some(i=>i.kind==='order'));assert.ok(!items.some(i=>i.category==='业务动态'));
 for(const i of items){const source=(i.kind==='doctor'?d.doctors:d.orders).find(x=>x.id===i.target);assert.equal(i.object,source.name);assert.equal(i.name,source.name);assert.equal(i.status,source.status);assert.equal(i.at,source.updatedAt||source.updated||d.events.filter(e=>e.target===source.id).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))[0]?.at||'');assert.equal(i.route,`${i.kind==='doctor'?'doctor-new':'order-new'}/${source.id}`)}
 const firstDraft=items.findIndex(i=>i.category==='待继续完成');assert.ok(items.slice(firstDraft).every(i=>i.category==='待继续完成'));
 const draft=d.doctors.find(d=>d.status==='草稿');const after=transition(d,{type:'doctor-delete',target:draft.id},{id:'li',permissions:[]},now);assert.ok(!salesBusiness(after,visibleOrders(after,now)).items.some(i=>i.target===draft.id));
 for(const kind of ['doctor','order'])for(const status of ['草稿','审核退回']){const changed=structuredClone(d),row=(kind==='doctor'?changed.doctors:changed.orders).find(r=>r.status===status);row.status='待审核';assert.ok(!salesBusiness(changed,visibleOrders(changed,now)).items.some(i=>i.target===row.id));}
});
