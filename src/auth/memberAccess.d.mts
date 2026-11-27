export const NO_POSITION:'none';
export type AccessRole='leader'|'administrator';
export const memberRoles:{id:string;name:string}[];
export function accessRoles(person:{role?:string|null;accessRoles?:string[]}):AccessRole[];
export function isBusinessLeader(person:{role?:string|null;accessRoles?:string[]}):boolean;
export function isAdministrator(person:{role?:string|null;accessRoles?:string[]}):boolean;
export function positionId(person:{role?:string|null;roleKey?:string;positionId?:string|null}):string|null;
export function roleText(person:{role?:string|null;accessRoles?:string[]}):string;

export function hasManagementPermission(person:{role?:string|null;accessRoles?:string[];permissions?:string[]},permission:string):boolean;
