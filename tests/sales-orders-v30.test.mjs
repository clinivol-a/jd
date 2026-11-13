import test from 'node:test';import assert from 'node:assert/strict';
import {seedSales,transition} from '../src/sales/model.ts';
import {orderErrors} from '../src/sales/orderRules.mjs';
import {clinicalContentError,clinicalText,hasClinicalContent} from '../src/sales/clinicalContent.mjs';
const now=new Date('2026-11-13T12:00:00+08:00'),actor={id:'li',name:'李明',permissions:[]};
const text={id:'p',type:'paragraph',text:'<img src=x onerror=alert(1)>\n临床说明',bold:true};
const media={id:'m',type:'video',file:{id:'f',name:'clinical.mp4',size:1000,type:'video/mp4',status:'success',storage:'browser',uploadedBy:'li'}};
test('V30 manual patient order creates internal association without requiring a Case selection or overwriting existing records',()=>{
 const d=seedSales('li',now),source=d.orders[0],before=structuredClone(d.cases);
 const order={...source,id:'new-v30',caseId:'',patientName:'合成验收患者',clinicalContent:{version:1,blocks:[text,media]}};
 const n=transition(d,{type:'order-save',value:order},actor,now),o=n.orders.find(x=>x.id===order.id);
 assert.ok(o.caseId);assert.equal(o.patientName,order.patientName);assert.equal(n.cases.find(c=>c.id===o.caseId).patientName,order.patientName);assert.deepEqual(n.cases.slice(0,before.length),before);assert.deepEqual(o.clinicalContent,order.clinicalContent);assert.equal(o.clinicalRequirements,text.text);
 const restored=JSON.parse(JSON.stringify(n));assert.deepEqual(restored.orders.find(x=>x.id===order.id).clinicalContent,order.clinicalContent);
 const same=transition(n,{type:'order-save',value:o},actor,now);assert.equal(same.cases.length,n.cases.length);
});
test('V30 editing patient name does not mutate legacy shared Case or other orders; old links survive normal save',()=>{
 const d=seedSales('li',now),o=d.orders.find(o=>o.status==='草稿'),cases=structuredClone(d.cases),other=structuredClone(d.orders.filter(x=>x.id!==o.id));
 const same=transition(d,{type:'order-save',value:o},actor,now);assert.equal(same.orders.find(x=>x.id===o.id).caseId,o.caseId);
 const n=transition(d,{type:'order-save',value:{...o,patientName:'另一个合成患者'}},actor,now);assert.deepEqual(n.cases.slice(0,cases.length),cases);assert.notEqual(n.orders.find(x=>x.id===o.id).caseId,o.caseId);assert.deepEqual(n.orders.filter(x=>x.id!==o.id),other);
});
test('V30 shared validation requires patient, not selected Case; media cannot replace formal imaging',()=>{
 const d=seedSales('li',now),o={...d.orders[0],caseId:'',patientName:'合成患者',clinicalContent:{version:1,blocks:[media]},clinicalRequirements:'',requirements:''};
 assert.equal(orderErrors(o,o.patientName,now).caseId,undefined);assert.equal(orderErrors(o,'',now).patientName,'请填写患者姓名。');
 assert.equal(orderErrors(o,o.patientName,now).clinicalRequirements,undefined);assert.ok(orderErrors({...o,materials:[]},o.patientName,now).materials);
});
test('V30 schema rejects raw HTML formats, external/blob URLs, invalid media types, pending/oversize media and foreign owners',()=>{
 assert.equal(clinicalContentError({version:1,blocks:[text,media]},'li'),'');assert.equal(clinicalText({version:1,blocks:[text]}),text.text);assert.ok(hasClinicalContent({version:1,blocks:[media]}));
 for(const content of [{html:'<script/>'},{version:1,blocks:[{id:'x',type:'html',text:'<script/>'}]},...['https://example.com/file.mp4','blob:temporary'].map(url=>({version:1,blocks:[{...media,file:{...media.file,url}}]})),{version:1,blocks:[{...media,file:{...media.file,type:'image/svg+xml'}}]},{version:1,blocks:[{...media,file:{...media.file,status:'uploading'}}]},{version:1,blocks:[{...media,file:{...media.file,size:30*1024*1024}}]}])assert.ok(clinicalContentError(content,'li'));
 assert.ok(clinicalContentError({version:1,blocks:[media]},'other'));
 const d=seedSales('li',now);assert.throws(()=>transition(d,{type:'order-save',value:{...d.orders.find(o=>o.status==='草稿'),clinicalContent:{version:1,blocks:[{...media,file:{...media.file,uploadedBy:'other'}}]}}},actor,now),/权限/);
});
