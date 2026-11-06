import test from 'node:test'
import assert from 'node:assert/strict'
import {once} from 'node:events'
import {AuthService} from '../server/auth/service.mjs'
import {createAuthServer} from '../server/auth/http.mjs'
test('HTTP desktop/mobile cookie sessions complete QR confirmation; CSRF and replay are rejected',async(t)=>{const service=new AuthService({mode:'local',publicOrigin:'https://isolated.invalid'});const account={id:'chen-yu',name:'陈屿',phone:'13800000001',role:'designer',permissions:['cad'],status:'approved'};service.setPassword(account,'HTTPPrivate2026');service.accounts.push(account);const server=createAuthServer(service,{origin:'http://localhost:5210'});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());const base=`http://127.0.0.1:${server.address().port}/api/auth/`;let desktopCookie='',mobileCookie='';async function call(action,body,mobile=false,extra={}){const response=await fetch(base+action,{method:body===undefined?'GET':'POST',headers:{Cookie:mobile?mobileCookie:desktopCookie,Origin:'http://localhost:5210','X-CliniVol-Request':'1','Content-Type':'application/json',...extra},body:body===undefined?undefined:JSON.stringify(body)});const cookie=response.headers.get('set-cookie');if(cookie){assert.ok(cookie.includes('HttpOnly'));assert.ok(cookie.includes('SameSite=Lax'));if(mobile)mobileCookie=cookie.split(';')[0];else desktopCookie=cookie.split(';')[0]}return {status:response.status,body:await response.json()}}
 await call('session');await call('session',undefined,true);assert.notEqual(desktopCookie,mobileCookie)
 assert.equal((await call('login/password',{phone:'13800000001',password:'HTTPPrivate2026',accepted:true},true,{Origin:'https://evil.invalid'})).status,403)
 const scan=(await call('scan/create',{accepted:true})).body,token=scan.url.split('/').at(-1)
 assert.equal((await call('scan/inspect',{id:scan.id,token},true)).body.status,'scanned')
 assert.equal((await call('scan/confirm',{id:scan.id,token},true)).status,401)
 assert.equal((await call('login/password',{phone:'13800000001',password:'HTTPPrivate2026',accepted:true},true)).body.user.id,'chen-yu')
 assert.equal((await call('scan/confirm',{id:scan.id,token},true)).body.status,'confirmed')
 assert.equal((await call('scan/status?id='+scan.id)).body.status,'confirmed')
 assert.equal((await call('scan/consume',{id:scan.id})).body.user.id,'chen-yu')
 assert.equal((await call('scan/consume',{id:scan.id})).status,409)
 assert.equal((await call('wechat/bind',{identity:'forged',accepted:true})).status,503)
 assert.equal((await call('wechat/start',{accepted:true})).status,503)
})
test('V1 HTTP SMS registration context rejects missing password and never authorizes a pending applicant',async(t)=>{
 const codes=[];const service=new AuthService({mode:'local',smsProvider:async(_p,code)=>codes.push(code)});
 const server=createAuthServer(service,{origin:'http://localhost:5210'});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());
 const base=`http://127.0.0.1:${server.address().port}/api/auth/`;let cookie='';
 async function call(action,body){const r=await fetch(base+action,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,Origin:'http://localhost:5210','X-CliniVol-Request':'1','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return {status:r.status,body:await r.json()}}
 await call('otp/send',{phone:'13800000009',purpose:'login'});
 const p=(await call('otp/verify',{phone:'13800000009',code:codes[0],purpose:'login'})).body.proof;
 assert.equal((await call('login/sms',{proof:p,accepted:true})).body.registrationRequired,true);
 const context=(await call('registration/context')).body;
 const input={proof:context.proof,name:'申请人',organization:'单位',requestedRole:'sales',accepted:true,identityMaterials:true};
 assert.equal((await call('register',input)).status,400);
 const pending=(await call('register',{...input,password:'RequiredPrivate2026'})).body;
 assert.equal(pending.user,null);assert.equal(pending.candidate.status,'pending');assert.equal(pending.candidate.hasPassword,true);
 assert.equal((await call('profile',{name:'绕过申请',email:''})).status,401);
 assert.equal((await call('session')).body.user,null);
})
