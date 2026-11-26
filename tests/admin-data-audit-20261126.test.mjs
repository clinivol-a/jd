import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {AuthService} from '../server/auth/service.mjs';
import {AdminService} from '../server/admin/service.mjs';
import {managementPermissions} from '../server/admin/seed.mjs';
import {dataAuditTheme,assetFieldKeys,assetMatches,auditMatches,auditObjectName,auditOrderId,auditChanges,auditSafeValue,chronologicalRecords} from '../src/admin/dataAuditRules.mjs';
const state={orders:[{id:'order-1',businessNo:'CV-2026-0001',name:'颌骨修复规划',hospitalId:'h1'},{id:'order-2',businessNo:'CV-2026-0002',name:'颌骨修复规划',hospitalId:'h2'}],hospitals:[{id:'h1',name:'安徽省立医院'},{id:'h2',name:'合肥市第一人民医院'}],tasks:[{id:'task-1',orderId:'order-1'},{id:'task-2',orderId:'order-2'}],assets:[{id:'asset-1',orderId:'order-1',projectId:'project-1'}],people:[{id:'p1',name:'赵启明'}],doctors:[{id:'d1',name:'周明哲'}],organizations:[{id:'org-1',name:'科立沃'}],applicationRoles:[],auditObjects:[{id:'auth-1',name:'李明'}]};
const actor={id:'super-admin',name:'管理员',role:'super_admin',status:'approved',permissions:managementPermissions};
function setup(t){const directory=mkdtempSync(join(tmpdir(),'cv-data-audit-'));t.after(()=>rmSync(directory,{recursive:true,force:true}));const authService=new AuthService({directory:join(directory,'auth'),mode:'local',demoMode:true});authService.seedLocal();return new AdminService({directory:join(directory,'admin'),authService});}
test('asset filters use visible business fields and combine hospital, stage, review and publication',()=>{
 const a={...state.assets[0],name:'三维重建成果',stage:0,reviewStatus:'待审核',publishStatus:'未发布'};
 for(const query of ['CV-2026-0001','颌骨修复','安徽省立','三维重建'])assert(assetMatches(a,state,{query}));
 assert(!assetMatches(a,state,{query:'asset-1'}));assert(!assetMatches(a,state,{query:'order-1'}));
 assert(assetMatches(a,state,{hospitalId:'h1',stage:'0',status:'待审核',publishStatus:'未发布'}));
 for(const f of [{hospitalId:'h2'},{stage:'1'},{status:'审核通过'},{publishStatus:'已发布'}])assert(!assetMatches(a,state,f));
});
test('audit business objects resolve by stable IDs, not duplicate business names',()=>{
 for(const [objectId,expected]of [['task-1','CV-2026-0001'],['task-2','CV-2026-0002'],['asset-1','CV-2026-0001'],['project-1','CV-2026-0001'],['auth-1','李明'],['h1','安徽省立医院'],['p1','赵启明'],['unknown','-']])assert.equal(auditObjectName({objectId},state),expected);
 assert.equal(auditOrderId({objectId:'task-2'},state),'order-2');assert.equal(auditOrderId({objectId:'unknown'},state),null);
});
test('audit filters search actual presented fields, keep both reason and basis, and use local natural dates',()=>{
 const event={id:'e',objectId:'task-1',title:'权限审批通过',category:'机构与人员',actor:'管理员',result:'成功',at:'2026-01-01T00:01:00',reason:'资格核对完成',basis:'书面授权001'};
 assert(auditMatches(event,state,{query:'CV-2026-0001',category:'机构与成员',result:'成功',range:['2026-01-01','2026-01-01']}));
 for(const query of ['审核通过','资格核对','书面授权001','管理员'])assert(auditMatches(event,state,{query}));
 assert(!auditMatches(event,state,{query:'task-1'}));assert(!auditMatches(event,state,{range:['2025-12-31','2025-12-31']}));assert(!auditMatches({...event,at:'invalid'},state,{range:['2026-01-01','2026-01-02']}));
 assert(auditMatches({...event,at:'2025-12-31T23:59:00'},state,{range:['2025-12-31','2026-01-01']}));
});
test('audit changes show only readable changed fields and never dump credentials, IDs or source bytes',()=>{
 const changes=auditChanges({before:{status:'pending',leaderId:'p1',phone:'13800000001',passwordHash:'old'},after:{status:'approved',leaderId:'missing',phone:'13800000002',passwordHash:'new',token:'secret',content:'file'}},state);
 assert.deepEqual(changes.map(r=>r.label),['当前状态','负责组长','联系电话']);
 assert.deepEqual(changes[0],{id:'status',label:'当前状态',before:'待审核',after:'审核通过'});assert.equal(changes[1].before,'赵启明');assert.equal(changes[1].after,'-');assert.equal(changes[2].after,'138****0002');
 const raw={passwordHash:'x',salt:'y',phone:'13800000001',nested:{shareToken:'s',identityNumber:'i',content:'b',status:'审核通过'}};const before=JSON.stringify(raw),safe=auditSafeValue(raw);
 assert.deepEqual(safe,{phone:'138****0001',nested:{status:'审核通过'}});assert.equal(JSON.stringify(raw),before);
});
test('raw timestamp sorting is descending, stable and does not mutate persisted events',()=>{
 const rows=[{id:'a',at:'2025-12-31T23:59:00Z'},{id:'b',at:'2026-01-01T00:01:00Z'},{id:'a',at:'2025-12-31T23:59:00Z'}];const raw=JSON.stringify(rows);assert.deepEqual(chronologicalRecords(rows).map(r=>r.id),['b','a']);assert.equal(JSON.stringify(rows),raw);
});
test('snapshot resolves stage-specific asset names and reviewer; audit redaction leaves original history unchanged',t=>{
 const s=setup(t),asset=s.state.assets[0];asset.name='专业提交成果';asset.reviewStatus='审核通过';asset.submittedBy='p1';asset.reviewerId='p1';s.state.people.push({id:'p1',name:'赵启明',role:'业务组长',scope:[],permissions:[],status:'已启用'});
 s.state.events.push({id:'sensitive',objectId:asset.id,title:'成果已提交',category:'数据资产',actor:'陈屿',at:'2026-11-26T01:00:00Z',result:'成功',after:{status:'待审核',phone:'13800000001',passwordHash:'secret',nested:{token:'secret',bytes:[1,2]}}});
 const raw=JSON.stringify(s.state);const a=s.snapshot(actor).assets.find(a=>a.id===asset.id);assert.notEqual(a.name,'专业提交成果');assert.equal(a.reviewerName,'赵启明');
 const after=s.snapshot(actor).events.find(e=>e.id==='sensitive').after;assert.equal(after.phone,'138****0001');assert(!JSON.stringify(after).includes('secret'));assert(!('bytes'in after.nested));assert.equal(JSON.stringify(s.state),raw);
});
test('filtered export is exact, deduplicated, authorized and auditable; failed exports change no history',t=>{
 const s=setup(t),assets=s.snapshot(actor).assets;assert(assets.length>=2);const ids=[assets[1].id,assets[0].id,assets[1].id];const count=s.state.events.length;
 const result=s.command(actor,{action:'export-metadata',reason:'成果归档核对',assetIds:ids});assert.deepEqual(result.data.map(a=>a.id),ids.slice(0,2));assert(result.data.every(a=>a.businessNo===(s.snapshot(actor).orders.find(o=>o.id===a.orderId)?.businessNo||null)));assert(result.data.every(a=>Object.hasOwn(a,'designStage')&&Object.hasOwn(a,'hospital')&&Object.hasOwn(a,'submittedAt')&&Object.hasOwn(a,'reviewedAt')));
 assert.equal(s.state.events.length,count+1);assert.equal(s.state.events.at(-1).after.count,2);assert.deepEqual(s.state.events.at(-1).after.assetIds,ids.slice(0,2));
 assert(result.data.every(a=>!('patientName'in a)&&!('phone'in a)&&!('downloadUrl'in a)&&!('content'in a)));
 for(const assetIds of [['unknown'],[],[assets[0].id,42],'all'])assert.throws(()=>s.command(actor,{action:'export-metadata',reason:'归档',assetIds}));assert.equal(s.state.events.length,count+1);
 const limited={...actor,role:'admin',hospitalIds:[s.state.orders.find(o=>o.id===assets[0].orderId).hospitalId]},allowed=s.snapshot(limited).assets;
 const forbidden=assets.find(a=>!allowed.some(b=>b.id===a.id));assert(forbidden);assert.throws(()=>s.command(limited,{action:'export-metadata',reason:'范围核对',assetIds:[forbidden.id]}),e=>e.status===403);assert.equal(s.state.events.length,count+1);
});

test('trace and professional lists have distinct business fields; details reuse the same order',()=>{assert.deepEqual(assetFieldKeys('trace'),['order','name','hospital','stage','version','submitter','submitted']);assert.deepEqual(assetFieldKeys('professional'),['order','name','hospital','stage','version','review','reviewer','reviewed','publish']);});

test('missing review metadata is recovered only from the exact artifact and version event',t=>{
 const s=setup(t),a=s.state.assets[0];a.version='V02';a.reviewStatus='审核通过';delete a.reviewedAt;delete a.reviewerId;
 s.state.events.push({id:'wrong-version',objectId:a.taskId,resultId:a.id,resultVersion:'V01',type:'review-pass',actorId:'other',actor:'其他人员',at:'2026-11-26T12:00:00Z'},{id:'exact-review',objectId:a.taskId,resultId:a.id,resultVersion:'V02',type:'review-pass',actorId:actor.id,actor:'管理员',actorRole:'super_admin',at:'2026-11-25T12:00:00Z'});
 const result=s.snapshot(actor).assets.find(r=>r.id===a.id);assert.equal(result.reviewedAt,'2026-11-25T12:00:00Z');assert.equal(result.reviewerName,'管理员');assert.equal(a.reviewedAt,undefined);
});

test('audit failure semantics never become green because the label includes through',()=>{for(const value of ['未通过验证','验证失败','无访问权限','审核退回'])assert.equal(dataAuditTheme(value),'danger');assert.equal(dataAuditTheme('查看成功'),'success');assert.equal(dataAuditTheme('待审核'),'warning');assert.equal(dataAuditTheme('已记录'),'default');});

test('a designated reviewer on a pending asset is not presented as an already completed review',t=>{const s=setup(t),a=s.state.assets[0];a.reviewStatus='待审核';a.reviewerId=actor.id;a.reviewedAt='2026-11-25T12:00:00Z';const result=s.snapshot(actor).assets.find(r=>r.id===a.id);assert.equal(result.reviewerName,undefined);assert.equal(result.reviewedAt,undefined);assert.equal(a.reviewerId,actor.id);});
