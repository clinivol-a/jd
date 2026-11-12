// Isolated synthetic presentation runtime. No production identity or business data.
import {readFileSync} from 'node:fs';
import {randomBytes,createCipheriv,createDecipheriv,timingSafeEqual} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {AuthService} from './auth/service.mjs';
import {createAuthServer} from './auth/http.mjs';
const key=readFileSync(new URL('./state-key',import.meta.url));
const invite=readFileSync(new URL('./invite-key',import.meta.url),'utf8').trim();
const seeds=JSON.parse(readFileSync(new URL('./accounts.json',import.meta.url),'utf8'));
const equal=(a,b)=>typeof a==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const fields=['accounts','devices','codes','proofs','attempts','audit','testInbox','riskPermits','challenges','phoneSendAttempts','organizationRequests'];
function seal(state){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv);return Buffer.concat([iv,c.update(gzipSync(Buffer.from(JSON.stringify(state)))),c.final(),c.getAuthTag()]).toString('base64url')}
function unseal(value){const b=Buffer.from(value,'base64url'),d=createDecipheriv('aes-256-gcm',key,b.subarray(0,12));d.setAuthTag(b.subarray(-16));return JSON.parse(gunzipSync(Buffer.concat([d.update(b.subarray(12,-16)),d.final()])).toString())}
export default async function handler(req,res){
 if(process.env.VERCEL_ENV!=='preview'){res.statusCode=404;res.end();return}
 res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
 const cookies=Object.fromEntries((req.headers.cookie||'').split(';').map(v=>v.trim().split('=')));
 const origin=`https://${req.headers.host}`,url=new URL(req.url,origin);
 if(url.pathname==='/demo-access'&&equal(url.searchParams.get('demo'),invite)){
  res.setHeader('Set-Cookie',`cv_presentation=${invite}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=172800`);res.statusCode=302;res.setHeader('Location','/#auth/login');res.end();return;
 }
 if(!equal(cookies.cv_presentation,invite)){res.statusCode=403;res.end(JSON.stringify({error:'请使用完整的汇报邀请链接。'}));return}
 if(req.method!=='GET'&&req.headers.origin!==origin){res.statusCode=403;res.end();return}
 const s=new AuthService({mode:'local',demoMode:true,testConsole:true,smsProvider:async()=>{}});
 s.accounts=structuredClone(seeds);
 try{const n=Number(cookies.cv_demo_n||0);if(n>0&&n<=20){const saved=unseal(Array.from({length:n},(_,i)=>cookies['cv_demo_'+i]||'').join(''));if(saved.expires>Date.now())for(const f of fields)if(saved[f]!==undefined)s[f]=s[f] instanceof Map?new Map(saved[f]):saved[f]}}catch{}
 const before=JSON.stringify(fields.map(f=>s[f] instanceof Map?[...s[f]]:s[f]));
 const server=createAuthServer(s,{origin:'http://127.0.0.1:5210',secure:true,devConsoleKey:invite});
 req.headers.origin='http://127.0.0.1:5210';delete req.headers['x-forwarded-host'];delete req.headers['x-forwarded-proto'];delete req.headers.forwarded;delete req.headers['cf-connecting-ip'];
 if(url.pathname.startsWith('/api/auth/dev/'))req.headers['x-clinivol-dev-console']=invite;
 const end=res.end.bind(res);
 res.end=(...args)=>{if(!res.headersSent&&before!==JSON.stringify(fields.map(f=>s[f] instanceof Map?[...s[f]]:s[f]))){const state={expires:Date.now()+8*3600000};for(const f of fields)state[f]=s[f] instanceof Map?[...s[f]]:s[f];state.audit=state.audit.slice(-50);
 const value=seal(state),parts=value.match(/.{1,2800}/g)||[];
 if(parts.length>20){res.statusCode=413;return end(JSON.stringify({error:'演示会话内容过多，请重新进入。'}))}
 const old=res.getHeader('Set-Cookie'),set=old?(Array.isArray(old)?old:[old]):[];
 set.push(`cv_demo_n=${parts.length}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`);
 parts.forEach((p,i)=>set.push(`cv_demo_${i}=${p}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`));res.setHeader('Set-Cookie',set)}return end(...args)};
 return server.listeners('request')[0](req,res);
}
