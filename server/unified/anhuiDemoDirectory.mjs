// Verified public hospital names for isolated design fixtures only. IDs and business links never change.
export const hospitalFixtures={
 'H-A':{contact:'0551-62922800',contactSource:'https://www.ayfy.com/cydh.htm',old:'江淮协同医院',name:'安徽医科大学第一附属医院',region:'合肥',url:'https://www.ahmu.edu.cn/4355/list.htm'},
 'H-B':{contact:'0551-63869630',contactSource:'https://www.nhc.gov.cn/fys/c100077/202201/eaaa3bbfbf4c44a18c96c34cd54c529f/files/1732845365025_98472.pdf',old:'皖中康复医院',name:'安徽医科大学第二附属医院',region:'合肥',url:'https://www.ahmu.edu.cn/4355/list.htm'},
 'H-C':{contact:'0551-62283114',contactSource:'https://csp.ncmi.cn/UsersInfo/UserUnit/UserUnitDetailWeb?uid=00540',old:'新安数字医学中心',name:'中国科学技术大学附属第一医院（安徽省立医院）',region:'合肥',url:'https://www.ahslyy.com.cn/'},
 'ADM-H01':{contact:'0551-62181616',contactSource:'https://www.hfyy.cn/col204/list',old:'江淮协同医院',name:'合肥市第一人民医院',region:'合肥',url:'https://www.hfyy.cn/'},
 'ADM-H02':{contact:'0551-62203666',contactSource:'https://s.dayi.org.cn/mip/s/hospital/1058.html',old:'皖中康复医院',name:'合肥市第二人民医院',region:'合肥',url:'https://www.ahmu.edu.cn/fzsfsyy/list.htm'},
 'ADM-H03':{contact:'0552-3086120',contactSource:'https://www.byyfy.net/col6/index',old:'滨湖数字医学中心',name:'蚌埠医科大学第一附属医院',region:'蚌埠',url:'https://www.byyfy.net/col1/index'},
 'H-79c3c14b-2347-4484-a339-e7d618f959d2':{contact:'0564-3950120',contactSource:'https://s.dayi.org.cn/mip/s/hospital/2291.html',old:'徽州协同医学中心',name:'六安市人民医院',region:'六安',url:'https://www.luan.gov.cn/mslyfw/ylws/yljg/ddyljg/10185375.html'}
};
export const organizationFixtures={
 'org-ahmu':{old:['安徽医科大学'],name:'安徽省第二人民医院',url:'https://www.ahsph.cn/'},
 'demo-hospital-01':{old:['安徽医科大学第一附属医院'],name:'安徽省儿童医院',url:'https://www.ahetyy.com/'},
 'demo-hospital-02':{old:['安徽省立医院'],name:'安徽中医药大学第一附属医院',url:'https://www.azyfy.com/'},
 'demo-hospital-03':{old:['中国科学技术大学附属第一医院'],name:'安庆市立医院',url:'https://www.aqslyy.com.cn/'},
 'demo-hospital-04':{old:['合肥市第一人民医院'],name:'阜阳市人民医院',url:'https://www.fysyy.com/'},
 'ORG-344cbbdc-3758-4a14-9f5a-650022c732ea':{old:['江淮医工协作中心'],name:'淮南市第一人民医院',url:'https://wjw.huainan.gov.cn/ztwz/hnsjbyfkzzx/tzgg/551867800.html'},
 'ORG-32a33aae-873a-4985-a218-6e80228ed256':{old:['新安医学工程研究中心'],name:'合肥市第三人民医院',url:'https://www.hf.cas.cn/rjc/rsgl/ybsb/rszc/202207/W020220705333822718170.pdf'},
 'org-huainan':{old:[],name:'淮南市第一人民医院',url:'https://wjw.huainan.gov.cn/ztwz/hnsjbyfkzzx/tzgg/551867800.html'},
 'org-hefei-third':{old:[],name:'合肥市第三人民医院',url:'https://www.hf.cas.cn/rjc/rsgl/ybsb/rszc/202207/W020220705333822718170.pdf'},
 'org-chuzhou':{old:[],name:'滁州市第一人民医院',url:'https://www.nhc.gov.cn/fys/c100077/202201/eaaa3bbfbf4c44a18c96c34cd54c529f/files/1732845365025_98472.pdf'}
};
const legacyOrgAliases={'org-huainan':'ORG-344cbbdc-3758-4a14-9f5a-650022c732ea','org-hefei-third':'ORG-32a33aae-873a-4985-a218-6e80228ed256'};
export const companyMembers=new Set(['ADM-L01','ADM-L02','chen-yu','ADM-E02','li-ming','ADM-M01','super-admin']);
export function initialOrganizations(){return [['demo-clinivol','科立沃','内部组织'],...Object.entries(organizationFixtures).filter(([id])=>!id.startsWith('ORG-')).map(([id,r])=>[id,r.name,'外部机构'])].map(([id,name,kind])=>({id,name,kind,status:'已启用',allowRegistration:true,version:1,source:'isolated-demo'}))}
export function migrateAnhuiDemo(auth,adminState,institutions){
 if(auth?.mode!=='local'||!auth.demoMode||institutions.state.source!=='isolated-institution-directory')return;
 institutions.transaction(()=>{
  const changes=[];
  for(const h of institutions.state.hospitals){
   const spec=hospitalFixtures[h.id];
   // Only explicit, unchanged design fixtures are migrated. A later user edit wins.
   if(!spec||h.name!==spec.old)continue;
   const before={name:h.name,region:h.region,contact:h.contact};
   Object.assign(h,{name:spec.name,region:spec.region,contact:spec.contact,version:(h.version||1)+1});
   changes.push({id:h.id,before,after:{name:h.name,region:h.region,contact:h.contact},nameSource:spec.url,contactSource:spec.contactSource});
  }
  if(changes.length){institutions.state.catalogMigrations||=[];institutions.state.catalogMigrations.push({id:'anhui-hospitals-20261126',source:'isolated-demo',changes})}
 });
 const orgs=auth.organizationDirectory;orgs.reload();let changed=false;const changes=[];
 for(const o of orgs.state.items){const spec=organizationFixtures[o.id];if(!spec||!spec.old.includes(o.name))continue;changes.push({id:o.id,before:o.name,after:spec.name});o.name=spec.name;o.version++;changed=true}
 for(const id of ['demo-clinivol','org-huainan','org-hefei-third','org-chuzhou'])if(!orgs.state.items.some(o=>o.id===id||o.id===legacyOrgAliases[id])){orgs.state.items.push({id,name:id==='demo-clinivol'?'科立沃':organizationFixtures[id].name,kind:id==='demo-clinivol'?'内部组织':'外部机构',status:'已启用',allowRegistration:true,version:1,source:'isolated-demo'});changed=true}
 if(changes.length){orgs.state.catalogMigrations||=[];orgs.state.catalogMigrations.push({id:'anhui-organizations-20261126',source:'isolated-demo',changes})}if(changed)orgs.persist();
 for(const p of adminState.people)if(companyMembers.has(p.id)&&!p.organizationId){p.organizationId='demo-clinivol';p.organization='科立沃'}
}
