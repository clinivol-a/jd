import{readFileSync,writeFileSync,mkdirSync,copyFileSync,mkdtempSync,rmSync}from'node:fs';
import{resolve,join}from'node:path';import{tmpdir}from'node:os';
import{UnifiedBusinessService}from'../server/unified/service.mjs';
import{localBusinessDirectory}from'../server/unified/directory.mjs';
import{buildLinkedDemo}from'../server/unified/linkedDemoMigration.mjs';
if(process.env.NODE_ENV==='production'||process.env.VERCEL||process.env.AUTH_PUBLIC_ORIGIN)throw Error('Local isolated data only');
const args=process.argv.slice(2),arg=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const root=process.cwd(),dir=resolve(arg('--directory','.local/unified-business')),inventory=JSON.parse(readFileSync(resolve(arg('--inventory','.local/migration-20261123/inventory-before.json')),'utf8'));
if(!dir.startsWith(resolve(root,'.local')+'/'))throw Error('Migration target must be private .local data');
const accounts=JSON.parse(readFileSync('.local/auth/accounts.json','utf8')),adminState=JSON.parse(readFileSync('.local/admin/state.json','utf8'));
const auth={mode:'local',demoMode:true,accounts},seller=accounts.find(a=>a.id===inventory.sales.ownerId&&a.role==='sales'&&a.status==='approved'),admin=accounts.find(a=>a.role==='super_admin'&&a.status==='approved');
if(!seller||!admin)throw Error('Existing authorized local accounts required');
const temp=mkdtempSync(join(tmpdir(),'cv-migrate-plan-')),apply=args.includes('--apply'),target=apply?dir:temp;
try{
 if(!apply)copyFileSync(join(dir,'state.json'),join(target,'state.json'));
 if(apply){const backup=resolve('.local/backups/before-number-migration-20261123/pre-apply-state.json');try{writeFileSync(backup,readFileSync(join(dir,'state.json')),{flag:'wx',mode:0o600})}catch(e){if(e.code!=='EEXIST')throw e}}
 const service=new UnifiedBusinessService({directory:target,directoryProvider:()=>localBusinessDirectory(auth,adminState)});
 const result=buildLinkedDemo(service,{inventory,seller,admin});
 const group=rows=>rows.reduce((d,r)=>(d[r.status]=(d[r.status]||0)+1,d),{});
 const designer=service.designerSnapshot(accounts.find(a=>a.id==='chen-yu'));
 const projects=[...new Set(designer.tasks.map(t=>t.projectId))].map(id=>{const t=designer.tasks.find(t=>t.projectId===id);return{id,orderId:t.orderId,businessNo:t.businessNo,status:t.projectStatus,taskIds:designer.tasks.filter(t=>t.projectId===id).map(t=>t.id)}});
 const report={applied:apply,result,counts:{salesOrders:service.salesSnapshot(seller).orders.length,designerProjects:projects.length,orderStatuses:group(service.state.orders),projectStatuses:group(projects)},orders:service.state.orders.map(o=>({id:o.id,businessNo:o.businessNo,status:o.status,projectId:o.projectId,legacyBusinessNo:o.legacyBusinessNo})),projects};
 mkdirSync('.local/migration-20261123',{recursive:true});writeFileSync(`.local/migration-20261123/${apply?'applied':'plan'}.json`,JSON.stringify(report,null,2),{mode:0o600});
 console.log(JSON.stringify({applied:apply,...report.counts,archivedOrders:result.archivedOrderIds.length,archivedProjects:result.archivedProjectIds.length}));
}finally{rmSync(temp,{recursive:true,force:true})}
