import type {AdminState,Doctor,Approval} from './model';
export function pendingApprovals(data:Pick<AdminState,'doctors'|'approvals'>,permissions?:string[]):{id:string;type:string;applicant:string;status:string;at:string;kind:string;row:Doctor|Approval}[];
