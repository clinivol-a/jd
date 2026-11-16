import type { SalesData } from '../model';
import { visibleOrders } from '../model';
import { business } from './client';
export function syncOrders(data: SalesData) { return business('projection', { orders: visibleOrders(data).map(o => ({ ...o, ownerSalesId: o.ownerSalesId || data.ownerId, hospital: data.hospitals.find(h => h.id === o.hospitalId)?.name, patientName: o.patientName || data.cases.find(c => c.id === o.caseId)?.patientName })) }); }
