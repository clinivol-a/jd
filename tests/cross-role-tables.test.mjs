import test from 'node:test';import assert from 'node:assert/strict';
import {build} from 'esbuild';import{mkdtemp,rm,readFile}from'node:fs/promises';import{tmpdir}from'node:os';
const dir=await mkdtemp(tmpdir()+'/cv-cross-tables-');test.after(()=>rm(dir,{recursive:true,force:true}));
await build({entryPoints:['src/tables/useViewportPagination.ts','src/reviewRecords.ts'],outdir:dir,bundle:true,platform:'node',format:'esm',loader:{'.css':'empty'},outExtension:{'.js':'.mjs'}});
const{pageCapacity,pageAfterResize}=await import(dir+'/tables/useViewportPagination.mjs');
const{reviewRecords,filterReviewRecords}=await import(dir+'/reviewRecords.mjs');
test('measured capacity grows with viewport, never inserts fake rows, and keeps the former first row on resize',()=>{
 const short=pageCapacity(380,48,60,72),tall=pageCapacity(800,48,60,72);assert.ok(tall>short);assert.equal(pageCapacity(20,48,60,72),1);
 const rows=Array.from({length:43},(_,id)=>id);for(const size of[short,tall]){const pages=Array.from({length:Math.ceil(rows.length/size)},(_,i)=>rows.slice(i*size,(i+1)*size));assert.deepEqual(pages.flat(),rows);assert.ok(pages.at(-1).length<=size);}
 const oldPage=3,first=(oldPage-1)*tall,next=pageAfterResize(oldPage,tall,short,43);assert.ok(first>=(next-1)*short&&first<next*short);assert.equal(pageAfterResize(10,12,20,2),1);
});
const task=(id,projectId,orderId,businessNo,hospital,patientName)=>({id,projectId,orderId,businessNo,sharedBusiness:true,accessible:true,assigneeId:'chen-yu',projectCreatedAt:'2026-11-20',agreedDueAt:'2026-12-01',title:'同名项目',patient:'internal',patientName,hospital,taskType:'三维重建',owner:'陈屿',updated:'2026-11-21',review:[{time:'2026-11-20T09:00:00',actor:'提交人',status:'已提交审核',note:'原始提交'},{time:'2026-11-20T10:00:00',actor:'实际审核人',status:'审核通过',note:'实际审核意见'}]});
test('same-name cases stay distinct by task/project/order IDs; reviewer identity and AND filters remain exact',()=>{
 const tasks=[task('t1','p1','o1','CV-2026-0001','医院甲','同名患者'),task('t2','p2','o2','CV-2026-0002','医院乙','同名患者')],original=structuredClone(tasks),rows=reviewRecords(tasks,[]);assert.equal(rows.length,4);assert.equal(new Set(rows.map(r=>r.recordId)).size,4);
 const chosen=filterReviewRecords(rows,{project:'0002',stage:'三维重建',status:'审核通过'});assert.equal(chosen.length,1);assert.equal(chosen[0].task.id,'t2');assert.equal(chosen[0].orderId,'o2');assert.equal(chosen[0].hospital,'医院乙');assert.equal(chosen[0].reviewerName,'实际审核人');assert.equal(chosen[0].note,'实际审核意见');
 assert.equal(filterReviewRecords(rows,{project:'0002',stage:'CAD 设计',status:'审核通过'}).length,0);assert.ok(rows.filter(r=>r.status==='已提交审核').every(r=>r.reviewerName==='-'));assert.deepEqual(tasks,original);
});
test('shared adapters cover all complete lists without altering export semantics',async()=>{
 for(const file of['src/admin/AdminTable.tsx','src/sales/SalesWorkspace.tsx','src/projects/ProjectPages.tsx','src/sales/business/InsuranceSummary.tsx'])assert.ok((await readFile(file,'utf8')).includes('useViewportPagination'),file);
 const insurance=await readFile('src/sales/business/InsuranceSummary.tsx','utf8');assert.deepEqual([...insurance.matchAll(/title: '([^']+)'/g)].map(m=>m[1]),['订单编号','手术项目名称','医院','患者','性别','身份证号','审核设计成果','完成时间']);assert.ok(insurance.includes("JSON.stringify({ month, ids })"));
});
