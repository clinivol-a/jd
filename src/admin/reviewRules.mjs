/** One application identity, independent of the entry point. No state changes here. */
export function pendingApprovals(data,permissions=['doctors:review','accounts:approve','permissions:grant']){
 return [...data.doctors.filter(d=>d.status==='待审核'&&permissions.includes('doctors:review')).map(d=>({id:'doctor:'+d.id,type:'医生档案',applicant:d.name,status:d.status,at:d.updatedAt||d.createdAt||'',kind:'doctor',row:d})),...data.approvals.filter(a=>a.status==='待审批'&&permissions.includes(a.type==='账号开通'?'accounts:approve':'permissions:grant')).map(a=>({id:'approval:'+a.id,type:a.type,applicant:a.applicant,status:a.status,at:a.at,kind:'approval',row:a}))].filter((r,i,rows)=>rows.findIndex(x=>x.id===r.id)===i).sort((a,b)=>(Date.parse(b.at)||0)-(Date.parse(a.at)||0)||a.id.localeCompare(b.id));
}
