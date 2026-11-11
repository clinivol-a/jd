import test from 'node:test';import assert from 'node:assert/strict';
import {seedSales,transition,metrics} from '../src/sales/model.ts';
import {migrateSales} from '../src/sales/migrate.ts';
import {addOrderScenario,fixtureBytes} from '../src/sales/orderFixtures.mjs';
const now=new Date('2026-11-11T12:00:00');
test('fixtures cover states with real synthetic event chains, valid times, stable case identity and assigned teams',()=>{
 const d=migrateSales(seedSales('li',now));
 assert.deepEqual(new Set(d.orders.slice(0,6).map(o=>o.status)),new Set(['草稿','待审核','审核退回','处理中','已完成']));
 assert.ok(d.orders.some(o=>o.status==='已取消'));
 for(const o of d.orders){const es=d.events.filter(e=>e.target===o.id);assert.ok(es.length);assert.ok(Date.parse(o.created)<=Date.parse(o.updated));assert.ok(Date.parse(o.updated)<=now.getTime());assert.ok(o.due>'2026-11-11');assert.ok(d.cases.find(c=>c.id===o.caseId).patientRef);assert.ok(!d.cases.find(c=>c.id===o.caseId).patientName.includes('演示患者'));assert.ok(es.every(e=>Date.parse(e.at)<=now.getTime()));
 if(o.status==='草稿')assert.deepEqual(es.map(e=>e.title),['订单已创建']);
 if(o.status==='待审核')assert.ok(!es.some(e=>e.title==='订单审核通过'));
 if(o.status==='审核退回'){assert.ok(o.reason);assert.ok(es.some(e=>e.title==='订单审核退回'));}
 if(o.status==='处理中')assert.ok(es.some(e=>e.title==='订单审核通过'));
 for(const stage of o.stages)if(stage.status==='进行中')assert.ok(stage.owner&&stage.startedAt);
 if(o.status==='已完成')assert.ok(o.stages.every(s=>s.status==='已完成'&&s.completedAt));
 }
});
test('explicit V23 scene appends and never clears user orders, cases, doctors, attachments or audit; repeat load refused',()=>{
 const d=migrateSales(seedSales('li',now));d.orders[0].name='用户已修改';d.cases.push({...d.cases[0],id:'user-case',patientName:'自填姓名'});const before=structuredClone(d);
 const n=addOrderScenario(d,now);assert.deepEqual(n.orders.slice(0,before.orders.length),before.orders);assert.deepEqual(n.doctors,before.doctors);assert.deepEqual(n.cases.slice(0,before.cases.length),before.cases);assert.ok(before.events.every(e=>n.events.some(x=>JSON.stringify(x)===JSON.stringify(e))));assert.throws(()=>addOrderScenario(n,now));
 const recent=[...n.orders].sort((a,b)=>Date.parse(b.updated)-Date.parse(a.updated)).slice(0,6);assert.equal(new Set(recent.map(o=>o.status)).size,5);
});
test('only creator drafts can be deleted, cases and other orders survive, audit retained and counts recomputed',()=>{
 let d=migrateSales(seedSales('li',now));const draft=d.orders.find(o=>o.status==='草稿'),c=structuredClone(d.cases),count=metrics(d,now).todos.length;
 assert.throws(()=>transition(d,{type:'order-delete',target:draft.id},{id:'other',permissions:[]},now));
 for(const o of d.orders.filter(o=>o.status!=='草稿'))assert.throws(()=>transition(d,{type:'order-delete',target:o.id},false,now));
 const n=transition(d,{type:'order-delete',target:draft.id},{id:'li',name:'李明',permissions:[]},now);assert.equal(n.orders.length,d.orders.length-1);assert.deepEqual(n.cases,c);assert.equal(metrics(n,now).todos.length,count-1);assert.ok(n.events.some(e=>e.target===draft.id&&e.title==='订单草稿已删除'&&e.actor==='李明'));assert.ok(d.orders.some(o=>o.id===draft.id));
});
test('migration repairs only known placeholder identities and reliable event times; no future history or project links fabricated',()=>{
 const d=seedSales('li',now);d.fixtureRevision=4;d.cases[0].patientName='演示患者1';d.cases[1].patientName='用户填写';d.orders[3].created='';d.orders[3].updated='';d.projects=[];d.orders[3].projectId=undefined;
 const old=structuredClone(d.events);const n=migrateSales(d);assert.equal(n.cases[0].patientName,'沈嘉宁');assert.equal(n.cases[1].patientName,'用户填写');assert.deepEqual(n.events.map(e=>e.id).sort(),old.map(e=>e.id).sort());assert.equal(n.projects.length,0);assert.equal(n.orders[3].projectId,undefined);assert.equal(n.orders[3].created,old.find(e=>e.target===n.orders[3].id&&e.title==='订单已创建').at);assert.deepEqual(migrateSales(n),n);
});
test('actual fixture file payloads have PDF, PNG and NIfTI headers and consistent declared sizes',()=>{
 assert.equal(new TextDecoder().decode(fixtureBytes(1).slice(0,8)),'%PDF-1.4');assert.deepEqual([...fixtureBytes(2).slice(0,8)],[137,80,78,71,13,10,26,10]);assert.equal(new DataView(fixtureBytes(0).buffer).getInt32(0,true),348);
 const d=seedSales('li',now);for(const o of d.orders)for(let i=0;i<3;i++)assert.equal(o.materials[i].size,fixtureBytes(i).length);
});
