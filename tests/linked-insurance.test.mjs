import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import{BusinessService}from'../server/business/service.mjs';import{linkedResultImage}from'../server/business/linkedPreview.mjs';
const user={id:'seller',name:'李明',phone:'13800000002',role:'sales',status:'approved',permissions:['insurance.export'],demoBusiness:true};
const image=readFileSync('server/business/fixtures/approved-static-preview.png');
async function setup(){
 const catalog={catalogMode:'linked-only',source:'isolated-shared',hospitals:[{id:'h',name:'江淮协同医院'}],orders:[],projects:[],tasks:[],artifacts:[]};
 const service=new BusinessService({sharedCatalog:()=>structuredClone(catalog),linkedResultImage:()=>image});
 const patient=await service.patient(user,{sex:'女',identityNumber:'11010519491231002X'});
 const o={id:'internal-demo',businessNo:'CV-2026-0016',ownerSalesId:user.id,status:'已完成',name:'术前骨性结构模型',patientName:'沈嘉宁',patientSex:'女',patientIdentityRef:patient.patientIdentityRef,hospitalId:'h',completedAt:'2026-11-22T10:00:00+08:00',projectId:'p',demoScenario:'linked-business-20261123-v1'};
 const t={id:'t',projectId:'p',orderId:o.id,stage:0,status:'已完成',approvedModel:{id:'r',version:'V01'},workspace:{assetId:'shared-jaw-demonstration'},demoScenario:o.demoScenario};
 catalog.orders.push(o);catalog.projects.push({id:'p',orderId:o.id,taskIds:['t']});catalog.tasks.push(t);catalog.artifacts.push({id:'r',version:'V01',orderId:o.id,projectId:'p',taskId:'t',reviewStatus:'审核通过',reviewedAt:'2026-11-22T09:00:00+08:00',synthetic:true});
 return {service,catalog,o,t};
}
test('shared insurance reads same authorized order, valid encrypted patient and exact approved task/result, ignoring posted fields',async()=>{
 const {service:s,catalog,o}=await setup();await s.projection(user,[{...o,name:'forged',businessNo:'forged',patientSex:'男',hospital:'forged'}]);
 const rows=s.exportList(user,'2026-11');assert.equal(rows.length,1);const r=rows[0];assert.equal(r.businessNo,o.businessNo);assert.equal(r.surgery,o.name);assert.equal(r.hospital,'江淮协同医院');assert.equal(r.sex,'女');assert.equal(r.resultId,'r');assert.equal(r.resultVersion,'V01');assert.ok(r.maskedIdentity.includes('*'));assert.ok(!JSON.stringify(rows).includes('11010519491231002X'));assert.deepEqual(r.issues,[]);assert.ok(s.insuranceImage(user,o.id,'r','V01').equals(image));assert.equal(s.exportList(user,'2026-10').length,0);assert.throws(()=>s.insuranceImage(user,o.id,'wrong','V01'));assert.throws(()=>s.insuranceImage({...user,id:'other'},o.id,'r','V01'));assert.equal(s.exportList({...user,id:'other'},'2026-11').length,0);assert.throws(()=>s.exportList({...user,role:'designer'},'2026-11'));assert.throws(()=>s.exportList({...user,permissions:[]},'2026-11'));
 const before=JSON.stringify(catalog),bytes=await s.export(user,{month:'2026-11',ids:[o.id]});assert.ok(bytes.includes(Buffer.from(o.businessNo)));assert.ok(bytes.includes(Buffer.from(o.name)));assert.ok(!bytes.includes(Buffer.from(o.id)));assert.ok(bytes.includes(Buffer.from('11010519491231002X')));assert.ok(bytes.includes(Buffer.from('image0.png')));assert.equal(JSON.stringify(catalog),before);assert.equal(s.state.audit.filter(e=>e.type==='insurance-export').length,1);
});
test('missing identity/approval/model/linked task or version does not invent an export or publish/share permit',async()=>{
 for(const mutate of [x=>x.catalog.artifacts[0].reviewStatus='待审核',x=>x.catalog.artifacts[0].taskId='unrelated',x=>x.t.approvedModel.version='V02',x=>x.catalog.artifacts[0].synthetic=false,x=>x.t.workspace.assetId='unknown',x=>x.o.patientIdentityRef='missing']){
  const x=await setup();mutate(x);const rows=x.service.exportList(user,'2026-11');assert.ok(rows[0].issues.length);await assert.rejects(x.service.export(user,{month:'2026-11',ids:[x.o.id]}));assert.deepEqual(x.service.artifacts(user,x.o.id),[]);
 }
 const x=await setup();x.o.status='处理中';assert.equal(x.service.exportList(user,'2026-11').length,0);
});
test('same approved isolated professional asset yields a valid static PNG without changing approval/history',async()=>{
 const x=await setup();const bytes=linkedResultImage({task:x.t,artifact:x.catalog.artifacts[0]});assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.ok(bytes.length>10000);
});
