// Isolated synthetic management records. Never a migration of sales or engineering storage.
export const stages = ['三维重建','CAD设计','有限元分析','3D打印'];
export const managementPermissions = ['orders:read','orders:review','tasks:assign','doctors:review','people:manage','accounts:approve','permissions:grant','assets:read','assets:export-metadata','audit:read','shares:manage'];
export function initialAdminState() {
 const hospitals = [
  {id:'ADM-H01',name:'江淮协同医院',region:'安徽',contact:'0551-****1001',departments:['口腔颌面外科','骨科'],leaderId:'ADM-L01',status:'已启用',version:1},
  {id:'ADM-H02',name:'皖中康复医院',region:'安徽',contact:'0551-****1002',departments:['康复医学科','骨科'],leaderId:'ADM-L02',status:'已启用',version:1},
  {id:'ADM-H03',name:'滨湖数字医学中心',region:'安徽',contact:'0551-****1003',departments:['整形外科'],leaderId:'ADM-L01',status:'已启用',version:1}
 ];
 const people = [
  {id:'ADM-L01',name:'赵启明',role:'业务组长',organization:'数字工程中心',status:'已启用',stages:[],permissions:['orders:read','orders:review','tasks:assign'],scope:['ADM-H01','ADM-H03'],version:1},
  {id:'ADM-L02',name:'许文清',role:'业务组长',organization:'数字工程中心',status:'已启用',stages:[],permissions:['orders:read','orders:review','tasks:assign'],scope:['ADM-H02'],version:1},
  {id:'chen-yu',name:'陈屿',role:'工程师',organization:'数字医学设计中心',status:'已启用',stages:[0,1],permissions:['projects:own'],scope:[],version:1},
  {id:'ADM-E02',name:'沈言',role:'工程师',organization:'数字医学设计中心',status:'已启用',stages:[2,3],permissions:['projects:own'],scope:[],version:1},
  {id:'li-ming',name:'李明',role:'销售',organization:'销售中心',status:'已启用',stages:[],permissions:['sales:landing'],scope:['ADM-H01','ADM-H02'],version:1},
  {id:'ADM-M01',name:'顾清和',role:'管理员',organization:'平台管理中心',status:'已启用',stages:[],permissions:['orders:read'],scope:['ADM-H01'],version:1}
 ];
 const doctors = [
  {id:'ADM-D01',name:'周明哲',hospitalId:'ADM-H01',department:'口腔颌面外科',title:'主任医师',phone:'199****1001',status:'待审核',source:'销售建档',submittedBy:'李明',salesId:'li-ming',invitedBy:null,materials:['ADM-F01','ADM-F02'],version:1},
  {id:'ADM-D02',name:'林致远',hospitalId:'ADM-H02',department:'骨科',title:'副主任医师',phone:'199****1002',status:'审核退回',source:'医生自主建档',submittedBy:'林致远',salesId:null,invitedBy:'li-ming',materials:['ADM-F03'],version:1},
  {id:'ADM-D03',name:'张予安',hospitalId:'ADM-H03',department:'整形外科',title:'主治医师',phone:'199****1003',status:'审核通过',source:'医生自主建档',submittedBy:'张予安',salesId:'li-ming',invitedBy:'li-ming',materials:['ADM-F04'],version:1}
 ];
 const orders = Array.from({length:18},(_,i)=>{
  const status=i<5?'待审核':i<14?'处理中':i<16?'已完成':'审核退回',hospital=hospitals[i%3];
  return {id:`ADM-O${String(i+1).padStart(3,'0')}`,name:['颌骨修复数字模型','下颌骨导板设计','骨科术前评估'][i%3],hospitalId:hospital.id,doctorId:doctors[i%3].id,salesId:'li-ming',leaderId:hospital.leaderId,status,requestedStages:i%4===0?[0,1,2,3]:i%2?[0]:[0,1],createdAt:`2026-11-${String(18-Math.floor(i/3)).padStart(2,'0')}T08:00:00+08:00`,requestedDueDate:`2026-11-${i===6?'18':'28'}`,confirmedDeliveryDate:['处理中','已完成'].includes(status)?`2026-11-${i===6?'18':'28'}`:null,clinicalRequirements:'完成术前结构评估与所申请的数字设计服务。',patientRef:`合成标识-${i+1}`,version:1};
 });
 const tasks=[];for(const order of orders.filter(o=>['处理中','已完成'].includes(o.status))){
  order.requestedStages.forEach((stage,index)=>tasks.push({id:`${order.id}-T${stage+1}`,orderId:order.id,stage,upstreamId:index?`${order.id}-T${order.requestedStages[index-1]+1}`:null,status:order.status==='已完成'?'已完成':index===0?(order.id==='ADM-O006'?'进行中':'未开始'):'未开始',assignee:order.status==='已完成'?(stage<2?'chen-yu':'ADM-E02'):order.id==='ADM-O006'&&index===0?'chen-yu':null,plannedDate:order.confirmedDeliveryDate,version:1}));
 }
 const submitted=tasks.find(t=>t.orderId==='ADM-O009'&&t.stage===0);if(submitted){submitted.status='待审核';submitted.assignee='chen-yu'}
 const assets=tasks.filter(t=>t.status==='已完成').map(t=>({id:`${t.id}-R1`,orderId:t.orderId,projectId:`${t.orderId}-P`,taskId:t.id,stage:t.stage,name:`${stages[t.stage]}成果`,version:'1',reviewStatus:'审核通过',publishStatus:'已发布',type:'成果元数据',source:'isolated-admin',sourceFileAvailable:false,revision:1}));
 if(submitted)assets.push({id:`${submitted.id}-R1`,orderId:submitted.orderId,projectId:`${submitted.orderId}-P`,taskId:submitted.id,stage:0,name:'三维重建成果',version:'1',reviewStatus:'待审核',publishStatus:'未发布',type:'成果元数据',source:'isolated-admin',sourceFileAvailable:false,revision:1});
 const approvals=[
  {id:'ADM-Q01',type:'权限变更',applicant:'赵启明',subjectId:'ADM-M01',subjectName:'顾清和',organization:'平台管理中心',requestedRole:'管理员',permissions:['doctors:review'],hospitalIds:['ADM-H01'],basis:'ADM-DEMO-WRITTEN-001',status:'待审批',at:'2026-11-18T10:00:00+08:00',version:1},
  {id:'ADM-Q02',type:'账号开通',applicant:'李明',subjectId:'ADM-STAFF01',subjectName:'许安宁',organization:'销售中心',requestedRole:'销售',permissions:['sales:landing'],hospitalIds:['ADM-H02'],basis:'',status:'待审批',at:'2026-11-18T09:30:00+08:00',version:1},
  {id:'ADM-Q03',type:'历史订单访问',applicant:'李明',subjectId:'li-ming',subjectName:'李明',organization:'销售中心',requestedRole:'销售',permissions:['orders:read'],hospitalIds:['ADM-H03'],basis:'ADM-DEMO-WRITTEN-003',status:'待审批',at:'2026-11-17T09:30:00+08:00',version:1},
  {id:'ADM-Q04',type:'医生销售归属变更',applicant:'李明',subjectId:'ADM-D02',subjectName:'林致远',newSalesId:'li-ming',permissions:[],hospitalIds:['ADM-H02'],basis:'ADM-DEMO-WRITTEN-004',status:'待审批',at:'2026-11-17T08:30:00+08:00',version:1}
 ];
 return {schema:1,source:'isolated-admin',hospitals,people,doctors,orders,tasks,assets,approvals,shares:[],events:[],doctorHistory:[
  {id:'ADM-SEED-D02',objectId:'ADM-D02',title:'医生档案审核退回',actor:'管理员',actorRole:'管理员',at:'2026-11-17T10:00:00+08:00',note:'请补充清晰的执业证明材料。',noteSource:'reviewer',source:'isolated-admin'},
  {id:'ADM-SEED-D03',objectId:'ADM-D03',title:'医生档案审核通过',actor:'管理员',actorRole:'管理员',at:'2026-11-17T09:00:00+08:00',note:'审核通过',noteSource:'system-default',source:'isolated-admin'}
 ],materials:[
  {id:'ADM-F01',doctorId:'ADM-D01',name:'身份证明.png',category:'身份证明',submittedBy:'李明',at:'2026-11-18T08:00:00+08:00'},
  {id:'ADM-F02',doctorId:'ADM-D01',name:'执业证明.png',category:'执业证明材料',submittedBy:'李明',at:'2026-11-18T08:00:00+08:00'},
  {id:'ADM-F03',doctorId:'ADM-D02',name:'执业证明.png',category:'执业证明材料',submittedBy:'林致远',at:'2026-11-17T08:00:00+08:00'},
  {id:'ADM-F04',doctorId:'ADM-D03',name:'执业证明.png',category:'执业证明材料',submittedBy:'张予安',at:'2026-11-17T08:00:00+08:00'}
 ]};
}
