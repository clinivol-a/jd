// Preview-only deployment adapter. Core authentication/business services remain unchanged.
import {readFileSync} from 'node:fs';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {AuthService} from '../../../server/auth/service.mjs';
import {createAuthServer} from '../../../server/auth/http.mjs';
import {BusinessService} from '../../../server/business/service.mjs';
import {businessDesignPlugin} from '../../../server/business/plugin.mjs';
import {previewModel} from '../../../server/business/previewModel.mjs';
import {salesDemoPlugin} from '../../../server/sales-demo.mjs';
import {InviteProof} from '../../../server/sales-invite-proof.mjs';
import {createPreviewStore} from './store.mjs';
import {invoke} from './request.mjs';
const config=JSON.parse(readFileSync(new URL('./runtime-config.json',import.meta.url),'utf8'));
const store=createPreviewStore(config);
const authFields=['accounts','devices','scans','codes','proofs','oauthStates','attempts','audit','testInbox','riskPermits','challenges','phoneSendAttempts','organizationRequests'];
const cookies=h=>Object.fromEntries((h||'').split(';').map(v=>{const i=v.indexOf('=');return[v.slice(0,i).trim(),v.slice(i+1)]}));
const equal=(a,b)=>typeof a==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
function hydrateAuth(state,origin){const s=new AuthService({mode:'local',demoMode:true,testConsole:true,publicOrigin:'',riskEnforced:false,smsProvider:async()=>{}});s.publicOrigin=origin;for(const f of authFields)if(state[f]!==undefined)s[f]=s[f] instanceof Map?new Map(state[f]):structuredClone(state[f]);return s}
function snapshotAuth(s){const state={};for(const f of authFields)state[f]=s[f] instanceof Map?[...s[f]]:s[f];state.audit=state.audit.slice(-150);return state}
function normalizeCode(proofs,scope,phone,code){if(equal(String(code||''),config.demoCode)){const pending=proofs.codes.get(scope+':'+phone);if(pending)return pending.code}return code}
function output(res,r){res.statusCode=r.status;for(const[k,v]of Object.entries(r.headers||{}))res.setHeader(k,v);res.end(r.body)}
function json(status,value){return{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'},body:Buffer.from(JSON.stringify(value))}}
export default async function handler(req,res){
 if(process.env.VERCEL_ENV!=='preview'||process.env.VERCEL_PROJECT_ID&&process.env.VERCEL_PROJECT_ID!==config.projectId){res.statusCode=404;return res.end()}
 res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
 const origin='https://'+req.headers.host,u=new URL(req.url,origin),c=cookies(req.headers.cookie);
 if(u.pathname==='/demo-access'){
  if(!equal(u.searchParams.get('demo'),config.accessKey))return output(res,json(403,{error:'汇报邀请链接无效。'}));
  res.setHeader('Set-Cookie',`cv_presentation=${config.accessKey}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);res.statusCode=302;res.setHeader('Location','/#auth/sms');return res.end();
 }
 const admitted=equal(c.cv_presentation,config.accessKey);
 const publicSales=/^\/api\/sales-demo\/public(?:-(?:code|verify|upload|file))?$/.test(u.pathname);
 const publicBusiness=/^\/api\/business-v31\/public-(?:info|code|verify|image|model|open|viewed)$/.test(u.pathname);
 const publicAuth=['/api/auth/session','/api/auth/scan/inspect','/api/auth/scan/confirm','/api/auth/scan/cancel'].includes(u.pathname);
 if(u.pathname.startsWith('/api/auth/dev/')||u.pathname==='/api/sales-demo/codes'||u.pathname.startsWith('/api/business-v31/sample'))return output(res,json(404,{error:'接口不存在。'}));
 if(!admitted&&!publicSales&&!publicBusiness&&!publicAuth)return output(res,json(403,{error:'请使用完整的汇报邀请链接。'}));
 if(!['GET','HEAD'].includes(req.method)&&req.headers.origin!==origin)return output(res,json(403,{error:'请求来源不允许。'}));
 try{
  let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>4200000)return output(res,json(413,{error:'本次演示请使用小于3MB的资料。'}))}
  const body=raw?JSON.parse(raw):undefined;
  if(u.pathname.startsWith('/api/auth/')){
   const r=await store.transaction('auth',async state=>{
    const s=hydrateAuth(state,origin),d=s.device(c.cv_auth_device||'');
    const input=body?structuredClone(body):undefined;
    if(u.pathname==='/api/auth/otp/verify'&&equal(String(input?.code||''),config.demoCode)){
     const saved=s.testInbox.get(d.id+':'+input.phone+':'+input.purpose);if(saved)input.code=saved.code;
    }
    const headers={...req.headers,host:'127.0.0.1:5210',origin:'http://127.0.0.1:5210'};for(const h of ['x-forwarded-host','x-forwarded-proto','forwarded','cf-connecting-ip','x-clinivol-dev-console'])delete headers[h];
    const server=createAuthServer(s,{origin:'http://127.0.0.1:5210',secure:true});
    const r=await invoke(server.listeners('request')[0],{url:u.pathname+u.search,method:req.method,headers,body:input});Object.assign(state,snapshotAuth(s));return r;
   });return output(res,r);
  }
  const auth=hydrateAuth((await store.load('auth')).state,origin),device=auth.device(c.cv_auth_device||''),session=auth.session(device);
  if(u.pathname.startsWith('/assets/cad/')){
   if(!admitted||session.locked||session.user?.role!=='designer')return output(res,json(403,{error:'请使用设计师账号。'}));
   if(u.pathname!=='/assets/cad/HumanSkull_Jaw.stl')return output(res,json(404,{error:'资料不存在。'}));
   res.setHeader('Content-Type','application/octet-stream');res.setHeader('Content-Encoding','br');res.setHeader('Vary','Accept-Encoding');return res.end(readFileSync(new URL('./protected-assets/HumanSkull_Jaw.stl.br',import.meta.url)));
  }
  if(u.pathname.startsWith('/api/sales-demo/')){
   const r=await store.transaction('sales',async state=>{
    const proof=new InviteProof();for(const f of ['codes','proofs','files'])proof[f]=new Map(state.proof?.[f]||[]);
    const input=body?structuredClone(body):undefined;if(u.pathname==='/api/sales-demo/public-verify')input.code=normalizeCode(proof,u.searchParams.get('token'),input.phone,input.code);
    const plugin=salesDemoPlugin('',undefined,{getSession:()=>session,publicOrigin:origin,proofService:proof,allowTestInbox:false,exposeDemoCode:false,loadRecords:async()=>state.records,saveRecords:async records=>{state.records=records}});
    let middleware;await plugin.configureServer({config:{server:{port:443}},middlewares:{use(fn){middleware=fn}}});const r=await invoke(middleware,{url:u.pathname+u.search,method:req.method,headers:req.headers,body:input});state.proof={};for(const f of ['codes','proofs','files'])state.proof[f]=[...proof[f]];return r;
   });return output(res,r);
  }
  if(u.pathname.startsWith('/api/business-v31/')){
   const r=await store.transaction('business',async state=>{
    const service=new BusinessService({key:Buffer.from(config.stateKey,'hex'),state:state.records,resultModel:previewModel,image:readFileSync(new URL('./fixtures/approved-static-preview.png',import.meta.url)),resultImage:key=>/^[A-Za-z0-9-]+$/.test(key)?readFileSync(new URL('./fixtures/results/'+key+'.png',import.meta.url)):null});
    const share=service.share.bind(service);service.share=(user,body)=>share(user,body,origin);
    for(const f of ['codes','proofs','files'])service.proofs[f]=new Map(state.proof?.[f]||[]);
    service.projections=new Map(state.projections||[]);service.scopes=new Map((state.scopes||[]).map(([k,v])=>[k,new Set(v)]));
    const input=body?structuredClone(body):undefined;if(u.pathname==='/api/business-v31/public-verify')input.code=normalizeCode(service.proofs,'share:'+u.searchParams.get('token'),input.phone,input.code);
    const plugin=businessDesignPlugin({service,lan:false,getSession:()=>session});let middleware;await plugin.configureServer({config:{server:{port:443}},middlewares:{use(fn){middleware=fn}}});
    const r=await invoke(middleware,{url:u.pathname+u.search,method:req.method,headers:req.headers,body:input});state.records=service.state;state.proof={};for(const f of ['codes','proofs','files'])state.proof[f]=[...service.proofs[f]];state.projections=[...service.projections];state.scopes=[...service.scopes].map(([k,v])=>[k,[...v]]);return r;
   });return output(res,r);
  }
  return output(res,json(404,{error:'接口不存在。'}));
 }catch(e){console.error('Preview request failed',u.pathname,e.name,e.message);return output(res,json(503,{error:'演示服务暂时繁忙，请重试。'}))}
}
