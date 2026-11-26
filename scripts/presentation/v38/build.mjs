import {build} from 'esbuild';
import {mkdirSync,readFileSync,writeFileSync,copyFileSync,cpSync,rmSync,realpathSync,existsSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {brotliCompressSync,constants} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {createPreviewStore} from '../v35/store.mjs';
import {AuthService} from '../../../server/auth/service.mjs';
const base='.local/presentation-20261126',target=base+'/deploy',out=target+'/.vercel/output',func=out+'/functions/auth.func';
const prior='../clinivol-a-account-integration/.local/presentation-20261112/cloud';
mkdirSync(func,{recursive:true});copyFileSync(prior+'/.vercel/project.json',target+'/.vercel/project.json');
const project=JSON.parse(readFileSync(target+'/.vercel/project.json','utf8'));
if(project.projectId!=='prj_ZoiOp3jFxDt6IyPOsBkD9sPPRcnp'||project.orgId!=='team_A5XHIhGRBN6rFwrZN3D5j8fC')throw Error('Wrong Preview project');
let config;if(existsSync(base+'/runtime-config.json'))config=JSON.parse(readFileSync(base+'/runtime-config.json','utf8'));else{
 config={namespace:randomBytes(20).toString('hex'),stateKey:readFileSync('.local/business-v31/key').toString('hex'),accessKey:randomBytes(24).toString('hex'),demoCode:'246810',projectId:project.projectId};writeFileSync(base+'/runtime-config.json',JSON.stringify(config),{mode:0o600});
}
const env=readFileSync(prior+'/.env.preview','utf8'),line=env.split('\n').find(line=>line.startsWith('BLOB_READ_WRITE_TOKEN='));if(!line)throw Error('Missing existing Preview storage environment');process.env.BLOB_READ_WRITE_TOKEN=JSON.parse(line.slice(line.indexOf('=')+1));
const cloud=createPreviewStore(config);let initialized=false;try{await cloud.load('all-v38');initialized=true}catch(e){if(e.name!=='BlobNotFoundError'&&!e.message.includes('演示存储不可用'))throw e}
if(!initialized){
 const source='.local/institution-preview-20261124',paths=['auth/accounts.json','auth/organizations.json','auth/application-roles.json','admin/state.json','institution-directory/state.json','unified-business/state.json'];
 const files=Object.fromEntries(paths.map(path=>[path,JSON.parse(readFileSync(source+'/'+path,'utf8'))]));
 const ids=new Set(['chen-yu','super-admin','review-account-1','review-account-2','review-account-3']);
 files['auth/accounts.json']=files['auth/accounts.json'].filter(a=>ids.has(a.id)||a.phone==='13800000002');
 const auth=new AuthService({mode:'local',demoMode:true}),password='CliniVolDemo2026';
 for(const a of files['auth/accounts.json']){delete a.demoWechatId;delete a.demoWecomId;auth.setPassword(a,password)}
 const {BusinessService}=await import('../../../server/business/service.mjs');const service=new BusinessService({key:Buffer.from(config.stateKey,'hex')});
 const records=service.unseal(readFileSync('.local/business-v31/records.enc','utf8'));
 await cloud.initialize('all-v38',{files,auth:{},sales:{records:{invites:[],leads:[],files:[]},proof:{}},business:{records,proof:{},projections:[],scopes:[]},demoCodes:{}});
 writeFileSync(base+'/demo-credentials.json',JSON.stringify({phones:['13800000001','13800000002','13800000003'],password,code:config.demoCode}),{mode:0o600});
 console.log('Initialized isolated snapshot:',files['unified-business/state.json'].orders.length,'orders,',files['unified-business/state.json'].projects.length,'projects; existing local and online data untouched.');
}
rmSync(out+'/static',{recursive:true,force:true});cpSync('dist',out+'/static',{recursive:true});
mkdirSync(func+'/protected-assets',{recursive:true});writeFileSync(func+'/protected-assets/HumanSkull_Jaw.stl.br',brotliCompressSync(readFileSync('public/assets/cad/HumanSkull_Jaw.stl'),{params:{[constants.BROTLI_PARAM_QUALITY]:6}}));rmSync(out+'/static/assets/cad',{recursive:true,force:true});cpSync('server/business/fixtures',func+'/fixtures',{recursive:true});
writeFileSync(func+'/runtime-config.json',JSON.stringify(config),{mode:0o600});
await build({entryPoints:['scripts/presentation/v38/runtime.mjs'],outfile:func+'/index.mjs',bundle:true,platform:'node',format:'esm',target:'node24',external:['@napi-rs/canvas','pdfjs-dist/*'],banner:{js:"import {createRequire as __createRequire} from 'node:module';const require=__createRequire(import.meta.url);"},plugins:[{name:'preview-only-service-adapter',setup(builder){builder.onLoad({filter:/server\/.*\.mjs$/},args=>{let contents=readFileSync(args.path,'utf8');if(args.path.endsWith('/business/previewModel.mjs'))contents="import {brotliDecompressSync} from 'node:zlib';\n"+contents.replace("readFileSync(new URL('../../public/assets/cad/HumanSkull_Jaw.stl', import.meta.url))","brotliDecompressSync(readFileSync(new URL('./protected-assets/HumanSkull_Jaw.stl.br', import.meta.url)))");if(args.path.endsWith('/business/service.mjs'))contents=contents.replace("this.demoShareCodes&&/^\\d+$/.test(String(code))","false");contents=contents.replaceAll("process.env.NODE_ENV==='production'","process.env.VERCEL_ENV!=='preview'").replaceAll("process.env.NODE_ENV!=='production'","process.env.VERCEL_ENV==='preview'").replaceAll("process.env.NODE_ENV === 'production'","process.env.VERCEL_ENV !== 'preview'").replaceAll("process.env.NODE_ENV !== 'production'","process.env.VERCEL_ENV === 'preview'");return{contents,loader:'js'}})}}]});
for(const [source,name] of [['node_modules/@napi-rs/canvas','@napi-rs/canvas'],['/private/tmp/clinivol-deploy-cli/node_modules/@napi-rs/canvas-linux-x64-gnu','@napi-rs/canvas-linux-x64-gnu'],['node_modules/pdfjs-dist','pdfjs-dist']]){mkdirSync(func+'/node_modules/'+name.split('/').slice(0,-1).join('/'),{recursive:true});cpSync(realpathSync(source),func+'/node_modules/'+name,{recursive:true})}
writeFileSync(func+'/.vc-config.json',JSON.stringify({runtime:'nodejs24.x',handler:'index.mjs',launcherType:'Nodejs',maxDuration:60}));
writeFileSync(out+'/config.json',JSON.stringify({version:3,routes:[{src:'/demo-access',dest:'/auth'},{src:'/api/.*',dest:'/auth'},{src:'/assets/cad/.*',dest:'/auth'},{handle:'filesystem'},{src:'/.*',dest:'/index.html'}]}));
writeFileSync(base+'/source.json',JSON.stringify({commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),projectId:project.projectId,environment:'preview'},null,2));console.log('Prepared current A Preview; no production settings changed.');
