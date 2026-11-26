import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {UnifiedBusinessService} from '../server/unified/service.mjs';
import {restoreFormalLocks,formalArtifact} from '../server/unified/formalResults.mjs';
import {AdminService} from '../server/admin/service.mjs';
import {AuthService} from '../server/auth/service.mjs';
import {managementPermissions} from '../server/admin/seed.mjs';
import {assetKey,orderAssetRows,resultAssets,assetExportSelection,assetProgressText} from '../src/admin/assetRules.mjs';
import {assetWorkbook} from '../server/admin/assetExport.mjs';
const actor={id:'super-admin',name:'管理员',role:'super_admin',status:'approved',permissions:managementPermissions};
function fixture(){
 const stages=['三维重建','CAD设计','有限元分析','3D打印'];
 const orders=[{id:'o1',businessNo:'CV-2026-0101',name:'颌面修复规划',status:'处理中',hospitalId:'h1',projectId:'p1',requestedStages:[0,1,2,3],plannedStages:stages,patientName:'不导出的患者资料',patientIdentityRef:'private-identity',ownerSalesId:'li'},{id:'o2',businessNo:'CV-2026-0102',name:'颌面修复规划',status:'待审核',hospitalId:'h2',requestedStages:[0],plannedStages:stages.slice(0,1)}];
 const tasks=[0,1,2,3].map(stage=>({id:'t'+stage,orderId:'o1',projectId:'p1',stage,upstreamId:stage?'t'+(stage-1):null,assignee:'chen-yu',status:['已完成','待审核','进行中','未开始'][stage],version:1,review:[],...(stage===0?{approvedModel:{id:'r0',version:'V02',approvedAt:'2026-11-20T09:00:00Z',name:'三维重建成果'}}:{})}));
 const artifacts=[{id:'r0',version:'V01',taskId:'t0',orderId:'o1',projectId:'p1',stage:0,reviewStatus:'审核退回',submittedAt:'2026-11-18T08:00:00Z',reviewedAt:'2026-11-18T09:00:00Z',name:'三维重建成果'},{id:'r0',version:'V02',taskId:'t0',orderId:'o1',projectId:'p1',stage:0,reviewStatus:'审核通过',submittedAt:'2026-11-19T08:00:00Z',reviewedAt:'2026-11-20T09:00:00Z',name:'三维重建成果'},{id:'r1',version:'V01',taskId:'t1',orderId:'o1',projectId:'p1',stage:1,reviewStatus:'待审核',submittedAt:'2026-11-21T08:00:00Z',name:'CAD设计成果'}];
 return {schema:1,source:'isolated-shared',orders,tasks,artifacts,assets:artifacts,projects:[{id:'p1',orderId:'o1',taskIds:tasks.map(t=>t.id)}],hospitals:[{id:'h1',name:'安徽省立医院'},{id:'h2',name:'合肥市第一人民医院'}],events:[{id:'return-v1',taskId:'t0',orderId:'o1',resultId:'r0',resultVersion:'V01',type:'review-return',at:'2026-11-18T09:00:00Z',actorId:actor.id,reason:'请核对缺损边界。'},{id:'pass-v2',taskId:'t0',orderId:'o1',resultId:'r0',resultVersion:'V02',type:'review-pass',at:'2026-11-20T09:00:00Z',actorId:actor.id}],sequences:{}};
}
test('one order row counts each requested official locked stage once and never counts a returned/pending version',()=>{
 const data=fixture(),events=JSON.stringify(data.events);restoreFormalLocks(data);
 const rows=orderAssetRows(data);assert.equal(rows.length,2);assert.equal(rows[0].passed,1);assert.equal(assetProgressText(rows[0]),'1 / 4 阶段已通过');assert.equal(rows[0].updatedAt,'2026-11-21T08:00:00Z');assert.equal(rows[1].updatedAt,null);
 assert.equal(data.artifacts[0].locked,undefined);assert.equal(data.artifacts[1].locked,true);assert.equal(data.artifacts[1].lockedAt,'2026-11-20T09:00:00Z');assert.equal(data.artifacts[2].locked,undefined);assert.equal(JSON.stringify(data.events),events);
 assert.equal(resultAssets(data).length,3);assert.equal(new Set(resultAssets(data).map(assetKey)).size,3);
 assert.equal(orderAssetRows(data,{completion:'partial'}).length,1);assert.equal(orderAssetRows(data,{completion:'none'}).length,1);assert.equal(orderAssetRows(data,{completion:'complete'}).length,0);
});
test('filters and exports operate on exact order identities and preserve complete order progress in the result view',()=>{
 const data=fixture();restoreFormalLocks(data);
 assert.equal(orderAssetRows(data,{orderNo:'0101',hospitalId:'h1',stage:'3'}).length,1);assert.equal(orderAssetRows(data,{orderNo:'o1'}).length,0);assert.equal(orderAssetRows(data,{orderNo:'0101',hospitalId:'h2'}).length,0);
 const selected=assetExportSelection(data,{view:'results',filters:{orderNo:'0101',stage:'1',reviewStatus:'待审核'}});assert.equal(selected.orders.length,1);assert.equal(selected.assets.length,1);assert.equal(selected.orders[0].passed,1);assert.equal(selected.assets[0].taskId,'t1');
 assert.equal(assetExportSelection(data,{view:'orders',filters:{stage:'3'}}).assets.length,3);assert.equal(assetExportSelection(data,{view:'orders',filters:{hospitalId:'h2'}}).assets.length,0);
});
test('formal compatibility locking requires an exact existing approved selection, never a pending/returned artifact or guessed version',()=>{
 for(const alter of [d=>d.tasks[0].approvedModel.version='wrong',d=>d.artifacts[1].reviewStatus='待审核',d=>d.artifacts[1].reviewStatus='审核退回',d=>d.artifacts[1].projectId='other',d=>d.artifacts[1].locked=false,d=>d.artifacts[1].stage=3]){const d=fixture();alter(d);restoreFormalLocks(d);assert.equal(formalArtifact(d,d.tasks[0]),null)}
});
test('locked versions cannot be changed or deleted; new versions retain old history and downstream starts bind the exact formal reference',()=>{
 const service=new UnifiedBusinessService();service.state=fixture();service.transaction(()=>{});const before=JSON.stringify(service.state.artifacts),events=JSON.stringify(service.state.events);
 assert.throws(()=>service.transaction(()=>service.state.artifacts[1].reviewStatus='审核退回'),e=>e.status===409);assert.equal(JSON.stringify(service.state.artifacts),before);
 assert.throws(()=>service.transaction(()=>service.state.artifacts.splice(1,1)),e=>e.status===409);assert.equal(JSON.stringify(service.state.events),events);
 service.state.tasks[1].status='未开始';const designer={id:'chen-yu',name:'陈屿',role:'designer',status:'approved',permissions:['projects:own']};service.taskCommand(designer,{id:'t1',action:'start',version:1});assert.deepEqual(service.state.tasks[1].inputArtifact,{id:'r0',version:'V02',taskId:'t0',projectId:'p1',orderId:'o1'});
 assert.equal(service.state.artifacts.length,3);assert.equal(service.state.artifacts[0].reviewStatus,'审核退回');
 const invalid=new UnifiedBusinessService();invalid.state=fixture();invalid.state.tasks[1].status='未开始';invalid.state.artifacts[1].reviewStatus='待审核';assert.throws(()=>invalid.taskCommand(designer,{id:'t1',action:'start',version:1}),/上游/);
});
function zipParts(bytes){let offset=0;const parts=new Map();while(bytes.readUInt32LE(offset)===0x04034b50){const size=bytes.readUInt32LE(offset+18),nameLength=bytes.readUInt16LE(offset+26),extraLength=bytes.readUInt16LE(offset+28),start=offset+30,name=bytes.subarray(start,start+nameLength).toString(),dataStart=start+nameLength+extraLength;parts.set(name,bytes.subarray(dataStart,dataStart+size).toString());offset=dataStart+size}return parts}
test('real XLSX contains two named sheets, exact rows, native dates and no patient data, formulas or publication column',()=>{
 const data=fixture();restoreFormalLocks(data);data.orders[0].name='=HYPERLINK("https://invalid")';const selection=assetExportSelection(data);const bytes=assetWorkbook(selection,data,{scope:'订单视角；两笔订单',timeZone:'Asia/Shanghai'}),parts=zipParts(bytes);
 assert.equal(bytes.subarray(0,2).toString(),'PK');assert(parts.get('xl/workbook.xml').includes('订单成果汇总'));assert(parts.get('xl/workbook.xml').includes('专业成果明细'));
 assert.equal((parts.get('xl/worksheets/sheet1.xml').match(/<row /g)||[]).length,5);assert.equal((parts.get('xl/worksheets/sheet2.xml').match(/<row /g)||[]).length,6);
 const text=[...parts.values()].join('');for(const forbidden of ['不导出的患者资料','private-identity','发布状态','<f>','downloadUrl','token'])assert(!text.includes(forbidden));assert(text.includes('=HYPERLINK'));assert(text.includes('yyyy-mm-dd hh:mm'));assert(text.includes('1 / 4 阶段已通过'));assert(text.includes('state="frozen"'));
});
function setup(t){const dir=mkdtempSync(join(tmpdir(),'cv-asset-orders-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));const auth=new AuthService({directory:join(dir,'auth'),mode:'local',demoMode:true});auth.seedLocal();return new AdminService({directory:join(dir,'admin'),authService:auth,shareProvider:()=>null});}
test('Excel is the default export; purpose, scope and permissions are server-checked and failed exports leave no audit event',t=>{
 const service=setup(t),before=service.state.events.length;
 for(const input of [{reason:''},{reason:'归档',filters:{patient:'private'}},{reason:'归档',filters:{hospitalId:'missing'}},{reason:'归档',timeZone:'not-a-zone'}])assert.throws(()=>service.command(actor,{action:'export-metadata',...input}));
 assert.equal(service.state.events.length,before);
 const filters={hospitalId:service.snapshot(actor).orders[0].hospitalId},result=service.command(actor,{action:'export-metadata',reason:'按医院核对成果',filters});assert(Buffer.isBuffer(result.file));assert(result.mime.includes('spreadsheetml.sheet'));assert.equal(result.filename,'clinivol-asset-information.xlsx');
 const audit=service.state.events.at(-1);assert.equal(audit.after.format,'xlsx');assert.deepEqual(audit.after.filters,filters);assert(audit.after.orderCount>0);assert.equal(service.state.events.length,before+1);
 assert.throws(()=>service.command({...actor,permissions:['orders:read','assets:read']},{action:'export-metadata',reason:'越权导出'}),e=>e.status===403);
});
test('snapshot preserves versions with the same artifact ID and sharing never controls a formal lock',t=>{
 const service=setup(t),raw=fixture();raw.artifacts[0].name='缺损边界重建V01';restoreFormalLocks(raw);service.shared.state=raw;service.shared.reload=()=>raw;const snapshot=service.snapshot(actor);assert.equal(snapshot.assets.filter(a=>a.id==='r0').length,2);assert.equal(snapshot.assets.find(a=>a.id==='r0'&&a.version==='V02').locked,true);assert.equal(snapshot.readiness.professionalReviewWrite,false);assert.equal(snapshot.assets.find(a=>a.id==='r0'&&a.version==='V01').name,'缺损边界重建V01');
});

test('legacy artifacts without a duplicated stage field resolve the exact task stage and retain official lock after service restart',t=>{
 const dir=mkdtempSync(join(tmpdir(),'cv-formal-restart-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));const service=new UnifiedBusinessService({directory:dir});service.transaction(()=>{service.state=fixture();for(const a of service.state.artifacts)delete a.stage});
 assert.equal(formalArtifact(service.state,service.state.tasks[0])?.version,'V02');const restored=new UnifiedBusinessService({directory:dir});assert.equal(formalArtifact(restored.state,restored.state.tasks[0])?.version,'V02');assert.equal(restored.state.artifacts.length,3);assert.equal(restored.state.events.length,2);
});
