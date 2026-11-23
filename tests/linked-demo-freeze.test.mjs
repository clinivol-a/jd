import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{execFileSync}from'node:child_process';
const baseline='b77b92da4ad8db5ac13637b00a04f0a1385be80f';
const prior=file=>execFileSync('git',['show',`${baseline}:${file}`],{maxBuffer:8*1024*1024});
test('all frozen UI, Header/Sidebar and professional code remain byte-identical to b77b92d',()=>{
 for(const file of['src/index.css','src/sales/sales.css','src/projects/projectPages.css','src/projects/ProjectPages.tsx','src/sales/OrderPages.tsx','src/admin/AdminWorkspace.tsx','src/design-system/tokens.css','src/cad/CadWorkspace.tsx','src/cad/cadProject.ts','src/auth/IntegrationRoot.tsx','src/auth/AuthPages.tsx'])assert.deepEqual(readFileSync(file),prior(file),file);
 const app=readFileSync('src/App.tsx','utf8'),old=prior('src/App.tsx').toString();const marker='function GlobalHeader(';assert.ok(app.includes(marker));assert.equal(app.slice(app.indexOf(marker)),old.slice(old.indexOf(marker)),'Header through professional workspaces unchanged');
 const sales=readFileSync('src/sales/SalesWorkspace.tsx','utf8'),before=prior('src/sales/SalesWorkspace.tsx').toString();const start='  const [collapsed,';assert.ok(sales.includes(start));assert.equal(sales.slice(sales.indexOf(start)),before.slice(before.indexOf(start)),'Only sales data refresh effect changed');
});
