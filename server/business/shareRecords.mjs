import {createHash,createHmac} from 'node:crypto';
const digest=value=>createHash('sha256').update(String(value)).digest('hex');
const fail=(message,status=403)=>{const e=Error(message);e.status=status;throw e};
const mask=phone=>String(phone).replace(/^(\d{3})\d{4}(\d{4})$/,'$1****$2');
const validId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{16,80}$/.test(value);
/** Durable, result-scoped events. Phone proof establishes phone possession, never patient identity. */
export class ShareRecords {
  constructor(service){this.service=service;const state=service.state;state.shareEvents??=[];state.shareVisits??={};state.shareProofs??={};}
  get state(){return this.service.state}
  at(){return this.service.now().toISOString()}
  id(share){return share.id||`legacy-${digest(share.token).slice(0,32)}`}
  enrich(share,user,order,artifact){
    share.id??=this.id(share);share.stageId??=artifact.taskId||artifact.id;share.initiatorId??=share.owner;
    share.initiatorName??=user.id===share.owner?user.name||'':'';
    share.recipientId??=order.expectedRecipient?.id||null;share.recipientName??=order.expectedRecipient?.name||'';
    return share;
  }
  owned(user,token){const share=this.state.shares[token];if(!share||share.owner!==this.service.sales(user).id)fail('无分享记录访问权限。');this.service.order(user,share.orderId);return share;}
  append(share,type,key,details={}){
    const id=`${this.id(share)}:${key}`;
    if(this.state.shareEvents.some(e=>e.id===id))return false;
    this.state.shareEvents.push({id,shareId:this.id(share),orderId:share.orderId,stageId:share.stageId||share.resultId,resultId:share.resultId,resultVersion:share.resultVersion,initiatorId:share.initiatorId||share.owner,type,at:this.at(),...details});return true;
  }
  events(share){return this.state.shareEvents.filter(e=>e.shareId===this.id(share))}
  summary(share){const events=this.events(share),viewed=events.filter(e=>e.type==='viewed');return{copyCount:events.filter(e=>e.type==='copy').length,accessCount:events.filter(e=>e.type==='open').length,successCount:viewed.length,uniqueViewerCount:new Set(viewed.map(e=>e.visitorId)).size,lastViewedAt:viewed.map(e=>e.at).sort((a,b)=>Date.parse(b)-Date.parse(a))[0]||null};}
  async copy(user,{token,eventId,kind}){const share=this.owned(user,token);if(share.revoked)fail('分享已撤销。');this.service.publicOrder(token);if(!validId(eventId)||!['link','image'].includes(kind))fail('复制事件无效。',400);this.append(share,'copy',`copy:${eventId}`,{kind,actorId:user.id,actorName:user.name||share.initiatorName||''});await this.service.persist(this.state);return{ok:true,stats:this.summary(share)};}
  records(user,{token,page=1,pageSize=10}){
    const share=this.owned(user,token),order=this.service.order(user,share.orderId),artifact=this.service.artifact(order,share.resultId,share.resultVersion),stats=this.summary(share);
    const size=Math.min(50,Math.max(1,Number(pageSize)||10)),rows=this.events(share).filter(e=>['viewed','verification-failed','access-denied'].includes(e.type)).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)||b.id.localeCompare(a.id)),current=Math.min(Math.max(1,Number(page)||1),Math.max(1,Math.ceil(rows.length/size)));
    return{share:{id:this.id(share),orderId:share.orderId,businessNo:order.businessNo||null,surgery:order.surgery||'',hospital:order.hospital||'',stage:artifact?.stage||'',stageId:share.stageId||artifact?.taskId||share.resultId,resultId:share.resultId,resultVersion:share.resultVersion,resultName:artifact?.name||'设计成果',initiatorId:share.initiatorId||share.owner,initiatorName:share.initiatorName||user.name||'',recipientId:share.recipientId||order.expectedRecipient?.id||null,recipientName:share.recipientName||order.expectedRecipient?.name||'',createdAt:share.createdAt,revoked:share.revoked},stats,total:rows.length,page:current,pageSize:size,rows:rows.slice((current-1)*size,current*size).map(({id,visitorId,visitorName,visitorRole,maskedPhone,at,outcome})=>({id,visitorId:visitorId||null,visitorName:visitorName||'未确认身份',visitorRole:visitorRole||'未确认',maskedPhone:maskedPhone||'',at,outcome}))};
  }
  async open(token,{visitId}){if(!validId(visitId))fail('访问会话无效。',400);const share=this.state.shares[token];if(!share)this.service.publicOrder(token);const key=`${this.id(share)}:${visitId}`;this.state.shareVisits[key]??={shareId:this.id(share),visitId,createdAt:this.at()};this.append(share,'open',`open:${visitId}`);try{this.service.publicOrder(token)}catch(e){this.append(share,'access-denied',`denied:${visitId}`,{outcome:'无访问权限'});await this.service.persist(this.state);throw e}await this.service.persist(this.state);return{ok:true};}
  identity(order,phone){
    const known=order.authorizedViewers?.find(v=>v.phone===phone&&v.id&&v.name&&['医生','患者','其他授权人员'].includes(v.role));
    return{visitorId:known?.id||`phone-${createHmac('sha256',this.service.key).update(phone).digest('hex').slice(0,32)}`,visitorName:known?.name||mask(phone),visitorRole:known?.role||'获授权人员',maskedPhone:mask(phone)};
  }
  async failed(token,visitId,phone,code,authorizedPhone=false){
    if(!validId(visitId))return;const share=this.state.shares[token];if(!share)return;
    const identity=authorizedPhone?{visitorId:`phone-${createHmac('sha256',this.service.key).update(phone).digest('hex').slice(0,32)}`,visitorName:mask(phone),visitorRole:'未获访问授权',maskedPhone:mask(phone)}:{};
    this.append(share,authorizedPhone?'access-denied':'verification-failed',`attempt:${visitId}:${createHmac('sha256',this.service.key).update(phone+':'+code).digest('hex').slice(0,24)}`,{...identity,outcome:authorizedPhone?'无访问权限':'验证失败'});await this.service.persist(this.state);
  }
  requireVisit(token,visitId){const share=this.state.shares[token];this.service.publicOrder(token);if(!validId(visitId)||!this.state.shareVisits[`${this.id(share)}:${visitId}`])fail('请重新打开分享页面。',400);}
  verified(token,visitId,phone,proof){
    if(!validId(visitId))return;const share=this.state.shares[token],order=this.service.publicOrder(token);
    const visit=this.state.shareVisits[`${this.id(share)}:${visitId}`];if(!visit)fail('请重新打开分享页面。',400);
    this.state.shareProofs[digest(proof)]={shareId:this.id(share),visitId,identity:this.identity(order,phone),image:false,model:false};
  }
  delivered(token,proof,kind){const record=this.state.shareProofs[digest(proof)];if(record?.shareId===this.id(this.state.shares[token]))record[kind]=true;}
  async viewed(token,{visitId,proof}){
    const order=this.service.publicOrder(token),share=this.state.shares[token],p=this.service.proofs.check('share:'+token,proof,+this.service.now());
    if(!order.allowedPhones.includes(p.phone))fail('无成果访问权限。');
    const record=this.state.shareProofs[digest(proof)],artifact=this.service.artifact(order,share.resultId,share.resultVersion);
    if(!validId(visitId)||!record||record.shareId!==this.id(share)||record.visitId!==visitId||!record.image||artifact.kind==='model'&&!record.model)fail('成果尚未成功加载。',409);
    const added=this.append(share,'viewed',`viewed:${visitId}`,{...record.identity,outcome:'查看成功'});
    if(added)this.service.audit({id:record.identity.visitorId},'share-viewed',share.resultId);
    await this.service.persist(this.state);return{ok:true};
  }
}
