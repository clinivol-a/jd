import test from 'node:test';import assert from 'node:assert/strict';
import {once} from 'node:events';
import {AuthService} from '../server/auth/service.mjs';
import {createAuthServer} from '../server/auth/http.mjs';
import {seedSuperAdmin} from '../server/admin/seedAccount.mjs';
test('V3.8 local console supports explicit preview origins, backend OTP and preserves admin accounts',async t=>{
 const service=new AuthService({mode:'local',demoMode:true,testConsole:true,riskEnforced:false,smsProvider:async()=>{}});service.seedLocal();seedSuperAdmin(service,{enabled:true});
 const before=structuredClone(service.accounts);const origin='http://127.0.0.1:5230',key='local-console-test-key';
 const server=createAuthServer(service,{origin,devConsoleKey:key,devConsoleOrigins:[origin,'http://localhost:5230','https://public.invalid']});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(r=>server.close(r)));
 const url=`http://127.0.0.1:${server.address().port}/api/auth/`;let cookie='';
 async function call(action,body={},from=origin,capability=key,extra={}){const r=await fetch(url+action,{method:'POST',headers:{Origin:from,'Content-Type':'application/json','X-CliniVol-Request':'1','X-CliniVol-Dev-Console':capability,...(cookie?{cookie}:{}),...extra},body:JSON.stringify(body)});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return r}
 assert.equal((await call('dev/state')).status,200);assert.equal((await call('dev/state',{},'http://localhost:5230')).status,200);
 assert.equal((await call('dev/state',{},origin,'')).status,404);assert.equal((await call('dev/state',{},'https://public.invalid')).status,403);assert.equal((await call('dev/state',{},origin,key,{'x-forwarded-proto':'https'})).status,404);
 assert.equal((await call('otp/send',{phone:'13800000001',purpose:'login'})).status,200);
 const state=await(await call('dev/state')).json();const otp=state.codes.find(c=>c.phone==='13800000001'&&c.purpose==='login');assert.match(otp.code,/^\d{6}$/);
 assert.equal((await call('otp/verify',{phone:otp.phone,purpose:'login',code:otp.code})).status,200);
 assert.equal((await call('dev/state')).status,200);assert.equal((await call('dev/reset')).status,409);assert.deepEqual(service.accounts,before);
 const previous=process.env.NODE_ENV;try{process.env.NODE_ENV='production';assert.equal((await call('dev/state')).status,404)}finally{if(previous===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=previous}
});
