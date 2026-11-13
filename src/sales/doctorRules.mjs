export function doctorErrors(d,review=true){
 const e={};if(!d.name.trim())e.name='请填写真实姓名';if(d.phone&&!/^1[3-9]\d{9}$/.test(d.phone))e.phone='请输入有效手机号';
 if(review){if(!d.phone)e.phone='请填写联系手机号';for(const [key,label] of [['hospitalId','所属医院'],['department','所属科室'],['title','职称'],['certificate','执业证书编号']])if(!String(d[key]||'').trim())e[key]='请填写'+label;
 if(!d.materials.some(f=>f.category==='identity'))e.identity='请上传身份证明照片';if(!d.materials.some(f=>f.category==='practice'||!f.category))e.practice='请上传执业证明材料';}return e;
}
