import type {AdminState,Asset,AuditEvent} from './model';
export function businessLabel(value:unknown):string;
export function auditOrderId(event:AuditEvent,state:AdminState):string|null;
export function auditObjectName(event:AuditEvent,state:AdminState):string;
export type AssetFilters={query?:string;hospitalId?:string;stage?:string;status?:string;publishStatus?:string};
export function assetMatches(asset:Asset,state:AdminState,filters?:AssetFilters):boolean;
export type AuditFilters={query?:string;category?:string;result?:string;range?:string[]};
export function auditMatches(event:AuditEvent,state:AdminState,filters?:AuditFilters):boolean;
export function chronologicalRecords<T extends {id:string;at?:string;submittedAt?:string}>(rows:T[]):T[];
export function auditChanges(event:AuditEvent,state:AdminState):{id:string;label:string;before:string;after:string}[];
export function auditSafeValue(value:unknown):unknown;

export function assetFieldKeys(mode:string): string[];

export function dataAuditTheme(value:string): 'danger'|'warning'|'success'|'default';
