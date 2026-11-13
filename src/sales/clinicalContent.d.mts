import type {Attachment} from './model';
export type ClinicalBlock = {id:string; type:'paragraph'|'ul'|'ol'; text:string; bold:boolean} | {id:string;type:'image'|'video';file:Attachment};
export type ClinicalContent = {version:1;blocks:ClinicalBlock[]};
export function clinicalContentError(content:unknown, owner?:string):string;
export function clinicalText(content?:ClinicalContent):string;
export function hasClinicalContent(content?:ClinicalContent):boolean;
