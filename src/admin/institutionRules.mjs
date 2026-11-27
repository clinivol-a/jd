export const anhuiCities=['合肥','蚌埠','淮南','淮北','芜湖','安庆','滁州','阜阳','宿州','六安','亳州','池州','宣城','马鞍山','铜陵','黄山'];
export const coversRegion=(regions=[],region)=>{
 const city=String(region||'').replace(/市$/,'');
 return !!city&&(regions.some(r=>String(r).replace(/市$/,'')===city)||(regions.includes('安徽')&&anhuiCities.includes(city)));
};
export function eligibleHospitalLeaders(people,hospital={}){
 return people.filter(p=>p.role==='业务组长'&&p.status==='已启用'&&['orders:read','orders:review','tasks:assign'].every(permission=>p.permissions?.includes(permission))&&(Array.isArray(p.regions)?coversRegion(p.regions,hospital.region):hospital.id&&(p.scope?.includes(hospital.id)||p.id===hospital.leaderId)));
}
export const eligibleHospitalSales=people=>people.filter(p=>p.role==='销售'&&p.status==='已启用');
export function hospitalMatches(hospital,{name='',region='',status=''}={}){
 return hospital.name.toLowerCase().includes(name.trim().toLowerCase())&&(!region||String(hospital.region||'').replace(/市$/,'')===region)&&(!status||hospital.status===status);
}
export const fixedColumn=(index,count)=>index===count-1?'right':index<3?'left':undefined;
export function memberMatches(member,{name='',role='',organizationId='',status=''}={}){
 return member.name.toLowerCase().includes(name.trim().toLowerCase())&&(!role||member.role===role)&&(!organizationId||member.organizationId===organizationId)&&(!status||member.status===status);
}
export function roleMatches(role,{name='',status=''}={}){
 return role.name.toLowerCase().includes(name.trim().toLowerCase())&&(!status||role.status===status);
}
