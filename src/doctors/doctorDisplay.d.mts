export type DoctorDisplay={id:string;salesId?:string|null;owner?:string|null;salesName?:string;updatedAt?:string;createdAt?:string;source?:string;submissionMode?:string;invitedBy?:string|null};
export type DoctorHistoryEvent={id:string;objectId?:string;target?:string;at:string;actor:string;title:string;reason?:string;note?:string;detail?:string;noteSource?:string;reviewNoteSource?:string};
export const doctorFields: [string,string][];
export function doctorSales(doctor:DoctorDisplay,people?:{id:string;name:string}[]):string;
export function doctorUpdated(doctor:DoctorDisplay,events?:DoctorHistoryEvent[]):string;
export function doctorHistory<T extends DoctorHistoryEvent>(events:T[],id:string):(T&{detail:string})[];
export function doctorSource(doctor:DoctorDisplay):string;
