import {build} from 'esbuild';
import {mkdirSync,cpSync,copyFileSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {brotliCompressSync,constants} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {createPreviewStore} from './store.mjs';
import {AuthService} from '../../../server/auth/service.mjs';
const base='.local/presentation-20261117',target=base+'/deploy',out=target+'/.vercel/output',func=out+'/functions/auth.func';
mkdirSync(func,{recursive:true});
copyFileSync('.local/presentation-20261112/cloud/.vercel/project.json',target+'/.vercel/project.json');
const project=JSON.parse(readFileSync(target+'/.vercel/project.json','utf8'));
if(project.projectId!=='prj_ZoiOp3jFxDt6IyPOsBkD9sPPRcnp'||project.orgId!=='team_A5XHIhGRBN6rFwrZN3D5j8fC')throw Error('Wrong Preview project');
let config;
try{config=JSON.parse(readFileSync(base+'/runtime-config.json','utf8'))}catch{config={namespace:randomBytes(20).toString('hex'),stateKey:randomBytes(32).toString('hex'),accessKey:randomBytes(24).toString('hex'),demoCode:'246810',projectId:project.projectId};writeFileSync(base+'/runtime-config.json',JSON.stringify(config),{mode:0o600})}
const envFile=readFileSync('.local/presentation-20261112/cloud/.env.preview','utf8');
const tokenLine=envFile.split('\n').find(line=>line.startsWith('BLOB_READ_WRITE_TOKEN='));if(!tokenLine)throw Error('Existing private Preview Blob environment is required');
process.env.BLOB_READ_WRITE_TOKEN=JSON.parse(tokenLine.slice(tokenLine.indexOf('=')+1));
const store=createPreviewStore(config);
let initialized=false;try{await store.load('auth');initialized=true}catch(e){if(e.name!=='BlobNotFoundError'&&!e.message.includes('演示存储不可用'))throw e}
if(!initialized){
 const original=JSON.parse(readFileSync('.local/presentation-20261109/isolated-data/accounts.json','utf8'));
 const accounts=original.filter(a=>['13800000001','13800000002'].includes(a.phone)&&a.status==='approved');if(accounts.length!==2)throw Error('Exactly two confirmed synthetic role accounts are required');
 const auth=new AuthService({mode:'local'}),password='CliniVolDemo2026';for(const a of accounts)auth.setPassword(a,password);
 await store.initialize('auth',{accounts});await store.initialize('sales',{records:{invites:[],leads:[],files:[]},proof:{}});await store.initialize('business',{records:{imports:{},patients:{},shares:{},samples:{},audit:[],orders:{}},proof:{},projections:[],scopes:[]});
 writeFileSync(base+'/demo-credentials.json',JSON.stringify({phones:accounts.map(a=>a.phone),password,code:config.demoCode}),{mode:0o600});
}
cpSync('dist',out+'/static',{recursive:true});mkdirSync(func+'/protected-assets',{recursive:true});writeFileSync(func+'/protected-assets/HumanSkull_Jaw.stl.br',brotliCompressSync(readFileSync('public/assets/cad/HumanSkull_Jaw.stl'),{params:{[constants.BROTLI_PARAM_QUALITY]:6}}));rmSync(func+'/protected-assets/HumanSkull_Jaw.stl',{force:true});rmSync(out+'/static/assets/cad',{recursive:true,force:true});cpSync('server/business/fixtures',func+'/fixtures',{recursive:true});
writeFileSync(func+'/runtime-config.json',JSON.stringify(config),{mode:0o600});
await build({entryPoints:['scripts/presentation/v35/runtime.mjs'],outfile:func+'/index.mjs',bundle:true,platform:'node',format:'esm',target:'node24',banner:{js:"import {createRequire as __createRequire} from 'node:module';const require=__createRequire(import.meta.url);"},plugins:[{name:'isolated-preview-only-guards',setup(builder){builder.onLoad({filter:/server\/(auth\/.*|business\/(plugin|previewModel))\.mjs$/},args=>{let contents=readFileSync(args.path,'utf8');if(args.path.endsWith('/previewModel.mjs'))contents="import {brotliDecompressSync} from 'node:zlib';\n"+contents.replace("readFileSync(new URL('../../public/assets/cad/HumanSkull_Jaw.stl', import.meta.url))","brotliDecompressSync(readFileSync(new URL('./protected-assets/HumanSkull_Jaw.stl.br', import.meta.url)))");contents=contents.replaceAll("process.env.NODE_ENV==='production'","process.env.VERCEL_ENV!=='preview'").replaceAll("process.env.NODE_ENV!=='production'","process.env.VERCEL_ENV==='preview'").replaceAll("process.env.NODE_ENV === 'production'","process.env.VERCEL_ENV !== 'preview'");return{contents,loader:'js'}})}}]});
writeFileSync(func+'/.vc-config.json',JSON.stringify({runtime:'nodejs24.x',handler:'index.mjs',launcherType:'Nodejs',maxDuration:60}));
writeFileSync(out+'/config.json',JSON.stringify({version:3,routes:[{src:'/demo-access',dest:'/auth'},{src:'/api/.*',dest:'/auth'},{src:'/assets/cad/.*',dest:'/auth'},{handle:'filesystem'},{src:'/.*',dest:'/index.html'}]}));
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();writeFileSync(base+'/source.json',JSON.stringify({commit,projectId:project.projectId,environment:'preview',namespace:config.namespace},null,2));
console.log('Prepared isolated A Preview. Auth/invitations/business state encrypted in existing private Blob. Source CAD file protected. No production settings changed.');
