import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
const dir=await mkdtemp(tmpdir()+'/cv-patient-display-');
async function bundled(source,name){const outfile=dir+'/'+name+'.mjs';await build({entryPoints:[source],bundle:true,platform:'node',format:'esm',outfile});return import(pathToFileURL(outfile));}
const {patientDisplayName}=await bundled('src/projects/patientDisplay.ts','display');
const {withDemoProjects,projectsFor}=await bundled('src/projects/projectModel.ts','projects');
test.after(()=>rm(dir,{recursive:true,force:true}));
test('all eight catalog projects show the same patient name in project and every task without replacing identifiers',()=>{
 const projects=withDemoProjects([]),before=structuredClone(projects);
 for(const p of projects){assert.ok(['沈嘉宁','顾清禾'].includes(p.patientName));assert.ok(p.patient.startsWith('CV-P-'));for(const t of p.tasks)assert.equal(patientDisplayName(t),p.patientName);}
 const reconstructed=projectsFor(projects.flatMap(p=>p.tasks),[]);for(const p of reconstructed)assert.equal(p.patientName,projects.find(x=>x.id===p.id).patientName);assert.deepEqual(projects,before);
});
test('known original task names match across upstream and CAD while all original IDs stay unchanged',()=>{
 const source={id:'004',orderNo:'CV261019-0211',patient:'CV-P-2026-0211'};assert.equal(patientDisplayName(source),'顾清禾');assert.equal(patientDisplayName({...source,id:'005'}),'顾清禾');assert.equal(source.patient,'CV-P-2026-0211');
});
test('actual supplied names always win and unknown or production identities are never filled from demo names',()=>{
 const source={id:'001',orderNo:'CV260910-0184',patient:'CV-P-2026-0184'};
 assert.equal(patientDisplayName({...source,patientName:' 已有患者姓名 '}),'已有患者姓名');assert.equal(patientDisplayName({...source,dataOrigin:'production'}),'—');assert.equal(patientDisplayName({...source,dataOrigin:'production',patientName:'保留原姓名'}),'保留原姓名');
 assert.equal(patientDisplayName({...source,id:'foreign-task'}),'—');assert.equal(patientDisplayName({...source,orderNo:'unknown-project'}),'—');assert.equal(patientDisplayName({...source,patient:'different-person'}),'—');
});
