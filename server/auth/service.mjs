import { randomBytes, createHash, scryptSync, timingSafeEqual } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs'
import { join } from 'node:path'
const random = () => randomBytes(32).toString('base64url')
const hash = value => createHash('sha256').update(value).digest('hex')
const passwordOK = value => typeof value === 'string' && value.length >= 8 && value.length <= 64 && /[A-Za-z]/.test(value) && /\d/.test(value)
const phoneOK = value => /^1[3-9]\d{9}$/.test(value)
const equal = (a,b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a),Buffer.from(b))
export class AuthFailure extends Error { constructor(message,status=400) {super(message);this.status=status} }
export class AuthService {
 constructor({directory,mode='disabled',smsProvider,now=Date.now,publicOrigin='',scanTTL=120000}={}) {
  if(!['local','disabled'].includes(mode))throw new Error('This adapter only supports isolated local testing; configure a production identity provider separately.');
  this.directory=directory;this.mode=mode;this.smsProvider=smsProvider;this.now=now;this.publicOrigin=publicOrigin;this.scanTTL=scanTTL
  this.devices=new Map();this.scans=new Map();this.codes=new Map();this.proofs=new Map();this.oauthStates=new Map();this.attempts=new Map();this.audit=[]
  this.accounts=[]
  if(directory&&existsSync(join(directory,'audit.json')))this.audit=JSON.parse(readFileSync(join(directory,'audit.json'),'utf8'))
  if(directory){mkdirSync(directory,{recursive:true,mode:0o700});const f=join(directory,'accounts.json');if(existsSync(f))this.accounts=JSON.parse(readFileSync(f,'utf8'))}
 }
 assertEnabled(){if(this.mode==='disabled')throw new AuthFailure('认证服务尚未配置，请联系管理员。',503)}
 persist(){if(!this.directory)return;const f=join(this.directory,'accounts.json');writeFileSync(f+'.tmp',JSON.stringify(this.accounts),{mode:0o600});renameSync(f+'.tmp',f)}
 record(type,accountId,detail={}){this.audit.push({id:random(),type,accountId,at:this.now(),...detail});if(this.directory)writeFileSync(join(this.directory,'audit.json'),JSON.stringify(this.audit.slice(-2000)),{mode:0o600})}
 setPassword(account,password){if(!passwordOK(password))throw new AuthFailure('密码须为8–64位，包含字母和数字。');account.salt=random();account.passwordHash=scryptSync(password,account.salt,32).toString('hex')}
 verifyPassword(account,password){if(!account?.passwordHash)return false;return equal(scryptSync(String(password).slice(0,128),account.salt,32).toString('hex'),account.passwordHash)}
 seedLocal(){if(this.mode!=='local')throw new AuthFailure('仅隔离测试模式可初始化账号。',403);if(this.accounts.length)return
  const passwords={};for(const [id,name,phone,role,avatar] of [['chen-yu','陈屿','13800000001','designer','/assets/avatar-chen-yu.png'],['li-ming','李明','13800000002','sales','/account-auth/avatars/portrait-01.jpg']]){
   const password=randomBytes(14).toString('base64url')+'8a';passwords[phone]=password
   const a={id,name,phone,role,requestedRole:role,status:'approved',avatar,email:'',employeeId:id==='chen-yu'?'CV-DS-028':'CV-002',department:id==='chen-yu'?'数字医学设计中心':'销售',permissions:role==='designer'?['projects:own','reconstruction','cad']:['sales:landing'],wechatId:null};this.setPassword(a,password);this.accounts.push(a)
  }this.persist();if(this.directory)writeFileSync(join(this.directory,'test-credentials.json'),JSON.stringify(passwords,null,2),{mode:0o600})
 }
 publicAccount(a){if(!a)return null;const {passwordHash,salt,wechatId,...publicData}=a;return {...publicData,phone:a.phone.replace(/(\d{3})\d{4}(\d{4})/,'$1****$2'),hasPassword:!!passwordHash,wechatBound:!!wechatId}}
 device(token){const key=hash(token||'');let d=this.devices.get(key);if(!d){d={id:key,sessions:{},activeId:null,candidateId:null,locked:{}};this.devices.set(key,d)}return d}
 live(d,id=d.activeId){const a=this.accounts.find(a=>a.id===id);return a&&a.status==='approved'&&a.role&&d.sessions[id]>this.now()?a:null}
 require(d,allowLocked=false){this.assertEnabled();const a=this.live(d);if(!a)throw new AuthFailure('会话已失效，请重新登录。',401);if(d.locked[a.id]&&!allowLocked)throw new AuthFailure('请先解锁当前账号。',423);return a}
 session(d){const a=this.live(d);return {user:this.publicAccount(a),candidate:this.publicAccount(this.accounts.find(a=>a.id===d.candidateId)),accounts:this.accounts.filter(a=>this.live(d,a.id)).map(a=>this.publicAccount(a)),locked:!!(a&&d.locked[a.id]),capabilities:{wechat:!!this.wechatReady,sms:!!this.smsProvider,scan:true,mode:this.mode}}}
 login(d,a){if(!a)throw new AuthFailure('手机号或密码不正确。',401);d.activeId=null;d.candidateId=a.id;d.candidateExpires=this.now()+300000;if(a.status==='approved'&&a.role){d.sessions[a.id]=this.now()+8*3600000;d.activeId=a.id;d.candidateId=null}this.record('login',a.id);return this.session(d)}
 passwordLogin(d,{phone,password,accepted}){this.assertEnabled();if(!accepted)throw new AuthFailure('请先阅读并同意服务协议和隐私声明。');const a=this.accounts.find(a=>a.phone===phone);if(!this.verifyPassword(a,password))throw new AuthFailure('手机号或密码不正确。',401);return this.login(d,a)}
 switch(d,id){this.require(d);if(!this.live(d,id))throw new AuthFailure('请先添加并验证此账号的有效会话。',401);d.activeId=id;d.candidateId=null;return this.session(d)}
 logout(d){const id=d.activeId;if(id){delete d.sessions[id];this.record('logout',id)}d.activeId=null;d.candidateId=null;return this.session(d)}
 lock(d){const a=this.require(d);d.locked[a.id]=true;return this.session(d)}
 unlock(d,{password,proof}){const a=this.require(d,true);const p=proof?this.takeProof(d,proof,'unlock'):null;if(p?p.phone!==a.phone:!this.verifyPassword(a,password))throw new AuthFailure('身份验证失败，请重新输入。',401);d.locked[a.id]=false;return this.session(d)}
 async sendCode(d,{phone,purpose}){this.assertEnabled();if(!phoneOK(phone)||!['login','register','reset','set-password','bind','phone','unlock'].includes(purpose))throw new AuthFailure('请检查手机号及验证用途。');if(!this.smsProvider)throw new AuthFailure('短信服务暂不可用，请使用密码登录或联系管理员。',503)
  const key=d.id+':'+phone+':'+purpose;const previous=this.codes.get(key);if(previous&&previous.sentAt+60000>this.now())throw new AuthFailure('请60秒后重新获取验证码。',429)
  const code=String(100000+randomBytes(4).readUInt32BE()%900000);await this.smsProvider(phone,code,purpose);this.codes.set(key,{digest:hash(code),expires:this.now()+300000,sentAt:this.now(),attempts:0});return {retryAfter:60,delivery:this.mode==='local'?'test-outbox':'sms'}
 }
 verifyCode(d,{phone,code,purpose}){const key=d.id+':'+phone+':'+purpose,c=this.codes.get(key);if(!c||c.expires<this.now()||c.attempts>=5)throw new AuthFailure('验证码无效或已过期，请重新获取。');c.attempts++;if(!equal(c.digest,hash(String(code))))throw new AuthFailure('验证码不正确。');this.codes.delete(key);const token=random();this.proofs.set(hash(token),{device:d.id,phone,purpose,expires:this.now()+300000});return {proof:token}}
 takeProof(d,token,purpose){const key=hash(token||''),p=this.proofs.get(key);if(!p||p.device!==d.id||p.expires<this.now()||p.purpose!==purpose)throw new AuthFailure('请重新验证手机号。',401);this.proofs.delete(key);return p}
 smsLogin(d,{proof,accepted}){if(!accepted)throw new AuthFailure('请先阅读并同意服务协议和隐私声明。');const p=this.takeProof(d,proof,'login'),a=this.accounts.find(a=>a.phone===p.phone);if(!a)throw new AuthFailure('此手机号尚未注册，请先注册。',404);return this.login(d,a)}
 register(d,{proof,name,organization,requestedRole,accepted,identityMaterials,password}){if(!accepted)throw new AuthFailure('请先阅读并同意服务协议和隐私声明。');if(!name?.trim()||!organization?.trim()||!['designer','sales','doctor'].includes(requestedRole)||!identityMaterials)throw new AuthFailure('请完整填写资料并确认核验资料状态。');if(password&&!passwordOK(password))throw new AuthFailure('密码须为8–64位，包含字母和数字。');const p=this.takeProof(d,proof,'register');if(this.accounts.some(a=>a.phone===p.phone))throw new AuthFailure('该手机号已注册，请登录或找回密码。',409)
  const a={id:random(),phone:p.phone,name:name.trim().slice(0,30),department:organization.trim().slice(0,80),requestedRole,role:null,permissions:[],status:'pending',avatar:'',employeeId:'',email:'',wechatId:null,passwordHash:null,salt:null,identityCheck:'pending-provider',appliedAt:this.now()};if(password)this.setPassword(a,password);this.accounts.push(a);this.persist();this.record('registration',a.id);d.activeId=null;d.candidateId=a.id;return this.session(d)
 }
 resetPassword(d,{proof,password}){const p=this.takeProof(d,proof,'reset'),a=this.accounts.find(a=>a.phone===p.phone);if(!a)throw new AuthFailure('无法重设此账号，请核对手机号。');this.setPassword(a,password);for(const device of this.devices.values()){delete device.sessions[a.id];if(device.activeId===a.id)device.activeId=null}this.persist();this.record('password-reset',a.id);return {ok:true}}
 setAccountPassword(d,{proof,current,password}){const a=this.require(d);if(a.passwordHash){if(!this.verifyPassword(a,current))throw new AuthFailure('原密码不正确。',401)}else{const p=this.takeProof(d,proof,'set-password');if(p.phone!==a.phone)throw new AuthFailure('验证手机号不一致。',403)}this.setPassword(a,password);for(const device of this.devices.values()){delete device.sessions[a.id];if(device.activeId===a.id)device.activeId=null}this.persist();this.record('password-changed',a.id);return {ok:true}}
 continueStatus(d){const a=this.accounts.find(a=>a.id===d.candidateId&&d.candidateExpires>this.now());if(!a)throw new AuthFailure('请重新登录以核对账号状态。',401);return this.login(d,a)}
 profile(d,input){const a=this.require(d);if(!input.name?.trim()||input.name.length>30||input.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))throw new AuthFailure('请检查姓名和电子邮箱。');a.name=input.name.trim();a.email=input.email||'';if(input.avatar){if(!/^data:image\/(png|jpeg|webp);base64,/.test(input.avatar)||input.avatar.length>2800000)throw new AuthFailure('头像格式或大小不正确。');a.avatar=input.avatar}this.persist();this.record('profile-updated',a.id);return this.session(d)}
 createScan(d,{accepted,deviceLabel='电脑浏览器'}){this.assertEnabled();if(!accepted)throw new AuthFailure('请先阅读并同意服务协议和隐私声明。');for(const q of this.scans.values())if(q.owner===d.id&&!['consumed','cancelled','expired'].includes(q.status))q.status='cancelled'
  const token=random(),id=random();const q={id,tokenHash:hash(token),owner:d.id,expires:this.now()+this.scanTTL,status:'waiting',deviceLabel:String(deviceLabel).slice(0,80),claim:null,accountId:null};this.scans.set(id,q)
  return {id,expiresAt:q.expires,url:this.publicOrigin?`${this.publicOrigin}/#scan/${id}/${token}`:null,publicHTTPS:this.publicOrigin.startsWith('https://'),status:q.status}
 }
 scan(id,token){const q=this.scans.get(id);if(!q||!equal(q.tokenHash,hash(token||'')))throw new AuthFailure('二维码无效，请在电脑端刷新。',404);if(q.expires<=this.now()&&!['consumed','cancelled'].includes(q.status))q.status='expired';return q}
 inspectScan(d,{id,token}){const q=this.scan(id,token);if(q.owner===d.id)throw new AuthFailure('请使用另一台设备扫描二维码。');if(['expired','cancelled','consumed','confirmed'].includes(q.status))return {status:q.status,deviceLabel:q.deviceLabel,expiresAt:q.expires}
  if(q.claim&&q.claim!==d.id)throw new AuthFailure('该二维码已由另一设备打开，请在电脑端刷新。',409);q.claim=d.id;q.status='scanned';return {status:q.status,deviceLabel:q.deviceLabel,expiresAt:q.expires}
 }
 confirmScan(d,{id,token}){const q=this.scan(id,token),a=this.live(d)||this.accounts.find(a=>a.id===d.candidateId&&d.candidateExpires>this.now());if(!a)throw new AuthFailure('请先验证账号。',401);if(q.owner===d.id||q.claim!==d.id||q.status!=='scanned'||d.locked[a.id])throw new AuthFailure('无法确认此登录，请重新扫码并验证身份。',409);q.status='confirmed';q.accountId=a.id;this.record('scan-confirmed',a.id,{scanId:id});return {status:'confirmed'}}
 cancelScan(d,{id,token}){const q=this.scan(id,token);if(q.owner!==d.id&&q.claim!==d.id)throw new AuthFailure('无法取消此登录。',403);if(!['waiting','scanned'].includes(q.status))throw new AuthFailure('二维码已结束。',409);q.status='cancelled';return {status:q.status}}
 pollScan(d,id,consume=false){const q=this.scans.get(id);if(!q||q.owner!==d.id)throw new AuthFailure('无法访问此扫码会话。',403);if(q.expires<=this.now()&&!['cancelled','consumed'].includes(q.status))q.status='expired';if(consume){if(q.status!=='confirmed')throw new AuthFailure('扫码确认尚未完成或已失效。',409);const a=this.accounts.find(a=>a.id===q.accountId);q.status='consumed';return this.login(d,a)}return {status:q.status,expiresAt:q.expires}}
 bindWechat(d,identity,{proof,accepted}){if(!accepted)throw new AuthFailure('请先同意服务协议和隐私声明。');const p=this.takeProof(d,proof,'bind'),a=this.accounts.find(a=>a.phone===p.phone);if(!a)throw new AuthFailure('请先完成账号注册。',404);const conflict=this.accounts.find(a=>a.wechatId===identity);if(conflict&&conflict.id!==a.id||a.wechatId&&a.wechatId!==identity)throw new AuthFailure('微信绑定冲突，请到账号安全核对或联系管理员。',409);a.wechatId=identity;this.persist();this.record('wechat-bound',a.id);return this.login(d,a)}
 unbindWechat(d,{proof}){const a=this.require(d),p=this.takeProof(d,proof,'bind');if(p.phone!==a.phone)throw new AuthFailure('验证身份不一致。',403);if(!a.passwordHash&&!this.smsProvider)throw new AuthFailure('请先保留有效的其他登录方式。');a.wechatId=null;this.persist();this.record('wechat-unbound',a.id);return this.session(d)}
 changePhone(d,{oldProof,newProof}){const a=this.require(d),old=this.takeProof(d,oldProof,'bind'),next=this.takeProof(d,newProof,'phone');if(old.phone!==a.phone)throw new AuthFailure('原账号验证失败。',403);if(this.accounts.some(v=>v.phone===next.phone))throw new AuthFailure('无法使用此手机号，请更换或联系管理员。',409);a.phone=next.phone;this.persist();this.record('phone-changed',a.id);return this.session(d)}
}
export {random,hash,passwordOK}
