import type { SalesData, Doctor } from './model';
export function completeDoctorFixtures(data:SalesData):SalesData;
export function doctorDraftDeleteError(data:SalesData,doctor:Doctor|undefined,actor:{id:string;permissions:string[]}):string;

export function ensureDoctorCreationEvents(data:SalesData):SalesData;
