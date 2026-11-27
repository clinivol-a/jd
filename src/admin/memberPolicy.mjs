import {accessRoles,hasManagementPermission} from '../auth/memberAccess.mjs';

// A single management role never substitutes for a professional position or qualification.
export const memberPermissionCatalog=[
 {id:'orders:read',name:'订单管理',description:'查看授权范围内的订单列表、订单详情和任务进度，不包含订单审核或任务分配。'},
 {id:'orders:review',name:'订单审核',description:'由当前负责组长审核受理或退回待审核订单。'},
 {id:'tasks:assign',name:'任务分配',description:'由当前负责组长为已受理订单中尚未开始的专业任务分配或调整负责人、计划时间。'},
 {id:'accounts:approve',name:'账号注册审核'},
 {id:'doctors:review',name:'医生档案审核'},
 {id:'permissions:grant',name:'权限申请审核'},
 {id:'organizations:manage',name:'组织管理'},
 {id:'hospitals:manage',name:'医院管理'},
 {id:'roles:manage',name:'岗位管理'},
 {id:'people:manage',name:'成员管理'},
 {id:'assets:read',name:'专业成果查看'},
 {id:'shares:manage',name:'成果分享管理'},
 {id:'assets:export-metadata',name:'导出资产信息'},
 {id:'audit:read',name:'审计日志'}
];
export const managementPermissionNames=Object.fromEntries(memberPermissionCatalog.map(p=>[p.id,p.name]));
export const managementPermissionIds=memberPermissionCatalog.map(p=>p.id);
export const leaderPermissionIds=['orders:read','orders:review','tasks:assign','assets:read','shares:manage'];
export const leaderDefaultPermissions=['orders:read','orders:review','tasks:assign','assets:read'];
export function memberRole(person){const roles=accessRoles(person);return roles.includes('administrator')?'administrator':roles.includes('leader')?'leader':'employee'}
export function rolePermissions(role,current){
 if(role==='administrator')return [...managementPermissionIds];
 if(role==='employee')return [];
 const selected=[...new Set(['orders:read',...(current===undefined?leaderDefaultPermissions:current).filter(p=>leaderPermissionIds.includes(p))])];
 if(selected.includes('shares:manage')&&!selected.includes('assets:read'))selected.push('assets:read');
 return selected;
}
export function memberPolicyIssues(person){
 const role=memberRole(person),actual=managementPermissionIds.filter(id=>hasManagementPermission(person,id)),expected=rolePermissions(role,actual),issues=[];
 if(accessRoles(person).length>1)issues.push('现有记录包含多个管理角色');
 if(actual.length!==expected.length||actual.some(p=>!expected.includes(p)))issues.push('现有管理权限与角色规则不一致');
 if(role==='leader'&&!person.regions?.length)issues.push('尚未配置负责区域');
 if(role==='leader'&&actual.includes('shares:manage')&&!actual.includes('assets:read'))issues.push('成果分享管理缺少专业成果查看权限');
 return issues;
}
