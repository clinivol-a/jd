import {build} from 'esbuild';
import {mkdirSync,copyFileSync,cpSync,readFileSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
const base='.local/presentation-20261112/cloud/.vercel',out=base+'/output',func=out+'/functions/auth.func';mkdirSync(func,{recursive:true});
copyFileSync('.local/presentation-20261109/deploy/.vercel/project.json',base+'/project.json');
cpSync('dist',out+'/static',{recursive:true});cpSync('server/auth',func+'/auth',{recursive:true});
// Adapter copy can only run in Vercel Preview; original local and production guards stay untouched.
for(const f of ['service.mjs','http.mjs','demoScan.mjs','registrationSupport.mjs']){const p=func+'/auth/'+f;let s=readFileSync(p,'utf8');s=s.replaceAll("process.env.NODE_ENV==='production'","process.env.VERCEL_ENV!=='preview'").replaceAll("process.env.NODE_ENV!=='production'","process.env.VERCEL_ENV==='preview'");writeFileSync(p,s)}
copyFileSync('scripts/presentation/handler.mjs',func+'/index.mjs');
copyFileSync('scripts/presentation/sales-cloud.mjs',func+'/sales-cloud.mjs');
copyFileSync('server/sales-demo.mjs',func+'/sales-demo.mjs');
copyFileSync('server/sales-invite-proof.mjs',func+'/sales-invite-proof.mjs');
let sales=readFileSync(func+'/sales-demo.mjs','utf8').replace('../src/sales/orderRules.mjs','./orderRules.mjs');writeFileSync(func+'/sales-demo.mjs',sales);copyFileSync('src/sales/orderRules.mjs',func+'/orderRules.mjs');
await build({entryPoints:[func+'/index.mjs'],outfile:func+'/bundled.mjs',bundle:true,platform:'node',format:'esm',target:'node24',banner:{js:"import {createRequire as __createRequire} from 'node:module';const require=__createRequire(import.meta.url);"}});copyFileSync(func+'/bundled.mjs',func+'/index.mjs');writeFileSync(func+'/state-key',randomBytes(32),{mode:0o600});
const invite=randomBytes(24).toString('hex');writeFileSync(func+'/invite-key',invite,{mode:0o600});
const original=JSON.parse(readFileSync('.local/presentation-20261109/isolated-data/accounts.json','utf8'));
const accounts=original.filter(a=>['13800000001','13800000002'].includes(a.phone)&&a.status==='approved');if(accounts.length!==2)throw Error('Two approved synthetic presentation accounts required');writeFileSync(func+'/accounts.json',JSON.stringify(accounts),{mode:0o600});
writeFileSync(func+'/.vc-config.json',JSON.stringify({runtime:'nodejs24.x',handler:'index.mjs',launcherType:'Nodejs',maxDuration:60}));
writeFileSync(out+'/config.json',JSON.stringify({version:3,routes:[{src:'/api/sales-demo/.*',dest:'/auth'},{src:'/api/auth/.*',dest:'/auth'},{src:'/demo-access',dest:'/auth'},{handle:'filesystem'},{src:'/.*',dest:'/index.html'}]}));
writeFileSync('.local/presentation-20261112/cloud/invite-key',invite,{mode:0o600});console.log('Prepared isolated Preview with cloud authentication; secrets stay in ignored server bundle.');
