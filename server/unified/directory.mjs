import {accessRoles,isBusinessLeader,positionId} from '../../src/auth/memberAccess.mjs';
/** Explicit local-fixture IDs. No patient, doctor, project or account is joined by name. */
export function localBusinessDirectory(auth, adminState) {
    const sales = auth?.mode === 'local' && auth.demoMode ? auth.accounts.filter(a => a.role === 'sales' && a.status === 'approved') : [];
    const hospitals = [
        { id: 'H-A', name: '江淮协同医院', departments: ['口腔颌面外科', '骨科'], region:'安徽', leaderId: 'ADM-L01', status: '已启用', version: 1 },
        { id: 'H-B', name: '皖中康复医院', departments: ['康复医学科', '骨科'], region:'安徽', leaderId: 'ADM-L02', status: '已启用', version: 1 },
        { id: 'H-C', name: '新安数字医学中心', departments: ['口腔科', '神经外科'], region:'安徽', leaderId: 'ADM-L01', status: '已启用', version: 1 },
    ];
    const doctorSpecs = [['D-1', '林致远', 0], ['D-2', '周明哲', 1], ['D26-1', '顾明哲', 0], ['D26-5', '许承安', 1], ['D26-9', '周景宁', 2]];
    const fixtureSales=sales.find(a=>a.phone==='13800000002');
    const doctors = fixtureSales ? doctorSpecs.map(([id, name, index]) => ({ id, name, hospitalId: hospitals[index].id, department: hospitals[index].departments[0], salesId: fixtureSales.id, status: '审核通过',businessAccess:'hospital' })) : [];
    const live=auth?.mode==='local'&&auth.demoMode?auth.accounts.filter(a=>a.status==='approved'):[];
    const members=new Map(adminState.people.map(p=>[p.id,{...p}]));
    for(const a of live){const old=members.get(a.id)||{};members.set(a.id,{...old,id:a.id,name:a.name,role:a.role,status:'已启用',stages:old.stages||[],permissions:a.permissions,scope:old.scope||a.hospitalIds||[],version:old.version||1,...(a.positionId!==undefined?{positionId:a.positionId}:{}),...(a.accessRoles!==undefined?{accessRoles:a.accessRoles}:{}),...(sales.some(s=>s.id===a.id)&&!old.scope?{scope:hospitals.map(h=>h.id)}:{})})}
    const people=[...members.values()].map(p=>({...p,positionId:positionId(p),accessRoles:accessRoles(p),role:({designer:'工程师',sales:'销售',doctor:'医生'})[positionId(p)]||p.role}));
    // Original isolated fixture numbers, registered explicitly. Never infer a real order from a name.
    const legacyOrders = sales.flatMap(a => {
        const ids = [...Array.from({ length: 8 }, (_, i) => ({ id: `SO-2026-${String(i + 1).padStart(4, '0')}`, prefix: 'SO', index: i })), ...['SO-V23', 'SO-V28-1', 'SO-V28-2', 'SO-V28-3'].flatMap(prefix => Array.from({ length: 7 }, (_, i) => ({ id: `${prefix}-${String(i + 1).padStart(2, '0')}`, prefix, index: i })))];
        return ids.map(({ id, prefix, index }) => ({ id, businessNo: id, ownerSalesId: a.id, doctorId: index % 2 ? 'D-2' : 'D-1', hospitalId: index % 2 ? 'H-B' : 'H-A', demoScenario: prefix }));
    });
    return { hospitals:[...hospitals,...adminState.hospitals.filter(h=>!hospitals.some(row=>row.id===h.id)).map(h=>({...h,region:h.region||'安徽'}))], doctors, people, legacyOrders, engineers: people.filter(p => positionId(p)==='designer'), salesScopes: Object.fromEntries(sales.map(a => [a.id, fixtureSales?.id===a.id?hospitals.map(h => h.id):[...(a.hospitalIds||[])]])), reservedBusinessNumbers: [...adminState.orders.map(o => o.businessNo || o.id), ...legacyOrders.map(o => o.businessNo)] };
}
