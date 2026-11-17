import type { SalesData } from '../model';
import { visibleOrders } from '../model';
import { business } from './client';
export function syncOrders(data: SalesData) { return business('projection', { orders: visibleOrders(data).map(o => ({ ...o, ownerSalesId: o.ownerSalesId || data.ownerId, expectedRecipient: (()=>{const d=data.doctors.find(d=>d.id===o.doctorId&&d.owner===data.ownerId&&d.status==='审核通过'&&d.hospitalId===o.hospitalId);return d?{id:d.id,name:d.name}:null})(), hospital: data.hospitals.find(h => h.id === o.hospitalId)?.name, patientName: o.patientName || data.cases.find(c => c.id === o.caseId)?.patientName })) }); }
