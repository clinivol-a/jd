import test from 'node:test';
import assert from 'node:assert/strict';
import {seedSales,transition} from '../src/sales/model.ts';
import {migrateSales} from '../src/sales/migrate.ts';
import {confirmedDelivery} from '../src/sales/orderRules.mjs';
const now=new Date('2026-11-12T09:00:00');
test('processing and completed orders use agreed date; unapproved states stay pending',()=>{
 const d=migrateSales(seedSales('li',now));
 for(const o of d.orders){if(['处理中','已完成'].includes(o.status))assert.equal(confirmedDelivery(o),o.requestedDueDate);if(['草稿','待审核','审核退回'].includes(o.status))assert.equal(confirmedDelivery(o),'');}
 assert.equal(confirmedDelivery(d.orders.find(o=>o.id==='SO-2026-0003')),d.orders.find(o=>o.id==='SO-2026-0003').due);
});
test('approval commits the agreed deadline without a separate scheduling event',()=>{
 const d=migrateSales(seedSales('li',now)),o=d.orders.find(o=>o.status==='待审核');
 const n=transition(d,{type:'order-advance',target:o.id,value:'处理中'},true,now),accepted=n.orders.find(x=>x.id===o.id);
 assert.equal(accepted.confirmedDeliveryDate,o.requestedDueDate);assert.equal(confirmedDelivery(accepted),o.requestedDueDate);assert.ok(n.events.some(e=>e.target===o.id&&e.title==='订单审核通过'));assert.ok(!n.events.some(e=>e.title==='预计交付时间已确认'));
 assert.throws(()=>transition(d,{type:'order-advance',target:o.id,value:'处理中'},false,now));
 const bad=structuredClone(d),b=bad.orders.find(x=>x.id===o.id);b.requestedDueDate='';b.due='';assert.throws(()=>transition(bad,{type:'order-advance',target:o.id,value:'处理中'},true,now));
});
test('migration removes only superseded isolated scheduling records and preserves real history',()=>{
 const d=seedSales('li',now);d.fixtureRevision=6;const original=structuredClone(d.events);
 d.events.push({id:'v24-test-schedule',target:d.orders[0].id,title:'预计交付时间已确认',actor:'管理员（隔离测试）',at:now.toISOString(),detail:'2026-11-25',read:true});
 const n=migrateSales(d);assert.ok(!n.events.some(e=>e.id==='v24-test-schedule'));assert.ok(original.every(e=>n.events.some(x=>x.id===e.id)));assert.deepEqual(migrateSales(n),n);
});
