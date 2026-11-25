import type {Approval} from './model';
export function reviewState(value:string):string;
export function isAccountApplication(a:Approval|null|undefined):boolean;
export function applicationName(a:Approval):string;
export function applicationRole(a:Approval):string;
export function currentReviewApplication(a:Approval):boolean;
export function accountReviewFields(a:Approval):[string,string|undefined][];
export function permissionReviewFields(a:Approval):[string,string|undefined][];
