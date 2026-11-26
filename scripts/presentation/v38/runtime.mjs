// Isolated reporting Preview: reuse the confirmed services without changing their production guards.
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {timingSafeEqual} from 'node:crypto';
import {AuthService} from '../../../server/auth/service.mjs';
import {createAuthServer} from '../../../server/auth/http.mjs';
import {AdminService} from '../../../server/admin/service.mjs';
import {adminHandler} from '../../../server/admin/http.mjs';
import {BusinessService} from '../../../server/business/service.mjs';
import {businessDesignPlugin} from '../../../server/business/plugin.mjs';
import {previewModel} from '../../../server/business/previewModel.mjs';
import {linkedResultImage} from '../../../server/business/linkedPreview.mjs';
import {salesDemoPlugin} from '../../../server/sales-demo.mjs';
import {InviteProof} from '../../../server/sales-invite-proof.mjs';
import {createPreviewStore} from '../v35/store.mjs';
import {invoke} from '../v35/request.mjs';
const config=JSON.parse(readFileSync(new URL('./runtime-config.json',import.meta.url),'utf8'));
const cloud=createPreviewStore(config);
const fields=['devices','scans','codes','proofs','oauthStates','attempts','audit','riskPermits','challenges','phoneSendAttempts'];
const paths=['auth/accounts.json','auth/organizations.json','auth/application-roles.json','admin/state.json','institution-directory/state.json','unified-business/state.json'];
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const cookies=h=>Object.fromEntries((h||'').split(';').map(x=>{const i=x.indexOf('=');return[x.slice(0,i).trim(),x.slice(i+1)]}));
const json=(status,value)=>({status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'},body:Buffer.from(JSON.stringify(value))});
function output(res,r){res.statusCode=r.status;for(const[k,v]of Object.entries(r.headers||{}))res.setHeader(k,v);res.end(r.body)}
const normalize=(proofs,scope,phone,code)=>{if(equal(String(code||''),config.demoCode)){const pending=proofs.codes.get(scope+':'+phone);if(pending)return pending.code}return code};
export async function dispatch(state,{url,method='GET',headers={},body},origin){
 const dir=mkdtempSync(join(tmpdir(),'clinivol-preview-'));
 try{
  for(const path of paths){const file=join(dir,path);mkdirSync(join(file,'..'),{recursive:true,mode:0o700});writeFileSync(file,JSON.stringify(state.files[path]),{mode:0o600})}
  state.demoCodes||={};
  const auth=new AuthService({directory:join(dir,'auth'),mode:'local',demoMode:true,testConsole:false,publicOrigin:origin,riskEnforced:false,smsProvider:async(phone,code,purpose)=>{state.demoCodes[auth.device(cookies(headers.cookie).cv_auth_device||'').id+':'+phone+':'+purpose]=code}});
  for(const field of fields)if(state.auth?.[field]!==undefined)auth[field]=auth[field] instanceof Map?new Map(state.auth[field]):structuredClone(state.auth[field]);
  const admin=new AdminService({directory:join(dir,'admin'),authService:auth,invitationProvider:()=>state.sales.records,shareProvider:()=>state.business.records});
  const u=new URL(url,origin),input=body?structuredClone(body):undefined;
  const c=cookies(headers.cookie),device=auth.device(c.cv_auth_device||''),session=auth.session(device);
  let result;
  if(u.pathname.startsWith('/api/auth/')||u.pathname.startsWith('/api/admin/')){
   if(u.pathname==='/api/auth/otp/verify'&&equal(String(input?.code||''),config.demoCode)){
    const pending=auth.codes.get(device.id+':'+input.phone+':'+input.purpose);
    if(pending&&state.demoCodes[device.id+':'+input.phone+':'+input.purpose])input.code=state.demoCodes[device.id+':'+input.phone+':'+input.purpose];
   }
   const server=createAuthServer(auth,{origin,secure:true,adminHandler:adminHandler(auth,admin,{origin})});
   result=await invoke(server.listeners('request')[0],{url,method,headers,body:input});
   if(u.pathname==='/api/auth/otp/send'&&result.status===200){const value=JSON.parse(result.body);value.delivery='sms';result=json(200,value)}
  }else if(u.pathname.startsWith('/assets/cad/')){
   if(session.locked||session.user?.role!=='designer')result=json(403,{error:'请使用设计师账号。'});
   else if(u.pathname!=='/assets/cad/HumanSkull_Jaw.stl')result=json(404,{error:'资料不存在。'});
   else result={status:200,headers:{'content-type':'application/octet-stream','content-encoding':'br','vary':'Accept-Encoding'},body:readFileSync(new URL('./protected-assets/HumanSkull_Jaw.stl.br',import.meta.url))};
  }else if(u.pathname.startsWith('/api/sales-demo/')){
   const proof=new InviteProof();for(const f of ['codes','proofs','files'])proof[f]=new Map(state.sales.proof?.[f]||[]);
   if(u.pathname==='/api/sales-demo/public-verify')input.code=normalize(proof,u.searchParams.get('token'),input.phone,input.code);
   const plugin=salesDemoPlugin('',undefined,{getSession:()=>session,publicOrigin:origin,proofService:proof,allowTestInbox:false,exposeDemoCode:false,loadRecords:async()=>state.sales.records,saveRecords:async records=>{state.sales.records=records}});
   let middleware;await plugin.configureServer({config:{server:{port:443}},middlewares:{use(fn){middleware=fn}}});result=await invoke(middleware,{url,method,headers,body:input});
   state.sales.proof=Object.fromEntries(['codes','proofs','files'].map(f=>[f,[...proof[f]]]));
  }else if(u.pathname.startsWith('/api/business-v31/')){
   const service=new BusinessService({key:Buffer.from(config.stateKey,'hex'),state:state.business.records,sharedCatalog:()=>({...admin.shared.reload(),...admin.institutions.snapshot()}),linkedResultImage,demoShareCodes:true,resultModel:previewModel,image:readFileSync(new URL('./fixtures/approved-static-preview.png',import.meta.url)),resultImage:key=>/^[A-Za-z0-9-]+$/.test(key)?readFileSync(new URL('./fixtures/results/'+key+'.png',import.meta.url)):null});
   for(const f of ['codes','proofs','files'])service.proofs[f]=new Map(state.business.proof?.[f]||[]);
   service.projections=new Map(state.business.projections||[]);service.scopes=new Map((state.business.scopes||[]).map(([k,v])=>[k,new Set(v)]));
   const share=service.share.bind(service);service.share=(user,body)=>share(user,body,origin);
   if(u.pathname==='/api/business-v31/public-verify')input.code=normalize(service.proofs,'share:'+u.searchParams.get('token'),input.phone,input.code);
   const plugin=businessDesignPlugin({service,lan:false,getSession:()=>session});let middleware;await plugin.configureServer({config:{server:{port:443}},middlewares:{use(fn){middleware=fn}}});result=await invoke(middleware,{url,method,headers,body:input});
   state.business.records=service.state;state.business.proof=Object.fromEntries(['codes','proofs','files'].map(f=>[f,[...service.proofs[f]]]));state.business.projections=[...service.projections];state.business.scopes=[...service.scopes].map(([k,v])=>[k,[...v]]);
  }else result=json(404,{error:'接口不存在。'});
  auth.persist();for(const path of paths)state.files[path]=JSON.parse(readFileSync(join(dir,path),'utf8'));
  state.auth=Object.fromEntries(fields.map(f=>[f,auth[f] instanceof Map?[...auth[f]]:auth[f]]));
  return result;
 }finally{rmSync(dir,{recursive:true,force:true})}
}
export default async function handler(req,res){
 if(process.env.VERCEL_ENV!=='preview'||process.env.VERCEL_PROJECT_ID!==config.projectId)return output(res,json(404,{error:'接口不存在。'}));
 res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
 const origin='https://'+req.headers.host,u=new URL(req.url,origin),admitted=equal(cookies(req.headers.cookie).cv_presentation,config.accessKey);
 if(u.pathname==='/demo-access'){
  if(!equal(u.searchParams.get('demo'),config.accessKey))return output(res,json(403,{error:'汇报邀请链接无效。'}));
  res.setHeader('Set-Cookie',`cv_presentation=${config.accessKey}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);res.statusCode=302;res.setHeader('Location','/#auth/sms');return res.end();
 }
 if(u.pathname.startsWith('/api/auth/dev/')||u.pathname==='/api/sales-demo/codes'||/^\/api\/business-v31\/(?:sample|test-inbox)/.test(u.pathname))return output(res,json(404,{error:'接口不存在。'}));
 const publicPath=/^\/api\/sales-demo\/public(?:-(?:code|verify|upload|file))?$/.test(u.pathname)||/^\/api\/business-v31\/public-(?:info|code|verify|image|model|open|viewed)$/.test(u.pathname)||['/api/auth/session','/api/auth/scan/inspect','/api/auth/scan/confirm','/api/auth/scan/cancel'].includes(u.pathname);
 if(!admitted&&!publicPath)return output(res,json(403,{error:'请使用完整的汇报邀请链接。'}));
 if(!['GET','HEAD'].includes(req.method)&&req.headers.origin!==origin)return output(res,json(403,{error:'请求来源不允许。'}));
 try{
  let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>4200000)return output(res,json(413,{error:'本次演示请使用小于3MB的资料。'}))}
  const body=raw?JSON.parse(raw):undefined;
  const result=await cloud.transaction('all-v38',state=>dispatch(state,{url:req.url,method:req.method,headers:req.headers,body},origin));output(res,result);
 }catch(e){console.error('Preview request failed',u.pathname,e.name,e.message);output(res,json(503,{error:'演示服务暂时繁忙，请重试。'}))}
}
