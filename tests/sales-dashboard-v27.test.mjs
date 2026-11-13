import test from 'node:test';import assert from 'node:assert/strict';
import {seedSales,visibleOrders,transition} from '../src/sales/model.ts';import {migrateSales} from '../src/sales/migrate.ts';import {dashboardOrderBuckets,salesBusiness,orderTodoItems} from '../src/sales/dashboardBusiness.mjs';
const now=new Date('2026-11-12T10:00:00+08:00');
test('four buckets use authorized orders, natural months and actual completion timestamps',()=>{const d=migrateSales(seedSales('li',now));const orders=visibleOrders(d,now),b=dashboardOrderBuckets(orders,now,d.events);assert.deepEqual(Object.keys(b),['pending','processing','new','completed']);assert.deepEqual(b.pending,orders.filter(o=>['草稿','待审核','审核退回'].includes(o.status)));assert.deepEqual(b.processing,orders.filter(o=>o.status==='处理中'));assert.ok(b.new.every(o=>new Date(o.created).getMonth()===10));assert.ok(b.completed.every(o=>o.status==='已完成'));const history={...orders[0],id:'old',status:'已完成',completedAt:'2025-11-02T08:00:00+08:00',updated:now.toISOString()};assert.ok(!dashboardOrderBuckets([history],now).completed.length);assert.ok(!dashboardOrderBuckets([{...history,completedAt:undefined}],now).completed.length);});
test('business classification, ownership, scope and state changes share source records',()=>{let d=migrateSales(seedSales('li',now));let orders=visibleOrders(d,now);const b=salesBusiness(d,orders);assert.ok(!b.items.some(i=>i.category==='需要处理'&&i.status==='待审核'));assert.ok(b.items.filter(i=>i.category==='需要处理').every(i=>['订单','医生档案'].includes(i.type)));assert.ok(b.items.filter(i=>i.category==='待继续完成').every(i=>i.route.includes('-new/')&&i.status==='草稿'));assert.ok(b.items.filter(i=>i.category==='需要处理').every(i=>i.status==='审核退回'));assert.ok(b.items.filter(i=>i.category==='业务动态').every(i=>!['已发生','已发送'].includes(i.status)));assert.ok(b.items.filter(i=>i.category==='业务动态').every(i=>!i.route.includes('-new/')));assert.ok(!b.items.some(i=>i.target==='D-6'));assert.equal(b.doctorCount,d.doctors.filter(x=>x.owner==='li'&&x.status==='审核通过').length);assert.equal(b.hospitalCount,d.hospitals.length);assert.equal(b.requiredCount,b.items.filter(i=>i.category==='需要处理').length);
const draft=d.doctors.find(x=>x.status==='草稿');d=transition(d,{type:'doctor-delete',target:draft.id},{id:'li',permissions:[]},now);assert.ok(!salesBusiness(d,visibleOrders(d,now)).items.some(i=>i.target===draft.id));
const returned=d.orders.find(o=>o.status==='审核退回');returned.status='待审核';assert.ok(!salesBusiness(d,visibleOrders(d,now)).items.some(i=>i.target===returned.id&&i.category==='需要处理'));});
test('unauthorized orders and nonexistent event targets do not leak via dynamic items',()=>{const d=migrateSales(seedSales('li',now));d.events.push({id:'private',target:'hidden-order',title:'订单审核通过',at:now.toISOString()});d.orders.push({...d.orders[0],id:'hidden-order',ownerSalesId:'other'});const orders=visibleOrders(d,now);assert.ok(!dashboardOrderBuckets(orders,now,d.events).pending.some(o=>o.id==='hidden-order'));assert.ok(!salesBusiness(d,orders).items.some(i=>i.target==='hidden-order'));});

test('todo detail tabs contain only authorized returned or draft orders',()=>{
 const d=migrateSales(seedSales('li',now)),orders=visibleOrders(d,now);
 for(const [category,status] of [['需要处理','审核退回'],['待继续完成','草稿']]){
  const rows=orderTodoItems(orders,category);
  assert.deepEqual(new Set(rows.map(o=>o.id)),new Set(orders.filter(o=>o.status===status).map(o=>o.id)));
  assert.ok(rows.every(o=>o.status===status && d.orders.some(source=>source.id===o.id)));
  assert.ok(rows.every((o,i)=>!i||Date.parse(rows[i-1].updated)>=Date.parse(o.updated)));
 }
 assert.deepEqual(orderTodoItems(orders,'业务动态'),[]);
 const returned=orders.find(o=>o.status==='审核退回');
 assert.ok(!orderTodoItems(orders.map(o=>o.id===returned.id?{...o,status:'待审核'}:o),'需要处理').some(o=>o.id===returned.id));
 assert.ok(salesBusiness(d,orders).items.some(i=>i.kind==='doctor'&&i.category==='需要处理'));
});
