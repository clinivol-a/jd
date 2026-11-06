import { createServer } from 'node:http'
import { readFileSync, existsSync, writeFileSync, statSync } from 'node:fs'
import { resolve, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AuthService, AuthFailure, random, hash } from './service.mjs'
export function createAuthServer(service,{origin='http://127.0.0.1:5210',dist=resolve('dist'),secure=origin.startsWith('https://'),devConsoleKey=''}={}){
 const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(v=>v.trim().split('=')))
 const allowed=new Set([origin,'http://127.0.0.1:5210','http://localhost:5210']);const limits=new Map()
 const server=createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()')
  try{
   const url=new URL(req.url,origin)
   if(!url.pathname.startsWith('/api/auth/')){
    const p=resolve(dist,'.'+decodeURIComponent(url.pathname));if(!p.startsWith(dist+'/')&&p!==dist)throw new AuthFailure('Not found',404)
    const f=existsSync(p)&&statSync(p).isFile()?p:join(dist,'index.html');if(!existsSync(f))throw new AuthFailure('请先构建前端资源。',503)
    const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.stl':'application/octet-stream'};res.setHeader('Content-Type',mime[extname(f)]||'application/octet-stream');res.end(readFileSync(f));return
   }
   res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8')
   const requestOrigin=req.headers.origin
   if(requestOrigin&&!allowed.has(requestOrigin))throw new AuthFailure('请求来源不允许。',403)
   if(req.headers['sec-fetch-site']==='cross-site')throw new AuthFailure('拒绝跨站请求。',403)
   if(req.method!=='GET'&&(!requestOrigin||!allowed.has(requestOrigin)||req.headers['x-clinivol-request']!=='1'))throw new AuthFailure('安全校验失败，请刷新页面。',403)
   let token=cookies(req).cv_auth_device;if(!token||!/^[A-Za-z0-9_-]{43}$/.test(token)){token=random();res.setHeader('Set-Cookie',`cv_auth_device=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${secure?'; Secure':''}`)}
   const d=service.device(token),action=url.pathname.slice('/api/auth/'.length)
   let body={};if(req.method==='POST'){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>3000000)throw new AuthFailure('请求内容过大。',413)}try{body=JSON.parse(raw||'{}')}catch{throw new AuthFailure('请求格式不正确。')}}
   const rateKey=(req.socket.remoteAddress||'')+':'+action;const previous=limits.get(rateKey)||[];const attempts=previous.filter(t=>t>Date.now()-60000);if(attempts.length>(['login/password','otp/send','otp/verify','scan/create'].includes(action)?15:100))throw new AuthFailure('操作过于频繁，请稍后重试。',429);attempts.push(Date.now());limits.set(rateKey,attempts)
   let result
   if(action.startsWith('dev/')){
    const localOrigin=/^http:\/\/(localhost|127\.0\.0\.1):5210$/.test(requestOrigin||'');const forwarded=req.headers['x-forwarded-host'];
    if(!devConsoleKey||!service.testConsole||process.env.NODE_ENV==='production'||req.headers['cf-connecting-ip']||req.headers.forwarded||req.headers['x-forwarded-proto']==='https'||!localOrigin||forwarded&&!/^(localhost|127\.0\.0\.1):5210$/.test(String(forwarded))||req.headers['x-clinivol-dev-console']!==devConsoleKey)throw new AuthFailure('接口不存在。',404)
    if(req.method!=='POST')throw new AuthFailure('请求方式不支持。',405)
    if(action==='dev/state')result=service.testState(d)
    else if(action==='dev/review')result=service.testReview(body)
    else if(action==='dev/reset-sales')result=service.resetSales(d)
    else if(action==='dev/reset')result=service.testReset()
    else throw new AuthFailure('接口不存在。',404)
    res.end(JSON.stringify(result));return
   }
   if(req.method==='GET'&&action==='demo-scan/registration')result=service.demoRegistration(d)
   else if(req.method==='GET'&&action==='session')result=service.session(d)
   else if(req.method==='GET'&&action==='scan/status')result=service.pollScan(d,url.searchParams.get('id'))
   else if(req.method==='POST'){
    switch(action){
     case 'status/continue':result=service.continueStatus(d);break
     case 'login/password':result=service.passwordLogin(d,body);break
     case 'login/sms':result=service.smsLogin(d,body);break
     case 'otp/send':result=await service.sendCode(d,body);break
     case 'otp/verify':result=service.verifyCode(d,body);break
     case 'register':result=service.register(d,body);break
     case 'password/reset':result=service.resetPassword(d,body);break
     case 'password/set':result=service.setAccountPassword(d,body);break
     case 'profile':result=service.profile(d,body);break
     case 'switch':result=service.switch(d,body.accountId);break
     case 'logout':result=service.logout(d);break
     case 'lock':result=service.lock(d);break
     case 'unlock':result=service.unlock(d,body);break
     case 'scan/create':result=service.createScan(d,body);break
     case 'scan/inspect':result=service.demoMode?service.demoInspect(d,body):service.inspectScan(d,body);break
     case 'scan/confirm':result=service.demoMode?service.demoConfirm(d,body):service.confirmScan(d,body);break
     case 'scan/cancel':result=service.cancelScan(d,body);break
     case 'scan/consume':result=service.demoMode?service.demoConsume(d,body.id):service.pollScan(d,body.id,true);break
     case 'demo-scan/resolve':result=service.demoResolve(d,body);break
     case 'demo-scan/bind':result=service.demoBind(d,body);break
     case 'wechat/start':throw new AuthFailure('微信官方登录尚未配置，请使用账号扫码确认或手机号登录。',503)
     case 'wechat/bind':throw new AuthFailure('微信授权身份尚未接入，不能建立未经验证的绑定。',503)
     case 'wechat/unbind':result=service.unbindWechat(d,body);break
     case 'phone/change':result=service.changePhone(d,body);break
     default:throw new AuthFailure('接口不存在。',404)
    }
   }else throw new AuthFailure('请求方式不支持。',405)
   res.end(JSON.stringify(result))
  }catch(error){res.statusCode=error instanceof AuthFailure?error.status:500;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify({error:error instanceof AuthFailure?error.message:'服务暂时不可用，请稍后重试。'}))}
 });return server
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const directory=resolve(process.env.AUTH_DATA_DIR||'.local/auth'),mode=process.env.AUTH_MODE||'disabled',origin=process.env.AUTH_PUBLIC_ORIGIN||'http://127.0.0.1:5210'
 const consoleEnabled=mode==='local'&&process.env.AUTH_DEV_CONSOLE==='1'&&!process.env.AUTH_PUBLIC_ORIGIN&&process.env.NODE_ENV!=='production'
 const service=new AuthService({directory,mode,testConsole:consoleEnabled,demoMode:process.env.AUTH_DEMO_MODE==='1'&&mode==='local'&&process.env.NODE_ENV!=='production',scanOrigin:process.env.AUTH_SCAN_ORIGIN||'',publicOrigin:process.env.AUTH_PUBLIC_ORIGIN||'',smsProvider:mode==='local'&&process.env.AUTH_TEST_SMS==='1'?async(phone,code,purpose)=>writeFileSync(join(directory,'sms-outbox.json'),JSON.stringify({phone,code,purpose,at:Date.now()}),{mode:0o600}):undefined})
 if(mode==='local')service.seedLocal()
 let devConsoleKey='';if(consoleEnabled){service.migrateTestScenario();devConsoleKey=random();writeFileSync(join(directory,'dev-console-key'),devConsoleKey,{mode:0o600})}
 if(service.demoMode&&process.env.AUTH_SCAN_ORIGIN){const lan=new URL(process.env.AUTH_SCAN_ORIGIN);if(!/^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(lan.hostname))throw new Error('LAN demo requires a private network address');createAuthServer(service,{origin:lan.origin,secure:false}).listen(Number(lan.port),lan.hostname,()=>console.log('Isolated LAN scan listener: '+lan.origin))}
 const port=Number(process.env.AUTH_PORT||5211);createAuthServer(service,{origin,devConsoleKey}).listen(port,'127.0.0.1',()=>console.log(`Auth server listening on 127.0.0.1:${port}; mode=${mode}. Local test credentials, when enabled: .local/auth/test-credentials.json`))
}
