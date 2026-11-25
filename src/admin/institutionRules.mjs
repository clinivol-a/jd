export const anhuiCities=['合肥','蚌埠','淮南','淮北','芜湖','安庆','滁州','阜阳','宿州','六安','亳州','池州','宣城','马鞍山','铜陵','黄山'];
export const coversRegion=(regions=[],region)=>regions.includes(region)||(regions.includes('安徽')&&anhuiCities.includes(String(region||'').replace(/市$/,'')));
export function hospitalMatches(hospital,{name='',region='',status=''}={}){
 return hospital.name.toLowerCase().includes(name.trim().toLowerCase())&&(!region||String(hospital.region||'').replace(/市$/,'')===region)&&(!status||hospital.status===status);
}
export const fixedColumn=(index,count)=>index===count-1?'right':index<3?'left':undefined;
