export const reviewState=value=>({'待审批':'待审核','审批通过':'审核通过','审批退回':'审核退回'})[value]||value;
export const isAccountApplication=a=>a?.type==='账号开通'||a?.type==='账号注册';
export const applicationName=a=>isAccountApplication(a)?'账号注册':a.type;
export const applicationRole=a=>a.requestedRoleName||({sales:'销售',designer:'三维重建设计师',doctor:'医生'})[a.requestedRole]||a.requestedRole||'—';
export const currentReviewApplication=a=>isAccountApplication(a)?a.source==='local-auth':a.type==='历史订单访问';
export const accountReviewFields=a=>[['申请事项','账号注册'],['申请人',a.applicant],['所属组织',a.organization],['申请岗位',applicationRole(a)],['审核状态',reviewState(a.status)],['申请时间',a.at]];
export const permissionReviewFields=a=>[['申请事项','历史订单访问'],['申请人',a.applicant],['被申请人',a.subjectName],['所属组织',a.organization],['申请岗位',applicationRole(a)],['审核状态',reviewState(a.status)],['申请时间',a.at]];
