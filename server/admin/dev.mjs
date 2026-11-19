import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {existsSync,mkdirSync,copyFileSync,chmodSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {AuthService,random} from '../auth/service.mjs';
import {createAuthServer} from '../auth/http.mjs';
import {seedSuperAdmin} from './seedAccount.mjs';
import {AdminService} from './service.mjs';
import {adminHandler} from './http.mjs';
if(process.env.NODE_ENV==='production'||process.env.VERCEL||process.env.AUTH_PUBLIC_ORIGIN)throw new Error('Admin demo is local-only.');
const root=resolve(fileURLToPath(new URL('../..',import.meta.url))),directory=resolve(root,'.local/auth');
mkdirSync(directory,{recursive:true,mode:0o700});
// Explicit one-time private copy. Never reuse a live database directory from another server.
if(process.env.ADMIN_AUTH_IMPORT_DIR&&!existsSync(join(directory,'accounts.json'))){
 const source=resolve(process.env.ADMIN_AUTH_IMPORT_DIR);if(source===directory)throw new Error('Separate auth directory required');
 for(const name of ['accounts.json','audit.json'])if(existsSync(join(source,name))){copyFileSync(join(source,name),join(directory,name));chmodSync(join(directory,name),0o600)}
}
const auth=new AuthService({directory,mode:'local',demoMode:true,testConsole:true,smsProvider:async(phone,code,purpose)=>writeFileSync(join(directory,'sms-outbox.json'),JSON.stringify({phone,code,purpose,at:Date.now()}),{mode:0o600})});auth.seedLocal();seedSuperAdmin(auth,{enabled:true,password:process.env.ADMIN_DEMO_PASSWORD});
const origin='http://127.0.0.1:5230',admin=new AdminService({directory:resolve(root,'.local/admin'),authService:auth});
const devConsoleKey=random();writeFileSync(join(directory,'dev-console-key'),devConsoleKey,{mode:0o600});
const server=createAuthServer(auth,{origin,devConsoleKey,devConsoleOrigins:[origin,'http://localhost:5230'],adminHandler:adminHandler(auth,admin,{origin})});
server.listen(5231,'127.0.0.1',()=>console.log('V3.8 local auth/admin: 127.0.0.1:5231. Password file: .local/auth/admin-credentials.json (0600).'));
const vite=spawn(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1'],{cwd:root,env:{...process.env,CV_DEV_PORT:'5230',CV_AUTH_ORIGIN:'http://127.0.0.1:5231',CV_ADMIN_LOCAL:'1'},stdio:'inherit'});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{vite.kill(signal);server.close(()=>process.exit(0))});vite.on('exit',code=>server.close(()=>process.exit(code||0)));
