import type {SalesData,Order,Hospital} from './model';
export type BusinessItem={id:string;target:string;category:string;type:string;name:string;object:string;status:string;kind:string;at:string;route:string};
export function dashboardOrderBuckets(orders:Order[],now?:Date,events?:SalesData["events"]):Record<string,Order[]>;
export function salesBusiness(data:SalesData,orders:Order[]):{items:BusinessItem[];hospitals:(Hospital&{departmentCount:number;doctorCount:number;processingCount:number})[];hospitalCount:number;departmentCount:number;doctorCount:number;requiredCount:number};
