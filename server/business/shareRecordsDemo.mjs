/** User-requested synthetic records. Imported only by the local Vite plugin. */
export async function seedLocalShareRecords(service,user,token){
  if(process.env.NODE_ENV==='production'||!service.demoShareCodes||!user.demoBusiness)return;
  const records=service.shareRecords,share=records.owned(user,token);
  service.publicOrder(token);
  const prefix=`${records.id(share)}:local-mock-v1:`;
  if(service.state.shareEvents.some(e=>e.id.startsWith(prefix)))return;
  const base=+service.now();
  const rows=[
    {minutes:35,name:'模拟医生',role:'医生',visitor:'doctor',outcome:'查看成功'},
    {minutes:24,name:'模拟患者',role:'患者',visitor:'patient',outcome:'查看成功'},
    {minutes:16,name:'未确认身份',role:'未确认',outcome:'验证失败'},
    {minutes:9,name:'模拟访客',role:'未获访问授权',outcome:'无访问权限'},
    {minutes:3,name:'模拟医生',role:'医生',visitor:'doctor',outcome:'查看成功'},
  ];
  rows.forEach((row,i)=>{
    const common={shareId:records.id(share),orderId:share.orderId,stageId:share.stageId,resultId:share.resultId,resultVersion:share.resultVersion,initiatorId:share.initiatorId||share.owner,dataOrigin:'local-mock',at:new Date(base-row.minutes*60000).toISOString()};
    service.state.shareEvents.push({...common,id:prefix+i+':open',type:'open'});
    service.state.shareEvents.push({...common,id:prefix+i+':result',type:row.outcome==='查看成功'?'viewed':row.outcome==='验证失败'?'verification-failed':'access-denied',visitorId:row.visitor?prefix+row.visitor:null,visitorName:row.name,visitorRole:row.role,outcome:row.outcome});
  });
  await service.persist(service.state);
}
