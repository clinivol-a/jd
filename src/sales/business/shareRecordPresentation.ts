/** Sales presentation only; detailed event reasons stay in the server audit. */
export function presentShareVisitor(row:{visitorId:string|null;visitorName:string;visitorRole:string}){
  const confirmed=!!row.visitorId&&['医生','患者'].includes(row.visitorRole)&&!!row.visitorName&&!/模拟|测试|演示|访客|未确认|\*|^\d+$/.test(row.visitorName);
  return {name:confirmed?row.visitorName:'未确认身份',role:confirmed?row.visitorRole:'未确认'};
}
export const presentShareOutcome=(outcome:string)=>outcome==='查看成功'?'查看成功':'未通过验证';
