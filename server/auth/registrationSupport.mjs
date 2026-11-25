import {AuthFailure,random,hash} from './service.mjs'
import {OrganizationDirectory} from './organizationDirectory.mjs'
import {installRegistrationRevision} from './registrationRevision.mjs'
// Isolated directory only. Production must supply an administrator-owned organization service.
export function installRegistrationSupport(s){
 s.riskPermits=new Map();s.challenges=new Map();s.phoneSendAttempts=new Map()
 s.organizationDirectory=new OrganizationDirectory({directory:s.directory,now:()=>s.now()})
 s.organizations=function(){this.assertEnabled();if(this.mode!=='local')throw new AuthFailure('组织目录暂不可用。',503);return {source:'isolated-organizations',items:this.organizationDirectory.options()}}
 s.requestOrganization=function(d,input){this.assertEnabled();return this.organizationDirectory.request(d,input)}
 installRegistrationRevision(s)
 s.issueRiskPermit=function(d,phone,purpose){const token=random();this.riskPermits.set(hash(token),{device:d.id,phone,purpose,expires:this.now()+90000});return {required:false,permit:token}}
 s.riskStart=function(d,{phone,purpose}){this.assertEnabled();if(!/^1[3-9]\d{9}$/.test(phone)||!['login','register','reset','set-password','bind','phone','unlock'].includes(purpose))throw new AuthFailure('请检查手机号及验证用途。');if(!this.demoMode)throw new AuthFailure('安全验证服务尚未配置。',503);const previous=this.phoneSendAttempts.get(phone)||[];if(!d.forceChallenge&&previous.filter(t=>t>this.now()-3600000).length<2)return this.issueRiskPermit(d,phone,purpose);const a=2+Math.floor(Math.random()*18),b=2+Math.floor(Math.random()*18),id=random();this.challenges.set(id,{device:d.id,phone,purpose,answer:String(a+b),expires:this.now()+90000,attempts:0});return {required:true,id,prompt:`${a} + ${b} = ?`,expiresAt:this.now()+90000,source:'isolated-demo'}}
 s.riskVerify=function(d,{id,answer}){this.assertDemo();const c=this.challenges.get(id);if(!c||c.device!==d.id||c.expires<=this.now()||c.attempts>=3)throw new AuthFailure('安全验证已失效，请重新获取。');c.attempts++;if(String(answer).trim()!==c.answer)throw new AuthFailure('验证未通过，请重新填写。');this.challenges.delete(id);return this.issueRiskPermit(d,c.phone,c.purpose)}
 s.takeRiskPermit=function(d,phone,purpose,token){if(!this.riskEnforced)return;const key=hash(token||''),p=this.riskPermits.get(key);if(!p||p.device!==d.id||p.phone!==phone||p.purpose!==purpose||p.expires<=this.now())throw new AuthFailure('请先完成安全验证。',403);this.riskPermits.delete(key)}
 s.testRisk=function(d,{required}){this.assertTestConsole();d.forceChallenge=!!required;return {required:d.forceChallenge}}
}
