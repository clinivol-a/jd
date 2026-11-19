import {randomBytes} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {AuthFailure} from '../auth/service.mjs';
import {managementPermissions} from './seed.mjs';
const defaultProfile={name:'周景明',avatar:'/account-auth/avatars/portrait-06.jpg'};
export function seedSuperAdmin(service,{enabled=false,password}={}) {
 if(!enabled||service.mode!=='local'||!service.demoMode||process.env.NODE_ENV==='production'||service.publicOrigin)throw new AuthFailure('超级管理员初始化仅限明确启用的本地隔离环境。',403);
 const existing=service.accounts.filter(a=>a.role==='super_admin');
 const phone=service.accounts.find(a=>a.phone==='13800000003');
 if(existing.length>1||phone&&phone.role!=='super_admin'||existing.length&&existing[0].phone!=='13800000003')throw new AuthFailure('管理员初始化存在账号冲突，未修改任何账号。',409);
 if(existing.length){
  const account=existing[0];let updated=false;
  if(account.id==='super-admin'){
   if(account.name==='超级管理员'){account.name=defaultProfile.name;updated=true}
   if(!account.avatar){account.avatar=defaultProfile.avatar;updated=true}
  }
  if(updated)service.persist();
  return {created:false,accountId:account.id};
 }
 const generated=password||randomBytes(18).toString('base64url')+'9a';
 const account={id:'super-admin',...defaultProfile,phone:'13800000003',role:'super_admin',requestedRole:'super_admin',status:'approved',email:'',employeeId:'CV-ADM-001',department:'平台管理中心',permissions:[...managementPermissions],wechatId:null};
 service.setPassword(account,generated);service.accounts.push(account);service.persist();
 if(service.directory)writeFileSync(join(service.directory,'admin-credentials.json'),JSON.stringify({phone:account.phone,password:generated},null,2),{mode:0o600,flag:'wx'});
 service.record('admin-local-seeded',account.id,{source:'isolated-admin'});return {created:true,accountId:account.id};
}
