import test from 'node:test';
import assert from 'node:assert/strict';
import {seedSales,transition} from '../src/sales/model.ts';
import {migrateSales} from '../src/sales/migrate.ts';
import {confirmedDelivery,orderErrors} from '../src/sales/orderRules.mjs';
const now=new Date('2026-11-12T09:00:00');
test('legacy due migrates only to requested date; source events and statuses are preserved',()=>{
 const d=seedSales('li',now);const before=structuredClone(d);const n=migrateSales(d);
 for(const o of n.orders){assert.equal(o.requestedDueDate,o.due);assert.equal(confirmedDelivery(o),'');}
 assert.deepEqual(n.events,before.events.sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)||a.id.localeCompare(b.id)));
 assert.deepEqual(n.orders.map(o=>o.status),before.orders.map(o=>o.status));assert.deepEqual(migrateSales(n),n);
});
test('sales cannot schedule or inject confirmation by saving a draft; administrator confirmation is traceable',()=>{
 const d=migrateSales(seedSales('li',now));const processing=d.orders.find(o=>o.status==='处理中'),draft=d.orders.find(o=>o.status==='草稿');
 assert.throws(()=>transition(d,{type:'order-schedule',target:processing.id,value:'2026-11-25'},false,now));
 assert.throws(()=>transition(d,{type:'order-schedule',target:draft.id,value:'2026-11-25'},true,now));
 const saved=transition(d,{type:'order-save',value:{...draft,confirmedDeliveryDate:'2026-11-25',deliveryConfirmedAt:now.toISOString(),deliveryConfirmedBy:'伪造'}},false,now);
 assert.equal(confirmedDelivery(saved.orders.find(o=>o.id===draft.id)),'');
 const scheduled=transition(d,{type:'order-schedule',target:processing.id,value:'2026-11-25'},true,now);
 const o=scheduled.orders.find(o=>o.id===processing.id);assert.equal(confirmedDelivery(o),'2026-11-25');assert.equal(o.requestedDueDate,processing.requestedDueDate);assert.ok(scheduled.events.some(e=>e.target===o.id&&e.title==='预计交付时间已确认'));assert.equal(o.status,processing.status);
});
test('delivery requires valid confirmation provenance and survives cancellation',()=>{
 const d=migrateSales(seedSales('li',now)),o=d.orders.find(o=>o.status==='处理中');
 assert.equal(confirmedDelivery({...o,confirmedDeliveryDate:'2026-11-25'}),'');
 assert.throws(()=>transition(d,{type:'order-schedule',target:o.id,value:'2026-02-30'},true,now));
 const n=transition(d,{type:'order-schedule',target:o.id,value:'2026-11-25'},true,now);
 const cancelled=transition(n,{type:'order-advance',target:o.id,value:'已取消',reason:'需求方暂缓'},true,now);assert.equal(confirmedDelivery(cancelled.orders.find(x=>x.id===o.id)),'2026-11-25');
});
test('submission validates requested date independently from company delivery',()=>{
 const d=migrateSales(seedSales('li',now)),o=d.orders.find(o=>o.status==='草稿'),patient=d.cases.find(c=>c.id===o.caseId).patientName;
 assert.ok(orderErrors({...o,requestedDueDate:'2000-01-01',confirmedDeliveryDate:'2026-12-20'},patient,now).due);
 assert.equal(orderErrors({...o,requestedDueDate:'2026-12-20'},patient,now).due,undefined);
});
