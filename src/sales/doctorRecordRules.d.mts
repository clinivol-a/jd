import type {Doctor,Event,SalesData} from './model';
export function doctorSource(doctor:Partial<Doctor>):'销售建档'|'医生自主建档';
export const doctorEventTitles:Record<'submitted'|'approved'|'returned'|'resubmitted',string>;
export function doctorEvent(event:Event):{title:string;detail:string;noteSource:string};
export function migrateDoctorSources(data:SalesData):SalesData;
